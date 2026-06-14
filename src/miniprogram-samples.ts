import { access, cp, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

export type MiniProgramSampleInfo = {
  id: "wechat-mega" | "wechat-crs";
  name: string;
  description: string;
  implementationStatus: "focused";
  requiredCapabilities: string[];
  requiredLocalConfigFields: Array<{
    key: string;
    secret: boolean;
    source: string;
  }>;
  expectedFiles: string[];
  officialUserActions: string[];
};

export const miniProgramSamples: MiniProgramSampleInfo[] = [
  {
    id: "wechat-mega",
    name: "WeChat Mini Program Mega",
    description: "Prepare and validate an EasyAR Mega WeChat Mini Program sample using user-downloaded official assets and a browser-managed EasyAR account.",
    implementationStatus: "focused",
    requiredCapabilities: [
      "WeChat Mini Program project",
      "WeChat Developer Tools CLI",
      "EasyAR Mega Mini Program SDK or official sample package",
      "EasyAR Mega license bound to the Mini Program app id",
      "Mega cloud localization library and block metadata"
    ],
    requiredLocalConfigFields: [
      { key: "wechatAppId", secret: false, source: "WeChat public platform or project.config.json" },
      { key: "easyarLicenseKey", secret: true, source: "EasyAR website, stored only in local untracked config or environment" },
      { key: "megaAppId", secret: false, source: "EasyAR website or Mega Studio" },
      { key: "megaServerAddress", secret: false, source: "EasyAR website or Mega Studio" },
      { key: "megaBlockName", secret: false, source: "Mega Studio or the logged-in EasyAR web console" },
      { key: "megaBlockId", secret: false, source: "Mega Studio or the logged-in EasyAR web console" }
    ],
    expectedFiles: [
      "project.config.json",
      "app.json",
      "miniprogram/",
      "easyar-generated/wechat-mega/LOCAL_CONFIG_FORM.md",
      "easyar.mega.local.json"
    ],
    officialUserActions: [
      "Register or log in on the EasyAR website in the user's browser.",
      "Create or open the EasyAR Mega license for the user's WeChat Mini Program app id.",
      "Download the official EasyAR Mega Mini Program SDK/sample package from the EasyAR website.",
      "Find the selected Mega cloud localization library, block name, and block id in the web console or Mega Studio.",
      "Log in to WeChat Developer Tools locally with the user's WeChat account."
    ]
  },
  {
    id: "wechat-crs",
    name: "WeChat Mini Program CRS / Cloud Recognition",
    description: "Prepare and validate an EasyAR CRS WeChat Mini Program sample without collecting cloud credentials in chat.",
    implementationStatus: "focused",
    requiredCapabilities: [
      "WeChat Mini Program project",
      "WeChat Developer Tools CLI",
      "EasyAR Mini Program SDK or official CRS sample package",
      "EasyAR license bound to the Mini Program app id",
      "Cloud Recognition app id, server address, API key, and API secret stored locally"
    ],
    requiredLocalConfigFields: [
      { key: "wechatAppId", secret: false, source: "WeChat public platform or project.config.json" },
      { key: "easyarLicenseKey", secret: true, source: "EasyAR website, stored only in local untracked config or environment" },
      { key: "crsAppId", secret: false, source: "EasyAR Cloud Recognition console" },
      { key: "crsServerAddress", secret: false, source: "EasyAR Cloud Recognition console" },
      { key: "crsApiKey", secret: true, source: "EasyAR Cloud Recognition console, stored only locally" },
      { key: "crsApiSecret", secret: true, source: "EasyAR Cloud Recognition console, stored only locally" }
    ],
    expectedFiles: [
      "project.config.json",
      "app.json",
      "miniprogram/",
      "easyar-generated/wechat-crs/LOCAL_CONFIG_FORM.md",
      "easyar.crs.local.json"
    ],
    officialUserActions: [
      "Register or log in on the EasyAR website in the user's browser.",
      "Create or open the EasyAR license for the user's WeChat Mini Program app id.",
      "Create or open the Cloud Recognition app and credentials in the EasyAR web console.",
      "Download the official EasyAR Mini Program SDK/sample package from the EasyAR website.",
      "Log in to WeChat Developer Tools locally with the user's WeChat account."
    ]
  }
];

export function findMiniProgramSample(sampleId: string): MiniProgramSampleInfo {
  const sample = miniProgramSamples.find((candidate) => candidate.id === sampleId);
  if (!sample) {
    throw new Error(`Unknown mini program sampleId "${sampleId}". Use easyar_list_miniprogram_samples first.`);
  }
  return sample;
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function isDirectory(filePath: string): Promise<boolean> {
  try {
    return (await stat(filePath)).isDirectory();
  } catch {
    return false;
  }
}

async function readJsonFile(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function findFilesByName(root: string, names: Set<string>, limit = 80): Promise<string[]> {
  const found: string[] = [];
  async function walk(dirPath: string, depth: number) {
    if (depth < 0 || found.length >= limit) {
      return;
    }
    let entries;
    try {
      entries = await readdir(dirPath, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (found.length >= limit || entry.name === "node_modules" || entry.name === ".git") {
        continue;
      }
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, depth - 1);
      } else if (names.has(entry.name)) {
        found.push(path.relative(root, fullPath));
      }
    }
  }
  await walk(root, 5);
  return found;
}

function valueLooksSet(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0 && !/^(changeme|todo|placeholder|your-|xxx)/i.test(value.trim());
}

export async function inspectMiniProgramProject(root: string, sample: MiniProgramSampleInfo) {
  const projectConfigPath = path.join(root, "project.config.json");
  const projectPrivateConfigPath = path.join(root, "project.private.config.json");
  const appJsonCandidates = [
    path.join(root, "app.json"),
    path.join(root, "miniprogram", "app.json")
  ];
  const projectConfig = await readJsonFile(projectConfigPath);
  const projectPrivateConfig = await readJsonFile(projectPrivateConfigPath);
  let appJsonPath: string | null = null;
  for (const candidate of appJsonCandidates) {
    if (await pathExists(candidate)) {
      appJsonPath = candidate;
      break;
    }
  }
  const appJson = appJsonPath ? await readJsonFile(appJsonPath) : null;
  const appid = projectConfig?.appid ?? projectPrivateConfig?.appid ?? null;
  const miniprogramRootValue = typeof projectConfig?.miniprogramRoot === "string"
    ? projectConfig.miniprogramRoot
    : "miniprogram/";
  const miniprogramRoot = path.resolve(root, miniprogramRootValue);
  const sdkHints = await findFilesByName(root, new Set([
    "easyar.js",
    "easyar.min.js",
    "easyar-wechat.js",
    "easyar-mega.js",
    "easyar-crs.js"
  ]));
  const configFile = sample.id === "wechat-mega" ? "easyar.mega.local.json" : "easyar.crs.local.json";
  const localConfigPath = path.join(root, configFile);
  const localConfig = await readJsonFile(localConfigPath);
  const localConfigPresence = sample.requiredLocalConfigFields.map((field) => ({
    key: field.key,
    secret: field.secret,
    present: valueLooksSet(localConfig?.[field.key]),
    source: field.source
  }));
  const pages = Array.isArray(appJson?.pages) ? appJson.pages : [];

  const checks = [
    {
      name: "project.config.json",
      status: await pathExists(projectConfigPath) ? "passed" : "blocked",
      evidence: await pathExists(projectConfigPath) ? "Found project.config.json." : "project.config.json is missing."
    },
    {
      name: "WeChat app id",
      status: valueLooksSet(appid) ? "passed" : "blocked",
      evidence: valueLooksSet(appid) ? "A non-empty appid is configured." : "No appid found in project.config.json or project.private.config.json."
    },
    {
      name: "app.json",
      status: appJson ? "passed" : "blocked",
      evidence: appJsonPath ? `Found ${path.relative(root, appJsonPath)}.` : "No app.json found at project root or miniprogram/app.json."
    },
    {
      name: "miniprogram root",
      status: await isDirectory(miniprogramRoot) ? "passed" : "blocked",
      evidence: await isDirectory(miniprogramRoot) ? `Found ${path.relative(root, miniprogramRoot)}.` : `Missing configured miniprogram root: ${miniprogramRootValue}.`
    },
    {
      name: "EasyAR Mini Program SDK hints",
      status: sdkHints.length > 0 ? "passed" : "warning",
      evidence: sdkHints.length > 0 ? `Found ${sdkHints.slice(0, 8).join(", ")}.` : "No EasyAR Mini Program SDK file hints found yet; import the official SDK/sample package locally."
    },
    {
      name: "Local EasyAR config",
      status: localConfigPresence.every((item) => item.present || !item.secret) ? "passed" : "warning",
      evidence: await pathExists(localConfigPath)
        ? `Found ${configFile}; secret values are not returned.`
        : `${configFile} is missing; write the local config form and fill the file locally.`
    }
  ];

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name
    },
    project: {
      hasProjectConfig: await pathExists(projectConfigPath),
      hasProjectPrivateConfig: await pathExists(projectPrivateConfigPath),
      appidPresent: valueLooksSet(appid),
      appJson: appJsonPath ? path.relative(root, appJsonPath) : null,
      miniprogramRoot: path.relative(root, miniprogramRoot),
      pages,
      sdkHints
    },
    localConfig: {
      file: configFile,
      exists: await pathExists(localConfigPath),
      fields: localConfigPresence
    },
    checks,
    nextActions: buildMiniProgramNextActions(sample, checks),
    security: [
      "Do not paste EasyAR, WeChat, CRS, or Mega secrets into chat.",
      "Generated reports only show whether local fields are present; raw secret values stay in local untracked files or environment variables.",
      "Official login, download, and credential creation remain browser/tool handoffs performed by the user."
    ]
  };
}

