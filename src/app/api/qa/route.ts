import { NextRequest, NextResponse } from "next/server";
import { chatWithContext } from "@/lib/anthropic";
import { buildQAPrompt } from "@/lib/prompts";
import type { Perspective } from "@/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { question, paperContext, perspective, chatHistory } =
      await req.json();

    if (!question || !paperContext || !perspective) {
      return NextResponse.json(
        { error: "Question, paper context, and perspective required" },
        { status: 400 }
      );
    }

    const systemPrompt = buildQAPrompt(
      perspective as Perspective,
      JSON.stringify(paperContext, null, 2)
    );

    const messages: Array<{ role: "user" | "assistant"; content: string }> = [
      ...(chatHistory || []),
      { role: "user", content: question },
    ];

    const answer = await chatWithContext(systemPrompt, messages, 1500);

    return NextResponse.json({ answer });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Q&A error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
