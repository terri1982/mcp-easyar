import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const tempRoot = await mkdtemp(path.join(tmpdir(), "mcp-easyar-package-smoke-"));
const packDir = path.join(tempRoot, "pack");
const consumerDir = path.join(tempRoot, "consumer");

try {
  await mkdir(packDir, { recursive: true });
  await mkdir(consumerDir, { recursive: true });
  await run("npm", ["pack", "--pack-destination", packDir, "--silent"], { cwd: root });
  const tarball = path.join(packDir, "mcp-easyar-0.1.0.tgz");
  await access(tarball, constants.R_OK);

  await writeFile(
    path.join(consumerDir, "package.json"),
    JSON.stringify({
      name: "mcp-easyar-package-smoke-consumer",
      version: "0.0.0",
      private: true,
      type: "module"
    }, null, 2),
    "utf8"
  );
  await run("npm", ["install", "--silent", "--no-audit", "--fund=false", tarball], { cwd: consumerDir });

  const binSuffix = process.platform === "win32" ? ".cmd" : "";
  const serverBin = path.join(consumerDir, "node_modules", ".bin", `easyar-mcp${binSuffix}`);
  const checkBin = path.join(consumerDir, "node_modules", ".bin", `easyar-mcp-check${binSuffix}`);
  await access(serverBin, constants.X_OK);
  await access(checkBin, constants.X_OK);

  const check = await run(checkBin, [], { cwd: consumerDir });
  assert(check.stdout.includes("mcp-easyar install check"), "Installed check bin should print install-check title.");
  assert(check.stdout.includes("OK tools"), "Installed check bin should verify tools.");
  assert(check.stdout.includes("OK prompts"), "Installed check bin should verify prompts.");
  assert(check.stdout.includes("OK resources"), "Installed check bin should verify resources.");
  assert(check.stdout.includes("OK wechat-miniprogram-acceptance"), "Installed check bin should verify WeChat Mini Program acceptance resource.");
  assert(check.stdout.includes("OK wechat-miniprogram-samples"), "Installed check bin should verify WeChat Mini Program sample resource.");
  assert(check.stdout.includes("Secret values are not required"), "Installed check should state that secrets are not needed.");

  console.log("Package install smoke test passed.");
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