function buildMiniProgramNextActions(sample: MiniProgramSampleInfo, checks: Array<{ status: string }>) {
  if (checks.some((check) => check.status === "blocked")) {
    return [
      "Open the official WeChat Mini Program project in WeChat Developer Tools once.",
      "Run easyar_write_miniprogram_local_config_form and fill the local config file outside chat.",
      "Import the official EasyAR Mini Program SDK/sample package downloaded by the user.",
      `Rerun easyar_inspect_miniprogram_project sampleId=${sample.id}.`
    ];
  }
  return [
    `Run easyar_write_miniprogram_preflight sampleId=${sample.id}.`,
    `Run easyar_write_miniprogram_run_sequence sampleId=${sample.id}.`,
    "Open the project in WeChat Developer Tools, compile, preview on a real device, and record redacted evidence."
  ];
}

export function buildMiniProgramLocalConfigForm(sample: MiniProgramSampleInfo) {
  const configFile = sample.id === "wechat-mega" ? "easyar.mega.local.json" : "easyar.crs.local.json";
  return {
    generatedAt: new Date().toISOString(),
    sample: {
      id: sample.id,
      name: sample.name
    },
    configFile,
    fields: sample.requiredLocalConfigFields,
    template: Object.fromEntries(sample.requiredLocalConfigFields.map((field) => [field.key, field.secret ? "<fill locally; do not paste in chat>" : ""])),
    storageRules: [
      `Keep ${configFile} untracked.`,
      "Use environment variables or a local secret manager if the team already has one.",
      "Generated Markdown may mention field names and presence only, never raw secret values."
    ],
    gitignoreEntries: [configFile, "easyar.*.local.json"]
  };
}

