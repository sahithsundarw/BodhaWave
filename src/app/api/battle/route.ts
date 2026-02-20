import { NextRequest, NextResponse } from "next/server";
import { analyzeWithTwoPDFs, parseJSONResponse } from "@/lib/anthropic";
import { buildBattlePrompt } from "@/lib/prompts";
import type { PaperBattleResult } from "@/types";

export const maxDuration = 180;

export async function POST(req: NextRequest) {
  try {
    const { pdf1Base64, pdf2Base64 } = await req.json();

    if (!pdf1Base64 || !pdf2Base64) {
      return NextResponse.json(
        { error: "Both PDF files required for battle mode" },
        { status: 400 }
      );
    }

    const prompt = buildBattlePrompt();
    const rawResponse = await analyzeWithTwoPDFs(
      pdf1Base64,
      pdf2Base64,
      prompt,
      8192
    );
    const battle = parseJSONResponse(rawResponse) as PaperBattleResult;

    return NextResponse.json({ battle });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Battle analysis error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
