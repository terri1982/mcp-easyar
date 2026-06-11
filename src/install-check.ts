#!/usr/bin/env node
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { fileURLToPath } from "node:url";

const requiredTools = [
  "easyar_server_status",
  "easyar_generate_client_config",
  "easyar_first_run_guide",
  "easyar_write_official_api_handoff",
  "easyar_account_onboarding",
  "easyar_write_first_run_guide",
  "easyar_write_project_handoff",
  "easyar_write_remaining_work_report",
  "easyar_write_local_config_handoff",
  "easyar_write_local_config_form",
  "easyar_write_config_integration_audit",
  "easyar_write_focused_preflight",
  "easyar_write_focused_handoff_pack",
  "easyar_create_local_config_bridge",
  "easyar_write_device_run_result_form",
  "easyar_write_completion_report",
  "easyar_write_focused_scope_status",
  "easyar_write_production_validation",
  "easyar_generate_sample_expansion_plan",
  "easyar_unity_environment"
];

const requiredPrompts = [
  "easyar-run-image-tracking",
  "easyar-run-cloud-recognition",
  "easyar-validate-official-endpoints",
  "easyar-close-focused-scope",
  "easyar-unity-programming-assistant"
];

const requiredResources = [
  "easyar://official/api-contract",
  "easyar://official/openapi",
  "easyar://client/acceptance",
  "easyar://acceptance/fresh-project",
  "easyar://status/current",
  "easyar://status/remaining-work",
  "easyar://install/github-release",
  "easyar://release/local-key-mvp",
  "easyar://roadmap",
  "easyar://roadmap/full-goal",
  "easyar://workflow/focused-scope",
  "easyar://workflow/programming",
  "easyar://workflow/quickstart"
];

type JsonRpcMessage = {
  id?: number;
  result?: unknown;
  error?: unknown;
};

type PendingRequest = {
  resolve: (message: JsonRpcMessage) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
};

const rawArgs = process.argv.slice(2);
if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
  printHelp();
  process.exit(0);
}

const launch = resolveLaunch(rawArgs);
const child = spawn(launch.command, launch.args, {
  env: {
    ...process.env,
    EASYAR_API_BASE_URL: process.env.EASYAR_API_BASE_URL ?? "https://www.easyar.cn"
  },
  stdio: ["pipe", "pipe", "pipe"]
});

let nextId = 1;
const pending = new Map<number, PendingRequest>();
let stderr = "";
let stdoutBuffer = "";

child.stderr.on("data", (chunk) => {
  stderr += chunk.toString();
});

child.stdout.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  stdoutBuffer += chunk;
  const lines = stdoutBuffer.split(/\r?\n/);
  stdoutBuffer = lines.pop() ?? "";
  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }
    const message = JSON.parse(line) as JsonRpcMessage;
    if (typeof message.id === "number") {
      const request = pending.get(message.id);
      if (request) {
        clearTimeout(request.timeout);
        pending.delete(message.id);
        request.resolve(message);
      }
    }
  }
});

