import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export const maxDuration = 60; // 1 minute (60 seconds)

// Constants
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB in bytes
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];
const UPLOAD_DIR = path.join(process.cwd(), "public", "image-uploads");

// Bunny.net configuration
const BUNNY_STORAGE_URL = process.env.BUNNY_STORAGE_URL; // e.g., https://storage.bunnycdn.com/your-storage-zone
const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL; // e.g., https://your-pull-zone.b-cdn.net

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

// Helper function to upload to Bunny.net
async function uploadToBunny(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  if (!BUNNY_STORAGE_URL || !BUNNY_API_KEY || !BUNNY_CDN_URL) {
    throw new Error("Bunny.net configuration missing");
  }

  const uploadUrl = `${BUNNY_STORAGE_URL}/${fileName}`;

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      AccessKey: BUNNY_API_KEY,
      "Content-Type": "application/octet-stream",
      accept: "application/json",
    },
    body: buffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bunny.net upload failed: ${response.status} ${errorText}`);
  }

  // Return the CDN URL
  return `${BUNNY_CDN_URL}/${fileName}`;
}

// Helper function to save file locally
async function saveFileLocally(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  // Create uploads directory if it doesn't exist
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }

  const filePath = path.join(UPLOAD_DIR, fileName);
  await fs.writeFile(filePath, buffer);

  // Return the public URL
  return `/image-uploads/${fileName}`;
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

    // Sanitize filename and add timestamp
    const fileName = req.headers.get("X-File-Name") || "uploaded_file";
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const extension = mimeType === "image/jpeg" ? ".jpg" : ".png";
    const uniqueFileName = `${timestamp}-${sanitizedFileName}${extension}`;

    let publicUrl: string;

    // Choose storage method based on environment
    if (process.env.NODE_ENV === "production") {
      // Upload to Bunny.net in production
      try {
        publicUrl = await uploadToBunny(buffer, uniqueFileName, mimeType);
      } catch (error) {
        console.error("Bunny.net upload error:", error);
        return NextResponse.json(
          { error: "Failed to upload file to storage" },
          { status: 500 }
        );
      }
    } else {
      // Save locally in development
      try {
        publicUrl = await saveFileLocally(buffer, uniqueFileName);
      } catch (error) {
        console.error("Local file save error:", error);
        return NextResponse.json(
          { error: "Failed to save file locally" },
          { status: 500 }
        );
      }
    }

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
