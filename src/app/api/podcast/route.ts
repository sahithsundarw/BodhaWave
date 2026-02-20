import { NextRequest, NextResponse } from "next/server";
import { analyzeWithPDF, parseJSONResponse } from "@/lib/anthropic";
import { buildPodcastPrompt } from "@/lib/prompts";
import type { Perspective, PodcastScript } from "@/types";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const { pdfBase64, perspective } = await req.json();

    if (!pdfBase64 || !perspective) {
      return NextResponse.json(
        { error: "PDF data and perspective required" },
        { status: 400 }
      );
    }

    const prompt = buildPodcastPrompt(perspective as Perspective);
    // 8192 tokens — a 20-turn podcast script needs plenty of room
    const rawResponse = await analyzeWithPDF(pdfBase64, prompt, 8192);
    const podcast = parseJSONResponse(rawResponse) as PodcastScript;

    return NextResponse.json({ podcast });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Podcast generation error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
