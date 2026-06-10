#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { access, mkdir, open, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createEasyARApiClient } from "./easyar-api.js";

type SampleInfo = {
  id: string;
  name: string;
  description: string;
  implementationStatus: "focused" | "deferred";
  unityScenes: string[];
  requiredCapabilities: string[];
  setupNotes: string[];
};

const monoBehaviourKinds = ["image-tracking", "surface-placement", "cloud-recognition", "lifecycle"] as const;
const buildPlatforms = ["android", "ios", "standalone", "none"] as const;
const deviceBuildPlatforms = ["android", "ios", "standalone"] as const;
const mobilePlatforms = ["android", "ios"] as const;
const runResultStatuses = ["passed", "failed", "blocked", "not-run"] as const;
const clientKinds = ["claude-desktop", "codex", "generic-json"] as const;
const serverName = "mcp-easyar";
const serverVersion = "0.1.0";
const easyarApi = createEasyARApiClient();

const toolCatalog = [
  "easyar_server_status",
  "easyar_list_samples",
  "easyar_official_info",
  "easyar_auth_status",
  "easyar_check_account",
  "easyar_validate_license",
  "easyar_generate_client_config",
  "easyar_generate_sample_plan",
  "easyar_generate_run_sequence",
  "easyar_write_run_sequence",
  "easyar_generate_run_report",
  "easyar_write_run_report",
  "easyar_audit_sample_scene",
  "easyar_write_scene_audit",
  "easyar_generate_support_bundle",
  "easyar_write_support_bundle",
  "easyar_generate_run_result",
  "easyar_write_run_result",
  "easyar_inspect_unity_project",
  "easyar_check_sample_readiness",
  "easyar_validate_local_config",
  "easyar_analyze_unity_log",
  "easyar_analyze_latest_unity_log",
  "easyar_prepare_unity_project",
  "easyar_create_sample_validation_helper",
  "easyar_create_mobile_settings_helper",
  "easyar_create_build_settings_helper",
  "easyar_create_device_build_helper",
  "easyar_create_sample_runner",
  "easyar_generate_code_plan",
  "easyar_write_code_plan",
  "easyar_create_mono_behaviour",
  "easyar_write_csharp_file",
  "easyar_review_csharp_scripts",
  "easyar_unity_environment",
  "easyar_run_unity_compile_check",
  "easyar_run_unity_method"
] as const;

const resourceCatalog = [
  "easyar://samples/catalog",
  "easyar://official/info",
  "easyar://unity/checklist",
  "easyar://workflow/quickstart"
] as const;

const samples: SampleInfo[] = [
  {
    id: "hello-ar",
    name: "Hello AR",
    description: "Minimal EasyAR scene for camera permission, ARSession startup, and device tracking validation.",
    implementationStatus: "deferred",
    unityScenes: ["HelloAR", "HelloAR_SparseSpatialMap"],
    requiredCapabilities: ["Camera permission", "EasyAR Sense Unity plugin"],
    setupNotes: [
      "Import the official EasyAR Sense Unity package for the target SDK version.",
      "Set the EasyAR license key in the project before building to device.",
      "Use Android or iOS build target for real device validation."
    ]
  },
  {
    id: "image-tracking",
    name: "Image Tracking",
    description: "Detect and track planar image targets, then anchor Unity content to the target pose.",
    implementationStatus: "focused",
    unityScenes: ["ImageTracking", "ImageTracker", "ImageTarget"],
    requiredCapabilities: ["Camera permission", "Image target assets", "EasyAR license key"],
    setupNotes: [
      "Add target images through the EasyAR target workflow used by the imported sample.",
      "Check target physical size and texture import settings.",
      "Test on a real device with stable lighting."
    ]
  },
  {
    id: "surface-tracking",
    name: "Surface Tracking",
    description: "Place virtual content on detected surfaces using EasyAR motion tracking features.",
    implementationStatus: "deferred",
    unityScenes: ["SurfaceTracking", "MotionTracking"],
    requiredCapabilities: ["Camera permission", "Motion tracking support", "Device sensors"],
    setupNotes: [
      "Confirm the target device supports required tracking modes.",
      "Keep AR camera prefab and session lifecycle components from the official sample.",
      "Build to device; most surface tracking workflows cannot be fully validated in the Editor."
    ]
  },
  {
    id: "cloud-recognition",
    name: "Cloud Recognition",
    description: "Recognize targets through EasyAR cloud services and use results to drive AR content.",
    implementationStatus: "focused",
    unityScenes: ["CloudRecognition", "CloudRecognizer"],
    requiredCapabilities: ["Network access", "Cloud recognition credentials", "EasyAR license key"],
    setupNotes: [
      "Configure official EasyAR cloud recognition credentials from the registered account.",
      "Verify network permissions and service region before testing.",
      "Avoid committing secrets; inject them through local config or CI secrets."
    ]
  }
];

const officialInfo = {
  capturedAt: "2026-06-10",
  docs: {
    samples: "https://www.easyar.cn/doc/en/develop/samples.html",
    downloads: "https://www.easyar.com/view/download.html",
    downloadHistory: "https://www.easyar.com/view/downloadHistory.html"
  },
  packageVersions: {
    easyarSenseUnityPlugin: "4002.0.0",
    easyarSenseUnityPluginForMega: "4002.0.0",
    easyarXrExtensionPackage: "4000.0.0",
    easyarSenseNative: "4.9.0"
  },
  notes: [
    "The official sample apps page says Unity samples are obtained from the Unity plugin download page and then imported according to the quickstart.",
    "This MCP server does not bypass account or enterprise download gates; connect it to official EasyAR account APIs before enabling private downloads."
  ]
};

const quickstartWorkflow = [
  "# mcp-easyar Quickstart",
  "",
  "1. Build the server with `npm install && npm run build`.",
  "2. Use `easyar_generate_client_config` to create a Codex or Claude Desktop MCP config snippet.",
  "3. Configure `EASYAR_API_BASE_URL`, `EASYAR_API_TOKEN`, official validation endpoints, and optionally `EASYAR_UNITY_PATH` locally.",
  "4. Use `easyar_check_account` and `easyar_validate_license` after official EasyAR endpoints are configured.",
  "5. Use `easyar_list_samples` and `easyar_generate_sample_plan` to choose a sample.",
  "6. Focus first on `image-tracking` or `cloud-recognition`; other sample workflows are cataloged but deferred.",
  "7. Import the official EasyAR Unity Plugin and matching sample scenes from EasyAR downloads.",
  "8. Run `easyar_generate_run_sequence` or `easyar_write_run_sequence` for an ordered Codex/Claude execution plan, then `easyar_generate_run_report`, `easyar_audit_sample_scene`, and `easyar_write_support_bundle` for current project status.",
  "9. Run `easyar_inspect_unity_project`, `easyar_prepare_unity_project`, and `easyar_check_sample_readiness`.",
  "10. Copy `ProjectSettings/EasyAR/easyar.local.json.example` to `easyar.local.json` and fill official local credentials.",
  "11. Run `easyar_create_mobile_settings_helper` and `easyar_run_unity_method` to apply Android/iOS player settings.",
  "12. Run `easyar_create_build_settings_helper` and `easyar_run_unity_method` to add the sample scene to Build Settings.",
  "13. Use `easyar_write_code_plan`, `easyar_create_mono_behaviour`, `easyar_write_csharp_file`, and `easyar_review_csharp_scripts` for project code.",
  "14. Run `easyar_check_sample_readiness` again, then build to a real Android or iOS device for tracking validation.",
  "15. Use `easyar_write_run_result` after compile, build, or device attempts to preserve handoff evidence and next actions.",
  "",
  "Do not commit account tokens, EasyAR license keys, cloud credentials, signing keys, or provisioning secrets."
].join("\n");

const server = new McpServer({
  name: serverName,
  version: serverVersion
});

function promptText(description: string, text: string) {
  return {
    description,
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text
        }
      }
    ]
  };
}

server.resource(
  "easyar-samples-catalog",
  "easyar://samples/catalog",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(samples, null, 2)
      }
    ]
  })
);

server.resource(
  "easyar-official-info",
  "easyar://official/info",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(officialInfo, null, 2)
      }
    ]
  })
);

server.resource(
  "easyar-unity-checklist",
  "easyar://unity/checklist",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "text/markdown",
        text: [
          "# EasyAR Unity Checklist",
          "",
          "1. Use an official EasyAR account and license key.",
          "2. Import the EasyAR Sense Unity package that matches the target Unity version.",
          "3. Keep generated SDK assets and sample scenes inside the Unity project.",
          "4. Configure Android/iOS camera permissions and build target.",
          "5. Validate tracking samples on a real device.",
          "6. Keep account tokens, license keys, and cloud credentials out of source control."
        ].join("\n")
      }
    ]
  })
);

server.resource(
  "easyar-quickstart-workflow",
  "easyar://workflow/quickstart",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "text/markdown",
        text: quickstartWorkflow
      }
    ]
  })
);

server.prompt(
  "easyar-run-image-tracking",
  "Guide Codex or Claude through the focused Image Tracking run-through.",
  {
    projectPath: z.string().describe("Unity project path."),
    platform: z.enum(["android", "ios"]).default("android")
  },
  ({ projectPath, platform }) => promptText(
    "Focused Image Tracking run-through",
    [
      `Use the mcp-easyar tools to run the Image Tracking sample for project: ${projectPath}`,
      `Target platform: ${platform}`,
      "",
      "Start by calling:",
      `1. easyar_generate_run_report projectPath=${projectPath} sampleId=image-tracking`,
      `2. easyar_generate_run_sequence projectPath=${projectPath} sampleId=image-tracking platform=${platform}`,
      "",
      "Then follow the sequence. Do not skip readiness failures. Image Tracking must have real target image/database assets before device validation.",
      "If Unity batch fails, call easyar_analyze_latest_unity_log with sampleId=image-tracking."
    ].join("\n")
  )
);

server.prompt(
  "easyar-run-cloud-recognition",
  "Guide Codex or Claude through the focused Cloud Recognition run-through.",
  {
    projectPath: z.string().describe("Unity project path."),
    platform: z.enum(["android", "ios"]).default("android")
  },
  ({ projectPath, platform }) => promptText(
    "Focused Cloud Recognition run-through",
    [
      `Use the mcp-easyar tools to run the Cloud Recognition sample for project: ${projectPath}`,
      `Target platform: ${platform}`,
      "",
      "Start by calling:",
      `1. easyar_generate_run_report projectPath=${projectPath} sampleId=cloud-recognition`,
      `2. easyar_generate_run_sequence projectPath=${projectPath} sampleId=cloud-recognition platform=${platform}`,
      "",
      "Do not continue to device validation until easyar.cloudRecognition.appId, appKey, and appSecret are configured locally.",
      "If Unity batch or device validation fails, call easyar_analyze_latest_unity_log with sampleId=cloud-recognition."
    ].join("\n")
  )
);

server.prompt(
  "easyar-unity-programming-assistant",
  "Guide Codex or Claude through Unity C# implementation and diagnostics for an EasyAR project.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.enum(["image-tracking", "cloud-recognition"]).default("image-tracking")
  },
  ({ projectPath, sampleId }) => promptText(
    "EasyAR Unity programming assistant",
    [
      `Act as the Unity programming assistant for ${sampleId} in project: ${projectPath}`,
      "",
      "Start by calling easyar_generate_run_report to understand current readiness, local config, and script review state.",
      "When creating or editing C# files, prefer easyar_create_mono_behaviour for common templates and easyar_write_csharp_file for focused patches.",
      "After code changes, call easyar_review_csharp_scripts before asking Unity to compile.",
      "If Unity reports errors, call easyar_analyze_latest_unity_log or easyar_analyze_unity_log with the focused sampleId."
    ].join("\n")
  )
);

server.tool(
  "easyar_server_status",
  "Return mcp-easyar server version, capability summary, resources, authorization state, and recommended next steps.",
  {},
  async () => {
    const auth = readAuthConfig();
    return jsonText({
      name: serverName,
      version: serverVersion,
      repository: "https://github.com/terri1982/mcp-easyar",
      officialUse: "Designed for registered EasyAR users and official authorized workflows.",
      authorization: {
        apiBaseUrl: auth.apiBaseUrl,
        hasToken: auth.hasToken,
        accountStatusEndpointConfigured: auth.accountStatusEndpointConfigured,
        licenseValidationEndpointConfigured: auth.licenseValidationEndpointConfigured,
        readyForAccountScopedContent: auth.hasToken && auth.accountStatusEndpointConfigured && auth.licenseValidationEndpointConfigured,
        accountScopedFeatures: easyarApi.accountScopedFeatures()
      },
      capabilities: {
        samples: samples.map((sample) => sample.id),
        focusedSamples: focusedSamples().map((sample) => sample.id),
        deferredSamples: deferredSamples().map((sample) => sample.id),
        tools: toolCatalog,
        resources: resourceCatalog,
        unityAutomation: [
          "inspect project",
          "prepare sample helpers",
          "configure mobile player settings",
          "configure Build Settings",
          "generate player build helper",
          "run Unity batch methods",
          "analyze Unity logs",
          "write C# scripts",
          "review C# scripts"
        ]
      },
      recommendedFirstCalls: [
        "easyar_auth_status",
        "easyar_check_account",
        "easyar_list_samples",
        "easyar_generate_sample_plan",
        "easyar_inspect_unity_project",
        "easyar_check_sample_readiness"
      ],
      security: [
        "Do not commit account tokens, EasyAR license keys, cloud credentials, signing keys, or provisioning secrets.",
        "This server does not bypass EasyAR login, license checks, download authorization, enterprise gates, or rate limits."
      ]
    });
  }
);

server.tool(
  "easyar_list_samples",
  "List known EasyAR Unity sample categories and setup requirements.",
  {},
  async () => jsonText(samples)
);

server.tool(
  "easyar_official_info",
  "Return official EasyAR links and package versions captured by this MCP server.",
  {},
  async () => jsonText(officialInfo)
);

server.tool(
  "easyar_auth_status",
  "Report whether EasyAR account environment variables are configured without exposing secret values.",
  {},
  async () => {
    const auth = readAuthConfig();
    return jsonText({
      apiBaseUrl: auth.apiBaseUrl,
      hasToken: auth.hasToken,
      tokenPreview: auth.tokenPreview,
      accountStatusEndpointConfigured: auth.accountStatusEndpointConfigured,
      licenseValidationEndpointConfigured: auth.licenseValidationEndpointConfigured,
      readyForAccountScopedContent: auth.hasToken && auth.accountStatusEndpointConfigured && auth.licenseValidationEndpointConfigured,
      requiredEnvironment: [
        "EASYAR_API_BASE_URL",
        "EASYAR_API_TOKEN",
        "EASYAR_ACCOUNT_STATUS_ENDPOINT",
        "EASYAR_LICENSE_VALIDATE_ENDPOINT"
      ],
      security: "Secret values are never returned by this tool."
    });
  }
);

server.tool(
  "easyar_check_account",
  "Call a configured official EasyAR account-status endpoint with EASYAR_API_TOKEN without exposing secrets.",
  {},
  async () => jsonText(await easyarApi.checkAccount())
);

server.tool(
  "easyar_validate_license",
  "Call a configured official EasyAR license-validation endpoint without exposing license keys or account tokens.",
  {
    projectPath: z.string().optional().describe("Optional Unity project path. If provided, reads ProjectSettings/EasyAR/easyar.local.json for a license key."),
    licenseKey: z.string().optional().describe("Optional EasyAR license key. Prefer projectPath/local config or secret injection; returned output is redacted."),
    bundleIdentifier: z.string().optional().describe("Application bundle/package identifier bound to the EasyAR license."),
    platform: z.enum(["android", "ios", "standalone", "unknown"]).default("unknown")
  },
  async ({ projectPath, licenseKey, bundleIdentifier, platform }) => {
    const localConfig = projectPath ? await readLocalConfigForRemoteValidation(projectPath) : {};
    const result = await easyarApi.validateLicense({
      licenseKey: licenseKey ?? localConfig.licenseKey,
      bundleIdentifier: bundleIdentifier ?? localConfig.bundleIdentifier,
      platform
    });

    return jsonText({
      ...result,
      input: {
        projectPath: projectPath ? resolveProjectPath(projectPath) : null,
        hasLicenseKey: Boolean(licenseKey ?? localConfig.licenseKey),
        bundleIdentifier: bundleIdentifier ?? localConfig.bundleIdentifier ?? null,
        platform
      },
      security: "EASYAR_API_TOKEN and licenseKey are never returned by this tool."
    });
  }
);

server.tool(
  "easyar_generate_client_config",
  "Generate MCP client configuration snippets for connecting Codex, Claude Desktop, or another stdio MCP client.",
  {
    client: z.enum(clientKinds).describe("Target MCP client config style."),
    serverPath: z.string().optional().describe("Absolute path to dist/index.js. Defaults to this process entrypoint."),
    includeTokenPlaceholder: z.boolean().default(true).describe("Whether to include EASYAR_API_TOKEN placeholder text.")
  },
  async ({ client, serverPath, includeTokenPlaceholder }) => {
    const entrypoint = serverPath ?? process.argv[1] ?? "dist/index.js";
    const env = {
      EASYAR_API_BASE_URL: process.env.EASYAR_API_BASE_URL ?? "https://www.easyar.cn",
      EASYAR_ACCOUNT_STATUS_ENDPOINT: process.env.EASYAR_ACCOUNT_STATUS_ENDPOINT ?? "https://www.easyar.cn/path/to/official/account/status",
      EASYAR_LICENSE_VALIDATE_ENDPOINT: process.env.EASYAR_LICENSE_VALIDATE_ENDPOINT ?? "https://www.easyar.cn/path/to/official/license/validate",
      ...(includeTokenPlaceholder ? { EASYAR_API_TOKEN: "your_registered_user_token" } : {})
    };
    const config = buildClientConfig(client, entrypoint, env);

    return jsonText({
      client,
      command: "node",
      args: [entrypoint],
      env,
      config,
      note: "Replace token placeholders with locally stored official EasyAR account credentials. Do not commit secrets."
    });
  }
);

