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

    // Retrieve project details to feed directly into Gemini context pipelines along with existing entries
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { 
        name: true, 
        description: true,
        risks: { select: { riskType: true } },
        tasks: { select: { title: true } }
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: "Project footprint not found" }, { status: 404 });
    }

    if (type === "tasks") {
      const existingTitles = project.tasks.map(t => t.title);
      
      // 🤖 Invoke Gemini Scheduler Sub-Agent with existing tasks context
      const optimizedTasks = await schedulerAgent(project.name, project.description, existingTitles);

      // Filter out tasks whose titles already exist in the database (case-insensitive check)
      const existingTitlesSet = new Set(existingTitles.map(t => t.toLowerCase().trim()));
      const uniqueTasks = optimizedTasks.filter(t => !existingTitlesSet.has(t.title.toLowerCase().trim()));

      // Atomically inject only new, dynamically synthesized tasks into the tracking grid
      if (uniqueTasks.length > 0) {
        await prisma.project.update({
          where: { id: projectId },
          data: {
            tasks: {
              create: uniqueTasks,
            },
          },
        });
      }
    } else if (type === "risks") {
      const existingRiskTypes = project.risks.map(r => r.riskType);

      // 🤖 Invoke Gemini Risk Inspection Agent with existing risks context
      const generatedRisks = await riskAgent(project.name, project.description, existingRiskTypes);

      // Filter out risks whose types already exist in the database (case-insensitive check)
      const existingRiskTypesSet = new Set(existingRiskTypes.map(r => r.toLowerCase().trim()));
      const uniqueRisks = generatedRisks.filter(r => !existingRiskTypesSet.has(r.riskType.toLowerCase().trim()));

      // Only invoke decision agent and write to database if new hazards are identified
      if (uniqueRisks.length > 0) {
        // 🤖 Invoke Gemini Operator Agent passing active risk context
        const generatedDecisions = await decisionAgent(project.name, project.description, uniqueRisks);

        // Atomically insert dynamic hazards and autonomous log tracks
        await prisma.project.update({
          where: { id: projectId },
          data: {
            risks: {
              create: uniqueRisks,
            },
            decisions: {
              create: generatedDecisions,
            },
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Gemini Agent Optimization Pipeline Failure:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
