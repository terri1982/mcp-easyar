import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools as registerEasyARTools } from "./tools-registry.js";

export { buildOfficialApiContract, buildOfficialApiContractMarkdown } from "./tool-services.js";

export function registerTools(server: McpServer, options: { shouldRegisterTool?: (name: string) => boolean } = {}) {
  registerEasyARTools(server, options);
}
