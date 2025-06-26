import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Helper function to convert ReadableStream to base64
async function streamToBase64(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  const buffer = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }
  
  return Buffer.from(buffer).toString('base64');
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, count } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const imageCount = Math.min(count || 1, 5); // Limit to max 5 images

    // Generate multiple images concurrently
    const promises = Array.from({ length: imageCount }, async (_, index) => {
      const output = (await replicate.run("black-forest-labs/flux-schnell", {
        input: {
          prompt: `${prompt}, variation ${index + 1}`,
          go_fast: true,
          megapixels: "0.25",
          num_outputs: 1,
          aspect_ratio: "1:1",
          output_format: "jpg",
          output_quality: 80,
        },
      })) as any;

      // Convert stream to base64 for JSON transport
      const base64Data = await streamToBase64(output[0] as ReadableStream);
      return {
        index,
        data: base64Data,
      };
    });

    const results = await Promise.all(promises);
    
    console.info(`Generated ${results.length} images successfully`);

    return NextResponse.json({ 
      images: results,
      count: results.length 
    });
  } catch (error) {
    console.error("Bulk image generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate images" },
      { status: 500 }
    );
  }
}