import { createServer } from "node:http";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const requests = [];
const server = createServer(async (request, response) => {
  const chunks = [];
  request.on("data", (chunk) => chunks.push(chunk));
  request.on("end", () => {
    const bodyText = Buffer.concat(chunks).toString("utf8");
    const body = bodyText ? JSON.parse(bodyText) : null;
    const entry = {
      method: request.method,
      url: request.url,
      authorization: request.headers.authorization,
      body
    };
    requests.push(entry);

    if (request.headers.authorization !== "Bearer fixture-token") {
      sendJson(response, 401, {
        ok: false,
        error: "unauthorized",
        token: "should-not-leak"
      });
      return;
    }

    if (request.method === "GET" && request.url === "/account/status") {
      sendJson(response, 200, {
        ok: true,
        account: {
          id: "acct-fixture",
          registered: true,
          status: "active",
          emailMasked: "user@example.invalid"
        },
        entitlements: ["easyar-sense", "cloud-recognition"],
        apiToken: "should-not-leak"
      });
      return;
    }

    if (request.method === "POST" && request.url === "/license/validate") {
      sendJson(response, 200, {
        ok: true,
        license: {
          valid: body?.licenseKey === "fixture-license",
          product: "EasyAR Sense Unity Plugin",
          bundleIdentifierMatches: body?.bundleIdentifier === "com.easyar.fixture",
          platformAllowed: body?.platform === "android",
          licenseKey: "should-not-leak"
        }
      });
      return;
    }

    if (request.method === "POST" && request.url === "/downloads") {
      sendJson(response, 200, {
        ok: true,
        packages: [
          {
            name: "EasyAR Sense Unity Plugin",
            version: "4002.0.0",
            sampleId: body?.sampleId,
            packageKind: body?.packageKind,
            url: "https://www.easyar.cn/downloads/fixture"
          }
        ]
      });
      return;
    }

    if (request.method === "POST" && request.url === "/cloud/credentials") {
      sendJson(response, 200, {
        ok: true,
        cloudRecognition: {
          appId: "fixture-app-id",
          appKeyPresent: true,
          appSecretPresent: true,
          appKey: "should-not-leak",
          appSecret: "should-not-leak"
        }
      });
      return;
    }

    sendJson(response, 404, {
      ok: false,
      error: "not-found"
    });
  });
});

const baseUrl = await listen(server);
const child = spawn(process.execPath, [path.resolve("dist/index.js")], {
  env: {
    ...process.env,
    EASYAR_API_BASE_URL: baseUrl,
    EASYAR_API_TOKEN: "fixture-token",
    EASYAR_ACCOUNT_STATUS_ENDPOINT: `${baseUrl}/account/status`,
    EASYAR_LICENSE_VALIDATE_ENDPOINT: `${baseUrl}/license/validate`,
    EASYAR_DOWNLOADS_ENDPOINT: `${baseUrl}/downloads`,
    EASYAR_CLOUD_CREDENTIALS_ENDPOINT: `${baseUrl}/cloud/credentials`
  },
  stdio: ["pipe", "pipe", "pipe"]
});

let nextId = 1;
const pending = new Map();
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
    const message = JSON.parse(line);
    const resolver = pending.get(message.id);
    if (resolver) {
      pending.delete(message.id);
      resolver(message);
    }
  }
});

