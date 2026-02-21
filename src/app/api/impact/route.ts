import { NextRequest, NextResponse } from "next/server";
import { analyzeWithPDF, parseJSONResponse } from "@/lib/anthropic";
import { buildImpactPrompt } from "@/lib/prompts";
import type { ImpactAnalysis } from "@/types";

export const maxDuration = 60; // Vercel Hobby max; Pro plan supports up to 300s

export async function POST(req: NextRequest) {
  try {
    const { pdfBase64 } = await req.json();

    if (!pdfBase64) {
      return NextResponse.json({ error: "PDF data required" }, { status: 400 });
    }

    const prompt = buildImpactPrompt();
    const rawResponse = await analyzeWithPDF(pdfBase64, prompt, 6000);
    const impact = parseJSONResponse(rawResponse) as ImpactAnalysis;

    return NextResponse.json({ impact });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Impact analysis error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
