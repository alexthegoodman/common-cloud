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

    const { projectId, saveTarget, sequences } = await req.json();

    console.info("updating sequences", projectId, saveTarget);

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    let saveData: any = {};

    if (saveTarget === "Videos") {
      let fileData = project?.fileData as any;
      fileData.sequences = sequences;
      saveData.fileData = fileData;
    } else if (saveTarget === "Docs") {
      let docData = project?.docData as any;
      docData.sequences = sequences;
      saveData.docData = docData;
    } else if (saveTarget === "Slides") {
      let presData = project?.presData as any;
      presData.sequences = sequences;
      saveData.presData = presData;
    }

    const updatedProject = await prisma.project.update({
      where: {
        id: projectId,
      },
      data: saveData,
    });

    return NextResponse.json({
      updatedProject,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