server.tool(
  "easyar_generate_sample_plan",
  "Generate a step-by-step plan for preparing and running an EasyAR Unity sample.",
  {
    sampleId: z.string().describe("Sample id from easyar_list_samples, for example image-tracking."),
    unityVersion: z.string().optional().describe("Unity version used by the project."),
    platform: z.enum(["android", "ios", "editor", "unknown"]).default("unknown")
  },
  async ({ sampleId, unityVersion, platform }) => {
    const sample = findSample(sampleId);
    const auth = readAuthConfig();
    const statusNote = sample.implementationStatus === "focused"
      ? "This sample is in the current run-through focus set."
      : "This sample is cataloged for later work; current run-through focus is image-tracking and cloud-recognition.";
    const plan = [
      `Sample: ${sample.name}`,
      `Implementation status: ${sample.implementationStatus}`,
      `Unity version: ${unityVersion ?? "not specified"}`,
      `Target platform: ${platform}`,
      statusNote,
      "",
      "Authorized access:",
      auth.hasToken
        ? `- EASYAR_API_TOKEN is configured for ${auth.apiBaseUrl}.`
        : `- Configure EASYAR_API_TOKEN for ${auth.apiBaseUrl} before downloading account-scoped SDKs or cloud data.`,
      "",
      "Preparation:",
      ...sample.setupNotes.map((note) => `- ${note}`),
      "",
      "Unity workflow:",
      "- Run easyar_inspect_unity_project against the project path.",
      "- Import the official EasyAR Unity package if the project does not contain EasyAR assets.",
      "- Run easyar_prepare_unity_project to create an Editor helper, local config template, and secret ignore rules.",
      "- Run EasyAR.EditorTools.EasyARBuildSettingsHelper.ConfigureBuildSettings in Unity batch mode to add the sample scene to Build Settings.",
      "- Build to a real Android/iOS device when the sample requires camera, motion tracking, or cloud recognition.",
      "",
      "Required capabilities:",
      ...sample.requiredCapabilities.map((capability) => `- ${capability}`)
    ].join("\n");

    return markdownText(plan);
  }
);

server.tool(
  "easyar_generate_run_sequence",
  "Generate an ordered MCP and Unity batch sequence for the focused Image Tracking or Cloud Recognition sample run-through.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    platform: z.enum(["android", "ios"]).default("android"),
    outputPath: z.string().optional().describe("Build output path. Defaults to Builds/<sampleId>.apk for Android or Builds/iOS/<sampleId> for iOS."),
    developmentBuild: z.boolean().default(true).describe("Whether the generated build helper should use a Unity development build.")
  },
  async ({ projectPath, sampleId, platform, outputPath, developmentBuild }) => {
    const sample = findSample(sampleId);
    const root = resolveProjectPath(projectPath);
    const defaultOutput = platform === "android"
      ? `Builds/${sample.id}.apk`
      : `Builds/iOS/${sample.id}`;
    return jsonText(buildFocusedRunSequence({
      projectPath: root,
      sample,
      platform,
      outputPath: outputPath ?? defaultOutput,
      developmentBuild
    }));
  }
);

server.tool(
  "easyar_write_run_sequence",
  "Write the focused sample MCP and Unity batch run sequence as a Markdown artifact inside the Unity project.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    platform: z.enum(["android", "ios"]).default("android"),
    outputPath: z.string().optional().describe("Build output path. Defaults to Builds/<sampleId>.apk for Android or Builds/iOS/<sampleId> for iOS."),
    developmentBuild: z.boolean().default(true).describe("Whether the generated build helper should use a Unity development build."),
    relativePath: z.string().optional().describe("Optional sequence path inside the project. Defaults to Assets/EasyARGenerated/<sampleId>/RUN_SEQUENCE.md."),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing run sequence artifact.")
  },
  async ({ projectPath, sampleId, platform, outputPath, developmentBuild, relativePath, overwrite }) => {
    const sample = findSample(sampleId);
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const defaultOutput = platform === "android"
      ? `Builds/${sample.id}.apk`
      : `Builds/iOS/${sample.id}`;
    const sequence = buildFocusedRunSequence({
      projectPath: root,
      sample,
      platform,
      outputPath: outputPath ?? defaultOutput,
      developmentBuild
    });
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(focusedSampleGeneratedDir(root, sample), "RUN_SEQUENCE.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildRunSequenceMarkdown(sequence), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      sample: sample.name,
      platform,
      outputPath: sequence.outputPath,
      phaseCount: sequence.phases.length,
      note: "The run sequence artifact contains MCP call arguments and Unity batch method names, not secret values."
    });
  }
);

server.tool(
  "easyar_inspect_unity_project",
  "Inspect a Unity project and report EasyAR/sample readiness signals.",
  {
    projectPath: z.string().describe("Absolute or current-working-directory-relative Unity project path.")
  },
  async ({ projectPath }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);

    const checks = {
      projectPath: root,
      hasAssets: await exists(path.join(root, "Assets")),
      hasPackagesManifest: await exists(path.join(root, "Packages", "manifest.json")),
      hasProjectSettings: await exists(path.join(root, "ProjectSettings", "ProjectVersion.txt")),
      unityVersion: await readUnityVersion(root),
      easyarSignals: filterOfficialEasyARSignals(await findFiles(root, ["Assets", "Packages"], /easyar/i, 80)),
      sampleScenes: await findFiles(root, ["Assets"], /\.(unity)$/i, 120)
    };

    return jsonText(checks);
  }
);

server.tool(
  "easyar_check_sample_readiness",
  "Check whether a Unity project has the local pieces needed to run a specific EasyAR sample workflow.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Sample id from easyar_list_samples.")
  },
  async ({ projectPath, sampleId }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    return jsonText(await buildSampleReadinessReport(root, sample));
  }
);

server.tool(
  "easyar_generate_run_report",
  "Generate a focused sample run report combining readiness, local config validation, script review, and recommended next steps.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    maxScriptIssues: z.number().int().positive().max(100).default(25)
  },
  async ({ projectPath, sampleId, maxScriptIssues }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    return jsonText(await buildFocusedRunReport(root, sample, maxScriptIssues));
  }
);

server.tool(
  "easyar_write_run_report",
  "Write a focused sample run report Markdown artifact into the Unity project.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    relativePath: z.string().optional().describe("Optional report path inside the project. Defaults to Assets/EasyARGenerated/<sampleId>/RUN_REPORT.md."),
    maxScriptIssues: z.number().int().positive().max(100).default(25),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing report.")
  },
  async ({ projectPath, sampleId, relativePath, maxScriptIssues, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const report = await buildFocusedRunReport(root, sample, maxScriptIssues);
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(focusedSampleGeneratedDir(root, sample), "RUN_REPORT.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildRunReportMarkdown(report), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      sample: sample.name,
      overallReady: report.overallReady,
      nextRecommendedPhase: report.nextRecommendedPhase,
      note: "The report does not include secret values."
    });
  }
);

server.tool(
  "easyar_audit_sample_scene",
  "Audit focused sample scene candidates, EasyAR import signals, Build Settings hints, and sample-specific run blockers.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    maxCandidates: z.number().int().positive().max(100).default(25)
  },
  async ({ projectPath, sampleId, maxCandidates }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    return jsonText(await buildSampleSceneAudit(root, sample, maxCandidates));
  }
);

server.tool(
  "easyar_write_scene_audit",
  "Write the focused sample scene audit as a Markdown artifact inside the Unity project.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    relativePath: z.string().optional().describe("Optional audit path inside the project. Defaults to Assets/EasyARGenerated/<sampleId>/SCENE_AUDIT.md."),
    maxCandidates: z.number().int().positive().max(100).default(25),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing scene audit artifact.")
  },
  async ({ projectPath, sampleId, relativePath, maxCandidates, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const audit = await buildSampleSceneAudit(root, sample, maxCandidates);
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(focusedSampleGeneratedDir(root, sample), "SCENE_AUDIT.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildSceneAuditMarkdown(audit), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      sample: sample.name,
      readyForUnityValidation: audit.readyForUnityValidation,
      blockerCount: audit.blockers.length,
      nextActions: audit.nextActions,
      note: "The scene audit does not include secret values."
    });
  }
);

server.tool(
  "easyar_generate_support_bundle",
  "Generate a focused sample support bundle summary across run sequence, run report, scene audit, and latest Unity log diagnostics.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    platform: z.enum(["android", "ios"]).default("android"),
    outputPath: z.string().optional().describe("Build output path. Defaults to Builds/<sampleId>.apk for Android or Builds/iOS/<sampleId> for iOS."),
    developmentBuild: z.boolean().default(true),
    maxScriptIssues: z.number().int().positive().max(100).default(25),
    maxCandidates: z.number().int().positive().max(100).default(25),
    maxLogBytes: z.number().int().positive().max(1024 * 1024).default(200000),
    maxLogIssues: z.number().int().positive().max(50).default(20)
  },
  async ({ projectPath, sampleId, platform, outputPath, developmentBuild, maxScriptIssues, maxCandidates, maxLogBytes, maxLogIssues }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    return jsonText(await buildSupportBundle({
      root,
      sample,
      platform,
      outputPath,
      developmentBuild,
      maxScriptIssues,
      maxCandidates,
      maxLogBytes,
      maxLogIssues
    }));
  }
);

server.tool(
  "easyar_write_support_bundle",
  "Write a focused sample support bundle Markdown artifact inside the Unity project.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    platform: z.enum(["android", "ios"]).default("android"),
    outputPath: z.string().optional().describe("Build output path. Defaults to Builds/<sampleId>.apk for Android or Builds/iOS/<sampleId> for iOS."),
    developmentBuild: z.boolean().default(true),
    relativePath: z.string().optional().describe("Optional bundle path inside the project. Defaults to Assets/EasyARGenerated/<sampleId>/SUPPORT_BUNDLE.md."),
    maxScriptIssues: z.number().int().positive().max(100).default(25),
    maxCandidates: z.number().int().positive().max(100).default(25),
    maxLogBytes: z.number().int().positive().max(1024 * 1024).default(200000),
    maxLogIssues: z.number().int().positive().max(50).default(20),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing support bundle artifact.")
  },
  async ({ projectPath, sampleId, platform, outputPath, developmentBuild, relativePath, maxScriptIssues, maxCandidates, maxLogBytes, maxLogIssues, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const bundle = await buildSupportBundle({
      root,
      sample,
      platform,
      outputPath,
      developmentBuild,
      maxScriptIssues,
      maxCandidates,
      maxLogBytes,
      maxLogIssues
    });
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(focusedSampleGeneratedDir(root, sample), "SUPPORT_BUNDLE.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildSupportBundleMarkdown(bundle), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      sample: sample.name,
      overallReady: bundle.runReport.overallReady,
      readyForUnityValidation: bundle.sceneAudit.readyForUnityValidation,
      logIssueCount: bundle.latestLog.issueCount,
      nextActions: bundle.nextActions,
      note: "The support bundle does not include secret values or full Unity log text."
    });
  }
);

const runResultStepSchema = z.object({
  name: z.string().describe("Step name, for example Unity compile, Build Settings, device build, or real device validation."),
  status: z.enum(runResultStatuses).describe("Observed step status."),
  evidence: z.string().optional().describe("Short evidence, for example log path, build path, device model, or observed behavior."),
  nextAction: z.string().optional().describe("Recommended next action for this step.")
});

server.tool(
  "easyar_generate_run_result",
  "Generate a focused sample run result summary for handoff after Unity compile, build, or device validation attempts.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    platform: z.enum(["android", "ios"]).default("android"),
    overallStatus: z.enum(runResultStatuses).describe("Overall result status for the latest focused sample attempt."),
    device: z.string().optional().describe("Optional tested device model or simulator/emulator description."),
    buildOutputPath: z.string().optional().describe("Optional APK, Xcode project, or build artifact path."),
    notes: z.string().optional().describe("Short human or AI notes about the run attempt. Do not include secrets."),
    steps: z.array(runResultStepSchema).default([]),
    maxScriptIssues: z.number().int().positive().max(100).default(25),
    maxCandidates: z.number().int().positive().max(100).default(25),
    maxLogBytes: z.number().int().positive().max(1024 * 1024).default(200000),
    maxLogIssues: z.number().int().positive().max(50).default(20)
  },
  async ({ projectPath, sampleId, platform, overallStatus, device, buildOutputPath, notes, steps, maxScriptIssues, maxCandidates, maxLogBytes, maxLogIssues }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    return jsonText(await buildRunResult({
      root,
      sample,
      platform,
      overallStatus,
      device,
      buildOutputPath,
      notes,
      steps,
      maxScriptIssues,
      maxCandidates,
      maxLogBytes,
      maxLogIssues
    }));
  }
);

server.tool(
  "easyar_write_run_result",
  "Write a focused sample run result Markdown artifact inside the Unity project.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    platform: z.enum(["android", "ios"]).default("android"),
    overallStatus: z.enum(runResultStatuses).describe("Overall result status for the latest focused sample attempt."),
    device: z.string().optional().describe("Optional tested device model or simulator/emulator description."),
    buildOutputPath: z.string().optional().describe("Optional APK, Xcode project, or build artifact path."),
    notes: z.string().optional().describe("Short human or AI notes about the run attempt. Do not include secrets."),
    steps: z.array(runResultStepSchema).default([]),
    relativePath: z.string().optional().describe("Optional result path inside the project. Defaults to Assets/EasyARGenerated/<sampleId>/RUN_RESULT.md."),
    maxScriptIssues: z.number().int().positive().max(100).default(25),
    maxCandidates: z.number().int().positive().max(100).default(25),
    maxLogBytes: z.number().int().positive().max(1024 * 1024).default(200000),
    maxLogIssues: z.number().int().positive().max(50).default(20),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing run result artifact.")
  },
  async ({ projectPath, sampleId, platform, overallStatus, device, buildOutputPath, notes, steps, relativePath, maxScriptIssues, maxCandidates, maxLogBytes, maxLogIssues, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const result = await buildRunResult({
      root,
      sample,
      platform,
      overallStatus,
      device,
      buildOutputPath,
      notes,
      steps,
      maxScriptIssues,
      maxCandidates,
      maxLogBytes,
      maxLogIssues
    });
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(focusedSampleGeneratedDir(root, sample), "RUN_RESULT.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildRunResultMarkdown(result), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      sample: sample.name,
      overallStatus: result.overallStatus,
      stepCount: result.steps.length,
      nextActions: result.nextActions,
      note: "The run result does not include secret values."
    });
  }
);

server.tool(
  "easyar_validate_local_config",
  "Validate ProjectSettings/EasyAR/easyar.local.json without returning secret values.",
  {
    projectPath: z.string().describe("Unity project path."),
    configPath: z.string().optional().describe("Optional config path. Defaults to ProjectSettings/EasyAR/easyar.local.json inside the project.")
  },
  async ({ projectPath, configPath }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const target = configPath
      ? path.resolve(root, configPath)
      : path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json");
    assertInside(root, target);

    if (!await exists(target)) {
      return jsonText({
        configPath: target,
        valid: false,
        checks: [
          {
            id: "file-exists",
            ok: false,
            detail: "Local config file does not exist."
          }
        ],
        nextActions: [
          "Run easyar_prepare_unity_project.",
          "Copy ProjectSettings/EasyAR/easyar.local.json.example to ProjectSettings/EasyAR/easyar.local.json.",
          "Fill the local file with official EasyAR account/license values."
        ]
      });
    }

    return jsonText(await buildLocalConfigValidationReport(root, target));
  }
);

server.tool(
  "easyar_analyze_unity_log",
  "Analyze Unity Editor or build logs for common and focused-sample EasyAR issues.",
  {
    logText: z.string().optional().describe("Unity log text to analyze."),
    logPath: z.string().optional().describe("Path to a Unity Editor.log or build log file."),
    sampleId: z.string().optional().describe("Optional focused sample id for sample-specific diagnostics, for example image-tracking or cloud-recognition."),
    maxIssues: z.number().int().positive().max(50).default(20)
  },
  async ({ logText, logPath, sampleId, maxIssues }) => {
    if (!logText && !logPath) {
      throw new Error("Provide either logText or logPath.");
    }

    const sample = sampleId ? findSample(sampleId) : null;
    const text = logText ?? await readLogFile(logPath as string);
    const issues = analyzeUnityLog(text, sample).slice(0, maxIssues);
    const summary = summarizeLog(text);

    return jsonText({
      summary,
      sample: sample ? {
        id: sample.id,
        name: sample.name,
        implementationStatus: sample.implementationStatus
      } : null,
      issueCount: issues.length,
      issues,
      nextActions: issues.length > 0
        ? Array.from(new Set(issues.flatMap((issue) => issue.actions)))
        : ["No known EasyAR/Unity issue patterns were detected. Check the full Unity Console and device logs if the problem persists."]
    });
  }
);

server.tool(
  "easyar_analyze_latest_unity_log",
  "Find the most recent Unity Editor/project log and analyze its tail with optional focused sample diagnostics.",
  {
    projectPath: z.string().optional().describe("Optional Unity project path used to search project Logs and Library locations."),
    sampleId: z.string().optional().describe("Optional focused sample id for sample-specific diagnostics."),
    maxBytes: z.number().int().positive().max(1024 * 1024).default(200000).describe("Maximum bytes to read from the end of the latest log."),
    maxIssues: z.number().int().positive().max(50).default(20)
  },
  async ({ projectPath, sampleId, maxBytes, maxIssues }) => {
    const root = projectPath ? resolveProjectPath(projectPath) : null;
    if (root) {
      await ensureDirectory(root);
    }
    const sample = sampleId ? findSample(sampleId) : null;
    const candidates = await findUnityLogCandidates(root);
    const latest = candidates.find((candidate) => candidate.exists);
    if (!latest) {
      return jsonText({
        projectPath: root,
        sample: sample ? {
          id: sample.id,
          name: sample.name,
          implementationStatus: sample.implementationStatus
        } : null,
        analyzed: false,
        candidates,
        nextActions: [
          "Run Unity once, then retry this tool.",
          "If you already have a log file, call easyar_analyze_unity_log with logPath."
        ]
      });
    }

    const text = await readLogTail(latest.path, maxBytes);
    const issues = analyzeUnityLog(text, sample).slice(0, maxIssues);
    return jsonText({
      projectPath: root,
      sample: sample ? {
        id: sample.id,
        name: sample.name,
        implementationStatus: sample.implementationStatus
      } : null,
      analyzed: true,
      logPath: latest.path,
      logSizeBytes: latest.size,
      logModifiedAt: latest.modifiedAt,
      bytesRead: Buffer.byteLength(text, "utf8"),
      summary: summarizeLog(text),
      issueCount: issues.length,
      issues,
      nextActions: issues.length > 0
        ? Array.from(new Set(issues.flatMap((issue) => issue.actions)))
        : ["No known EasyAR/Unity issue patterns were detected in the latest log tail."]
    });
  }
);

