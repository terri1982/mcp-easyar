#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { coreToolNames, serverName, serverVersion, toolProfile } from "./catalog.js";
import { officialOpenApiPath, packageRoot } from "./paths.js";
import { registerPrompts } from "./prompts.js";
import { registerResources } from "./resources.js";
import { officialInfo, quickstartWorkflow, samples } from "./samples.js";
import { buildOfficialApiContract, buildOfficialApiContractMarkdown, registerTools } from "./tools.js";

const server = new McpServer({
  name: serverName,
  version: serverVersion
});

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
registerTools(server, {
  shouldRegisterTool: (name) => toolProfile !== "core" || coreToolNames.has(name)
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
