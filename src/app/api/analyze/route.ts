import { NextRequest, NextResponse } from "next/server";
import { analyzeWithPDF, parseJSONResponse } from "@/lib/anthropic";
import { buildAnalysisPrompt } from "@/lib/prompts";
import type { PaperAnalysis } from "@/types";

export const maxDuration = 120; // Allow up to 2 minutes for complex PDFs

export async function POST(req: NextRequest) {
  try {
    const { pdfBase64 } = await req.json();

    if (!pdfBase64) {
      return NextResponse.json({ error: "PDF data required" }, { status: 400 });
    }

    const prompt = buildAnalysisPrompt();
    // 8192 tokens prevents JSON truncation on complex papers
    const rawResponse = await analyzeWithPDF(pdfBase64, prompt, 8192);
    const analysis = parseJSONResponse(rawResponse) as PaperAnalysis;

    return NextResponse.json({ analysis });
  } catch (error) {
    // Return the ACTUAL error so the UI can show what went wrong
    const message = error instanceof Error ? error.message : String(error);
    console.error("Analysis error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
