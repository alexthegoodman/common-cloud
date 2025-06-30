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

    // Check project limit for non-subscribers and non-admins
    if (user.role !== "ADMIN" && user.subscriptionStatus !== "ACTIVE") {
      const projectCount = await prisma.project.count({
        where: { ownerId: user.id },
      });

      if (projectCount >= 3) {
        return NextResponse.json(
          { error: "Project limit reached. Upgrade to create more projects." },
          { status: 403 }
        );
      }
    }

    const { name, emptyVideoData, emptyDocData, emptyPresData } =
      await req.json();

    const newProject = await prisma.project.create({
      data: {
        ownerId: user.id,
        name,
        fileData: emptyVideoData,
        docData: emptyDocData,
        presData: emptyPresData,
      },
    });

    return NextResponse.json({
      newProject,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
