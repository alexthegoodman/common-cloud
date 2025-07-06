import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "6");
    const offset = (page - 1) * limit;

    // Get total count for pagination info
    const totalCount = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM "Project" 
      WHERE public = true 
      AND "isFeatured" = true
      AND EXISTS (
        SELECT 1 
        FROM jsonb_array_elements("fileData"->'sequences') AS seq
        WHERE jsonb_array_length(seq->'activeImageItems') > 0 or 
        jsonb_array_length(seq->'activeTextItems') > 0 or
        jsonb_array_length(seq->'activeVideoItems') > 0 or
        jsonb_array_length(seq->'activePolygons') > 0
      )
    `;

    // Get paginated projects
    const projects = await prisma.$queryRaw`
      SELECT id, name, "fileData", "createdAt", "updatedAt"
      FROM "Project" 
      WHERE public = true
      AND "isFeatured" = true 
      AND EXISTS (
        SELECT 1 
        FROM jsonb_array_elements("fileData"->'sequences') AS seq
        WHERE jsonb_array_length(seq->'activeImageItems') > 0 or 
        jsonb_array_length(seq->'activeTextItems') > 0 or
        jsonb_array_length(seq->'activeVideoItems') > 0 or
        jsonb_array_length(seq->'activePolygons') > 0
      )
      ORDER BY "updatedAt" DESC 
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const total = Array.isArray(totalCount) ? totalCount[0]?.count || 0 : 0;
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      projects,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: total,
        hasNextPage,
        hasPrevPage,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
