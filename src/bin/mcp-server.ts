#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createConstructionMcpServer } from "../lib/mcpServer";

async function main() {
  const transport = new StdioServerTransport();
  const server = createConstructionMcpServer();
  // Connect the new server instance to the Stdio transport channel
  await server.connect(transport);
  console.error("🚧 Construction Intelligence MCP Server is active and listening over Stdio transport!");
}

main().catch((error) => {
  console.error("MCP Server execution error:", error);
  process.exit(1);
});
