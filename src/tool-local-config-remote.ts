import path from "node:path";
import { ensureDirectory, exists, resolveProjectPath } from "./tool-project.js";
import { isRecord, readJsonFile } from "./tool-local-config.js";

export async function readLocalConfigForRemoteValidation(projectPath: string): Promise<{
  licenseKey?: string;
  bundleIdentifier?: string;
}> {
  const root = resolveProjectPath(projectPath);
  await ensureDirectory(root);
  const target = path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json");
  if (!await exists(target)) {
    return {};
  }

  const parsed = await readJsonFile(target);
  const value = isRecord(parsed) ? parsed : {};
  const easyar = isRecord(value.easyar) ? value.easyar : {};
  const unity = isRecord(value.unity) ? value.unity : {};
  return {
    licenseKey: typeof easyar.licenseKey === "string" ? easyar.licenseKey : undefined,
    bundleIdentifier: typeof unity.bundleIdentifier === "string" ? unity.bundleIdentifier : undefined
  };
}
