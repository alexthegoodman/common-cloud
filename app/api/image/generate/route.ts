import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const output = (await replicate.run("black-forest-labs/flux-schnell", {
      input: {
        prompt: prompt,
        go_fast: true,
        megapixels: "0.25",
        num_outputs: 1,
        aspect_ratio: "1:1",
        output_format: "jpg",
        output_quality: 80,
      },
    })) as any;

    console.info("Image generated successfully", output[0]);

    // Convert ReadableStream to Response with proper headers
    return new Response(output[0] as ReadableStream, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": 'inline; filename="generated-image.jpg"',
      },
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