server.tool(
  "easyar_prepare_unity_project",
  "Prepare a Unity project for an authorized EasyAR sample workflow by creating editor helpers, local config templates, and secret ignore rules.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Sample id from easyar_list_samples."),
    overwrite: z.boolean().default(false).describe("Whether to replace existing generated files.")
  },
  async ({ projectPath, sampleId, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);

    const editorDir = path.join(root, "Assets", "Editor");
    const configDir = path.join(root, "ProjectSettings", "EasyAR");
    const generatedSampleDir = focusedSampleGeneratedDir(root, sample);
    await mkdir(editorDir, { recursive: true });
    await mkdir(configDir, { recursive: true });
    await mkdir(generatedSampleDir, { recursive: true });

    const runnerPath = path.join(editorDir, "EasyARSampleRunner.cs");
    const buildSettingsPath = path.join(editorDir, "EasyARBuildSettingsHelper.cs");
    const mobileSettingsPath = path.join(editorDir, "EasyARMobileSettingsHelper.cs");
    const validationPath = path.join(editorDir, "EasyARSampleValidationHelper.cs");
    const runbookPath = focusedSampleRunbookPath(root, sample);
    const configExamplePath = path.join(configDir, "easyar.local.json.example");
    const localConfigPath = path.join(configDir, "easyar.local.json");
    const gitignorePath = path.join(root, ".gitignore");

    const written: string[] = [];
    await writeGeneratedFile(runnerPath, buildSampleRunner(sample), overwrite, written);
    await writeGeneratedFile(buildSettingsPath, buildBuildSettingsHelper(sample, "none"), overwrite, written);
    await writeGeneratedFile(mobileSettingsPath, buildMobileSettingsHelper("android", defaultBundleIdentifier(sample), null, null), overwrite, written);
    await writeGeneratedFile(validationPath, buildSampleValidationHelper(sample), overwrite, written);
    await writeGeneratedFile(runbookPath, buildFocusedSampleRunbook(sample), overwrite, written);
    await writeFocusedSampleSupportFiles(root, sample, overwrite, written);
    await writeGeneratedFile(configExamplePath, buildLocalConfigExample(sample), overwrite, written);
    await ensureGitignoreEntries(gitignorePath, [
      "ProjectSettings/EasyAR/easyar.local.json",
      "ProjectSettings/EasyAR/*.secret.json"
    ]);

    return jsonText({
      projectPath: root,
      sample: sample.name,
      written,
      localConfig: localConfigPath,
      instructions: [
        `Copy ${path.relative(root, configExamplePath)} to ${path.relative(root, localConfigPath)}.`,
        "Fill the local file with the EasyAR license key and official account-scoped credentials.",
        "Do not commit the local config file; .gitignore has been updated to protect it.",
        "Import the official EasyAR Unity Plugin package from the EasyAR download page before opening the generated runner.",
        `Review ${path.relative(root, runbookPath)} for the focused ${sample.name} run-through checklist.`,
        "Call EasyAR.EditorTools.EasyARSampleValidationHelper.ValidateFocusedSample in Unity batch mode after importing the official sample scene.",
        "Call EasyAR.EditorTools.EasyARMobileSettingsHelper.ConfigureMobileSettings in Unity batch mode before device builds.",
        "Call EasyAR.EditorTools.EasyARBuildSettingsHelper.ConfigureBuildSettings in Unity batch mode to add the matching sample scene to Build Settings."
      ]
    });
  }
);

server.tool(
  "easyar_create_sample_validation_helper",
  "Create a Unity Editor script that validates focused EasyAR sample import, scene, Build Settings, and sample-specific local requirements.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    overwrite: z.boolean().default(false).describe("Whether to replace an existing helper script.")
  },
  async ({ projectPath, sampleId, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const editorDir = path.join(root, "Assets", "Editor");
    const filePath = path.join(editorDir, "EasyARSampleValidationHelper.cs");

    const written: string[] = [];
    await writeGeneratedFile(filePath, buildSampleValidationHelper(sample), overwrite, written);

    return jsonText({
      created: written.includes(filePath) ? filePath : null,
      skipped: written.includes(filePath) ? null : filePath,
      sample: sample.name,
      executeMethod: "EasyAR.EditorTools.EasyARSampleValidationHelper.ValidateFocusedSample",
      nextStep: "Run easyar_run_unity_method with the returned executeMethod after importing official EasyAR assets and sample scenes."
    });
  }
);

server.tool(
  "easyar_create_mobile_settings_helper",
  "Create a Unity Editor script that applies Android/iOS player settings commonly required by EasyAR camera samples.",
  {
    projectPath: z.string().describe("Unity project path."),
    platform: z.enum(mobilePlatforms).describe("Target mobile platform."),
    sampleId: z.string().optional().describe("Optional sample id used to generate a stable default bundle identifier."),
    bundleIdentifier: z.string().optional().describe("Application bundle/package identifier. Defaults to a sample-specific com.easyar.generated.* id."),
    cameraUsageDescription: z.string().optional().describe("iOS camera usage description. Defaults to an EasyAR AR camera message."),
    minSdkVersion: z.number().int().min(23).max(35).optional().describe("Android minimum SDK API level. Defaults to 23."),
    overwrite: z.boolean().default(false).describe("Whether to replace an existing helper script.")
  },
  async ({ projectPath, platform, sampleId, bundleIdentifier, cameraUsageDescription, minSdkVersion, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = sampleId ? findSample(sampleId) : null;
    const editorDir = path.join(root, "Assets", "Editor");
    const filePath = path.join(editorDir, "EasyARMobileSettingsHelper.cs");
    const appId = bundleIdentifier ?? defaultBundleIdentifier(sample);

    const written: string[] = [];
    await writeGeneratedFile(
      filePath,
      buildMobileSettingsHelper(platform, appId, cameraUsageDescription ?? null, minSdkVersion ?? null),
      overwrite,
      written
    );

    return jsonText({
      created: written.includes(filePath) ? filePath : null,
      skipped: written.includes(filePath) ? null : filePath,
      platform,
      bundleIdentifier: appId,
      executeMethod: "EasyAR.EditorTools.EasyARMobileSettingsHelper.ConfigureMobileSettings",
      nextStep: "Run easyar_run_unity_method with the returned executeMethod before configuring Build Settings or building to device."
    });
  }
);

server.tool(
  "easyar_create_build_settings_helper",
  "Create a Unity Editor script that adds the matching EasyAR sample scene to Build Settings and optionally switches the active build target.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Sample id from easyar_list_samples."),
    platform: z.enum(buildPlatforms).default("none").describe("Optional Unity build target to switch to."),
    overwrite: z.boolean().default(false).describe("Whether to replace an existing helper script.")
  },
  async ({ projectPath, sampleId, platform, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const editorDir = path.join(root, "Assets", "Editor");
    const filePath = path.join(editorDir, "EasyARBuildSettingsHelper.cs");

    const written: string[] = [];
    await writeGeneratedFile(filePath, buildBuildSettingsHelper(sample, platform), overwrite, written);

    return jsonText({
      created: written.includes(filePath) ? filePath : null,
      skipped: written.includes(filePath) ? null : filePath,
      sample: sample.name,
      platform,
      executeMethod: "EasyAR.EditorTools.EasyARBuildSettingsHelper.ConfigureBuildSettings",
      nextStep: "Run easyar_run_unity_method with the returned executeMethod to update Unity Build Settings."
    });
  }
);

server.tool(
  "easyar_create_device_build_helper",
  "Create a Unity Editor script that builds the configured EasyAR sample scenes for Android, iOS, or standalone targets.",
  {
    projectPath: z.string().describe("Unity project path."),
    platform: z.enum(deviceBuildPlatforms).describe("Target platform for the generated build helper."),
    outputPath: z.string().describe("Build output path, for example Builds/EasyARSample.apk or Builds/iOS."),
    developmentBuild: z.boolean().default(false).describe("Whether to create a Unity development build."),
    overwrite: z.boolean().default(false).describe("Whether to replace an existing helper script.")
  },
  async ({ projectPath, platform, outputPath, developmentBuild, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const editorDir = path.join(root, "Assets", "Editor");
    const filePath = path.join(editorDir, "EasyARDeviceBuildHelper.cs");

    const written: string[] = [];
    await writeGeneratedFile(
      filePath,
      buildDeviceBuildHelper(platform, outputPath, developmentBuild),
      overwrite,
      written
    );

    return jsonText({
      created: written.includes(filePath) ? filePath : null,
      skipped: written.includes(filePath) ? null : filePath,
      platform,
      outputPath,
      developmentBuild,
      executeMethod: "EasyAR.EditorTools.EasyARDeviceBuildHelper.Build",
      nextStep: "Run easyar_run_unity_method with the returned executeMethod to start the Unity batch build."
    });
  }
);

server.tool(
  "easyar_create_sample_runner",
  "Create a Unity Editor script that opens EasyAR sample scenes by name.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Sample id from easyar_list_samples.")
  },
  async ({ projectPath, sampleId }) => {
    const root = resolveProjectPath(projectPath);
    const sample = findSample(sampleId);
    const editorDir = path.join(root, "Assets", "Editor");
    await mkdir(editorDir, { recursive: true });

    const filePath = path.join(editorDir, "EasyARSampleRunner.cs");
    await writeFile(filePath, buildSampleRunner(sample), "utf8");

    return jsonText({
      created: filePath,
      sample: sample.name,
      nextStep: "In Unity, use Tools/EasyAR/Open Sample Scene, or call EasyAR.EditorTools.EasyARSampleRunner.OpenSampleScene in batch mode."
    });
  }
);

server.tool(
  "easyar_generate_code_plan",
  "Generate a focused Unity C# implementation plan before editing Image Tracking or Cloud Recognition sample code.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    goal: z.string().describe("Requested code change goal, for example add target found UI or handle cloud recognition timeout."),
    targetFiles: z.array(z.string()).default([]).describe("Optional relative .cs files expected to be created or changed."),
    maxScriptIssues: z.number().int().positive().max(100).default(25)
  },
  async ({ projectPath, sampleId, goal, targetFiles, maxScriptIssues }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    return jsonText(await buildCodePlan(root, sample, goal, targetFiles, maxScriptIssues));
  }
);

server.tool(
  "easyar_write_code_plan",
  "Write a focused Unity C# implementation plan Markdown artifact inside the Unity project.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    goal: z.string().describe("Requested code change goal, for example add target found UI or handle cloud recognition timeout."),
    targetFiles: z.array(z.string()).default([]).describe("Optional relative .cs files expected to be created or changed."),
    relativePath: z.string().optional().describe("Optional plan path inside the project. Defaults to Assets/EasyARGenerated/<sampleId>/CODE_PLAN.md."),
    maxScriptIssues: z.number().int().positive().max(100).default(25),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing code plan artifact.")
  },
  async ({ projectPath, sampleId, goal, targetFiles, relativePath, maxScriptIssues, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const plan = await buildCodePlan(root, sample, goal, targetFiles, maxScriptIssues);
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(focusedSampleGeneratedDir(root, sample), "CODE_PLAN.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildCodePlanMarkdown(plan), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      sample: sample.name,
      goal,
      targetFileCount: plan.targetFiles.length,
      nextActions: plan.nextActions,
      note: "Review the code plan before calling easyar_write_csharp_file or easyar_create_mono_behaviour."
    });
  }
);

server.tool(
  "easyar_create_mono_behaviour",
  "Create a Unity C# MonoBehaviour template for common EasyAR sample development tasks.",
  {
    projectPath: z.string().describe("Unity project path."),
    relativePath: z.string().describe("Relative .cs path inside the Unity project, for example Assets/Scripts/ImageTargetContentController.cs."),
    className: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/).describe("C# class name."),
    kind: z.enum(monoBehaviourKinds).describe("Template kind to generate."),
    overwrite: z.boolean().default(false).describe("Whether to replace an existing script.")
  },
  async ({ projectPath, relativePath, className, kind, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const target = path.resolve(root, relativePath);
    assertInside(root, target);
    if (!target.endsWith(".cs")) {
      throw new Error("easyar_create_mono_behaviour only writes .cs files.");
    }
    if (!overwrite && await exists(target)) {
      return jsonText({
        skipped: target,
        reason: "File already exists. Pass overwrite=true to replace it."
      });
    }

    const contents = buildMonoBehaviourTemplate(className, kind);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents, "utf8");

    return jsonText({
      written: target,
      className,
      kind,
      nextStep: "Attach this component to the relevant Unity GameObject, then wire public fields in the Inspector."
    });
  }
);

server.tool(
  "easyar_write_csharp_file",
  "Create or replace a C# script inside a Unity project. The file must stay inside the project and end with .cs.",
  {
    projectPath: z.string().describe("Unity project path."),
    relativePath: z.string().describe("Relative file path inside the Unity project, for example Assets/Scripts/Foo.cs."),
    contents: z.string().describe("Complete C# file contents.")
  },
  async ({ projectPath, relativePath, contents }) => {
    const root = resolveProjectPath(projectPath);
    const target = path.resolve(root, relativePath);
    assertInside(root, target);
    if (!target.endsWith(".cs")) {
      throw new Error("easyar_write_csharp_file only writes .cs files.");
    }

    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents, "utf8");
    return jsonText({ written: target, bytes: Buffer.byteLength(contents, "utf8") });
  }
);

server.tool(
  "easyar_review_csharp_scripts",
  "Review Unity C# scripts for common EasyAR workflow risks before opening or building the project.",
  {
    projectPath: z.string().describe("Unity project path."),
    relativePaths: z.array(z.string()).optional().describe("Optional .cs paths to review. Defaults to Assets/**/*.cs."),
    maxFiles: z.number().int().positive().max(200).default(80),
    maxIssues: z.number().int().positive().max(200).default(80)
  },
  async ({ projectPath, relativePaths, maxFiles, maxIssues }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    return jsonText(await buildScriptReviewReport(root, relativePaths, maxFiles, maxIssues));
  }
);

server.tool(
  "easyar_unity_environment",
  "Inspect local Unity executable configuration and common install locations without launching Unity.",
  {},
  async () => {
    const configuredPath = process.env.EASYAR_UNITY_PATH ?? null;
    const configuredExists = configuredPath ? await exists(configuredPath) : false;
    const candidates = await findUnityCandidates();

    return jsonText({
      configuredPath,
      configuredExists,
      pathCommand: "Unity",
      candidates,
      recommendedUnityPath: configuredExists
        ? configuredPath
        : candidates.find((candidate) => candidate.exists)?.path ?? null,
      nextActions: configuredExists || candidates.some((candidate) => candidate.exists)
        ? ["Use the recommendedUnityPath as EASYAR_UNITY_PATH or pass it as unityPath to easyar_run_unity_method."]
        : ["Install Unity through Unity Hub, then set EASYAR_UNITY_PATH to the Unity executable path."]
    });
  }
);

server.tool(
  "easyar_run_unity_compile_check",
  "Open a Unity project in batch mode to force script import/compilation, then optionally analyze the produced log.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().optional().describe("Optional focused sample id used for log diagnostics."),
    unityPath: z.string().optional().describe("Unity executable path. Defaults to EASYAR_UNITY_PATH or Unity on PATH."),
    logPath: z.string().optional().describe("Optional Unity -logFile path. Defaults to Logs/mcp-easyar-CompileCheck.log inside the project."),
    timeoutSeconds: z.number().int().positive().max(1800).default(600),
    dryRun: z.boolean().default(false).describe("Return the command without launching Unity.")
  },
  async ({ projectPath, sampleId, unityPath, logPath, timeoutSeconds, dryRun }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const unity = unityPath ?? process.env.EASYAR_UNITY_PATH ?? "Unity";
    const sample = sampleId ? findSample(sampleId) : null;
    const resolvedLogPath = resolveUnityLogPath(root, logPath ?? path.join("Logs", "mcp-easyar-CompileCheck.log"));
    const args = buildUnityArgs(root, null, resolvedLogPath);

    if (dryRun) {
      return jsonText({
        dryRun: true,
        command: [unity, ...args].join(" "),
        logPath: resolvedLogPath,
        nextStep: "Run without dryRun to force Unity script import/compilation."
      });
    }

    const result = await runUnity(unity, root, null, timeoutSeconds, resolvedLogPath);
    const logText = await exists(resolvedLogPath) ? await readLogTail(resolvedLogPath, 200000) : `${result.stdout}\n${result.stderr}`;
    const issues = analyzeUnityLog(logText, sample);
    return jsonText({
      ...result,
      sample: sample ? {
        id: sample.id,
        name: sample.name,
        implementationStatus: sample.implementationStatus
      } : null,
      summary: summarizeLog(logText),
      issueCount: issues.length,
      issues,
      nextActions: issues.length > 0
        ? Array.from(new Set(issues.flatMap((issue) => issue.actions)))
        : ["No known EasyAR/Unity issue patterns were detected. If Unity exited 0, continue with the focused run sequence."]
    });
  }
);

