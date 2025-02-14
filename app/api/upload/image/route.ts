import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

// Constants
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 2MB in bytes
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];
const UPLOAD_DIR = path.join(process.cwd(), "public", "image-uploads");

// Helper function to validate file type from raw bytes
function getMimeTypeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length < 2) return null;

  // Check for JPEG (starts with FF D8)
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    return "image/jpeg";
  }

  // Check for PNG (starts with 89 50 4E 47 0D 0A 1A 0A)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  return null;
}

export const config = {
  api: {
    bodyParser: false, // Disable default body parsing to handle raw binary data
  },
};

export async function POST(req: Request) {
  try {
    // Authorization check
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

    // Read raw bytes from the request body
    const chunks: Uint8Array[] = [];
    const reader = req.body?.getReader();

    if (!reader) {
      return NextResponse.json(
        { error: "Failed to read request body" },
        { status: 400 }
      );
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }

    const buffer = Buffer.concat(chunks);

    // File size validation
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 4MB limit" },
        { status: 400 }
      );
    }

    // File type validation
    const mimeType = getMimeTypeFromBuffer(buffer);
    if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed types: JPEG, PNG" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    try {
      await fs.access(UPLOAD_DIR);
    } catch {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Sanitize filename and add timestamp
    const fileName = req.headers.get("X-File-Name") || "uploaded_file";
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${timestamp}-${sanitizedFileName}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFileName);

    // Save the file locally
    await fs.writeFile(filePath, buffer);

    // Generate the public URL
    const publicUrl = `/image-uploads/${uniqueFileName}`;

    return NextResponse.json({
      url: publicUrl,
      fileName: uniqueFileName,
      size: buffer.length,
      mimeType: mimeType,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
