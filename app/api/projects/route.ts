import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            tasks: true,
            risks: true,
            decisions: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Project name is required" },
        { status: 400 }
    );
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || "",
        status: "Active",
      },
      include: {
        _count: {
          select: {
            tasks: true,
            risks: true,
            decisions: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create project" },
      { status: 500 }
    );
  }
}
