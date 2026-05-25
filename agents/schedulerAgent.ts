import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export interface GeneratedTask {
  title: string;
  status: string;
  assignedTo: string;
  deadline: string;
}

export async function schedulerAgent(
  projectName: string,
  projectDescription: string
): Promise<GeneratedTask[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not found. Falling back to local optimizer mocks.");
    return getFallbackTasks();
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
      You are a digital Project Foreman specialized in high-efficiency construction scheduling.
      Analyze the project footprint and output exactly 2 high-value, specialized operational tasks that will optimize delivery.
      
      Project Name: ${projectName}
      Project Description: ${projectDescription}

      Return a JSON array containing exactly 2 objects. Each object MUST have these exact properties:
      - "title": (string) Specific, clear task title related to construction operations.
      - "status": (string) Operational state: "Pending" or "In Progress".
      - "assignedTo": (string) Specific specialized handler (AI node or professional role).
      - "deadline": (string) Relative completion constraint, e.g., "T+3 Days" or "T+10 Days".
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as GeneratedTask[];
  } catch (error) {
    console.error("schedulerAgent failed to query Gemini:", error);
    return getFallbackTasks();
  }
}

function getFallbackTasks(): GeneratedTask[] {
  return [
    {
      title: "Autonomous Thermal Grid Stress Inspection",
      status: "Pending",
      assignedTo: "Drone Fleet Node Alpha",
      deadline: "T+4 Days",
    },
    {
      title: "High-Tensile Concrete Vibration Profiling",
      status: "In Progress",
      assignedTo: "Mechanical Analysis Handler",
      deadline: "T+7 Days",
    },
  ];
}
