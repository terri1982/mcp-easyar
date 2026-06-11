import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const releaseTarballUrl = process.env.EASYAR_GITHUB_RELEASE_TARBALL_URL
  ?? "https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.26/mcp-easyar-0.1.0.tgz";
const expectedReleaseTag = process.env.EASYAR_GITHUB_RELEASE_TAG ?? "v0.1.0-local-key.26";
const expectedScopedProgress = process.env.EASYAR_GITHUB_RELEASE_EXPECTED_SCOPED_PROGRESS
  ?? (expectedReleaseTag === "v0.1.0-local-key.25"
    ? "Current scoped objective: about 90%"
    : "Current scoped objective: 100% for the approved Image Tracking and CRS/Cloud Recognition target.");
const expectedLocalKeyProgress = process.env.EASYAR_GITHUB_RELEASE_EXPECTED_LOCAL_KEY_PROGRESS
  ?? (expectedReleaseTag === "v0.1.0-local-key.25"
    ? "Local-key MVP public usability: about 93%"
    : "Local-key MVP public usability: about 95%");
const tempRoot = await mkdtemp(path.join(tmpdir(), "mcp-easyar-github-release-smoke-"));
const consumerDir = path.join(tempRoot, "consumer");

try {
  await mkdir(consumerDir, { recursive: true });
  await writeFile(
    path.join(consumerDir, "package.json"),
    JSON.stringify({
      name: "mcp-easyar-github-release-smoke-consumer",
      version: "0.0.0",
      private: true,
      type: "module"
    }, null, 2),
    "utf8"
  );

  await run("npm", ["install", "--silent", "--no-audit", "--fund=false", releaseTarballUrl], { cwd: consumerDir });

  const binSuffix = process.platform === "win32" ? ".cmd" : "";
  const serverBin = path.join(consumerDir, "node_modules", ".bin", `easyar-mcp${binSuffix}`);
  const checkBin = path.join(consumerDir, "node_modules", ".bin", `easyar-mcp-check${binSuffix}`);
  await access(serverBin, constants.X_OK);
  await access(checkBin, constants.X_OK);

  const check = await run(checkBin, [], { cwd: consumerDir });
  assert(check.stdout.includes("mcp-easyar install check"), "Release check bin should print install-check title.");
  assert(check.stdout.includes("OK tools"), "Release check bin should verify tools.");
  assert(check.stdout.includes("OK prompts"), "Release check bin should verify prompts.");
  assert(check.stdout.includes("OK resources"), "Release check bin should verify resources.");
  assert(check.stdout.includes("OK client-acceptance"), "Release check bin should verify client acceptance resource.");
  assert(check.stdout.includes("OK fresh-project-acceptance"), "Release check bin should verify fresh project acceptance resource.");
  assert(check.stdout.includes("OK current-status"), "Release check bin should verify current status resource.");
  assert(check.stdout.includes("OK remaining-work-status"), "Release check bin should verify remaining work status resource.");
  assert(check.stdout.includes("OK github-release-install"), "Release check bin should verify GitHub Release install resource.");
  assert(check.stdout.includes("OK local-key-release-notes"), "Release check bin should verify local-key release notes resource.");
  assert(check.stdout.includes("OK roadmap"), "Release check bin should verify roadmap resource.");
  assert(check.stdout.includes("Secret values are not required"), "Release install check should state that secrets are not needed.");

  const packageRoot = path.join(consumerDir, "node_modules", "mcp-easyar");
  const installGuide = await readFile(path.join(packageRoot, "docs", "install-from-github-release.md"), "utf8");
  const clientAcceptance = await readFile(path.join(packageRoot, "docs", "CLIENT_ACCEPTANCE.md"), "utf8");
  const freshProjectAcceptance = await readFile(path.join(packageRoot, "docs", "FRESH_PROJECT_ACCEPTANCE.md"), "utf8");
  const currentStatus = await readFile(path.join(packageRoot, "docs", "STATUS.md"), "utf8");
  const remainingWork = await readFile(path.join(packageRoot, "docs", "REMAINING_WORK.md"), "utf8");
  const releaseNotes = await readFile(path.join(packageRoot, "docs", "release-notes", "local-key-mvp.md"), "utf8");
  const codexConfig = await callInstalledTool(serverBin, consumerDir, "easyar_generate_client_config", {
    client: "codex",
    entrypointMode: "package-bin",
    includeTokenPlaceholder: false
  });
  const claudeConfig = await callInstalledTool(serverBin, consumerDir, "easyar_generate_client_config", {
    client: "claude-desktop",
    entrypointMode: "package-bin",
    includeTokenPlaceholder: false
  });
  const codexClientSetup = await callInstalledTool(serverBin, consumerDir, "easyar_check_client_setup", {
    client: "codex",
    entrypointMode: "package-bin",
    includeTokenPlaceholder: false
  });
  const claudeClientSetup = await callInstalledTool(serverBin, consumerDir, "easyar_check_client_setup", {
    client: "claude-desktop",
    entrypointMode: "package-bin",
    includeTokenPlaceholder: false
  });
  assert(installGuide.includes(expectedReleaseTag), "Install guide should point to the expected GitHub Release tag.");
  assert(installGuide.includes("For Codex:"), "Install guide should include a Codex package-bin config section.");
  assert(installGuide.includes("\"command\": \"easyar-mcp\""), "Install guide should use the package-bin easyar-mcp command.");
  assert(installGuide.includes("easyar://acceptance/fresh-project"), "Install guide should point fresh users to the fresh project acceptance resource.");
  assert(clientAcceptance.includes("mcp-easyar Client Acceptance Checklist"), "Package should include client acceptance checklist.");
  assert(clientAcceptance.includes("Package-Bin Client Config"), "Client acceptance checklist should include package-bin config acceptance.");
  assert(clientAcceptance.includes("First Client Calls"), "Client acceptance checklist should include first client calls.");
  assert(freshProjectAcceptance.includes("mcp-easyar Fresh Project Acceptance"), "Package should include fresh project acceptance guide.");
  assert(freshProjectAcceptance.includes("Image Tracking"), "Fresh project guide should include Image Tracking.");
  assert(freshProjectAcceptance.includes("CRS/Cloud Recognition"), "Fresh project guide should include CRS/Cloud Recognition.");
  assert(freshProjectAcceptance.includes("ProjectSettings/EasyAR/easyar.local.json"), "Fresh project guide should include local config path.");
  assert(freshProjectAcceptance.includes("allFocusedSamplesComplete=true"), "Fresh project guide should include focused completion criterion.");
  assert(currentStatus.includes("mcp-easyar Current Status"), "Package should include current status guide.");
  assert(currentStatus.includes(expectedScopedProgress), "Current status guide should include scoped objective progress.");
  assert(currentStatus.includes(expectedLocalKeyProgress), "Current status guide should include local-key MVP progress.");
  assert(remainingWork.includes("mcp-easyar Remaining Work"), "Package should include remaining work guide.");
  assert(remainingWork.includes("Remaining For Current Scoped Target"), "Remaining work guide should include current scoped gaps.");
  assert(remainingWork.includes("Remaining For Full Production Goal"), "Remaining work guide should include production gaps.");
  assert(releaseNotes.includes(expectedReleaseTag), "Release notes should point to the expected GitHub Release tag.");
  assert(releaseNotes.includes("Local-key MVP ready: yes"), "Release notes should state local-key MVP readiness.");
  assert(releaseNotes.includes("Production official API ready: no"), "Release notes should state production API readiness.");
  assert(codexConfig.includes("\"command\": \"easyar-mcp\""), "Installed MCP should generate Codex package-bin config.");
  assert(codexConfig.includes("\"client\": \"codex\""), "Installed MCP should identify Codex config.");
  assert(claudeConfig.includes("\"command\": \"easyar-mcp\""), "Installed MCP should generate Claude package-bin config.");
  assert(claudeConfig.includes("\"client\": \"claude-desktop\""), "Installed MCP should identify Claude config.");
  assert(codexClientSetup.includes("\"readyForClientConnection\": true"), "Installed MCP should validate Codex package-bin setup.");
  assert(codexClientSetup.includes("\"client\": \"codex\""), "Installed MCP should identify Codex setup.");
  assert(codexClientSetup.includes("\"entrypointMode\": \"package-bin\""), "Installed MCP should validate Codex package-bin mode.");
  assert(codexClientSetup.includes("\"command\": \"easyar-mcp\""), "Installed MCP should validate Codex easyar-mcp command.");
  assert(claudeClientSetup.includes("\"readyForClientConnection\": true"), "Installed MCP should validate Claude package-bin setup.");
  assert(claudeClientSetup.includes("\"client\": \"claude-desktop\""), "Installed MCP should identify Claude setup.");
  assert(claudeClientSetup.includes("\"entrypointMode\": \"package-bin\""), "Installed MCP should validate Claude package-bin mode.");
  assert(claudeClientSetup.includes("\"command\": \"easyar-mcp\""), "Installed MCP should validate Claude easyar-mcp command.");

  console.log("GitHub Release install smoke test passed.");
  console.log(`Release tarball: ${releaseTarballUrl}`);
  console.log(`Expected tag: ${expectedReleaseTag}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: {
        ...process.env,
        EASYAR_API_BASE_URL: "https://www.easyar.cn"
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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function callInstalledTool(serverBin, cwd, name, args) {
  const installedBinDir = path.join(cwd, "node_modules", ".bin");
  const child = spawn(serverBin, [], {
    cwd,
    env: {
      ...process.env,
      PATH: `${installedBinDir}${path.delimiter}${process.env.PATH ?? ""}`,
      EASYAR_API_BASE_URL: "https://www.easyar.cn",
      EASYAR_API_TOKEN: "",
      EASYAR_ACCOUNT_STATUS_ENDPOINT: "",
      EASYAR_LICENSE_VALIDATE_ENDPOINT: "",
      EASYAR_DOWNLOADS_ENDPOINT: "",
      EASYAR_CLOUD_CREDENTIALS_ENDPOINT: ""
    },
    stdio: ["pipe", "pipe", "pipe"]
  });
  let nextId = 1;
  const pending = new Map();
  let stdoutBuffer = "";
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
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

  function request(method, params) {
    const id = nextId++;
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Timed out waiting for ${method}. stderr=${stderr.trim()}`));
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

  return (async () => {
    try {
      await request("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "mcp-easyar-github-release-smoke",
          version: "0.0.1"
        }
      });
      notify("notifications/initialized", {});
      const response = await request("tools/call", {
        name,
        arguments: args
      });
      return response.result.content.map((item) => item.text ?? "").join("\n");
    } finally {
      child.kill();
    }
  })();
}
