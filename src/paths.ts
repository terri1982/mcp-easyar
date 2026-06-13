import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const packageJsonPath = path.join(packageRoot, "package.json");
export const officialOpenApiPath = path.join(packageRoot, "docs", "openapi", "easyar-mcp-account-api.openapi.json");

type PackageMetadata = {
  name?: string;
  version?: string;
};

function readPackageMetadata(): PackageMetadata {
  try {
    return JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageMetadata;
  } catch {
    return {};
  }
}

export const packageMetadata = readPackageMetadata();
export const packageVersion = packageMetadata.version ?? "0.0.0";
