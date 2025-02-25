import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/jwt";
import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// define a schema for the notifications
export const dataSchema = z.object({
  bulletPoints: z.array(
    z.object({
      dataPoint: z
        .string()
        .describe("The qualitative or quantitative data point if one exists."),
      description: z
        .string()
        .describe("The text summarizing this bullet point."),
    })
  ),
});

export async function POST(req: Request) {
  try {
    // Authorization check
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyJWT(token) as { userId: string; email: string };

    const { content } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const result = streamObject({
      model: openai("o3-mini"),
      schema: dataSchema,
      prompt: `Generate 3 bullet points for this content:` + content,
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
