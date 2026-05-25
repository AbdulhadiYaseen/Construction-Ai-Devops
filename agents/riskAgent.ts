import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export interface GeneratedRisk {
  riskType: string;
  severity: "High" | "Medium" | "Low";
}

export async function riskAgent(
  projectName: string,
  projectDescription: string
): Promise<GeneratedRisk[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not found. Falling back to local risk mocks.");
    return getFallbackRisks();
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `
      You are an expert Construction Safety Inspector and Environmental Risk Analyst.
      Scan this construction footprint and identify exactly 2 highly critical risks that might cause delays, hazards, or budget blowouts.
      
      Project Name: ${projectName}
      Project Description: ${projectDescription}

      Return a JSON array containing exactly 2 objects. Each object MUST have these exact properties:
      - "riskType": (string) A concise description of the hazard (e.g., "Extreme Rainfall Degradation").
      - "severity": (string) The critical operational severity categorization: "High", "Medium", or "Low".
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as GeneratedRisk[];
  } catch (error) {
    console.error("riskAgent failed to query Gemini:", error);
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
