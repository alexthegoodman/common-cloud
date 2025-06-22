import { verifyJWT } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Generate a client token for the browser to upload the file
        // ⚠️ Authenticate and authorize users before generating the token.
        // Otherwise, you're allowing anonymous uploads.

        if (!clientPayload) {
          throw Error("No ClientPayload - Not authorized");
        }

        let payload = JSON.parse(clientPayload);

        const decoded = verifyJWT(payload.token) as {
          userId: string;
          email: string;
        };

        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: {
            plan: true,
          },
        });

        if (!user) {
          throw Error("User not found - Not authenticated");
        }

        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "video/mp4",
          ],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            // optional, sent to your server on upload completion
            // you could pass a user id from auth, or a value from clientPayload
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Get notified of client upload completion
        // ⚠️ This will not work on `localhost` websites,
        // Use ngrok or similar to get the full upload flow

        console.log("blob upload completed", blob, tokenPayload);

        try {
          // Run any logic after the file upload completed
          // const { userId } = JSON.parse(tokenPayload);
          // await db.update({ avatar: blob.url, userId });
        } catch (error) {
          throw new Error("Could not update user");
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 } // The webhook will retry 5 times waiting for a 200
    );
  }
}