server.tool(
  "easyar_run_unity_method",
  "Run a Unity static editor method in batch mode for project automation.",
  {
    projectPath: z.string().describe("Unity project path."),
    executeMethod: z.string().describe("Fully qualified static method, for example EasyAR.EditorTools.EasyARSampleRunner.OpenSampleScene."),
    unityPath: z.string().optional().describe("Unity executable path. Defaults to EASYAR_UNITY_PATH or Unity on PATH."),
    logPath: z.string().optional().describe("Optional Unity -logFile path. Relative paths are resolved inside the Unity project."),
    timeoutSeconds: z.number().int().positive().max(1800).default(300)
  },
  async ({ projectPath, executeMethod, unityPath, logPath, timeoutSeconds }) => {
    const root = resolveProjectPath(projectPath);
    const unity = unityPath ?? process.env.EASYAR_UNITY_PATH ?? "Unity";
    const resolvedLogPath = logPath ? resolveUnityLogPath(root, logPath) : null;
    const result = await runUnity(unity, root, executeMethod, timeoutSeconds, resolvedLogPath);
    return jsonText(result);
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function findSample(sampleId: string): SampleInfo {
  const sample = samples.find((candidate) => candidate.id === sampleId);
  if (!sample) {
    throw new Error(`Unknown sampleId "${sampleId}". Use easyar_list_samples first.`);
  }
  return sample;
}

function focusedSamples(): SampleInfo[] {
  return samples.filter((sample) => sample.implementationStatus === "focused");
}

function deferredSamples(): SampleInfo[] {
  return samples.filter((sample) => sample.implementationStatus === "deferred");
}

function readAuthConfig() {
  return easyarApi.authStatus();
}

function buildClientConfig(client: typeof clientKinds[number], entrypoint: string, env: Record<string, string>) {
  if (client === "codex") {
    return {
      mcpServers: {
        easyar: {
          command: "node",
          args: [entrypoint],
          env
        }
      }
    };
  }

  if (client === "claude-desktop") {
    return {
      mcpServers: {
        easyar: {
          command: "node",
          args: [entrypoint],
          env
        }
      }
    };
  }

  return {
    name: "easyar",
    transport: "stdio",
    command: "node",
    args: [entrypoint],
    env
  };
}

function buildFocusedRunSequence(input: {
  projectPath: string;
  sample: SampleInfo;
  platform: typeof mobilePlatforms[number];
  outputPath: string;
  developmentBuild: boolean;
}) {
  const { projectPath, sample, platform, outputPath, developmentBuild } = input;
  const focused = sample.implementationStatus === "focused";
  const sampleSpecific = sample.id === "cloud-recognition"
    ? [
        {
          step: "Fill cloud recognition credentials",
          tool: "easyar_validate_local_config",
          arguments: { projectPath },
          expected: "Local config exists and cloudRecognition fields are either intentionally empty or all filled.",
          requiredBeforeDeviceRun: true
        },
        {
          step: "Confirm Cloud Recognition readiness",
          tool: "easyar_check_sample_readiness",
          arguments: { projectPath, sampleId: sample.id },
          expected: "cloud-recognition-credentials passes before a real device run.",
          requiredBeforeDeviceRun: true
        }
      ]
    : [
        {
          step: "Add Image Tracking target assets",
          tool: "easyar_check_sample_readiness",
          arguments: { projectPath, sampleId: sample.id },
          expected: "image-target-assets passes after target images or target database assets are under Assets.",
          requiredBeforeDeviceRun: true
        }
      ];

  return {
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    supportedNow: focused,
    projectPath,
    platform,
    outputPath,
    developmentBuild,
    phases: [
      {
        name: "Inspect",
        steps: [
          {
            step: "Inspect Unity project",
            tool: "easyar_inspect_unity_project",
            arguments: { projectPath },
            expected: "Project has Assets, Packages/manifest.json, ProjectSettings/ProjectVersion.txt, and EasyAR import signals."
          },
          {
            step: "Check focused sample readiness",
            tool: "easyar_check_sample_readiness",
            arguments: { projectPath, sampleId: sample.id },
            expected: "Only proceed when missing items are understood. Deferred samples should stop here."
          }
        ]
      },
      {
        name: "Prepare",
        steps: [
          {
            step: "Generate EasyAR helpers, local config example, runbook, and support directories",
            tool: "easyar_prepare_unity_project",
            arguments: { projectPath, sampleId: sample.id, overwrite: false },
            expected: `Assets/EasyARGenerated/${sample.id}/RUNBOOK.md and Editor helper scripts are present.`
          },
          {
            step: "Validate local config without exposing secrets",
            tool: "easyar_validate_local_config",
            arguments: { projectPath },
            expected: "License key, account token, target platform, and optional cloud fields are valid."
          },
          {
            step: "Generate Unity-side focused sample validation helper",
            tool: "easyar_create_sample_validation_helper",
            arguments: { projectPath, sampleId: sample.id, overwrite: true },
            expected: "EasyARSampleValidationHelper.cs is generated."
          },
          ...sampleSpecific
        ]
      },
      {
        name: "Configure Unity",
        steps: [
          {
            step: "Run Unity compile/import check",
            tool: "easyar_run_unity_compile_check",
            arguments: {
              projectPath,
              sampleId: sample.id,
              logPath: path.join("Logs", "mcp-easyar-CompileCheck.log")
            },
            expected: "Unity opens the project in batch mode, imports scripts, and exits without compile errors."
          },
          {
            step: "Generate mobile player settings helper",
            tool: "easyar_create_mobile_settings_helper",
            arguments: { projectPath, sampleId: sample.id, platform, overwrite: true },
            expected: "EasyARMobileSettingsHelper.cs is generated for the target platform."
          },
          {
            step: "Apply mobile player settings in Unity batch mode",
            tool: "easyar_run_unity_method",
            arguments: {
              projectPath,
              executeMethod: "EasyAR.EditorTools.EasyARMobileSettingsHelper.ConfigureMobileSettings",
              logPath: defaultUnityBatchLogPath("EasyAR.EditorTools.EasyARMobileSettingsHelper.ConfigureMobileSettings")
            },
            expected: "Unity exits successfully after applying package/bundle identifier and camera/network-related settings."
          },
          {
            step: "Generate Build Settings helper",
            tool: "easyar_create_build_settings_helper",
            arguments: { projectPath, sampleId: sample.id, platform, overwrite: true },
            expected: "EasyARBuildSettingsHelper.cs points at the focused official sample scene."
          },
          {
            step: "Apply Build Settings in Unity batch mode",
            tool: "easyar_run_unity_method",
            arguments: {
              projectPath,
              executeMethod: "EasyAR.EditorTools.EasyARBuildSettingsHelper.ConfigureBuildSettings",
              logPath: defaultUnityBatchLogPath("EasyAR.EditorTools.EasyARBuildSettingsHelper.ConfigureBuildSettings")
            },
            expected: "Matching official sample scene is enabled in Build Settings."
          },
          {
            step: "Validate focused sample inside Unity",
            tool: "easyar_run_unity_method",
            arguments: {
              projectPath,
              executeMethod: "EasyAR.EditorTools.EasyARSampleValidationHelper.ValidateFocusedSample",
              logPath: defaultUnityBatchLogPath("EasyAR.EditorTools.EasyARSampleValidationHelper.ValidateFocusedSample")
            },
            expected: "Unity confirms EasyAR import signals, matching sample scene, Build Settings, and focused sample requirements."
          }
        ]
      },
      {
        name: "Build And Diagnose",
        steps: [
          {
            step: "Generate device build helper",
            tool: "easyar_create_device_build_helper",
            arguments: { projectPath, platform, outputPath, developmentBuild, overwrite: true },
            expected: "EasyARDeviceBuildHelper.cs is generated."
          },
          {
            step: "Run Unity player build",
            tool: "easyar_run_unity_method",
            arguments: {
              projectPath,
              executeMethod: "EasyAR.EditorTools.EasyARDeviceBuildHelper.Build",
              logPath: defaultUnityBatchLogPath("EasyAR.EditorTools.EasyARDeviceBuildHelper.Build"),
              timeoutSeconds: 1800
            },
            expected: "Android APK or iOS Xcode project is produced."
          },
          {
            step: "Analyze Unity logs if any step fails",
            tool: "easyar_analyze_latest_unity_log",
            arguments: { projectPath, sampleId: sample.id },
            expected: "Focused diagnostics identify Image Tracking target issues or Cloud Recognition credential/network issues."
          }
        ]
      }
    ],
    stopConditions: focused
      ? [
          "Stop before device build if easyar_check_sample_readiness reports missing EasyAR assets, sample scene, local config, image target assets, or cloud credentials.",
          "Stop if Unity compilation fails; run easyar_analyze_unity_log and fix the first compiler error."
        ]
      : [
          "This sample is deferred. Current run-through scope is image-tracking and cloud-recognition."
        ],
    security: "Do not paste or commit EasyAR account tokens, license keys, cloud credentials, signing keys, or provisioning secrets."
  };
}

function resolveProjectPath(projectPath: string): string {
  return path.resolve(process.cwd(), projectPath);
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirectory(dirPath: string) {
  const info = await stat(dirPath);
  if (!info.isDirectory()) {
    throw new Error(`${dirPath} is not a directory.`);
  }
}

async function readUnityVersion(root: string): Promise<string | null> {
  const versionFile = path.join(root, "ProjectSettings", "ProjectVersion.txt");
  try {
    const text = await readFile(versionFile, "utf8");
    const match = text.match(/m_EditorVersion:\s*(.+)/);
    return match?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
}

async function findFiles(root: string, relativeDirs: string[], pattern: RegExp, limit: number): Promise<string[]> {
  const found: string[] = [];
  for (const relativeDir of relativeDirs) {
    const start = path.join(root, relativeDir);
    if (await exists(start)) {
      await walk(root, start, pattern, found, limit);
    }
  }
  return found.map((filePath) => path.relative(root, filePath));
}

async function findUnityCandidates() {
  const candidates = [
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
    await collectUnityExecutables(candidate, executablePaths, 3);
  }

  executablePaths.add("Unity");
  return Promise.all(
    Array.from(executablePaths).map(async (candidatePath) => ({
      path: candidatePath,
      exists: candidatePath === "Unity" ? false : await exists(candidatePath)
    }))
  );
}

async function collectUnityExecutables(dirPath: string, found: Set<string>, depth: number): Promise<void> {
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

async function buildSampleReadinessReport(root: string, sample: SampleInfo) {
  const easyarSignals = filterOfficialEasyARSignals(await findFiles(root, ["Assets", "Packages"], /easyar/i, 120));
  const sampleScenes = await findFiles(root, ["Assets"], /\.(unity)$/i, 200);
  const matchingScenes = matchSampleScenes(sample, sampleScenes);
  const sampleSpecificChecks = await buildSampleSpecificReadinessChecks(root, sample);

  const checks = [
    {
      id: "sample-focus",
      ok: sample.implementationStatus === "focused",
      detail: sample.implementationStatus === "focused"
        ? `${sample.name} is in the current focused run-through set.`
        : `${sample.name} is deferred. Current focused samples are Image Tracking and Cloud Recognition.`
    },
    {
      id: "unity-project",
      ok: await exists(path.join(root, "Assets")) && await exists(path.join(root, "ProjectSettings", "ProjectVersion.txt")),
      detail: "Unity project contains Assets and ProjectSettings/ProjectVersion.txt."
    },
    {
      id: "packages-manifest",
      ok: await exists(path.join(root, "Packages", "manifest.json")),
      detail: "Unity Packages/manifest.json exists."
    },
    {
      id: "easyar-assets",
      ok: easyarSignals.length > 0,
      detail: easyarSignals.length > 0
        ? `Found ${easyarSignals.length} EasyAR-related asset/package path(s).`
        : "No EasyAR-related asset/package path was found. Import the official EasyAR Unity Plugin package."
    },
    {
      id: "sample-scene",
      ok: matchingScenes.length > 0,
      detail: matchingScenes.length > 0
        ? `Found matching sample scene(s): ${matchingScenes.join(", ")}.`
        : `No scene matched hints: ${sample.unityScenes.join(", ")}. Import the official ${sample.name} sample scene.`
    },
    {
      id: "local-config-template",
      ok: await exists(path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json.example")),
      detail: "ProjectSettings/EasyAR/easyar.local.json.example exists."
    },
    {
      id: "local-config",
      ok: await exists(path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json")),
      detail: "ProjectSettings/EasyAR/easyar.local.json exists for local license and account credentials."
    },
    {
      id: "sample-runner",
      ok: await exists(path.join(root, "Assets", "Editor", "EasyARSampleRunner.cs")),
      detail: "Assets/Editor/EasyARSampleRunner.cs exists."
    },
    {
      id: "build-settings-helper",
      ok: await exists(path.join(root, "Assets", "Editor", "EasyARBuildSettingsHelper.cs")),
      detail: "Assets/Editor/EasyARBuildSettingsHelper.cs exists."
    },
    {
      id: "mobile-settings-helper",
      ok: await exists(path.join(root, "Assets", "Editor", "EasyARMobileSettingsHelper.cs")),
      detail: "Assets/Editor/EasyARMobileSettingsHelper.cs exists for Android/iOS camera permission and player settings."
    },
    {
      id: "sample-validation-helper",
      ok: await exists(path.join(root, "Assets", "Editor", "EasyARSampleValidationHelper.cs")),
      detail: "Assets/Editor/EasyARSampleValidationHelper.cs exists for Unity-side focused sample validation."
    },
    {
      id: "focused-sample-runbook",
      ok: await exists(focusedSampleRunbookPath(root, sample)),
      detail: `${path.relative(root, focusedSampleRunbookPath(root, sample))} exists with sample-specific run-through steps.`
    },
    ...sampleSpecificChecks
  ];

  const nextActions = checks
    .filter((check) => !check.ok)
    .map((check) => readinessAction(check.id, sample));

  return {
    projectPath: root,
    sample: sample.name,
    unityVersion: await readUnityVersion(root),
    ready: checks.every((check) => check.ok),
    checks,
    matchingScenes,
    nextActions
  };
}

async function buildFocusedRunReport(root: string, sample: SampleInfo, maxScriptIssues: number) {
  const readiness = await buildSampleReadinessReport(root, sample);
  const configValidation = await buildLocalConfigValidationReport(root);
  const scriptReview = await buildScriptReviewReport(root, undefined, 80, maxScriptIssues);
  const runSequence = buildFocusedRunSequence({
    projectPath: root,
    sample,
    platform: "android",
    outputPath: `Builds/${sample.id}.apk`,
    developmentBuild: true
  });

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    overallReady: readiness.ready && configValidation.valid && scriptReview.issueCount === 0,
    readiness,
    configValidation,
    scriptReview,
    nextRecommendedPhase: chooseNextRunPhase(readiness, configValidation, scriptReview),
    runSequenceSummary: runSequence.phases.map((phase) => ({
      name: phase.name,
      stepCount: phase.steps.length
    })),
    security: "Secrets are not returned. This report only reports presence, placeholder status, and static code issues."
  };
}

async function buildSampleSceneAudit(root: string, sample: SampleInfo, maxCandidates: number) {
  const allEasyARSignals = await findFiles(root, ["Assets", "Packages"], /easyar/i, maxCandidates * 3);
  const easyarSignals = filterOfficialEasyARSignals(allEasyARSignals).slice(0, maxCandidates);
  const ignoredGeneratedSignals = allEasyARSignals
    .filter((candidatePath) => !filterOfficialEasyARSignals([candidatePath]).includes(candidatePath))
    .slice(0, maxCandidates);
  const sampleScenes = await findFiles(root, ["Assets"], /\.(unity)$/i, maxCandidates * 3);
  const matchingScenes = matchSampleScenes(sample, sampleScenes).slice(0, maxCandidates);
  const buildSettingsHints = await readBuildSettingsSceneHints(root, sample);
  const sampleSpecific = await buildSampleSceneAuditSpecifics(root, sample, maxCandidates);
  const readiness = await buildSampleReadinessReport(root, sample);
  const blockers = uniqueBlockers([
    ...readiness.checks.filter((check) => !check.ok).map((check) => ({
      id: check.id,
      detail: check.detail,
      action: readinessAction(check.id, sample)
    })),
    ...sampleSpecific.blockers
  ]);

  return {
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus,
      sceneHints: sample.unityScenes
    },
    unityVersion: await readUnityVersion(root),
    readyForUnityValidation: blockers.length === 0 && buildSettingsHints.matchingEnabledScenes.length > 0 && buildSettingsHints.firstEnabledSceneMatches,
    easyarSignals,
    ignoredGeneratedSignals,
    sceneCandidates: sampleScenes.slice(0, maxCandidates),
    matchingScenes,
    buildSettingsHints,
    sampleSpecific,
    blockers,
    nextActions: blockers.length > 0
      ? Array.from(new Set(blockers.map((blocker) => blocker.action)))
      : buildSettingsHints.matchingEnabledScenes.length === 0
        ? ["Run easyar_create_build_settings_helper and easyar_run_unity_method with EasyAR.EditorTools.EasyARBuildSettingsHelper.ConfigureBuildSettings."]
        : buildSettingsHints.firstEnabledSceneMatches
          ? ["Run easyar_run_unity_method with EasyAR.EditorTools.EasyARSampleValidationHelper.ValidateFocusedSample."]
          : ["Run EasyARBuildSettingsHelper.ConfigureBuildSettings again so the focused sample scene is first in Build Settings."],
    security: "Secret values are not returned. Cloud Recognition audit only reports credential presence and placeholder status."
  };
}

async function buildSupportBundle(input: {
  root: string;
  sample: SampleInfo;
  platform: typeof mobilePlatforms[number];
  outputPath?: string;
  developmentBuild: boolean;
  maxScriptIssues: number;
  maxCandidates: number;
  maxLogBytes: number;
  maxLogIssues: number;
}) {
  const defaultOutput = input.platform === "android"
    ? `Builds/${input.sample.id}.apk`
    : `Builds/iOS/${input.sample.id}`;
  const runSequence = buildFocusedRunSequence({
    projectPath: input.root,
    sample: input.sample,
    platform: input.platform,
    outputPath: input.outputPath ?? defaultOutput,
    developmentBuild: input.developmentBuild
  });
  const runReport = await buildFocusedRunReport(input.root, input.sample, input.maxScriptIssues);
  const sceneAudit = await buildSampleSceneAudit(input.root, input.sample, input.maxCandidates);
  const latestLog = await buildLatestLogDiagnostic(input.root, input.sample, input.maxLogBytes, input.maxLogIssues);
  const generatedArtifacts = {
    runbook: path.relative(input.root, focusedSampleRunbookPath(input.root, input.sample)),
    runSequence: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "RUN_SEQUENCE.md")),
    runReport: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "RUN_REPORT.md")),
    sceneAudit: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "SCENE_AUDIT.md")),
    supportBundle: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "SUPPORT_BUNDLE.md")),
    runResult: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "RUN_RESULT.md")),
    codePlan: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "CODE_PLAN.md"))
  };
  const nextActions = Array.from(new Set([
    runReport.nextRecommendedPhase,
    ...sceneAudit.nextActions,
    ...latestLog.nextActions
  ]));

  return {
    generatedAt: new Date().toISOString(),
    projectPath: input.root,
    sample: runReport.sample,
    platform: input.platform,
    outputPath: runSequence.outputPath,
    developmentBuild: input.developmentBuild,
    generatedArtifacts,
    runSequenceSummary: runSequence.phases.map((phase) => ({
      name: phase.name,
      stepCount: phase.steps.length
    })),
    runReport,
    sceneAudit,
    latestLog,
    nextActions,
    security: "Secret values and full Unity log text are not included. This bundle reports presence, status, excerpts, and recommended actions only."
  };
}