export function buildMiniProgramLocalConfigFormMarkdown(form: ReturnType<typeof buildMiniProgramLocalConfigForm>) {
  return [
    `# ${form.sample.name} Local Config Form`,
    "",
    `Config file: \`${form.configFile}\``,
    "",
    "## Fields",
    "",
    ...form.fields.map((field) => `- \`${field.key}\` (${field.secret ? "secret" : "non-secret"}): ${field.source}`),
    "",
    "## Template",
    "",
    "```json",
    JSON.stringify(form.template, null, 2),
    "```",
    "",
    "## Storage Rules",
    "",
    ...form.storageRules.map((rule) => `- ${rule}`),
    ""
  ].join("\n");
}

export function buildMiniProgramPreflightMarkdown(report: Awaited<ReturnType<typeof inspectMiniProgramProject>>) {
  return [
    `# ${report.sample.name} Preflight`,
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Checks",
    "",
    ...report.checks.map((check) => `- ${check.status.toUpperCase()} - ${check.name}: ${check.evidence}`),
    "",
    "## Local Config",
    "",
    `File: \`${report.localConfig.file}\` (${report.localConfig.exists ? "found" : "missing"})`,
    "",
    ...report.localConfig.fields.map((field) => `- \`${field.key}\`: ${field.present ? "present" : "missing"}${field.secret ? " (secret, value hidden)" : ""}`),
    "",
    "## Next Actions",
    "",
    ...report.nextActions.map((action) => `- ${action}`),
    "",
    "## Security",
    "",
    ...report.security.map((rule) => `- ${rule}`),
    ""
  ].join("\n");
}

