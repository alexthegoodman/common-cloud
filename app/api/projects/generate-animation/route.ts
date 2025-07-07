import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { animationSchema } from "@/def/ai";

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

    const { prompt, duration, style, objectIds, canvasSize } = await req.json();

    // Validate required fields
    if (
      !prompt ||
      !objectIds ||
      !Array.isArray(objectIds) ||
      objectIds.length === 0
    ) {
      return NextResponse.json(
        {
          error: "Missing required fields: prompt and objectIds",
        },
        { status: 400 }
      );
    }

    // Default values
    const animationDuration = duration || 3000;
    const animationStyle = style || "smooth";

    // Create a comprehensive prompt for the AI
    const systemPrompt = `You are an expert animation designer. Create engaging keyframe animations based on the user's description.

Available objects to animate: ${objectIds.join(", ")}
Canvas size: ${
      canvasSize ? `${canvasSize.width}x${canvasSize.height}` : "550x900"
    }
Requested duration: ${animationDuration}ms
Requested style: ${animationStyle}

Animation Properties Available:
- position: [x, y] coordinates
- scaleX: scale factor (100 = normal, 200 = double size, 50 = half size)
- scaleY: scale factor (100 = normal, 200 = double size, 50 = half size)
- rotation: rotation in degrees (0-360)
- opacity: transparency (0 = invisible, 100 = fully visible)

Easing Options: Linear, EaseIn, EaseOut, EaseInOut

Guidelines:
- Create smooth, visually appealing animations
- Use appropriate easing for the style requested
- Consider the canvas size when setting position values
- Create at least 2-3 keyframes per property for smooth motion
- Match the animation style (smooth = gentle curves, bouncy = overshoot, quick = fast transitions, dramatic = large movements, subtle = small changes)

User Request: ${prompt}`;

    const object = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: animationSchema,
      prompt: systemPrompt,
      // temperature: 0.7, // Add some creativity while maintaining consistency
    });

    const json = object.toJsonResponse();
    const data = await json.json();

    return NextResponse.json({
      data,
      success: true,
    });
  } catch (error) {
    console.error("Animation generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
