import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { AnimationDataSchema, animationSchema } from "@/def/ai";

export async function POST(req: Request) {
  try {
    // TODO: re add later!
    // const token = req.headers.get("Authorization")?.split(" ")[1];

    // if (!token) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // const decoded = verifyJWT(token) as { userId: string; email: string };

    // const user = await prisma.user.findUnique({
    //   where: { id: decoded.userId },
    //   include: {
    //     plan: true,
    //   },
    // });

    // if (!user) {
    //   return NextResponse.json({ error: "User not found" }, { status: 404 });
    // }

    const {
      description,
      position,
      scale,
      opacity,
      rotation,
      delay,
      duration,
      object_dimensions,
      arrow_positions,
    } = await req.json();

    // Validate required fields
    if (!description || !object_dimensions || !arrow_positions) {
      return NextResponse.json(
        {
          error: "Missing required fields: description and object_dimensions",
        },
        { status: 400 }
      );
    }

    // Default values
    // const animationDuration = 3000;
    // const animationStyle = "smooth";

    const systemPrompt = `You are an expert animation designer. Create engaging keyframe animations.

The user is animating this: ${description}

They want the animation to travel from these two points, generally:
${JSON.stringify(arrow_positions, null, 2)}

Here are the details on their desired animation:
- Position: ${position}
- Scale: ${scale}
- Opacity: ${opacity}
- Rotation: ${rotation}

The object being animated has a size of ${object_dimensions.width}x${
      object_dimensions.height
    }.

The user's canvas has a size of 1200x800.

Requested Animation Duration: ${duration ? duration : "3000ms"}
Requested Animation Delay: ${delay ? delay : "0"}

Please adhere to the following guidelines:

Timing/Pacing

Do: Subtle, purposeful timing
Don't: Overly bouncy, rubber-ball physics

Movement Quality

Do: Confident, direct motion
Don't: Wobbling, overshooting, "jelly" effects

Transitions

Do: Clean cuts, linear or subtle easing
Don't: Elastic, spring-loaded entrances/exits

Scale/Rotation

Do: Proportional, controlled scaling
Don't: Dramatic size changes, spinning for effect

For well-known style references, you might consider:

Apple/iOS: Clean, purposeful, minimal overshoot
Google Material: Consistent easing curves, logical motion
Netflix UI: Smooth but snappy, no wasted motion
Financial/Bloomberg graphics: Precise, data-focused, no flourishes
Architectural visualization: Smooth, linear camera movements
Documentary/editorial: Steady, informative pacing

Please reply in the requested JSON schema. Thank you very much
`;

    console.info("generating motion with prompt: ", systemPrompt);

    const object = await generateObject({
      model: openai("gpt-4o-mini"),
      // model: openai("gpt-5-mini"),
      schema: AnimationDataSchema,
      prompt: systemPrompt,
      // temperature: 0.7, // Add some creativity while maintaining consistency
      // gpt-5
      // providerOptions: {
      //   openai: {
      //     reasoning_effort: "minimal", // Increases autonomous exploration
      //   },
      // },
    });

    const json = object.toJsonResponse();
    const data = await json.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Animation generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
