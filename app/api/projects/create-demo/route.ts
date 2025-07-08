import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJWT } from "@/lib/jwt";
import { v4 as uuidv4 } from "uuid";

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

    // Get a random template project
    const templates = await prisma.project.findMany({
      where: {
        isTemplate: true,
        public: true,
      },
      select: {
        id: true,
        name: true,
        fileData: true,
        docData: true,
        presData: true,
      },
    });

    if (templates.length === 0) {
      return NextResponse.json(
        { error: "No templates available" },
        { status: 404 }
      );
    }

    // Select a random template
    const randomTemplate =
      templates[Math.floor(Math.random() * templates.length)];

    // Create a new project with the template data
    const demoProjectName = `Demo: ${randomTemplate.name}`;

    const newProject = await prisma.project.create({
      data: {
        ownerId: user.id,
        name: demoProjectName,
        fileData: randomTemplate.fileData!,
        docData: randomTemplate.docData!,
        presData: randomTemplate.presData!,
        // Don't mark as template since this is a user's copy
        isTemplate: false,
        public: false,
      },
    });

    return NextResponse.json({
      newProject,
    });
  } catch (error) {
    console.error("Error creating demo project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