try {
  await request(child, "initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: {
      name: "easyar-mcp-install-check",
      version: "0.1.0"
    }
  });
  notify(child, "notifications/initialized", {});

  const toolNames = await listTools(child);
  const promptNames = await listPrompts(child);
  const resourceTexts = await readResources(child, requiredResources);
  const statusText = await callToolText(child, "easyar_server_status", {});

  const missingTools = requiredTools.filter((tool) => !toolNames.includes(tool));
  const missingPrompts = requiredPrompts.filter((prompt) => !promptNames.includes(prompt));
  const missingResources = requiredResources.filter((uri) => !resourceTexts.get(uri));
  const checks = [
    check("server-name", statusText.includes('"name": "mcp-easyar"'), "easyar_server_status returns mcp-easyar."),
    check("focused-scope", statusText.includes("image-tracking") && statusText.includes("cloud-recognition"), "Focused samples are discoverable."),
    check("tools", missingTools.length === 0, missingTools.length === 0 ? "Required tools are listed." : `Missing tools: ${missingTools.join(", ")}.`),
    check("prompts", missingPrompts.length === 0, missingPrompts.length === 0 ? "Required prompts are listed." : `Missing prompts: ${missingPrompts.join(", ")}.`),
    check("resources", missingResources.length === 0, missingResources.length === 0 ? "Required resources are readable." : `Missing resources: ${missingResources.join(", ")}.`),
    check(
      "official-api-contract",
      resourceTexts.get("easyar://official/api-contract")?.includes("mcp-easyar Official API Contract") ?? false,
      "Official API contract resource is readable."
    ),
    check(
      "official-openapi-contract",
      resourceTexts.get("easyar://official/openapi")?.includes("\"openapi\": \"3.1.0\"") ?? false,
      "Official OpenAPI contract resource is readable."
    ),
    check(
      "client-acceptance",
      resourceTexts.get("easyar://client/acceptance")?.includes("mcp-easyar Client Acceptance Checklist") ?? false,
      "Client acceptance checklist resource is readable."
    ),
    check(
      "fresh-project-acceptance",
      resourceTexts.get("easyar://acceptance/fresh-project")?.includes("mcp-easyar Fresh Project Acceptance") ?? false,
      "Fresh Unity project acceptance resource is readable."
    ),
    check(
      "current-status",
      resourceTexts.get("easyar://status/current")?.includes("mcp-easyar Current Status") ?? false,
      "Current status resource is readable."
    ),
    check(
      "remaining-work-status",
      resourceTexts.get("easyar://status/remaining-work")?.includes("mcp-easyar Remaining Work") ?? false,
      "Remaining work status resource is readable."
    ),
    check(
      "github-release-install",
      resourceTexts.get("easyar://install/github-release")?.includes("Install mcp-easyar From GitHub Release") ?? false,
      "GitHub Release install guide resource is readable."
    ),
    check(
      "local-key-release-notes",
      resourceTexts.get("easyar://release/local-key-mvp")?.includes("mcp-easyar local-key MVP") ?? false,
      "Local-key MVP release notes resource is readable."
    ),
    check(
      "roadmap",
      resourceTexts.get("easyar://roadmap")?.includes("mcp-easyar Roadmap") ?? false,
      "Roadmap resource is readable."
    ),
    check(
      "full-goal-plan",
      resourceTexts.get("easyar://roadmap/full-goal")?.includes("mcp-easyar Full Goal Plan") ?? false,
      "Full goal plan resource is readable."
    ),
    check(
      "focused-scope-workflow",
      resourceTexts.get("easyar://workflow/focused-scope")?.includes("easyar_write_focused_scope_status") ?? false,
      "Focused scope workflow resource is readable."
    ),
    check(
      "programming-workflow",
      resourceTexts.get("easyar://workflow/programming")?.includes("easyar_write_code_plan") ?? false,
      "Programming workflow resource is readable."
    )
  ];
  const failed = checks.filter((item) => !item.ok);

  console.log(`mcp-easyar install check`);
  console.log(`Command: ${[launch.command, ...launch.args].join(" ")}`);
  console.log("");
  for (const item of checks) {
    console.log(`${item.ok ? "OK" : "FAIL"} ${item.id}: ${item.detail}`);
  }
  console.log("");
  console.log(`Tools listed: ${toolNames.length}`);
  console.log(`Prompts listed: ${promptNames.length}`);
  console.log(`Resources checked: ${resourceTexts.size}`);
  console.log("");
  console.log("Secret values are not required for this install check and are not printed.");

  child.kill();
  if (failed.length > 0) {
    process.exit(1);
  }
} catch (error) {
  child.kill();
  console.error("mcp-easyar install check failed.");
  if (stderr.trim()) {
    console.error(stderr.trim());
  }
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

function resolveLaunch(args: string[]) {
  const filtered = args[0] === "--" ? args.slice(1) : args;
  if (filtered.length === 0) {
    const currentFile = fileURLToPath(import.meta.url);
    return {
      command: process.execPath,
      args: [path.join(path.dirname(currentFile), "index.js")]
    };
  }
  const [command, ...rest] = filtered;
  if (command.endsWith(".js")) {
    return {
      command: process.execPath,
      args: [command, ...rest]
    };
  }
  return {
    command,
    args: rest
  };
}

function request(childProcess: ChildProcessWithoutNullStreams, method: string, params: unknown): Promise<JsonRpcMessage> {
  const id = nextId++;
  childProcess.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timed out waiting for ${method}`));
    }, 10000);
    pending.set(id, {
      resolve: (message) => {
        if (message.error) {
          reject(new Error(JSON.stringify(message.error)));
        } else {
          resolve(message);
        }
      },
      reject,
      timeout
    });
  });
}

function notify(childProcess: ChildProcessWithoutNullStreams, method: string, params: unknown) {
  childProcess.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
}

async function listTools(childProcess: ChildProcessWithoutNullStreams): Promise<string[]> {
  const message = await request(childProcess, "tools/list", {});
  const result = asRecord(message.result);
  const tools = Array.isArray(result.tools) ? result.tools : [];
  return tools.map((tool) => asRecord(tool).name).filter(isString);
}

async function listPrompts(childProcess: ChildProcessWithoutNullStreams): Promise<string[]> {
  const message = await request(childProcess, "prompts/list", {});
  const result = asRecord(message.result);
  const prompts = Array.isArray(result.prompts) ? result.prompts : [];
  return prompts.map((prompt) => asRecord(prompt).name).filter(isString);
}

async function readResources(childProcess: ChildProcessWithoutNullStreams, uris: string[]): Promise<Map<string, string>> {
  const output = new Map<string, string>();
  for (const uri of uris) {
    const message = await request(childProcess, "resources/read", { uri });
    const result = asRecord(message.result);
    const contents = Array.isArray(result.contents) ? result.contents : [];
    const text = contents.map((item) => asRecord(item).text).filter(isString).join("\n");
    if (text) {
      output.set(uri, text);
    }
  }
  return output;
}

async function callToolText(childProcess: ChildProcessWithoutNullStreams, name: string, args: Record<string, unknown>): Promise<string> {
  const message = await request(childProcess, "tools/call", {
    name,
    arguments: args
  });
  const result = asRecord(message.result);
  const content = Array.isArray(result.content) ? result.content : [];
  return content.map((item) => asRecord(item).text).filter(isString).join("\n");
}

function check(id: string, ok: boolean, detail: string) {
  return { id, ok, detail };
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function printHelp() {
  console.log([
    "mcp-easyar install check",
    "",
    "Usage:",
    "  easyar-mcp-check",
    "  easyar-mcp-check easyar-mcp",
    "  easyar-mcp-check node /path/to/dist/index.js",
    "  easyar-mcp-check /path/to/dist/index.js",
    "",
    "The check starts an MCP server, lists tools/prompts, reads key resources, and prints a non-secret readiness summary."
  ].join("\n"));
}
