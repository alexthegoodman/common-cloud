import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/jwt";
import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { dataSchema } from "@/def/ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Authorization check
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyJWT(token) as { userId: string; email: string };

    // const { content } = await req.json();
    const context = await req.json();

    if (!context) {
      return NextResponse.json(
        { error: "Content context is required" },
        { status: 400 }
      );
    }

    const result = streamObject({
      model: openai("gpt-4o-mini"),
      schema: dataSchema,
      prompt: `Generate 3 bullet points for this content:` + context,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Scraping error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