async function buildRunResult(input: {
  root: string;
  sample: SampleInfo;
  platform: typeof mobilePlatforms[number];
  overallStatus: typeof runResultStatuses[number];
  device?: string;
  buildOutputPath?: string;
  notes?: string;
  steps: Array<{
    name: string;
    status: typeof runResultStatuses[number];
    evidence?: string;
    nextAction?: string;
  }>;
  maxScriptIssues: number;
  maxCandidates: number;
  maxLogBytes: number;
  maxLogIssues: number;
}) {
  const supportBundle = await buildSupportBundle({
    root: input.root,
    sample: input.sample,
    platform: input.platform,
    outputPath: input.buildOutputPath,
    developmentBuild: input.overallStatus !== "passed",
    maxScriptIssues: input.maxScriptIssues,
    maxCandidates: input.maxCandidates,
    maxLogBytes: input.maxLogBytes,
    maxLogIssues: input.maxLogIssues
  });
  const failedSteps = input.steps.filter((step) => step.status === "failed" || step.status === "blocked");
  const missingSteps = input.steps.filter((step) => step.status === "not-run");
  const recommendedNextActions = Array.from(new Set([
    ...failedSteps.map((step) => step.nextAction).filter(isNonEmptyString),
    ...missingSteps.map((step) => step.nextAction).filter(isNonEmptyString),
    ...supportBundle.nextActions
  ]));

  return {
    generatedAt: new Date().toISOString(),
    projectPath: input.root,
    sample: supportBundle.sample,
    platform: input.platform,
    overallStatus: input.overallStatus,
    device: input.device ?? null,
    buildOutputPath: input.buildOutputPath ?? null,
    notes: sanitizeRunResultNotes(input.notes),
    steps: input.steps,
    failedStepCount: failedSteps.length,
    notRunStepCount: missingSteps.length,
    supportBundleSummary: {
      overallReady: supportBundle.runReport.overallReady,
      readyForUnityValidation: supportBundle.sceneAudit.readyForUnityValidation,
      logIssueCount: supportBundle.latestLog.issueCount,
      supportBundlePath: supportBundle.generatedArtifacts.supportBundle
    },
    nextActions: recommendedNextActions,
    security: "Secret values are not returned. Do not include license keys, account tokens, appKey, appSecret, signing keys, or provisioning secrets in run result notes or evidence."
  };
}

async function buildCodePlan(root: string, sample: SampleInfo, goal: string, targetFiles: string[], maxScriptIssues: number) {
  const normalizedTargets = targetFiles.map((relativePath) => normalizeProjectRelativePath(root, relativePath));
  const defaultKind = sample.id === "cloud-recognition" ? "cloud-recognition" : "image-tracking";
  const suggestedClassName = sample.id === "cloud-recognition"
    ? "CloudRecognitionResultController"
    : "ImageTargetContentController";
  const suggestedPrimaryFile = normalizedTargets[0] ?? `Assets/Scripts/${suggestedClassName}.cs`;
  const scriptReview = await buildScriptReviewReport(root, normalizedTargets.length > 0 ? normalizedTargets : undefined, 80, maxScriptIssues);
  const readiness = await buildSampleReadinessReport(root, sample);
  const implementationSteps = buildCodePlanImplementationSteps(sample, suggestedPrimaryFile, suggestedClassName, defaultKind);
  const riskChecks = [
    "Do not hardcode EasyAR license keys, account tokens, appKey, appSecret, signing keys, or provisioning secrets.",
    "Keep generated code scoped to target files and avoid unrelated scene/prefab rewrites.",
    "Use serialized fields for scene references so users can wire objects in the Unity Inspector.",
    "Run easyar_review_csharp_scripts before Unity compilation.",
    "Run easyar_run_unity_compile_check after writing scripts."
  ];

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    goal,
    targetFiles: normalizedTargets.length > 0 ? normalizedTargets : [suggestedPrimaryFile],
    suggestedTemplate: {
      tool: "easyar_create_mono_behaviour",
      arguments: {
        projectPath: root,
        relativePath: suggestedPrimaryFile,
        className: suggestedClassName,
        kind: defaultKind
      }
    },
    readinessSummary: {
      ready: readiness.ready,
      failingChecks: readiness.checks.filter((check) => !check.ok).map((check) => check.id)
    },
    scriptReviewSummary: {
      reviewedFileCount: scriptReview.reviewedFileCount,
      issueCount: scriptReview.issueCount,
      issues: scriptReview.issues
    },
    implementationSteps,
    riskChecks,
    verificationSteps: [
      "Call easyar_review_csharp_scripts for changed scripts.",
      "Call easyar_run_unity_compile_check with the focused sampleId.",
      "Regenerate easyar_write_support_bundle after Unity compilation or build attempts.",
      "Record outcome with easyar_write_run_result."
    ],
    nextActions: [
      "Review CODE_PLAN.md before editing scripts.",
      normalizedTargets.length > 0
        ? "Patch only the listed target files with easyar_write_csharp_file."
        : "Create the suggested MonoBehaviour template with easyar_create_mono_behaviour, then patch only the generated script.",
      "Run static script review before opening Unity batch compilation."
    ],
    security: "This code plan does not include secret values. Keep official EasyAR credentials in local config or environment-backed storage."
  };
}

function normalizeProjectRelativePath(root: string, relativePath: string): string {
  const target = path.resolve(root, relativePath);
  assertInside(root, target);
  const normalized = path.relative(root, target);
  if (!normalized.endsWith(".cs")) {
    throw new Error("Code plan targetFiles must point to .cs files.");
  }
  return normalized;
}

function buildCodePlanImplementationSteps(
  sample: SampleInfo,
  primaryFile: string,
  className: string,
  kind: typeof monoBehaviourKinds[number]
): string[] {
  const common = [
    `Use ${primaryFile} as the primary implementation file.`,
    `Prefer easyar_create_mono_behaviour with className=${className} and kind=${kind} when starting from a new script.`,
    "Expose GameObject, Text, Renderer, or event references with [SerializeField] fields instead of searching every frame.",
    "Keep Update lightweight; use EasyAR callbacks, UnityEvents, or explicit methods for state changes."
  ];
  if (sample.id === "image-tracking") {
    return [
      ...common,
      "Represent target found/lost transitions with explicit methods such as OnTargetFound and OnTargetLost.",
      "Keep target physical-size, target database, and target asset setup in the official EasyAR workflow rather than hardcoding it in gameplay scripts."
    ];
  }
  if (sample.id === "cloud-recognition") {
    return [
      ...common,
      "Represent cloud success, timeout, unauthorized, and network failure states separately.",
      "Read cloud credentials from local config or the official sample wiring; never embed appKey or appSecret in scripts."
    ];
  }
  return common;
}

async function buildLatestLogDiagnostic(root: string, sample: SampleInfo, maxLogBytes: number, maxLogIssues: number) {
  const candidates = await findUnityLogCandidates(root);
  const latest = candidates.find((candidate) => candidate.exists);
  if (!latest) {
    return {
      analyzed: false,
      logPath: null,
      logSizeBytes: null,
      logModifiedAt: null,
      summary: null,
      issueCount: 0,
      issues: [],
      candidates: candidates.slice(0, 8),
      nextActions: [
        "Run Unity once, then regenerate the support bundle.",
        "If you already have a log file, call easyar_analyze_unity_log with logPath."
      ]
    };
  }

  const text = await readLogTail(latest.path, maxLogBytes);
  const issues = analyzeUnityLog(text, sample).slice(0, maxLogIssues);
  return {
    analyzed: true,
    logPath: latest.path,
    logSizeBytes: latest.size,
    logModifiedAt: latest.modifiedAt,
    bytesRead: Buffer.byteLength(text, "utf8"),
    summary: summarizeLog(text),
    issueCount: issues.length,
    issues,
    candidates: candidates.slice(0, 8),
    nextActions: issues.length > 0
      ? Array.from(new Set(issues.flatMap((issue) => issue.actions)))
      : ["No known EasyAR/Unity issue patterns were detected in the latest log tail."]
  };
}

function uniqueBlockers<T extends { id: string }>(blockers: T[]): T[] {
  const seen = new Set<string>();
  return blockers.filter((blocker) => {
    if (seen.has(blocker.id)) {
      return false;
    }
    seen.add(blocker.id);
    return true;
  });
}

function filterOfficialEasyARSignals(paths: string[]): string[] {
  return paths.filter((candidatePath) =>
    !/^Assets[\/\\]EasyARGenerated[\/\\]/i.test(candidatePath) &&
    !/^Assets[\/\\]Editor[\/\\]EasyAR.*\.cs$/i.test(candidatePath)
  );
}

function matchSampleScenes(sample: SampleInfo, scenePaths: string[]): string[] {
  return scenePaths.filter((scenePath) =>
    sample.unityScenes.some((hint) => scenePath.toLowerCase().includes(hint.toLowerCase()))
  );
}

function readinessAction(checkId: string, sample: SampleInfo): string {
  if (checkId === "sample-focus") {
    return "Use sampleId \"image-tracking\" or \"cloud-recognition\" for the current run-through work.";
  }
  if (checkId === "unity-project") {
    return "Open or create a Unity project before running EasyAR sample tools.";
  }
  if (checkId === "packages-manifest") {
    return "Open the project once in Unity so Packages/manifest.json is created.";
  }
  if (checkId === "easyar-assets") {
    return "Import the official EasyAR Unity Plugin package from the EasyAR download page.";
  }
  if (checkId === "sample-scene") {
    return `Import the official ${sample.name} sample scene, then rerun easyar_check_sample_readiness.`;
  }
  if (checkId === "local-config-template" || checkId === "sample-runner" || checkId === "build-settings-helper" || checkId === "mobile-settings-helper" || checkId === "sample-validation-helper") {
    return `Run easyar_prepare_unity_project with sampleId "${sample.id}".`;
  }
  if (checkId === "focused-sample-runbook") {
    return `Run easyar_prepare_unity_project with sampleId "${sample.id}" to generate the focused sample runbook.`;
  }
  if (checkId === "local-config") {
    return "Copy ProjectSettings/EasyAR/easyar.local.json.example to easyar.local.json and fill it with official local credentials.";
  }
  if (checkId === "image-target-assets") {
    return "Import or create Image Tracking target assets/images before running the Image Tracking sample.";
  }
  if (checkId === "cloud-recognition-credentials") {
    return "Fill easyar.cloudRecognition.appId, appKey, and appSecret in ProjectSettings/EasyAR/easyar.local.json.";
  }
  return "Review the EasyAR Unity checklist and rerun readiness checks.";
}

function focusedSampleGeneratedDir(root: string, sample: SampleInfo): string {
  return path.join(root, "Assets", "EasyARGenerated", sample.id);
}

function focusedSampleRunbookPath(root: string, sample: SampleInfo): string {
  return path.join(focusedSampleGeneratedDir(root, sample), "RUNBOOK.md");
}

async function buildSampleSpecificReadinessChecks(root: string, sample: SampleInfo) {
  if (sample.id === "image-tracking") {
    const targetAssets = await findFiles(root, ["Assets"], /(imagetarget|image-target|target.*\.(jpg|jpeg|png|json)|targets?\.(json|xml)|\.etd$)/i, 80);
    return [
      {
        id: "image-target-assets",
        ok: targetAssets.length > 0,
        detail: targetAssets.length > 0
          ? `Found possible image target asset(s): ${targetAssets.slice(0, 8).join(", ")}.`
          : "No image target asset hints were found under Assets. Import the official Image Tracking sample assets or add target images."
      }
    ];
  }

  if (sample.id === "cloud-recognition") {
    const cloudConfig = await readCloudRecognitionConfig(root);
    return [
      {
        id: "cloud-recognition-credentials",
        ok: hasCompleteCloudRecognitionConfig(cloudConfig),
        detail: hasCompleteCloudRecognitionConfig(cloudConfig)
          ? "Cloud recognition appId, appKey, and appSecret are configured in local config."
          : "Cloud recognition credentials are incomplete or missing in ProjectSettings/EasyAR/easyar.local.json."
      }
    ];
  }

  return [];
}

async function readBuildSettingsSceneHints(root: string, sample: SampleInfo) {
  const target = path.join(root, "ProjectSettings", "EditorBuildSettings.asset");
  if (!await exists(target)) {
    return {
      fileExists: false,
      scenes: [],
      enabledScenes: [],
      matchingEnabledScenes: [],
      firstEnabledScene: null,
      firstEnabledSceneMatches: false
    };
  }

  const text = await readFile(target, "utf8");
  const scenes: Array<{ path: string; enabled: boolean }> = [];
  let currentEnabled = true;
  for (const line of text.split(/\r?\n/)) {
    const enabledMatch = /^\s*enabled:\s*(\d+)/.exec(line);
    if (enabledMatch) {
      currentEnabled = enabledMatch[1] !== "0";
      continue;
    }

    const pathMatch = /^\s*path:\s*(.+?)\s*$/.exec(line);
    if (pathMatch) {
      scenes.push({
        path: pathMatch[1].replace(/^"|"$/g, ""),
        enabled: currentEnabled
      });
      currentEnabled = true;
    }
  }

  const enabledScenes = scenes.filter((scene) => scene.enabled).map((scene) => scene.path);
  const matchingEnabledScenes = enabledScenes.filter((scenePath) => matchSampleScenes(sample, [scenePath]).length > 0);
  const firstEnabledScene = enabledScenes[0] ?? null;
  return {
    fileExists: true,
    scenes,
    enabledScenes,
    matchingEnabledScenes,
    firstEnabledScene,
    firstEnabledSceneMatches: firstEnabledScene ? matchingEnabledScenes.includes(firstEnabledScene) : false
  };
}

async function buildSampleSceneAuditSpecifics(root: string, sample: SampleInfo, maxCandidates: number) {
  if (sample.id === "image-tracking") {
    const targetAssets = await findFiles(root, ["Assets"], /(imagetarget|image-target|target.*\.(jpg|jpeg|png|json)|targets?\.(json|xml)|\.etd$)/i, maxCandidates);
    return {
      kind: "image-tracking",
      targetAssets,
      cloudConfig: null,
      blockers: targetAssets.length > 0
        ? []
        : [
            {
              id: "image-target-assets",
              detail: "No Image Tracking target asset candidates were found.",
              action: readinessAction("image-target-assets", sample)
            }
          ]
    };
  }

  if (sample.id === "cloud-recognition") {
    const configReport = await buildLocalConfigValidationReport(root);
    const cloudCheck = configReport.checks.find((check) => check.id === "cloud-recognition");
    const config = await readCloudRecognitionConfig(root);
    const presence = {
      appId: isNonPlaceholderString(config.appId),
      appKey: isNonPlaceholderString(config.appKey),
      appSecret: isNonPlaceholderString(config.appSecret)
    };
    return {
      kind: "cloud-recognition",
      targetAssets: [],
      cloudConfig: {
        valid: Boolean(cloudCheck?.ok),
        presence,
        detail: cloudCheck?.detail ?? "Cloud Recognition config was not found."
      },
      blockers: cloudCheck?.ok
        ? []
        : [
            {
              id: "cloud-recognition-credentials",
              detail: cloudCheck?.detail ?? "Cloud recognition credentials are incomplete or missing.",
              action: readinessAction("cloud-recognition-credentials", sample)
            }
          ]
    };
  }

  return {
    kind: "deferred",
    targetAssets: [],
    cloudConfig: null,
    blockers: [
      {
        id: "sample-deferred",
        detail: `${sample.name} is outside the current focused sample run-through scope.`,
        action: readinessAction("sample-focus", sample)
      }
    ]
  };
}

async function readCloudRecognitionConfig(root: string): Promise<Record<string, unknown>> {
  const target = path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json");
  if (!await exists(target)) {
    return {};
  }
  const parsed = await readJsonFile(target);
  const value = isRecord(parsed) ? parsed : {};
  const easyar = isRecord(value.easyar) ? value.easyar : {};
  return isRecord(easyar.cloudRecognition) ? easyar.cloudRecognition : {};
}

