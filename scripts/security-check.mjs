import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const tempRoot = await mkdtemp(path.join(tmpdir(), "mcp-easyar-security-"));
const packDir = path.join(tempRoot, "pack");
const forbiddenPackagePatterns = [
  /^package\/\.github\//,
  /^package\/scripts\//,
  /easyar-mega-wechat-miniprogram-mcp\.md$/,
  /easyar\.local\.json$/,
  /easyar\.runtime\.json$/,
  /\.secret\.json$/,
  /\.env$/,
  /\.apk$/,
  /\.unitypackage$/
];
const forbiddenTrackedPatterns = [
  /(^|\/)ProjectSettings\/EasyAR\/easyar\.local\.json$/,
  /(^|\/)Assets\/StreamingAssets\/EasyAR\/easyar\.runtime\.json$/,
  /\.secret\.json$/,
  /\.apk$/,
  /\.unitypackage$/
];
const fixtureAllowlist = [
  "scripts/smoke-test.mjs",
  ".env.example",
  "README.md",
  "docs/quickstart.md",
  "docs/OFFICIAL_API_HANDOFF.md",
  "docs/OFFICIAL_API_CONTRACT.md",
  "docs/RELEASE_MANIFEST.md",
  "SECURITY.md",
  "CONTRIBUTING.md",
  ".github/pull_request_template.md",
  ".github/ISSUE_TEMPLATE/focused-sample-run.yml",
  ".github/ISSUE_TEMPLATE/release-readiness.yml",
  ".github/workflows/release.yml"
];

try {
  console.log("mcp-easyar security check");
  await mkdir(packDir, { recursive: true });
  const pack = await run("npm", ["pack", "--pack-destination", packDir, "--silent"], { cwd: root });
  const tarball = pack.stdout.trim().split(/\r?\n/).filter(Boolean).pop();
  if (!tarball) {
    throw new Error("npm pack did not report a tarball name.");
  }
  const tarballPath = path.join(packDir, tarball);
  const tarList = await run("tar", ["-tzf", tarballPath], { cwd: root });
  const packageFiles = tarList.stdout.split(/\r?\n/).filter(Boolean);
  const forbiddenPackaged = packageFiles.filter((entry) => forbiddenPackagePatterns.some((pattern) => pattern.test(entry)));
  assert(forbiddenPackaged.length === 0, `Forbidden packaged file(s): ${forbiddenPackaged.join(", ")}`);

  const tracked = (await run("git", ["ls-files"], { cwd: root })).stdout.split(/\r?\n/).filter(Boolean);
  const forbiddenTracked = tracked.filter((entry) => forbiddenTrackedPatterns.some((pattern) => pattern.test(entry)));
  assert(forbiddenTracked.length === 0, `Forbidden tracked file(s): ${forbiddenTracked.join(", ")}`);

  const suspicious = [];
  for (const filePath of tracked) {
    if (fixtureAllowlist.includes(filePath) || !isTextFile(filePath)) {
      continue;
    }
    const text = await readFile(path.join(root, filePath), "utf8").catch(() => "");
    for (const finding of findSuspiciousSecretValues(text)) {
      suspicious.push(`${filePath}: ${finding}`);
    }
  }
  assert(suspicious.length === 0, `Suspicious secret-like tracked value(s):\n${suspicious.join("\n")}`);

  console.log(`OK package files checked: ${packageFiles.length}`);
  console.log(`OK tracked files checked: ${tracked.length}`);
  console.log("No forbidden local config, runtime secret, APK, Unity package, or obvious secret-like tracked values found.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

function findSuspiciousSecretValues(text) {
  const findings = [];
  const fieldPattern = /(?:"?(?:accountToken|apiToken|licenseKey|apiKey|apiSecret|appKey|appSecret|password|credential|secret)"?\s*[:=]\s*["'])([^"']{24,})["']/gi;
  for (const match of text.matchAll(fieldPattern)) {
    const value = match[1] ?? "";
    if (!isPlaceholderValue(value)) {
      findings.push(`${match[0].slice(0, 48)}...`);
    }
  }
  const base64Pattern = /\b[A-Za-z0-9+/]{160,}={0,2}\b/g;
  for (const match of text.matchAll(base64Pattern)) {
    const value = match[0] ?? "";
    if (!isPlaceholderValue(value)) {
      findings.push(`long-base64-like-value length=${value.length}`);
    }
  }
  return findings;
}

function isPlaceholderValue(value) {
  return /^(your_|paste-|placeholder|test-|env-test-|fixture-|should-not-leak|secret-|redacted|<redacted>)/i.test(value)
    || /^<[^>]+>$/.test(value)
    || /paste locally|never send|example|sample|tests?ample|fake|dummy/i.test(value);
}

function isTextFile(filePath) {
  return /\.(cjs|cs|js|json|md|mjs|ts|tsx|txt|yml|yaml|xml|html|css|gitignore|example)$/i.test(filePath)
    || filePath === "LICENSE"
    || filePath === "SECURITY.md"
    || filePath === "CONTRIBUTING.md"
    || filePath === ".env.example";
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
