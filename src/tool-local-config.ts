import { open, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import type { SampleInfo } from "./samples.js";
import { defaultBundleIdentifier } from "./unity-generators.js";
import { writeGeneratedFile } from "./tool-file-utils.js";

async function exists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readCloudRecognitionConfig(root: string): Promise<Record<string, unknown>> {
  const target = path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json");
  if (!await exists(target)) {
    return {};
  }
  const parsed = await readJsonFile(target);
  const value = isRecord(parsed) ? parsed : {};
  const easyar = isRecord(value.easyar) ? value.easyar : {};
  return isRecord(easyar.cloudRecognition) ? easyar.cloudRecognition : {};
}

export async function readLogFile(logPath: string): Promise<string> {
  const resolved = path.resolve(process.cwd(), logPath);
  const info = await stat(resolved);
  if (!info.isFile()) {
    throw new Error(`${resolved} is not a file.`);
  }
  if (info.size > 5 * 1024 * 1024) {
    throw new Error("Log file is larger than 5 MiB. Pass a smaller excerpt with logText.");
  }
  return readFile(resolved, "utf8");
}

export type UnityLogCandidate = {
  path: string;
  source: string;
  exists: boolean;
  size: number | null;
  modifiedAt: string | null;
  mtimeMs: number;
};

export async function findUnityLogCandidates(root: string | null): Promise<UnityLogCandidate[]> {
  const candidateSpecs: Array<{ path: string; source: string }> = [];
  if (root) {
    candidateSpecs.push(
      { path: path.join(root, "Logs", "Editor.log"), source: "project Logs/Editor.log" },
      { path: path.join(root, "Logs", "Unity.log"), source: "project Logs/Unity.log" },
      { path: path.join(root, "Library", "Editor.log"), source: "project Library/Editor.log" }
    );
    const projectLogsDir = path.join(root, "Logs");
    if (await exists(projectLogsDir)) {
      for (const entry of await readdir(projectLogsDir, { withFileTypes: true })) {
        if (entry.isFile() && /\.log$/i.test(entry.name)) {
          candidateSpecs.push({
            path: path.join(projectLogsDir, entry.name),
            source: "project Logs/*.log"
          });
        }
      }
    }
  }

  const home = process.env.HOME;
  if (home) {
    candidateSpecs.push(
      { path: path.join(home, "Library", "Logs", "Unity", "Editor.log"), source: "macOS Unity Editor.log" },
      { path: path.join(home, ".config", "unity3d", "Editor.log"), source: "Linux Unity Editor.log" }
    );
  }
  if (process.env.LOCALAPPDATA) {
    candidateSpecs.push({
      path: path.join(process.env.LOCALAPPDATA, "Unity", "Editor", "Editor.log"),
      source: "Windows Unity Editor.log"
    });
  }

  const unique = new Map<string, string>();
  for (const candidate of candidateSpecs) {
    unique.set(candidate.path, candidate.source);
  }

  const candidates = await Promise.all(
    Array.from(unique.entries()).map(async ([candidatePath, source]) => {
      try {
        const info = await stat(candidatePath);
        return {
          path: candidatePath,
          source,
          exists: info.isFile(),
          size: info.isFile() ? info.size : null,
          modifiedAt: info.isFile() ? info.mtime.toISOString() : null,
          mtimeMs: info.isFile() ? info.mtimeMs : 0
        };
      } catch {
        return {
          path: candidatePath,
          source,
          exists: false,
          size: null,
          modifiedAt: null,
          mtimeMs: 0
        };
      }
    })
  );

  return candidates.sort((left, right) => Number(right.exists) - Number(left.exists) || right.mtimeMs - left.mtimeMs);
}

export async function readLogTail(logPath: string, maxBytes: number): Promise<string> {
  const info = await stat(logPath);
  if (!info.isFile()) {
    throw new Error(`${logPath} is not a file.`);
  }
  const bytesToRead = Math.min(info.size, maxBytes);
  const file = await open(logPath, "r");
  try {
    const buffer = Buffer.alloc(bytesToRead);
    await file.read(buffer, 0, bytesToRead, Math.max(0, info.size - bytesToRead));
    return buffer.toString("utf8");
  } finally {
    await file.close();
  }
}

export async function readJsonFile(filePath: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Failed to parse JSON from ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function buildLocalConfigValidationReport(root: string, configPath?: string) {
  const target = configPath ?? path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json");
  if (!await exists(target)) {
    return {
      configPath: target,
      valid: false,
      checks: [
        {
          id: "file-exists",
          ok: false,
          detail: "Local config file does not exist."
        }
      ],
      security: "Secret values are not returned. This tool only reports presence and placeholder status.",
      nextActions: [
        "Run easyar_prepare_unity_project.",
        "Copy ProjectSettings/EasyAR/easyar.local.json.example to ProjectSettings/EasyAR/easyar.local.json.",
        "Fill the local file with official EasyAR account/license values."
      ]
    };
  }

  const parsed = await readJsonFile(target);
  const checks = validateLocalConfig(parsed);
  return {
    configPath: target,
    valid: checks.every((check) => check.ok),
    checks,
    security: "Secret values are not returned. This tool only reports presence and placeholder status.",
    nextActions: checks
      .filter((check) => !check.ok)
      .map((check) => localConfigAction(check.id))
  };
}

export async function buildLocalConfigFromEnvReport(
  root: string,
  sample: SampleInfo,
  targetPlatform: "android" | "ios" | "standalone",
  bundleIdentifierInput: string | undefined,
  target: string,
  overwrite: boolean,
  allowPartial: boolean
) {
  const existingFile = await exists(target);
  const needsCloudRecognition = sample.id === "cloud-recognition";
  const envValues = {
    apiBaseUrl: envFirst(["EASYAR_API_BASE_URL"]) ?? "https://www.easyar.cn",
    accountToken: envFirst(["EASYAR_ACCOUNT_TOKEN"]),
    licenseKey: envFirst(["EASYAR_LICENSE_KEY", "EASYAR_SENSE_LICENSE_KEY"]),
    cloudAppId: envFirst(["EASYAR_CLOUD_APP_ID", "EASYAR_CLOUD_RECOGNITION_APP_ID"]),
    cloudServerAddress: envFirst(["EASYAR_CLOUD_SERVER_ADDRESS", "EASYAR_CLOUD_RECOGNITION_SERVER_ADDRESS", "EASYAR_CRS_SERVER_ADDRESS", "EASYAR_CRS_RECOGNITION_URL"]),
    cloudApiKey: envFirst(["EASYAR_CLOUD_API_KEY", "EASYAR_CLOUD_RECOGNITION_API_KEY", "EASYAR_CLOUD_APP_KEY", "EASYAR_CLOUD_RECOGNITION_APP_KEY"]),
    cloudApiSecret: envFirst(["EASYAR_CLOUD_API_SECRET", "EASYAR_CLOUD_RECOGNITION_API_SECRET", "EASYAR_CLOUD_APP_SECRET", "EASYAR_CLOUD_RECOGNITION_APP_SECRET"]),
    bundleIdentifier: bundleIdentifierInput ?? envFirst(["EASYAR_BUNDLE_IDENTIFIER", "EASYAR_UNITY_BUNDLE_IDENTIFIER"]) ?? defaultBundleIdentifier(sample)
  };
  const envPresence = [
    envPresenceItem("easyar.apiBaseUrl", ["EASYAR_API_BASE_URL"], isNonPlaceholderString(envValues.apiBaseUrl), "defaulted to https://www.easyar.cn when unset"),
    envPresenceItem("easyar.accountToken", ["EASYAR_ACCOUNT_TOKEN"], isNonPlaceholderString(envValues.accountToken), "optional local Unity config material; not required for current focused sample runs"),
    envPresenceItem("easyar.licenseKey", ["EASYAR_LICENSE_KEY", "EASYAR_SENSE_LICENSE_KEY"], isNonPlaceholderString(envValues.licenseKey), "required for focused sample runs"),
    envPresenceItem("unity.bundleIdentifier", ["EASYAR_BUNDLE_IDENTIFIER", "EASYAR_UNITY_BUNDLE_IDENTIFIER"], isNonPlaceholderString(envValues.bundleIdentifier), bundleIdentifierInput ? "provided as non-secret tool argument" : "defaults to focused sample identifier when unset"),
    envPresenceItem("easyar.cloudRecognition.appId", ["EASYAR_CLOUD_APP_ID", "EASYAR_CLOUD_RECOGNITION_APP_ID"], isNonPlaceholderString(envValues.cloudAppId), needsCloudRecognition ? "required for Cloud Recognition" : "optional for Image Tracking"),
    envPresenceItem("easyar.cloudRecognition.serverAddress", ["EASYAR_CLOUD_SERVER_ADDRESS", "EASYAR_CLOUD_RECOGNITION_SERVER_ADDRESS", "EASYAR_CRS_SERVER_ADDRESS", "EASYAR_CRS_RECOGNITION_URL"], isNonPlaceholderString(envValues.cloudServerAddress), needsCloudRecognition ? "required Cloud Recognition Client-end Target Recognition URL" : "optional for Image Tracking"),
    envPresenceItem("easyar.cloudRecognition.apiKey", ["EASYAR_CLOUD_API_KEY", "EASYAR_CLOUD_RECOGNITION_API_KEY", "EASYAR_CLOUD_APP_KEY", "EASYAR_CLOUD_RECOGNITION_APP_KEY"], isNonPlaceholderString(envValues.cloudApiKey), needsCloudRecognition ? "required for Cloud Recognition Sense 4.1+ APPID + API KEY" : "optional for Image Tracking"),
    envPresenceItem("easyar.cloudRecognition.apiSecret", ["EASYAR_CLOUD_API_SECRET", "EASYAR_CLOUD_RECOGNITION_API_SECRET", "EASYAR_CLOUD_APP_SECRET", "EASYAR_CLOUD_RECOGNITION_APP_SECRET"], isNonPlaceholderString(envValues.cloudApiSecret), needsCloudRecognition ? "required by EasyAR Unity CloudRecognizer API Key access" : "optional for Image Tracking")
  ];
  const requiredMissing = envPresence
    .filter((item) =>
      (item.field === "easyar.licenseKey"
        || (needsCloudRecognition && (item.field === "easyar.cloudRecognition.appId" || item.field === "easyar.cloudRecognition.serverAddress" || item.field === "easyar.cloudRecognition.apiKey" || item.field === "easyar.cloudRecognition.apiSecret"))) &&
      !item.present
    )
    .map((item) => item.field);
  const existingParsed = existingFile ? await readJsonFile(target).catch(() => ({})) : {};
  const existing = isRecord(existingParsed) ? existingParsed : {};
  const existingEasyAR = isRecord(existing.easyar) ? existing.easyar : {};
  const existingUnity = isRecord(existing.unity) ? existing.unity : {};
  const config = {
    ...existing,
    sampleId: sample.id,
    sampleName: sample.name,
    easyar: {
      ...existingEasyAR,
      apiBaseUrl: envValues.apiBaseUrl,
      accountToken: envValues.accountToken ?? (typeof existingEasyAR.accountToken === "string" ? existingEasyAR.accountToken : ""),
      licenseKey: envValues.licenseKey ?? (typeof existingEasyAR.licenseKey === "string" ? existingEasyAR.licenseKey : ""),
      cloudRecognition: {
        ...(isRecord(existingEasyAR.cloudRecognition) ? existingEasyAR.cloudRecognition : {}),
        appId: envValues.cloudAppId ?? "",
        serverAddress: envValues.cloudServerAddress ?? "",
        apiKey: envValues.cloudApiKey ?? "",
        apiSecret: envValues.cloudApiSecret ?? "",
        appKey: envValues.cloudApiKey ?? "",
        appSecret: envValues.cloudApiSecret ?? "",
        credentialMode: envValues.cloudApiKey ? "appId-apiKey" : ""
      }
    },
    unity: {
      ...existingUnity,
      targetPlatform,
      bundleIdentifier: envValues.bundleIdentifier,
      notes: sample.setupNotes
    }
  };
  const canWrite = (!existingFile || overwrite) && (allowPartial || requiredMissing.length === 0);
  const contents = `${JSON.stringify(config, null, 2)}\n`;
  const nextActions = canWrite
    ? [
        `Run easyar_validate_local_config projectPath=${root}.`,
        `Run easyar_check_sample_readiness projectPath=${root} sampleId=${sample.id}.`,
        targetPlatform === "standalone"
          ? "Choose android or ios for device validation before calling easyar_next_workflow_step."
          : `Run easyar_next_workflow_step projectPath=${root} sampleId=${sample.id} platform=${targetPlatform}.`
      ]
    : [
        ...(existingFile && !overwrite ? ["The target local config already exists. Pass overwrite=true only after confirming it is safe to replace or merge from env."] : []),
        ...(requiredMissing.length > 0 && !allowPartial ? requiredMissing.map((field) => `Set local environment variable(s) for ${field}, then rerun easyar_write_local_config_from_env.`) : []),
        "Use easyar_account_materials to see each field source and share policy."
      ];

  return {
    existingFile,
    canWrite,
    contents,
    requiredMissing,
    envPresence,
    nextActions: Array.from(new Set(nextActions)),
    security: "Secret values are read only from local environment variables and written only to ProjectSettings/EasyAR/easyar.local.json. Returned output lists field presence and env names, never secret values."
  };
}

export function envFirst(names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (isNonPlaceholderString(value)) {
      return value;
    }
  }
  return undefined;
}

export function envPresenceItem(field: string, envNames: string[], present: boolean, note: string) {
  return {
    field,
    envNames,
    present,
    note
  };
}

export function validateLocalConfig(config: unknown) {
  const value = isRecord(config) ? config : {};
  const easyar = isRecord(value.easyar) ? value.easyar : {};
  const cloudRecognition = isRecord(easyar.cloudRecognition) ? easyar.cloudRecognition : {};
  const unity = isRecord(value.unity) ? value.unity : {};

  return [
    {
      id: "json-object",
      ok: isRecord(config),
      detail: "Config root is a JSON object."
    },
    {
      id: "api-base-url",
      ok: isNonPlaceholderString(easyar.apiBaseUrl),
      detail: "easyar.apiBaseUrl is configured."
    },
    {
      id: "account-token",
      ok: isOptionalNonPlaceholderString(easyar.accountToken),
      detail: "easyar.accountToken is empty or configured; it is optional for current local-key sample runs."
    },
    {
      id: "license-key",
      ok: isNonPlaceholderString(easyar.licenseKey),
      detail: "easyar.licenseKey is present and not a placeholder."
    },
    {
      id: "target-platform",
      ok: isNonPlaceholderString(unity.targetPlatform),
      detail: "unity.targetPlatform is configured."
    },
    {
      id: "bundle-identifier",
      ok: isOptionalNonPlaceholderString(unity.bundleIdentifier),
      detail: "unity.bundleIdentifier is empty or configured for remote license validation."
    },
    {
      id: "cloud-recognition",
      ok: hasCloudRecognitionConfig(cloudRecognition),
      detail: "cloudRecognition credentials are either empty, configured as appId + serverAddress + apiKey + apiSecret, or configured with legacy appId + serverAddress + appSecret."
    }
  ];
}

export function localConfigAction(checkId: string): string {
  if (checkId === "json-object") {
    return "Replace the config file with valid JSON based on easyar.local.json.example.";
  }
  if (checkId === "api-base-url") {
    return "Set easyar.apiBaseUrl to https://www.easyar.cn or the official EasyAR API base URL.";
  }
  if (checkId === "account-token") {
    return "Leave easyar.accountToken empty for current local-key sample runs unless this Unity project has a local account-token consumer.";
  }
  if (checkId === "license-key") {
    return "Log in to the EasyAR website in your own browser, find the license yourself, then set easyar.licenseKey only in local ignored Unity config.";
  }
  if (checkId === "target-platform") {
    return "Set unity.targetPlatform to android, ios, or standalone.";
  }
  if (checkId === "bundle-identifier") {
    return "Set unity.bundleIdentifier to the Android package name or iOS bundle identifier bound to the EasyAR license.";
  }
  if (checkId === "cloud-recognition") {
    return "Either leave all cloudRecognition fields empty, or log in to the EasyAR website in your own browser, find appId, serverAddress, apiKey, and apiSecret yourself, then fill them only in local ignored Unity config.";
  }
  return "Review ProjectSettings/EasyAR/easyar.local.json.";
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isNonPlaceholderString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0 && !/paste-|placeholder|your_/i.test(value);
}

export function isOptionalNonPlaceholderString(value: unknown): boolean {
  return value === undefined || value === null || value === "" || isNonPlaceholderString(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function sanitizeRunResultNotes(value: string | undefined): string | null {
  return sanitizeIssueText(value);
}

export function sanitizeIssueText(value: string | undefined | null): string | null {
  if (!value) {
    return null;
  }
  return value.replace(
    /(licenseKey|license|accountToken|apiToken|accessToken|token|credential|appKey|appSecret|password|secret|key)\s*[:=]\s*\S+/gi,
    "$1=<redacted>"
  );
}

export function hasCloudRecognitionConfig(value: Record<string, unknown>): boolean {
  const fields = [value.appId, value.serverAddress, value.apiKey, value.apiSecret, value.appKey, value.appSecret];
  const configuredCount = fields.filter(isNonPlaceholderString).length;
  const emptyCount = fields.filter((field) => field === undefined || field === null || (typeof field === "string" && field.trim() === "")).length;
  return hasCompleteCloudRecognitionConfig(value) || emptyCount === fields.length;
}

export function hasCompleteCloudRecognitionConfig(value: Record<string, unknown>): boolean {
  const hasAppId = isNonPlaceholderString(value.appId);
  const hasServerAddress = isNonPlaceholderString(value.serverAddress);
  const hasModernApiKey = isNonPlaceholderString(value.apiKey);
  const hasModernApiSecret = isNonPlaceholderString(value.apiSecret);
  const hasLegacyAppSecret = isNonPlaceholderString(value.appSecret);
  return hasAppId && hasServerAddress && ((hasModernApiKey && hasModernApiSecret) || hasLegacyAppSecret);
}

export function cloudRecognitionCredentialMode(value: Record<string, unknown>): "appId-apiKey" | "legacy-appSecret" | "empty-or-incomplete" {
  if (isNonPlaceholderString(value.appId) && isNonPlaceholderString(value.serverAddress) && isNonPlaceholderString(value.apiKey) && isNonPlaceholderString(value.apiSecret)) {
    return "appId-apiKey";
  }
  if (isNonPlaceholderString(value.appId) && isNonPlaceholderString(value.serverAddress) && isNonPlaceholderString(value.appSecret)) {
    return "legacy-appSecret";
  }
  return "empty-or-incomplete";
}
