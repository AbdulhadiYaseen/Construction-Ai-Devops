import { plannerAgent } from "@/agents/plannerAgent";
import { schedulerAgent } from "@/agents/schedulerAgent";
import { riskAgent } from "@/agents/riskAgent";
import { decisionAgent } from "@/agents/decisionAgent";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

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

    const result = await plannerAgent(
      body.project
    );

    // Dynamic synthesis of tasks, risks, and decisions via dedicated AI agents
    const tasks = await schedulerAgent(body.name, body.project);
    const risks = await riskAgent(body.name, body.project);
    const decisions = await decisionAgent(body.name, body.project, risks);

    // Create full relational tracking footprint including dynamic agent-synthesized items
    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.project,
        status: "Planning",
        tasks: {
          create: tasks
        },
        risks: {
          create: risks
        },
        decisions: {
          create: decisions
        }
      },
    });

    return NextResponse.json({
      success: true,
      result,
      project,
    });
  } catch (err: any) {
    console.error("Planner API Failure:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

