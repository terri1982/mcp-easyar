import { createServer } from "node:http";

const host = process.env.EASYAR_STUB_HOST ?? "127.0.0.1";
const port = Number.parseInt(process.env.EASYAR_STUB_PORT ?? "8787", 10);
const expectedToken = process.env.EASYAR_STUB_TOKEN ?? "fixture-token";

const server = createServer(async (request, response) => {
  try {
    const body = await readJsonBody(request);
    if (!isAuthorized(request)) {
      sendJson(response, 401, {
        ok: false,
        error: "unauthorized",
        message: "Missing or invalid bearer token."
      });
      return;
    }

    if (request.method === "GET" && request.url === "/mcp/account/status") {
      sendJson(response, 200, {
        ok: true,
        account: {
          id: "acct-stub",
          registered: true,
          status: "active",
          emailMasked: "registered@example.invalid"
        },
        entitlements: ["easyar-sense", "cloud-recognition"]
      });
      return;
    }

    if (request.method === "POST" && request.url === "/mcp/license/validate") {
      const licensePresent = typeof body?.licenseKey === "string" && body.licenseKey.trim().length > 0;
      const bundlePresent = typeof body?.bundleIdentifier === "string" && body.bundleIdentifier.trim().length > 0;
      sendJson(response, 200, {
        ok: licensePresent && bundlePresent,
        license: {
          valid: licensePresent,
          product: "EasyAR Sense Unity Plugin",
          bundleIdentifierMatches: bundlePresent,
          platformAllowed: body?.platform === "android" || body?.platform === "ios",
          features: ["image-tracking", "cloud-recognition"]
        }
      });
      return;
    }

    if (request.method === "POST" && request.url === "/mcp/downloads") {
      sendJson(response, 200, {
        ok: true,
        packages: [
          {
            name: "EasyAR Sense Unity Plugin",
            version: "4002.0.0",
            sampleId: body?.sampleId ?? "unknown",
            packageKind: body?.packageKind ?? "unity-samples",
            url: "https://www.easyar.cn/downloads/stub/easyar-sense-unity-plugin"
          }
        ]
      });
      return;
    }

    if (request.method === "POST" && request.url === "/mcp/cloud-recognition/credentials") {
      sendJson(response, 200, {
        ok: true,
        cloudRecognition: {
          appId: "stub-cloud-app-id",
          serverAddress: "https://stub-crs.easyar.invalid:8443",
          apiKeyPresent: true,
          apiSecretPresent: true,
          appKeyPresent: true,
          appSecretPresent: true,
          serviceRegion: "stub",
          targetLibraryCount: 1,
          dashboardUrl: "https://www.easyar.cn/developers/cloud-recognition/stub"
        }
      });
      return;
    }

    sendJson(response, 404, {
      ok: false,
      error: "not-found",
      message: "Unknown official API stub route."
    });
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error: "stub-error",
      message: error instanceof Error ? error.message : "Unknown stub error."
    });
  }
});

server.listen(port, host, () => {
  const base = `http://${host}:${port}`;
  console.log("mcp-easyar official API stub");
  console.log(`Base URL: ${base}`);
  console.log("Export these variables in another shell:");
  console.log(`export EASYAR_API_BASE_URL=${base}`);
  console.log("export EASYAR_API_TOKEN=<stub token>");
  console.log(`export EASYAR_ACCOUNT_STATUS_ENDPOINT=${base}/mcp/account/status`);
  console.log(`export EASYAR_LICENSE_VALIDATE_ENDPOINT=${base}/mcp/license/validate`);
  console.log(`export EASYAR_DOWNLOADS_ENDPOINT=${base}/mcp/downloads`);
  console.log(`export EASYAR_CLOUD_CREDENTIALS_ENDPOINT=${base}/mcp/cloud-recognition/credentials`);
  console.log("");
  console.log("Use EASYAR_STUB_TOKEN to set the expected bearer token. The default token is fixture-token.");
  console.log("This stub is for local contract validation only; do not use it as a production EasyAR account service.");
});

function isAuthorized(request) {
  return request.headers.authorization === `Bearer ${expectedToken}`;
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("error", reject);
    request.on("end", () => {
      const text = Buffer.concat(chunks).toString("utf8").trim();
      if (!text) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(text));
      } catch {
        reject(new Error("Request body is not valid JSON."));
      }
    });
  });
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "content-type": "application/json",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(body));
}
