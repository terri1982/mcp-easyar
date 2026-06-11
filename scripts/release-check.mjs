import { spawn } from "node:child_process";

const root = process.cwd();
const requireProductionReady = process.env.EASYAR_RELEASE_REQUIRE_PRODUCTION_READY === "1";
const releaseProjectPath = nonEmpty(process.env.EASYAR_RELEASE_PROJECT_PATH);
const releaseEvidencePath = nonEmpty(process.env.EASYAR_RELEASE_EVIDENCE_PATH);
const releasePlatform = nonEmpty(process.env.EASYAR_RELEASE_PLATFORM) ?? "android";
const verificationCommands = [
  ["npm", ["run", "typecheck"]],
  ["npm", ["test"]],
  ["npm", ["run", "bin:smoke"]],
  ["npm", ["run", "install:check"]],
  ["npm", ["run", "package:smoke"]],
  ["npm", ["run", "pack:check"]],
  ["npm", ["run", "security:check"]]
];

try {
  console.log("mcp-easyar release check");
  if (!["android", "ios"].includes(releasePlatform)) {
    throw new Error(`EASYAR_RELEASE_PLATFORM must be "android" or "ios", got "${releasePlatform}".`);
  }
  for (const [command, args] of verificationCommands) {
    await run(command, args, { cwd: root, inherit: true });
  }

  const productionValidationArgs = {
    verificationEvidence: "passed",
    platform: releasePlatform
  };
  if (releaseProjectPath) {
    productionValidationArgs.projectPath = releaseProjectPath;
  }
  if (releaseEvidencePath) {
    productionValidationArgs.focusedEvidencePath = releaseEvidencePath;
  }
  console.log(`Production validation project: ${releaseProjectPath ?? "not provided"}`);
  console.log(`Production validation evidence: ${releaseEvidencePath ?? "not provided"}`);
  console.log(`Production validation platform: ${releasePlatform}`);
  const productionValidation = await callMcpTool("easyar_production_validation", productionValidationArgs);
  const validationText = extractText(productionValidation);
  const validation = JSON.parse(validationText);
  console.log(`Production ready: ${validation.productionReady ? "yes" : "no"}`);
  console.log(`Local-key MVP ready: ${validation.localKeyMvpReady ? "yes" : "no"}`);
  console.log(`Blockers: ${Array.isArray(validation.blockers) ? validation.blockers.length : "unknown"}`);

  if (!validation.productionReady) {
    const blockerIds = Array.isArray(validation.blockers)
      ? validation.blockers.map((blocker) => blocker.id).join(", ")
      : "unknown";
    console.log(`Production blockers: ${blockerIds}`);
    if (requireProductionReady) {
      throw new Error("Production readiness is required but easyar_production_validation is not ready.");
    }
    console.log("Package/repository checks passed. Production readiness is incomplete; set EASYAR_RELEASE_REQUIRE_PRODUCTION_READY=1 to enforce the final gate.");
  } else {
    console.log("Release check passed with production readiness evidence.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n$ ${command} ${args.join(" ")}`);
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: {
        ...process.env,
        EASYAR_API_BASE_URL: process.env.EASYAR_API_BASE_URL ?? "https://www.easyar.cn"
      },
      stdio: options.inherit ? "inherit" : ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    if (!options.inherit) {
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => {
        stdout += chunk;
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk;
      });
    }
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error([
        `Command failed: ${command} ${args.join(" ")}`,
        `Exit code: ${code}`,
        stdout.trim(),
        stderr.trim()
      ].filter(Boolean).join("\n")));
    });
  });
}

async function callMcpTool(name, args) {
  const officialEndpointEnv = requireProductionReady
    ? {}
    : {
        EASYAR_ACCOUNT_STATUS_ENDPOINT: "",
        EASYAR_LICENSE_VALIDATE_ENDPOINT: "",
        EASYAR_DOWNLOADS_ENDPOINT: "",
        EASYAR_CLOUD_CREDENTIALS_ENDPOINT: "",
        EASYAR_API_TOKEN: ""
      };
  const child = spawn(process.execPath, ["dist/index.js"], {
    cwd: root,
    env: {
      ...process.env,
      ...officialEndpointEnv,
      EASYAR_API_BASE_URL: process.env.EASYAR_API_BASE_URL ?? "https://www.easyar.cn"
    },
    stdio: ["pipe", "pipe", "pipe"]
  });
  let nextId = 1;
  const pending = new Map();
  let stderr = "";
  let stdoutBuffer = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdoutBuffer += chunk;
    const parsed = takeJsonMessages(stdoutBuffer);
    stdoutBuffer = parsed.rest;
    for (const message of parsed.messages) {
      if (message.id && pending.has(message.id)) {
        pending.get(message.id)(message);
        pending.delete(message.id);
      }
    }
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  child.on("close", (code) => {
    for (const [id, resolve] of pending) {
      resolve({
        id,
        error: {
          code: -32000,
          message: `MCP child exited before responding. Exit code: ${code}. ${stderr.trim()}`
        }
      });
    }
    pending.clear();
  });

  try {
    await request(child, pending, nextId++, "initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "mcp-easyar-release-check",
        version: "1.0.0"
      }
    });
    notify(child, "notifications/initialized", {});
    return await request(child, pending, nextId++, "tools/call", {
      name,
      arguments: args
    }, 120000);
  } finally {
    child.kill();
    if (stderr.trim()) {
      console.error(stderr.trim());
    }
  }
}

function request(child, pending, id, method, params, timeoutMs = 30000) {
  if (child.exitCode !== null || child.killed) {
    return Promise.reject(new Error(`MCP child is not running for ${method}.`));
  }
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timed out waiting for ${method}`));
    }, timeoutMs);
    pending.set(id, (message) => {
      clearTimeout(timeout);
      if (message.error) {
        reject(new Error(JSON.stringify(message.error)));
        return;
      }
      resolve(message);
    });
  });
}

function notify(child, method, params) {
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
}

function extractText(response) {
  return response.result.content.map((item) => item.text ?? "").join("\n");
}

function takeJsonMessages(buffer) {
  const messages = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;
  let consumedUntil = 0;

  for (let index = 0; index < buffer.length; index += 1) {
    const char = buffer[index];
    if (start === -1) {
      if (char === "{") {
        start = index;
        depth = 1;
      } else {
        consumedUntil = index + 1;
      }
      continue;
    }

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }
    if (char === "{") {
      depth += 1;
      continue;
    }
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        const raw = buffer.slice(start, index + 1);
        messages.push(JSON.parse(raw));
        consumedUntil = index + 1;
        start = -1;
      }
    }
  }

  return {
    messages,
    rest: buffer.slice(start === -1 ? consumedUntil : start)
  };
}
