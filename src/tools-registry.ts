import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createToolRegistrar, type ToolRegistrar } from "./tool-handler.js";
import { registerAndroidDeviceTools } from "./tool-register-android-device.js";
import { registerClientReleaseTools } from "./tool-register-client-release.js";
import { registerDeviceEvidenceTools } from "./tool-register-device-evidence.js";
import { registerGuidesWorkflowTools } from "./tool-register-guides-workflow.js";
import { registerLocalDiagnosticsTools } from "./tool-register-local-diagnostics.js";
import { registerMiniProgramSampleTools } from "./tool-register-miniprogram-samples.js";
import { registerSampleArtifactTools } from "./tool-register-sample-artifacts.js";
import { registerStatusAccountTools } from "./tool-register-status-account.js";
import { registerUnityProgrammingTools } from "./tool-register-unity-programming.js";

export function registerTools(server: McpServer, options: { shouldRegisterTool?: (name: string) => boolean } = {}) {
  const guardedRegisterTool = createToolRegistrar((server.tool as ToolRegistrar).bind(server), options);
  const registerTool = ((name: string, ...args: any[]) => guardedRegisterTool(name, ...args)) as typeof server.tool;

  registerStatusAccountTools(registerTool);
  registerClientReleaseTools(registerTool);
  registerGuidesWorkflowTools(registerTool);
  registerSampleArtifactTools(registerTool);
  registerMiniProgramSampleTools(registerTool);
  registerDeviceEvidenceTools(registerTool);
  registerLocalDiagnosticsTools(registerTool);
  registerUnityProgrammingTools(registerTool);
  registerAndroidDeviceTools(registerTool);
}
