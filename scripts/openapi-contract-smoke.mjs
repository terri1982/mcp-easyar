import { readFile } from "node:fs/promises";

const contractPath = new URL("../docs/openapi/easyar-mcp-account-api.openapi.json", import.meta.url);
const contract = JSON.parse(await readFile(contractPath, "utf8"));

assert(contract.openapi === "3.1.0", "OpenAPI version should be 3.1.0.");
assert(contract.info?.title === "mcp-easyar Official Account API", "OpenAPI title should identify mcp-easyar.");
assert(contract.components?.securitySchemes?.EasyARBearerAuth?.scheme === "bearer", "OpenAPI contract should require bearer auth.");

const requiredPaths = [
  ["/mcp/account/status", "get"],
  ["/mcp/license/validate", "post"],
  ["/mcp/downloads", "post"],
  ["/mcp/cloud-recognition/credentials", "post"]
];

for (const [path, method] of requiredPaths) {
  assert(contract.paths?.[path]?.[method], `OpenAPI contract missing ${method.toUpperCase()} ${path}.`);
}

const cloudSchema = contract.components?.schemas?.CloudRecognitionMetadata;
assert(cloudSchema?.required?.includes("appId"), "Cloud Recognition metadata should require appId.");
assert(cloudSchema?.required?.includes("apiKeyPresent"), "Cloud Recognition metadata should require apiKeyPresent.");
assert(!Object.hasOwn(cloudSchema?.properties ?? {}, "apiKey"), "Cloud Recognition metadata must not expose raw apiKey.");
assert(!Object.hasOwn(cloudSchema?.properties ?? {}, "apiSecret"), "Cloud Recognition metadata must not expose raw apiSecret.");
assert(!Object.hasOwn(cloudSchema?.properties ?? {}, "appKey"), "Cloud Recognition metadata must not expose raw appKey.");
assert(!Object.hasOwn(cloudSchema?.properties ?? {}, "appSecret"), "Cloud Recognition metadata must not expose raw appSecret.");

const licenseKeySchema = contract.components?.schemas?.LicenseValidationRequest?.properties?.licenseKey;
assert(licenseKeySchema?.writeOnly === true, "License key request field should be writeOnly.");

const serialized = JSON.stringify(contract);
for (const forbidden of ["password", "verification code"]) {
  assert(serialized.toLowerCase().includes(forbidden), `Contract should explicitly mention ${forbidden} redaction.`);
}

console.log("mcp-easyar OpenAPI contract smoke passed.");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
