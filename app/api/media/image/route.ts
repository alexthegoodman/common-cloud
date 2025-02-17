import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/jwt";
import fs from "fs/promises";
import path from "path";

export const config = {
  api: {
    responseLimit: false,
  },
};

const UPLOAD_DIR = path.join(
  process.cwd(),
  "public"
  //, "image-uploads" // already supplied in stored url
);

export async function GET(req: Request) {
  try {
    // Authorization check
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyJWT(token) as { userId: string; email: string };

    // Get the filename from the URL
    const url = new URL(req.url);
    const filename = url.searchParams.get("filename");

    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }

    // Ensure the filename is sanitized and within the uploads directory
    // const sanitizedFilename = path.basename(filename);
    const filePath = path.join(UPLOAD_DIR, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Read the file
    const fileBuffer = await fs.readFile(filePath);

    // Determine MIME type
    let mimeType = "application/octet-stream";
    if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
      mimeType = "image/jpeg";
    } else if (filename.endsWith(".png")) {
      mimeType = "image/png";
    }

    console.info("mimeType", mimeType, "buffer size", fileBuffer.length);

    // Return the file as a response with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
