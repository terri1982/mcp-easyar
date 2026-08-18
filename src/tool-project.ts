import { access, lstat, readFile, readdir, realpath, stat } from "node:fs/promises";
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

  const pathCommand = await resolveExecutableOnPath("Unity");
  if (pathCommand) {
    executablePaths.add(pathCommand);
  }
  const result = await Promise.all(Array.from(executablePaths).map(inspectUnityExecutable));
  return result.sort((left, right) => Number(right.supportsBatchmode) - Number(left.supportsBatchmode)
    || Number(right.exists) - Number(left.exists)
    || left.path.localeCompare(right.path));
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
    const linkedDirectory = entry.isSymbolicLink()
      ? await stat(fullPath).then((info) => info.isDirectory()).catch(() => false)
      : false;
    if (entry.isDirectory() || linkedDirectory) {
      await collectUnityExecutables(fullPath, found, depth - 1);
    } else if (entry.name === "Unity" || entry.name === "Unity.exe") {
      found.add(fullPath);
    }
  }
}

export async function buildUnityEnvironmentReport(root: string | null, sample: SampleInfo | null) {
  const configuredPath = process.env.EASYAR_UNITY_PATH ?? null;
  const unityVersion = root ? await readUnityVersion(root) : null;
  const expectedInstall = unityVersion ? await inspectExpectedUnityInstall(unityVersion) : null;
  const configuredInspection = configuredPath ? await inspectUnityExecutable(configuredPath) : null;
  const pathCommandPath = await resolveExecutableOnPath("Unity");
  const pathCommandInspection = pathCommandPath ? await inspectUnityExecutable(pathCommandPath) : null;
  const discoveredCandidates = await findUnityCandidates();
  const candidates = uniqueUnityCandidates([
    ...(configuredInspection ? [configuredInspection] : []),
    ...(expectedInstall ? [expectedInstall.executable] : []),
    ...discoveredCandidates
  ]);
  const configuredExists = configuredInspection?.exists ?? false;
  const recommendedUnityPath = configuredInspection?.supportsBatchmode
    ? configuredInspection.path
    : chooseUnityCandidate(candidates, unityVersion);
  const recommendedInspection = candidates.find((candidate) => candidate.path === recommendedUnityPath) ?? null;
  const recommendedVersionMatchesProject = recommendedInspection
    ? unityInspectionMatchesProjectVersion(recommendedInspection, unityVersion)
    : null;
  const matchingProjectVersionCandidateExists = unityVersion
    ? candidates.some((candidate) => candidate.supportsBatchmode && unityInspectionMatchesProjectVersion(candidate, unityVersion) === true)
    : null;
  const activeInspection = configuredInspection ?? pathCommandInspection;
  const activeVersionMatchesProject = activeInspection
    ? unityInspectionMatchesProjectVersion(activeInspection, unityVersion)
    : null;
  const readyForUnityBatch = Boolean(activeInspection?.supportsBatchmode)
    && activeVersionMatchesProject !== false;
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
    configuredInspection,
    pathCommand: "Unity",
    pathCommandInspection,
    activeUnityPath: activeInspection?.path ?? null,
    activeVersionMatchesProject,
    candidates,
    expectedInstall,
    recommendedUnityPath,
    recommendedInspection,
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
      : expectedInstall?.installRootIsSymlink && !expectedInstall.installRootResolvedExists
        ? [
            `Restore or mount the volume targeted by ${expectedInstall.installRoot}; its Unity ${unityVersion} symlink is currently broken.`,
            `After the target volume is available, confirm ${expectedInstall.editorExecutable} exists and rerun easyar_write_unity_environment_report.`,
            "Do not use ~/.unity/bin/Unity or another Unity CLI shim for -batchmode; EASYAR_UNITY_PATH must point to the Unity Editor executable."
          ]
      : activeInspection && !activeInspection.supportsBatchmode
        ? [
            `${configuredInspection ? "EASYAR_UNITY_PATH" : "Unity on PATH"} points to ${activeInspection.executableKind}, not a usable Unity Editor executable (${activeInspection.path}).`,
            "Point EASYAR_UNITY_PATH to Unity.app/Contents/MacOS/Unity on macOS, Editor/Unity.exe on Windows, or Editor/Unity on Linux.",
            "Rerun easyar_write_unity_environment_report before any Unity batch command."
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
  const existing = candidates.filter((candidate) => candidate.exists && ("supportsBatchmode" in candidate ? candidate.supportsBatchmode === true : true));
  if (unityVersion) {
    const versionNeedle = `${path.sep}${unityVersion}${path.sep}`;
    const versionMatch = existing.find((candidate) => candidate.path.includes(versionNeedle));
    if (versionMatch) {
      return versionMatch.path;
    }
  }
  return existing[0]?.path ?? null;
}

export type UnityExecutableInspection = {
  path: string;
  exists: boolean;
  isSymlink: boolean;
  resolvedPath: string | null;
  resolvedPathExists: boolean;
  executable: boolean;
  executableKind: "unity-editor" | "unity-cli-or-unknown" | "path-command" | "missing";
  editorExecutable: string | null;
  supportsBatchmode: boolean;
  detectedVersion: string | null;
};

export async function inspectUnityExecutable(candidatePath: string): Promise<UnityExecutableInspection> {
  if (candidatePath === "Unity") {
    return {
      path: candidatePath,
      exists: false,
      isSymlink: false,
      resolvedPath: null,
      resolvedPathExists: false,
      executable: false,
      executableKind: "path-command",
      editorExecutable: null,
      supportsBatchmode: false,
      detectedVersion: null
    };
  }

  let linkInfo = null;
  try {
    linkInfo = await lstat(candidatePath);
  } catch {
    // A missing path can still be useful evidence, especially below a broken Hub symlink.
  }
  const isSymlink = linkInfo?.isSymbolicLink() ?? false;
  let resolvedPath: string | null = null;
  try {
    resolvedPath = await realpath(candidatePath);
  } catch {
    resolvedPath = null;
  }
  const resolvedPathExists = resolvedPath ? await exists(resolvedPath) : false;
  const candidateExists = Boolean(linkInfo) && (!isSymlink || resolvedPathExists);
  let executable = false;
  if (candidateExists) {
    try {
      await access(candidatePath, constants.X_OK);
      executable = true;
    } catch {
      executable = false;
    }
  }
  const editorExecutable = isUnityEditorExecutablePath(candidatePath)
    ? candidatePath
    : resolvedPath && isUnityEditorExecutablePath(resolvedPath)
      ? resolvedPath
      : null;
  const executableKind = !candidateExists
    ? "missing"
    : editorExecutable
      ? "unity-editor"
      : "unity-cli-or-unknown";
  return {
    path: candidatePath,
    exists: candidateExists,
    isSymlink,
    resolvedPath,
    resolvedPathExists,
    executable,
    executableKind,
    editorExecutable,
    supportsBatchmode: executableKind === "unity-editor" && executable,
    detectedVersion: detectUnityVersionFromPath(candidatePath) ?? detectUnityVersionFromPath(resolvedPath)
  };
}

export function isUnityEditorExecutablePath(candidatePath: string | null): boolean {
  if (!candidatePath) {
    return false;
  }
  const normalized = candidatePath.replace(/\\/g, "/");
  return /\/Unity\.app\/Contents\/MacOS\/Unity$/i.test(normalized)
    || /\/Editor\/Unity\.exe$/i.test(normalized)
    || /\/Editor\/Unity$/i.test(normalized);
}

export function detectUnityVersionFromPath(candidatePath: string | null): string | null {
  if (!candidatePath) {
    return null;
  }
  return candidatePath.replace(/\\/g, "/").match(/\/Hub\/Editor\/([^/]+)(?:\/|$)/i)?.[1] ?? null;
}

export function unityInspectionMatchesProjectVersion(inspection: UnityExecutableInspection, unityVersion: string | null): boolean | null {
  if (!unityVersion) {
    return null;
  }
  if (inspection.detectedVersion) {
    return inspection.detectedVersion === unityVersion;
  }
  return unityPathMatchesProjectVersion(inspection.path, unityVersion);
}

export async function inspectExpectedUnityInstall(unityVersion: string) {
  const installRoot = process.platform === "win32"
    ? path.join(process.env.PROGRAMFILES ?? "C:\\Program Files", "Unity", "Hub", "Editor", unityVersion)
    : process.platform === "darwin"
      ? path.join("/Applications", "Unity", "Hub", "Editor", unityVersion)
      : path.join("/opt", "Unity", "Hub", "Editor", unityVersion);
  const editorExecutable = process.platform === "win32"
    ? path.join(installRoot, "Editor", "Unity.exe")
    : process.platform === "darwin"
      ? path.join(installRoot, "Unity.app", "Contents", "MacOS", "Unity")
      : path.join(installRoot, "Editor", "Unity");
  let installRootIsSymlink = false;
  let installRootResolvedPath: string | null = null;
  try {
    installRootIsSymlink = (await lstat(installRoot)).isSymbolicLink();
    installRootResolvedPath = await realpath(installRoot).catch(() => null);
  } catch {
    // Missing expected installs are reported through the executable inspection.
  }
  return {
    installRoot,
    installRootIsSymlink,
    installRootResolvedPath,
    installRootResolvedExists: installRootResolvedPath ? await exists(installRootResolvedPath) : false,
    editorExecutable,
    executable: await inspectUnityExecutable(editorExecutable)
  };
}

export async function resolveExecutableOnPath(command: string): Promise<string | null> {
  for (const directory of (process.env.PATH ?? "").split(path.delimiter).filter(Boolean)) {
    const candidate = path.join(directory, process.platform === "win32" ? `${command}.exe` : command);
    if (await exists(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function uniqueUnityCandidates(candidates: UnityExecutableInspection[]): UnityExecutableInspection[] {
  const unique = new Map<string, UnityExecutableInspection>();
  for (const candidate of candidates) {
    unique.set(candidate.path, candidate);
  }
  return Array.from(unique.values());
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
