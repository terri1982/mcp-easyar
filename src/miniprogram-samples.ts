import { access, cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import os from "node:os";
import path from "node:path";
import { runProcess } from "./runtime.js";

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
  handoffBlockers: string[];
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
    ],
    handoffBlockers: [
      "A Unity Mega project is not a WeChat Mini Program Mega sample and cannot satisfy this target by itself.",
      "The user must download or provide the official EasyAR Mega WeChat Mini Program SDK/sample package before MCP can run preview validation.",
      "The selected Mega cloud localization library/block metadata must be filled locally before real-device localization can be claimed."
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
    ],
    handoffBlockers: [
      "The user must provide a WeChat Mini Program project or official EasyAR Mini Program CRS sample package.",
      "The Cloud Recognition target image must already be uploaded to the user's EasyAR CRS library.",
      "CRS API credentials must stay in local config or backend/cloud functions, never in chat."
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
  const rootAppJsonPath = path.join(root, "app.json");
  const hasRootAppJson = await pathExists(rootAppJsonPath);
  const miniprogramRootValue = typeof projectConfig?.miniprogramRoot === "string"
    ? projectConfig.miniprogramRoot
    : hasRootAppJson
      ? "."
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

export function buildMiniProgramWorkspacePlan(root: string, sample: MiniProgramSampleInfo, appId?: string) {
  const configForm = buildMiniProgramLocalConfigForm(sample);
  const pageRoot = path.join("miniprogram", "pages", "index");
  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name
    },
    appId: appId?.trim() || "",
    purpose: "Create a minimal WeChat Mini Program workspace shell for EasyAR MCP inspection and official package handoff.",
    files: [
      "project.config.json",
      path.join("miniprogram", "app.json"),
      path.join(pageRoot, "index.json"),
      path.join(pageRoot, "index.wxml"),
      path.join(pageRoot, "index.wxss"),
      path.join(pageRoot, "index.js"),
      path.join("easyar-generated", sample.id, "LOCAL_CONFIG_FORM.md"),
      ".gitignore",
      "README.easyar-miniprogram.md"
    ],
    localConfigFile: configForm.configFile,
    nextActions: [
      "Open the workspace in WeChat Developer Tools and bind the official Mini Program app id locally.",
      "Download the official EasyAR Mini Program SDK/sample package from the EasyAR website.",
      `Import the official package with easyar_import_miniprogram_sample_from_local_package sampleId=${sample.id} after reviewing a dry run.`,
      `Fill ${configForm.configFile} locally; do not paste license keys, API secrets, QR codes, or passwords into chat.`,
      `Run easyar_write_miniprogram_run_through_status sampleId=${sample.id} after each setup change.`
    ],
    handoffBlockers: sample.handoffBlockers,
    security: [
      "This scaffold is not an official EasyAR SDK or runnable AR sample by itself.",
      "It does not create EasyAR licenses, CRS credentials, Mega credentials, preview QR codes, or upload keys.",
      "The user must use the official EasyAR website and WeChat Developer Tools for login, download, license/key creation, preview, and upload."
    ]
  };
}

export function buildMiniProgramWorkspacePlanMarkdown(plan: ReturnType<typeof buildMiniProgramWorkspacePlan>) {
  return [
    `# ${plan.sample.name} Workspace Plan`,
    "",
    `Generated: ${plan.generatedAt}`,
    `Project path: \`${plan.projectPath}\``,
    `AppId: ${plan.appId || "not configured yet"}`,
    "",
    plan.purpose,
    "",
    "## Files",
    "",
    ...plan.files.map((file) => `- \`${file}\``),
    "",
    "## Local Config",
    "",
    `Fill locally: \`${plan.localConfigFile}\``,
    "",
    "## Next Actions",
    "",
    ...plan.nextActions.map((action) => `- ${action}`),
    "",
    "## Handoff Blockers",
    "",
    ...plan.handoffBlockers.map((blocker) => `- ${blocker}`),
    "",
    "## Security",
    "",
    ...plan.security.map((rule) => `- ${rule}`),
    ""
  ].join("\n");
}

async function writeMiniProgramWorkspaceFile(root: string, relativePath: string, contents: string, overwrite: boolean, created: string[], skipped: string[]) {
  const target = path.resolve(root, relativePath);
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Workspace file path must stay inside the Mini Program project.");
  }
  if (!overwrite && await pathExists(target)) {
    skipped.push(relative);
    return;
  }
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, contents, "utf8");
  created.push(relative);
}

function resolveInsideMiniProgramRoot(root: string, filePath: string, fieldName: string) {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(root, filePath);
  const relativePath = path.relative(root, absolutePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`${fieldName} must stay inside the Mini Program project.`);
  }
  return { absolutePath, relativePath };
}

