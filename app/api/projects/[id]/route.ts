import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid project footprint ID" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        tasks: true,
        risks: true,
        decisions: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project footprint not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch project details" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid project identifier" },
        { status: 400 }
      );
    }

    // Relational Atomic Cascade deletion via Transaction to bypass missing Prisma onDelete constraint
    await prisma.$transaction([
      prisma.task.deleteMany({ where: { projectId: id } }),
      prisma.risk.deleteMany({ where: { projectId: id } }),
      prisma.decision.deleteMany({ where: { projectId: id } }),
      prisma.project.deleteMany({ where: { id } })
    ]);

    return NextResponse.json({ success: true, message: "Project deleted successfully" });
  } catch (error: any) {
    console.error("Project deletion failure:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error during deletion" },
      { status: 500 }
    );
  }
}
