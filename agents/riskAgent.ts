import { executeAgentWithMcp } from "../src/lib/mcpClient";

export interface GeneratedRisk {
  riskType: string;
  severity: "High" | "Medium" | "Low";
}

export async function riskAgent(
  projectName: string,
  projectDescription: string,
  existingRisks: string[] = []
): Promise<GeneratedRisk[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not found. Falling back to local risk mocks.");
    return getFallbackRisks();
  }

  try {
    const existingContext = existingRisks.length > 0
      ? `Existing Hazards already identified for this project (do NOT repeat, mention, or duplicate any of these hazards): ${JSON.stringify(existingRisks)}`
      : "";

    const systemInstruction = `
      You are an expert Construction Safety Inspector and Environmental Risk Analyst.
      Scan this construction footprint and identify exactly 2 highly critical risks that might cause delays, hazards, or budget blowouts.
      
      ${existingContext}
      
      CRITICAL INSTRUCTION: You MUST use the available MCP tools to gather realistic weather risks and physical safety regulations before making your assessment.
      - Call 'get_weather_risk' with mock coordinates reflecting the site location (e.g., coastal coordinates for seaside sites, high-altitude/windy coordinates for high-rises).
      - Call 'get_safety_regulations' using the most appropriate category ('HighRise', 'Marine', 'Excavation', 'Infrastructure', 'Residential').
      - Call 'validate_concrete_pour' if the project description implies pouring concrete foundations or roads.

      Combine these findings into exactly 2 high-value, grounded risks that are completely unique and not already listed in the existing hazards list.
      Return ONLY a raw JSON array of objects. Do NOT wrap it in markdown code blocks or add introductory text. Each object MUST have these properties:
      - "riskType": (string) Concise description of the hazard referencing weather warnings or OSHA rules retrieved.
      - "severity": (string) "High", "Medium", or "Low".
    `;

    const prompt = `
      Project Name: ${projectName}
      Project Description: ${projectDescription}
    `;

    const responseText = await executeAgentWithMcp(systemInstruction, prompt);
    
    // Sanitize any potential markdown enclosing tags
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.slice(7);
    }
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.slice(3);
    }
    if (cleanJson.endsWith("```")) {
      cleanJson = cleanJson.slice(0, -3);
    }
    cleanJson = cleanJson.trim();

    return JSON.parse(cleanJson) as GeneratedRisk[];
  } catch (error) {
    console.error("riskAgent failed to execute with MCP:", error);
    return getFallbackRisks();
  }
}

function getFallbackRisks(): GeneratedRisk[] {
  return [
    {
      riskType: "Seismic Ground Stratification Instability",
      severity: "High",
    },
    {
      riskType: "Ambient Moisture Corrosion Hazards",
      severity: "Medium",
    },
  ];
}

