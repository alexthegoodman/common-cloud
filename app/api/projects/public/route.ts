import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/jwt";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
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

    const projects = await prisma.project.findMany({
      where: {
        public: true,
        fileData: {
          path: ["sequences"],
          array_contains: [{}], // videos
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        name: true,
        fileData: true, // videos
        createdAt: true,
        updatedAt: true,
      },
      take: 3,
    });

    return NextResponse.json({
      projects,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
