#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { coreToolNames, serverName, serverVersion, toolProfile } from "./catalog.js";
import { registerPrompts } from "./prompts.js";
import { registerResources } from "./resources.js";
import { officialInfo, quickstartWorkflow, samples } from "./samples.js";
import { buildOfficialApiContract, buildOfficialApiContractMarkdown, registerTools } from "./tools.js";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const officialOpenApiPath = path.join(packageRoot, "docs", "openapi", "easyar-mcp-account-api.openapi.json");

const server = new McpServer({
  name: serverName,
  version: serverVersion
});

const registerTool = (server.tool as (...args: any[]) => unknown).bind(server);
(server as any).tool = (name: string, ...args: any[]) => {
  if (toolProfile === "core" && !coreToolNames.has(name)) {
    return undefined;
  }
  return registerTool(name, ...args);
};

registerResources(server, {
  samples,
  officialInfo,
  officialOpenApiPath,
  packageRoot,
  quickstartWorkflow,
  buildOfficialApiContract,
  buildOfficialApiContractMarkdown
});
registerPrompts(server);
registerTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
