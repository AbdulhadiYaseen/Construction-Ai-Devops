import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { schedulerAgent } from "@/agents/schedulerAgent";
import { riskAgent } from "@/agents/riskAgent";
import { decisionAgent } from "@/agents/decisionAgent";
import { verifyAuth } from "@/lib/auth";

export async function POST(req: Request, context: any) {
  // Compliant App Router dynamic context resolution
  const resolvedParams = await context.params;
  const projectId = parseInt(resolvedParams.id, 10);

  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { type } = body; // Accepts "tasks" or "risks"

    if (isNaN(projectId)) {
      return NextResponse.json({ success: false, error: "Invalid entity identifier" }, { status: 400 });
    }

    // Retrieve project details to feed directly into Gemini context pipelines
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true, description: true },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: "Project footprint not found" }, { status: 404 });
    }

    if (type === "tasks") {
      // 🤖 Invoke Gemini Scheduler Sub-Agent
      const optimizedTasks = await schedulerAgent(project.name, project.description);

      // Atomically inject dynamically synthesized tasks into the tracking grid
      await prisma.project.update({
        where: { id: projectId },
        data: {
          tasks: {
            create: optimizedTasks,
          },
        },
      });
    } else if (type === "risks") {
      // 🤖 Invoke Gemini Risk Inspection Agent
      const generatedRisks = await riskAgent(project.name, project.description);

      // 🤖 Invoke Gemini Operator Agent passing active risk context
      const generatedDecisions = await decisionAgent(project.name, project.description, generatedRisks);

      // Atomically insert dynamic hazards and autonomous log tracks
      await prisma.project.update({
        where: { id: projectId },
        data: {
          risks: {
            create: generatedRisks,
          },
          decisions: {
            create: generatedDecisions,
          },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Gemini Agent Optimization Pipeline Failure:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