export async function createMiniProgramSampleWorkspace(input: {
  root: string;
  sample: MiniProgramSampleInfo;
  appId?: string;
  projectName?: string;
  overwrite: boolean;
}) {
  const created: string[] = [];
  const skipped: string[] = [];
  const plan = buildMiniProgramWorkspacePlan(input.root, input.sample, input.appId);
  const appId = input.appId?.trim() ?? "";
  const projectName = input.projectName?.trim() || `mcp-easyar-${input.sample.id}`;
  const pageRoot = path.join("miniprogram", "pages", "index");
  const configForm = buildMiniProgramLocalConfigForm(input.sample);
  await mkdir(input.root, { recursive: true });
  await writeMiniProgramWorkspaceFile(input.root, "project.config.json", `${JSON.stringify({
    appid: appId,
    projectname: projectName,
    miniprogramRoot: "miniprogram/",
    setting: {
      urlCheck: true,
      es6: true,
      postcss: true,
      minified: true
    }
  }, null, 2)}\n`, input.overwrite, created, skipped);
  await writeMiniProgramWorkspaceFile(input.root, path.join("miniprogram", "app.json"), `${JSON.stringify({
    pages: ["pages/index/index"],
    window: {
      navigationBarTitleText: input.sample.id === "wechat-mega" ? "EasyAR Mega" : "EasyAR CRS",
      navigationBarBackgroundColor: "#0ea5e9",
      navigationBarTextStyle: "white"
    },
    permission: {
      "scope.camera": {
        desc: "Required for EasyAR sample camera preview."
      }
    }
  }, null, 2)}\n`, input.overwrite, created, skipped);
  await writeMiniProgramWorkspaceFile(input.root, path.join(pageRoot, "index.json"), "{}\n", input.overwrite, created, skipped);
  await writeMiniProgramWorkspaceFile(input.root, path.join(pageRoot, "index.wxml"), [
    "<view class=\"page\">",
    "  <view class=\"title\">EasyAR Mini Program Sample</view>",
    `  <view class=\"subtitle\">${input.sample.id}</view>`,
    "  <view class=\"note\">Import the official EasyAR Mini Program SDK/sample package before real AR preview.</view>",
    "</view>",
    ""
  ].join("\n"), input.overwrite, created, skipped);
  await writeMiniProgramWorkspaceFile(input.root, path.join(pageRoot, "index.wxss"), [
    "page { background: #f8fafc; color: #0f172a; }",
    ".page { min-height: 100vh; padding: 48rpx; box-sizing: border-box; }",
    ".title { font-size: 40rpx; font-weight: 600; margin-bottom: 20rpx; }",
    ".subtitle { color: #0369a1; font-size: 28rpx; margin-bottom: 28rpx; }",
    ".note { color: #475569; font-size: 26rpx; line-height: 1.6; }",
    ""
  ].join("\n"), input.overwrite, created, skipped);
  await writeMiniProgramWorkspaceFile(input.root, path.join(pageRoot, "index.js"), [
    "Page({",
    "  data: {",
    `    sampleId: \"${input.sample.id}\"`,
    "  }",
    "});",
    ""
  ].join("\n"), input.overwrite, created, skipped);
  await writeMiniProgramWorkspaceFile(input.root, ".gitignore", [
    "project.private.config.json",
    "private.*.key",
    "*.log",
    "easyar.*.local.json",
    "easyar-generated/**/DEVTOOLS_CHECK.log",
    "easyar-generated/**/WECHAT_PREVIEW_QR.png",
    "easyar-generated/**/WECHAT_PREVIEW_INFO.json",
    ""
  ].join("\n"), false, created, skipped);
  await writeMiniProgramWorkspaceFile(input.root, path.join("easyar-generated", input.sample.id, "LOCAL_CONFIG_FORM.md"), buildMiniProgramLocalConfigFormMarkdown(configForm), input.overwrite, created, skipped);
  await writeMiniProgramWorkspaceFile(input.root, "README.easyar-miniprogram.md", buildMiniProgramWorkspacePlanMarkdown(plan), input.overwrite, created, skipped);
  return {
    generatedAt: new Date().toISOString(),
    projectPath: input.root,
    sample: plan.sample,
    created,
    skipped,
    appIdConfigured: valueLooksSet(appId),
    localConfigFile: configForm.configFile,
    nextActions: plan.nextActions,
    security: plan.security
  };
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

export type MiniProgramDevtoolsCommandMode = "open" | "preview";

export function buildMiniProgramDevtoolsCommand(input: {
  root: string;
  sample: MiniProgramSampleInfo;
  mode: MiniProgramDevtoolsCommandMode;
  devtoolsArgs?: string[];
  logPath?: string;
  qrOutputPath?: string;
  infoOutputPath?: string;
}) {
  const relativeLogPath = input.logPath ?? path.join("easyar-generated", input.sample.id, "DEVTOOLS_CHECK.log");
  const resolvedLogPath = resolveInsideMiniProgramRoot(input.root, relativeLogPath, "logPath");
  const defaultQrOutputPath = path.join("easyar-generated", input.sample.id, "WECHAT_PREVIEW_QR.png");
  const defaultInfoOutputPath = path.join("easyar-generated", input.sample.id, "WECHAT_PREVIEW_INFO.json");
  const resolvedQrOutputPath = input.mode === "preview"
    ? resolveInsideMiniProgramRoot(input.root, input.qrOutputPath ?? defaultQrOutputPath, "qrOutputPath")
    : input.qrOutputPath
      ? resolveInsideMiniProgramRoot(input.root, input.qrOutputPath, "qrOutputPath")
      : null;
  const resolvedInfoOutputPath = input.mode === "preview"
    ? resolveInsideMiniProgramRoot(input.root, input.infoOutputPath ?? defaultInfoOutputPath, "infoOutputPath")
    : input.infoOutputPath
      ? resolveInsideMiniProgramRoot(input.root, input.infoOutputPath, "infoOutputPath")
      : null;
  const args = input.devtoolsArgs ?? (input.mode === "preview"
    ? [
        "preview",
        "--project",
        input.root,
        "--qr-format",
        "image",
        "--qr-output",
        resolvedQrOutputPath!.absolutePath,
        "--info-output",
        resolvedInfoOutputPath!.absolutePath
      ]
    : ["-o", input.root]);
  return {
    mode: input.mode,
    args,
    logPath: resolvedLogPath,
    qrOutputPath: resolvedQrOutputPath,
    infoOutputPath: resolvedInfoOutputPath,
    notes: input.mode === "preview"
      ? [
          "The default preview command uses WeChat Developer Tools CLI preview --project with QR/info output paths.",
          "Open WeChat Developer Tools, log in, and enable the service port before running preview.",
          "If the installed CLI version expects different arguments, pass exact devtoolsArgs."
        ]
      : [
          "The default open command opens the project in WeChat Developer Tools.",
          "Use mode=preview after the official sample package and local config are ready."
        ]
  };
}

export function buildMiniProgramDeviceValidationChecklist(sample: MiniProgramSampleInfo) {
  const sampleSpecificSteps = sample.id === "wechat-mega"
    ? [
        {
          id: "mega-service-ready",
          title: "Mega service and block metadata",
          requiredForCompletion: true,
          passCriteria: "The local config points to the intended Mega app/server and selected block/library metadata.",
          evidencePrompt: "Record non-secret Mega app id, server host, block name, and block id presence only."
        },
        {
          id: "mega-localized-on-device",
          title: "Real-device Mega localization",
          requiredForCompletion: true,
          passCriteria: "A real phone running the WeChat preview reports localization/tracking success in the mapped environment.",
          evidencePrompt: "Attach a redacted DevTools/device log excerpt showing Mega localization success, block found, tracking, or equivalent official sample success signal."
        }
      ]
    : [
        {
          id: "crs-service-ready",
          title: "CRS service and target library",
          requiredForCompletion: true,
          passCriteria: "The local config points to the intended CRS app/server and test target library.",
          evidencePrompt: "Record non-secret CRS app id, server host, and target/library name presence only."
        },
        {
          id: "crs-recognized-on-device",
          title: "Real-device Cloud Recognition",
          requiredForCompletion: true,
          passCriteria: "A real phone running the WeChat preview recognizes the intended cloud target.",
          evidencePrompt: "Attach a redacted DevTools/device log excerpt or screenshot note showing target recognition success."
        }
      ];
  return {
    generatedAt: new Date().toISOString(),
    sample: {
      id: sample.id,
      name: sample.name
    },
    steps: [
      {
        id: "official-login",
        title: "Official tool sessions",
        requiredForCompletion: true,
        passCriteria: "EasyAR website and WeChat Developer Tools are used through the user's own official sessions.",
        evidencePrompt: "Record that official sessions were used; do not store passwords, QR codes, or tokens."
      },
      {
        id: "project-preflight",
        title: "Local project preflight",
        requiredForCompletion: true,
        passCriteria: "PREFLIGHT.md has no blocked project checks and required local config fields are present.",
        evidencePrompt: "Reference easyar-generated/<sampleId>/PREFLIGHT.md and record blocked check count."
      },
      {
        id: "devtools-check",
        title: "WeChat Developer Tools check",
        requiredForCompletion: true,
        passCriteria: "DevTools opens or compiles/previews the project without blocker findings.",
        evidencePrompt: "Reference DEVTOOLS_CHECK.log or a redacted log analyzed by easyar_analyze_miniprogram_devtools_log."
      },
      {
        id: "real-device-preview",
        title: "Real-device WeChat preview",
        requiredForCompletion: true,
        passCriteria: "A real phone scans the WeChat preview and grants camera permission.",
        evidencePrompt: "Record device model, WeChat preview path, camera permission result, and redacted screenshot/log note."
      },
      ...sampleSpecificSteps
    ],
    completionAcceptanceRules: [
      "All required validation steps must pass before the Mini Program sample is marked complete.",
      "A DevTools open check alone is not enough; real-device preview evidence is required.",
      "Screenshots and logs must be redacted before they are shared or committed.",
      "Do not commit QR codes, upload keys, EasyAR license keys, CRS API secrets, WeChat credentials, or raw account logs."
    ],
    security: [
      "The checklist records paths, booleans, non-secret ids/names, and redacted excerpts only.",
      "The user performs EasyAR and WeChat login, package download, license/key creation, and preview in official tools."
    ]
  };
}

export function buildMiniProgramDeviceValidationChecklistMarkdown(checklist: ReturnType<typeof buildMiniProgramDeviceValidationChecklist>) {
  return [
    `# ${checklist.sample.name} Device Validation Checklist`,
    "",
    `Generated: ${checklist.generatedAt}`,
    "",
    "## Steps",
    "",
    ...checklist.steps.flatMap((step, index) => [
      `${index + 1}. ${step.title}`,
      "",
      `   - Required for completion: ${step.requiredForCompletion ? "yes" : "no"}`,
      `   - Pass criteria: ${step.passCriteria}`,
      `   - Evidence: ${step.evidencePrompt}`,
      ""
    ]),
    "## Completion Acceptance Rules",
    "",
    ...checklist.completionAcceptanceRules.map((rule) => `- ${rule}`),
    "",
    "## Security",
    "",
    ...checklist.security.map((rule) => `- ${rule}`),
    ""
  ].join("\n");
}

export function buildMiniProgramRunResultForm(sample: MiniProgramSampleInfo) {
  const checklist = buildMiniProgramDeviceValidationChecklist(sample);
  return {
    generatedAt: new Date().toISOString(),
    sample: checklist.sample,
    resultFile: "RUN_RESULT.md",
    fields: {
      overallStatus: "blocked | failed | passed",
      devtoolsStatus: "not-run | blocked | failed | passed",
      devicePreviewStatus: "not-run | blocked | failed | passed",
      deviceModel: "",
      wechatVersion: "",
      observedBehavior: "",
      redactedLogPath: "",
      redactedScreenshotPath: "",
      notes: ""
    },
    requiredStepIds: checklist.steps.filter((step) => step.requiredForCompletion).map((step) => step.id),
    safeWriteTemplate: {
      projectPath: "/path/to/miniprogram",
      sampleId: sample.id,
      overallStatus: "passed",
      devtoolsStatus: "passed",
      devicePreviewStatus: "passed",
      passedStepIds: checklist.steps.filter((step) => step.requiredForCompletion).map((step) => step.id),
      evidenceSummary: sample.id === "wechat-mega"
        ? "Real-device WeChat preview localized in the mapped Mega environment; redacted log/screenshot evidence recorded locally."
        : "Real-device WeChat preview recognized the intended CRS cloud target; redacted log/screenshot evidence recorded locally."
    },
    completionAcceptanceRules: checklist.completionAcceptanceRules,
    security: checklist.security
  };
}

export function buildMiniProgramRunResultFormMarkdown(form: ReturnType<typeof buildMiniProgramRunResultForm>) {
  return [
    `# ${form.sample.name} Run Result Form`,
    "",
    `Generated: ${form.generatedAt}`,
    "",
    "## Fill Locally",
    "",
    "```json",
    JSON.stringify(form.fields, null, 2),
    "```",
    "",
    "## Required Step IDs",
    "",
    ...form.requiredStepIds.map((id) => `- \`${id}\``),
    "",
    "## Safe MCP Write Template",
    "",
    "```json",
    JSON.stringify(form.safeWriteTemplate, null, 2),
    "```",
    "",
    "## Completion Acceptance Rules",
    "",
    ...form.completionAcceptanceRules.map((rule) => `- ${rule}`),
    "",
    "## Security",
    "",
    ...form.security.map((rule) => `- ${rule}`),
    ""
  ].join("\n");
}

export function buildMiniProgramRunResultMarkdown(input: {
  sample: MiniProgramSampleInfo;
  overallStatus: "blocked" | "failed" | "passed";
  devtoolsStatus: "not-run" | "blocked" | "failed" | "passed";
  devicePreviewStatus: "not-run" | "blocked" | "failed" | "passed";
  passedStepIds: string[];
  evidenceSummary: string;
  redactedLogPath?: string;
  redactedScreenshotPath?: string;
  deviceModel?: string;
  wechatVersion?: string;
  notes?: string;
}) {
  const checklist = buildMiniProgramDeviceValidationChecklist(input.sample);
  const requiredStepIds = checklist.steps.filter((step) => step.requiredForCompletion).map((step) => step.id);
  const missingRequiredStepIds = requiredStepIds.filter((id) => !input.passedStepIds.includes(id));
  const runThroughComplete = input.overallStatus === "passed"
    && input.devtoolsStatus === "passed"
    && input.devicePreviewStatus === "passed"
    && missingRequiredStepIds.length === 0
    && input.evidenceSummary.trim().length > 0;
  return [
    `# ${input.sample.name} Run Result`,
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Overall status: ${input.overallStatus}`,
    `DevTools status: ${input.devtoolsStatus}`,
    `Device preview status: ${input.devicePreviewStatus}`,
    `Run-through complete: ${runThroughComplete ? "yes" : "no"}`,
    "",
    "## Evidence",
    "",
    `Device model: ${input.deviceModel?.trim() || "not recorded"}`,
    `WeChat version: ${input.wechatVersion?.trim() || "not recorded"}`,
    `Redacted log path: ${input.redactedLogPath?.trim() || "not recorded"}`,
    `Redacted screenshot path: ${input.redactedScreenshotPath?.trim() || "not recorded"}`,
    "",
    input.evidenceSummary.trim() || "No evidence summary recorded.",
    "",
    "## Passed Required Steps",
    "",
    ...input.passedStepIds.map((id) => `- \`${id}\``),
    "",
    "## Missing Required Steps",
    "",
    ...(missingRequiredStepIds.length > 0 ? missingRequiredStepIds.map((id) => `- \`${id}\``) : ["No missing required steps."]),
    "",
    "## Notes",
    "",
    input.notes?.trim() || "No notes.",
    "",
    "## Security",
    "",
    ...checklist.security.map((rule) => `- ${rule}`),
    ""
  ].join("\n");
}

