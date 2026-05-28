import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { coordinateA2ASynthesis } from "../../../../../src/lib/a2aProtocol";
import { auditAgentOutput } from "../../../../../src/lib/ethicsGuardrail";

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

    // Retrieve project details along with existing entries for dynamic contextual planning
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

    const existingTitles = project.tasks.map(t => t.title);
    const existingRiskTypes = project.risks.map(r => r.riskType);

    // 🤖 Invoke the A2A Protocol Broker (Syllabus Week 13) to coordinate agent exchange
    const a2aResult = await coordinateA2ASynthesis(
      project.name,
      project.description,
      existingTitles,
      existingRiskTypes
    );

    // ⚖️ Intercept and audit outputs via the Ethics & Safety Guardrail Auditor (Syllabus Week 16)
    const auditResult = auditAgentOutput(
      a2aResult.tasks,
      a2aResult.risks,
      project.name,
      project.description
    );

    // Format rich metadata combining the A2A messaging log and Ethical safety audit report
    const a2aAuditReport = [
      `=== [Syllabus Week 13] A2A MULTI-AGENT PROTOCOL DIALOGUE ===`,
      ...a2aResult.a2aConversationLog,
      `\n=== [Syllabus Week 16] ETHICS & LABOR SAFETY AUDIT TRAIL ===`,
      `Compliance Trust Score: ${auditResult.score}/100 | Passed: ${auditResult.passed ? "YES" : "NO"}`,
      ...auditResult.auditLogs
    ].join("\n");

    if (type === "tasks") {
      // Deduplicate corrected tasks against existing titles
      const existingTitlesSet = new Set(existingTitles.map(t => t.toLowerCase().trim()));
      const uniqueTasks = auditResult.correctedTasks.filter(
        t => !existingTitlesSet.has(t.title.toLowerCase().trim())
      );

      // Atomically inject tasks and detailed audit tracking trace as an autonomous decision log
      if (uniqueTasks.length > 0) {
        await prisma.project.update({
          where: { id: projectId },
          data: {
            tasks: {
              create: uniqueTasks,
            },
            decisions: {
              create: {
                action: `[A2A Protocol & Safety Audit] Tasks Schedule Refinement`,
                reason: a2aAuditReport,
              },
            },
          },
        });
      }
    } else if (type === "risks") {
      // Deduplicate corrected risks against existing types
      const existingRiskTypesSet = new Set(existingRiskTypes.map(r => r.toLowerCase().trim()));
      const uniqueRisks = auditResult.correctedRisks.filter(
        r => !existingRiskTypesSet.has(r.riskType.toLowerCase().trim())
      );

      // Atomically inject unique hazards and unified audit report
      if (uniqueRisks.length > 0) {
        await prisma.project.update({
          where: { id: projectId },
          data: {
            risks: {
              create: uniqueRisks,
            },
            decisions: {
              create: {
                action: `[A2A Protocol & Safety Audit] Dynamic Environmental Risk Scan`,
                reason: a2aAuditReport,
              },
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