let projectPath = null;
try {
  await request("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: {
      name: "easyar-official-api-fixture-smoke",
      version: "0.0.1"
    }
  });
  notify("notifications/initialized", {});

  const authStatus = await callTool("easyar_auth_status", {});
  assertTextIncludes(authStatus, "\"hasToken\": true");
  assertTextIncludes(authStatus, "\"accountStatusEndpointConfigured\": true");
  assertTextIncludes(authStatus, "fixt...oken");

  const account = await callTool("easyar_check_account", {});
  assertTextIncludes(account, "\"ok\": true");
  assertTextIncludes(account, "\"statusCode\": 200");
  assertTextIncludes(account, "\"apiToken\": \"[redacted]\"");

  const license = await callTool("easyar_validate_license", {
    licenseKey: "fixture-license",
    bundleIdentifier: "com.easyar.fixture",
    platform: "android"
  });
  assertTextIncludes(license, "\"ok\": true");
  assertTextIncludes(license, "\"license\": \"[redacted]\"");

  const downloads = await callTool("easyar_discover_downloads", {
    sampleId: "image-tracking",
    packageKind: "unity-samples"
  });
  assertTextIncludes(downloads, "\"ok\": true");
  assertTextIncludes(downloads, "EasyAR Sense Unity Plugin");

  const cloud = await callTool("easyar_discover_cloud_credentials", {
    sampleId: "cloud-recognition",
    platform: "android"
  });
  assertTextIncludes(cloud, "\"ok\": true");
  assertTextIncludes(cloud, "\"appKey\": \"[redacted]\"");
  assertTextIncludes(cloud, "\"appSecret\": \"[redacted]\"");

  projectPath = await createUnityProject();
  const officialAccess = await callTool("easyar_check_official_access", {
    projectPath,
    sampleId: "cloud-recognition",
    platform: "android",
    packageKind: "unity-samples"
  });
  assertTextIncludes(officialAccess, "\"readyForOfficialContent\": true");
  assertTextIncludes(officialAccess, "\"id\": \"cloud-credentials-discovery\"");
  assertTextIncludes(officialAccess, "\"blockers\": []");

  assert(
    requests.some((entry) => entry.method === "GET" && entry.url === "/account/status"),
    "Fixture should receive account status request"
  );
  assert(
    requests.some((entry) => entry.method === "POST" && entry.url === "/license/validate" && entry.body?.licenseKey === "fixture-license"),
    "Fixture should receive license validation request"
  );
  assert(
    requests.every((entry) => entry.authorization === "Bearer fixture-token"),
    "Every fixture request should include the bearer token"
  );

  await cleanup();
  console.log("Official API fixture smoke test passed.");
} catch (error) {
  console.error(stderr);
  console.error(error);
  await cleanup();
  process.exit(1);
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

function listen(httpServer) {
  return new Promise((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(0, "127.0.0.1", () => {
      const address = httpServer.address();
      if (!address || typeof address === "string") {
        reject(new Error("Could not determine fixture server address."));
        return;
      }
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

function request(method, params) {
  const id = nextId++;
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timed out waiting for ${method}`));
    }, 10000);
    pending.set(id, (message) => {
      clearTimeout(timeout);
      if (message.error) {
        reject(new Error(JSON.stringify(message.error)));
      } else {
        resolve(message);
      }
    });
  });
}

function notify(method, params) {
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
}

function callTool(name, args) {
  return request("tools/call", {
    name,
    arguments: args
  });
}

function assertTextIncludes(response, expected) {
  const text = response.result.content.map((item) => item.text ?? "").join("\n");
  assert(text.includes(expected), `Expected response text to include ${expected}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function createUnityProject() {
  const root = await mkdtemp(path.join(tmpdir(), "easyar-official-fixture-"));
  await mkdir(path.join(root, "Assets"), { recursive: true });
  await mkdir(path.join(root, "Packages"), { recursive: true });
  await mkdir(path.join(root, "ProjectSettings", "EasyAR"), { recursive: true });
  await writeFile(path.join(root, "Packages", "manifest.json"), "{\"dependencies\":{}}\n", "utf8");
  await writeFile(path.join(root, "ProjectSettings", "ProjectVersion.txt"), "m_EditorVersion: 2022.3.62f1\n", "utf8");
  await writeFile(
    path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json"),
    JSON.stringify({
      easyar: {
        licenseKey: "fixture-license"
      },
      unity: {
        bundleIdentifier: "com.easyar.fixture"
      }
    }, null, 2),
    "utf8"
  );
  return root;
}

async function cleanup() {
  child.kill();
  server.close();
  if (projectPath) {
    await rm(projectPath, { recursive: true, force: true });
  }
}
