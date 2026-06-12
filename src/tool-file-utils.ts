import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { mobilePlatforms, runResultStatuses } from "./catalog.js";
import type { SampleInfo } from "./samples.js";

async function exists(filePath: string): Promise<boolean> {
  try {
    await readFile(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

export function extractMethodBody(text: string, methodName: string): string | null {
  const match = new RegExp(`\\b(?:private|public|protected|internal)?\\s*(?:static\\s+)?void\\s+${methodName}\\s*\\([^)]*\\)\\s*\\{`).exec(text);
  if (!match) {
    return null;
  }
  let depth = 0;
  for (let index = match.index; index < text.length; index += 1) {
    const char = text[index];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(match.index, index + 1);
      }
    }
  }
  return text.slice(match.index);
}

export function findLineNumber(lines: string[], pattern: RegExp): number | null {
  const index = lines.findIndex((line) => pattern.test(line));
  return index >= 0 ? index + 1 : null;
}

export function firstMatchingLine(text: string, pattern: RegExp): string | null {
  return text.split(/\r?\n/).find((line) => pattern.test(line))?.trim() ?? null;
}

export async function walk(root: string, dirPath: string, pattern: RegExp, found: string[], limit: number): Promise<void> {
  if (found.length >= limit) {
    return;
  }

  const entries = await readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (found.length >= limit) {
      return;
    }

    if (entry.name === "Library" || entry.name === "Temp" || entry.name === "Obj") {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await walk(root, fullPath, pattern, found, limit);
    } else if (pattern.test(path.relative(root, fullPath))) {
      found.push(fullPath);
    }
  }
}

export function assertInside(root: string, target: string) {
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Target path must stay inside the Unity project.");
  }
}

export async function writeGeneratedFile(filePath: string, contents: string, overwrite: boolean, written: string[]) {
  if (!overwrite && await exists(filePath)) {
    return;
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, "utf8");
  written.push(filePath);
}

export async function ensureGitignoreEntries(gitignorePath: string, entries: string[]) {
  let current = "";
  if (await exists(gitignorePath)) {
    current = await readFile(gitignorePath, "utf8");
  }

  const lines = new Set(current.split(/\r?\n/).filter(Boolean));
  let changed = false;
  for (const entry of entries) {
    if (!lines.has(entry)) {
      lines.add(entry);
      changed = true;
    }
  }

  if (changed) {
    await writeFile(gitignorePath, `${Array.from(lines).join("\n")}\n`, "utf8");
  }
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function resolveUnityLogPath(root: string, logPath: string): string {
  const resolved = path.isAbsolute(logPath) ? logPath : path.resolve(root, logPath);
  assertInside(root, resolved);
  return resolved;
}

export function defaultUnityBatchLogPath(executeMethod: string): string {
  return path.join("Logs", `mcp-easyar-${executeMethod.split(".").pop() ?? "unity-method"}.log`);
}

export function buildUnityRunResultStep(input: {
  stepName: string;
  result: { exitCode: number | null; logPath: string | null };
  issues: Array<{ title: string; actions: string[] }>;
  root: string;
  successNextAction: string;
}) {
  const status: typeof runResultStatuses[number] = input.result.exitCode === 0 && input.issues.length === 0
    ? "passed"
    : input.result.exitCode === null
      ? "blocked"
      : "failed";
  const logEvidence = input.result.logPath ? `Log: ${path.relative(input.root, input.result.logPath)}` : "No project-local Unity log path was provided.";
  const exitEvidence = `Unity exit code: ${input.result.exitCode ?? "unknown"}`;
  const issueEvidence = input.issues.length > 0
    ? `Detected issue(s): ${input.issues.map((issue) => issue.title).join("; ")}`
    : "No known EasyAR/Unity issue patterns detected.";
  const nextAction = status === "passed"
    ? input.successNextAction
    : input.issues[0]?.actions[0] ?? "Inspect the Unity log, fix the failing Unity step, and rerun the focused workflow.";

  return {
    name: input.stepName,
    status,
    evidence: `${exitEvidence}. ${logEvidence}. ${issueEvidence}`,
    nextAction
  };
}

export function buildSuggestedRunResultCall(input: {
  root: string;
  sample: SampleInfo;
  platform: typeof mobilePlatforms[number];
  overallStatus?: typeof runResultStatuses[number];
  stepName: string;
  status: typeof runResultStatuses[number];
  evidence: string;
  nextAction: string;
}) {
  const overallStatus = input.overallStatus ?? input.status;
  return {
    tool: "easyar_write_run_result",
    arguments: {
      projectPath: input.root,
      sampleId: input.sample.id,
      platform: input.platform,
      overallStatus,
      steps: [
        {
          name: input.stepName,
          status: input.status,
          evidence: input.evidence,
          nextAction: input.nextAction
        }
      ]
    }
  };
}

export function unityMethodStepName(executeMethod: string): string {
  if (/MobileSettingsHelper\.ConfigureMobileSettings$/.test(executeMethod)) {
    return "Configure mobile player settings";
  }
  if (/BuildSettingsHelper\.ConfigureBuildSettings$/.test(executeMethod)) {
    return "Configure Build Settings";
  }
  if (/SampleValidationHelper\.ValidateFocusedSample$/.test(executeMethod)) {
    return "Validate focused sample";
  }
  if (/DeviceBuildHelper\.Build$/.test(executeMethod)) {
    return "Build device player";
  }
  if (/SampleRunner\.OpenSampleScene$/.test(executeMethod)) {
    return "Open focused sample scene";
  }
  return `Run Unity method ${executeMethod}`;
}

export function unityMethodSuccessNextAction(executeMethod: string): string {
  if (/MobileSettingsHelper\.ConfigureMobileSettings$/.test(executeMethod)) {
    return "Run the Build Settings helper for the focused sample.";
  }
  if (/BuildSettingsHelper\.ConfigureBuildSettings$/.test(executeMethod)) {
    return "Run the focused sample validation helper, then compile check.";
  }
  if (/SampleValidationHelper\.ValidateFocusedSample$/.test(executeMethod)) {
    return "Run easyar_run_unity_compile_check, then prepare the device build helper.";
  }
  if (/DeviceBuildHelper\.Build$/.test(executeMethod)) {
    return "Install the build on a real Android/iOS device and follow DEVICE_VALIDATION.md.";
  }
  if (/SampleRunner\.OpenSampleScene$/.test(executeMethod)) {
    return "Run Build Settings and focused sample validation after opening the scene.";
  }
  return "Continue with the focused run sequence and record the next observed result.";
}
