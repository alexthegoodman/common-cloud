import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // const { projectId } = params;
    // get projectId from slug
    const slugs = req.nextUrl.pathname.split("/");
    const projectId = slugs[slugs.length - 1];

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        public: true,
      },
      select: {
        id: true,
        name: true,
        fileData: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or not public" },
        { status: 404 }
      );
    }

    // // Check if project has content (same logic as public projects list)
    // const fileData = project.fileData as any;
    // const hasContent =
    //   fileData?.sequences?.some((seq: any) =>
    //     seq.layers?.some(
    //       (layer: any) =>
    //         layer.type === "image" ||
    //         layer.type === "text" ||
    //         layer.type === "video" ||
    //         layer.polygons?.length > 0
    //     )
    //   ) || false;

    // if (!hasContent) {
    //   return NextResponse.json(
    //     { error: "Project not found or not public" },
    //     { status: 404 }
    //   );
    // }

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        fileData: project.fileData,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        author: project.owner.email,
      },
    });
  } catch (error) {
    console.error("Error fetching public project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
