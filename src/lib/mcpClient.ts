import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createConstructionMcpServer } from "./mcpServer";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Dynamic mapper to translate standard JSON Schema types to Google Generative AI SchemaTypes
function mapJsonTypeToGemini(type: string): SchemaType {
  switch (type.toLowerCase()) {
    case "string":
      return SchemaType.STRING;
    case "number":
    case "integer":
      return SchemaType.NUMBER;
    case "boolean":
      return SchemaType.BOOLEAN;
    case "array":
      return SchemaType.ARRAY;
    case "object":
      return SchemaType.OBJECT;
    default:
      return SchemaType.STRING;
  }
}

// Converts standard JSON Schema parameter objects into strict Gemini Function Declarations
function convertMcpSchemaToGemini(inputSchema: any) {
  const properties: Record<string, any> = {};
  
  if (inputSchema && inputSchema.properties) {
    for (const [key, value] of Object.entries(inputSchema.properties)) {
      const val = value as any;
      properties[key] = {
        type: mapJsonTypeToGemini(val.type || "string"),
        description: val.description || "",
      };
      if (Array.isArray(val.enum)) {
        properties[key].enum = val.enum;
      }
    }
  }

  return {
    type: SchemaType.OBJECT,
    properties,
    required: inputSchema?.required || [],
  };
}

/**
 * High-performance adapter that couples the Gemini LLM with our local MCP Server.
 * Automatically handles the entire tool discovery, translation, chat staging, and execution loops.
 */
export async function executeAgentWithMcp(
  systemInstruction: string,
  userPrompt: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined. Falling back to local offline mock synthesis.");
    throw new Error("GEMINI_API_KEY is missing from execution environment.");
  }

  // 1. Establish linked transports for in-process client-server connection
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  // 2. Initialize fresh Client and Server instances to guarantee thread-safe execution
  const client = new Client(
    { name: "AgentMcpClient", version: "1.0.0" },
    { capabilities: {} }
  );
  
  const server = createConstructionMcpServer();

  // Connect both endpoints to their respective transports in parallel
  await Promise.all([
    client.connect(clientTransport),
    server.connect(serverTransport),
  ]);

  try {
    // 3. Retrieve available tools from our MCP Server
    const mcpToolsResult = await client.listTools();
    const mcpTools = mcpToolsResult.tools || [];

    // 4. Translate MCP tools to native Gemini function declarations
    const functionDeclarations = mcpTools.map((tool) => {
      return {
        name: tool.name,
        description: tool.description || "",
        parameters: convertMcpSchemaToGemini(tool.inputSchema),
      };
    });

    // 5. Build the Gemini generative model with the loaded tools
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      systemInstruction: systemInstruction,
      tools: functionDeclarations.length > 0 ? [{ functionDeclarations }] : undefined,
    });

    // 6. Spawn chat orchestrator session and submit user prompt
    const chat = model.startChat();
    let result = await chat.sendMessage(userPrompt);

    // Loop variables to resolve nested agent tool call layers (up to max depth 5)
    let functionCalls = result.response.functionCalls();
    let iterations = 0;
    const maxIterations = 5;

    while (functionCalls && functionCalls.length > 0 && iterations < maxIterations) {
      iterations++;
      const toolResponses: any[] = [];

      for (const call of functionCalls) {
        console.log(`[MCP Bridge] Model invoked tool: ${call.name} with arguments:`, call.args);

        // Dispatch call dynamically to the local MCP Server
        const toolExecutionResult = await client.callTool({
          name: call.name,
          arguments: call.args as Record<string, unknown>,
        });

        // Parse tool result text
        let contentText = "";
        if (Array.isArray(toolExecutionResult.content)) {
          contentText = toolExecutionResult.content
            .map((block: any) => block.text)
            .join("\n");
        } else {
          contentText = JSON.stringify(toolExecutionResult.content || "");
        }

        // Add to response stream
        toolResponses.push({
          functionResponse: {
            name: call.name,
            response: { content: contentText },
          },
        });
      }

      // Return executing values to the model so it can incorporate context in subsequent iterations
      result = await chat.sendMessage(toolResponses);
      functionCalls = result.response.functionCalls();
    }

    return result.response.text() || "Agent execution failed to generate content.";
  } catch (error) {
    console.error("Gemini MCP execution failed:", error);
    throw error;
  } finally {
    // 7. Guaranteed cleanup and tear-down of the linked transports
    await Promise.all([
      client.close().catch(() => {}),
      server.close().catch(() => {}),
    ]);
  }
}