export function buildMiniProgramRunSequence(sample: MiniProgramSampleInfo) {
  return {
    generatedAt: new Date().toISOString(),
    sample: {
      id: sample.id,
      name: sample.name
    },
    steps: [
      {
        name: "Official account handoff",
        action: "User logs in to EasyAR and WeChat official tools in browser/native tools. MCP does not collect passwords."
      },
      {
        name: "Download official SDK/sample",
        action: "User downloads the official EasyAR Mini Program SDK/sample package from the EasyAR website and points MCP/Codex at the local path if import automation is needed."
      },
      {
        name: "Prepare local config",
        action: `Run easyar_write_miniprogram_local_config_form sampleId=${sample.id}, then fill the local config file outside chat.`
      },
      {
        name: "Inspect project",
        action: `Run easyar_inspect_miniprogram_project sampleId=${sample.id} and resolve blocked checks.`
      },
      {
        name: "WeChat Developer Tools",
        action: "Open the project in WeChat Developer Tools, compile locally, and use preview on a real device."
      },
      {
        name: "Device evidence",
        action: sample.id === "wechat-mega"
          ? "Verify camera permission, Mega service connectivity, selected block/library metadata, and real-device localization evidence."
          : "Verify camera permission, CRS service connectivity, cloud target recognition, and real-device recognition evidence."
      }
    ],
    security: [
      "Do not commit local config, EasyAR license keys, CRS API secrets, Mega secrets, WeChat credentials, QR codes, or upload private keys.",
      "Use screenshots/log excerpts only after redacting secrets and account identifiers."
    ]
  };
}

export function buildMiniProgramRunSequenceMarkdown(sequence: ReturnType<typeof buildMiniProgramRunSequence>) {
  return [
    `# ${sequence.sample.name} Run Sequence`,
    "",
    `Generated: ${sequence.generatedAt}`,
    "",
    ...sequence.steps.map((step, index) => `${index + 1}. ${step.name}\n\n   ${step.action}`),
    "",
    "## Security",
    "",
    ...sequence.security.map((rule) => `- ${rule}`),
    ""
  ].join("\n");
}

