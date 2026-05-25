import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  context: any
) {
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    // Secure unwrap of dynamic identifier parameters
    const resolvedParams = await context.params;
    const id = parseInt(resolvedParams.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid task identifier." }, { status: 400 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ success: false, error: "No status parameters supplied." }, { status: 400 });
    }

    // Commit operational state transition directly onto the database engine
    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    console.error("Task mutation failure:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Critical operational write error during task update." },
      { status: 500 }
    );
  }
}