export function miniProgramRunResultHasUsableEvidence(runResultText: string | null) {
  if (!runResultText || !/Run-through complete:\s+yes/i.test(runResultText)) {
    return false;
  }
  const evidenceMatch = runResultText.match(/## Evidence\s+[\s\S]*?\n\n([\s\S]*?)\n\n## Passed Required Steps/i);
  const evidenceSummary = evidenceMatch?.[1]?.trim() ?? "";
  if (evidenceSummary.length < 24) {
    return false;
  }
  return !/^(no evidence summary recorded|not recorded|todo|tbd|placeholder|changeme|fake|n\/a)$/i.test(evidenceSummary)
    && !/\b(no evidence|placeholder|changeme|todo|tbd|fake evidence)\b/i.test(evidenceSummary);
}

export async function buildMiniProgramCompletionReport(root: string, sample: MiniProgramSampleInfo) {
  const preflightPath = path.join(root, "easyar-generated", sample.id, "PREFLIGHT.md");
  const checklistPath = path.join(root, "easyar-generated", sample.id, "DEVICE_VALIDATION.md");
  const runResultPath = path.join(root, "easyar-generated", sample.id, "RUN_RESULT.md");
  const devtoolsLogPath = path.join(root, "easyar-generated", sample.id, "DEVTOOLS_CHECK.log");
  const previewQrPath = path.join(root, "easyar-generated", sample.id, "WECHAT_PREVIEW_QR.png");
  const previewInfoPath = path.join(root, "easyar-generated", sample.id, "WECHAT_PREVIEW_INFO.json");
  const preflightText = await readOptionalText(preflightPath);
  const checklistText = await readOptionalText(checklistPath);
  const runResultText = await readOptionalText(runResultPath);
  const devtoolsLogText = await readOptionalText(devtoolsLogPath);
  const devtoolsAnalysis = devtoolsLogText ? analyzeMiniProgramDevtoolsLog(devtoolsLogText, sample) : null;
  const checks = [
    {
      id: "preflight",
      status: preflightText && !/BLOCKED\s+-/i.test(preflightText) ? "passed" : "blocked",
      evidence: preflightText ? "PREFLIGHT.md exists and was inspected." : "PREFLIGHT.md is missing."
    },
    {
      id: "device-validation-checklist",
      status: checklistText ? "passed" : "blocked",
      evidence: checklistText ? "DEVICE_VALIDATION.md exists." : "DEVICE_VALIDATION.md is missing."
    },
    {
      id: "devtools-log",
      status: devtoolsLogText
        && (devtoolsAnalysis?.findingCount ?? 0) === 0
        && (devtoolsAnalysis?.successSignalCount ?? 0) > 0
        ? "passed"
        : "blocked",
      evidence: devtoolsLogText
        ? `DEVTOOLS_CHECK.log exists; blocker findings=${devtoolsAnalysis?.findingCount ?? "unknown"}; success signals=${devtoolsAnalysis?.successSignalCount ?? 0}.`
        : "DEVTOOLS_CHECK.log is missing."
    },
    {
      id: "run-result",
      status: miniProgramRunResultHasUsableEvidence(runResultText) ? "passed" : "blocked",
      evidence: runResultText
        ? "RUN_RESULT.md exists but must contain run-through complete plus a usable redacted evidence summary."
        : "RUN_RESULT.md is missing."
    }
  ];
  const blockers = checks
    .filter((check) => check.status !== "passed")
    .map((check) => ({
      id: check.id,
      detail: check.evidence,
      action: miniProgramCompletionAction(check.id, sample)
    }));
  const runThroughComplete = blockers.length === 0;
  return {
    generatedAt: new Date().toISOString(),
    sample: {
      id: sample.id,
      name: sample.name
    },
    runThroughComplete,
    checks,
    blockers,
    evidencePaths: {
      preflight: path.relative(root, preflightPath),
      deviceValidation: path.relative(root, checklistPath),
      devtoolsLog: path.relative(root, devtoolsLogPath),
      previewQr: path.relative(root, previewQrPath),
      previewInfo: path.relative(root, previewInfoPath),
      runResult: path.relative(root, runResultPath)
    },
    devtoolsFindings: devtoolsAnalysis?.findings ?? [],
    devtoolsSuccessSignals: devtoolsAnalysis?.successSignals ?? [],
    security: [
      "Completion requires real-device WeChat preview evidence, not only generated files.",
      "The report references local redacted artifacts only and must not include secrets, QR codes, license keys, CRS API secrets, or raw private logs."
    ]
  };
}

export function buildMiniProgramCompletionReportMarkdown(report: Awaited<ReturnType<typeof buildMiniProgramCompletionReport>>) {
  return [
    `# ${report.sample.name} Completion Report`,
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `Run-through complete: ${report.runThroughComplete ? "yes" : "no"}`,
    "",
    "## Checks",
    "",
    ...report.checks.map((check) => `- ${check.status.toUpperCase()} ${check.id}: ${check.evidence}`),
    "",
    "## Blockers",
    "",
    ...(report.blockers.length > 0
      ? report.blockers.map((blocker) => `- ${blocker.id}: ${blocker.detail} Action: ${blocker.action}`)
      : ["No completion blockers."]),
    "",
    "## Evidence Paths",
    "",
    ...Object.entries(report.evidencePaths).map(([key, value]) => `- ${key}: \`${value}\``),
    "",
    "## DevTools Findings",
    "",
    ...(report.devtoolsFindings.length > 0
      ? report.devtoolsFindings.map((finding) => `- ${finding.severity} ${finding.id}: ${finding.evidence ?? "no line evidence"}`)
      : ["No known DevTools blocker findings."]),
    "",
    "## DevTools Success Signals",
    "",
    ...(report.devtoolsSuccessSignals.length > 0
      ? report.devtoolsSuccessSignals.map((signal) => `- ${signal.id}: ${signal.evidence ?? "no line evidence"}`)
      : ["No known DevTools success signals."]),
    "",
    "## Security",
    "",
    ...report.security.map((rule) => `- ${rule}`),
    ""
  ].join("\n");
}

export async function buildMiniProgramScopeStatus(root: string) {
  const items = [];
  for (const sample of miniProgramSamples) {
    const report = await buildMiniProgramCompletionReport(root, sample);
    const completionReportPath = path.join(root, "easyar-generated", sample.id, "COMPLETION_REPORT.md");
    const completionReportText = await readOptionalText(completionReportPath);
    items.push({
      sampleId: sample.id,
      sampleName: sample.name,
      runThroughComplete: report.runThroughComplete,
      completionReportExists: completionReportText !== null,
      completionReportPath: path.relative(root, completionReportPath),
      blockerCount: report.blockers.length,
      blockers: report.blockers,
      evidencePaths: report.evidencePaths
    });
  }
  const completedCount = items.filter((item) => item.runThroughComplete).length;
  const allMiniProgramSamplesComplete = completedCount === items.length;
  return {
    generatedAt: new Date().toISOString(),
    allMiniProgramSamplesComplete,
    completedCount,
    totalCount: items.length,
    sampleIds: items.map((item) => item.sampleId),
    items,
    nextActions: allMiniProgramSamplesComplete
      ? [
          "Review every referenced artifact and redacted evidence before making a public completion claim.",
          "Keep raw EasyAR, WeChat, CRS, license, QR code, and private log material out of GitHub."
        ]
      : items
          .filter((item) => !item.runThroughComplete)
          .flatMap((item) => [
            `Complete ${item.sampleId}: run the real-device WeChat preview, write RUN_RESULT.md, then regenerate COMPLETION_REPORT.md.`,
            `Rerun easyar_write_miniprogram_scope_status after ${item.sampleId} completion evidence is updated.`
          ]),
    security: [
      "This status summarizes local redacted artifacts only.",
      "Do not treat allMiniProgramSamplesComplete=true as valid unless the underlying artifacts contain real-device preview evidence.",
      "Do not commit raw logs, preview QR codes, EasyAR license keys, CRS API secrets, WeChat credentials, upload keys, or app secrets."
    ]
  };
}

export function buildMiniProgramScopeStatusMarkdown(status: Awaited<ReturnType<typeof buildMiniProgramScopeStatus>>) {
  return [
    "# EasyAR WeChat Mini Program Scope Status",
    "",
    `Generated: ${status.generatedAt}`,
    "",
    `All Mini Program samples complete: ${status.allMiniProgramSamplesComplete ? "yes" : "no"}`,
    `Completed: ${status.completedCount}/${status.totalCount}`,
    `Sample IDs: ${status.sampleIds.join(", ")}`,
    "",
    "## Samples",
    "",
    ...status.items.flatMap((item) => [
      `### ${item.sampleId}`,
      "",
      `Name: ${item.sampleName}`,
      `Run-through complete: ${item.runThroughComplete ? "yes" : "no"}`,
      `Completion report exists: ${item.completionReportExists ? "yes" : "no"}`,
      `Completion report path: \`${item.completionReportPath}\``,
      `Blocker count: ${item.blockerCount}`,
      "",
      "Blockers:",
      "",
      ...(item.blockers.length > 0
        ? item.blockers.map((blocker) => `- ${blocker.id}: ${blocker.detail} Action: ${blocker.action}`)
        : ["No blockers."]),
      "",
      "Evidence paths:",
      "",
      ...Object.entries(item.evidencePaths).map(([key, value]) => `- ${key}: \`${value}\``),
      ""
    ]),
    "## Next Actions",
    "",
    ...status.nextActions.map((action) => `- ${action}`),
    "",
    "## Security",
    "",
    ...status.security.map((rule) => `- ${rule}`),
    ""
  ].join("\n");
}

export async function buildMiniProgramRunThroughStatus(root: string, sample: MiniProgramSampleInfo) {
  const inspection = await inspectMiniProgramProject(root, sample);
  const completion = await buildMiniProgramCompletionReport(root, sample);
  const artifactNames = [
    "LOCAL_CONFIG_FORM.md",
    "PREFLIGHT.md",
    "RUN_SEQUENCE.md",
    "DEVTOOLS_CHECK.log",
    "WECHAT_PREVIEW_QR.png",
    "WECHAT_PREVIEW_INFO.json",
    "DEVICE_VALIDATION.md",
    "RUN_RESULT_FORM.md",
    "RUN_RESULT.md",
    "COMPLETION_REPORT.md"
  ];
  const artifacts: Array<{ fileName: string; relativePath: string; exists: boolean }> = [];
  for (const fileName of artifactNames) {
    const absolutePath = path.join(root, "easyar-generated", sample.id, fileName);
    artifacts.push({
      fileName,
      relativePath: path.relative(root, absolutePath),
      exists: await pathExists(absolutePath)
    });
  }
  const blockedChecks = inspection.checks.filter((check) => check.status === "blocked");
  const warningChecks = inspection.checks.filter((check) => check.status === "warning");
  const artifactExists = (fileName: string) => artifacts.find((artifact) => artifact.fileName === fileName)?.exists ?? false;
  const nextCalls = [];
  if (!artifactExists("LOCAL_CONFIG_FORM.md")) {
    nextCalls.push(`easyar_write_miniprogram_local_config_form projectPath=${root} sampleId=${sample.id}`);
  }
  if (warningChecks.some((check) => check.name === "EasyAR Mini Program SDK hints")) {
    nextCalls.push(`Provide the official ${sample.name} package downloaded from the EasyAR website, then run easyar_import_miniprogram_sample_from_local_package sampleId=${sample.id} dryRun=true.`);
  }
  if (blockedChecks.length > 0) {
    nextCalls.push(`easyar_inspect_miniprogram_project projectPath=${root} sampleId=${sample.id}`);
  } else if (!artifactExists("PREFLIGHT.md")) {
    nextCalls.push(`easyar_write_miniprogram_preflight projectPath=${root} sampleId=${sample.id}`);
  }
  if (blockedChecks.length === 0 && !artifactExists("RUN_SEQUENCE.md")) {
    nextCalls.push(`easyar_write_miniprogram_run_sequence projectPath=${root} sampleId=${sample.id}`);
  }
  if (blockedChecks.length === 0 && !artifactExists("DEVTOOLS_CHECK.log")) {
    nextCalls.push(`easyar_run_miniprogram_devtools_check projectPath=${root} sampleId=${sample.id} mode=open dryRun=true`);
    nextCalls.push(`easyar_run_miniprogram_devtools_check projectPath=${root} sampleId=${sample.id} mode=preview dryRun=true`);
  }
  if (blockedChecks.length === 0 && artifactExists("DEVTOOLS_CHECK.log") && (!artifactExists("WECHAT_PREVIEW_QR.png") || !artifactExists("WECHAT_PREVIEW_INFO.json"))) {
    nextCalls.push(`easyar_run_miniprogram_devtools_check projectPath=${root} sampleId=${sample.id} mode=preview dryRun=false`);
  }
  if (blockedChecks.length === 0 && !artifactExists("DEVICE_VALIDATION.md")) {
    nextCalls.push(`easyar_write_miniprogram_device_validation_checklist projectPath=${root} sampleId=${sample.id}`);
  }
  if (blockedChecks.length === 0 && !artifactExists("RUN_RESULT_FORM.md")) {
    nextCalls.push(`easyar_write_miniprogram_run_result_form projectPath=${root} sampleId=${sample.id}`);
  }
  if (blockedChecks.length === 0 && !artifactExists("RUN_RESULT.md")) {
    nextCalls.push("Run the WeChat real-device preview, collect redacted evidence, then call easyar_write_miniprogram_run_result.");
  }
  if (!completion.runThroughComplete && artifactExists("RUN_RESULT.md")) {
    nextCalls.push(`easyar_generate_miniprogram_completion_report projectPath=${root} sampleId=${sample.id}`);
  }
  if (completion.runThroughComplete && !artifactExists("COMPLETION_REPORT.md")) {
    nextCalls.push(`easyar_write_miniprogram_completion_report projectPath=${root} sampleId=${sample.id}`);
  }
  if (completion.runThroughComplete && artifactExists("COMPLETION_REPORT.md")) {
    nextCalls.push("Run easyar_write_miniprogram_scope_status to update the two-sample Mini Program scope summary.");
  }

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name
    },
    runThroughComplete: completion.runThroughComplete,
    readiness: {
      blockedCheckCount: blockedChecks.length,
      warningCheckCount: warningChecks.length,
      blockedChecks: blockedChecks.map((check) => ({ name: check.name, evidence: check.evidence })),
      warningChecks: warningChecks.map((check) => ({ name: check.name, evidence: check.evidence }))
    },
    artifacts,
    handoffBlockers: sample.handoffBlockers,
    completionBlockers: completion.blockers,
    nextCalls: nextCalls.length > 0
      ? nextCalls
      : [
          "No immediate MCP action is required for this sample. Review redacted evidence before publishing or committing."
        ],
    security: [
      "This status returns file presence, check names, and redacted next actions only.",
      "Do not paste EasyAR passwords, WeChat credentials, preview QR codes, license keys, CRS API secrets, or raw private logs in chat.",
      "Real-device preview evidence is required before a Mini Program sample can be called complete."
    ]
  };
}

