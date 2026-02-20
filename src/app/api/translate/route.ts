import { NextRequest, NextResponse } from "next/server";
import { chatWithContext } from "@/lib/anthropic";

export const maxDuration = 60;

const LANGUAGE_CONFIG: Record<
  string,
  { name: string; tips: string }
> = {
  hi: {
    name: "Hinglish",
    tips: `WHAT IS HINGLISH:
Hinglish is natural code-switching between Hindi and English, written entirely in Roman script (Latin alphabet). It is how educated urban Indians actually speak in daily conversation — NOT formal Hindi, NOT fully English.

HINGLISH RULES:
- Write ONLY in Roman script. Zero Devanagari characters allowed.
- Blend Hindi grammar/structure with English nouns, verbs, and technical terms naturally.
- Use common Hindi conversational words: "yaar", "matlab", "suno", "dekho", "basically", "toh", "aur", "lekin", "kyunki", "isliye", "acha", "haan", "woh", "iska", "itna", "bilkul".
- English technical terms stay in English: "AI", "algorithm", "data", "research", "model", "neurons", "protein", etc.
- Proper nouns unchanged: Aarav, Dr. Meera Iyer, BodhaWave.

EXAMPLES of Hinglish style:
  English: "This research is groundbreaking because it changes how we understand the brain."
  Hinglish: "Yaar, yeh research bahut badi baat hai. Basically iska matlab hai ki hum brain ko ek naye angle se samajh sakte hain."

  English: "The implications for healthcare are profound."
  Hinglish: "Healthcare ke liye toh yeh game-changer hai, sach mein."`,
  },
  te: {
    name: "Tenglish",
    tips: `WHAT IS TENGLISH:
Tenglish is natural code-switching between Telugu and English, written entirely in Roman script (Latin alphabet). It is how educated Telugu speakers converse daily — NOT formal literary Telugu, NOT fully English.

TENGLISH RULES:
- Write ONLY in Roman script. Zero Telugu script characters allowed.
- Blend Telugu grammar/structure with English nouns, verbs, and technical terms naturally.
- Use common Telugu conversational words: "antey", "chuso", "adi", "ila", "kaabatti", "kani", "ayithe", "ento", "chala", "meeru", "mana", "inkaa", "okka", "anni", "ikkade".
- English technical terms stay in English: "AI", "algorithm", "data", "research", "model", "neurons", "protein", etc.
- Proper nouns unchanged: Aarav, Dr. Meera Iyer, BodhaWave.

EXAMPLES of Tenglish style:
  English: "This research is groundbreaking because it changes how we understand the brain."
  Tenglish: "Ee research chala important, chuso. Brain ni mana ee varaku artham chesukunnaa vidhaniki inkaa oka naya dimension vastondi."

  English: "The implications for healthcare are profound."
  Tenglish: "Healthcare meeda ee research ki chala bada impact untundi, seriously."`,
  },
};

export async function POST(req: NextRequest) {
  try {
    const { segments, targetLanguage } = (await req.json()) as {
      segments: Array<{ speaker: string; text: string; emotion: string }>;
      targetLanguage: string;
    };

    if (!segments?.length || !targetLanguage) {
      return NextResponse.json(
        { error: "Missing segments or targetLanguage" },
        { status: 400 }
      );
    }

    const config = LANGUAGE_CONFIG[targetLanguage];
    if (!config) {
      return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
    }

    const systemPrompt = `You are a localization expert specialising in podcast script adaptation for Text-to-Speech (TTS) synthesis.

Your task is to adapt English podcast segments into natural, fluid ${config.name} that sounds engaging and human when spoken aloud by an AI voice.

OUTPUT FORMAT (strictly enforced):
1. Return ONLY a valid JSON array — no markdown fences, no prose, no code blocks, no surrounding text.
2. Every object must have exactly three fields: "speaker", "text", "emotion". Do not add or remove fields.
3. Adapt ONLY the "text" field. Leave "speaker" and "emotion" values completely unchanged.
4. Write all adapted text exclusively in Roman script (Latin alphabet only). Do NOT use Devanagari, Telugu script, or any other native script characters anywhere in the output.

ADAPTATION GUIDELINES — this is localization, not literal translation:

SENTENCE STRUCTURE
- Break long English sentences into 2–3 shorter spoken sentences. Listeners cannot re-read; shorter sentences improve comprehension.
- Each sentence should express one clear idea. Avoid compound run-ons joined by many conjunctions.

RHYTHM & PAUSES
- Place commas at natural breath points to guide the TTS engine's pacing.
- End each complete thought with a full stop. Avoid trailing off without punctuation.

REGISTER & TONE
- Match the "emotion" field: enthusiastic segments should feel lively; analytical segments should feel measured and calm.
- Sound like a real podcast — energetic, engaging, and natural. Not academic, not stiff.

LANGUAGE-SPECIFIC GUIDANCE
${config.tips}`;

    const raw = await chatWithContext(
      systemPrompt,
      [{ role: "user", content: JSON.stringify(segments) }],
      8192
    );

    // Strip any accidental markdown fences the model may add
    const cleaned = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    let translated: unknown;
    try {
      translated = JSON.parse(cleaned);
    } catch {
      throw new Error(
        `Translation returned invalid JSON. First 300 chars: ${cleaned.slice(0, 300)}`
      );
    }

    return NextResponse.json({ segments: translated });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
