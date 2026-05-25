import { GoogleGenerativeAI } from "@google/generative-ai";

export async function plannerAgent(projectDescription: string): Promise<string> {
  //5 floor bulding
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

      const prompt = `You are an expert multi-agent construction operations orchestrator. Analyze the provided project overview and generate a structured execution plan containing:\n1. Operational Tasks (with suggested roles and timeline estimates)\n2. Risk Factors (categorized with severity flags)\n3. Autonomous Logistics & Site Setup recommendations.\nFormat beautifully in Markdown.\n\nProject Description:\n${projectDescription}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return text || "Autonomous generation yielded empty blueprint layers.";
    } catch (error: any) {
      console.warn("Gemini integration error fallback triggered:", error.message);
    }
  }


  // Dynamic fallback generator to provide realistic mock blueprints if Gemini is offline
  const lowerDesc = projectDescription.toLowerCase();
  
  let dynamicRisks = "";
  let dynamicTasks = "";
  
  if (lowerDesc.includes("seaside") || lowerDesc.includes("ocean") || lowerDesc.includes("beach") || lowerDesc.includes("coast") || lowerDesc.includes("sea")) {
    dynamicTasks = `
- **Coastal Geotechnical Marine Soil Analysis** 
  - *Assigned Handler:* Marine Engineering Agent
  - *Constraint:* Complete within T+6 Days
- **Seawall Shoring & Saltwater Salinity Corrosion Proofing**
  - *Assigned Handler:* Heavy Infrastructure Specialist
  - *Constraint:* Complete within T+15 Days`;
    dynamicRisks = `
- **Saltwater Corrosion & Tidal Surges** — \`HIGH SEVERITY\`
  - *Mitigation:* Employ specialized anti-corrosion titanium alloys and structural seawall buffers.`;
  } else if (lowerDesc.includes("high-rise") || lowerDesc.includes("building") || lowerDesc.includes("floor") || lowerDesc.includes("flat")) {
    dynamicTasks = `
- **Multi-Storey Structural Load-Bearing Validation** 
  - *Assigned Handler:* Lead Architect Agent
  - *Constraint:* Complete within T+5 Days
- **High-Elevation Crane Positioning & Safety Grids**
  - *Assigned Handler:* Safety Operations Coordinator
  - *Constraint:* Complete within T+12 Days`;
    dynamicRisks = `
- **High-Altitude Wind Shear & Structural Sway** — \`MEDIUM SEVERITY\`
  - *Mitigation:* Installation of tuned mass dampers and real-time sway sway sensors.`;
  } else {
    dynamicTasks = `
- **Standard Footprint Site Survey & Geotechnical Validation** 
  - *Assigned Handler:* Lead Surveyor Agent
  - *Constraint:* Complete within T+5 Days
- **Foundation Excavation & Site Shoring**
  - *Assigned Handler:* Heavy Ops Coordinator
  - *Constraint:* Complete within T+14 Days`;
    dynamicRisks = `
- **Weather & Ground Instability** — \`MEDIUM SEVERITY\`
  - *Mitigation:* Continuous telemetry tracking of ground density and soil moisture.`;
  }

  return `### 🏗️ Autonomous Operations Directive: ${projectDescription ? "Custom Footprint Analysis" : "Construction AI Pipeline"}

**Input Parameters Analyzed:**
> "${projectDescription || "General construction site initialization footprint."}"

---

#### Phase 1: Structural Task Pipeline${dynamicTasks}
- **Steel Framework Sub-Assembly Setup**
  - *Assigned Handler:* Structural Engineer Agent
  - *Constraint:* Dependent on foundation pour stability milestones

---

#### Phase 2: Autonomous Risk Identification${dynamicRisks}
- **Zoning Variance Overlap** — \`LOW SEVERITY\`
  - *Mitigation:* Pre-approved municipal standard template filing executed.

---

#### Phase 3: Autonomous Command Directives
1. Dynamic resource buffers allocated.
2. Safety telemetry tracking channels instantiated.
3. Live sensor matrix synchronization bound to footprint node.`;
}