export function buildMiniProgramRunThroughStatusMarkdown(status: Awaited<ReturnType<typeof buildMiniProgramRunThroughStatus>>) {
  return [
    `# ${status.sample.name} Run-through Status`,
    "",
    `Generated: ${status.generatedAt}`,
    `Project path: \`${status.projectPath}\``,
    `Run-through complete: ${status.runThroughComplete ? "yes" : "no"}`,
    "",
    "## Readiness",
    "",
    `Blocked checks: ${status.readiness.blockedCheckCount}`,
    `Warning checks: ${status.readiness.warningCheckCount}`,
    "",
    ...(status.readiness.blockedChecks.length > 0
      ? status.readiness.blockedChecks.map((check) => `- BLOCKED ${check.name}: ${check.evidence}`)
      : ["No blocked readiness checks."]),
    "",
    ...(status.readiness.warningChecks.length > 0
      ? status.readiness.warningChecks.map((check) => `- WARNING ${check.name}: ${check.evidence}`)
      : ["No warning readiness checks."]),
    "",
    "## Artifacts",
    "",
    ...status.artifacts.map((artifact) => `- ${artifact.exists ? "FOUND" : "MISSING"} \`${artifact.relativePath}\``),
    "",
    "## Handoff Blockers",
    "",
    ...status.handoffBlockers.map((blocker) => `- ${blocker}`),
    "",
    "## Completion Blockers",
    "",
    ...(status.completionBlockers.length > 0
      ? status.completionBlockers.map((blocker) => `- ${blocker.id}: ${blocker.detail} Action: ${blocker.action}`)
      : ["No completion blockers."]),
    "",
    "## Next Calls",
    "",
    ...status.nextCalls.map((call) => `- ${call}`),
    "",
    "## Security",
    "",
    ...status.security.map((rule) => `- ${rule}`),
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

async function resolveOfficialPackageSource(inputRoot: string, packagePath: string) {
  const resolvedPackagePath = path.resolve(inputRoot, packagePath);
  if (await isDirectory(resolvedPackagePath)) {
    return {
      packageType: "directory" as const,
      packagePath: resolvedPackagePath,
      sourceRoot: resolvedPackagePath,
      cleanup: async () => {}
    };
  }
  if (!/\.zip$/i.test(resolvedPackagePath)) {
    throw new Error(`Official local package path is not a directory or .zip file: ${resolvedPackagePath}`);
  }
  if (!await pathExists(resolvedPackagePath)) {
    throw new Error(`Official local package path does not exist: ${resolvedPackagePath}`);
  }
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "mcp-easyar-miniprogram-"));
  const listResult = await runProcess("unzip", ["-Z", "-1", resolvedPackagePath], 120);
  if (listResult.exitCode !== 0) {
    await rm(tempRoot, { recursive: true, force: true });
    throw new Error(`Failed to inspect official .zip package with unzip: ${listResult.stderr || listResult.stdout || "unknown unzip list error"}`);
  }
  const zipValidation = validateMiniProgramZipEntries(listResult.stdout.split(/\r?\n/));
  if (!zipValidation.safe) {
    await rm(tempRoot, { recursive: true, force: true });
    throw new Error(`Refusing to extract unsafe official .zip package entries: ${zipValidation.unsafeEntries.join(", ")}`);
  }
  const unzipResult = await runProcess("unzip", ["-q", resolvedPackagePath, "-d", tempRoot], 120);
  if (unzipResult.exitCode !== 0) {
    await rm(tempRoot, { recursive: true, force: true });
    throw new Error(`Failed to extract official .zip package with unzip: ${unzipResult.stderr || unzipResult.stdout || "unknown unzip error"}`);
  }
  return {
    packageType: "zip" as const,
    packagePath: resolvedPackagePath,
    sourceRoot: await chooseExtractedPackageRoot(tempRoot),
    cleanup: async () => {
      await rm(tempRoot, { recursive: true, force: true });
    }
  };
}

