import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const releaseTarballUrl = process.env.EASYAR_GITHUB_RELEASE_TARBALL_URL
  ?? "https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.6/mcp-easyar-0.1.0.tgz";
const expectedReleaseTag = process.env.EASYAR_GITHUB_RELEASE_TAG ?? "v0.1.0-local-key.6";
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
  assert(check.stdout.includes("Secret values are not required"), "Release install check should state that secrets are not needed.");

  const packageRoot = path.join(consumerDir, "node_modules", "mcp-easyar");
  const installGuide = await readFile(path.join(packageRoot, "docs", "install-from-github-release.md"), "utf8");
  const releaseNotes = await readFile(path.join(packageRoot, "docs", "release-notes", "local-key-mvp.md"), "utf8");
  assert(installGuide.includes(expectedReleaseTag), "Install guide should point to the expected GitHub Release tag.");
  assert(installGuide.includes("For Codex:"), "Install guide should include a Codex package-bin config section.");
  assert(installGuide.includes("\"command\": \"easyar-mcp\""), "Install guide should use the package-bin easyar-mcp command.");
  assert(releaseNotes.includes(expectedReleaseTag), "Release notes should point to the expected GitHub Release tag.");
  assert(releaseNotes.includes("Local-key MVP ready: yes"), "Release notes should state local-key MVP readiness.");
  assert(releaseNotes.includes("Production official API ready: no"), "Release notes should state production API readiness.");

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
