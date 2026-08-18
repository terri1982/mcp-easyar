import path from "node:path";
import { readFile } from "node:fs/promises";
import { ensureDirectory, exists, resolveProjectPath } from "./tool-project.js";
import { isRecord, readJsonFile } from "./tool-local-config.js";

export async function readLocalConfigForRemoteValidation(projectPath: string): Promise<{
  licenseKey?: string;
  bundleIdentifier?: string;
}> {
  const root = resolveProjectPath(projectPath);
  await ensureDirectory(root);
  const target = path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json");
  let licenseKey: string | undefined;
  let bundleIdentifier: string | undefined;
  if (await exists(target)) {
    const parsed = await readJsonFile(target);
    const value = isRecord(parsed) ? parsed : {};
    const easyar = isRecord(value.easyar) ? value.easyar : {};
    const unity = isRecord(value.unity) ? value.unity : {};
    licenseKey = typeof easyar.licenseKey === "string" ? easyar.licenseKey : undefined;
    bundleIdentifier = typeof unity.bundleIdentifier === "string" ? unity.bundleIdentifier : undefined;
  }

  // Unity's canonical Android identifier lives in ProjectSettings.asset. The
  // local EasyAR bridge is optional, so do not fall back to a generated package
  // name when a real project identifier is already available.
  if (!bundleIdentifier) {
    const projectSettingsPath = path.join(root, "ProjectSettings", "ProjectSettings.asset");
    if (await exists(projectSettingsPath)) {
      const projectSettings = await readFile(projectSettingsPath, "utf8");
      bundleIdentifier = projectSettings.match(
        /applicationIdentifier:\s*\n\s*Android:\s*([^\s#]+)/
      )?.[1];
    }
  }

  return {
    licenseKey,
    bundleIdentifier
  };
}