async function chooseExtractedPackageRoot(tempRoot: string) {
  const entries = await readdir(tempRoot, { withFileTypes: true });
  const visibleEntries = entries.filter((entry) => !entry.name.startsWith("__MACOSX") && entry.name !== ".DS_Store");
  if (visibleEntries.length === 1 && visibleEntries[0]?.isDirectory()) {
    return path.join(tempRoot, visibleEntries[0].name);
  }
  return tempRoot;
}

export function validateMiniProgramZipEntries(entries: string[]) {
  const unsafeEntries = entries
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => {
      const normalizedEntry = entry.replace(/\\/g, "/");
      const parts = normalizedEntry.split("/").filter(Boolean);
      return normalizedEntry.startsWith("/")
        || /^[A-Za-z]:/.test(normalizedEntry)
        || parts.some((part) => part === "..");
    });
  return {
    safe: unsafeEntries.length === 0,
    unsafeEntries
  };
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
  const sourceInfo = await resolveOfficialPackageSource(input.root, input.packagePath);
  const source = sourceInfo.sourceRoot;
  const target = miniProgramSampleTargetDir(input.root, input.sample, input.relativeTargetDir);
  const targetExists = await pathExists(target);
  try {
    const plan = await collectCopyPlan(source);
    if (input.dryRun) {
      return {
        dryRun: true,
        packageType: sourceInfo.packageType,
        source: sourceInfo.packagePath,
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
        security: "This tool copies or extracts local files only. It skips common private config, secret, log, node_modules, and VCS paths."
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
      packageType: sourceInfo.packageType,
      source: sourceInfo.packagePath,
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
  } finally {
    await sourceInfo.cleanup();
  }
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
  const successRules = [
    {
      id: "camera-ready",
      pattern: /(camera|摄像头|scope\.camera|authorize).*(granted|success|ok|allowed|授权成功|允许)/i,
      meaning: "Camera permission appears granted on the Mini Program device preview."
    },
    {
      id: "devtools-preview-ready",
      pattern: /(preview|compile|编译|预览).*(success|ok|ready|done|成功|完成)/i,
      meaning: "WeChat Developer Tools appears to have compiled or prepared preview successfully."
    },
    {
      id: "mega-localized",
      pattern: /(mega|localization|localize|定位|block).*(success|succeeded|found|localized|tracking|成功|已定位|找到|跟踪)/i,
      meaning: "Mega localization or tracking appears successful."
    },
    {
      id: "crs-recognized",
      pattern: /(crs|cloud|recognition|target|识别|目标).*(success|recognized|found|matched|成功|识别到|找到|匹配)/i,
      meaning: "Cloud Recognition appears to have recognized the intended target."
    }
  ];
  const successSignals = successRules
    .filter((rule) => rule.pattern.test(redacted))
    .filter((rule) => {
      if (rule.id === "mega-localized") {
        return !sample || sample.id === "wechat-mega";
      }
      if (rule.id === "crs-recognized") {
        return !sample || sample.id === "wechat-crs";
      }
      return true;
    })
    .map((rule) => ({
      id: rule.id,
      meaning: rule.meaning,
      evidence: firstMatchingLine(redacted, rule.pattern)
    }));
  return {
    generatedAt: new Date().toISOString(),
    sample: sample ? { id: sample.id, name: sample.name } : null,
    findingCount: findings.length,
    findings,
    successSignalCount: successSignals.length,
    successSignals,
    sanitizedTail: redacted.slice(-12000),
    nextActions: findings.length > 0
      ? Array.from(new Set(findings.map((finding) => finding.action)))
      : successSignals.length > 0
        ? [
            "Use the successSignals as redacted evidence when writing easyar_write_miniprogram_run_result.",
            "Confirm the evidence came from a real-device WeChat preview before marking the sample complete."
          ]
      : [
          "No known WeChat/EasyAR Mini Program blocker pattern was detected in the provided log.",
          "If the sample still fails, collect a longer DevTools log and a real-device screenshot with secrets redacted."
        ]
  };
}

function firstMatchingLine(text: string, pattern: RegExp) {
  return text.split(/\r?\n/).find((line) => pattern.test(line))?.trim() ?? null;
}

async function readOptionalText(filePath: string) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

function miniProgramCompletionAction(checkId: string, sample: MiniProgramSampleInfo) {
  switch (checkId) {
    case "preflight":
      return `Run easyar_write_miniprogram_preflight projectPath=<project> sampleId=${sample.id} and resolve blocked checks.`;
    case "device-validation-checklist":
      return `Run easyar_write_miniprogram_device_validation_checklist projectPath=<project> sampleId=${sample.id}.`;
    case "devtools-log":
      return `Run easyar_run_miniprogram_devtools_check projectPath=<project> sampleId=${sample.id} dryRun=false, or analyze a redacted DevTools log.`;
    case "run-result":
      return `Run easyar_write_miniprogram_run_result after real-device preview evidence is available for ${sample.id}.`;
    default:
      return "Collect the missing Mini Program evidence and rerun the completion report.";
  }
}

export function redactMiniProgramSecretText(text: string) {
  return text
    .replace(/((?:license|licenseKey|apiKey|apiSecret|appKey|appSecret|secret|token|password|credential)\s*[:=]\s*)("[^"]+"|'[^']+'|[^\s,;&]+)/gi, "$1<redacted>")
    .replace(/([?&](?:token|apiKey|apiSecret|appKey|appSecret|secret|credential|password)=)[^&\s]+/gi, "$1<redacted>")
    .replace(/\b[A-Za-z0-9+/]{80,}={0,2}\b/g, "<redacted>");
}
