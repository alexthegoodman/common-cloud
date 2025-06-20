import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { contentSchema } from "@/def/ai";

export async function POST(req: Request) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyJWT(token) as { userId: string; email: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        plan: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const context = await req.json();
    const userLanguage = req.headers.get("X-User-Language");

    let targetLanguage = "English";
    switch (userLanguage) {
      case "en":
        targetLanguage = "English";
        break;
      case "hi":
        targetLanguage = "Hindi";
        break;
      case "hit":
        targetLanguage = "Hindi (Roman)";
        break;
      default:
        break;
    }

    const object = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: contentSchema,
      prompt:
        `Generate 3 mini summaries regarding this content (in the language of ${targetLanguage}):` +
        context,
    });

    const json = object.toJsonResponse();

    const data = await json.json();

    return NextResponse.json({
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
