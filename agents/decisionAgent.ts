import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export interface GeneratedDecision {
  action: string;
  reason: string;
}

export async function decisionAgent(
  projectName: string,
  projectDescription: string,
  newlyIdentifiedRisks?: any[]
): Promise<GeneratedDecision[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not found. Falling back to local decision mocks.");
    return getFallbackDecisions();
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const riskContext = newlyIdentifiedRisks && newlyIdentifiedRisks.length > 0
      ? `Newly Identified Project Hazards requiring mitigation: ${JSON.stringify(newlyIdentifiedRisks)}`
      : "General operational parameters oversight.";

    const prompt = `
      You are an Autonomous Systems Commander operating behind the scenes at a construction footprint.
      Analyze the project and output exactly 1 autonomous decision command executed to optimize operations.
      
      Project Name: ${projectName}
      Project Description: ${projectDescription}
      ${riskContext}

      Return a JSON array containing exactly 1 object. The object MUST have these exact properties:
      - "action": (string) A clear system command executed (e.g., "Allocate safety sensor buffer").
      - "reason": (string) An explanatory rationale mapping back to mitigation of active project parameters or risks.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as GeneratedDecision[];
  } catch (error) {
    console.error("decisionAgent failed to query Gemini:", error);
    return getFallbackDecisions();
  }
}

function getFallbackDecisions(): GeneratedDecision[] {
  return [
    {
      action: "Synchronize Deep-Telemetry Sensor Grids",
      reason: "Real-time automated safety mitigation driven by sudden environmental variance detection.",
    },
  ];
}
