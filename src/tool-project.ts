import { access, readFile, readdir, stat } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import type { SampleInfo } from "./samples.js";
import { isNonEmptyString } from "./tool-local-config.js";
import { walk } from "./tool-file-utils.js";

export function resolveProjectPath(projectPath: string): string {
  return path.resolve(process.cwd(), projectPath);
}

export async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDirectory(dirPath: string) {
  const info = await stat(dirPath);
  if (!info.isDirectory()) {
    throw new Error(`${dirPath} is not a directory.`);
  }
}

export async function readUnityVersion(root: string): Promise<string | null> {
  const versionFile = path.join(root, "ProjectSettings", "ProjectVersion.txt");
  try {
    const text = await readFile(versionFile, "utf8");
    const match = text.match(/m_EditorVersion:\s*(.+)/);
    return match?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
}

export async function findFiles(root: string, relativeDirs: string[], pattern: RegExp, limit: number): Promise<string[]> {
  const found: string[] = [];
  for (const relativeDir of relativeDirs) {
    const start = path.join(root, relativeDir);
    if (await exists(start)) {
      await walk(root, start, pattern, found, limit);
    }
  }
  return found.map((filePath) => path.relative(root, filePath));
}

export async function findUnityCandidates() {
  const configuredCandidateDirs = (process.env.EASYAR_UNITY_CANDIDATE_DIRS ?? "")
    .split(path.delimiter)
    .map((item) => item.trim())
    .filter(isNonEmptyString);
  const candidates = [
    ...configuredCandidateDirs,
    "/Applications/Unity/Hub/Editor",
    path.join(process.env.PROGRAMFILES ?? "C:\\Program Files", "Unity", "Hub", "Editor"),
    path.join(process.env.HOME ?? "", "Unity", "Hub", "Editor"),
    "/opt/Unity/Editor"
  ];

  const executablePaths = new Set<string>();
  for (const candidate of candidates) {
    if (!candidate || !await exists(candidate)) {
      continue;
    }
    await collectUnityExecutables(candidate, executablePaths, 6);
  }

  executablePaths.add("Unity");
  const result = await Promise.all(
    Array.from(executablePaths).map(async (candidatePath) => ({
      path: candidatePath,
      exists: candidatePath === "Unity" ? false : await exists(candidatePath)
    }))
  );
  return result.sort((left, right) => Number(right.exists) - Number(left.exists) || left.path.localeCompare(right.path));
}

export async function collectUnityExecutables(dirPath: string, found: Set<string>, depth: number): Promise<void> {
  if (depth < 0) {
    return;
  }
  let entries;
  try {
    entries = await readdir(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await collectUnityExecutables(fullPath, found, depth - 1);
    } else if (entry.name === "Unity" || entry.name === "Unity.exe") {
      found.add(fullPath);
    }
  }
}

export async function buildUnityEnvironmentReport(root: string | null, sample: SampleInfo | null) {
  const configuredPath = process.env.EASYAR_UNITY_PATH ?? null;
  const configuredExists = configuredPath ? await exists(configuredPath) : false;
  const candidates = await findUnityCandidates();
  const unityVersion = root ? await readUnityVersion(root) : null;
  const recommendedUnityPath = configuredExists
    ? configuredPath
    : chooseUnityCandidate(candidates, unityVersion);
  const recommendedVersionMatchesProject = unityPathMatchesProjectVersion(recommendedUnityPath, unityVersion);
  const matchingProjectVersionCandidateExists = unityVersion
    ? candidates.some((candidate) => candidate.exists && unityPathMatchesProjectVersion(candidate.path, unityVersion))
    : null;
  const readyForUnityBatch = Boolean(recommendedUnityPath) && recommendedVersionMatchesProject !== false;
  const escapedRecommendedPath = recommendedUnityPath ? shellSingleQuote(recommendedUnityPath) : null;
  const dryRunCompileCommand = root && sample
    ? `easyar_run_unity_compile_check projectPath=${root} sampleId=${sample.id} unityPath=${recommendedUnityPath ?? "/path/to/Unity"} dryRun=true`
    : root
      ? `easyar_run_unity_compile_check projectPath=${root} unityPath=${recommendedUnityPath ?? "/path/to/Unity"} dryRun=true`
      : "easyar_run_unity_compile_check projectPath=/path/to/UnityProject sampleId=image-tracking unityPath=/path/to/Unity dryRun=true";

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: sample
      ? {
          id: sample.id,
          name: sample.name,
          implementationStatus: sample.implementationStatus
        }
      : null,
    unityVersion,
    configuredPath,
    configuredExists,
    pathCommand: "Unity",
    candidates,
    recommendedUnityPath,
    recommendedVersionMatchesProject,
    matchingProjectVersionCandidateExists,
    readyForUnityBatch,
    environment: {
      variable: "EASYAR_UNITY_PATH",
      exportCommand: escapedRecommendedPath ? `export EASYAR_UNITY_PATH=${escapedRecommendedPath}` : "export EASYAR_UNITY_PATH=/path/to/Unity",
      candidateDirsVariable: "EASYAR_UNITY_CANDIDATE_DIRS",
      clientConfigHint: "Set EASYAR_UNITY_PATH in the MCP client environment or pass unityPath explicitly to Unity batch tools. Set EASYAR_UNITY_CANDIDATE_DIRS only when Unity is installed outside common Unity Hub locations."
    },
    dryRunCompileCommand,
    nextActions: readyForUnityBatch
      ? [
          "Set EASYAR_UNITY_PATH to recommendedUnityPath in the MCP client environment, or pass unityPath explicitly.",
          "Run the dry-run compile command to confirm the Unity batch command shape.",
          "Run easyar_run_unity_compile_check without dryRun after official assets, sample scene, and local config are ready."
        ]
      : recommendedUnityPath && recommendedVersionMatchesProject === false
        ? [
            `Install Unity ${unityVersion} through Unity Hub with Android/iOS build support, or point EASYAR_UNITY_PATH to the matching executable.`,
            "Do not run Unity batch automation with a different Unity version unless you intentionally upgrade or clone the project first.",
            "Rerun easyar_write_unity_environment_report after the matching Unity executable exists."
          ]
      : [
          "Install Unity through Unity Hub with Android/iOS build support as needed.",
          "Open the Unity project once so ProjectSettings and Library metadata are initialized.",
          "Set EASYAR_UNITY_PATH to the Unity executable path, then rerun easyar_unity_environment."
        ],
    security: "Unity environment reports contain executable paths and commands only. They do not include EasyAR account tokens, license keys, Cloud Recognition credentials, or signing secrets."
  };
}

export function chooseUnityCandidate(candidates: Array<{ path: string; exists: boolean }>, unityVersion: string | null): string | null {
  const existing = candidates.filter((candidate) => candidate.exists);
  if (unityVersion) {
    const versionNeedle = `${path.sep}${unityVersion}${path.sep}`;
    const versionMatch = existing.find((candidate) => candidate.path.includes(versionNeedle));
    if (versionMatch) {
      return versionMatch.path;
    }
  }
  return existing[0]?.path ?? null;
}

export function unityPathMatchesProjectVersion(unityPath: string | null, unityVersion: string | null): boolean | null {
  if (!unityPath || !unityVersion) {
    return null;
  }
  const versionNeedle = `${path.sep}${unityVersion}${path.sep}`;
  return unityPath.includes(versionNeedle);
}

export function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}
