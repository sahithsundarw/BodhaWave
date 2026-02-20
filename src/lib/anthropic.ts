/**
 * AI backend — powered by Google Gemini.
 * All function signatures match the original Claude implementation so no
 * API route code needs to change.
 */
import {
  GoogleGenerativeAI,
  type Content,
  type Part,
} from "@google/generative-ai";

// --------------------------------------------------------------------------
// Client singleton
// --------------------------------------------------------------------------

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const key = process.env.GOOGLE_AI_API_KEY;
    if (!key) {
      throw new Error(
        "GOOGLE_AI_API_KEY is not set. Add it to .env.local and restart the server."
      );
    }
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

/** The primary model for all PDF analysis and generation. */
const PRIMARY_MODEL = "gemini-2.5-flash";

// --------------------------------------------------------------------------
// Core helpers
// --------------------------------------------------------------------------

/**
 * Send a PDF (as raw base64) plus a text prompt to Gemini and return the
 * model's text response. Equivalent to the old `analyzeWithPDF`.
 */
export async function analyzeWithPDF(
  pdfBase64: string,
  prompt: string,
  maxTokens = 8192
): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: PRIMARY_MODEL,
    generationConfig: {
      maxOutputTokens: maxTokens,
      // Lower temperature → more consistent JSON output
      temperature: 0.2,
    },
  });

  const parts: Part[] = [
    {
      inlineData: {
        data: pdfBase64,
        mimeType: "application/pdf",
      },
    },
    { text: prompt },
  ];

  const result = await model.generateContent(parts);
  return result.response.text();
}

/**
 * Send TWO PDFs to Gemini for side-by-side analysis (Paper Battle mode).
 * Equivalent to the old `analyzeWithTwoPDFs`.
 */
export async function analyzeWithTwoPDFs(
  pdf1Base64: string,
  pdf2Base64: string,
  prompt: string,
  maxTokens = 8192
): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: PRIMARY_MODEL,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.2,
    },
  });

  const parts: Part[] = [
    { text: "PAPER 1:" },
    { inlineData: { data: pdf1Base64, mimeType: "application/pdf" } },
    { text: "PAPER 2:" },
    { inlineData: { data: pdf2Base64, mimeType: "application/pdf" } },
    { text: prompt },
  ];

  const result = await model.generateContent(parts);
  return result.response.text();
}

/**
 * Multi-turn chat with a system instruction. Used by the Q&A companion.
 * Equivalent to the old `chatWithContext`.
 */
export async function chatWithContext(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  maxTokens = 1500
): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: PRIMARY_MODEL,
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
    // Gemini supports system instructions natively
    systemInstruction: systemPrompt,
  });

  // Gemini uses "model" for assistant turns; also needs at least one exchange
  // in history before the final message, so split the last message off.
  const history: Content[] = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });

  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessage(lastMessage.content);
  return result.response.text();
}

// --------------------------------------------------------------------------
// JSON response parser (unchanged — robust brace-matching parser)
// --------------------------------------------------------------------------

export function parseJSONResponse(text: string): unknown {
  // Strip markdown code fences
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  if (start === -1) {
    throw new Error(
      `No JSON object found. Response started with: "${cleaned.slice(0, 300)}"`
    );
  }

  // Brace-depth walk to find the true end of the outermost JSON object
  let depth = 0;
  let end = -1;
  let inString = false;
  let escape = false;

  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }

  // Truncated JSON repair (token limit safety net)
  if (end === -1) {
    const partial = cleaned.slice(start);
    let openBraces = 0, openBrackets = 0;
    let inStr = false, esc = false;
    for (const ch of partial) {
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === "{") openBraces++;
      else if (ch === "}") openBraces = Math.max(0, openBraces - 1);
      else if (ch === "[") openBrackets++;
      else if (ch === "]") openBrackets = Math.max(0, openBrackets - 1);
    }
    const repaired = partial + "]".repeat(openBrackets) + "}".repeat(openBraces);
    try { return JSON.parse(repaired); } catch {
      throw new Error("Response was cut off mid-JSON. Try again with a smaller PDF.");
    }
  }

  const jsonString = cleaned.slice(start, end + 1);

  // Pass 1 — parse as-is
  try { return JSON.parse(jsonString); } catch {
    // Pass 2 — strip trailing commas (occasional Gemini quirk)
    const fixed = jsonString.replace(/,(\s*[}\]])/g, "$1");
    try { return JSON.parse(fixed); } catch (finalErr) {
      throw new Error(
        `JSON parse failed: ${finalErr instanceof Error ? finalErr.message : "unknown"}. ` +
        `First 400 chars: ${jsonString.slice(0, 400)}`
      );
    }
  }
}
