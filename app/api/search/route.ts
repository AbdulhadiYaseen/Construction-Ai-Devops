import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ success: true, projects: [], tasks: [] });
    }

    // Execute parallel Prisma searches for projects and tasks
    const [projects, tasks] = await Promise.all([
      prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { description: { contains: query } }
          ]
        },
        take: 5,
        select: {
          id: true,
          name: true,
          status: true
        }
      }),
      prisma.task.findMany({
        where: {
          title: { contains: query }
        },
        take: 5,
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      projects,
      tasks
    });
  } catch (error: any) {
    console.error("Global search failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Search process crashed." },
      { status: 500 }
    );
  }
}
