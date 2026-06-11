import { spawn } from "node:child_process";

const root = process.cwd();
const projectPath = nonEmpty(process.env.EASYAR_CANARY_PROJECT_PATH)
  ?? nonEmpty(process.env.EASYAR_RELEASE_PROJECT_PATH);
const platform = nonEmpty(process.env.EASYAR_CANARY_PLATFORM)
  ?? nonEmpty(process.env.EASYAR_RELEASE_PLATFORM)
  ?? "android";

try {
  console.log("mcp-easyar official API canary");
  if (!["android", "ios"].includes(platform)) {
    throw new Error(`EASYAR_CANARY_PLATFORM/EASYAR_RELEASE_PLATFORM must be "android" or "ios", got "${platform}".`);
  }
  if (!projectPath) {
    throw new Error("Set EASYAR_CANARY_PROJECT_PATH or EASYAR_RELEASE_PROJECT_PATH to a Unity project with focused sample evidence.");
  }

  const client = startMcp();
  try {
    await client.request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "mcp-easyar-official-api-canary",
        version: "1.0.0"
      }
    });
    client.notify("notifications/initialized", {});

    const account = await callTool(client, "easyar_check_account", {});
    const imageAccess = await callTool(client, "easyar_check_official_access", {
      projectPath,
      sampleId: "image-tracking",
      platform,
      packageKind: "unity-samples"
    });
    const cloudAccess = await callTool(client, "easyar_check_official_access", {
      projectPath,
      sampleId: "cloud-recognition",
      platform,
      packageKind: "unity-samples"
    });
    const production = await callTool(client, "easyar_production_validation", {
      projectPath,
      platform,
      verificationEvidence: "passed"
    });

    const summary = {
      account: Boolean(account.ok),
      imageTrackingOfficialAccess: Boolean(imageAccess.readyForOfficialContent),
      cloudRecognitionOfficialAccess: Boolean(cloudAccess.readyForOfficialContent),
      productionReady: Boolean(production.productionReady),
      blockers: [
        ...safeBlockerIds(imageAccess.blockers),
        ...safeBlockerIds(cloudAccess.blockers),
        ...safeBlockerIds(production.blockers)
      ]
    };
    summary.blockers = Array.from(new Set(summary.blockers));

    console.log(`Account check: ${summary.account ? "ok" : "blocked"}`);
    console.log(`Image Tracking official access: ${summary.imageTrackingOfficialAccess ? "ok" : "blocked"}`);
    console.log(`Cloud Recognition official access: ${summary.cloudRecognitionOfficialAccess ? "ok" : "blocked"}`);
    console.log(`Production validation: ${summary.productionReady ? "ready" : "blocked"}`);
    console.log(`Blockers: ${summary.blockers.length > 0 ? summary.blockers.join(", ") : "none"}`);

    if (!summary.account || !summary.imageTrackingOfficialAccess || !summary.cloudRecognitionOfficialAccess || !summary.productionReady) {
      throw new Error("Official API canary failed. Resolve the blocker ids above and rerun.");
    }

    console.log("Official API canary passed.");
  } finally {
    client.stop();
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function startMcp() {
  const child = spawn(process.execPath, ["dist/index.js"], {
    cwd: root,
    env: {
      ...process.env,
      EASYAR_API_BASE_URL: process.env.EASYAR_API_BASE_URL ?? "https://www.easyar.cn"
    },
    stdio: ["pipe", "pipe", "pipe"]
  });
  let nextId = 1;
  const pending = new Map();
  let stdoutBuffer = "";
  let stderr = "";

  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdoutBuffer += chunk;
    const lines = stdoutBuffer.split(/\r?\n/);
    stdoutBuffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }
      const message = JSON.parse(line);
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

  return {
    request(method, params, timeoutMs = 120000) {
      const id = nextId++;
      child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`Timed out waiting for ${method}. ${stderr.trim()}`));
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
    },
    notify(method, params) {
      child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
    },
    stop() {
      child.kill();
      if (stderr.trim()) {
        console.error(stderr.trim());
      }
    }
  };
}

async function callTool(client, name, args) {
  const response = await client.request("tools/call", {
    name,
    arguments: args
  });
  const text = response.result.content.map((item) => item.text ?? "").join("\n");
  return JSON.parse(text);
}

function safeBlockerIds(blockers) {
  return Array.isArray(blockers)
    ? blockers.map((blocker) => blocker?.id).filter((id) => typeof id === "string" && id.length > 0)
    : [];
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}
