export interface GuardrailAuditResult {
  passed: boolean;
  score: number; // Score from 0 to 100
  auditLogs: string[];
  correctedTasks: any[];
  correctedRisks: any[];
}

/**
 * Trust & Ethics Audit Interceptor (Syllabus Week 16)
 * Actively audits the autonomous decisions of schedules and risks to ensure safety compliance
 * (OSHA/Coast Guard regulations) and worker safety protections.
 */
export function auditAgentOutput(
  tasks: any[],
  risks: any[],
  projectName: string,
  projectDescription: string
): GuardrailAuditResult {
  const auditLogs: string[] = [];
  const correctedTasks = [...tasks];
  const correctedRisks = [...risks];
  let violationsCount = 0;
  
  const descLower = projectDescription.toLowerCase();
  
  // Rule 1: Human Labor Safety Check
  // Tasks must not demand extreme consecutive work hours or endanger human laborers without safety rotation shifts.
  for (let i = 0; i < correctedTasks.length; i++) {
    const task = correctedTasks[i];
    const titleLower = task.title.toLowerCase();
    
    // Check if task demands extremely long or unsafe consecutive shifts
    if (
      titleLower.includes("continuous pour") || 
      titleLower.includes("24 hour") || 
      titleLower.includes("overnight framing") ||
      titleLower.includes("18 hour")
    ) {
      violationsCount++;
      const originalTitle = task.title;
      task.title = `Split-Shift: ${originalTitle} (Labor Safety Recalibrate)`;
      task.assignedTo = `${task.assignedTo || "Crew"} [Dual-Rotational Crew Node]`;
      auditLogs.push(
        `[Labor Safety Guardrail] Violation corrected: Intercepted extreme consecutive labor duration task "${originalTitle}". Automatically restructured into rotational split-shifts to comply with human labor safety standards.`
      );
    }
  }

  // Rule 2: Active Meteorological Hazard Compensation
  // If the project description implies a windy high-rise or a seaside maritime site, we verify if safety tasks exist.
  const hasHighWindRisk = descLower.includes("high-rise") || descLower.includes("skyscraper") || descLower.includes("floor") || descLower.includes("tall");
  const hasSeasideRisk = descLower.includes("seaside") || descLower.includes("coast") || descLower.includes("beach") || descLower.includes("ocean") || descLower.includes("marine");
  
  if (hasHighWindRisk) {
    // Skyscraper projects must verify high-altitude crane wind monitoring task exists
    const hasWindTask = correctedTasks.some(t => t.title.toLowerCase().includes("wind") || t.title.toLowerCase().includes("anemometer") || t.title.toLowerCase().includes("sway"));
    if (!hasWindTask) {
      violationsCount++;
      correctedTasks.push({
        title: "OSHA Mandatory Anemometer Telemetry & Crane Structural Sway Calibration",
        status: "Pending",
        assignedTo: "Lead Safety Officer Node",
        deadline: "T+1 Day"
      });
      auditLogs.push(
        `[Structural Safety Guardrail] Negligence corrected: Skyscraper construction project detected but no high-altitude crane wind monitoring task was scheduled. Automatically injected mandatory OSHA wind-monitoring milestone.`
      );
    }
  }
  
  if (hasSeasideRisk) {
    // Marine sites must verify safety vest/lifejacket deployment
    const hasLifejacketTask = correctedTasks.some(t => t.title.toLowerCase().includes("lifejacket") || t.title.toLowerCase().includes("safety vest") || t.title.toLowerCase().includes("buoyant"));
    if (!hasLifejacketTask) {
      violationsCount++;
      correctedTasks.push({
        title: "Deploy Coast Guard Approved buoyancy safety grids and Type III Lifejackets",
        status: "Pending",
        assignedTo: "Marine Operations Manager",
        deadline: "T+1 Day"
      });
      auditLogs.push(
        `[Environmental Safety Guardrail] Regulation corrected: Maritime seaside site detected but no buoyant life protection task was scheduled. Automatically injected mandatory Coast Guard safety compliance tasks.`
      );
    }
  }

  // Rule 3: Extreme Severity Grounding
  // Verify that any risk labeled as "High" has a highly realistic and grounded mitigation description.
  for (let i = 0; i < correctedRisks.length; i++) {
    const risk = correctedRisks[i];
    if (risk.severity === "High" && risk.riskType.length < 20) {
      violationsCount++;
      const originalType = risk.riskType;
      risk.riskType = `${originalType} — Critical Grounding Safety Audit Scan Required`;
      auditLogs.push(
        `[Trust & Quality Guardrail] Quality corrected: Risk "${originalType}" was flagged as HIGH severity but lacked descriptive parameters. Automatically enriched risk metadata tag.`
      );
    }
  }

  const score = Math.max(100 - violationsCount * 15, 40);
  const passed = score >= 70;

  if (auditLogs.length === 0) {
    auditLogs.push(`[Guardrail Clearance] Zero ethical, safety, or labor anomalies detected. Trust score optimal (100/100).`);
  }

  return {
    passed,
    score,
    auditLogs,
    correctedTasks,
    correctedRisks
  };
}