async function readLogFile(logPath: string): Promise<string> {
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

type UnityLogCandidate = {
  path: string;
  source: string;
  exists: boolean;
  size: number | null;
  modifiedAt: string | null;
  mtimeMs: number;
};

async function findUnityLogCandidates(root: string | null): Promise<UnityLogCandidate[]> {
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

async function readLogTail(logPath: string, maxBytes: number): Promise<string> {
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

async function readJsonFile(filePath: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Failed to parse JSON from ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function buildLocalConfigValidationReport(root: string, configPath?: string) {
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

async function readLocalConfigForRemoteValidation(projectPath: string): Promise<{
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

function validateLocalConfig(config: unknown) {
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
      ok: isNonPlaceholderString(easyar.accountToken),
      detail: "easyar.accountToken is present and not a placeholder."
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
      detail: "cloudRecognition credentials are either all configured or all intentionally empty."
    }
  ];
}

function localConfigAction(checkId: string): string {
  if (checkId === "json-object") {
    return "Replace the config file with valid JSON based on easyar.local.json.example.";
  }
  if (checkId === "api-base-url") {
    return "Set easyar.apiBaseUrl to https://www.easyar.cn or the official EasyAR API base URL.";
  }
  if (checkId === "account-token") {
    return "Set easyar.accountToken from the registered EasyAR account; do not commit this file.";
  }
  if (checkId === "license-key") {
    return "Set easyar.licenseKey from the official EasyAR account/license configuration.";
  }
  if (checkId === "target-platform") {
    return "Set unity.targetPlatform to android, ios, or standalone.";
  }
  if (checkId === "bundle-identifier") {
    return "Set unity.bundleIdentifier to the Android package name or iOS bundle identifier bound to the EasyAR license.";
  }
  if (checkId === "cloud-recognition") {
    return "Either leave all cloudRecognition fields empty or fill appId, appKey, and appSecret together.";
  }
  return "Review ProjectSettings/EasyAR/easyar.local.json.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonPlaceholderString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0 && !/paste-|placeholder|your_/i.test(value);
}

function isOptionalNonPlaceholderString(value: unknown): boolean {
  return value === undefined || value === null || value === "" || isNonPlaceholderString(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function sanitizeRunResultNotes(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  return value.replace(/(licenseKey|accountToken|appKey|appSecret|password|secret)\s*[:=]\s*\S+/gi, "$1=<redacted>");
}

function hasCloudRecognitionConfig(value: Record<string, unknown>): boolean {
  const fields = [value.appId, value.appKey, value.appSecret];
  const configuredCount = fields.filter(isNonPlaceholderString).length;
  const emptyCount = fields.filter((field) => typeof field === "string" && field.trim() === "").length;
  return configuredCount === fields.length || emptyCount === fields.length;
}

function hasCompleteCloudRecognitionConfig(value: Record<string, unknown>): boolean {
  return [value.appId, value.appKey, value.appSecret].every(isNonPlaceholderString);
}

function summarizeLog(logText: string) {
  const lines = logText.split(/\r?\n/);
  return {
    totalLines: lines.length,
    errorLines: lines.filter((line) => /\b(error|exception|failed|failure)\b/i.test(line)).length,
    warningLines: lines.filter((line) => /\b(warning|warn)\b/i.test(line)).length,
    mentionsEasyAR: /easyar/i.test(logText),
    mentionsAndroid: /android|gradle|apk/i.test(logText),
    mentionsIOS: /\bios\b|xcode|provisioning|codesign/i.test(logText)
  };
}

type UnityLogRule = {
  id: string;
  severity: "high" | "medium" | "low";
  pattern: RegExp;
  title: string;
  actions: string[];
};

function analyzeUnityLog(logText: string, sample: SampleInfo | null = null) {
  const rules: UnityLogRule[] = [
    {
      id: "easyar-license",
      severity: "high",
      pattern: /easyar[\s\S]{0,120}(license|key|credential|authorize|authorization|unauthorized|invalid)/i,
      title: "EasyAR license or credential problem",
      actions: [
        "Run easyar_auth_status and confirm account environment variables are configured.",
        "Check ProjectSettings/EasyAR/easyar.local.json for the official EasyAR license key and cloud credentials.",
        "Verify the app bundle/package identifier matches the license configuration in the EasyAR account."
      ]
    },
    {
      id: "camera-permission",
      severity: "high",
      pattern: /(camera|webcam)[\s\S]{0,120}(permission|denied|not authorized|unauthorized)|permission[\s\S]{0,120}(camera|webcam)/i,
      title: "Camera permission problem",
      actions: [
        "Enable camera permission in Android Player Settings or iOS Info.plist.",
        "Build to a real device and grant camera permission when prompted.",
        "Confirm the target sample requires camera access before testing in Editor."
      ]
    },
    {
      id: "missing-easyar-plugin",
      severity: "high",
      pattern: /(namespace|type).{0,80}EasyAR.{0,80}(does not exist|could not be found)|EasyAR.{0,80}(assembly|plugin).{0,80}(missing|not found)/i,
      title: "EasyAR Unity plugin is missing or not imported correctly",
      actions: [
        "Import the official EasyAR Unity Plugin package from the EasyAR download page.",
        "Run easyar_check_sample_readiness after import to verify EasyAR assets are visible.",
        "Reopen Unity so assemblies and imported packages are recompiled."
      ]
    },
    {
      id: "compile-error",
      severity: "high",
      pattern: /\b(CS\d{4}|Compilation failed|compiler error|Script compilation failed)\b/i,
      title: "Unity C# compilation error",
      actions: [
        "Fix the first C# compiler error before investigating runtime EasyAR behavior.",
        "Use easyar_write_csharp_file or easyar_create_mono_behaviour to patch scripts in the Unity project.",
        "Re-run Unity compilation after each focused fix."
      ]
    },
    {
      id: "android-gradle",
      severity: "medium",
      pattern: /(gradle|android).{0,160}(failed|exception|sdk|manifest|minSdk|targetSdk|duplicate class)/i,
      title: "Android/Gradle build problem",
      actions: [
        "Check Android SDK, Gradle, minSdkVersion, targetSdkVersion, and manifest permissions.",
        "Confirm Unity Android Build Support is installed for the selected Unity version.",
        "Run the generated Build Settings helper with platform=android before building."
      ]
    },
    {
      id: "ios-signing",
      severity: "medium",
      pattern: /(xcode|ios|codesign|provisioning|development team|bundle identifier).{0,160}(failed|error|missing|invalid)/i,
      title: "iOS signing or Xcode build problem",
      actions: [
        "Check bundle identifier, signing team, provisioning profile, and camera usage description.",
        "Run the generated Build Settings helper with platform=ios before exporting.",
        "Open the generated Xcode project and inspect signing errors."
      ]
    },
    {
      id: "scene-missing",
      severity: "medium",
      pattern: /(scene|build settings).{0,160}(missing|not found|not.*enabled|could not be loaded)/i,
      title: "Sample scene is missing from Build Settings or cannot be loaded",
      actions: [
        "Run easyar_create_build_settings_helper for the selected sample.",
        "Run easyar_run_unity_method with EasyAR.EditorTools.EasyARBuildSettingsHelper.ConfigureBuildSettings.",
        "Run easyar_check_sample_readiness and confirm matchingScenes is not empty."
      ]
    }
  ];
  rules.push(...sampleSpecificLogRules(sample));

  const lines = logText.split(/\r?\n/);
  return rules
    .filter((rule) => rule.pattern.test(logText))
    .map((rule) => ({
      id: rule.id,
      severity: rule.severity,
      title: rule.title,
      evidence: findEvidence(lines, rule.pattern),
      actions: rule.actions
    }));
}

function sampleSpecificLogRules(sample: SampleInfo | null): UnityLogRule[] {
  if (!sample) {
    return [];
  }

  if (sample.id === "image-tracking") {
    return [
      {
        id: "image-tracking-target-load",
        severity: "high",
        pattern: /(image\s*target|imagetarget|target).{0,160}(not\s*found|missing|load(ed)?\s*failed|cannot\s*load|invalid|empty)/i,
        title: "Image Tracking target asset cannot be loaded",
        actions: [
          "Check Assets/EasyARGenerated/image-tracking/RUNBOOK.md.",
          "Add official Image Tracking target images, target JSON/XML files, `.etd` files, or imported target assets under Assets.",
          "Run easyar_check_sample_readiness with sampleId=image-tracking and confirm image-target-assets passes."
        ]
      },
      {
        id: "image-tracking-no-detection",
        severity: "medium",
        pattern: /(image\s*target|imagetarget|tracker|tracking).{0,160}(not\s*detected|lost|timeout|no\s*target|cannot\s*recognize)/i,
        title: "Image Tracking target is not being detected",
        actions: [
          "Verify target physical size and target database/import settings in the official EasyAR workflow.",
          "Test on a real device with stable lighting and a clear printed or screen-displayed target.",
          "Confirm the Image Tracking sample scene is the active scene in Build Settings."
        ]
      }
    ];
  }

  if (sample.id === "cloud-recognition") {
    return [
      {
        id: "cloud-recognition-credentials",
        severity: "high",
        pattern: /(cloud\s*recognition|cloudrecognizer|cloud).{0,180}(appId|appKey|appSecret|credential|secret|key|unauthorized|forbidden|invalid|missing)/i,
        title: "Cloud Recognition credentials are invalid or missing",
        actions: [
          "Fill easyar.cloudRecognition.appId, appKey, and appSecret in ProjectSettings/EasyAR/easyar.local.json.",
          "Run easyar_check_sample_readiness with sampleId=cloud-recognition and confirm cloud-recognition-credentials passes.",
          "Verify the credentials and target library in the official EasyAR account."
        ]
      },
      {
        id: "cloud-recognition-network",
        severity: "medium",
        pattern: /(cloud\s*recognition|cloudrecognizer|cloud).{0,180}(network|timeout|dns|http|ssl|tls|connection|service unavailable|gateway)/i,
        title: "Cloud Recognition network or service request failed",
        actions: [
          "Confirm the device has network access and platform Internet permission.",
          "Verify the EasyAR cloud recognition service endpoint/region configured by the official sample.",
          "Retry on a real device network and inspect device logs for HTTP status details."
        ]
      }
    ];
  }

  return [
    {
      id: "sample-deferred",
      severity: "low",
      pattern: /easyar|sample|tracking|cloud|camera/i,
      title: "Sample is outside the current focused run-through scope",
      actions: [
        "Current focused run-through work covers image-tracking and cloud-recognition.",
        `Switch to a focused sample before expecting sample-specific diagnostics for ${sample.id}.`
      ]
    }
  ];
}

function findEvidence(lines: string[], pattern: RegExp): string[] {
  return lines
    .filter((line) => pattern.test(line))
    .slice(0, 3)
    .map((line) => line.trim().slice(0, 500));
}

type ScriptReviewIssue = {
  id: string;
  severity: "high" | "medium" | "low";
  file: string;
  line: number | null;
  title: string;
  evidence: string | null;
  recommendation: string;
};

function reviewCsharpScript(relativePath: string, text: string): ScriptReviewIssue[] {
  const issues: ScriptReviewIssue[] = [];
  const lines = text.split(/\r?\n/);
  const addIssue = (
    id: string,
    severity: ScriptReviewIssue["severity"],
    line: number | null,
    title: string,
    evidence: string | null,
    recommendation: string
  ) => {
    issues.push({
      id,
      severity,
      file: relativePath,
      line,
      title,
      evidence: evidence?.trim().slice(0, 500) ?? null,
      recommendation
    });
  };

  const usingEasyAR = /\busing\s+EasyAR\b|EasyAR\./.test(text);
  const isMonoBehaviour = /:\s*MonoBehaviour\b/.test(text);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    if (/(license\w*|appSecret|appKey|accountToken)\s*=\s*"[^"]{8,}"/i.test(line)) {
      addIssue(
        "hardcoded-easyar-secret",
        "high",
        lineNumber,
        "Possible EasyAR secret is hardcoded in a C# script",
        line,
        "Move license keys, cloud recognition credentials, and account tokens into local config or secret injection."
      );
    }

    if (/\basync\s+void\b/.test(line) && !/\b(async\s+void\s+(Start|Awake|OnEnable|OnDisable|Update|FixedUpdate|LateUpdate)\s*\()/.test(line)) {
      addIssue(
        "async-void",
        "medium",
        lineNumber,
        "async void method can hide exceptions",
        line,
        "Use Task-returning methods for internal async work and surface failures through Unity logs."
      );
    }
  });

  const updateBody = extractMethodBody(text, "Update");
  if (updateBody && /\b(GameObject\.Find|FindObjectOfType|FindObjectsOfType|Resources\.Load)\s*\(/.test(updateBody)) {
    addIssue(
      "expensive-update-lookup",
      "medium",
      findLineNumber(lines, /\bvoid\s+Update\s*\(/),
      "Update performs expensive scene or resource lookups",
      firstMatchingLine(updateBody, /\b(GameObject\.Find|FindObjectOfType|FindObjectsOfType|Resources\.Load)\s*\(/),
      "Cache references in Awake/Start or assign them with [SerializeField] before running AR tracking loops."
    );
  }

  if (isMonoBehaviour && /\bStartCoroutine\s*\(/.test(text) && !/\bStopCoroutine\s*\(|\bStopAllCoroutines\s*\(/.test(text)) {
    addIssue(
      "coroutine-not-stopped",
      "low",
      findLineNumber(lines, /\bStartCoroutine\s*\(/),
      "Coroutine is started without an obvious stop path",
      firstMatchingLine(text, /\bStartCoroutine\s*\(/),
      "Stop long-running coroutines in OnDisable/OnDestroy so AR session transitions do not leak work."
    );
  }

  if (isMonoBehaviour && /\bInvokeRepeating\s*\(/.test(text) && !/\bCancelInvoke\s*\(/.test(text)) {
    addIssue(
      "invoke-not-cancelled",
      "low",
      findLineNumber(lines, /\bInvokeRepeating\s*\(/),
      "InvokeRepeating is used without CancelInvoke",
      firstMatchingLine(text, /\bInvokeRepeating\s*\(/),
      "Call CancelInvoke in OnDisable/OnDestroy for predictable sample teardown."
    );
  }

  if (isMonoBehaviour && /\[SerializeField\]\s+private\s+[\w<>\[\].]+\s+(\w+)\s*;/.test(text)) {
    const serializedFields = Array.from(text.matchAll(/\[SerializeField\]\s+private\s+[\w<>\[\].]+\s+(\w+)\s*;/g)).map((match) => match[1]);
    for (const field of serializedFields) {
      const fieldUsePattern = new RegExp(`\\b${escapeRegExp(field)}\\s*!=\\s*null|\\b${escapeRegExp(field)}\\s*==\\s*null`);
      if (!fieldUsePattern.test(text)) {
        addIssue(
          "serialized-field-no-null-check",
          "low",
          findLineNumber(lines, new RegExp(`\\b${escapeRegExp(field)}\\b`)),
          "Serialized field has no obvious null guard",
          field,
          "Add a null check or validation log before using Inspector-assigned AR references."
        );
      }
    }
  }

  if (usingEasyAR && !/try\s*\{|catch\s*\(|Debug\.Log(Error|Warning)?\s*\(/.test(text)) {
    addIssue(
      "easyar-code-no-diagnostics",
      "low",
      null,
      "EasyAR-related script has little diagnostic logging",
      null,
      "Add focused Debug.LogWarning/Debug.LogError messages around EasyAR initialization, target events, and credential-dependent paths."
    );
  }

  if (/\bInput\.touchCount\b/.test(text) && !/\bInput\.GetTouch\s*\(\s*0\s*\)\.phase\b/.test(text)) {
    addIssue(
      "touch-without-phase-check",
      "medium",
      findLineNumber(lines, /\bInput\.touchCount\b/),
      "Touch input is read without an obvious phase check",
      firstMatchingLine(text, /\bInput\.touchCount\b/),
      "Gate placement logic on TouchPhase.Began or a deliberate gesture phase to avoid repeated placement every frame."
    );
  }

  return issues;
}

async function buildScriptReviewReport(root: string, relativePaths: string[] | undefined, maxFiles: number, maxIssues: number) {
  const files = relativePaths && relativePaths.length > 0
    ? relativePaths.map((relativePath) => {
        const target = path.resolve(root, relativePath);
        assertInside(root, target);
        if (!target.endsWith(".cs")) {
          throw new Error("easyar_review_csharp_scripts only reviews .cs files.");
        }
        return target;
      })
    : (await findFiles(root, ["Assets"], /\.cs$/i, maxFiles)).map((relativePath) => path.join(root, relativePath));

  const reviewed: string[] = [];
  const issues: ScriptReviewIssue[] = [];
  for (const filePath of files.slice(0, maxFiles)) {
    if (!await exists(filePath)) {
      issues.push({
        id: "script-missing",
        severity: "high",
        file: path.relative(root, filePath),
        line: null,
        title: "Script file does not exist",
        evidence: null,
        recommendation: "Check the relativePaths input and rerun the review."
      });
      continue;
    }

    const text = await readFile(filePath, "utf8");
    reviewed.push(path.relative(root, filePath));
    issues.push(...reviewCsharpScript(path.relative(root, filePath), text));
    if (issues.length >= maxIssues) {
      break;
    }
  }

  const limitedIssues = issues.slice(0, maxIssues);
  return {
    projectPath: root,
    reviewedFiles: reviewed,
    reviewedFileCount: reviewed.length,
    issueCount: limitedIssues.length,
    issues: limitedIssues,
    nextActions: buildScriptReviewActions(limitedIssues),
    note: "This is a static review. Unity compilation and device testing remain the source of truth."
  };
}

function buildScriptReviewActions(issues: ScriptReviewIssue[]): string[] {
  if (issues.length === 0) {
    return ["No static script review issues were detected. Run Unity compilation and device tests next."];
  }
  const actions = new Set<string>();
  if (issues.some((issue) => issue.id === "hardcoded-easyar-secret")) {
    actions.add("Move EasyAR secrets into ProjectSettings/EasyAR/easyar.local.json or environment-backed secret storage.");
  }
  if (issues.some((issue) => issue.severity === "high")) {
    actions.add("Fix high-severity script issues before running Unity batch builds.");
  }
  actions.add("Patch focused scripts with easyar_write_csharp_file, then run Unity compilation or easyar_analyze_unity_log.");
  return Array.from(actions);
}

function chooseNextRunPhase(
  readiness: Awaited<ReturnType<typeof buildSampleReadinessReport>>,
  configValidation: Awaited<ReturnType<typeof buildLocalConfigValidationReport>>,
  scriptReview: Awaited<ReturnType<typeof buildScriptReviewReport>>
): string {
  if (!readiness.ready) {
    return "Fix readiness gaps before Unity batch automation.";
  }
  if (!configValidation.valid) {
    return "Fix local EasyAR config before building to device.";
  }
  if (scriptReview.issueCount > 0) {
    return "Fix static C# review issues before compiling in Unity.";
  }
  return "Run mobile settings, Build Settings, and device build helpers from easyar_generate_run_sequence.";
}

function buildRunReportMarkdown(report: Awaited<ReturnType<typeof buildFocusedRunReport>>): string {
  const failedReadiness = report.readiness.checks.filter((check) => !check.ok);
  const failedConfig = report.configValidation.checks.filter((check) => !check.ok);
  const scriptIssues = report.scriptReview.issues;
  return [
    `# EasyAR Focused Run Report - ${report.sample.name}`,
    "",
    `Generated at: ${report.generatedAt}`,
    `Project: ${report.projectPath}`,
    `Sample id: ${report.sample.id}`,
    `Status: ${report.sample.implementationStatus}`,
    `Overall ready: ${report.overallReady ? "yes" : "no"}`,
    "",
    "## Next Recommended Phase",
    "",
    report.nextRecommendedPhase,
    "",
    "## Readiness",
    "",
    `Ready: ${report.readiness.ready ? "yes" : "no"}`,
    ...markdownIssueList(failedReadiness.map((check) => `${check.id}: ${check.detail}`), "All readiness checks passed."),
    "",
    "## Local Config",
    "",
    `Valid: ${report.configValidation.valid ? "yes" : "no"}`,
    ...markdownIssueList(failedConfig.map((check) => `${check.id}: ${check.detail}`), "Local config checks passed."),
    "",
    "## Script Review",
    "",
    `Reviewed files: ${report.scriptReview.reviewedFileCount}`,
    `Issue count: ${report.scriptReview.issueCount}`,
    ...markdownIssueList(scriptIssues.map((issue) => `${issue.severity} ${issue.file}${issue.line ? `:${issue.line}` : ""} - ${issue.title}`), "No static script review issues."),
    "",
    "## Run Sequence Summary",
    "",
    ...report.runSequenceSummary.map((phase) => `- ${phase.name}: ${phase.stepCount} step(s)`),
    "",
    "## Security",
    "",
    report.security,
    ""
  ].join("\n");
}

function buildSceneAuditMarkdown(audit: Awaited<ReturnType<typeof buildSampleSceneAudit>>): string {
  return [
    `# EasyAR Focused Scene Audit - ${audit.sample.name}`,
    "",
    `Project: ${audit.projectPath}`,
    `Sample id: ${audit.sample.id}`,
    `Status: ${audit.sample.implementationStatus}`,
    `Unity version: ${audit.unityVersion ?? "unknown"}`,
    `Ready for Unity validation: ${audit.readyForUnityValidation ? "yes" : "no"}`,
    "",
    "## Blockers",
    "",
    ...markdownIssueList(audit.blockers.map((blocker) => `${blocker.id}: ${blocker.detail}`), "No blockers detected."),
    "",
    "## Next Actions",
    "",
    ...markdownIssueList(audit.nextActions, "Run the focused sample Unity validator."),
    "",
    "## EasyAR Import Signals",
    "",
    ...markdownIssueList(audit.easyarSignals, "No official EasyAR import signals found."),
    "",
    "## Ignored Generated Signals",
    "",
    ...markdownIssueList(audit.ignoredGeneratedSignals, "No generated MCP helper signals were ignored."),
    "",
    "## Scene Candidates",
    "",
    `Scene hints: ${audit.sample.sceneHints.join(", ")}`,
    "",
    ...markdownIssueList(audit.sceneCandidates, "No Unity scene candidates found under Assets."),
    "",
    "## Matching Scenes",
    "",
    ...markdownIssueList(audit.matchingScenes, "No matching focused sample scenes found."),
    "",
    "## Build Settings",
    "",
    `EditorBuildSettings.asset exists: ${audit.buildSettingsHints.fileExists ? "yes" : "no"}`,
    `First enabled scene: ${audit.buildSettingsHints.firstEnabledScene ?? "none"}`,
    `First enabled scene matches sample: ${audit.buildSettingsHints.firstEnabledSceneMatches ? "yes" : "no"}`,
    "",
    ...markdownIssueList(audit.buildSettingsHints.enabledScenes, "No enabled Build Settings scenes found."),
    "",
    "## Sample Specific",
    "",
    `Kind: ${audit.sampleSpecific.kind}`,
    ...markdownIssueList(audit.sampleSpecific.targetAssets, "No sample-specific target assets listed."),
    ...(audit.sampleSpecific.cloudConfig
      ? [
          "",
          `Cloud config valid: ${audit.sampleSpecific.cloudConfig.valid ? "yes" : "no"}`,
          `Cloud appId present: ${audit.sampleSpecific.cloudConfig.presence.appId ? "yes" : "no"}`,
          `Cloud appKey present: ${audit.sampleSpecific.cloudConfig.presence.appKey ? "yes" : "no"}`,
          `Cloud appSecret present: ${audit.sampleSpecific.cloudConfig.presence.appSecret ? "yes" : "no"}`,
          audit.sampleSpecific.cloudConfig.detail
        ]
      : []),
    "",
    "## Security",
    "",
    audit.security,
    ""
  ].join("\n");
}

function buildSupportBundleMarkdown(bundle: Awaited<ReturnType<typeof buildSupportBundle>>): string {
  return [
    `# EasyAR Focused Support Bundle - ${bundle.sample.name}`,
    "",
    `Generated at: ${bundle.generatedAt}`,
    `Project: ${bundle.projectPath}`,
    `Sample id: ${bundle.sample.id}`,
    `Status: ${bundle.sample.implementationStatus}`,
    `Platform: ${bundle.platform}`,
    `Output path: ${bundle.outputPath}`,
    `Development build: ${bundle.developmentBuild ? "yes" : "no"}`,
    "",
    "## Current State",
    "",
    `Overall ready: ${bundle.runReport.overallReady ? "yes" : "no"}`,
    `Ready for Unity validation: ${bundle.sceneAudit.readyForUnityValidation ? "yes" : "no"}`,
    `Latest log analyzed: ${bundle.latestLog.analyzed ? "yes" : "no"}`,
    `Latest log issue count: ${bundle.latestLog.issueCount}`,
    "",
    "## Next Actions",
    "",
    ...markdownIssueList(bundle.nextActions, "Run the focused Unity validator."),
    "",
    "## Generated Artifacts",
    "",
    ...Object.entries(bundle.generatedArtifacts).map(([name, artifactPath]) => `- ${name}: ${artifactPath}`),
    "",
    "## Run Sequence Summary",
    "",
    ...bundle.runSequenceSummary.map((phase) => `- ${phase.name}: ${phase.stepCount} step(s)`),
    "",
    "## Run Report",
    "",
    `Next recommended phase: ${bundle.runReport.nextRecommendedPhase}`,
    `Readiness ready: ${bundle.runReport.readiness.ready ? "yes" : "no"}`,
    `Local config valid: ${bundle.runReport.configValidation.valid ? "yes" : "no"}`,
    `Script issue count: ${bundle.runReport.scriptReview.issueCount}`,
    "",
    "## Scene Audit",
    "",
    `Matching scenes: ${bundle.sceneAudit.matchingScenes.length}`,
    `EasyAR import signals: ${bundle.sceneAudit.easyarSignals.length}`,
    `Scene audit blockers: ${bundle.sceneAudit.blockers.length}`,
    `First Build Settings scene: ${bundle.sceneAudit.buildSettingsHints.firstEnabledScene ?? "none"}`,
    `First scene matches sample: ${bundle.sceneAudit.buildSettingsHints.firstEnabledSceneMatches ? "yes" : "no"}`,
    "",
    ...markdownIssueList(bundle.sceneAudit.blockers.map((blocker) => `${blocker.id}: ${blocker.detail}`), "No scene audit blockers."),
    "",
    "## Latest Unity Log",
    "",
    `Log path: ${bundle.latestLog.logPath ?? "none"}`,
    `Modified at: ${bundle.latestLog.logModifiedAt ?? "unknown"}`,
    `Size bytes: ${bundle.latestLog.logSizeBytes ?? "unknown"}`,
    "",
    ...(bundle.latestLog.summary
      ? [
          `Total lines: ${bundle.latestLog.summary.totalLines}`,
          `Error lines: ${bundle.latestLog.summary.errorLines}`,
          `Warning lines: ${bundle.latestLog.summary.warningLines}`,
          `Mentions EasyAR: ${bundle.latestLog.summary.mentionsEasyAR ? "yes" : "no"}`
        ]
      : ["No log summary available."]),
    "",
    ...markdownIssueList(bundle.latestLog.issues.map((issue) => `${issue.severity} ${issue.id}: ${issue.title}${issue.evidence ? ` (${issue.evidence})` : ""}`), "No known log issue patterns detected."),
    "",
    "## Security",
    "",
    bundle.security,
    ""
  ].join("\n");
}

function buildRunResultMarkdown(result: Awaited<ReturnType<typeof buildRunResult>>): string {
  return [
    `# EasyAR Focused Run Result - ${result.sample.name}`,
    "",
    `Generated at: ${result.generatedAt}`,
    `Project: ${result.projectPath}`,
    `Sample id: ${result.sample.id}`,
    `Status: ${result.sample.implementationStatus}`,
    `Platform: ${result.platform}`,
    `Overall status: ${result.overallStatus}`,
    `Device: ${result.device ?? "not recorded"}`,
    `Build output: ${result.buildOutputPath ?? "not recorded"}`,
    "",
    "## Notes",
    "",
    result.notes ?? "No notes recorded.",
    "",
    "## Step Results",
    "",
    ...markdownRunResultSteps(result.steps),
    "",
    "## Support Summary",
    "",
    `Overall ready: ${result.supportBundleSummary.overallReady ? "yes" : "no"}`,
    `Ready for Unity validation: ${result.supportBundleSummary.readyForUnityValidation ? "yes" : "no"}`,
    `Latest log issue count: ${result.supportBundleSummary.logIssueCount}`,
    `Support bundle: ${result.supportBundleSummary.supportBundlePath}`,
    "",
    "## Next Actions",
    "",
    ...markdownIssueList(result.nextActions, "No next actions recorded."),
    "",
    "## Security",
    "",
    result.security,
    ""
  ].join("\n");
}

function buildCodePlanMarkdown(plan: Awaited<ReturnType<typeof buildCodePlan>>): string {
  return [
    `# EasyAR Focused Code Plan - ${plan.sample.name}`,
    "",
    `Generated at: ${plan.generatedAt}`,
    `Project: ${plan.projectPath}`,
    `Sample id: ${plan.sample.id}`,
    `Status: ${plan.sample.implementationStatus}`,
    "",
    "## Goal",
    "",
    plan.goal,
    "",
    "## Target Files",
    "",
    ...markdownIssueList(plan.targetFiles, "No target files listed."),
    "",
    "## Suggested Starting Tool",
    "",
    `Tool: ${plan.suggestedTemplate.tool}`,
    `Arguments: ${JSON.stringify(plan.suggestedTemplate.arguments)}`,
    "",
    "## Readiness Summary",
    "",
    `Ready: ${plan.readinessSummary.ready ? "yes" : "no"}`,
    ...markdownIssueList(plan.readinessSummary.failingChecks, "No failing readiness checks."),
    "",
    "## Existing Script Review",
    "",
    `Reviewed files: ${plan.scriptReviewSummary.reviewedFileCount}`,
    `Issue count: ${plan.scriptReviewSummary.issueCount}`,
    ...markdownIssueList(plan.scriptReviewSummary.issues.map((issue) => `${issue.severity} ${issue.file}${issue.line ? `:${issue.line}` : ""} - ${issue.title}`), "No static script issues detected."),
    "",
    "## Implementation Steps",
    "",
    ...plan.implementationSteps.map((step) => `- ${step}`),
    "",
    "## Risk Checks",
    "",
    ...plan.riskChecks.map((check) => `- ${check}`),
    "",
    "## Verification Steps",
    "",
    ...plan.verificationSteps.map((step) => `- ${step}`),
    "",
    "## Next Actions",
    "",
    ...plan.nextActions.map((action) => `- ${action}`),
    "",
    "## Security",
    "",
    plan.security,
    ""
  ].join("\n");
}

function markdownRunResultSteps(steps: Awaited<ReturnType<typeof buildRunResult>>["steps"]): string[] {
  if (steps.length === 0) {
    return ["- No step results recorded."];
  }
  return steps.flatMap((step, index) => [
    `${index + 1}. ${step.name}`,
    `   - Status: ${step.status}`,
    `   - Evidence: ${step.evidence ?? "not recorded"}`,
    `   - Next action: ${step.nextAction ?? "not recorded"}`
  ]);
}

function buildRunSequenceMarkdown(sequence: ReturnType<typeof buildFocusedRunSequence>): string {
  const lines = [
    `# EasyAR Focused Run Sequence - ${sequence.sample.name}`,
    "",
    `Project: ${sequence.projectPath}`,
    `Sample id: ${sequence.sample.id}`,
    `Status: ${sequence.sample.implementationStatus}`,
    `Supported now: ${sequence.supportedNow ? "yes" : "no"}`,
    `Platform: ${sequence.platform}`,
    `Output path: ${sequence.outputPath}`,
    `Development build: ${sequence.developmentBuild ? "yes" : "no"}`,
    "",
    "## Execution Phases",
    ""
  ];

  for (const phase of sequence.phases) {
    lines.push(`### ${phase.name}`, "");
    phase.steps.forEach((step, index) => {
      lines.push(`${index + 1}. ${step.step}`);
      lines.push(`   - Tool: \`${step.tool}\``);
      lines.push(`   - Arguments: \`${JSON.stringify(step.arguments)}\``);
      lines.push(`   - Expected: ${step.expected}`);
      if ("requiredBeforeDeviceRun" in step && step.requiredBeforeDeviceRun) {
        lines.push("   - Required before device run: yes");
      }
      lines.push("");
    });
  }

  lines.push("## Stop Conditions", "");
  lines.push(...sequence.stopConditions.map((condition) => `- ${condition}`));
  lines.push("", "## Security", "", sequence.security, "");
  return lines.join("\n");
}

function markdownIssueList(items: string[], emptyMessage: string): string[] {
  if (items.length === 0) {
    return [`- ${emptyMessage}`];
  }
  return items.map((item) => `- ${item}`);
}

function extractMethodBody(text: string, methodName: string): string | null {
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

function findLineNumber(lines: string[], pattern: RegExp): number | null {
  const index = lines.findIndex((line) => pattern.test(line));
  return index >= 0 ? index + 1 : null;
}

function firstMatchingLine(text: string, pattern: RegExp): string | null {
  return text.split(/\r?\n/).find((line) => pattern.test(line))?.trim() ?? null;
}

async function walk(root: string, dirPath: string, pattern: RegExp, found: string[], limit: number): Promise<void> {
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

function assertInside(root: string, target: string) {
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Target path must stay inside the Unity project.");
  }
}

function buildSampleRunner(sample: SampleInfo): string {
  const sceneNames = sample.unityScenes.map((scene) => `        "${escapeCsharp(scene)}"`).join(",\n");
  return `using System;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;

namespace EasyAR.EditorTools
{
    public static class EasyARSampleRunner
    {
        private static readonly string[] SceneNameHints =
        {
${sceneNames}
        };

        [MenuItem("Tools/EasyAR/Open Sample Scene")]
        public static void OpenSampleScene()
        {
            var scene = AssetDatabase.FindAssets("t:Scene")
                .Select(AssetDatabase.GUIDToAssetPath)
                .FirstOrDefault(path => SceneNameHints.Any(hint => path.IndexOf(hint, StringComparison.OrdinalIgnoreCase) >= 0));

            if (string.IsNullOrEmpty(scene))
            {
                throw new InvalidOperationException("No matching EasyAR sample scene found. Import the official ${escapeCsharp(sample.name)} sample first.");
            }

            EditorSceneManager.OpenScene(scene);
            UnityEngine.Debug.Log("Opened EasyAR sample scene: " + scene);
        }
    }
}
`;
}

function buildBuildSettingsHelper(sample: SampleInfo, platform: typeof buildPlatforms[number]): string {
  const sceneNames = sample.unityScenes.map((scene) => `            "${escapeCsharp(scene)}"`).join(",\n");
  const switchTarget = buildTargetSwitchSnippet(platform);
  return `using System;
using System.Linq;
using UnityEditor;

namespace EasyAR.EditorTools
{
    public static class EasyARBuildSettingsHelper
    {
        private static readonly string[] SceneNameHints =
        {
${sceneNames}
        };

        [MenuItem("Tools/EasyAR/Configure Build Settings")]
        public static void ConfigureBuildSettings()
        {
            var scene = AssetDatabase.FindAssets("t:Scene")
                .Select(AssetDatabase.GUIDToAssetPath)
                .FirstOrDefault(path => SceneNameHints.Any(hint => path.IndexOf(hint, StringComparison.OrdinalIgnoreCase) >= 0));

            if (string.IsNullOrEmpty(scene))
            {
                throw new InvalidOperationException("No matching EasyAR sample scene found. Import the official ${escapeCsharp(sample.name)} sample first.");
            }

            var existingScenes = EditorBuildSettings.scenes
                .Where(item => item != null && !string.IsNullOrEmpty(item.path) && item.path != scene)
                .ToList();
            existingScenes.Insert(0, new EditorBuildSettingsScene(scene, true));
            EditorBuildSettings.scenes = existingScenes.ToArray();

${switchTarget}
            UnityEngine.Debug.Log("Configured EasyAR Build Settings with sample scene: " + scene);
        }
    }
}
`;
}

function buildSampleValidationHelper(sample: SampleInfo): string {
  const sceneNames = sample.unityScenes.map((scene) => `            "${escapeCsharp(scene)}"`).join(",\n");
  const sampleValidation = sample.id === "image-tracking"
    ? `            var targetAssets = AssetDatabase.FindAssets("ImageTarget OR ImageTracker OR target")
                .Select(AssetDatabase.GUIDToAssetPath)
                .Where(IsImageTrackingTargetAsset)
                .ToArray();
            if (targetAssets.Length == 0)
            {
                throw new InvalidOperationException("No Image Tracking target asset hints found. Add target images, target data, or official Image Tracking sample assets under Assets.");
            }
            UnityEngine.Debug.Log("Validated Image Tracking target asset hints: " + string.Join(", ", targetAssets.Take(5)));
`
    : sample.id === "cloud-recognition"
      ? `            var localConfigPath = Path.Combine(Directory.GetCurrentDirectory(), "ProjectSettings", "EasyAR", "easyar.local.json");
            if (!File.Exists(localConfigPath))
            {
                throw new InvalidOperationException("Cloud Recognition requires ProjectSettings/EasyAR/easyar.local.json.");
            }
            var localConfig = File.ReadAllText(localConfigPath);
            if (!ContainsConfiguredJsonString(localConfig, "appId") || !ContainsConfiguredJsonString(localConfig, "appKey") || !ContainsConfiguredJsonString(localConfig, "appSecret"))
            {
                throw new InvalidOperationException("Cloud Recognition requires appId, appKey, and appSecret in easyar.local.json.");
            }
            UnityEngine.Debug.Log("Validated Cloud Recognition local credential presence without printing secret values.");
`
      : `            throw new InvalidOperationException("This generated validation helper is only focused on Image Tracking and Cloud Recognition.");
`;

  return `using System;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using UnityEditor;

namespace EasyAR.EditorTools
{
    public static class EasyARSampleValidationHelper
    {
        private static readonly string[] SceneNameHints =
        {
${sceneNames}
        };

        [MenuItem("Tools/EasyAR/Validate Focused Sample")]
        public static void ValidateFocusedSample()
        {
            var easyarAssets = AssetDatabase.FindAssets("EasyAR")
                .Select(AssetDatabase.GUIDToAssetPath)
                .Where(IsOfficialEasyARAssetSignal)
                .ToArray();
            if (easyarAssets.Length == 0)
            {
                throw new InvalidOperationException("No official EasyAR asset signals found. Import the official EasyAR Unity Plugin package first. Generated MCP helper files do not count.");
            }

            var scene = AssetDatabase.FindAssets("t:Scene")
                .Select(AssetDatabase.GUIDToAssetPath)
                .FirstOrDefault(IsMatchingSampleScene);
            if (string.IsNullOrEmpty(scene))
            {
                throw new InvalidOperationException("No matching ${escapeCsharp(sample.name)} scene found. Import the official focused sample scene first.");
            }

            var sceneInBuildSettings = EditorBuildSettings.scenes
                .Any(item => item != null && item.enabled && item.path == scene);
            if (!sceneInBuildSettings)
            {
                throw new InvalidOperationException("Matching sample scene is not enabled in Build Settings. Run EasyARBuildSettingsHelper.ConfigureBuildSettings first.");
            }

            var firstEnabledScene = EditorBuildSettings.scenes
                .Where(item => item != null && item.enabled && !string.IsNullOrEmpty(item.path))
                .Select(item => item.path)
                .FirstOrDefault();
            if (!string.Equals(firstEnabledScene, scene, StringComparison.Ordinal))
            {
                throw new InvalidOperationException("Matching sample scene is enabled but is not the first enabled Build Settings scene. Run EasyARBuildSettingsHelper.ConfigureBuildSettings again.");
            }

${sampleValidation}
            UnityEngine.Debug.Log("EasyAR focused sample validation passed for ${escapeCsharp(sample.name)}. Scene: " + scene + ". EasyAR signals: " + easyarAssets.Length + ".");
        }

        private static bool IsMatchingSampleScene(string path)
        {
            return !IsGeneratedSupportAsset(path)
                && SceneNameHints.Any(hint => path.IndexOf(hint, StringComparison.OrdinalIgnoreCase) >= 0);
        }

        private static bool IsOfficialEasyARAssetSignal(string path)
        {
            return !IsGeneratedSupportAsset(path)
                && !IsGeneratedEditorHelper(path)
                && path.IndexOf("EasyAR", StringComparison.OrdinalIgnoreCase) >= 0;
        }

        private static bool IsImageTrackingTargetAsset(string path)
        {
            if (IsGeneratedSupportAsset(path) || IsGeneratedEditorHelper(path))
            {
                return false;
            }

            var extension = Path.GetExtension(path);
            var hasTargetExtension = string.Equals(extension, ".jpg", StringComparison.OrdinalIgnoreCase)
                || string.Equals(extension, ".jpeg", StringComparison.OrdinalIgnoreCase)
                || string.Equals(extension, ".png", StringComparison.OrdinalIgnoreCase)
                || string.Equals(extension, ".json", StringComparison.OrdinalIgnoreCase)
                || string.Equals(extension, ".xml", StringComparison.OrdinalIgnoreCase)
                || string.Equals(extension, ".etd", StringComparison.OrdinalIgnoreCase);
            return hasTargetExtension && path.IndexOf("target", StringComparison.OrdinalIgnoreCase) >= 0;
        }

        private static bool IsGeneratedSupportAsset(string path)
        {
            return path.Replace('\\\\', '/').StartsWith("Assets/EasyARGenerated/", StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsGeneratedEditorHelper(string path)
        {
            var normalized = path.Replace('\\\\', '/');
            return normalized.StartsWith("Assets/Editor/EasyAR", StringComparison.OrdinalIgnoreCase)
                && string.Equals(Path.GetExtension(normalized), ".cs", StringComparison.OrdinalIgnoreCase);
        }

        private static bool ContainsConfiguredJsonString(string json, string key)
        {
            var match = Regex.Match(json, "\\\\\\"" + Regex.Escape(key) + "\\\\\\"\\\\s*:\\\\s*\\\\\\"([^\\\\\\"]*)\\\\\\"");
            if (!match.Success)
            {
                return false;
            }
            var value = match.Groups[1].Value.Trim();
            return value.Length > 0
                && value.IndexOf("paste-", StringComparison.OrdinalIgnoreCase) < 0
                && value.IndexOf("placeholder", StringComparison.OrdinalIgnoreCase) < 0
                && value.IndexOf("your_", StringComparison.OrdinalIgnoreCase) < 0;
        }
    }
}
`;
}

function buildDeviceBuildHelper(
  platform: typeof deviceBuildPlatforms[number],
  outputPath: string,
  developmentBuild: boolean
): string {
  const target = deviceBuildTarget(platform);
  const options = developmentBuild ? "BuildOptions.Development" : "BuildOptions.None";
  return `using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Build.Reporting;

namespace EasyAR.EditorTools
{
    public static class EasyARDeviceBuildHelper
    {
        private const string OutputPath = "${escapeCsharp(outputPath)}";

        [MenuItem("Tools/EasyAR/Build Device Player")]
        public static void Build()
        {
            ${target.switchTarget}

            var scenes = EditorBuildSettings.scenes
                .Where(scene => scene != null && scene.enabled && !string.IsNullOrEmpty(scene.path))
                .Select(scene => scene.path)
                .ToArray();

            if (scenes.Length == 0)
            {
                throw new InvalidOperationException("No enabled scenes found in Build Settings. Run EasyARBuildSettingsHelper.ConfigureBuildSettings first.");
            }

            var outputDirectory = Path.GetDirectoryName(OutputPath);
            if (!string.IsNullOrEmpty(outputDirectory))
            {
                Directory.CreateDirectory(outputDirectory);
            }

            var report = BuildPipeline.BuildPlayer(scenes, OutputPath, ${target.buildTarget}, ${options});
            if (report.summary.result != BuildResult.Succeeded)
            {
                throw new InvalidOperationException("EasyAR player build failed: " + report.summary.result);
            }

            UnityEngine.Debug.Log("EasyAR player build succeeded: " + OutputPath);
        }
    }
}
`;
}

function buildMobileSettingsHelper(
  platform: typeof mobilePlatforms[number],
  bundleIdentifier: string,
  cameraUsageDescription: string | null,
  minSdkVersion: number | null
): string {
  const iosCameraText = cameraUsageDescription ?? "EasyAR uses the camera to provide augmented reality tracking.";
  const androidMinSdk = minSdkVersion ?? 23;
  const body = platform === "android"
    ? `            PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.Android, BundleIdentifier);
            PlayerSettings.Android.minSdkVersion = (AndroidSdkVersions)${androidMinSdk};
            PlayerSettings.Android.forceInternetPermission = true;
            PlayerSettings.Android.forceSDCardPermission = false;
            EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.Android, BuildTarget.Android);
`
    : `            PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.iOS, BundleIdentifier);
            PlayerSettings.iOS.cameraUsageDescription = CameraUsageDescription;
            EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.iOS, BuildTarget.iOS);
`;

  return `using UnityEditor;

namespace EasyAR.EditorTools
{
    public static class EasyARMobileSettingsHelper
    {
        private const string BundleIdentifier = "${escapeCsharp(bundleIdentifier)}";
        private const string CameraUsageDescription = "${escapeCsharp(iosCameraText)}";

        [MenuItem("Tools/EasyAR/Configure Mobile Settings")]
        public static void ConfigureMobileSettings()
        {
${body}
            PlayerSettings.use32BitDisplayBuffer = false;
            UnityEngine.Debug.Log("Configured EasyAR mobile player settings for ${escapeCsharp(platform)} with bundle identifier: " + BundleIdentifier);
        }
    }
}
`;
}

function deviceBuildTarget(platform: typeof deviceBuildPlatforms[number]) {
  if (platform === "android") {
    return {
      buildTarget: "BuildTarget.Android",
      switchTarget: "EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.Android, BuildTarget.Android);"
    };
  }

  if (platform === "ios") {
    return {
      buildTarget: "BuildTarget.iOS",
      switchTarget: "EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.iOS, BuildTarget.iOS);"
    };
  }

  return {
    buildTarget: "BuildTarget.StandaloneOSX",
    switchTarget: "EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.Standalone, BuildTarget.StandaloneOSX);"
  };
}

function buildTargetSwitchSnippet(platform: typeof buildPlatforms[number]): string {
  if (platform === "android") {
    return `            EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.Android, BuildTarget.Android);
`;
  }

  if (platform === "ios") {
    return `            EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.iOS, BuildTarget.iOS);
`;
  }

  if (platform === "standalone") {
    return `            EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.Standalone, BuildTarget.StandaloneOSX);
`;
  }

  return "            // No build target switch requested.\n";
}

function buildLocalConfigExample(sample: SampleInfo): string {
  return `${JSON.stringify(
    {
      sampleId: sample.id,
      sampleName: sample.name,
      easyar: {
        apiBaseUrl: "https://www.easyar.cn",
        accountToken: "paste-official-registered-user-token-here",
        licenseKey: "paste-easyar-license-key-here",
        cloudRecognition: {
          appId: "",
          appKey: "",
          appSecret: ""
        }
      },
      unity: {
        targetPlatform: "android",
        bundleIdentifier: defaultBundleIdentifier(sample),
        notes: sample.setupNotes
      }
    },
    null,
    2
  )}\n`;
}

function buildFocusedSampleRunbook(sample: SampleInfo): string {
  const commonSteps = [
    `# ${sample.name} Runbook`,
    "",
    `Sample id: \`${sample.id}\``,
    `Implementation status: \`${sample.implementationStatus}\``,
    "",
    "## Before Unity",
    "",
    "1. Import the official EasyAR Unity Plugin and matching official sample scenes.",
    "2. Copy `ProjectSettings/EasyAR/easyar.local.json.example` to `ProjectSettings/EasyAR/easyar.local.json`.",
    "3. Fill the local EasyAR license key and account-scoped values without committing the file.",
    "4. Run `easyar_validate_local_config` and `easyar_check_sample_readiness`.",
    "",
    "## Unity Automation",
    "",
    "1. Run `EasyAR.EditorTools.EasyARMobileSettingsHelper.ConfigureMobileSettings`.",
    "2. Run `EasyAR.EditorTools.EasyARBuildSettingsHelper.ConfigureBuildSettings`.",
    "3. Open the matching official sample scene with `EasyAR.EditorTools.EasyARSampleRunner.OpenSampleScene` if needed.",
    "4. Build and test on a real Android or iOS device."
  ];

  if (sample.id === "image-tracking") {
    return [
      ...commonSteps,
      "",
      "## Image Tracking Checklist",
      "",
      "1. Add target images or official Image Tracking target assets under `Assets`.",
      "2. Confirm target physical size and image quality in the EasyAR target workflow.",
      "3. Keep target texture import settings stable after the sample is working.",
      "4. Test with stable lighting and a printed or screen-displayed target.",
      "",
      "Expected readiness checks:",
      "",
      "- `image-target-assets` should find a target image, target JSON/XML, `.etd`, or similarly named asset.",
      "- `sample-scene` should find an official Image Tracking scene."
    ].join("\n") + "\n";
  }

  if (sample.id === "cloud-recognition") {
    return [
      ...commonSteps,
      "",
      "## Cloud Recognition Checklist",
      "",
      "1. Fill `easyar.cloudRecognition.appId`, `appKey`, and `appSecret` in local config.",
      "2. Confirm network access is allowed on the target platform.",
      "3. Verify the cloud database/target library is configured in the official EasyAR account.",
      "4. Test on a real device with a network path to the selected EasyAR cloud recognition service.",
      "",
      "Expected readiness checks:",
      "",
      "- `cloud-recognition-credentials` should report all three cloud fields configured.",
      "- `sample-scene` should find an official Cloud Recognition scene."
    ].join("\n") + "\n";
  }

  return [
    ...commonSteps,
    "",
    "This sample is deferred in the current run-through scope. Use `image-tracking` or `cloud-recognition` first."
  ].join("\n") + "\n";
}

async function writeFocusedSampleSupportFiles(root: string, sample: SampleInfo, overwrite: boolean, written: string[]) {
  if (sample.id === "image-tracking") {
    const targetDir = path.join(focusedSampleGeneratedDir(root, sample), "Targets");
    await mkdir(targetDir, { recursive: true });
    await writeGeneratedFile(
      path.join(targetDir, "README.md"),
      [
        "# Image Tracking Targets",
        "",
        "Place official EasyAR Image Tracking target images, target JSON/XML files, `.etd` files, or imported target assets here or elsewhere under `Assets`.",
        "",
        "This directory is only a project convention. The readiness check still requires real target assets before the sample is considered runnable."
      ].join("\n") + "\n",
      overwrite,
      written
    );
  }

  if (sample.id === "cloud-recognition") {
    const cloudDir = path.join(focusedSampleGeneratedDir(root, sample), "CloudRecognition");
    await mkdir(cloudDir, { recursive: true });
    await writeGeneratedFile(
      path.join(cloudDir, "README.md"),
      [
        "# Cloud Recognition Credentials",
        "",
        "Fill `ProjectSettings/EasyAR/easyar.local.json` with official `appId`, `appKey`, and `appSecret` values from the registered EasyAR account.",
        "",
        "Do not commit cloud recognition credentials. The generated `.gitignore` protects the local config file."
      ].join("\n") + "\n",
      overwrite,
      written
    );
  }
}

function defaultBundleIdentifier(sample: SampleInfo | null): string {
  const suffix = sample?.id.replace(/[^a-z0-9]+/gi, "").toLowerCase() || "sample";
  return `com.easyar.generated.${suffix}`;
}

function buildMonoBehaviourTemplate(className: string, kind: typeof monoBehaviourKinds[number]): string {
  const header = `using UnityEngine;

namespace EasyAR.Samples.Generated
{
    public sealed class ${className} : MonoBehaviour
    {`;
  const footer = `    }
}
`;

  if (kind === "image-tracking") {
    return `${header}
        [SerializeField] private GameObject contentRoot;

        private void Awake()
        {
            SetContentVisible(false);
        }

        public void OnTargetFound()
        {
            SetContentVisible(true);
        }

        public void OnTargetLost()
        {
            SetContentVisible(false);
        }

        private void SetContentVisible(bool visible)
        {
            if (contentRoot != null)
            {
                contentRoot.SetActive(visible);
            }
        }
${footer}`;
  }

  if (kind === "surface-placement") {
    return `${header}
        [SerializeField] private Camera arCamera;
        [SerializeField] private GameObject placementPrefab;
        [SerializeField] private LayerMask placementMask = ~0;

        private GameObject currentPlacement;

        private void Update()
        {
            if (Input.touchCount == 0 || Input.GetTouch(0).phase != TouchPhase.Began)
            {
                return;
            }

            var ray = arCamera != null
                ? arCamera.ScreenPointToRay(Input.GetTouch(0).position)
                : new Ray(transform.position, transform.forward);

            if (Physics.Raycast(ray, out var hit, 10f, placementMask))
            {
                Place(hit.point, hit.normal);
            }
        }

        private void Place(Vector3 position, Vector3 normal)
        {
            if (placementPrefab == null)
            {
                Debug.LogWarning("Placement prefab is not assigned.");
                return;
            }

            if (currentPlacement == null)
            {
                currentPlacement = Instantiate(placementPrefab);
            }

            currentPlacement.transform.SetPositionAndRotation(position, Quaternion.LookRotation(normal));
        }
${footer}`;
  }

  if (kind === "cloud-recognition") {
    return `${header}
        [SerializeField] private string expectedTargetName;
        [SerializeField] private GameObject recognizedContent;

        private void Awake()
        {
            SetRecognized(false);
        }

        public void OnCloudTargetRecognized(string targetName)
        {
            var matched = string.IsNullOrEmpty(expectedTargetName) || expectedTargetName == targetName;
            SetRecognized(matched);
            Debug.Log("EasyAR cloud recognition result: " + targetName);
        }

        public void OnCloudRecognitionLost()
        {
            SetRecognized(false);
        }

        private void SetRecognized(bool recognized)
        {
            if (recognizedContent != null)
            {
                recognizedContent.SetActive(recognized);
            }
        }
${footer}`;
  }

  return `${header}
        [SerializeField] private bool logLifecycle = true;

        private void OnEnable()
        {
            if (logLifecycle)
            {
                Debug.Log("${className} enabled.");
            }
        }

        private void OnDisable()
        {
            if (logLifecycle)
            {
                Debug.Log("${className} disabled.");
            }
        }
${footer}`;
}

async function writeGeneratedFile(filePath: string, contents: string, overwrite: boolean, written: string[]) {
  if (!overwrite && await exists(filePath)) {
    return;
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, "utf8");
  written.push(filePath);
}

async function ensureGitignoreEntries(gitignorePath: string, entries: string[]) {
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

function escapeCsharp(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resolveUnityLogPath(root: string, logPath: string): string {
  const resolved = path.isAbsolute(logPath) ? logPath : path.resolve(root, logPath);
  assertInside(root, resolved);
  return resolved;
}

function defaultUnityBatchLogPath(executeMethod: string): string {
  return path.join("Logs", `mcp-easyar-${executeMethod.split(".").pop() ?? "unity-method"}.log`);
}

function buildUnityArgs(projectPath: string, executeMethod: string | null, logPath: string | null): string[] {
  const args = [
    "-batchmode",
    "-quit",
    "-projectPath",
    projectPath
  ];
  if (executeMethod) {
    args.push("-executeMethod", executeMethod);
  }
  if (logPath) {
    args.push("-logFile", logPath);
  }
  return args;
}

async function runUnity(unity: string, projectPath: string, executeMethod: string | null, timeoutSeconds: number, logPath: string | null) {
  if (logPath) {
    await mkdir(path.dirname(logPath), { recursive: true });
  }
  const args = buildUnityArgs(projectPath, executeMethod, logPath);

  return new Promise<{ command: string; exitCode: number | null; logPath: string | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(unity, args, { stdio: ["ignore", "pipe", "pipe"] });
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Unity command timed out after ${timeoutSeconds} seconds.`));
    }, timeoutSeconds * 1000);

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (exitCode) => {
      clearTimeout(timeout);
      resolve({
        command: [unity, ...args].join(" "),
        exitCode,
        logPath,
        stdout: stdout.slice(-12000),
        stderr: stderr.slice(-12000)
      });
    });
  });
}

function jsonText(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

function markdownText(text: string) {
  return {
    content: [
      {
        type: "text" as const,
        text
      }
    ]
  };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
