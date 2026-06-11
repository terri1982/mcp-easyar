import { spawn } from "node:child_process";

const port = 18787;
const baseUrl = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ["scripts/official-api-stub.mjs"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    EASYAR_STUB_HOST: "127.0.0.1",
    EASYAR_STUB_PORT: String(port),
    EASYAR_STUB_TOKEN: "fixture-token"
  },
  stdio: ["ignore", "pipe", "pipe"]
});

let stdout = "";
let stderr = "";
child.stdout.setEncoding("utf8");
child.stderr.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  stdout += chunk;
});
child.stderr.on("data", (chunk) => {
  stderr += chunk;
});

try {
  await waitForStub(baseUrl);
  const unauthorized = await fetch(`${baseUrl}/mcp/account/status`);
  assert(unauthorized.status === 401, `Expected 401 without bearer token, got ${unauthorized.status}.`);

  await assertOk("GET", "/mcp/account/status");
  await assertOk("POST", "/mcp/license/validate", {
    licenseKey: "fixture-license",
    bundleIdentifier: "com.easyar.fixture",
    platform: "android"
  });
  await assertOk("POST", "/mcp/downloads", {
    sampleId: "image-tracking",
    packageKind: "unity-samples",
    unityVersion: "2022.3.62f3"
  });
  await assertOk("POST", "/mcp/cloud-recognition/credentials", {
    sampleId: "cloud-recognition",
    bundleIdentifier: "com.easyar.fixture",
    platform: "android"
  });

  assert(stdout.includes("official API stub"), "Stub should print startup title.");
  assert(stdout.includes("EASYAR_ACCOUNT_STATUS_ENDPOINT"), "Stub should print endpoint env guidance.");
  assert(!stdout.includes("fixture-token"), "Stub stdout must not print the fixture token value.");
  console.log("Official API stub smoke test passed.");
} catch (error) {
  console.error(stderr);
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  child.kill();
}

async function waitForStub(url) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 5000) {
    try {
      await fetch(`${url}/mcp/account/status`);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error(`Timed out waiting for official API stub at ${url}.`);
}

async function assertOk(method, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      authorization: "Bearer fixture-token",
      ...(body ? { "content-type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  assert(response.ok, `${method} ${path} failed with HTTP ${response.status}.`);
  const json = await response.json();
  assert(json.ok === true, `${method} ${path} returned ok != true.`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
