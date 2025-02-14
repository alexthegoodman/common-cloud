import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

// Constants
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  // 'image/gif',
  // 'image/webp'
];
const UPLOAD_DIR = path.join(process.cwd(), "public", "image-uploads");

// Helper function to validate file type from base64
function getMimeTypeFromBase64(base64Data: string): string | null {
  const match = base64Data.match(
    /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/
  );
  return match ? match[1] : null;
}

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

    const { fileName, fileData } = await req.json();

    // Input validation
    if (!fileName || !fileData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // File type validation
    const mimeType = getMimeTypeFromBase64(fileData);
    if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed types: JPEG, PNG" },
        { status: 400 }
      );
    }

    // Remove base64 header before converting to buffer
    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, "");

    // File size validation
    const buffer = Buffer.from(base64Data, "base64");
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 2MB limit" },
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
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${timestamp}-${sanitizedFileName}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFileName);

    // Save the file locally (for now)
    await fs.writeFile(filePath, buffer);

    // Generate the public URL
    const publicUrl = `/image-uploads/${uniqueFileName}`;

    return NextResponse.json({
      url: publicUrl,
      fileName: uniqueFileName,
      size: buffer.length,
      type: mimeType,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
