import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/jwt";
import prisma from "@/lib/prisma";

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

    const { prompt, brandKitId, emptyContent, emptyQuestions } =
      await req.json();

    let addtData = {};

    if (brandKitId) {
      addtData = {
        brandKitId,
      };
    }

    console.info("data", prompt, brandKitId, emptyContent, emptyQuestions);

    const newFlow = await prisma.flow.create({
      data: {
        ownerId: user.id,
        prompt,
        content: emptyContent,
        questions: emptyQuestions,
        ...addtData,
      },
    });

    return NextResponse.json({
      newFlow,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
