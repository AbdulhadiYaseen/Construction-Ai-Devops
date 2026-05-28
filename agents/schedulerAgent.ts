import { executeAgentWithMcp } from "../src/lib/mcpClient";
import { retrieveRegulatoryDocs } from "../src/lib/complianceRag";

export interface GeneratedTask {
  title: string;
  status: string;
  assignedTo: string;
  deadline: string;
}

export async function schedulerAgent(
  projectName: string,
  projectDescription: string,
  existingTasks: string[] = []
): Promise<GeneratedTask[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not found. Falling back to local optimizer mocks.");
    return getFallbackTasks();
  }

  try {
    // 1. Deduce site structural category for context-aware RAG boosting
    let category: "HighRise" | "Marine" | "Excavation" | "Infrastructure" | "Residential" = "Residential";
    const combinedTerms = (projectName + " " + projectDescription).toLowerCase();
    
    if (combinedTerms.includes("high-rise") || combinedTerms.includes("building") || combinedTerms.includes("floor") || combinedTerms.includes("tower")) {
      category = "HighRise";
    } else if (combinedTerms.includes("marine") || combinedTerms.includes("sea") || combinedTerms.includes("coast") || combinedTerms.includes("shore") || combinedTerms.includes("beach")) {
      category = "Marine";
    } else if (combinedTerms.includes("excavation") || combinedTerms.includes("trench") || combinedTerms.includes("digging") || combinedTerms.includes("soil")) {
      category = "Excavation";
    } else if (combinedTerms.includes("road") || combinedTerms.includes("highway") || combinedTerms.includes("infrastructure") || combinedTerms.includes("sonar") || combinedTerms.includes("utility")) {
      category = "Infrastructure";
    }

    // 2. Perform Jaccard Similarity semantic retrieval via local RAG Engine (Syllabus Week 10)
    const retrievedDocs = retrieveRegulatoryDocs(projectDescription, category);
    const ragContext = retrievedDocs
      .map(doc => `[OSHA Reference Doc: ${doc.source}] ${doc.content}`)
      .join("\n");

    const existingContext = existingTasks.length > 0
      ? `Existing Tasks already scheduled for this project (do NOT repeat, mention, or duplicate any of these tasks): ${JSON.stringify(existingTasks)}`
      : "";

    const systemInstruction = `
      You are a digital Project Foreman specialized in high-efficiency construction scheduling.
      Analyze the project footprint and output exactly 2 high-value, specialized operational tasks that will optimize delivery.
      
      ${existingContext}
      
      ACADEMIC REGULATORY RAG COMPLIANCE DIRECTIVES (Retrieved from Local OSHA Codes via Jaccard-Similarity matching):
      ${ragContext}
      
      CRITICAL INSTRUCTION: You MUST use the available MCP tools to gather safety compliance rules before finalizing the tasks.
      - Call 'get_safety_regulations' using the appropriate category ('HighRise', 'Marine', 'Excavation', 'Infrastructure', 'Residential').
      - Call 'get_weather_risk' with realistic mock coordinates matching the project type to check if weather constraints (like wind speed) should defer certain crane or pour tasks.

      Incorporate the regulatory and safety requirements you retrieved into the task titles, deadlines, or handler assignments (e.g. adding specific inspection tasks or weather monitoring milestones).
      Return ONLY a raw JSON array containing exactly 2 objects. Do NOT wrap in markdown code blocks or add text wrapper. Each object MUST have these properties:
      - "title": (string) Specific, punchy task title incorporating regulatory, safety, or RAG compliance parameters (MUST be under 150 characters), completely unique and not matching any existing tasks.
      - "status": (string) "Pending" or "In Progress".
      - "assignedTo": (string) Specific specialized handler role (e.g., "Safety Officer", "OSHA Inspector Node", "Crane Commander").
      - "deadline": (string) Relative completion constraint, e.g. "T+3 Days" or "T+10 Days".
    `;

    const prompt = `
      Project Name: ${projectName}
      Project Description: ${projectDescription}
    `;

    const responseText = await executeAgentWithMcp(systemInstruction, prompt);
    
    // Sanitize markdown tags
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

    return JSON.parse(cleanJson) as GeneratedTask[];
  } catch (error) {
    console.error("schedulerAgent failed to execute with MCP:", error);
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