export async function writeMiniProgramArtifact(root: string, sample: MiniProgramSampleInfo, fileName: string, contents: string, overwrite: boolean) {
  const target = path.join(root, "easyar-generated", sample.id, fileName);
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Target path must stay inside the Mini Program project.");
  }
  if (!overwrite && await pathExists(target)) {
    return { written: false, path: target };
  }
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, contents, "utf8");
  return { written: true, path: target };
}

export function miniProgramSampleTargetDir(root: string, sample: MiniProgramSampleInfo, relativeTargetDir?: string) {
  const defaultTarget = path.join("miniprogram", "easyar-samples", sample.id);
  const target = path.resolve(root, relativeTargetDir ?? defaultTarget);
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Target directory must stay inside the Mini Program project.");
  }
  return target;
}

async function collectCopyPlan(sourceRoot: string, limit = 200) {
  const files: string[] = [];
  const skipped: string[] = [];
  async function walk(dirPath: string, depth: number) {
    if (depth < 0 || files.length >= limit) {
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
      const relative = path.relative(sourceRoot, fullPath);
      if (shouldSkipOfficialPackagePath(relative)) {
        skipped.push(relative);
        continue;
      }
      if (entry.isDirectory()) {
        await walk(fullPath, depth - 1);
      } else if (files.length < limit) {
        files.push(relative);
      }
    }
  }
  await walk(sourceRoot, 8);
  return { files, skipped };
}

function shouldSkipOfficialPackagePath(relativePath: string) {
  return relativePath
    .split(path.sep)
    .some((part) => part === ".git" || part === "node_modules" || part === "dist" || part === "Library" || part === "Temp")
    || /(^|[/\\])project\.private\.config\.json$/i.test(relativePath)
    || /(^|[/\\])easyar\..*\.local\.json$/i.test(relativePath)
    || /\.(log|key|p12|p8|pem)$/i.test(relativePath);
}

export async function importMiniProgramSampleFromLocalPackage(input: {
  root: string;
  sample: MiniProgramSampleInfo;
  packagePath: string;
  relativeTargetDir?: string;
  overwrite: boolean;
  dryRun: boolean;
}) {
  const source = path.resolve(input.root, input.packagePath);
  if (!await isDirectory(source)) {
    throw new Error(`Official local package path is not a directory: ${source}`);
  }
  const target = miniProgramSampleTargetDir(input.root, input.sample, input.relativeTargetDir);
  const targetExists = await pathExists(target);
  const plan = await collectCopyPlan(source);
  if (input.dryRun) {
    return {
      dryRun: true,
      source,
      target,
      targetExists,
      overwrite: input.overwrite,
      fileCountPreview: plan.files.length,
      sampleFiles: plan.files.slice(0, 40),
      skippedPreview: plan.skipped.slice(0, 40),
      nextActions: [
        "Confirm this source is the official EasyAR Mini Program SDK/sample package downloaded by the user.",
        "Run again with dryRun=false to copy files into the Mini Program project.",
        `Run easyar_inspect_miniprogram_project sampleId=${input.sample.id} after import.`
      ],
      security: "This tool copies local files only. It skips common private config, secret, log, node_modules, and VCS paths."
    };
  }
  if (targetExists && !input.overwrite) {
    throw new Error(`Target already exists: ${target}`);
  }
  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target, {
    recursive: true,
    force: input.overwrite,
    filter: (sourcePath) => {
      const relative = path.relative(source, sourcePath);
      return relative === "" || !shouldSkipOfficialPackagePath(relative);
    }
  });
  return {
    dryRun: false,
    source,
    target,
    copied: true,
    fileCountPreview: plan.files.length,
    skippedPreview: plan.skipped.slice(0, 40),
    nextActions: [
      `Run easyar_inspect_miniprogram_project sampleId=${input.sample.id}.`,
      "Open the project in WeChat Developer Tools and confirm the imported sample compiles.",
      "Fill local EasyAR config outside chat before previewing on a real device."
    ],
    security: "No secret values are returned. Review copied files before committing."
  };
}

export function analyzeMiniProgramDevtoolsLog(logText: string, sample: MiniProgramSampleInfo | null = null) {
  const redacted = redactMiniProgramSecretText(logText);
  const rules = [
    {
      id: "login-required",
      pattern: /(need\s+login|not\s+login|login required|请.*登录|未登录)/i,
      severity: "blocker",
      action: "Open WeChat Developer Tools and log in locally, then rerun the command."
    },
    {
      id: "appid-invalid",
      pattern: /(appid|app id).*(invalid|missing|empty|错误|不存在|未填写)/i,
      severity: "blocker",
      action: "Check project.config.json or project.private.config.json and use the official Mini Program app id."
    },
    {
      id: "domain-not-configured",
      pattern: /(request合法域名|downloadFile合法域名|uploadFile合法域名|domain|域名).*(not|未|fail|失败|配置)/i,
      severity: "blocker",
      action: "Configure EasyAR service domains in the WeChat Mini Program console, then rebuild/preview."
    },
    {
      id: "package-too-large",
      pattern: /(package|包).*(too large|exceed|超过|过大)/i,
      severity: "blocker",
      action: "Move large assets to subpackages or remote official resources according to WeChat Mini Program limits."
    },
    {
      id: "camera-permission",
      pattern: /(camera|摄像头|scope\.camera|authorize).*(denied|fail|失败|拒绝|未授权)/i,
      severity: "blocker",
      action: "Check Mini Program camera permission flow and test on a real device."
    },
    {
      id: "easyar-sdk-missing",
      pattern: /(easyar|EasyAR).*(not found|cannot find|missing|找不到|不存在)/i,
      severity: "blocker",
      action: "Import the official EasyAR Mini Program SDK/sample package into the project."
    },
    {
      id: "crs-network",
      pattern: /(cloud|crs|recognition|识别).*(timeout|unauthorized|403|401|网络|失败)/i,
      severity: sample?.id === "wechat-crs" ? "blocker" : "warning",
      action: "Verify CRS local config, network allowlist, and official Cloud Recognition credentials outside chat."
    },
    {
      id: "mega-localization",
      pattern: /(mega|localization|定位|block).*(fail|failed|timeout|not found|失败|未找到)/i,
      severity: sample?.id === "wechat-mega" ? "blocker" : "warning",
      action: "Verify Mega local config, block metadata, service reachability, and real mapped environment."
    }
  ];
  const findings = rules
    .filter((rule) => rule.pattern.test(redacted))
    .map((rule) => ({
      id: rule.id,
      severity: rule.severity,
      action: rule.action,
      evidence: firstMatchingLine(redacted, rule.pattern)
    }));
  return {
    generatedAt: new Date().toISOString(),
    sample: sample ? { id: sample.id, name: sample.name } : null,
    findingCount: findings.length,
    findings,
    sanitizedTail: redacted.slice(-12000),
    nextActions: findings.length > 0
      ? Array.from(new Set(findings.map((finding) => finding.action)))
      : [
          "No known WeChat/EasyAR Mini Program blocker pattern was detected in the provided log.",
          "If the sample still fails, collect a longer DevTools log and a real-device screenshot with secrets redacted."
        ]
  };
}

function firstMatchingLine(text: string, pattern: RegExp) {
  return text.split(/\r?\n/).find((line) => pattern.test(line))?.trim() ?? null;
}

export function redactMiniProgramSecretText(text: string) {
  return text
    .replace(/((?:license|licenseKey|apiKey|apiSecret|appKey|appSecret|secret|token|password|credential)\s*[:=]\s*)("[^"]+"|'[^']+'|[^\s,;&]+)/gi, "$1<redacted>")
    .replace(/([?&](?:token|apiKey|apiSecret|appKey|appSecret|secret|credential|password)=)[^&\s]+/gi, "$1<redacted>")
    .replace(/\b[A-Za-z0-9+/]{80,}={0,2}\b/g, "<redacted>");
}
