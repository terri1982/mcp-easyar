#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { access, cp, mkdir, open, readFile, readdir, stat, writeFile } from "node:fs/promises";
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

type ReadinessCheck = {
  id: string;
  ok: boolean;
  severity: "blocker" | "warning" | "info";
  detail: string;
};

type DeploymentReadinessReport = {
  generatedAt: string;
  server: {
    name: string;
    version: string;
    packageName: string | null;
    repository: string | null;
    binName: string | null;
    binPath: string | null;
    packageFiles: string[];
  };
  ready: boolean;
  blockers: ReadinessCheck[];
  warnings: ReadinessCheck[];
  groups: Record<string, ReadinessCheck[]>;
  focusedScope: {
    focusedSamples: string[];
    deferredSamples: string[];
  };
  project: {
    path: string | null;
    hasAssets: boolean | null;
    hasPackagesManifest: boolean | null;
    hasProjectSettings: boolean | null;
    unityVersion: string | null;
  };
  auth: ReturnType<typeof readAuthConfig>;
  unity: {
    requestedPath: string | null;
    pathCommand: string;
    pathConfigured: boolean;
    executableExists: boolean | null;
  };
  nextActions: string[];
  security: string[];
};

const monoBehaviourKinds = ["image-tracking", "surface-placement", "cloud-recognition", "lifecycle"] as const;
const buildPlatforms = ["android", "ios", "standalone", "none"] as const;
const deviceBuildPlatforms = ["android", "ios", "standalone"] as const;
const mobilePlatforms = ["android", "ios"] as const;
const runResultStatuses = ["passed", "failed", "blocked", "not-run"] as const;
const clientKinds = ["claude-desktop", "codex", "generic-json"] as const;
const clientEntrypointModes = ["local-dist", "package-bin", "npx"] as const;
const accountStageValues = ["unknown", "not-registered", "registered-not-logged-in", "logged-in", "has-license", "has-cloud-credentials"] as const;
type AccountStage = typeof accountStageValues[number];
const serverName = "mcp-easyar";
const serverVersion = "0.1.0";
const easyarApi = createEasyARApiClient();

const toolCatalog = [
  "easyar_server_status",
  "easyar_list_samples",
  "easyar_official_info",
  "easyar_generate_official_api_contract",
  "easyar_write_official_api_contract",
  "easyar_official_api_handoff",
  "easyar_write_official_api_handoff",
  "easyar_auth_status",
  "easyar_account_onboarding",
  "easyar_write_account_onboarding",
  "easyar_account_materials",
  "easyar_write_account_materials",
  "easyar_check_account",
  "easyar_validate_license",
  "easyar_discover_downloads",
  "easyar_discover_cloud_credentials",
  "easyar_check_official_access",
  "easyar_write_official_access_report",
  "easyar_generate_client_config",
  "easyar_check_client_setup",
  "easyar_write_client_setup",
  "easyar_deployment_readiness",
  "easyar_write_deployment_readiness",
  "easyar_production_validation",
  "easyar_write_production_validation",
  "easyar_release_manifest",
  "easyar_write_release_manifest",
  "easyar_first_run_guide",
  "easyar_write_first_run_guide",
  "easyar_onboarding_report",
  "easyar_write_onboarding_report",
  "easyar_generate_project_handoff",
  "easyar_write_project_handoff",
  "easyar_remaining_work_report",
  "easyar_write_remaining_work_report",
  "easyar_generate_sample_plan",
  "easyar_generate_focused_preflight",
  "easyar_write_focused_preflight",
  "easyar_next_workflow_step",
  "easyar_write_workflow_state",
  "easyar_generate_import_checklist",
  "easyar_write_import_checklist",
  "easyar_generate_sample_import_guide",
  "easyar_write_sample_import_guide",
  "easyar_import_sample_from_package_cache",
  "easyar_generate_run_sequence",
  "easyar_write_run_sequence",
  "easyar_generate_artifact_index",
  "easyar_write_artifact_index",
  "easyar_generate_focused_handoff_pack",
  "easyar_write_focused_handoff_pack",
  "easyar_generate_run_report",
  "easyar_write_run_report",
  "easyar_audit_sample_scene",
  "easyar_write_scene_audit",
  "easyar_generate_support_bundle",
  "easyar_write_support_bundle",
  "easyar_generate_device_validation_checklist",
  "easyar_write_device_validation_checklist",
  "easyar_generate_device_run_result_form",
  "easyar_write_device_run_result_form",
  "easyar_generate_run_result",
  "easyar_write_run_result",
  "easyar_generate_completion_report",
  "easyar_write_completion_report",
  "easyar_generate_focused_scope_status",
  "easyar_write_focused_scope_status",
  "easyar_generate_issue_report",
  "easyar_write_issue_report",
  "easyar_inspect_unity_project",
  "easyar_check_sample_readiness",
  "easyar_validate_local_config",
  "easyar_generate_local_config_form",
  "easyar_write_local_config_form",
  "easyar_write_local_config_from_env",
  "easyar_local_config_handoff",
  "easyar_write_local_config_handoff",
  "easyar_analyze_unity_log",
  "easyar_analyze_latest_unity_log",
  "easyar_prepare_unity_project",
  "easyar_create_sample_validation_helper",
  "easyar_create_local_config_bridge",
  "easyar_create_mobile_settings_helper",
  "easyar_create_build_settings_helper",
  "easyar_create_device_build_helper",
  "easyar_create_sample_runner",
  "easyar_generate_code_plan",
  "easyar_write_code_plan",
  "easyar_create_mono_behaviour",
  "easyar_write_csharp_file",
  "easyar_generate_config_integration_audit",
  "easyar_write_config_integration_audit",
  "easyar_generate_programming_context",
  "easyar_write_programming_context",
  "easyar_generate_code_change_summary",
  "easyar_write_code_change_summary",
  "easyar_review_csharp_scripts",
  "easyar_unity_environment",
  "easyar_write_unity_environment_report",
  "easyar_run_unity_compile_check",
  "easyar_run_unity_method"
] as const;

const resourceCatalog = [
  "easyar://samples/catalog",
  "easyar://official/info",
  "easyar://official/api-contract",
  "easyar://unity/checklist",
  "easyar://workflow/quickstart",
  "easyar://workflow/focused-scope"
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
    unityScenes: ["CloudRecognition", "CloudRecognizer", "ImageTracking_CloudRecognition"],
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
  "7. Run `easyar_prepare_unity_project`, `easyar_write_unity_environment_report`, and `easyar_write_focused_preflight` before any Unity batch command.",
  "8. Read `PREFLIGHT.md` first and follow its `nextCall`; do not skip account, local config, import, Unity path, scene, or script blockers.",
  "9. Import the official EasyAR Unity Plugin and matching sample scenes from EasyAR downloads or Unity Package Manager Samples.",
  "10. Use `easyar_write_local_config_from_env` or fill `ProjectSettings/EasyAR/easyar.local.json` locally without committing secrets.",
  "11. Run `easyar_write_run_sequence`, `easyar_write_artifact_index`, `easyar_write_run_report`, `easyar_write_scene_audit`, and `easyar_write_support_bundle` for handoff evidence.",
  "12. Run `easyar_create_mobile_settings_helper` and `easyar_run_unity_method` to apply Android/iOS player settings.",
  "13. Run `easyar_create_build_settings_helper` and `easyar_run_unity_method` to add the sample scene to Build Settings.",
  "14. For project code, write `PROGRAMMING_CONTEXT.md` before `CODE_PLAN.md`, then use `easyar_create_mono_behaviour`, `easyar_write_csharp_file`, `easyar_review_csharp_scripts`, and `easyar_write_code_change_summary`.",
  "15. Run `easyar_run_unity_compile_check`, build to a real Android or iOS device, and use `easyar_write_run_result` after compile, build, or device attempts.",
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
  "easyar-official-api-contract",
  "easyar://official/api-contract",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "text/markdown",
        text: buildOfficialApiContractMarkdown(buildOfficialApiContract(undefined, true))
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

server.resource(
  "easyar-focused-scope-workflow",
  "easyar://workflow/focused-scope",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "text/markdown",
        text: [
          "# EasyAR Focused Scope Workflow",
          "",
          "Current focused sample scope:",
          "",
          "- image-tracking",
          "- cloud-recognition",
          "",
          "Deferred samples stay out of the run-through scope until the user explicitly asks to continue.",
          "",
          "Recommended close-out sequence:",
          "",
          "1. Run `easyar_write_completion_report` for `image-tracking`.",
          "2. Run `easyar_write_completion_report` for `cloud-recognition`.",
          "3. Run `easyar_write_focused_scope_status`.",
          "4. Read `Assets/EasyARGenerated/FOCUSED_SCOPE_STATUS.md` first when another AI tool takes over.",
          "5. Treat the focused scope as complete only when `allFocusedSamplesComplete=true`."
        ].join("\n")
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
      `1. easyar_write_account_onboarding projectPath=${projectPath} sampleId=image-tracking`,
      `2. easyar_write_account_materials projectPath=${projectPath} sampleId=image-tracking`,
      `3. easyar_write_unity_environment_report projectPath=${projectPath} sampleId=image-tracking`,
      `4. easyar_prepare_unity_project projectPath=${projectPath} sampleId=image-tracking`,
      `5. easyar_write_focused_preflight projectPath=${projectPath} sampleId=image-tracking platform=${platform}`,
      "",
      "Read PREFLIGHT.md and follow its nextCall before running Unity batch commands. Do not skip readiness failures. Image Tracking must have real target image/database assets before device validation.",
      `After preflight blockers are clear, call easyar_write_run_sequence projectPath=${projectPath} sampleId=image-tracking platform=${platform}.`,
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
      `1. easyar_write_account_onboarding projectPath=${projectPath} sampleId=cloud-recognition`,
      `2. easyar_write_account_materials projectPath=${projectPath} sampleId=cloud-recognition`,
      `3. easyar_write_unity_environment_report projectPath=${projectPath} sampleId=cloud-recognition`,
      `4. easyar_prepare_unity_project projectPath=${projectPath} sampleId=cloud-recognition`,
      `5. easyar_write_focused_preflight projectPath=${projectPath} sampleId=cloud-recognition platform=${platform}`,
      "",
      "Read PREFLIGHT.md and follow its nextCall before running Unity batch commands. Do not continue to device validation until easyar.cloudRecognition.appId and apiKey are configured locally.",
      `After preflight blockers are clear, call easyar_write_run_sequence projectPath=${projectPath} sampleId=cloud-recognition platform=${platform}.`,
      "If Unity batch or device validation fails, call easyar_analyze_latest_unity_log with sampleId=cloud-recognition."
    ].join("\n")
  )
);

server.prompt(
  "easyar-validate-official-endpoints",
  "Guide Codex or Claude through official EasyAR endpoint and registered-user access validation.",
  {
    projectPath: z.string().describe("Unity project path."),
    platform: z.enum(["android", "ios"]).default("android")
  },
  ({ projectPath, platform }) => promptText(
    "Official EasyAR endpoint validation",
    [
      `Validate official EasyAR account endpoints for project: ${projectPath}`,
      `Target platform: ${platform}`,
      "",
      "Start by reading `easyar://official/api-contract`.",
      "",
      "Then call:",
      "1. easyar_auth_status",
      "2. easyar_generate_official_api_contract",
      `3. easyar_check_official_access projectPath=${projectPath} sampleId=image-tracking platform=${platform}`,
      `4. easyar_check_official_access projectPath=${projectPath} sampleId=cloud-recognition platform=${platform}`,
      "5. easyar_write_deployment_readiness",
      "",
      "Do not ask the user to paste EASYAR_API_TOKEN, licenseKey, appKey, or appSecret in chat. Report only endpoint readiness, status codes, redacted metadata, and next actions."
    ].join("\n")
  )
);

server.prompt(
  "easyar-close-focused-scope",
  "Guide Codex or Claude through closing out Image Tracking and Cloud Recognition focused sample status.",
  {
    projectPath: z.string().describe("Unity project path."),
    platform: z.enum(["android", "ios"]).default("android")
  },
  ({ projectPath, platform }) => promptText(
    "Focused EasyAR scope close-out",
    [
      `Close out the current focused EasyAR sample scope for project: ${projectPath}`,
      `Target platform: ${platform}`,
      "",
      "Read `easyar://workflow/focused-scope` first.",
      "",
      "Then call:",
      `1. easyar_write_completion_report projectPath=${projectPath} sampleId=image-tracking platform=${platform}`,
      `2. easyar_write_completion_report projectPath=${projectPath} sampleId=cloud-recognition platform=${platform}`,
      `3. easyar_write_focused_scope_status projectPath=${projectPath} platform=${platform}`,
      "",
      "Read FOCUSED_SCOPE_STATUS.md. If allFocusedSamplesComplete is false, follow the per-sample next actions. Do not start deferred samples unless the user asks to continue."
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
      "Start by calling easyar_write_focused_preflight, then easyar_write_programming_context to understand current readiness and script context.",
      "Read PROGRAMMING_CONTEXT.md before CODE_PLAN.md when taking over script work.",
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
      onboarding: {
        preflightFirst: true,
        firstQuestion: "Do you already have an EasyAR account?",
        supportedAccountStages: [
          "not-registered",
          "registered-not-logged-in",
          "logged-in",
          "has-license",
          "has-cloud-credentials"
        ],
        newUserRoute: [
          "Call easyar_account_onboarding accountStage=not-registered sampleId=cloud-recognition or sampleId=image-tracking.",
          "Open the official EasyAR website/development center in a browser for registration and login.",
          "Return to MCP after login; do not paste website passwords, verification codes, appKey, appSecret, API token, or license key into chat.",
          "Run easyar_prepare_unity_project to create ProjectSettings/EasyAR/easyar.local.json.example.",
          "Fill ProjectSettings/EasyAR/easyar.local.json locally, then run easyar_validate_local_config.",
          "Run easyar_write_focused_preflight and read PREFLIGHT.md before Unity automation."
        ],
        localSecretTarget: "ProjectSettings/EasyAR/easyar.local.json"
      },
      recommendedFirstCalls: [
        "easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android",
        "easyar_write_first_run_guide projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition platform=android",
        "easyar_account_onboarding accountStage=not-registered sampleId=cloud-recognition",
        "easyar_write_account_onboarding projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition",
        "easyar_write_account_materials projectPath=/path/to/UnityProject sampleId=cloud-recognition",
        "easyar_write_unity_environment_report projectPath=/path/to/UnityProject sampleId=cloud-recognition",
        "easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=cloud-recognition",
        "easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android",
        "Read Assets/EasyARGenerated/cloud-recognition/PREFLIGHT.md and follow its nextCall"
      ],
      focusedSampleFirstCalls: {
        imageTracking: [
          "easyar_write_account_onboarding projectPath=/path/to/UnityProject accountStage=not-registered sampleId=image-tracking",
          "easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=image-tracking",
          "easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=image-tracking platform=android",
          "Read Assets/EasyARGenerated/image-tracking/PREFLIGHT.md"
        ],
        cloudRecognition: [
          "easyar_write_account_onboarding projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition",
          "easyar_write_account_materials projectPath=/path/to/UnityProject sampleId=cloud-recognition",
          "easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=cloud-recognition",
          "Fill easyar.cloudRecognition.appId and apiKey locally in ProjectSettings/EasyAR/easyar.local.json",
          "easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android",
          "Read Assets/EasyARGenerated/cloud-recognition/PREFLIGHT.md"
        ]
      },
      programmingFirstCalls: [
        "easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=image-tracking platform=android",
        "easyar_write_programming_context projectPath=/path/to/UnityProject sampleId=image-tracking",
        "Read Assets/EasyARGenerated/image-tracking/PROGRAMMING_CONTEXT.md before CODE_PLAN.md"
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
      downloadsEndpointConfigured: auth.downloadsEndpointConfigured,
      cloudCredentialsEndpointConfigured: auth.cloudCredentialsEndpointConfigured,
      readyForAccountScopedContent: auth.hasToken && auth.accountStatusEndpointConfigured && auth.licenseValidationEndpointConfigured && auth.downloadsEndpointConfigured && auth.cloudCredentialsEndpointConfigured,
      requiredEnvironment: [
        "EASYAR_API_BASE_URL",
        "EASYAR_API_TOKEN",
        "EASYAR_ACCOUNT_STATUS_ENDPOINT",
        "EASYAR_LICENSE_VALIDATE_ENDPOINT",
        "EASYAR_DOWNLOADS_ENDPOINT",
        "EASYAR_CLOUD_CREDENTIALS_ENDPOINT"
      ],
      security: "Secret values are never returned by this tool."
    });
  }
);

server.tool(
  "easyar_account_onboarding",
  "Guide new or existing EasyAR users through official registration, login, license, Cloud Recognition credentials, and local MCP setup without collecting passwords or secrets.",
  {
    projectPath: z.string().optional().describe("Optional Unity project path used to inspect local EasyAR config and Unity bundle identifier."),
    sampleId: z.string().optional().describe("Focused sample id. Defaults to cloud-recognition because it needs account cloud credentials."),
    platform: z.enum(["android", "ios", "standalone", "unknown"]).default("android"),
    accountStage: z.enum(accountStageValues).default("unknown").describe("What the user currently knows about their EasyAR account state.")
  },
  async ({ projectPath, sampleId, platform, accountStage }) => {
    const root = projectPath ? resolveProjectPath(projectPath) : null;
    if (root) {
      await ensureDirectory(root);
    }
    const sample = sampleId ? findSample(sampleId) : findSample("cloud-recognition");
    return jsonText(await buildAccountOnboardingReport(root, sample, platform, accountStage));
  }
);

server.tool(
  "easyar_write_account_onboarding",
  "Write the EasyAR account registration/login and local secret setup guide as a Markdown artifact.",
  {
    projectPath: z.string().optional().describe("Optional Unity project path. If provided, writes to Assets/EasyARGenerated/ACCOUNT_ONBOARDING.md by default."),
    outputRoot: z.string().optional().describe("Output directory when projectPath is not provided."),
    sampleId: z.string().optional().describe("Focused sample id. Defaults to cloud-recognition because it needs account cloud credentials."),
    platform: z.enum(["android", "ios", "standalone", "unknown"]).default("android"),
    accountStage: z.enum(accountStageValues).default("unknown"),
    relativePath: z.string().optional().describe("Optional output path. Defaults to Assets/EasyARGenerated/ACCOUNT_ONBOARDING.md for Unity projects or EasyARGenerated/ACCOUNT_ONBOARDING.md for outputRoot."),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing account onboarding artifact.")
  },
  async ({ projectPath, outputRoot, sampleId, platform, accountStage, relativePath, overwrite }) => {
    const root = projectPath ? resolveProjectPath(projectPath) : resolveProjectPath(outputRoot ?? process.cwd());
    await ensureDirectory(root);
    const sample = sampleId ? findSample(sampleId) : findSample("cloud-recognition");
    const report = await buildAccountOnboardingReport(projectPath ? root : null, sample, platform, accountStage);
    const defaultRelativePath = projectPath
      ? path.join("Assets", "EasyARGenerated", "ACCOUNT_ONBOARDING.md")
      : path.join("EasyARGenerated", "ACCOUNT_ONBOARDING.md");
    const target = path.resolve(root, relativePath ?? defaultRelativePath);
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildAccountOnboardingMarkdown(report), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      stage: report.stage,
      sample: sample.name,
      nextActions: report.nextActions,
      note: "The account onboarding artifact contains links, checklist items, and local file paths only. It does not include account passwords, tokens, license keys, appKey, or appSecret values."
    });
  }
);

server.tool(
  "easyar_account_materials",
  "Generate a field-by-field checklist of EasyAR account materials, where each value comes from, where it must be stored, and whether it is safe to share.",
  {
    projectPath: z.string().optional().describe("Optional Unity project path used to resolve local config paths and current field presence."),
    sampleId: z.string().optional().describe("Focused sample id. Defaults to cloud-recognition because it needs the full account material set."),
    platform: z.enum(["android", "ios", "standalone", "unknown"]).default("android")
  },
  async ({ projectPath, sampleId, platform }) => {
    const root = projectPath ? resolveProjectPath(projectPath) : null;
    if (root) {
      await ensureDirectory(root);
    }
    const sample = sampleId ? findSample(sampleId) : findSample("cloud-recognition");
    return jsonText(await buildAccountMaterialsReport(root, sample, platform));
  }
);

server.tool(
  "easyar_write_account_materials",
  "Write the EasyAR account material checklist as a Markdown artifact.",
  {
    projectPath: z.string().optional().describe("Optional Unity project path. If provided, writes to Assets/EasyARGenerated/ACCOUNT_MATERIALS.md by default."),
    outputRoot: z.string().optional().describe("Output directory when projectPath is not provided."),
    sampleId: z.string().optional().describe("Focused sample id. Defaults to cloud-recognition because it needs the full account material set."),
    platform: z.enum(["android", "ios", "standalone", "unknown"]).default("android"),
    relativePath: z.string().optional().describe("Optional output path. Defaults to Assets/EasyARGenerated/ACCOUNT_MATERIALS.md for Unity projects or EasyARGenerated/ACCOUNT_MATERIALS.md for outputRoot."),
    overwrite: z.boolean().default(true)
  },
  async ({ projectPath, outputRoot, sampleId, platform, relativePath, overwrite }) => {
    const root = projectPath ? resolveProjectPath(projectPath) : resolveProjectPath(outputRoot ?? process.cwd());
    await ensureDirectory(root);
    const sample = sampleId ? findSample(sampleId) : findSample("cloud-recognition");
    const report = await buildAccountMaterialsReport(projectPath ? root : null, sample, platform);
    const defaultRelativePath = projectPath
      ? path.join("Assets", "EasyARGenerated", "ACCOUNT_MATERIALS.md")
      : path.join("EasyARGenerated", "ACCOUNT_MATERIALS.md");
    const target = path.resolve(root, relativePath ?? defaultRelativePath);
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildAccountMaterialsMarkdown(report), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      sample: sample.name,
      requiredCount: report.materials.filter((item) => item.required).length,
      missingRequiredCount: report.materials.filter((item) => item.required && !item.present).length,
      nextActions: report.nextActions,
      note: "The account materials artifact lists field names and storage locations only. It does not include secret values."
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
  "easyar_discover_downloads",
  "Call a configured official EasyAR downloads endpoint to discover account-scoped SDK/sample packages without exposing tokens.",
  {
    projectPath: z.string().optional().describe("Optional Unity project path used to read Unity version."),
    sampleId: z.string().optional().describe("Optional focused sample id, for example image-tracking or cloud-recognition."),
    packageKind: z.enum(["unity-plugin", "unity-samples", "native-sdk", "xr-extension", "unknown"]).default("unity-samples")
  },
  async ({ projectPath, sampleId, packageKind }) => {
    const root = projectPath ? resolveProjectPath(projectPath) : null;
    if (root) {
      await ensureDirectory(root);
    }
    const sample = sampleId ? findSample(sampleId) : null;
    const unityVersion = root ? await readUnityVersion(root) : null;
    const result = await easyarApi.discoverDownloads({
      sampleId: sample?.id ?? sampleId,
      packageKind,
      unityVersion
    });

    return jsonText({
      ...result,
      input: {
        projectPath: root,
        sampleId: sample?.id ?? sampleId ?? null,
        packageKind,
        unityVersion
      },
      security: "EASYAR_API_TOKEN is never returned. This tool only calls configured official EasyAR endpoints and does not bypass download authorization."
    });
  }
);

server.tool(
  "easyar_discover_cloud_credentials",
  "Call a configured official EasyAR Cloud Recognition endpoint to discover account-scoped credential metadata without exposing secrets.",
  {
    projectPath: z.string().optional().describe("Optional Unity project path used to read bundle identifier from local config."),
    sampleId: z.string().optional().describe("Optional sample id. Defaults to cloud-recognition."),
    platform: z.enum(["android", "ios", "standalone", "unknown"]).default("unknown")
  },
  async ({ projectPath, sampleId, platform }) => {
    const root = projectPath ? resolveProjectPath(projectPath) : null;
    if (root) {
      await ensureDirectory(root);
    }
    const localConfig = root ? await readLocalConfigForRemoteValidation(root) : {};
    const sample = sampleId ? findSample(sampleId) : findSample("cloud-recognition");
    const result = await easyarApi.discoverCloudCredentials({
      sampleId: sample.id,
      bundleIdentifier: localConfig.bundleIdentifier,
      platform
    });

    return jsonText({
      ...result,
      input: {
        projectPath: root,
        sampleId: sample.id,
        bundleIdentifier: localConfig.bundleIdentifier ?? null,
        platform
      },
      security: "EASYAR_API_TOKEN, appKey, appSecret, and credential values are never returned. This tool only calls configured official EasyAR endpoints."
    });
  }
);

server.tool(
  "easyar_generate_official_api_contract",
  "Generate the official EasyAR account API contract required for production mcp-easyar deployment.",
  {
    baseUrl: z.string().optional().describe("Optional official API base URL. Defaults to EASYAR_API_BASE_URL or https://www.easyar.cn."),
    includeExamples: z.boolean().default(true).describe("Whether to include non-secret request/response examples.")
  },
  async ({ baseUrl, includeExamples }) => {
    return jsonText(buildOfficialApiContract(baseUrl, includeExamples));
  }
);

server.tool(
  "easyar_write_official_api_contract",
  "Write the official EasyAR account API contract as Markdown for backend, operations, and MCP client handoff.",
  {
    workspacePath: z.string().optional().describe("Workspace or repository path. Defaults to the current working directory."),
    relativePath: z.string().default(path.join("docs", "OFFICIAL_API_CONTRACT.md")).describe("Contract path inside the workspace."),
    baseUrl: z.string().optional().describe("Optional official API base URL. Defaults to EASYAR_API_BASE_URL or https://www.easyar.cn."),
    includeExamples: z.boolean().default(true).describe("Whether to include non-secret request/response examples."),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing contract file.")
  },
  async ({ workspacePath, relativePath, baseUrl, includeExamples, overwrite }) => {
    const root = resolveProjectPath(workspacePath ?? process.cwd());
    await ensureDirectory(root);
    const contract = buildOfficialApiContract(baseUrl, includeExamples);
    const target = path.resolve(root, relativePath);
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildOfficialApiContractMarkdown(contract), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      endpointCount: contract.endpoints.length,
      requiredEnv: contract.environment.required,
      configuredEnv: contract.environment.configured,
      readyForProductionOfficialAccess: contract.readyForProductionOfficialAccess,
      note: "The official API contract contains endpoint schemas and security requirements only; it does not contain tokens, license keys, appKey, or appSecret values."
    });
  }
);

server.tool(
  "easyar_official_api_handoff",
  "Generate a backend and operations handoff for connecting mcp-easyar to authorized EasyAR account, license, downloads, and Cloud Recognition APIs.",
  {
    baseUrl: z.string().optional().describe("Official API base URL. Defaults to EASYAR_API_BASE_URL or https://www.easyar.cn."),
    includeCurl: z.boolean().default(true).describe("Whether to include non-secret curl canary command templates."),
    deploymentTarget: z.string().optional().describe("Optional deployment environment name, for example staging, production, or internal.")
  },
  async ({ baseUrl, includeCurl, deploymentTarget }) => {
    return jsonText(buildOfficialApiHandoff(baseUrl, includeCurl, deploymentTarget));
  }
);

server.tool(
  "easyar_write_official_api_handoff",
  "Write OFFICIAL_API_HANDOFF.md for backend and operations teams wiring real EasyAR official APIs into mcp-easyar.",
  {
    workspacePath: z.string().optional().describe("Workspace or repository path. Defaults to the current working directory."),
    relativePath: z.string().default(path.join("docs", "OFFICIAL_API_HANDOFF.md")).describe("Handoff path inside the workspace."),
    baseUrl: z.string().optional().describe("Official API base URL. Defaults to EASYAR_API_BASE_URL or https://www.easyar.cn."),
    includeCurl: z.boolean().default(true).describe("Whether to include non-secret curl canary command templates."),
    deploymentTarget: z.string().optional().describe("Optional deployment environment name, for example staging, production, or internal."),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing handoff file.")
  },
  async ({ workspacePath, relativePath, baseUrl, includeCurl, deploymentTarget, overwrite }) => {
    const root = resolveProjectPath(workspacePath ?? process.cwd());
    await ensureDirectory(root);
    const handoff = buildOfficialApiHandoff(baseUrl, includeCurl, deploymentTarget);
    const target = path.resolve(root, relativePath);
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildOfficialApiHandoffMarkdown(handoff), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      deploymentTarget: handoff.deploymentTarget,
      endpointCount: handoff.endpointMapping.length,
      envRequired: handoff.environment.required,
      acceptanceGateCount: handoff.acceptanceGates.length,
      nextActions: handoff.nextActions,
      security: handoff.security
    });
  }
);

server.tool(
  "easyar_check_official_access",
  "Run a focused official EasyAR account, license, downloads, and Cloud Recognition access check without exposing secrets.",
  {
    projectPath: z.string().describe("Unity project path used for Unity version, bundle identifier, and local license metadata."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    platform: z.enum(["android", "ios", "standalone", "unknown"]).default("android"),
    packageKind: z.enum(["unity-plugin", "unity-samples", "native-sdk", "xr-extension", "unknown"]).default("unity-samples")
  },
  async ({ projectPath, sampleId, platform, packageKind }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    return jsonText(await buildOfficialAccessReport(root, sample, platform, packageKind));
  }
);

server.tool(
  "easyar_write_official_access_report",
  "Write the focused official EasyAR access check as a Markdown artifact inside the Unity project.",
  {
    projectPath: z.string().describe("Unity project path used for Unity version, bundle identifier, and local license metadata."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    platform: z.enum(["android", "ios", "standalone", "unknown"]).default("android"),
    packageKind: z.enum(["unity-plugin", "unity-samples", "native-sdk", "xr-extension", "unknown"]).default("unity-samples"),
    relativePath: z.string().optional().describe("Optional report path inside the project. Defaults to Assets/EasyARGenerated/<sampleId>/OFFICIAL_ACCESS.md."),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing official access report.")
  },
  async ({ projectPath, sampleId, platform, packageKind, relativePath, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const report = await buildOfficialAccessReport(root, sample, platform, packageKind);
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(focusedSampleGeneratedDir(root, sample), "OFFICIAL_ACCESS.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildOfficialAccessMarkdown(report), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      sample: sample.name,
      readyForOfficialContent: report.readyForOfficialContent,
      blockerCount: report.blockers.length,
      nextActions: report.nextActions,
      note: "The official access report includes endpoint status and redacted metadata only."
    });
  }
);

server.tool(
  "easyar_generate_client_config",
  "Generate MCP client configuration snippets for connecting Codex, Claude Desktop, or another stdio MCP client.",
  {
    client: z.enum(clientKinds).describe("Target MCP client config style."),
    entrypointMode: z.enum(clientEntrypointModes).default("local-dist").describe("How the MCP client should launch the server: local dist path, installed package bin, or npx package command."),
    serverPath: z.string().optional().describe("Absolute path to dist/index.js. Used only when entrypointMode=local-dist. Defaults to this process entrypoint."),
    includeTokenPlaceholder: z.boolean().default(true).describe("Whether to include EASYAR_API_TOKEN placeholder text.")
  },
  async ({ client, entrypointMode, serverPath, includeTokenPlaceholder }) => {
    const env = {
      EASYAR_API_BASE_URL: process.env.EASYAR_API_BASE_URL ?? "https://www.easyar.cn",
      EASYAR_ACCOUNT_STATUS_ENDPOINT: process.env.EASYAR_ACCOUNT_STATUS_ENDPOINT ?? "https://www.easyar.cn/path/to/official/account/status",
      EASYAR_LICENSE_VALIDATE_ENDPOINT: process.env.EASYAR_LICENSE_VALIDATE_ENDPOINT ?? "https://www.easyar.cn/path/to/official/license/validate",
      EASYAR_DOWNLOADS_ENDPOINT: process.env.EASYAR_DOWNLOADS_ENDPOINT ?? "https://www.easyar.cn/path/to/official/downloads",
      EASYAR_CLOUD_CREDENTIALS_ENDPOINT: process.env.EASYAR_CLOUD_CREDENTIALS_ENDPOINT ?? "https://www.easyar.cn/path/to/official/cloud-recognition/credentials",
      ...(includeTokenPlaceholder ? { EASYAR_API_TOKEN: "your_registered_user_token" } : {})
    };
    const launch = buildClientLaunch(entrypointMode, serverPath);
    const config = buildClientConfig(client, launch, env);

    return jsonText({
      client,
      entrypointMode,
      command: launch.command,
      args: launch.args,
      env,
      config,
      note: "Replace token placeholders with locally stored official EasyAR account credentials. Do not commit secrets."
    });
  }
);

server.tool(
  "easyar_check_client_setup",
  "Check whether a Codex, Claude Desktop, or generic stdio MCP client can be configured for mcp-easyar.",
  {
    client: z.enum(clientKinds).default("claude-desktop").describe("Target MCP client config style."),
    entrypointMode: z.enum(clientEntrypointModes).default("local-dist").describe("How the MCP client should launch the server: local dist path, installed package bin, or npx package command."),
    serverPath: z.string().optional().describe("Absolute path to dist/index.js. Used only when entrypointMode=local-dist. Defaults to this process entrypoint or dist/index.js."),
    includeTokenPlaceholder: z.boolean().default(true).describe("Whether the generated config should include EASYAR_API_TOKEN placeholder text.")
  },
  async ({ client, entrypointMode, serverPath, includeTokenPlaceholder }) => jsonText(await buildClientSetupReport(client, entrypointMode, serverPath, includeTokenPlaceholder))
);

server.tool(
  "easyar_write_client_setup",
  "Write a client setup Markdown report for Codex, Claude Desktop, or another stdio MCP client.",
  {
    outputRoot: z.string().describe("Directory that should receive CLIENT_SETUP.md."),
    client: z.enum(clientKinds).default("claude-desktop").describe("Target MCP client config style."),
    entrypointMode: z.enum(clientEntrypointModes).default("local-dist").describe("How the MCP client should launch the server: local dist path, installed package bin, or npx package command."),
    serverPath: z.string().optional().describe("Absolute path to dist/index.js. Used only when entrypointMode=local-dist. Defaults to this process entrypoint or dist/index.js."),
    includeTokenPlaceholder: z.boolean().default(true).describe("Whether the generated config should include EASYAR_API_TOKEN placeholder text."),
    relativePath: z.string().optional().describe("Optional report path inside outputRoot. Defaults to EasyARGenerated/CLIENT_SETUP.md."),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing client setup report.")
  },
  async ({ outputRoot, client, entrypointMode, serverPath, includeTokenPlaceholder, relativePath, overwrite }) => {
    const root = resolveProjectPath(outputRoot);
    await ensureDirectory(root);
    const report = await buildClientSetupReport(client, entrypointMode, serverPath, includeTokenPlaceholder);
    const defaultRelativePath = await exists(path.join(root, "Assets"))
      ? path.join("Assets", "EasyARGenerated", "CLIENT_SETUP.md")
      : path.join("EasyARGenerated", "CLIENT_SETUP.md");
    const target = path.resolve(root, relativePath ?? defaultRelativePath);
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildClientSetupMarkdown(report), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      client,
      readyForClientConnection: report.readyForClientConnection,
      blockerCount: report.blockers.length,
      nextActions: report.nextActions,
      note: "The client setup report contains config shape and redacted/placeholder environment metadata only."
    });
  }
);

server.tool(
  "easyar_deployment_readiness",
  "Generate a deployment readiness report for publishing and operating mcp-easyar without exposing secrets.",
  {
    projectPath: z.string().optional().describe("Optional Unity project path to include Unity-side readiness signals."),
    unityPath: z.string().optional().describe("Optional Unity executable path. Defaults to EASYAR_UNITY_PATH or Unity command lookup.")
  },
  async ({ projectPath, unityPath }) => {
    const root = projectPath ? resolveProjectPath(projectPath) : null;
    if (root) {
      await ensureDirectory(root);
    }

    return jsonText(await buildDeploymentReadiness(root, unityPath));
  }
);

server.tool(
  "easyar_write_deployment_readiness",
  "Write a deployment readiness Markdown report inside the selected project or workspace directory.",
  {
    projectPath: z.string().describe("Directory that should receive the readiness report. Unity projects use Assets/EasyARGenerated by default."),
    unityPath: z.string().optional().describe("Optional Unity executable path. Defaults to EASYAR_UNITY_PATH or Unity command lookup."),
    relativePath: z.string().optional().describe("Optional report path inside projectPath. Defaults to Assets/EasyARGenerated/DEPLOYMENT_READINESS.md when Assets exists, otherwise EasyARGenerated/DEPLOYMENT_READINESS.md."),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing readiness report.")
  },
  async ({ projectPath, unityPath, relativePath, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const report = await buildDeploymentReadiness(root, unityPath);
    const defaultRelativePath = await exists(path.join(root, "Assets"))
      ? path.join("Assets", "EasyARGenerated", "DEPLOYMENT_READINESS.md")
      : path.join("EasyARGenerated", "DEPLOYMENT_READINESS.md");
    const target = path.resolve(root, relativePath ?? defaultRelativePath);
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildDeploymentReadinessMarkdown(report), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      ready: report.ready,
      blockerCount: report.blockers.length,
      warningCount: report.warnings.length,
      nextActions: report.nextActions,
      note: "The deployment readiness report does not include secret values."
    });
  }
);

server.tool(
  "easyar_production_validation",
  "Generate a production validation evidence matrix for official mcp-easyar deployment and focused sample run-through readiness.",
  {
    projectPath: z.string().optional().describe("Optional Unity project path used to inspect focused sample completion evidence."),
    platform: z.enum(["android", "ios"]).default("android").describe("Target mobile platform for focused sample completion evidence."),
    unityPath: z.string().optional().describe("Optional Unity executable path. Defaults to EASYAR_UNITY_PATH or Unity command lookup."),
    verificationEvidence: z.enum(["not-provided", "passed"]).default("not-provided").describe("Whether npm/CI verification commands have been run and passed outside this report."),
    maxScriptIssues: z.number().int().min(1).max(200).default(40),
    maxLogBytes: z.number().int().min(1024).max(1024 * 1024).default(200000),
    maxLogIssues: z.number().int().min(1).max(200).default(30)
  },
  async ({ projectPath, platform, unityPath, verificationEvidence, maxScriptIssues, maxLogBytes, maxLogIssues }) => {
    const root = projectPath ? resolveProjectPath(projectPath) : null;
    if (root) {
      await ensureDirectory(root);
    }
    return jsonText(await buildProductionValidationReport(root, platform, unityPath, verificationEvidence, maxScriptIssues, maxLogBytes, maxLogIssues));
  }
);

server.tool(
  "easyar_write_production_validation",
  "Write a production validation evidence matrix for official mcp-easyar deployment.",
  {
    projectPath: z.string().describe("Directory that should receive the production validation report. Unity projects use Assets/EasyARGenerated by default."),
    platform: z.enum(["android", "ios"]).default("android").describe("Target mobile platform for focused sample completion evidence."),
    unityPath: z.string().optional().describe("Optional Unity executable path. Defaults to EASYAR_UNITY_PATH or Unity command lookup."),
    verificationEvidence: z.enum(["not-provided", "passed"]).default("not-provided").describe("Whether npm/CI verification commands have been run and passed outside this report."),
    relativePath: z.string().optional().describe("Optional report path inside projectPath. Defaults to Assets/EasyARGenerated/PRODUCTION_VALIDATION.md when Assets exists, otherwise EasyARGenerated/PRODUCTION_VALIDATION.md."),
    maxScriptIssues: z.number().int().min(1).max(200).default(40),
    maxLogBytes: z.number().int().min(1024).max(1024 * 1024).default(200000),
    maxLogIssues: z.number().int().min(1).max(200).default(30),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing production validation report.")
  },
  async ({ projectPath, platform, unityPath, verificationEvidence, relativePath, maxScriptIssues, maxLogBytes, maxLogIssues, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const report = await buildProductionValidationReport(root, platform, unityPath, verificationEvidence, maxScriptIssues, maxLogBytes, maxLogIssues);
    const defaultRelativePath = await exists(path.join(root, "Assets"))
      ? path.join("Assets", "EasyARGenerated", "PRODUCTION_VALIDATION.md")
      : path.join("EasyARGenerated", "PRODUCTION_VALIDATION.md");
    const target = path.resolve(root, relativePath ?? defaultRelativePath);
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildProductionValidationMarkdown(report), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      productionReady: report.productionReady,
      gateCount: report.gates.length,
      blockerCount: report.blockers.length,
      nextActions: report.nextActions,
      note: "The production validation report is an evidence matrix only. It does not include EasyAR secrets or raw private logs."
    });
  }
);

server.tool(
  "easyar_release_manifest",
  "Generate a consumer-facing install and release manifest for mcp-easyar.",
  {},
  async () => jsonText(await buildReleaseManifest())
);

server.tool(
  "easyar_write_release_manifest",
  "Write a consumer-facing install and release manifest as Markdown.",
  {
    outputRoot: z.string().describe("Directory that should receive RELEASE_MANIFEST.md."),
    relativePath: z.string().optional().describe("Optional report path inside outputRoot. Defaults to docs/RELEASE_MANIFEST.md."),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing release manifest.")
  },
  async ({ outputRoot, relativePath, overwrite }) => {
    const root = resolveProjectPath(outputRoot);
    await ensureDirectory(root);
    const manifest = await buildReleaseManifest();
    const target = path.resolve(root, relativePath ?? path.join("docs", "RELEASE_MANIFEST.md"));
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildReleaseManifestMarkdown(manifest), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      packageName: manifest.package.name,
      version: manifest.package.version,
      readyForInstallDocs: manifest.readyForInstallDocs,
      missingCount: manifest.missingRequiredFiles.length,
      nextActions: manifest.nextActions
    });
  }
);

server.tool(
  "easyar_first_run_guide",
  "Generate the first-screen guide for a new MCP user, including EasyAR registration/login route, focused sample scope, required artifacts, and the first safe MCP calls.",
  {
    projectPath: z.string().optional().describe("Optional Unity project path. When provided, the guide can point to project-local artifacts."),
    sampleId: z.string().optional().describe("Optional focused sample id. Defaults to cloud-recognition because it exercises the full account/config path."),
    platform: z.enum(["android", "ios"]).default("android"),
    accountStage: z.enum(accountStageValues).default("unknown"),
    client: z.enum(clientKinds).default("claude-desktop")
  },
  async ({ projectPath, sampleId, platform, accountStage, client }) => {
    const root = projectPath ? resolveProjectPath(projectPath) : null;
    if (root) {
      await ensureDirectory(root);
    }
    const sample = sampleId ? findSample(sampleId) : findSample("cloud-recognition");
    return jsonText(await buildFirstRunGuide({
      root,
      sample,
      platform,
      accountStage,
      client
    }));
  }
);

server.tool(
  "easyar_write_first_run_guide",
  "Write FIRST_RUN.md, the first-screen guide for a new EasyAR MCP user or a handoff to another AI tool.",
  {
    projectPath: z.string().optional().describe("Optional Unity project path. If provided, writes to Assets/EasyARGenerated/FIRST_RUN.md by default."),
    outputRoot: z.string().optional().describe("Output directory when projectPath is not provided."),
    sampleId: z.string().optional().describe("Optional focused sample id. Defaults to cloud-recognition because it exercises the full account/config path."),
    platform: z.enum(["android", "ios"]).default("android"),
    accountStage: z.enum(accountStageValues).default("unknown"),
    client: z.enum(clientKinds).default("claude-desktop"),
    relativePath: z.string().optional().describe("Optional output path. Defaults to Assets/EasyARGenerated/FIRST_RUN.md for Unity projects or EasyARGenerated/FIRST_RUN.md for outputRoot."),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing first-run guide.")
  },
  async ({ projectPath, outputRoot, sampleId, platform, accountStage, client, relativePath, overwrite }) => {
    const root = projectPath ? resolveProjectPath(projectPath) : resolveProjectPath(outputRoot ?? process.cwd());
    await ensureDirectory(root);
    const sample = sampleId ? findSample(sampleId) : findSample("cloud-recognition");
    const guide = await buildFirstRunGuide({
      root: projectPath ? root : null,
      sample,
      platform,
      accountStage,
      client
    });
    const defaultRelativePath = projectPath
      ? path.join("Assets", "EasyARGenerated", "FIRST_RUN.md")
      : path.join("EasyARGenerated", "FIRST_RUN.md");
    const target = path.resolve(root, relativePath ?? defaultRelativePath);
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildFirstRunGuideMarkdown(guide), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      accountStage: guide.account.stage,
      sample: guide.sample.id,
      readyForUnityAutomation: guide.readyForUnityAutomation,
      firstQuestion: guide.firstQuestion,
      topNextCall: guide.topNextCall,
      artifactOrder: guide.artifactOrder,
      nextActions: guide.nextActions,
      security: guide.security
    });
  }
);

server.tool(
  "easyar_onboarding_report",
  "Generate a first-run onboarding report that combines client setup, official access, release manifest, and focused workflow state.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    client: z.enum(clientKinds).default("claude-desktop").describe("Target MCP client config style."),
    entrypointMode: z.enum(clientEntrypointModes).default("local-dist").describe("How the MCP client should launch the server: local dist path, installed package bin, or npx package command."),
    platform: z.enum(["android", "ios"]).default("android"),
    serverPath: z.string().optional().describe("Absolute path to dist/index.js. Used only when entrypointMode=local-dist. Defaults to this process entrypoint or dist/index.js."),
    outputPath: z.string().optional().describe("Build output path. Defaults to Builds/<sampleId>.apk for Android or Builds/iOS/<sampleId>."),
    maxScriptIssues: z.number().int().positive().max(100).default(25)
  },
  async ({ projectPath, sampleId, client, entrypointMode, platform, serverPath, outputPath, maxScriptIssues }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const defaultOutput = platform === "android"
      ? `Builds/${sample.id}.apk`
      : `Builds/iOS/${sample.id}`;
    return jsonText(await buildOnboardingReport({
      root,
      sample,
      client,
      entrypointMode,
      platform,
      serverPath,
      outputPath: outputPath ?? defaultOutput,
      maxScriptIssues
    }));
  }
);

server.tool(
  "easyar_write_onboarding_report",
  "Write the first-run onboarding report as a Markdown artifact inside the Unity project.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    client: z.enum(clientKinds).default("claude-desktop").describe("Target MCP client config style."),
    entrypointMode: z.enum(clientEntrypointModes).default("local-dist").describe("How the MCP client should launch the server: local dist path, installed package bin, or npx package command."),
    platform: z.enum(["android", "ios"]).default("android"),
    serverPath: z.string().optional().describe("Absolute path to dist/index.js. Used only when entrypointMode=local-dist. Defaults to this process entrypoint or dist/index.js."),
    outputPath: z.string().optional().describe("Build output path. Defaults to Builds/<sampleId>.apk for Android or Builds/iOS/<sampleId>."),
    relativePath: z.string().optional().describe("Optional onboarding path inside the project. Defaults to Assets/EasyARGenerated/<sampleId>/ONBOARDING.md."),
    maxScriptIssues: z.number().int().positive().max(100).default(25),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing onboarding report.")
  },
  async ({ projectPath, sampleId, client, entrypointMode, platform, serverPath, outputPath, relativePath, maxScriptIssues, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const defaultOutput = platform === "android"
      ? `Builds/${sample.id}.apk`
      : `Builds/iOS/${sample.id}`;
    const report = await buildOnboardingReport({
      root,
      sample,
      client,
      entrypointMode,
      platform,
      serverPath,
      outputPath: outputPath ?? defaultOutput,
      maxScriptIssues
    });
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(focusedSampleGeneratedDir(root, sample), "ONBOARDING.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildOnboardingMarkdown(report), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      sample: sample.name,
      client,
      readyForFirstRun: report.readyForFirstRun,
      blockerCount: report.blockers.length,
      nextCall: report.nextCall,
      nextActions: report.nextActions,
      note: "The onboarding report contains setup status and non-secret next steps only."
    });
  }
);

server.tool(
  "easyar_generate_project_handoff",
  "Generate a project-level handoff dashboard across account setup, local config, Unity environment, focused samples, and next MCP calls.",
  {
    projectPath: z.string().describe("Unity project path."),
    platform: z.enum(["android", "ios"]).default("android"),
    client: z.enum(clientKinds).default("claude-desktop"),
    entrypointMode: z.enum(clientEntrypointModes).default("local-dist"),
    serverPath: z.string().optional().describe("Absolute path to dist/index.js when entrypointMode=local-dist."),
    maxScriptIssues: z.number().int().positive().max(100).default(25),
    maxLogBytes: z.number().int().positive().max(1024 * 1024).default(200000),
    maxLogIssues: z.number().int().positive().max(50).default(20)
  },
  async ({ projectPath, platform, client, entrypointMode, serverPath, maxScriptIssues, maxLogBytes, maxLogIssues }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    return jsonText(await buildProjectHandoff({
      root,
      platform,
      client,
      entrypointMode,
      serverPath,
      maxScriptIssues,
      maxLogBytes,
      maxLogIssues
    }));
  }
);

server.tool(
  "easyar_write_project_handoff",
  "Write PROJECT_HANDOFF.md, a concise continuation dashboard for another AI tool or human operator.",
  {
    projectPath: z.string().describe("Unity project path."),
    platform: z.enum(["android", "ios"]).default("android"),
    client: z.enum(clientKinds).default("claude-desktop"),
    entrypointMode: z.enum(clientEntrypointModes).default("local-dist"),
    serverPath: z.string().optional().describe("Absolute path to dist/index.js when entrypointMode=local-dist."),
    relativePath: z.string().optional().describe("Optional output path inside the project. Defaults to Assets/EasyARGenerated/PROJECT_HANDOFF.md."),
    maxScriptIssues: z.number().int().positive().max(100).default(25),
    maxLogBytes: z.number().int().positive().max(1024 * 1024).default(200000),
    maxLogIssues: z.number().int().positive().max(50).default(20),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing project handoff artifact.")
  },
  async ({ projectPath, platform, client, entrypointMode, serverPath, relativePath, maxScriptIssues, maxLogBytes, maxLogIssues, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const handoff = await buildProjectHandoff({
      root,
      platform,
      client,
      entrypointMode,
      serverPath,
      maxScriptIssues,
      maxLogBytes,
      maxLogIssues
    });
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(root, "Assets", "EasyARGenerated", "PROJECT_HANDOFF.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildProjectHandoffMarkdown(handoff), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      readyForContinuation: handoff.readyForContinuation,
      topNextCall: handoff.topNextCall,
      focusedSamplesComplete: handoff.focusedScope.allFocusedSamplesComplete,
      blockerCount: handoff.blockers.length,
      nextActions: handoff.nextActions,
      security: handoff.security
    });
  }
);

server.tool(
  "easyar_remaining_work_report",
  "Generate an evidence-weighted remaining-work report for making mcp-easyar production-ready and running the focused EasyAR samples on real devices.",
  {
    projectPath: z.string().optional().describe("Optional Unity project path used to inspect local config, Unity environment, and focused sample completion evidence."),
    platform: z.enum(["android", "ios"]).default("android"),
    verificationEvidence: z.enum(["not-provided", "passed"]).default("not-provided").describe("Set to passed only after local verification commands or CI evidence has passed for the current commit."),
    maxScriptIssues: z.number().int().positive().max(100).default(25),
    maxLogBytes: z.number().int().positive().max(1024 * 1024).default(200000),
    maxLogIssues: z.number().int().positive().max(50).default(20)
  },
  async ({ projectPath, platform, verificationEvidence, maxScriptIssues, maxLogBytes, maxLogIssues }) => {
    const root = projectPath ? resolveProjectPath(projectPath) : null;
    if (root) {
      await ensureDirectory(root);
    }
    return jsonText(await buildRemainingWorkReport({
      root,
      platform,
      verificationEvidence,
      maxScriptIssues,
      maxLogBytes,
      maxLogIssues
    }));
  }
);

server.tool(
  "easyar_write_remaining_work_report",
  "Write REMAINING_WORK.md, an evidence-weighted gap report for the remaining mcp-easyar production and focused sample run-through work.",
  {
    projectPath: z.string().optional().describe("Optional Unity project path. If provided, writes to Assets/EasyARGenerated/REMAINING_WORK.md by default."),
    outputRoot: z.string().optional().describe("Output directory when projectPath is not provided."),
    platform: z.enum(["android", "ios"]).default("android"),
    verificationEvidence: z.enum(["not-provided", "passed"]).default("not-provided").describe("Set to passed only after local verification commands or CI evidence has passed for the current commit."),
    relativePath: z.string().optional().describe("Optional output path. Defaults to Assets/EasyARGenerated/REMAINING_WORK.md for Unity projects or EasyARGenerated/REMAINING_WORK.md for outputRoot."),
    maxScriptIssues: z.number().int().positive().max(100).default(25),
    maxLogBytes: z.number().int().positive().max(1024 * 1024).default(200000),
    maxLogIssues: z.number().int().positive().max(50).default(20),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing remaining-work report.")
  },
  async ({ projectPath, outputRoot, platform, verificationEvidence, relativePath, maxScriptIssues, maxLogBytes, maxLogIssues, overwrite }) => {
    const root = projectPath ? resolveProjectPath(projectPath) : resolveProjectPath(outputRoot ?? process.cwd());
    await ensureDirectory(root);
    const report = await buildRemainingWorkReport({
      root: projectPath ? root : null,
      platform,
      verificationEvidence,
      maxScriptIssues,
      maxLogBytes,
      maxLogIssues
    });
    const defaultRelativePath = projectPath
      ? path.join("Assets", "EasyARGenerated", "REMAINING_WORK.md")
      : path.join("EasyARGenerated", "REMAINING_WORK.md");
    const target = path.resolve(root, relativePath ?? defaultRelativePath);
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildRemainingWorkMarkdown(report), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      overallPercent: report.overall.percent,
      remainingPercent: report.overall.remainingPercent,
      productionReady: report.productionReady,
      focusedSamplesComplete: report.focusedScope.allFocusedSamplesComplete,
      topRemainingAreas: report.topRemainingAreas,
      nextActions: report.nextActions,
      security: report.security
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
  "easyar_generate_focused_preflight",
  "Generate a focused Image Tracking or Cloud Recognition preflight gate across account, config, Unity, import, scene, and script readiness.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    platform: z.enum(["android", "ios"]).default("android"),
    outputPath: z.string().optional().describe("Build output path. Defaults to Builds/<sampleId>.apk for Android or Builds/iOS/<sampleId>."),
    maxScriptIssues: z.number().int().positive().max(100).default(25)
  },
  async ({ projectPath, sampleId, platform, outputPath, maxScriptIssues }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const defaultOutput = platform === "android"
      ? `Builds/${sample.id}.apk`
      : `Builds/iOS/${sample.id}`;
    return jsonText(await buildFocusedPreflight(root, sample, platform, outputPath ?? defaultOutput, maxScriptIssues));
  }
);

server.tool(
  "easyar_write_focused_preflight",
  "Write the focused sample preflight gate as a Markdown artifact inside the Unity project.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    platform: z.enum(["android", "ios"]).default("android"),
    outputPath: z.string().optional().describe("Build output path. Defaults to Builds/<sampleId>.apk for Android or Builds/iOS/<sampleId>."),
    relativePath: z.string().optional().describe("Optional preflight path inside the project. Defaults to Assets/EasyARGenerated/<sampleId>/PREFLIGHT.md."),
    maxScriptIssues: z.number().int().positive().max(100).default(25),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing preflight artifact.")
  },
  async ({ projectPath, sampleId, platform, outputPath, relativePath, maxScriptIssues, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const defaultOutput = platform === "android"
      ? `Builds/${sample.id}.apk`
      : `Builds/iOS/${sample.id}`;
    const preflight = await buildFocusedPreflight(root, sample, platform, outputPath ?? defaultOutput, maxScriptIssues);
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(focusedSampleGeneratedDir(root, sample), "PREFLIGHT.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildFocusedPreflightMarkdown(preflight), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      sample: sample.name,
      readyForUnityBatch: preflight.readyForUnityBatch,
      readyForDeviceBuild: preflight.readyForDeviceBuild,
      blockerCount: preflight.blockers.length,
      nextCall: preflight.nextCall,
      nextActions: preflight.nextActions,
      note: "The preflight artifact summarizes readiness only and does not contain secret values."
    });
  }
);

server.tool(
  "easyar_next_workflow_step",
  "Inspect the focused EasyAR workflow state and recommend the next MCP/Unity action.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    platform: z.enum(["android", "ios"]).default("android"),
    outputPath: z.string().optional().describe("Build output path. Defaults to Builds/<sampleId>.apk for Android or Builds/iOS/<sampleId>."),
    maxScriptIssues: z.number().int().positive().max(100).default(25)
  },
  async ({ projectPath, sampleId, platform, outputPath, maxScriptIssues }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const defaultOutput = platform === "android"
      ? `Builds/${sample.id}.apk`
      : `Builds/iOS/${sample.id}`;
    return jsonText(await buildWorkflowState(root, sample, platform, outputPath ?? defaultOutput, maxScriptIssues));
  }
);

server.tool(
  "easyar_write_workflow_state",
  "Write the focused workflow state and recommended next action as a Markdown artifact inside the Unity project.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    platform: z.enum(["android", "ios"]).default("android"),
    outputPath: z.string().optional().describe("Build output path. Defaults to Builds/<sampleId>.apk for Android or Builds/iOS/<sampleId>."),
    relativePath: z.string().optional().describe("Optional workflow state path inside the project. Defaults to Assets/EasyARGenerated/<sampleId>/WORKFLOW_STATE.md."),
    maxScriptIssues: z.number().int().positive().max(100).default(25),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing workflow state artifact.")
  },
  async ({ projectPath, sampleId, platform, outputPath, relativePath, maxScriptIssues, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const defaultOutput = platform === "android"
      ? `Builds/${sample.id}.apk`
      : `Builds/iOS/${sample.id}`;
    const state = await buildWorkflowState(root, sample, platform, outputPath ?? defaultOutput, maxScriptIssues);
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(focusedSampleGeneratedDir(root, sample), "WORKFLOW_STATE.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildWorkflowStateMarkdown(state), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      sample: sample.name,
      phase: state.phase,
      blocked: state.blocked,
      nextCall: state.nextCall,
      note: "The workflow state artifact contains tool names and non-secret arguments only."
    });
  }
);

server.tool(
  "easyar_generate_import_checklist",
  "Generate an official EasyAR Unity Plugin and focused sample import checklist for Image Tracking or Cloud Recognition.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition.")
  },
  async ({ projectPath, sampleId }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    return jsonText(await buildImportChecklist(root, sample));
  }
);

server.tool(
  "easyar_write_import_checklist",
  "Write the official EasyAR import checklist as a Markdown artifact inside the Unity project.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    relativePath: z.string().optional().describe("Optional checklist path inside the project. Defaults to Assets/EasyARGenerated/<sampleId>/IMPORT_CHECKLIST.md."),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing import checklist.")
  },
  async ({ projectPath, sampleId, relativePath, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const checklist = await buildImportChecklist(root, sample);
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(focusedSampleGeneratedDir(root, sample), "IMPORT_CHECKLIST.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildImportChecklistMarkdown(checklist), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      sample: sample.name,
      readyForFocusedPreparation: checklist.readyForFocusedPreparation,
      missingRequiredCount: checklist.items.filter((item) => item.required && !item.ok).length,
      nextActions: checklist.nextActions,
      note: "The import checklist records package/sample import evidence only and does not include secret values."
    });
  }
);

server.tool(
  "easyar_generate_sample_import_guide",
  "Generate a Unity Package Manager oriented guide for importing the focused official EasyAR sample into Assets/Samples.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition.")
  },
  async ({ projectPath, sampleId }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    return jsonText(await buildSampleImportGuide(root, sample));
  }
);

server.tool(
  "easyar_write_sample_import_guide",
  "Write the focused official EasyAR sample import guide as a Markdown artifact inside the Unity project.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    relativePath: z.string().optional().describe("Optional guide path inside the project. Defaults to Assets/EasyARGenerated/<sampleId>/SAMPLE_IMPORT_GUIDE.md."),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing sample import guide.")
  },
  async ({ projectPath, sampleId, relativePath, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const guide = await buildSampleImportGuide(root, sample);
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(focusedSampleGeneratedDir(root, sample), "SAMPLE_IMPORT_GUIDE.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildSampleImportGuideMarkdown(guide), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      sample: sample.name,
      importComplete: guide.importComplete,
      importAvailableFromPackageCache: guide.importAvailableFromPackageCache,
      nextActions: guide.nextActions,
      note: "The sample import guide contains local package/sample paths and manual Unity steps only; it does not include secret values."
    });
  }
);

server.tool(
  "easyar_import_sample_from_package_cache",
  "Copy a focused EasyAR sample that already exists in local Unity PackageCache Samples~ into Assets/Samples without downloading private content.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    overwrite: z.boolean().default(false).describe("Whether to overwrite an existing imported sample directory."),
    dryRun: z.boolean().default(false).describe("Report the copy plan without writing files.")
  },
  async ({ projectPath, sampleId, overwrite, dryRun }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    return jsonText(await importSampleFromPackageCache(root, sample, overwrite, dryRun));
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
  "easyar_generate_artifact_index",
  "Generate an index of focused sample handoff artifacts and recommended reading order.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition.")
  },
  async ({ projectPath, sampleId }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    return jsonText(await buildArtifactIndex(root, sample));
  }
);

server.tool(
  "easyar_write_artifact_index",
  "Write the focused sample handoff artifact index inside the Unity project.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    relativePath: z.string().optional().describe("Optional index path inside the project. Defaults to Assets/EasyARGenerated/<sampleId>/ARTIFACT_INDEX.md."),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing artifact index.")
  },
  async ({ projectPath, sampleId, relativePath, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const index = await buildArtifactIndex(root, sample);
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(focusedSampleGeneratedDir(root, sample), "ARTIFACT_INDEX.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildArtifactIndexMarkdown(index), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      sample: sample.name,
      presentCount: index.artifacts.filter((artifact) => artifact.exists).length,
      missingCount: index.artifacts.filter((artifact) => !artifact.exists).length,
      nextActions: index.nextActions
    });
  }
);

const focusedHandoffSampleIds = ["image-tracking", "cloud-recognition", "all"] as const;

server.tool(
  "easyar_generate_focused_handoff_pack",
  "Generate a plan for writing the focused sample handoff artifact pack without writing files.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.enum(focusedHandoffSampleIds).default("all").describe("Focused sample id or all for Image Tracking and Cloud Recognition."),
    platform: z.enum(["android", "ios"]).default("android"),
    accountStage: z.enum(accountStageValues).default("unknown"),
    client: z.enum(clientKinds).default("claude-desktop"),
    entrypointMode: z.enum(clientEntrypointModes).default("local-dist"),
    serverPath: z.string().optional().describe("Absolute path to dist/index.js when entrypointMode=local-dist."),
    outputPath: z.string().optional().describe("Build output path. Defaults per sample."),
    developmentBuild: z.boolean().default(true),
    programmingGoal: z.string().default("prepare focused EasyAR sample handoff without hardcoded secrets"),
    codeGoal: z.string().default("wire local EasyAR config into the focused sample without hardcoding secrets"),
    maxScriptIssues: z.number().int().positive().max(100).default(25),
    maxCandidates: z.number().int().positive().max(100).default(25),
    maxLogBytes: z.number().int().positive().max(1024 * 1024).default(200000),
    maxLogIssues: z.number().int().positive().max(50).default(20)
  },
  async ({ projectPath, sampleId, platform, accountStage, client, entrypointMode, serverPath, outputPath, developmentBuild, programmingGoal, codeGoal, maxScriptIssues, maxCandidates, maxLogBytes, maxLogIssues }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    return jsonText(await buildFocusedHandoffPackPlan({
      root,
      sampleId,
      platform,
      accountStage,
      client,
      entrypointMode,
      serverPath,
      outputPath,
      developmentBuild,
      programmingGoal,
      codeGoal,
      maxScriptIssues,
      maxCandidates,
      maxLogBytes,
      maxLogIssues
    }));
  }
);

server.tool(
  "easyar_write_focused_handoff_pack",
  "Write the focused sample handoff artifact pack for Image Tracking, Cloud Recognition, or both focused samples.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.enum(focusedHandoffSampleIds).default("all").describe("Focused sample id or all for Image Tracking and Cloud Recognition."),
    platform: z.enum(["android", "ios"]).default("android"),
    accountStage: z.enum(accountStageValues).default("unknown"),
    client: z.enum(clientKinds).default("claude-desktop"),
    entrypointMode: z.enum(clientEntrypointModes).default("local-dist"),
    serverPath: z.string().optional().describe("Absolute path to dist/index.js when entrypointMode=local-dist."),
    outputPath: z.string().optional().describe("Build output path. Defaults per sample."),
    developmentBuild: z.boolean().default(true),
    programmingGoal: z.string().default("prepare focused EasyAR sample handoff without hardcoded secrets"),
    codeGoal: z.string().default("wire local EasyAR config into the focused sample without hardcoding secrets"),
    maxScriptIssues: z.number().int().positive().max(100).default(25),
    maxCandidates: z.number().int().positive().max(100).default(25),
    maxLogBytes: z.number().int().positive().max(1024 * 1024).default(200000),
    maxLogIssues: z.number().int().positive().max(50).default(20),
    overwrite: z.boolean().default(true).describe("Whether to replace existing generated handoff artifacts.")
  },
  async ({ projectPath, sampleId, platform, accountStage, client, entrypointMode, serverPath, outputPath, developmentBuild, programmingGoal, codeGoal, maxScriptIssues, maxCandidates, maxLogBytes, maxLogIssues, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    return jsonText(await writeFocusedHandoffPack({
      root,
      sampleId,
      platform,
      accountStage,
      client,
      entrypointMode,
      serverPath,
      outputPath,
      developmentBuild,
      programmingGoal,
      codeGoal,
      maxScriptIssues,
      maxCandidates,
      maxLogBytes,
      maxLogIssues,
      overwrite
    }));
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

server.tool(
  "easyar_generate_device_validation_checklist",
  "Generate a focused real-device validation checklist for Image Tracking or Cloud Recognition.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    platform: z.enum(["android", "ios"]).default("android"),
    device: z.string().optional().describe("Optional target device model or test device label."),
    buildOutputPath: z.string().optional().describe("Optional APK, Xcode project, or build artifact path.")
  },
  async ({ projectPath, sampleId, platform, device, buildOutputPath }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    return jsonText(await buildDeviceValidationChecklist(root, sample, platform, device, buildOutputPath));
  }
);

server.tool(
  "easyar_write_device_validation_checklist",
  "Write the focused real-device validation checklist as a Markdown artifact inside the Unity project.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    platform: z.enum(["android", "ios"]).default("android"),
    device: z.string().optional().describe("Optional target device model or test device label."),
    buildOutputPath: z.string().optional().describe("Optional APK, Xcode project, or build artifact path."),
    relativePath: z.string().optional().describe("Optional checklist path inside the project. Defaults to Assets/EasyARGenerated/<sampleId>/DEVICE_VALIDATION.md."),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing device validation checklist.")
  },
  async ({ projectPath, sampleId, platform, device, buildOutputPath, relativePath, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const checklist = await buildDeviceValidationChecklist(root, sample, platform, device, buildOutputPath);
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(focusedSampleGeneratedDir(root, sample), "DEVICE_VALIDATION.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildDeviceValidationChecklistMarkdown(checklist), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      sample: sample.name,
      platform,
      readyForDeviceValidation: checklist.readyForDeviceValidation,
      blockerCount: checklist.blockers.length,
      nextActions: checklist.nextActions,
      note: "The device validation checklist contains test criteria and evidence prompts, not secret values."
    });
  }
);

server.tool(
  "easyar_generate_device_run_result_form",
  "Generate a fillable real-device run result form and safe easyar_write_run_result templates for Image Tracking or Cloud Recognition.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    platform: z.enum(["android", "ios"]).default("android"),
    device: z.string().optional().describe("Optional tested device model or test-device label."),
    buildOutputPath: z.string().optional().describe("Optional APK, Xcode project, or build artifact path."),
    notes: z.string().optional().describe("Optional short context for the form. Do not include secrets.")
  },
  async ({ projectPath, sampleId, platform, device, buildOutputPath, notes }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    return jsonText(await buildDeviceRunResultForm(root, sample, platform, device, buildOutputPath, notes));
  }
);

server.tool(
  "easyar_write_device_run_result_form",
  "Write a fillable real-device run result form to Assets/EasyARGenerated/<sampleId>/DEVICE_RUN_RESULT_FORM.md.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    platform: z.enum(["android", "ios"]).default("android"),
    device: z.string().optional().describe("Optional tested device model or test-device label."),
    buildOutputPath: z.string().optional().describe("Optional APK, Xcode project, or build artifact path."),
    notes: z.string().optional().describe("Optional short context for the form. Do not include secrets."),
    relativePath: z.string().optional().describe("Optional form path inside the project. Defaults to Assets/EasyARGenerated/<sampleId>/DEVICE_RUN_RESULT_FORM.md."),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing device run result form.")
  },
  async ({ projectPath, sampleId, platform, device, buildOutputPath, notes, relativePath, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const form = await buildDeviceRunResultForm(root, sample, platform, device, buildOutputPath, notes);
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(focusedSampleGeneratedDir(root, sample), "DEVICE_RUN_RESULT_FORM.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildDeviceRunResultFormMarkdown(form), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      sample: sample.name,
      platform,
      readyForDeviceValidation: form.readyForDeviceValidation,
      requiredFormStepCount: form.formSteps.filter((step) => step.requiredForCompletion).length,
      nextActions: form.nextActions,
      note: "The form contains placeholders and command templates only. Replace placeholders with observed evidence and never paste secret values."
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
  "easyar_generate_completion_report",
  "Generate the final focused sample completion report, combining preflight, device validation, latest run result, and Unity log evidence.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    platform: z.enum(["android", "ios"]).default("android"),
    outputPath: z.string().optional().describe("Build output path. Defaults to Builds/<sampleId>.apk for Android or Builds/iOS/<sampleId>."),
    maxScriptIssues: z.number().int().positive().max(100).default(25),
    maxLogBytes: z.number().int().positive().max(1024 * 1024).default(200000),
    maxLogIssues: z.number().int().positive().max(50).default(20)
  },
  async ({ projectPath, sampleId, platform, outputPath, maxScriptIssues, maxLogBytes, maxLogIssues }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const defaultOutput = platform === "android"
      ? `Builds/${sample.id}.apk`
      : `Builds/iOS/${sample.id}`;
    return jsonText(await buildCompletionReport(root, sample, platform, outputPath ?? defaultOutput, maxScriptIssues, maxLogBytes, maxLogIssues));
  }
);

server.tool(
  "easyar_write_completion_report",
  "Write the final focused sample completion report to Assets/EasyARGenerated/<sampleId>/COMPLETION_REPORT.md.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    platform: z.enum(["android", "ios"]).default("android"),
    outputPath: z.string().optional().describe("Build output path. Defaults to Builds/<sampleId>.apk for Android or Builds/iOS/<sampleId>."),
    relativePath: z.string().optional().describe("Optional report path inside the project. Defaults to Assets/EasyARGenerated/<sampleId>/COMPLETION_REPORT.md."),
    maxScriptIssues: z.number().int().positive().max(100).default(25),
    maxLogBytes: z.number().int().positive().max(1024 * 1024).default(200000),
    maxLogIssues: z.number().int().positive().max(50).default(20),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing completion report.")
  },
  async ({ projectPath, sampleId, platform, outputPath, relativePath, maxScriptIssues, maxLogBytes, maxLogIssues, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const defaultOutput = platform === "android"
      ? `Builds/${sample.id}.apk`
      : `Builds/iOS/${sample.id}`;
    const report = await buildCompletionReport(root, sample, platform, outputPath ?? defaultOutput, maxScriptIssues, maxLogBytes, maxLogIssues);
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(focusedSampleGeneratedDir(root, sample), "COMPLETION_REPORT.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildCompletionReportMarkdown(report), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      sample: sample.name,
      completionStatus: report.completionStatus,
      runThroughComplete: report.runThroughComplete,
      evidenceCount: report.evidence.length,
      blockerCount: report.blockers.length,
      nextActions: report.nextActions,
      note: "The completion report summarizes evidence only. It does not contain secret values or raw logs."
    });
  }
);

server.tool(
  "easyar_generate_focused_scope_status",
  "Generate a two-sample focused scope status across Image Tracking and Cloud Recognition completion reports.",
  {
    projectPath: z.string().describe("Unity project path."),
    platform: z.enum(["android", "ios"]).default("android"),
    maxScriptIssues: z.number().int().positive().max(100).default(25),
    maxLogBytes: z.number().int().positive().max(1024 * 1024).default(200000),
    maxLogIssues: z.number().int().positive().max(50).default(20)
  },
  async ({ projectPath, platform, maxScriptIssues, maxLogBytes, maxLogIssues }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    return jsonText(await buildFocusedScopeStatus(root, platform, maxScriptIssues, maxLogBytes, maxLogIssues));
  }
);

server.tool(
  "easyar_write_focused_scope_status",
  "Write the focused Image Tracking and Cloud Recognition scope status to Assets/EasyARGenerated/FOCUSED_SCOPE_STATUS.md.",
  {
    projectPath: z.string().describe("Unity project path."),
    platform: z.enum(["android", "ios"]).default("android"),
    relativePath: z.string().optional().describe("Optional status path inside the project. Defaults to Assets/EasyARGenerated/FOCUSED_SCOPE_STATUS.md."),
    maxScriptIssues: z.number().int().positive().max(100).default(25),
    maxLogBytes: z.number().int().positive().max(1024 * 1024).default(200000),
    maxLogIssues: z.number().int().positive().max(50).default(20),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing focused scope status artifact.")
  },
  async ({ projectPath, platform, relativePath, maxScriptIssues, maxLogBytes, maxLogIssues, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const status = await buildFocusedScopeStatus(root, platform, maxScriptIssues, maxLogBytes, maxLogIssues);
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(root, "Assets", "EasyARGenerated", "FOCUSED_SCOPE_STATUS.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildFocusedScopeStatusMarkdown(status), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      allFocusedSamplesComplete: status.allFocusedSamplesComplete,
      focusedSampleCount: status.focusedSampleCount,
      completedCount: status.completedCount,
      blockedCount: status.blockedCount,
      failedCount: status.failedCount,
      notRunCount: status.notRunCount,
      nextActions: status.nextActions,
      note: "The focused scope status summarizes sample completion artifacts only and does not contain secret values."
    });
  }
);

server.tool(
  "easyar_generate_issue_report",
  "Generate a redacted GitHub issue report for a focused Image Tracking or Cloud Recognition run-through.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    platform: z.enum(["android", "ios"]).default("android"),
    overallStatus: z.enum(runResultStatuses).default("blocked").describe("Observed overall status for the latest attempt."),
    device: z.string().optional().describe("Optional tested device model or simulator/emulator description."),
    buildOutputPath: z.string().optional().describe("Optional APK, Xcode project, or build artifact path."),
    observedBehavior: z.string().optional().describe("Short observed behavior. Do not include secrets."),
    expectedBehavior: z.string().optional().describe("Short expected behavior."),
    reproductionSteps: z.array(z.string()).default([]).describe("Short reproduction steps that can be pasted into a GitHub issue."),
    steps: z.array(runResultStepSchema).default([]),
    maxScriptIssues: z.number().int().positive().max(100).default(25),
    maxCandidates: z.number().int().positive().max(100).default(25),
    maxLogBytes: z.number().int().positive().max(1024 * 1024).default(200000),
    maxLogIssues: z.number().int().positive().max(50).default(20)
  },
  async ({ projectPath, sampleId, platform, overallStatus, device, buildOutputPath, observedBehavior, expectedBehavior, reproductionSteps, steps, maxScriptIssues, maxCandidates, maxLogBytes, maxLogIssues }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    return jsonText(await buildIssueReport({
      root,
      sample,
      platform,
      overallStatus,
      device,
      buildOutputPath,
      observedBehavior,
      expectedBehavior,
      reproductionSteps,
      steps,
      maxScriptIssues,
      maxCandidates,
      maxLogBytes,
      maxLogIssues
    }));
  }
);

server.tool(
  "easyar_write_issue_report",
  "Write a redacted GitHub issue report Markdown artifact inside the Unity project.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    platform: z.enum(["android", "ios"]).default("android"),
    overallStatus: z.enum(runResultStatuses).default("blocked").describe("Observed overall status for the latest attempt."),
    device: z.string().optional().describe("Optional tested device model or simulator/emulator description."),
    buildOutputPath: z.string().optional().describe("Optional APK, Xcode project, or build artifact path."),
    observedBehavior: z.string().optional().describe("Short observed behavior. Do not include secrets."),
    expectedBehavior: z.string().optional().describe("Short expected behavior."),
    reproductionSteps: z.array(z.string()).default([]).describe("Short reproduction steps that can be pasted into a GitHub issue."),
    steps: z.array(runResultStepSchema).default([]),
    relativePath: z.string().optional().describe("Optional issue report path inside the project. Defaults to Assets/EasyARGenerated/<sampleId>/ISSUE_REPORT.md."),
    maxScriptIssues: z.number().int().positive().max(100).default(25),
    maxCandidates: z.number().int().positive().max(100).default(25),
    maxLogBytes: z.number().int().positive().max(1024 * 1024).default(200000),
    maxLogIssues: z.number().int().positive().max(50).default(20),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing issue report artifact.")
  },
  async ({ projectPath, sampleId, platform, overallStatus, device, buildOutputPath, observedBehavior, expectedBehavior, reproductionSteps, steps, relativePath, maxScriptIssues, maxCandidates, maxLogBytes, maxLogIssues, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const report = await buildIssueReport({
      root,
      sample,
      platform,
      overallStatus,
      device,
      buildOutputPath,
      observedBehavior,
      expectedBehavior,
      reproductionSteps,
      steps,
      maxScriptIssues,
      maxCandidates,
      maxLogBytes,
      maxLogIssues
    });
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(focusedSampleGeneratedDir(root, sample), "ISSUE_REPORT.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, report.body, overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      sample: sample.name,
      title: report.title,
      labels: report.labels,
      nextActions: report.nextActions,
      note: "The issue report is intended for GitHub and redacts common EasyAR token, key, license, credential, password, and secret fields."
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
  "easyar_generate_local_config_form",
  "Generate a fillable ProjectSettings/EasyAR/easyar.local.json form with field sources, placeholders, env alternatives, and validation calls.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().default("cloud-recognition").describe("Focused sample id: image-tracking or cloud-recognition."),
    platform: z.enum(["android", "ios", "standalone"]).default("android"),
    accountStage: z.enum(accountStageValues).default("unknown").describe("Current EasyAR account stage, if known."),
    bundleIdentifier: z.string().optional().describe("Optional non-secret bundle/package identifier to show in the JSON skeleton.")
  },
  async ({ projectPath, sampleId, platform, accountStage, bundleIdentifier }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    return jsonText(await buildLocalConfigForm(root, sample, platform, accountStage, bundleIdentifier));
  }
);

server.tool(
  "easyar_write_local_config_form",
  "Write a fillable local config form to Assets/EasyARGenerated/LOCAL_CONFIG_FORM.md without writing secret values.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().default("cloud-recognition").describe("Focused sample id: image-tracking or cloud-recognition."),
    platform: z.enum(["android", "ios", "standalone"]).default("android"),
    accountStage: z.enum(accountStageValues).default("unknown").describe("Current EasyAR account stage, if known."),
    bundleIdentifier: z.string().optional().describe("Optional non-secret bundle/package identifier to show in the JSON skeleton."),
    relativePath: z.string().optional().describe("Optional form path inside the project. Defaults to Assets/EasyARGenerated/LOCAL_CONFIG_FORM.md."),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing local config form.")
  },
  async ({ projectPath, sampleId, platform, accountStage, bundleIdentifier, relativePath, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const form = await buildLocalConfigForm(root, sample, platform, accountStage, bundleIdentifier);
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(root, "Assets", "EasyARGenerated", "LOCAL_CONFIG_FORM.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildLocalConfigFormMarkdown(form), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      sample: sample.name,
      platform,
      localConfigValid: form.localConfig.valid,
      missingRequiredFields: form.missingRequiredFields,
      nextActions: form.nextActions,
      note: "The form contains placeholders, field presence, and validation calls only. It does not write or return secret values."
    });
  }
);

server.tool(
  "easyar_write_local_config_from_env",
  "Write ProjectSettings/EasyAR/easyar.local.json from local environment variables without returning secret values.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    targetPlatform: z.enum(["android", "ios", "standalone"]).default("android"),
    bundleIdentifier: z.string().optional().describe("Optional non-secret bundle/package identifier. Defaults to EASYAR_BUNDLE_IDENTIFIER or sample default."),
    relativePath: z.string().optional().describe("Optional config path inside the project. Defaults to ProjectSettings/EasyAR/easyar.local.json."),
    overwrite: z.boolean().default(false).describe("Whether to replace an existing local config file."),
    allowPartial: z.boolean().default(false).describe("Whether to write when required environment variables are missing. Defaults to false.")
  },
  async ({ projectPath, sampleId, targetPlatform, bundleIdentifier, relativePath, overwrite, allowPartial }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json");
    assertInside(root, target);
    const report = await buildLocalConfigFromEnvReport(root, sample, targetPlatform, bundleIdentifier, target, overwrite, allowPartial);
    const written: string[] = [];
    if (report.canWrite) {
      await mkdir(path.dirname(target), { recursive: true });
      await writeGeneratedFile(target, report.contents, overwrite, written);
    }

    return jsonText({
      configPath: target,
      sample: sample.name,
      canWrite: report.canWrite,
      written: written.includes(target) ? target : null,
      skipped: report.canWrite && !written.includes(target) ? target : null,
      existingFile: report.existingFile,
      overwrite,
      allowPartial,
      requiredMissing: report.requiredMissing,
      envPresence: report.envPresence,
      validation: report.canWrite && written.includes(target) ? await buildLocalConfigValidationReport(root, target) : null,
      nextActions: report.nextActions,
      security: report.security
    });
  }
);

server.tool(
  "easyar_local_config_handoff",
  "Generate a first-run handoff for registering/logging into EasyAR, collecting account materials, and filling ProjectSettings/EasyAR/easyar.local.json locally.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().default("cloud-recognition").describe("Focused sample id: image-tracking or cloud-recognition."),
    platform: z.enum(["android", "ios", "standalone"]).default("android"),
    accountStage: z.enum(accountStageValues).default("unknown").describe("Current EasyAR account stage, if known.")
  },
  async ({ projectPath, sampleId, platform, accountStage }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    return jsonText(await buildLocalConfigHandoffReport(root, sample, platform, accountStage));
  }
);

server.tool(
  "easyar_write_local_config_handoff",
  "Write a local Markdown handoff that guides first-time EasyAR users from registration/login to safe easyar.local.json validation.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().default("cloud-recognition").describe("Focused sample id: image-tracking or cloud-recognition."),
    platform: z.enum(["android", "ios", "standalone"]).default("android"),
    accountStage: z.enum(accountStageValues).default("unknown").describe("Current EasyAR account stage, if known."),
    relativePath: z.string().optional().describe("Optional output path inside the project. Defaults to Assets/EasyARGenerated/LOCAL_CONFIG_HANDOFF.md."),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing handoff artifact.")
  },
  async ({ projectPath, sampleId, platform, accountStage, relativePath, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const report = await buildLocalConfigHandoffReport(root, sample, platform, accountStage);
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(root, "Assets", "EasyARGenerated", "LOCAL_CONFIG_HANDOFF.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildLocalConfigHandoffMarkdown(report), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      sample: sample.name,
      stage: report.account.stage,
      localConfigValid: report.localConfig.valid,
      missingRequiredMaterials: report.accountMaterials.missingRequired,
      nextActions: report.nextActions,
      security: report.security
    });
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
    const bridgeEditorPath = path.join(editorDir, "EasyARLocalConfigBridge.cs");
    const bridgeRuntimePath = path.join(root, "Assets", "EasyARGenerated", "Runtime", "EasyARLocalConfigRuntime.cs");
    const runbookPath = focusedSampleRunbookPath(root, sample);
    const configExamplePath = path.join(configDir, "easyar.local.json.example");
    const localConfigPath = path.join(configDir, "easyar.local.json");
    const gitignorePath = path.join(root, ".gitignore");

    const written: string[] = [];
    await writeGeneratedFile(runnerPath, buildSampleRunner(sample), overwrite, written);
    await writeGeneratedFile(buildSettingsPath, buildBuildSettingsHelper(sample, "none"), overwrite, written);
    await writeGeneratedFile(mobileSettingsPath, buildMobileSettingsHelper("android", defaultBundleIdentifier(sample), null, null), overwrite, written);
    await writeGeneratedFile(validationPath, buildSampleValidationHelper(sample), overwrite, written);
    await writeGeneratedFile(bridgeEditorPath, buildLocalConfigBridgeEditor(sample), overwrite, written);
    await writeGeneratedFile(bridgeRuntimePath, buildLocalConfigBridgeRuntime(), overwrite, written);
    await writeGeneratedFile(runbookPath, buildFocusedSampleRunbook(sample), overwrite, written);
    await writeFocusedSampleSupportFiles(root, sample, overwrite, written);
    await writeGeneratedFile(configExamplePath, buildLocalConfigExample(sample), overwrite, written);
    await ensureGitignoreEntries(gitignorePath, [
      "ProjectSettings/EasyAR/easyar.local.json",
      "ProjectSettings/EasyAR/*.secret.json",
      "Assets/StreamingAssets/EasyAR/easyar.runtime.json",
      "Assets/StreamingAssets/EasyAR/*.secret.json"
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
        "Call EasyAR.EditorTools.EasyARLocalConfigBridge.ExportRuntimeConfig before mobile builds to copy local config into ignored StreamingAssets for device runtime.",
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
  "easyar_create_local_config_bridge",
  "Create Unity Editor/runtime scripts that export ProjectSettings/EasyAR/easyar.local.json into ignored StreamingAssets for device builds and read it at runtime without logging secret values.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    overwrite: z.boolean().default(false).describe("Whether to replace existing generated bridge scripts.")
  },
  async ({ projectPath, sampleId, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const editorPath = path.join(root, "Assets", "Editor", "EasyARLocalConfigBridge.cs");
    const runtimePath = path.join(root, "Assets", "EasyARGenerated", "Runtime", "EasyARLocalConfigRuntime.cs");
    const gitignorePath = path.join(root, ".gitignore");

    const written: string[] = [];
    await writeGeneratedFile(editorPath, buildLocalConfigBridgeEditor(sample), overwrite, written);
    await writeGeneratedFile(runtimePath, buildLocalConfigBridgeRuntime(), overwrite, written);
    await ensureGitignoreEntries(gitignorePath, [
      "Assets/StreamingAssets/EasyAR/easyar.runtime.json",
      "Assets/StreamingAssets/EasyAR/*.secret.json"
    ]);

    return jsonText({
      created: written,
      skipped: [
        ...(written.includes(editorPath) ? [] : [editorPath]),
        ...(written.includes(runtimePath) ? [] : [runtimePath])
      ],
      sample: sample.name,
      executeMethod: "EasyAR.EditorTools.EasyARLocalConfigBridge.ExportRuntimeConfig",
      sourceConfig: path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json"),
      runtimeConfig: path.join(root, "Assets", "StreamingAssets", "EasyAR", "easyar.runtime.json"),
      runtimeReader: runtimePath,
      nextActions: [
        "Fill ProjectSettings/EasyAR/easyar.local.json locally and validate it with easyar_validate_local_config.",
        "Run easyar_run_unity_method with EasyAR.EditorTools.EasyARLocalConfigBridge.ExportRuntimeConfig before a mobile device build.",
        "Attach EasyARLocalConfigRuntime to a scene object or call EasyAR.Samples.Generated.EasyARLocalConfigRuntime.Instance from sample scripts.",
        "Wire the official EasyAR sample's license/cloud fields from the runtime reader without logging values."
      ],
      security: "The bridge writes an ignored runtime config for local device builds and never prints license keys, account tokens, appKey, or appSecret values."
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
  "easyar_generate_config_integration_audit",
  "Audit how ProjectSettings/EasyAR/easyar.local.json can be wired into EasyAR Unity scripts, scenes, prefabs, and assets without exposing secret values.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    maxFiles: z.number().int().positive().max(300).default(120),
    maxCandidates: z.number().int().positive().max(100).default(40)
  },
  async ({ projectPath, sampleId, maxFiles, maxCandidates }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    return jsonText(await buildConfigIntegrationAudit(root, sample, maxFiles, maxCandidates));
  }
);

server.tool(
  "easyar_write_config_integration_audit",
  "Write a focused local-config integration audit to CONFIG_INTEGRATION.md for Unity programming handoff.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    relativePath: z.string().optional().describe("Optional output path inside the project. Defaults to Assets/EasyARGenerated/<sampleId>/CONFIG_INTEGRATION.md."),
    maxFiles: z.number().int().positive().max(300).default(120),
    maxCandidates: z.number().int().positive().max(100).default(40),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing config integration audit artifact.")
  },
  async ({ projectPath, sampleId, relativePath, maxFiles, maxCandidates, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const audit = await buildConfigIntegrationAudit(root, sample, maxFiles, maxCandidates);
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(focusedSampleGeneratedDir(root, sample), "CONFIG_INTEGRATION.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildConfigIntegrationAuditMarkdown(audit), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      sample: sample.name,
      readyForConfigIntegration: audit.readyForConfigIntegration,
      blockerCount: audit.blockers.length,
      consumerCandidateCount: audit.consumerCandidates.length,
      nextActions: audit.nextActions,
      security: audit.security
    });
  }
);

server.tool(
  "easyar_generate_programming_context",
  "Generate a focused Unity programming context before editing EasyAR sample C# scripts.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    goal: z.string().optional().describe("Optional programming goal to contextualize recommendations."),
    maxFiles: z.number().int().positive().max(200).default(80),
    maxIssues: z.number().int().positive().max(100).default(25)
  },
  async ({ projectPath, sampleId, goal, maxFiles, maxIssues }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    return jsonText(await buildProgrammingContext(root, sample, goal, maxFiles, maxIssues));
  }
);

server.tool(
  "easyar_write_programming_context",
  "Write the focused Unity programming context as a Markdown artifact inside the Unity project.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    goal: z.string().optional().describe("Optional programming goal to contextualize recommendations."),
    relativePath: z.string().optional().describe("Optional context path inside the project. Defaults to Assets/EasyARGenerated/<sampleId>/PROGRAMMING_CONTEXT.md."),
    maxFiles: z.number().int().positive().max(200).default(80),
    maxIssues: z.number().int().positive().max(100).default(25),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing programming context artifact.")
  },
  async ({ projectPath, sampleId, goal, relativePath, maxFiles, maxIssues, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const context = await buildProgrammingContext(root, sample, goal, maxFiles, maxIssues);
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(focusedSampleGeneratedDir(root, sample), "PROGRAMMING_CONTEXT.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildProgrammingContextMarkdown(context), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      sample: sample.name,
      scriptCount: context.scriptInventory.totalScripts,
      easyarScriptCount: context.scriptInventory.easyarScripts.length,
      issueCount: context.scriptReview.issueCount,
      nextActions: context.nextActions,
      note: "Review PROGRAMMING_CONTEXT.md before creating CODE_PLAN.md or editing C# scripts."
    });
  }
);

server.tool(
  "easyar_generate_code_change_summary",
  "Generate a focused Unity C# change summary after editing scripts, including static review and next verification steps.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    goal: z.string().describe("Code change goal or user request that motivated the script edits."),
    targetFiles: z.array(z.string()).describe("Relative .cs files that were created or changed."),
    notes: z.string().optional().describe("Optional short notes about the implementation. Do not include secrets."),
    maxIssues: z.number().int().positive().max(200).default(80)
  },
  async ({ projectPath, sampleId, goal, targetFiles, notes, maxIssues }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    return jsonText(await buildCodeChangeSummary(root, sample, goal, targetFiles, notes, maxIssues));
  }
);

server.tool(
  "easyar_write_code_change_summary",
  "Write a focused Unity C# change summary Markdown artifact inside the Unity project.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
    goal: z.string().describe("Code change goal or user request that motivated the script edits."),
    targetFiles: z.array(z.string()).describe("Relative .cs files that were created or changed."),
    notes: z.string().optional().describe("Optional short notes about the implementation. Do not include secrets."),
    relativePath: z.string().optional().describe("Optional summary path inside the project. Defaults to Assets/EasyARGenerated/<sampleId>/CODE_CHANGE.md."),
    maxIssues: z.number().int().positive().max(200).default(80),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing code change artifact.")
  },
  async ({ projectPath, sampleId, goal, targetFiles, notes, relativePath, maxIssues, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);
    const summary = await buildCodeChangeSummary(root, sample, goal, targetFiles, notes, maxIssues);
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(focusedSampleGeneratedDir(root, sample), "CODE_CHANGE.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildCodeChangeSummaryMarkdown(summary), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      sample: sample.name,
      goal,
      targetFileCount: summary.targetFiles.length,
      issueCount: summary.scriptReview.issueCount,
      nextActions: summary.nextActions,
      note: "Run Unity compilation after reviewing this summary."
    });
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
    return jsonText(await buildUnityEnvironmentReport(null, null));
  }
);

server.tool(
  "easyar_write_unity_environment_report",
  "Write a Unity executable setup report for MCP batch compile/build automation without launching Unity.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().optional().describe("Optional focused sample id used for suggested dry-run compile command."),
    relativePath: z.string().optional().describe("Optional report path inside the project. Defaults to Assets/EasyARGenerated/UNITY_ENVIRONMENT.md."),
    overwrite: z.boolean().default(true).describe("Whether to replace an existing Unity environment report.")
  },
  async ({ projectPath, sampleId, relativePath, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = sampleId ? findSample(sampleId) : null;
    const report = await buildUnityEnvironmentReport(root, sample);
    const target = relativePath
      ? path.resolve(root, relativePath)
      : path.join(root, "Assets", "EasyARGenerated", "UNITY_ENVIRONMENT.md");
    assertInside(root, target);
    const written: string[] = [];
    await writeGeneratedFile(target, buildUnityEnvironmentMarkdown(report), overwrite, written);

    return jsonText({
      written: written.includes(target) ? target : null,
      skipped: written.includes(target) ? null : target,
      projectPath: root,
      sample: sample?.name ?? null,
      readyForUnityBatch: report.readyForUnityBatch,
      recommendedUnityPath: report.recommendedUnityPath,
      nextActions: report.nextActions,
      note: "This report does not launch Unity and does not contain secret values."
    });
  }
);

server.tool(
  "easyar_run_unity_compile_check",
  "Open a Unity project in batch mode to force script import/compilation, then optionally analyze the produced log.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().optional().describe("Optional focused sample id used for log diagnostics."),
    platform: z.enum(["android", "ios"]).default("android").describe("Target device platform used for suggested RUN_RESULT handoff when sampleId is provided."),
    unityPath: z.string().optional().describe("Unity executable path. Defaults to EASYAR_UNITY_PATH or Unity on PATH."),
    logPath: z.string().optional().describe("Optional Unity -logFile path. Defaults to Logs/mcp-easyar-CompileCheck.log inside the project."),
    timeoutSeconds: z.number().int().positive().max(1800).default(600),
    dryRun: z.boolean().default(false).describe("Return the command without launching Unity.")
  },
  async ({ projectPath, sampleId, platform, unityPath, logPath, timeoutSeconds, dryRun }) => {
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
        suggestedRunResultCall: sample ? buildSuggestedRunResultCall({
          root,
          sample,
          platform,
          stepName: "Unity compile/import check",
          status: "not-run",
          evidence: `Dry-run command only. Planned log path: ${path.relative(root, resolvedLogPath)}.`,
          nextAction: "Run easyar_run_unity_compile_check without dryRun, then call easyar_write_run_result with the observed result."
        }) : null,
        nextStep: "Run without dryRun to force Unity script import/compilation."
      });
    }

    const result = await runUnity(unity, root, null, timeoutSeconds, resolvedLogPath);
    const logText = await exists(resolvedLogPath) ? await readLogTail(resolvedLogPath, 200000) : `${result.stdout}\n${result.stderr}`;
    const issues = analyzeUnityLog(logText, sample);
    const suggestedStep = buildUnityRunResultStep({
      stepName: "Unity compile/import check",
      result,
      issues,
      root,
      successNextAction: "Continue with mobile settings, Build Settings, and focused sample validation."
    });
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
      suggestedRunResultCall: sample ? buildSuggestedRunResultCall({
        root,
        sample,
        platform,
        overallStatus: suggestedStep.status,
        stepName: suggestedStep.name,
        status: suggestedStep.status,
        evidence: suggestedStep.evidence,
        nextAction: suggestedStep.nextAction
      }) : null,
      nextActions: issues.length > 0
        ? Array.from(new Set(issues.flatMap((issue) => issue.actions)))
        : result.exitCode === 0
          ? ["No known EasyAR/Unity issue patterns were detected. Continue with the focused run sequence and record the outcome with easyar_write_run_result."]
          : ["Unity exited with a non-zero code. Inspect the returned log summary and record the outcome with easyar_write_run_result."]
    });
  }
);

server.tool(
  "easyar_run_unity_method",
  "Run a Unity static editor method in batch mode for project automation.",
  {
    projectPath: z.string().describe("Unity project path."),
    executeMethod: z.string().describe("Fully qualified static method, for example EasyAR.EditorTools.EasyARSampleRunner.OpenSampleScene."),
    sampleId: z.string().optional().describe("Optional focused sample id used for log diagnostics and suggested RUN_RESULT handoff."),
    platform: z.enum(["android", "ios"]).default("android").describe("Target device platform used for suggested RUN_RESULT handoff when sampleId is provided."),
    unityPath: z.string().optional().describe("Unity executable path. Defaults to EASYAR_UNITY_PATH or Unity on PATH."),
    logPath: z.string().optional().describe("Optional Unity -logFile path. Relative paths are resolved inside the Unity project."),
    timeoutSeconds: z.number().int().positive().max(1800).default(300)
  },
  async ({ projectPath, executeMethod, sampleId, platform, unityPath, logPath, timeoutSeconds }) => {
    const root = resolveProjectPath(projectPath);
    const unity = unityPath ?? process.env.EASYAR_UNITY_PATH ?? "Unity";
    const resolvedLogPath = logPath ? resolveUnityLogPath(root, logPath) : null;
    const sample = sampleId ? findSample(sampleId) : null;
    const result = await runUnity(unity, root, executeMethod, timeoutSeconds, resolvedLogPath);
    const logText = resolvedLogPath && await exists(resolvedLogPath)
      ? await readLogTail(resolvedLogPath, 200000)
      : `${result.stdout}\n${result.stderr}`;
    const issues = analyzeUnityLog(logText, sample);
    const suggestedStep = buildUnityRunResultStep({
      stepName: unityMethodStepName(executeMethod),
      result,
      issues,
      root,
      successNextAction: unityMethodSuccessNextAction(executeMethod)
    });
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
      suggestedRunResultCall: sample ? buildSuggestedRunResultCall({
        root,
        sample,
        platform,
        overallStatus: suggestedStep.status,
        stepName: suggestedStep.name,
        status: suggestedStep.status,
        evidence: suggestedStep.evidence,
        nextAction: suggestedStep.nextAction
      }) : null,
      nextActions: issues.length > 0
        ? Array.from(new Set(issues.flatMap((issue) => issue.actions)))
        : result.exitCode === 0
          ? [unityMethodSuccessNextAction(executeMethod), "Record the outcome with easyar_write_run_result."]
          : ["Unity exited with a non-zero code. Inspect the returned log summary and record the outcome with easyar_write_run_result."]
    });
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

async function buildDeploymentReadiness(projectPath: string | null, unityPath?: string): Promise<DeploymentReadinessReport> {
  const packageJson = await readPackageMetadata();
  const auth = readAuthConfig();
  const requestedUnityPath = unityPath ?? process.env.EASYAR_UNITY_PATH ?? null;
  const unityExecutableExists = requestedUnityPath ? await exists(requestedUnityPath) : null;
  const project = projectPath
    ? {
        path: projectPath,
        hasAssets: await exists(path.join(projectPath, "Assets")),
        hasPackagesManifest: await exists(path.join(projectPath, "Packages", "manifest.json")),
        hasProjectSettings: await exists(path.join(projectPath, "ProjectSettings")),
        unityVersion: await readUnityVersion(projectPath)
      }
    : {
        path: null,
        hasAssets: null,
        hasPackagesManifest: null,
        hasProjectSettings: null,
        unityVersion: null
      };

  const groups: Record<string, ReadinessCheck[]> = {
    release: [
      check("package-name", packageJson.name === serverName, "blocker", `package.json name is ${packageJson.name ?? "missing"}; expected ${serverName}.`),
      check("server-version", packageJson.version === serverVersion, "warning", `package.json version is ${packageJson.version ?? "missing"}; server reports ${serverVersion}.`),
      check("bin-name", packageJson.binName === "easyar-mcp", "blocker", `CLI bin is ${packageJson.binName ?? "missing"}; expected easyar-mcp.`),
      check("bin-target", packageJson.binPath === "dist/index.js", "blocker", `CLI bin target is ${packageJson.binPath ?? "missing"}; expected dist/index.js.`),
      check("repository-url", packageJson.repository?.includes("github.com/terri1982/mcp-easyar") ?? false, "blocker", `repository URL is ${packageJson.repository ?? "missing"}.`),
      check("package-public", packageJson.private !== true, "blocker", packageJson.private === true ? "package.json is private and cannot be published to npm." : "package.json is publishable; private is not true."),
      check("package-files-dist", packageJson.files.includes("dist"), "blocker", "package.json files includes dist."),
      check("package-files-docs", packageJson.files.includes("docs"), "warning", "package.json files includes docs."),
      check("package-files-logo", packageJson.files.includes("assets/easyar-icon.png"), "warning", "package.json files includes assets/easyar-icon.png."),
      check("ci-workflow", await exists(path.join(process.cwd(), ".github", "workflows", "ci.yml")), "blocker", "GitHub Actions CI workflow .github/workflows/ci.yml exists."),
      check("readme", await fileContains(path.join(process.cwd(), "README.md"), "mcp-easyar"), "blocker", "README.md uses the mcp-easyar project name."),
      check("readme-install-profiles", await fileContains(path.join(process.cwd(), "README.md"), "entrypointMode=package-bin") && await fileContains(path.join(process.cwd(), "README.md"), "entrypointMode=npx"), "warning", "README.md documents package-bin and npx client entrypoint modes."),
      check("release-manifest-install-profiles", await fileContains(path.join(process.cwd(), "docs", "RELEASE_MANIFEST.md"), "Install Profiles") && await fileContains(path.join(process.cwd(), "docs", "RELEASE_MANIFEST.md"), "npm install -g mcp-easyar"), "warning", "docs/RELEASE_MANIFEST.md documents local, package-bin, and npx install profiles."),
      check("license", await exists(path.join(process.cwd(), "LICENSE")), "blocker", "LICENSE exists."),
      check("security-policy", await exists(path.join(process.cwd(), "SECURITY.md")), "warning", "SECURITY.md exists."),
      check("logo", await exists(path.join(process.cwd(), "assets", "easyar-icon.png")), "warning", "assets/easyar-icon.png exists.")
    ],
    authorization: [
      check("api-base-url", Boolean(auth.apiBaseUrl), "blocker", `EASYAR_API_BASE_URL is ${auth.apiBaseUrl || "missing"}.`),
      check("api-token", auth.hasToken, "blocker", "EASYAR_API_TOKEN is configured."),
      check("account-status-endpoint", auth.accountStatusEndpointConfigured, "blocker", "EASYAR_ACCOUNT_STATUS_ENDPOINT is configured."),
      check("license-validation-endpoint", auth.licenseValidationEndpointConfigured, "blocker", "EASYAR_LICENSE_VALIDATE_ENDPOINT is configured."),
      check("downloads-endpoint", auth.downloadsEndpointConfigured, "blocker", "EASYAR_DOWNLOADS_ENDPOINT is configured."),
      check("cloud-credentials-endpoint", auth.cloudCredentialsEndpointConfigured, "blocker", "EASYAR_CLOUD_CREDENTIALS_ENDPOINT is configured.")
    ],
    unityAutomation: [
      check("unity-path", Boolean(requestedUnityPath), "warning", "EASYAR_UNITY_PATH or explicit unityPath is configured."),
      check("unity-executable", unityExecutableExists !== false, "warning", requestedUnityPath ? `Unity executable ${requestedUnityPath} exists.` : "Unity executable existence was not checked because no explicit path was provided."),
      check("project-path", projectPath ? project.hasAssets === true && project.hasPackagesManifest === true && project.hasProjectSettings === true : true, "warning", projectPath ? `Project path ${projectPath} has Unity structure.` : "No Unity project path was provided for deployment readiness.")
    ],
    scope: [
      check("focused-samples", focusedSamples().map((sample) => sample.id).join(",") === "image-tracking,cloud-recognition", "blocker", "Focused run-through scope is Image Tracking and Cloud Recognition."),
      check("deferred-samples", deferredSamples().length > 0, "info", "Other samples are cataloged as deferred until the user asks to continue.")
    ],
    security: [
      check("no-private-endpoint-guessing", true, "blocker", "Official endpoint URLs are configurable and private EasyAR APIs are not guessed."),
      check("secret-redaction", true, "blocker", "Remote API tools redact token, license, key, credential, password, and secret fields.")
    ]
  };

  const allChecks = Object.values(groups).flat();
  const blockers = allChecks.filter((item) => item.severity === "blocker" && !item.ok);
  const warnings = allChecks.filter((item) => item.severity === "warning" && !item.ok);
  const nextActions = deploymentNextActions(blockers, warnings, auth, requestedUnityPath);

  return {
    generatedAt: new Date().toISOString(),
    server: {
      name: serverName,
      version: serverVersion,
      packageName: packageJson.name,
      repository: packageJson.repository,
      binName: packageJson.binName,
      binPath: packageJson.binPath,
      packageFiles: packageJson.files
    },
    ready: blockers.length === 0,
    blockers,
    warnings,
    groups,
    focusedScope: {
      focusedSamples: focusedSamples().map((sample) => sample.id),
      deferredSamples: deferredSamples().map((sample) => sample.id)
    },
    project,
    auth,
    unity: {
      requestedPath: requestedUnityPath,
      pathCommand: requestedUnityPath ?? "Unity",
      pathConfigured: Boolean(requestedUnityPath),
      executableExists: unityExecutableExists
    },
    nextActions,
    security: [
      "Do not publish account tokens, license keys, Cloud Recognition credentials, signing keys, or provisioning secrets.",
      "Connect production deployments only to official EasyAR account/license/download/cloud endpoints.",
      "Keep Image Tracking and Cloud Recognition as the active run-through scope until the user asks to continue."
    ]
  };
}

async function readPackageMetadata(): Promise<{
  name: string | null;
  version: string | null;
  repository: string | null;
  binName: string | null;
  binPath: string | null;
  files: string[];
  private: boolean | null;
}> {
  try {
    const text = await readFile(path.join(process.cwd(), "package.json"), "utf8");
    const parsed = JSON.parse(text) as {
      name?: string;
      version?: string;
      repository?: string | { url?: string };
      bin?: Record<string, string>;
      files?: string[];
      private?: boolean;
    };
    const binName = parsed.bin ? Object.keys(parsed.bin)[0] ?? null : null;
    return {
      name: parsed.name ?? null,
      version: parsed.version ?? null,
      repository: typeof parsed.repository === "string" ? parsed.repository : parsed.repository?.url ?? null,
      binName,
      binPath: binName ? parsed.bin?.[binName] ?? null : null,
      files: parsed.files ?? [],
      private: parsed.private ?? null
    };
  } catch {
    return {
      name: null,
      version: null,
      repository: null,
      binName: null,
      binPath: null,
      files: [],
      private: null
    };
  }
}

function check(id: string, ok: boolean, severity: ReadinessCheck["severity"], detail: string): ReadinessCheck {
  return {
    id,
    ok,
    severity,
    detail
  };
}

async function fileContains(filePath: string, needle: string): Promise<boolean> {
  try {
    return (await readFile(filePath, "utf8")).includes(needle);
  } catch {
    return false;
  }
}

function deploymentNextActions(
  blockers: ReadinessCheck[],
  warnings: ReadinessCheck[],
  auth: ReturnType<typeof readAuthConfig>,
  requestedUnityPath: string | null
): string[] {
  const actions = new Set<string>();
  if (!auth.hasToken) {
    actions.add("Set EASYAR_API_TOKEN from an official registered EasyAR account secret store.");
  }
  if (!auth.accountStatusEndpointConfigured || !auth.licenseValidationEndpointConfigured || !auth.downloadsEndpointConfigured || !auth.cloudCredentialsEndpointConfigured) {
    actions.add("Configure official EasyAR account, license, downloads, and Cloud Recognition endpoint environment variables.");
  }
  if (!requestedUnityPath) {
    actions.add("Set EASYAR_UNITY_PATH on deployment machines that will run Unity batch automation.");
  }
  for (const blocker of blockers) {
    actions.add(`Fix blocker ${blocker.id}: ${blocker.detail}`);
  }
  for (const warning of warnings.slice(0, 3)) {
    actions.add(`Review warning ${warning.id}: ${warning.detail}`);
  }
  if (actions.size === 0) {
    actions.add("Run npm run typecheck, npm test, npm run bin:smoke, and npm run pack:check before tagging or publishing.");
  } else {
    actions.add("After fixing blockers, rerun easyar_deployment_readiness and CI before release.");
  }
  return Array.from(actions);
}

async function buildProductionValidationReport(
  root: string | null,
  platform: typeof mobilePlatforms[number],
  unityPath: string | undefined,
  verificationEvidence: "not-provided" | "passed",
  maxScriptIssues: number,
  maxLogBytes: number,
  maxLogIssues: number
) {
  const deployment = await buildDeploymentReadiness(root, unityPath);
  const releaseManifest = await buildReleaseManifest();
  const officialContract = buildOfficialApiContract(process.env.EASYAR_API_BASE_URL, false);
  const missingOfficialEnv = officialContract.environment.required.filter((name) => {
    if (name === "EASYAR_API_BASE_URL") {
      return !isNonPlaceholderString(officialContract.environment.baseUrl);
    }
    const configured = officialContract.environment.configured as Record<string, boolean>;
    return !configured[name];
  });
  const focused = focusedSamples();
  const officialAccessReports = root
    ? await Promise.all(focused.map((sample) => buildOfficialAccessReport(root, sample, platform, "unity-samples")))
    : [];
  const focusedScopeStatus = root
    ? await buildFocusedScopeStatus(root, platform, maxScriptIssues, maxLogBytes, maxLogIssues)
    : null;
  const gates = [
    productionGate(
      "release-manifest",
      "Release manifest and package install surface",
      releaseManifest.readyForInstallDocs,
      "docs/RELEASE_MANIFEST.md, package.json, bins, docs, logo, and required release files are present.",
      releaseManifest.readyForInstallDocs
        ? "Release manifest is complete enough for consumer install docs."
        : `Missing release file(s): ${releaseManifest.missingRequiredFiles.join(", ") || "unknown"}.`,
      "Run easyar_write_release_manifest after restoring missing release files."
    ),
    productionGate(
      "deployment-readiness",
      "Deployment readiness",
      deployment.ready,
      "Package metadata, official endpoint environment, Unity executable configuration, focused scope, and security checks have no blockers.",
      deployment.ready
        ? "easyar_deployment_readiness has no blocker checks."
        : `${deployment.blockers.length} deployment blocker(s) remain.`,
      deployment.nextActions[0] ?? "Run easyar_write_deployment_readiness and resolve blockers."
    ),
    productionGate(
      "official-api-contract",
      "Official EasyAR account API contract",
      officialContract.readyForProductionOfficialAccess,
      "Official account, license, downloads, and Cloud Recognition endpoint environment variables are configured.",
      officialContract.readyForProductionOfficialAccess
        ? "Official endpoint environment variables are configured."
        : `Missing official endpoint env: ${missingOfficialEnv.join(", ") || "none"}.`,
      "Connect production deployment to authorized EasyAR account APIs and set the required endpoint environment variables."
    ),
    productionGate(
      "verification-commands",
      "Local package and CI verification commands",
      verificationEvidence === "passed",
      "npm run typecheck, npm test, npm run bin:smoke, npm run install:check, npm run package:smoke, and npm run pack:check have passed for the commit being released.",
      verificationEvidence === "passed"
        ? "Caller recorded verificationEvidence=passed."
        : "No current verification evidence was provided to this report.",
      `Run and record: ${releaseManifest.verificationCommands.join("; ")}. Then regenerate with verificationEvidence=passed.`
    ),
    productionGate(
      "unity-project-evidence",
      "Unity project evidence",
      Boolean(root),
      "A Unity project path is provided so focused sample import, config, logs, and run artifacts can be inspected.",
      root ? `Project path: ${root}.` : "No projectPath was provided.",
      "Provide projectPath for the Unity project used for Image Tracking and Cloud Recognition validation."
    ),
    ...focused.map((sample) => {
      const access = officialAccessReports.find((report) => report.sample.id === sample.id);
      return productionGate(
        `official-access/${sample.id}`,
        `${sample.name} official access`,
        Boolean(access?.readyForOfficialContent),
        "Registered-user account, license, downloads, and sample-specific official access checks pass against configured EasyAR endpoints.",
        access
          ? access.readyForOfficialContent
            ? "Official access checks passed for this sample."
            : `${access.blockers.length} official access blocker(s) remain.`
          : "Official access was not checked because no projectPath was provided.",
        access?.nextActions[0] ?? `Run easyar_write_official_access_report projectPath=/path/to/UnityProject sampleId=${sample.id} platform=${platform}.`
      );
    }),
    productionGate(
      "focused-scope-run-through",
      "Focused Image Tracking and Cloud Recognition run-through",
      Boolean(focusedScopeStatus?.allFocusedSamplesComplete),
      "Both focused samples have COMPLETION_REPORT.md with runThroughComplete=true based on preflight, device validation, RUN_RESULT.md, and latest log evidence.",
      focusedScopeStatus
        ? focusedScopeStatus.allFocusedSamplesComplete
          ? "Both focused samples are complete."
          : `${focusedScopeStatus.completedCount}/${focusedScopeStatus.focusedSampleCount} focused samples complete; blocked=${focusedScopeStatus.blockedCount}, failed=${focusedScopeStatus.failedCount}, notRun=${focusedScopeStatus.notRunCount}.`
        : "Focused scope status was not generated because no projectPath was provided.",
      focusedScopeStatus?.nextActions[0] ?? `Run easyar_write_focused_scope_status projectPath=/path/to/UnityProject platform=${platform}.`
    )
  ];
  const blockers = gates.filter((gate) => gate.required && !gate.ok);
  const productionReady = blockers.length === 0;

  return {
    generatedAt: new Date().toISOString(),
    productionReady,
    projectPath: root,
    platform,
    server: {
      name: serverName,
      version: serverVersion,
      packageName: releaseManifest.package.name,
      repository: releaseManifest.package.repository
    },
    scope: {
      focusedSamples: focused.map((sample) => sample.id),
      deferredSamples: deferredSamples().map((sample) => sample.id),
      note: "Only Image Tracking and Cloud Recognition are in the active run-through scope until the user asks to continue."
    },
    verificationEvidence,
    gates,
    blockers,
    summaries: {
      deploymentReady: deployment.ready,
      deploymentBlockerCount: deployment.blockers.length,
      releaseManifestReady: releaseManifest.readyForInstallDocs,
      officialContractReady: officialContract.readyForProductionOfficialAccess,
      officialAccess: officialAccessReports.map((report) => ({
        sampleId: report.sample.id,
        readyForOfficialContent: report.readyForOfficialContent,
        blockerCount: report.blockers.length
      })),
      focusedScope: focusedScopeStatus
        ? {
            allFocusedSamplesComplete: focusedScopeStatus.allFocusedSamplesComplete,
            completedCount: focusedScopeStatus.completedCount,
            blockedCount: focusedScopeStatus.blockedCount,
            failedCount: focusedScopeStatus.failedCount,
            notRunCount: focusedScopeStatus.notRunCount
          }
        : null
    },
    requiredArtifacts: [
      "docs/RELEASE_MANIFEST.md",
      "docs/OFFICIAL_API_CONTRACT.md",
      "DEPLOYMENT_READINESS.md",
      "OFFICIAL_ACCESS.md for image-tracking and cloud-recognition",
      "PREFLIGHT.md, DEVICE_VALIDATION.md, RUN_RESULT.md, and COMPLETION_REPORT.md for both focused samples",
      "FOCUSED_SCOPE_STATUS.md",
      "Passing GitHub Actions or locally recorded verification commands"
    ],
    nextActions: productionReady
      ? [
          "Keep PRODUCTION_VALIDATION.md with the release/tag evidence.",
          "Publish or tag only the verified commit and keep secrets in environment variables or secret storage."
        ]
      : Array.from(new Set(blockers.map((blocker) => blocker.nextAction))).slice(0, 12),
    security: "Production validation reports evidence status and redacted metadata only. They do not include EasyAR passwords, verification codes, account tokens, license keys, appKey, appSecret, signing keys, provisioning secrets, or raw private logs."
  };
}

function productionGate(
  id: string,
  title: string,
  ok: boolean,
  requiredEvidence: string,
  currentEvidence: string,
  nextAction: string
) {
  return {
    id,
    title,
    ok,
    required: true,
    status: ok ? "passed" : "blocked",
    requiredEvidence,
    currentEvidence,
    nextAction
  };
}

async function buildAccountOnboardingReport(
  root: string | null,
  sample: SampleInfo,
  platform: "android" | "ios" | "standalone" | "unknown",
  accountStage: "unknown" | "not-registered" | "registered-not-logged-in" | "logged-in" | "has-license" | "has-cloud-credentials"
) {
  const auth = readAuthConfig();
  const localConfig = root ? await buildLocalConfigValidationReport(root) : null;
  const cloudConfig = root ? await readCloudRecognitionConfig(root) : {};
  const localConfigPath = root ? path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json") : null;
  const bundleIdentifier = root ? (await readLocalConfigForRemoteValidation(root)).bundleIdentifier ?? defaultBundleIdentifier(sample) : defaultBundleIdentifier(sample);
  const needsCloudRecognition = sample.id === "cloud-recognition";
  const derivedStage = deriveAccountOnboardingStage(accountStage, auth, localConfig, cloudConfig, needsCloudRecognition);
  const humanSteps = buildAccountHumanSteps(derivedStage, needsCloudRecognition, bundleIdentifier, platform);
  const mcpSteps = buildAccountMcpSteps(root, sample, platform, needsCloudRecognition);
  const blockers = buildAccountOnboardingBlockers(derivedStage, auth, localConfig, cloudConfig, needsCloudRecognition, root);
  const nextActions = buildAccountOnboardingNextActions(derivedStage, blockers, root, sample, platform, needsCloudRecognition);
  const firstRunGuide = buildFirstRunAccountGuide(derivedStage, root, sample, platform, needsCloudRecognition, bundleIdentifier);

  return {
    generatedAt: new Date().toISOString(),
    stage: derivedStage,
    requestedStage: accountStage,
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    platform,
    needsCloudRecognition,
    officialLinks: {
      website: "https://www.easyar.cn/",
      registerAndLogin: "https://www.easyar.cn/",
      developCenter: "https://www.easyar.cn/",
      docsGettingStarted: "https://help.easyar.cn/EasyAR%20Sense/v4/GettingStarted/Licensing.html",
      apiKeyDocs: "https://www.easyar.com/doc/zh-hant/develop/apikey-auth.html",
      downloadsPage: "https://www.easyar.cn/view/download.html",
      downloads: officialInfo.docs.downloads,
      samples: officialInfo.docs.samples
    },
    localFiles: {
      localConfig: localConfigPath,
      localConfigExists: localConfig ? localConfig.checks.find((check) => check.id === "file-exists")?.ok ?? false : null,
      localConfigValid: localConfig?.valid ?? null,
      bundleIdentifier,
      cloudCredentialPresence: needsCloudRecognition
        ? {
            appId: isNonPlaceholderString(cloudConfig.appId),
            appKey: isNonPlaceholderString(cloudConfig.appKey),
            appSecret: isNonPlaceholderString(cloudConfig.appSecret)
          }
        : null
    },
    environment: {
      apiBaseUrl: auth.apiBaseUrl,
      apiTokenConfigured: auth.hasToken,
      accountStatusEndpointConfigured: auth.accountStatusEndpointConfigured,
      licenseValidationEndpointConfigured: auth.licenseValidationEndpointConfigured,
      downloadsEndpointConfigured: auth.downloadsEndpointConfigured,
      cloudCredentialsEndpointConfigured: auth.cloudCredentialsEndpointConfigured
    },
    firstRunGuide,
    humanSteps,
    mcpSteps,
    blockers,
    nextActions,
    security: [
      "MCP does not ask for or store EasyAR website passwords.",
      "Register and log in only through official EasyAR pages.",
      "Put tokens in local MCP client environment or a secret store, not in source control.",
      "Put licenseKey and Cloud Recognition appId/apiKey only in ProjectSettings/EasyAR/easyar.local.json or another local secret source. Legacy appKey/appSecret aliases are still accepted.",
      "MCP reports only presence, status, paths, and redacted metadata."
    ]
  };
}

function buildFirstRunAccountGuide(
  stage: string,
  root: string | null,
  sample: SampleInfo,
  platform: "android" | "ios" | "standalone" | "unknown",
  needsCloudRecognition: boolean,
  bundleIdentifier: string
) {
  const projectPath = root ?? "/path/to/UnityProject";
  return {
    entryQuestion: "Do you already have an EasyAR account?",
    designPrinciple:
      "Registration and login are browser handoffs. MCP asks only for account stage and local project paths, then validates local evidence without collecting website credentials or EasyAR secret values.",
    stageModel: [
      {
        stage: "not-registered",
        userSituation: "The user has not created an EasyAR account yet.",
        mcpBehavior: "Show official website/register/login links, explain what to create after login, and stop before any account-scoped download or Unity run."
      },
      {
        stage: "registered-not-logged-in",
        userSituation: "The user has an account but is not signed in in the browser.",
        mcpBehavior: "Send the user to the official development center login and remind them not to paste passwords or verification codes."
      },
      {
        stage: "logged-in",
        userSituation: "The user can access the EasyAR development center.",
        mcpBehavior: "Guide license creation, package identifier matching, official downloads, and local config preparation."
      },
      {
        stage: "has-license",
        userSituation: "The user has an EasyAR Sense license for the target package/bundle identifier.",
        mcpBehavior: needsCloudRecognition
          ? "Guide Cloud Recognition AppId/API KEY creation and local-only storage."
          : "Move to local config validation and focused sample preflight."
      },
      {
        stage: "has-cloud-credentials",
        userSituation: "The user has local Cloud Recognition credentials ready.",
        mcpBehavior: "Validate local config presence, then continue with focused preflight and Unity validation."
      }
    ],
    routes: [
      {
        id: "new-user",
        active: stage === "not-registered",
        answer: "No, I have not registered yet.",
        guide:
          "Open the official EasyAR website registration entry in a browser, create the account, activate it if required, then sign in to the EasyAR development center.",
        mcpAfterUserReturns: [
          `easyar_account_onboarding accountStage=registered-not-logged-in sampleId=${sample.id}`,
          `easyar_write_account_onboarding projectPath=${projectPath} accountStage=registered-not-logged-in sampleId=${sample.id}`
        ],
        browserActions: [
          "Open https://www.easyar.cn/.",
          "Use the official login/register entry on the website.",
          "Activate the registered email if the website requires activation.",
          "Open the development center from the website after registration succeeds."
        ],
        returnPrompt:
          "After the browser flow is done, tell the MCP client only the new account stage, for example accountStage=registered-not-logged-in or accountStage=logged-in."
      },
      {
        id: "registered-user",
        active: stage === "registered-not-logged-in",
        answer: "Yes, but I am not logged in now.",
        guide:
          "Log in through the official EasyAR development center in the browser. MCP should not receive the website password or SMS/email verification code.",
        mcpAfterUserReturns: [
          `easyar_account_onboarding accountStage=logged-in sampleId=${sample.id}`,
          `easyar_write_account_materials projectPath=${projectPath} sampleId=${sample.id}`
        ],
        browserActions: [
          "Open https://www.easyar.cn/ and enter the development center.",
          "Log in in the browser using the official EasyAR account flow.",
          "Keep passwords and SMS/email verification codes inside the browser only."
        ],
        returnPrompt:
          "After the dashboard is visible, tell the MCP client accountStage=logged-in. Do not paste passwords or verification codes."
      },
      {
        id: "logged-in-user",
        active: stage === "logged-in" || stage === "has-license" || stage === "has-cloud-credentials",
        answer: "Yes, and I can access the development center.",
        guide:
          "Create or locate the EasyAR Sense license, then prepare local project credentials. Cloud Recognition also requires CRS AppId plus API KEY from the account service configuration.",
        mcpAfterUserReturns: [
          `easyar_prepare_unity_project projectPath=${projectPath} sampleId=${sample.id}`,
          `easyar_validate_local_config projectPath=${projectPath}`,
          `easyar_next_workflow_step projectPath=${projectPath} sampleId=${sample.id} platform=${platform}`
        ],
        browserActions: [
          "Create or locate the EasyAR Sense license in the development center.",
          `Confirm the license bundle/package identifier is ${bundleIdentifier} or the real application identifier.`,
          ...(needsCloudRecognition
            ? ["Create or locate the Cloud Recognition/CRS service configuration and copy CRS AppId plus API KEY into the local config file only."]
            : ["Cloud Recognition credentials are not required for this focused sample."]),
          "Download/import only official EasyAR Unity Plugin and sample packages available to the account."
        ],
        returnPrompt:
          "After local files are filled, ask MCP to validate presence with easyar_validate_local_config. Secret values stay in local files or environment variables."
      }
    ],
    mcpConversationRules: [
      "Ask one account-stage question first instead of asking for credentials.",
      "For a new user, recommend accountStage=not-registered and write ACCOUNT_ONBOARDING.md before Unity automation.",
      "Use browser handoff language: register, activate, log in, return.",
      "When the user returns, ask only which stage is now true.",
      "Never ask the user to paste EasyAR passwords, verification codes, licenseKey, appKey, appSecret, or account tokens into chat.",
      "Use easyar_account_materials to show field names, source pages, storage paths, and share policy without storing values."
    ],
    userProvidesToMcp: [
      "Account state only: not-registered, registered-not-logged-in, logged-in, has-license, or has-cloud-credentials.",
      "Unity project path and target sample id.",
      "Presence/status of official materials when asked; secret values stay in local files or secret stores."
    ],
    userNeverProvidesToMcp: [
      "EasyAR website password.",
      "SMS, email, or authenticator verification codes.",
      "Raw appKey, appSecret, API token, or license key in chat."
    ],
    localSecretHandoff: [
      "Run easyar_prepare_unity_project to create ProjectSettings/EasyAR/easyar.local.json.example.",
      "Copy it locally to ProjectSettings/EasyAR/easyar.local.json.",
      "Fill licenseKey, bundleIdentifier, and Cloud Recognition fields in that local file.",
      "Run easyar_validate_local_config; the MCP server reports presence and placeholder problems without printing secret values."
    ],
    sampleSpecific: needsCloudRecognition
      ? [
          "Cloud Recognition needs both the EasyAR Sense license and CRS/Cloud Recognition credentials.",
          "The first runnable Cloud Recognition gate is complete local config plus imported ImageTracking_CloudRecognition sample assets."
        ]
      : [
          "Image Tracking needs the EasyAR Sense license and imported local target/sample assets.",
          "Cloud Recognition credentials are not required for this focused sample."
        ]
  };
}

function deriveAccountOnboardingStage(
  accountStage: "unknown" | "not-registered" | "registered-not-logged-in" | "logged-in" | "has-license" | "has-cloud-credentials",
  auth: ReturnType<typeof readAuthConfig>,
  localConfig: Awaited<ReturnType<typeof buildLocalConfigValidationReport>> | null,
  cloudConfig: Record<string, unknown>,
  needsCloudRecognition: boolean
) {
  if (accountStage !== "unknown") {
    return accountStage;
  }
  if (needsCloudRecognition && hasCompleteCloudRecognitionConfig(cloudConfig)) {
    return "has-cloud-credentials";
  }
  if (localConfig?.checks.some((check) => check.id === "license-key" && check.ok)) {
    return "has-license";
  }
  if (auth.hasToken) {
    return "logged-in";
  }
  return "not-registered";
}

function buildAccountHumanSteps(
  stage: string,
  needsCloudRecognition: boolean,
  bundleIdentifier: string,
  platform: string
) {
  const steps = [
    {
      id: "register",
      requiredWhen: ["not-registered"],
      title: "Register an EasyAR account",
      action: "Open https://www.easyar.cn/ and use the official login/register entry. Activate the account from the registration email if required, then return to MCP with only the updated account stage.",
      doneWhen: "You can open the EasyAR development center with your registered account."
    },
    {
      id: "login",
      requiredWhen: ["not-registered", "registered-not-logged-in"],
      title: "Log in to EasyAR development center",
      action: "Open https://www.easyar.cn/ and enter the Development Center link from the website. Log in there. Do not paste your password or verification code into an MCP client.",
      doneWhen: "The development center dashboard is visible in the browser."
    },
    {
      id: "create-license",
      requiredWhen: ["not-registered", "registered-not-logged-in", "logged-in"],
      title: "Create or locate an EasyAR Sense license key",
      action: `In the development center, create or open the SDK authorization/license entry for ${platform}. Use bundle/package identifier ${bundleIdentifier} when the portal asks for it.`,
      doneWhen: "A license key for the matching EasyAR Sense major version and bundle/package identifier is available."
    },
    {
      id: "download-plugin",
      requiredWhen: ["not-registered", "registered-not-logged-in", "logged-in", "has-license"],
      title: "Download or import the official EasyAR Unity Plugin and samples",
      action: "Use official EasyAR downloads or Unity Package Manager Samples. Import the focused sample into Assets/Samples before Unity validation.",
      doneWhen: "easyar_generate_import_checklist reports the official plugin and focused sample scene are imported."
    },
    ...(needsCloudRecognition
      ? [
          {
            id: "create-cloud-credentials",
            requiredWhen: ["not-registered", "registered-not-logged-in", "logged-in", "has-license"],
            title: "Create or locate Cloud Recognition credentials",
            action: "In the EasyAR development center, create or open the Cloud Recognition/CRS service configuration and copy CRS AppId plus API KEY into the local config file only.",
            doneWhen: "easyar_validate_local_config reports cloudRecognition appId and apiKey are present and not placeholders."
          }
        ]
      : [])
  ];

  return steps.map((step) => ({
    ...step,
    active: step.requiredWhen.includes(stage)
  }));
}

function buildAccountMcpSteps(
  root: string | null,
  sample: SampleInfo,
  platform: "android" | "ios" | "standalone" | "unknown",
  needsCloudRecognition: boolean
) {
  const projectPath = root ?? "/path/to/UnityProject";
  return [
    {
      tool: "easyar_auth_status",
      arguments: {},
      purpose: "Check whether MCP client environment has EasyAR API token and official endpoint configuration."
    },
    {
      tool: "easyar_prepare_unity_project",
      arguments: { projectPath, sampleId: sample.id },
      purpose: "Create easyar.local.json.example, generated runbook, helper scripts, and secret ignore rules."
    },
    {
      tool: "easyar_validate_local_config",
      arguments: { projectPath },
      purpose: needsCloudRecognition
        ? "Check local license and Cloud Recognition credential presence without printing values."
        : "Check local license presence without printing values."
    },
    {
      tool: "easyar_check_official_access",
      arguments: { projectPath, sampleId: sample.id, platform },
      purpose: "Check account/license/download/cloud endpoint readiness when official EasyAR endpoints are configured."
    },
    {
      tool: "easyar_next_workflow_step",
      arguments: { projectPath, sampleId: sample.id, platform },
      purpose: "Continue from the current local evidence after account setup is complete."
    }
  ];
}

function buildAccountOnboardingBlockers(
  stage: string,
  auth: ReturnType<typeof readAuthConfig>,
  localConfig: Awaited<ReturnType<typeof buildLocalConfigValidationReport>> | null,
  cloudConfig: Record<string, unknown>,
  needsCloudRecognition: boolean,
  root: string | null
) {
  const blockers: Array<{ id: string; detail: string; action: string }> = [];
  if (stage === "not-registered") {
    blockers.push({
      id: "easyar-account",
      detail: "No EasyAR account is assumed yet.",
      action: "Register on the official EasyAR website, then log in to the development center."
    });
  }
  if (!auth.hasToken) {
    blockers.push({
      id: "mcp-api-token",
      detail: "EASYAR_API_TOKEN is not configured for account-scoped MCP endpoint calls.",
      action: "After login/API key setup, place an official token in the MCP client environment or secret store."
    });
  }
  if (root && !(localConfig?.checks.find((check) => check.id === "file-exists")?.ok ?? false)) {
    blockers.push({
      id: "local-config-file",
      detail: "ProjectSettings/EasyAR/easyar.local.json does not exist.",
      action: "Run easyar_prepare_unity_project, copy easyar.local.json.example to easyar.local.json, and fill local official values."
    });
  }
  if (root && !(localConfig?.checks.some((check) => check.id === "license-key" && check.ok) ?? false)) {
    blockers.push({
      id: "license-key",
      detail: "EasyAR license key is missing or still a placeholder in local config.",
      action: "Create or copy the EasyAR Sense license key from the official development center into easyar.local.json."
    });
  }
  if (needsCloudRecognition && !hasCompleteCloudRecognitionConfig(cloudConfig)) {
    blockers.push({
      id: "cloud-recognition-credentials",
      detail: "Cloud Recognition appId/apiKey are missing or incomplete.",
      action: "Create or locate Cloud Recognition credentials in the EasyAR development center and fill appId and apiKey locally."
    });
  }
  return blockers;
}

function buildAccountOnboardingNextActions(
  stage: string,
  blockers: Array<{ id: string; detail: string; action: string }>,
  root: string | null,
  sample: SampleInfo,
  platform: "android" | "ios" | "standalone" | "unknown",
  needsCloudRecognition: boolean
) {
  const actions: string[] = [];
  if (stage === "not-registered") {
    actions.push("Register on https://www.easyar.cn/ and activate the account if required.");
  }
  if (stage === "registered-not-logged-in" || stage === "not-registered") {
    actions.push("Log in through the Development Center entry on https://www.easyar.cn/ in the browser, not through MCP.");
  }
  actions.push("Create or locate an EasyAR Sense license key for the app bundle/package identifier.");
  if (needsCloudRecognition) {
    actions.push("Create or locate Cloud Recognition credentials and keep API KEY/API Secret, appKey, and appSecret out of chat and source control.");
  }
  if (root) {
    actions.push(`Run easyar_prepare_unity_project projectPath=${root} sampleId=${sample.id}.`);
    actions.push(`Fill ProjectSettings/EasyAR/easyar.local.json, then run easyar_validate_local_config projectPath=${root}.`);
    actions.push(`Run easyar_check_official_access projectPath=${root} sampleId=${sample.id} platform=${platform}.`);
  } else {
    actions.push("When a Unity project exists, run easyar_prepare_unity_project and easyar_validate_local_config.");
  }
  return Array.from(new Set([...blockers.map((blocker) => blocker.action), ...actions])).slice(0, 12);
}

async function buildAccountMaterialsReport(
  root: string | null,
  sample: SampleInfo,
  platform: "android" | "ios" | "standalone" | "unknown"
) {
  const auth = readAuthConfig();
  const localConfig = root ? await buildLocalConfigValidationReport(root) : null;
  const cloudConfig = root ? await readCloudRecognitionConfig(root) : {};
  const remoteConfig = root ? await readLocalConfigForRemoteValidation(root) : {};
  const localConfigPath = root
    ? path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json")
    : "ProjectSettings/EasyAR/easyar.local.json";
  const bundleIdentifier = remoteConfig.bundleIdentifier ?? defaultBundleIdentifier(sample);
  const needsCloudRecognition = sample.id === "cloud-recognition";
  const licensePresent = localConfig?.checks.some((check) => check.id === "license-key" && check.ok) ?? false;
  const materials = [
    {
      id: "easyar-account",
      label: "EasyAR account",
      required: true,
      present: auth.hasToken || licensePresent || hasCompleteCloudRecognitionConfig(cloudConfig),
      source: "Official EasyAR website registration and development center login.",
      storeIn: "Browser session and EasyAR account only.",
      sharePolicy: "Do not share the password with MCP, Codex, Claude, GitHub issues, or source files.",
      mcpCheck: "easyar_account_onboarding"
    },
    {
      id: "api-token",
      label: "EASYAR_API_TOKEN",
      required: false,
      present: auth.hasToken,
      source: "Official EasyAR development center API Key/token workflow, if official account APIs are enabled for this MCP deployment.",
      storeIn: "MCP client environment, OS keychain, CI secret, or deployment secret store.",
      sharePolicy: "Secret. Never paste into chat or commit. MCP only shows token presence and a redacted preview.",
      mcpCheck: "easyar_auth_status"
    },
    {
      id: "license-key",
      label: "easyar.licenseKey",
      required: true,
      present: licensePresent,
      source: `EasyAR development center SDK authorization/license entry for ${platform}; use bundle/package identifier ${bundleIdentifier}.`,
      storeIn: localConfigPath,
      sharePolicy: "Secret or account-scoped value. Do not commit or paste publicly.",
      mcpCheck: "easyar_validate_local_config"
    },
    {
      id: "bundle-identifier",
      label: "unity.bundleIdentifier",
      required: true,
      present: isNonPlaceholderString(bundleIdentifier),
      source: "Your Unity Player Settings package name/bundle identifier and the matching EasyAR license configuration.",
      storeIn: localConfigPath,
      sharePolicy: "Usually safe to share, but still avoid exposing private unreleased app identifiers in public issues if sensitive.",
      mcpCheck: "easyar_validate_local_config"
    },
    ...(needsCloudRecognition
      ? [
          {
            id: "cloud-app-id",
            label: "easyar.cloudRecognition.appId",
            required: true,
            present: isNonPlaceholderString(cloudConfig.appId),
            source: "EasyAR development center Cloud Recognition/CRS service configuration.",
            storeIn: localConfigPath,
            sharePolicy: "Treat as sensitive account-scoped config. MCP reports presence only.",
            mcpCheck: "easyar_validate_local_config"
          },
          {
            id: "cloud-api-key",
            label: "easyar.cloudRecognition.apiKey",
            required: true,
            present: isNonPlaceholderString(cloudConfig.apiKey) || isNonPlaceholderString(cloudConfig.appKey),
            source: "EasyAR development center Cloud Recognition/CRS API KEY. Sense 4.1+ uses APPID + API KEY.",
            storeIn: localConfigPath,
            sharePolicy: "Secret. Never paste into chat, logs, GitHub issues, or source code.",
            mcpCheck: "easyar_validate_local_config"
          },
          {
            id: "cloud-api-secret",
            label: "easyar.cloudRecognition.apiSecret",
            required: false,
            present: isNonPlaceholderString(cloudConfig.apiSecret) || isNonPlaceholderString(cloudConfig.appSecret),
            source: "EasyAR development center Cloud Recognition/CRS API Secret when available for management or legacy integrations.",
            storeIn: localConfigPath,
            sharePolicy: "Secret. Never paste into chat, logs, GitHub issues, or source code.",
            mcpCheck: "easyar_validate_local_config"
          },
          {
            id: "cloud-app-key-legacy",
            label: "easyar.cloudRecognition.appKey",
            required: false,
            present: isNonPlaceholderString(cloudConfig.appKey),
            source: "Legacy alias for Cloud Recognition API Key. Prefer easyar.cloudRecognition.apiKey for Sense 4.1+ APPID + API KEY.",
            storeIn: localConfigPath,
            sharePolicy: "Secret. Never paste into chat, logs, GitHub issues, or source code.",
            mcpCheck: "easyar_validate_local_config"
          },
          {
            id: "cloud-app-secret-legacy",
            label: "easyar.cloudRecognition.appSecret",
            required: false,
            present: isNonPlaceholderString(cloudConfig.appSecret),
            source: "Legacy alias for Cloud Recognition API Secret when available.",
            storeIn: localConfigPath,
            sharePolicy: "Secret. Never paste into chat, logs, GitHub issues, or source code.",
            mcpCheck: "easyar_validate_local_config"
          }
        ]
      : [])
  ];
  const missingRequired = materials.filter((item) => item.required && !item.present);
  const nextActions = missingRequired.length > 0
    ? Array.from(new Set(missingRequired.map((item) => accountMaterialNextAction(item, localConfigPath))))
    : [
        root
          ? `Run easyar_validate_local_config projectPath=${root}.`
          : "Run easyar_validate_local_config once a Unity project path is available.",
        root
          ? `Run easyar_check_official_access projectPath=${root} sampleId=${sample.id} platform=${platform}.`
          : "Run easyar_check_official_access once a Unity project path is available."
      ];

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    platform,
    localConfigPath,
    needsCloudRecognition,
    readyForLocalConfigValidation: missingRequired.length === 0,
    materials,
    missingRequired: missingRequired.map((item) => item.id),
    nextActions,
    security: "This report never includes secret values. It lists field names, presence, source, storage location, and share policy only."
  };
}

function accountMaterialNextAction(
  item: {
    id: string;
    label: string;
    storeIn: string;
  },
  localConfigPath: string
): string {
  if (item.id === "easyar-account") {
    return "Register or log in at https://www.easyar.cn/ in the browser, then return to MCP with only the updated account stage.";
  }
  if (item.id === "license-key") {
    return `Create or locate the EasyAR Sense license in the official account and fill easyar.licenseKey in ${localConfigPath}.`;
  }
  if (item.id.startsWith("cloud-")) {
    return `Create or locate the Cloud Recognition/CRS credentials in the official account and fill the required cloud fields in ${localConfigPath}.`;
  }
  if (item.id === "bundle-identifier") {
    return `Choose the Unity package/bundle identifier and make it match the EasyAR license configuration in ${localConfigPath}.`;
  }
  return `Prepare ${item.label} from the official EasyAR account flow and store it in ${item.storeIn}.`;
}

function buildOfficialApiContract(baseUrl: string | undefined, includeExamples: boolean) {
  const auth = readAuthConfig();
  const resolvedBaseUrl = baseUrl ?? auth.apiBaseUrl;
  const endpoints = [
    officialApiEndpointContract({
      baseUrl: resolvedBaseUrl,
      id: "account-status",
      envName: "EASYAR_ACCOUNT_STATUS_ENDPOINT",
      configured: auth.accountStatusEndpointConfigured,
      method: "GET",
      path: "/mcp/account/status",
      purpose: "Confirm the bearer token belongs to a registered EasyAR user and return non-secret account entitlement metadata.",
      requestFields: [],
      requiredResponseFields: ["ok", "account.id", "account.registered", "account.status", "entitlements"],
      optionalResponseFields: ["account.emailMasked", "account.displayName", "plans", "organization", "expiresAt"],
      usedByTools: ["easyar_check_account", "easyar_check_official_access", "easyar_onboarding_report"]
    }),
    officialApiEndpointContract({
      baseUrl: resolvedBaseUrl,
      id: "license-validation",
      envName: "EASYAR_LICENSE_VALIDATE_ENDPOINT",
      configured: auth.licenseValidationEndpointConfigured,
      method: "POST",
      path: "/mcp/license/validate",
      purpose: "Validate that a local EasyAR Sense license key is usable for the requested Unity bundle identifier and platform.",
      requestFields: ["licenseKey", "bundleIdentifier", "platform"],
      requiredResponseFields: ["ok", "license.valid", "license.product", "license.bundleIdentifierMatches", "license.platformAllowed"],
      optionalResponseFields: ["license.expiresAt", "license.edition", "license.features", "license.message"],
      usedByTools: ["easyar_validate_license", "easyar_check_official_access", "easyar_write_focused_preflight"]
    }),
    officialApiEndpointContract({
      baseUrl: resolvedBaseUrl,
      id: "downloads-discovery",
      envName: "EASYAR_DOWNLOADS_ENDPOINT",
      configured: auth.downloadsEndpointConfigured,
      method: "POST",
      path: "/mcp/downloads",
      purpose: "Return account-authorized EasyAR SDK, Unity Plugin, and sample package metadata without bypassing official download permissions.",
      requestFields: ["sampleId", "packageKind", "unityVersion"],
      requiredResponseFields: ["ok", "packages"],
      optionalResponseFields: ["packages[].name", "packages[].version", "packages[].url", "packages[].sha256", "packages[].releaseNotesUrl"],
      usedByTools: ["easyar_discover_downloads", "easyar_check_official_access", "easyar_generate_sample_import_guide"]
    }),
    officialApiEndpointContract({
      baseUrl: resolvedBaseUrl,
      id: "cloud-credentials-discovery",
      envName: "EASYAR_CLOUD_CREDENTIALS_ENDPOINT",
      configured: auth.cloudCredentialsEndpointConfigured,
      method: "POST",
      path: "/mcp/cloud-recognition/credentials",
      purpose: "Return Cloud Recognition app metadata and presence flags for the registered user without returning raw API KEY/API Secret values.",
      requestFields: ["sampleId", "bundleIdentifier", "platform"],
      requiredResponseFields: ["ok", "cloudRecognition.appId", "cloudRecognition.apiKeyPresent"],
      optionalResponseFields: ["cloudRecognition.apiSecretPresent", "cloudRecognition.appKeyPresent", "cloudRecognition.appSecretPresent", "cloudRecognition.serviceRegion", "cloudRecognition.targetLibraryCount", "cloudRecognition.dashboardUrl"],
      usedByTools: ["easyar_discover_cloud_credentials", "easyar_check_official_access", "easyar_account_materials"]
    })
  ];
  const environment = {
    baseUrl: resolvedBaseUrl,
    tokenEnvName: "EASYAR_API_TOKEN",
    tokenConfigured: auth.hasToken,
    required: [
      "EASYAR_API_BASE_URL",
      "EASYAR_API_TOKEN",
      "EASYAR_ACCOUNT_STATUS_ENDPOINT",
      "EASYAR_LICENSE_VALIDATE_ENDPOINT",
      "EASYAR_DOWNLOADS_ENDPOINT",
      "EASYAR_CLOUD_CREDENTIALS_ENDPOINT"
    ],
    configured: {
      EASYAR_API_TOKEN: auth.hasToken,
      EASYAR_ACCOUNT_STATUS_ENDPOINT: auth.accountStatusEndpointConfigured,
      EASYAR_LICENSE_VALIDATE_ENDPOINT: auth.licenseValidationEndpointConfigured,
      EASYAR_DOWNLOADS_ENDPOINT: auth.downloadsEndpointConfigured,
      EASYAR_CLOUD_CREDENTIALS_ENDPOINT: auth.cloudCredentialsEndpointConfigured
    }
  };
  const readyForProductionOfficialAccess = auth.hasToken && endpoints.every((endpoint) => endpoint.configured);
  return {
    generatedAt: new Date().toISOString(),
    server: {
      name: serverName,
      version: serverVersion,
      purpose: "Official EasyAR MCP service for registered users running EasyAR Unity samples and Unity project programming workflows."
    },
    environment,
    authentication: {
      scheme: "Bearer token",
      header: "Authorization: Bearer ${EASYAR_API_TOKEN}",
      tokenSource: "Official EasyAR registered-user account token, stored in MCP client environment or secret storage.",
      tokenPolicy: [
        "Do not paste tokens into chat.",
        "Do not commit tokens to GitHub.",
        "Do not return tokens in API responses, logs, issue reports, or MCP tool output.",
        "Prefer short-lived or revocable tokens for production clients."
      ]
    },
    endpoints,
    examples: includeExamples ? buildOfficialApiContractExamples(resolvedBaseUrl) : [],
    responsePolicy: [
      "Responses may include account metadata, package metadata, and presence flags.",
      "Responses must not include raw license keys, API tokens, API keys, API secrets, appKey, appSecret, passwords, verification codes, signing keys, or provisioning profiles.",
      "If a backend must report sensitive material existence, return boolean presence flags and dashboard URLs instead of values.",
      "Use non-2xx status codes plus redacted JSON error bodies for unauthorized, expired, unlicensed, and entitlement failures."
    ],
    productionChecklist: [
      "Configure all endpoint env vars to official HTTPS EasyAR APIs.",
      "Validate CORS/network policy for local MCP clients if endpoints are proxied.",
      "Ensure every endpoint authorizes by account token and entitlements.",
      "Run easyar_check_official_access for image-tracking and cloud-recognition.",
      "Run easyar_write_deployment_readiness and keep blockers at zero before release."
    ],
    readyForProductionOfficialAccess,
    security: "This contract is schema and deployment guidance only. It intentionally contains no EasyAR account token, license key, API key, API secret, appKey, appSecret, or user password."
  };
}

function officialApiEndpointContract(input: {
  baseUrl: string;
  id: string;
  envName: string;
  configured: boolean;
  method: "GET" | "POST";
  path: string;
  purpose: string;
  requestFields: string[];
  requiredResponseFields: string[];
  optionalResponseFields: string[];
  usedByTools: string[];
}) {
  const { baseUrl, ...endpoint } = input;
  return {
    ...endpoint,
    expectedUrl: `${baseUrl}${input.path}`,
    authorization: "Required bearer token from EASYAR_API_TOKEN",
    timeoutMs: 10000,
    secretHandling: "Accept secret request fields only when needed for validation, never echo them back, and return only redacted metadata."
  };
}

function buildOfficialApiHandoff(baseUrl: string | undefined, includeCurl: boolean, deploymentTarget: string | undefined) {
  const contract = buildOfficialApiContract(baseUrl, true);
  const endpointMapping = contract.endpoints.map((endpoint) => ({
    id: endpoint.id,
    envName: endpoint.envName,
    method: endpoint.method,
    expectedUrl: endpoint.expectedUrl,
    purpose: endpoint.purpose,
    backendOwnerTodo: officialApiBackendTodo(endpoint.id),
    requestFields: endpoint.requestFields,
    requiredResponseFields: endpoint.requiredResponseFields,
    usedByTools: endpoint.usedByTools,
    canaryCommand: includeCurl ? officialApiCanaryCommand(endpoint) : null,
    acceptance: officialApiEndpointAcceptance(endpoint.id)
  }));
  const acceptanceGates = [
    "All required endpoint environment variables are set in the MCP runtime environment.",
    "Every endpoint requires Authorization: Bearer ${EASYAR_API_TOKEN} and rejects missing, expired, or unauthorized tokens.",
    "easyar_check_account returns configured=true and ok=true for a registered EasyAR test account.",
    "easyar_validate_license validates the local EasyAR Sense license for the Unity bundle/package identifier without echoing the license key.",
    "easyar_discover_downloads returns only account-authorized package metadata and never bypasses EasyAR download gates.",
    "easyar_discover_cloud_credentials returns appId and presence flags, never raw API KEY/API Secret, appKey, or appSecret values.",
    "easyar_check_official_access passes for image-tracking and cloud-recognition using the same deployment environment.",
    "easyar_write_deployment_readiness has no official endpoint blockers.",
    "Fixture smoke remains green, then a real staging/prod canary run is recorded in OFFICIAL_ACCESS.md."
  ];
  return {
    generatedAt: new Date().toISOString(),
    deploymentTarget: deploymentTarget ?? "unspecified",
    server: {
      name: serverName,
      version: serverVersion,
      repository: "https://github.com/terri1982/mcp-easyar"
    },
    environment: contract.environment,
    endpointMapping,
    rollout: [
      "Confirm the EasyAR account system can issue or validate a registered-user bearer token for MCP clients.",
      "Map existing EasyAR account/license/download/cloud services to the four MCP endpoint contracts.",
      "Deploy endpoints first to staging or an internal environment and set the matching MCP env vars there.",
      "Run canary commands with a registered test account, a valid EasyAR Sense license, and a Cloud Recognition test app.",
      "Run easyar_check_official_access for image-tracking and cloud-recognition.",
      "Only after staging passes, configure production env vars for the published MCP deployment."
    ],
    acceptanceGates,
    failurePolicy: [
      "Return 401/403 for invalid, expired, unregistered, unlicensed, or entitlement-missing accounts.",
      "Return redacted JSON errors with stable error codes; do not return raw secrets or private account data.",
      "Rate-limit repeated failed validation attempts by account/token and endpoint.",
      "If an endpoint is unavailable, MCP must report configured=false or ok=false and stop before private downloads or Cloud Recognition setup.",
      "Do not fall back to scraping EasyAR website sessions or bypassing login/download gates."
    ],
    artifactsToRegenerate: [
      "docs/OFFICIAL_API_CONTRACT.md",
      "docs/OFFICIAL_API_HANDOFF.md",
      "Assets/EasyARGenerated/<sampleId>/OFFICIAL_ACCESS.md",
      "Assets/EasyARGenerated/DEPLOYMENT_READINESS.md",
      "Assets/EasyARGenerated/PRODUCTION_VALIDATION.md",
      "Assets/EasyARGenerated/REMAINING_WORK.md"
    ],
    nextActions: [
      "Assign backend owners for account-status, license-validation, downloads-discovery, and cloud-credentials-discovery.",
      "Populate EASYAR_ACCOUNT_STATUS_ENDPOINT, EASYAR_LICENSE_VALIDATE_ENDPOINT, EASYAR_DOWNLOADS_ENDPOINT, and EASYAR_CLOUD_CREDENTIALS_ENDPOINT in a staging MCP environment.",
      "Run node scripts/official-api-fixture-smoke.mjs, then run real endpoint canaries with a registered EasyAR test account.",
      "Run easyar_write_official_access_report for image-tracking and cloud-recognition after endpoints are configured."
    ],
    security: "This handoff contains endpoint names, request/response schemas, and non-secret canary templates only. It must not contain EasyAR passwords, verification codes, account tokens, license keys, API keys, API secrets, appKey, appSecret, signing keys, or private user data."
  };
}

function officialApiBackendTodo(endpointId: string): string {
  if (endpointId === "account-status") {
    return "Bind token validation to the official EasyAR registered-user account system and return non-secret account/entitlement metadata.";
  }
  if (endpointId === "license-validation") {
    return "Validate a supplied local EasyAR Sense license against account entitlement, product, platform, and Unity bundle/package identifier.";
  }
  if (endpointId === "downloads-discovery") {
    return "Return only authorized SDK/plugin/sample package metadata for the registered account without granting unauthorized downloads.";
  }
  if (endpointId === "cloud-credentials-discovery") {
    return "Return Cloud Recognition app metadata and API KEY presence flags without returning raw API KEY/API Secret values.";
  }
  return "Map this endpoint to an authorized official EasyAR backend service.";
}

function officialApiEndpointAcceptance(endpointId: string): string[] {
  if (endpointId === "account-status") {
    return [
      "Valid registered-user token returns ok=true and account.registered=true.",
      "Unregistered or expired token returns 401/403 with a redacted error body."
    ];
  }
  if (endpointId === "license-validation") {
    return [
      "Valid license/bundle/platform returns license.valid=true and bundleIdentifierMatches=true.",
      "Invalid license, wrong bundle id, or disallowed platform returns ok=false or 403 without echoing the license key."
    ];
  }
  if (endpointId === "downloads-discovery") {
    return [
      "Authorized account returns EasyAR Unity Plugin/sample metadata needed by focused workflows.",
      "Unauthorized package requests return 403 and no private download URL."
    ];
  }
  if (endpointId === "cloud-credentials-discovery") {
    return [
      "Configured Cloud Recognition app returns appId plus apiKeyPresent and optional apiSecretPresent flags.",
      "Response never includes raw API KEY/API Secret, appKey, or appSecret values."
    ];
  }
  return ["Endpoint passes its required response fields and redaction policy."];
}

function officialApiCanaryCommand(endpoint: ReturnType<typeof officialApiEndpointContract>): string {
  const url = `\${${endpoint.envName}}`;
  const tokenRef = "$" + "{EASYAR_API_TOKEN}";
  if (endpoint.method === "GET") {
    return `curl -fsS -H "Authorization: Bearer ${tokenRef}" "${url}"`;
  }
  const body = endpoint.id === "license-validation"
    ? "{\"licenseKey\":\"${EASYAR_TEST_LICENSE_KEY}\",\"bundleIdentifier\":\"com.easyar.testsample\",\"platform\":\"android\"}"
    : endpoint.id === "downloads-discovery"
      ? "{\"sampleId\":\"image-tracking\",\"packageKind\":\"unity-samples\",\"unityVersion\":\"6000.4.7f1\"}"
      : endpoint.id === "cloud-credentials-discovery"
        ? "{\"sampleId\":\"cloud-recognition\",\"bundleIdentifier\":\"com.easyar.testsample\",\"platform\":\"android\"}"
        : "{}";
  return `curl -fsS -X POST -H "Authorization: Bearer ${tokenRef}" -H "Content-Type: application/json" -d '${body}' "${url}"`;
}

function buildOfficialApiContractExamples(baseUrl: string) {
  return [
    {
      endpoint: "license-validation",
      request: {
        method: "POST",
        url: `${baseUrl}/mcp/license/validate`,
        body: {
          licenseKey: "<local EasyAR license key>",
          bundleIdentifier: "com.example.easyar.sample",
          platform: "android"
        }
      },
      response: {
        ok: true,
        license: {
          valid: true,
          product: "EasyAR Sense Unity Plugin",
          bundleIdentifierMatches: true,
          platformAllowed: true,
          features: ["image-tracking", "cloud-recognition"]
        }
      }
    },
    {
      endpoint: "cloud-credentials-discovery",
      request: {
        method: "POST",
        url: `${baseUrl}/mcp/cloud-recognition/credentials`,
        body: {
          sampleId: "cloud-recognition",
          bundleIdentifier: "com.example.easyar.sample",
          platform: "android"
        }
      },
      response: {
        ok: true,
        cloudRecognition: {
          appId: "<app id or masked app id>",
          apiKeyPresent: true,
          apiSecretPresent: true,
          appKeyPresent: true,
          appSecretPresent: true,
          serviceRegion: "configured"
        }
      }
    }
  ];
}

async function buildOfficialAccessReport(
  root: string,
  sample: SampleInfo,
  platform: "android" | "ios" | "standalone" | "unknown",
  packageKind: "unity-plugin" | "unity-samples" | "native-sdk" | "xr-extension" | "unknown"
) {
  const auth = readAuthConfig();
  const unityVersion = await readUnityVersion(root);
  const localConfig = await readLocalConfigForRemoteValidation(root);
  const [account, license, downloads, cloudCredentials] = await Promise.all([
    easyarApi.checkAccount(),
    easyarApi.validateLicense({
      licenseKey: localConfig.licenseKey,
      bundleIdentifier: localConfig.bundleIdentifier,
      platform
    }),
    easyarApi.discoverDownloads({
      sampleId: sample.id,
      packageKind,
      unityVersion
    }),
    sample.id === "cloud-recognition"
      ? easyarApi.discoverCloudCredentials({
          sampleId: sample.id,
          bundleIdentifier: localConfig.bundleIdentifier,
          platform
        })
      : Promise.resolve(null)
  ]);
  const checks = [
    officialAccessCheck("api-token", auth.hasToken, true, "EASYAR_API_TOKEN is configured for official account-scoped requests.", auth.hasToken ? "Token is present and redacted." : "EASYAR_API_TOKEN is missing."),
    officialAccessRemoteCheck("account-status", true, account),
    officialAccessRemoteCheck("license-validation", true, license),
    officialAccessRemoteCheck("downloads-discovery", true, downloads),
    ...(cloudCredentials
      ? [officialAccessRemoteCheck("cloud-credentials-discovery", true, cloudCredentials)]
      : [officialAccessCheck("cloud-credentials-discovery", true, false, "Cloud Recognition credential discovery is not required for Image Tracking.", "Skipped for this sample.")])
  ];
  const blockers = checks.filter((check) => check.required && !check.ok);

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    platform,
    packageKind,
    unityVersion,
    input: {
      hasLicenseKey: Boolean(localConfig.licenseKey),
      bundleIdentifier: localConfig.bundleIdentifier ?? null
    },
    auth: {
      apiBaseUrl: auth.apiBaseUrl,
      hasToken: auth.hasToken,
      accountStatusEndpointConfigured: auth.accountStatusEndpointConfigured,
      licenseValidationEndpointConfigured: auth.licenseValidationEndpointConfigured,
      downloadsEndpointConfigured: auth.downloadsEndpointConfigured,
      cloudCredentialsEndpointConfigured: auth.cloudCredentialsEndpointConfigured
    },
    readyForOfficialContent: blockers.length === 0,
    checks,
    blockers,
    remoteResults: {
      account,
      license,
      downloads,
      cloudCredentials
    },
    nextActions: blockers.length > 0
      ? Array.from(new Set(blockers.flatMap((blocker) => blocker.nextActions)))
      : [
          "Official account, license, downloads, and sample-specific official access checks passed.",
          "Continue with easyar_generate_import_checklist after importing official packages into Unity."
        ],
    security: "EASYAR_API_TOKEN, licenseKey, appKey, appSecret, and credential values are never returned. This report only calls configured official EasyAR endpoints and does not bypass authorization."
  };
}

function officialAccessCheck(id: string, ok: boolean, required: boolean, summary: string, detail: string) {
  return {
    id,
    ok,
    required,
    configured: ok,
    statusCode: null as number | null,
    summary,
    detail,
    nextActions: ok
      ? ["Continue with focused EasyAR workflow checks."]
      : ["Configure the official EasyAR endpoint/token environment for this MCP server."]
  };
}

function officialAccessRemoteCheck(id: string, required: boolean, result: Awaited<ReturnType<typeof easyarApi.checkAccount>>) {
  const ok = result.configured && result.ok === true;
  return {
    id,
    ok,
    required,
    configured: result.configured,
    statusCode: result.statusCode,
    summary: result.summary,
    detail: result.endpoint ? `Endpoint: ${result.endpoint}` : "Endpoint is not configured.",
    nextActions: result.nextActions
  };
}

async function buildClientSetupReport(
  client: typeof clientKinds[number],
  entrypointMode: typeof clientEntrypointModes[number],
  serverPath: string | undefined,
  includeTokenPlaceholder: boolean
) {
  const packageJson = await readPackageMetadata();
  const launch = buildClientLaunch(entrypointMode, serverPath);
  const entrypoint = launch.entrypoint ? path.resolve(process.cwd(), launch.entrypoint) : null;
  const distEntrypoint = path.resolve(process.cwd(), "dist", "index.js");
  const auth = readAuthConfig();
  const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
  const env = {
    EASYAR_API_BASE_URL: process.env.EASYAR_API_BASE_URL ?? "https://www.easyar.cn",
    EASYAR_ACCOUNT_STATUS_ENDPOINT: process.env.EASYAR_ACCOUNT_STATUS_ENDPOINT ?? "https://www.easyar.cn/path/to/official/account/status",
    EASYAR_LICENSE_VALIDATE_ENDPOINT: process.env.EASYAR_LICENSE_VALIDATE_ENDPOINT ?? "https://www.easyar.cn/path/to/official/license/validate",
    EASYAR_DOWNLOADS_ENDPOINT: process.env.EASYAR_DOWNLOADS_ENDPOINT ?? "https://www.easyar.cn/path/to/official/downloads",
    EASYAR_CLOUD_CREDENTIALS_ENDPOINT: process.env.EASYAR_CLOUD_CREDENTIALS_ENDPOINT ?? "https://www.easyar.cn/path/to/official/cloud-recognition/credentials",
    ...(includeTokenPlaceholder ? { EASYAR_API_TOKEN: "your_registered_user_token" } : {})
  };
  const checks = [
    clientSetupCheck("node-version", nodeMajor >= 20, true, `Current Node.js version is ${process.versions.node}; mcp-easyar requires >=20.`),
    clientSetupCheck("package-name", packageJson.name === serverName, true, `package.json name is ${packageJson.name ?? "missing"}; expected ${serverName}.`),
    clientSetupCheck("bin-name", packageJson.binName === "easyar-mcp", true, `package.json bin is ${packageJson.binName ?? "missing"}; expected easyar-mcp.`),
    clientSetupCheck("entrypoint-mode", clientEntrypointModes.includes(entrypointMode), true, `Entrypoint mode is ${entrypointMode}.`),
    clientSetupCheck("dist-entrypoint", entrypointMode !== "local-dist" || await exists(distEntrypoint), true, entrypointMode === "local-dist" ? `${path.relative(process.cwd(), distEntrypoint)} exists. Run npm run build if missing.` : "Not required for package-bin or npx entrypoint mode."),
    clientSetupCheck("server-path-absolute", entrypointMode !== "local-dist" || Boolean(entrypoint && path.isAbsolute(entrypoint)), true, entrypoint ? `Resolved server path is ${entrypoint}.` : "No local server path is required for this entrypoint mode."),
    clientSetupCheck("server-path-exists", entrypointMode !== "local-dist" || Boolean(entrypoint && await exists(entrypoint)), true, entrypoint ? `Configured server path ${entrypoint} exists.` : "No local server path is required for this entrypoint mode."),
    clientSetupCheck("api-base-url", Boolean(auth.apiBaseUrl), true, `EASYAR_API_BASE_URL resolves to ${auth.apiBaseUrl}.`),
    clientSetupCheck("api-token-placeholder", includeTokenPlaceholder || auth.hasToken, false, includeTokenPlaceholder ? "Generated config includes EASYAR_API_TOKEN placeholder." : "Generated config omits token placeholder; set token through client secret/env configuration."),
    clientSetupCheck("official-endpoints", auth.accountStatusEndpointConfigured && auth.licenseValidationEndpointConfigured && auth.downloadsEndpointConfigured && auth.cloudCredentialsEndpointConfigured, false, "Official account, license, downloads, and Cloud Recognition endpoint environment variables are configured.")
  ];
  const blockers = checks.filter((check) => check.required && !check.ok);
  const warnings = checks.filter((check) => !check.required && !check.ok);
  const config = buildClientConfig(client, launch, env);

  return {
    generatedAt: new Date().toISOString(),
    client,
    entrypointMode,
    command: launch.command,
    args: launch.args,
    serverPath: entrypoint,
    package: {
      name: packageJson.name,
      version: packageJson.version,
      binName: packageJson.binName,
      repository: packageJson.repository
    },
    node: {
      version: process.versions.node,
      required: ">=20"
    },
    readyForClientConnection: blockers.length === 0,
    checks,
    blockers,
    warnings,
    env: {
      apiBaseUrl: env.EASYAR_API_BASE_URL,
      hasTokenPlaceholder: "EASYAR_API_TOKEN" in env,
      accountStatusEndpointConfigured: auth.accountStatusEndpointConfigured,
      licenseValidationEndpointConfigured: auth.licenseValidationEndpointConfigured,
      downloadsEndpointConfigured: auth.downloadsEndpointConfigured,
      cloudCredentialsEndpointConfigured: auth.cloudCredentialsEndpointConfigured
    },
    config,
    configDestination: clientConfigDestination(client),
    acceptanceChecklist: buildClientAcceptanceChecklist(client, entrypointMode),
    firstSmokeCalls: buildClientFirstSmokeCalls(),
    troubleshooting: buildClientTroubleshooting(client, entrypointMode),
    nextActions: blockers.length > 0
      ? Array.from(new Set(blockers.map((blocker) => clientSetupAction(blocker.id))))
      : [
          "Paste the generated config into the selected MCP client.",
          "Replace placeholder token and endpoint values with local official EasyAR credentials.",
          "Restart the MCP client and call easyar_server_status.",
          "Run the first smoke calls listed in CLIENT_SETUP.md before trying Unity automation."
        ],
    security: "Do not commit MCP client config files containing EASYAR_API_TOKEN, license keys, Cloud Recognition credentials, signing keys, or provisioning secrets."
  };
}

function clientConfigDestination(client: typeof clientKinds[number]): string {
  if (client === "claude-desktop") {
    return "Claude Desktop MCP settings JSON, usually claude_desktop_config.json.";
  }
  if (client === "codex") {
    return "Codex MCP configuration for this workspace or user profile.";
  }
  return "Any stdio MCP client configuration that accepts command, args, and env fields.";
}

function buildClientAcceptanceChecklist(client: typeof clientKinds[number], entrypointMode: typeof clientEntrypointModes[number]) {
  return [
    "The generated config is pasted into the selected client config location.",
    "Real EasyAR endpoint and token values are stored in client environment/secret storage, not committed files.",
    entrypointMode === "local-dist"
      ? "The local repository has run npm install and npm run build; dist/index.js exists at the configured absolute path."
      : entrypointMode === "package-bin"
        ? "The easyar-mcp binary is available on the PATH used by the MCP client."
        : "The client machine can run npx -y mcp-easyar with network access to the npm registry.",
    `${client} has been restarted after editing MCP configuration.`,
    "easyar_server_status returns server name mcp-easyar and lists focused samples.",
    "easyar_auth_status reports only presence/redacted endpoint state and does not print secret values.",
    "easyar_account_onboarding or easyar_write_local_config_handoff is the first user-facing EasyAR workflow call."
  ];
}

function buildClientFirstSmokeCalls() {
  return [
    "easyar_server_status",
    "easyar_auth_status",
    "easyar_list_samples",
    "easyar_account_onboarding accountStage=not-registered sampleId=cloud-recognition",
    "easyar_check_client_setup"
  ];
}

function buildClientTroubleshooting(client: typeof clientKinds[number], entrypointMode: typeof clientEntrypointModes[number]) {
  return [
    "If the client cannot start the server, copy the Command and Args from this report and run them in a terminal.",
    entrypointMode === "local-dist"
      ? "If local-dist fails, rerun npm install && npm run build and confirm the serverPath is absolute."
      : entrypointMode === "package-bin"
        ? "If package-bin fails, run easyar-mcp-check from the same shell environment used to launch the MCP client."
        : "If npx fails, check npm registry access and try npx -y mcp-easyar in a terminal.",
    "If tools/list is empty, restart the MCP client and verify the JSON nesting under mcpServers/easyar.",
    "If account calls fail, check EASYAR_API_TOKEN and official endpoint env vars in the MCP client environment.",
    `${client} logs should be inspected only for startup errors; remove any copied private token or license values before sharing logs.`
  ];
}

function clientSetupCheck(id: string, ok: boolean, required: boolean, detail: string) {
  return {
    id,
    ok,
    required,
    detail
  };
}

function clientSetupAction(id: string): string {
  if (id === "node-version") {
    return "Install or select Node.js 20+ before running the MCP server.";
  }
  if (id === "dist-entrypoint" || id === "server-path-exists") {
    return "Run npm install && npm run build, then pass the absolute dist/index.js path to easyar_generate_client_config.";
  }
  if (id === "package-name" || id === "bin-name") {
    return "Use the mcp-easyar repository/package, not an old renamed checkout.";
  }
  return "Review the generated client setup report and rerun easyar_check_client_setup.";
}

async function buildReleaseManifest() {
  const packageJson = await readPackageMetadata();
  const requiredFiles = [
    "README.md",
    ".env.example",
    "CHANGELOG.md",
    "LICENSE",
    "SECURITY.md",
    "docs/quickstart.md",
    "docs/OFFICIAL_API_CONTRACT.md",
    "docs/OFFICIAL_API_HANDOFF.md",
    "docs/RELEASE_MANIFEST.md",
    "docs/troubleshooting.md",
    "assets/easyar-icon.png",
    "dist/index.js",
    "dist/easyar-api.js",
    ".github/ISSUE_TEMPLATE/focused-sample-run.yml",
    ".github/workflows/ci.yml"
  ];
  const requiredFileStatuses = await Promise.all(requiredFiles.map(async (relativePath) => ({
    path: relativePath,
    exists: await exists(path.join(process.cwd(), relativePath))
  })));
  const missingRequiredFiles = requiredFileStatuses.filter((file) => !file.exists).map((file) => file.path);
  const packageText = await readFile(path.join(process.cwd(), "package.json"), "utf8");
  const parsedPackage = JSON.parse(packageText) as {
    description?: string;
    engines?: Record<string, string>;
    scripts?: Record<string, string>;
    keywords?: string[];
    files?: string[];
  };
  const binName = packageJson.binName ?? "easyar-mcp";
  const installCommands = [
    "npm install",
    "npm run build",
    "npm start"
  ];
  const installProfiles = [
    {
      id: "local-clone",
      label: "Local Git clone",
      commands: ["npm install", "npm run build"],
      entrypointMode: "local-dist",
      clientConfigCall: "easyar_generate_client_config client=claude-desktop entrypointMode=local-dist serverPath=/absolute/path/to/mcp-easyar/dist/index.js"
    },
    {
      id: "global-package",
      label: "Global npm package",
      commands: [`npm install -g ${packageJson.name ?? serverName}`],
      entrypointMode: "package-bin",
      clientConfigCall: "easyar_generate_client_config client=claude-desktop entrypointMode=package-bin"
    },
    {
      id: "npx-package",
      label: "npx package",
      commands: [`npx -y ${packageJson.name ?? serverName}`],
      entrypointMode: "npx",
      clientConfigCall: "easyar_generate_client_config client=claude-desktop entrypointMode=npx"
    }
  ];
  const verificationCommands = [
    "npm run typecheck",
    "npm test",
    "npm run bin:smoke",
    "npm run install:check",
    "npm run package:smoke",
    "npm run pack:check"
  ];
  const mcpEntrypoints = [
    {
      label: "Built dist entrypoint",
      command: "node",
      args: [path.resolve(process.cwd(), "dist", "index.js")]
    },
    {
      label: "Package bin",
      command: binName,
      args: []
    },
    {
      label: "Install check",
      command: "easyar-mcp-check",
      args: []
    },
    {
      label: "npx package",
      command: "npx",
      args: ["-y", packageJson.name ?? serverName]
    }
  ];

  return {
    generatedAt: new Date().toISOString(),
    package: {
      name: packageJson.name,
      version: packageJson.version,
      description: parsedPackage.description ?? null,
      binName,
      repository: packageJson.repository,
      homepage: "https://github.com/terri1982/mcp-easyar#readme",
      node: parsedPackage.engines?.node ?? ">=20",
      keywords: parsedPackage.keywords ?? []
    },
    focusedScope: {
      focusedSamples: focusedSamples().map((sample) => sample.id),
      deferredSamples: deferredSamples().map((sample) => sample.id)
    },
    installCommands,
    installProfiles,
    verificationCommands,
    mcpEntrypoints,
    clientSetupTools: [
      "easyar_generate_client_config",
      "easyar_check_client_setup",
      "easyar_write_client_setup"
    ],
    requiredEnvironment: [
      "EASYAR_API_BASE_URL",
      "EASYAR_API_TOKEN",
      "EASYAR_ACCOUNT_STATUS_ENDPOINT",
      "EASYAR_LICENSE_VALIDATE_ENDPOINT",
      "EASYAR_DOWNLOADS_ENDPOINT",
      "EASYAR_CLOUD_CREDENTIALS_ENDPOINT",
      "EASYAR_UNITY_PATH"
    ],
    firstCalls: [
      "easyar_server_status",
      "easyar_release_manifest",
      "easyar_account_onboarding",
      "easyar_account_materials",
      "easyar_check_client_setup",
      "easyar_auth_status",
      "easyar_check_official_access",
      "easyar_next_workflow_step",
      "easyar_write_production_validation",
      "easyar_write_issue_report"
    ],
    files: requiredFileStatuses,
    packageFiles: parsedPackage.files ?? [],
    scripts: parsedPackage.scripts ?? {},
    readyForInstallDocs: missingRequiredFiles.length === 0 && packageJson.name === serverName && packageJson.binName === "easyar-mcp",
    missingRequiredFiles,
    nextActions: missingRequiredFiles.length > 0
      ? missingRequiredFiles.map((relativePath) => `Restore or generate required release file: ${relativePath}`)
      : [
          "Run verification commands before publishing or tagging a release.",
          "Use easyar_check_client_setup to validate the MCP client config path or selected package/npx entrypoint before giving it to Codex or Claude.",
          "Keep official EasyAR account tokens and Cloud Recognition credentials out of committed config files."
        ],
    security: "The release manifest is safe to commit. It lists required environment variable names and placeholder commands, not secret values."
  };
}

async function buildOnboardingReport(input: {
  root: string;
  sample: SampleInfo;
  client: typeof clientKinds[number];
  entrypointMode: typeof clientEntrypointModes[number];
  platform: typeof mobilePlatforms[number];
  serverPath?: string;
  outputPath: string;
  maxScriptIssues: number;
}) {
  const [releaseManifest, clientSetup, officialAccess, workflowState] = await Promise.all([
    buildReleaseManifest(),
    buildClientSetupReport(input.client, input.entrypointMode, input.serverPath, true),
    buildOfficialAccessReport(input.root, input.sample, input.platform, "unity-samples"),
    buildWorkflowState(input.root, input.sample, input.platform, input.outputPath, input.maxScriptIssues)
  ]);
  const blockers = [
    ...clientSetup.blockers.map((blocker) => ({
      area: "client-setup",
      id: blocker.id,
      detail: blocker.detail
    })),
    ...officialAccess.blockers.map((blocker) => ({
      area: "official-access",
      id: blocker.id,
      detail: blocker.summary
    })),
    ...(workflowState.blocked
      ? [{
          area: "workflow",
          id: workflowState.phase,
          detail: workflowState.reason
        }]
      : []),
    ...releaseManifest.missingRequiredFiles.map((file) => ({
      area: "release-manifest",
      id: "missing-release-file",
      detail: file
    }))
  ];
  const nextCall = blockers.length > 0
    ? workflowState.nextCall
    : {
        tool: "easyar_next_workflow_step",
        arguments: {
          projectPath: input.root,
          sampleId: input.sample.id,
          platform: input.platform,
          outputPath: input.outputPath
        }
      };

  return {
    generatedAt: new Date().toISOString(),
    projectPath: input.root,
    sample: {
      id: input.sample.id,
      name: input.sample.name,
      implementationStatus: input.sample.implementationStatus
    },
    client: input.client,
    platform: input.platform,
    outputPath: input.outputPath,
    readyForFirstRun: blockers.length === 0,
    blockers,
    nextCall,
    summary: {
      releaseReady: releaseManifest.readyForInstallDocs,
      clientReady: clientSetup.readyForClientConnection,
      officialAccessReady: officialAccess.readyForOfficialContent,
      workflowPhase: workflowState.phase,
      workflowBlocked: workflowState.blocked,
      focusedSamples: releaseManifest.focusedScope.focusedSamples
    },
    firstCalls: releaseManifest.firstCalls,
    clientSetup: {
      entrypointMode: clientSetup.entrypointMode,
      serverPath: clientSetup.serverPath,
      command: clientSetup.command,
      args: clientSetup.args,
      warnings: clientSetup.warnings.map((warning) => warning.id)
    },
    officialAccess: {
      checks: officialAccess.checks.map((check) => ({
        id: check.id,
        ok: check.ok,
        configured: check.configured,
        statusCode: check.statusCode
      }))
    },
    workflow: {
      phase: workflowState.phase,
      blocked: workflowState.blocked,
      reason: workflowState.reason,
      nextActions: workflowState.nextActions,
      missingArtifacts: workflowState.summary.missingArtifacts
    },
    nextActions: Array.from(new Set([
      ...clientSetup.nextActions,
      ...officialAccess.nextActions,
      ...workflowState.nextActions
    ])).slice(0, 12),
    security: "Onboarding report does not include secret values. Keep official EasyAR tokens, license keys, Cloud Recognition credentials, signing keys, and provisioning secrets out of committed files."
  };
}

async function buildFirstRunGuide(input: {
  root: string | null;
  sample: SampleInfo;
  platform: typeof mobilePlatforms[number];
  accountStage: AccountStage;
  client: typeof clientKinds[number];
}) {
  const [accountOnboarding, accountMaterials, localConfig] = await Promise.all([
    buildAccountOnboardingReport(input.root, input.sample, input.platform, input.accountStage),
    buildAccountMaterialsReport(input.root, input.sample, input.platform),
    input.root ? buildLocalConfigValidationReport(input.root) : Promise.resolve(null)
  ]);
  const focused = focusedSamples();
  const stageBlocksUnity = ["unknown", "not-registered", "registered-not-logged-in"].includes(accountOnboarding.stage);
  const missingMaterials = accountMaterials.missingRequired;
  const localConfigValid = localConfig?.valid ?? false;
  const readyForUnityAutomation = Boolean(input.root) && !stageBlocksUnity && missingMaterials.length === 0 && localConfigValid;
  const topNextCall = firstRunTopNextCall(input.root, input.sample, input.platform, accountOnboarding.stage, localConfigValid, missingMaterials);
  const artifactOrder = [
    path.join("Assets", "EasyARGenerated", "FIRST_RUN.md"),
    path.join("Assets", "EasyARGenerated", "ACCOUNT_ONBOARDING.md"),
    path.join("Assets", "EasyARGenerated", "ACCOUNT_MATERIALS.md"),
    path.join("Assets", "EasyARGenerated", "LOCAL_CONFIG_HANDOFF.md"),
    path.join("Assets", "EasyARGenerated", "PROJECT_HANDOFF.md"),
    path.join("Assets", "EasyARGenerated", input.sample.id, "PREFLIGHT.md")
  ];
  const firstCalls = [
    `easyar_write_first_run_guide projectPath=${input.root ?? "/path/to/UnityProject"} accountStage=${accountOnboarding.stage} sampleId=${input.sample.id} platform=${input.platform}`,
    `easyar_write_account_onboarding projectPath=${input.root ?? "/path/to/UnityProject"} accountStage=${accountOnboarding.stage} sampleId=${input.sample.id} platform=${input.platform}`,
    `easyar_write_account_materials projectPath=${input.root ?? "/path/to/UnityProject"} sampleId=${input.sample.id} platform=${input.platform}`,
    `easyar_write_local_config_handoff projectPath=${input.root ?? "/path/to/UnityProject"} accountStage=${accountOnboarding.stage} sampleId=${input.sample.id} platform=${input.platform}`,
    `easyar_prepare_unity_project projectPath=${input.root ?? "/path/to/UnityProject"} sampleId=${input.sample.id}`,
    `easyar_validate_local_config projectPath=${input.root ?? "/path/to/UnityProject"}`,
    `easyar_write_project_handoff projectPath=${input.root ?? "/path/to/UnityProject"} platform=${input.platform}`,
    `easyar_write_focused_preflight projectPath=${input.root ?? "/path/to/UnityProject"} sampleId=${input.sample.id} platform=${input.platform}`
  ];
  const blockers = [
    ...(!input.root
      ? [{
          id: "project-path",
          detail: "No Unity project path was provided.",
          action: "Provide projectPath so MCP can write FIRST_RUN.md and inspect local EasyAR config."
        }]
      : []),
    ...(stageBlocksUnity
      ? [{
          id: `account/${accountOnboarding.stage}`,
          detail: `Current account stage is ${accountOnboarding.stage}.`,
          action: "Complete the browser-only EasyAR registration/login/license route, then rerun this guide with the updated accountStage."
        }]
      : []),
    ...(missingMaterials.length > 0
      ? [{
          id: "account/materials",
          detail: `Missing account material(s): ${missingMaterials.join(", ")}.`,
          action: "Run easyar_write_account_materials and fill required EasyAR account values locally."
        }]
      : []),
    ...(input.root && localConfig && !localConfig.valid
      ? localConfig.checks.filter((check) => !check.ok).map((check) => ({
          id: `config/${check.id}`,
          detail: check.detail,
          action: localConfigAction(check.id)
        }))
      : [])
  ];
  const browserRoute = accountOnboarding.firstRunGuide.routes.find((route) => route.active)
    ?? accountOnboarding.firstRunGuide.routes[0];
  const nextActions = Array.from(new Set([
    topNextCall.tool === "easyar_write_account_onboarding"
      ? "Open https://www.easyar.cn/ in a browser, register or log in through the official entry, then return to MCP with the updated account stage."
      : `Run ${topNextCall.tool} with ${JSON.stringify(topNextCall.arguments)}.`,
    ...accountOnboarding.nextActions,
    ...accountMaterials.nextActions,
    ...(localConfig && !localConfig.valid ? localConfig.nextActions : []),
    "Do not run Unity batch automation until FIRST_RUN.md, LOCAL_CONFIG_HANDOFF.md, and PREFLIGHT.md agree that account and local config gates are clear."
  ])).slice(0, 14);

  return {
    generatedAt: new Date().toISOString(),
    projectPath: input.root,
    client: input.client,
    platform: input.platform,
    firstQuestion: "Do you already have an EasyAR account?",
    readyForUnityAutomation,
    topNextCall,
    focusedScope: {
      activeSamples: focused.map((sample) => sample.id),
      deferredSamples: deferredSamples().map((sample) => sample.id),
      note: "Current run-through work is intentionally limited to Image Tracking and Cloud Recognition until the user asks to continue other samples."
    },
    sample: {
      id: input.sample.id,
      name: input.sample.name,
      needsCloudRecognition: input.sample.id === "cloud-recognition"
    },
    account: {
      requestedStage: input.accountStage,
      stage: accountOnboarding.stage,
      browserRoute,
      officialLinks: accountOnboarding.officialLinks
    },
    accountMaterials: {
      readyForLocalConfigValidation: accountMaterials.readyForLocalConfigValidation,
      missingRequired: missingMaterials,
      materials: accountMaterials.materials.map((item) => ({
        label: item.label,
        required: item.required,
        present: item.present,
        source: item.source,
        storeIn: item.storeIn,
        sharePolicy: item.sharePolicy
      }))
    },
    localConfig: localConfig
      ? {
          valid: localConfig.valid,
          configPath: localConfig.configPath,
          failedChecks: localConfig.checks.filter((check) => !check.ok).map((check) => check.id)
        }
      : {
          valid: false,
          configPath: input.root ? path.join(input.root, "ProjectSettings", "EasyAR", "easyar.local.json") : "ProjectSettings/EasyAR/easyar.local.json",
          failedChecks: ["project-path"]
        },
    firstCalls,
    artifactOrder,
    blockers: uniqueBlockers(blockers),
    nextActions,
    security: [
      "Registration, login, password reset, email activation, and verification codes stay in the official EasyAR browser session.",
      "FIRST_RUN.md reports routes, paths, field presence, and next tool calls only.",
      "Do not paste or commit EasyAR website passwords, API tokens, license keys, appKey, appSecret, signing keys, provisioning profiles, or raw private logs."
    ]
  };
}

function firstRunTopNextCall(
  root: string | null,
  sample: SampleInfo,
  platform: typeof mobilePlatforms[number],
  accountStage: AccountStage,
  localConfigValid: boolean,
  missingMaterials: string[]
) {
  const projectPath = root ?? "/path/to/UnityProject";
  if (!root) {
    return {
      tool: "easyar_write_first_run_guide",
      arguments: {
        projectPath,
        accountStage,
        sampleId: sample.id,
        platform
      }
    };
  }
  if (["unknown", "not-registered", "registered-not-logged-in"].includes(accountStage)) {
    return {
      tool: "easyar_write_account_onboarding",
      arguments: {
        projectPath,
        accountStage,
        sampleId: sample.id,
        platform
      }
    };
  }
  if (missingMaterials.length > 0 || !localConfigValid) {
    return {
      tool: "easyar_write_local_config_handoff",
      arguments: {
        projectPath,
        accountStage,
        sampleId: sample.id,
        platform
      }
    };
  }
  return {
    tool: "easyar_write_project_handoff",
    arguments: {
      projectPath,
      platform
    }
  };
}

async function buildProjectHandoff(input: {
  root: string;
  platform: typeof mobilePlatforms[number];
  client: typeof clientKinds[number];
  entrypointMode: typeof clientEntrypointModes[number];
  serverPath?: string;
  maxScriptIssues: number;
  maxLogBytes: number;
  maxLogIssues: number;
}) {
  const focused = focusedSamples();
  const [clientSetup, accountMaterials, localConfig, unityEnvironment, focusedScope, workflows] = await Promise.all([
    buildClientSetupReport(input.client, input.entrypointMode, input.serverPath, true),
    buildAccountMaterialsReport(input.root, findSample("cloud-recognition"), input.platform),
    buildLocalConfigValidationReport(input.root),
    buildUnityEnvironmentReport(input.root, null),
    buildFocusedScopeStatus(input.root, input.platform, input.maxScriptIssues, input.maxLogBytes, input.maxLogIssues),
    Promise.all(focused.map((sample) => {
      const outputPath = input.platform === "android"
        ? `Builds/${sample.id}.apk`
        : `Builds/iOS/${sample.id}`;
      return buildWorkflowState(input.root, sample, input.platform, outputPath, input.maxScriptIssues);
    }))
  ]);
  const workflowSummaries = workflows.map((workflow) => ({
    sampleId: workflow.sample.id,
    sampleName: workflow.sample.name,
    phase: workflow.phase,
    blocked: workflow.blocked,
    reason: workflow.reason,
    nextCall: workflow.nextCall,
    missingArtifacts: workflow.summary.missingArtifacts.slice(0, 8),
    nextActions: workflow.nextActions.slice(0, 6)
  }));
  const firstBlockedWorkflow = workflowSummaries.find((workflow) => workflow.blocked);
  const topNextCall = firstBlockedWorkflow?.nextCall
    ?? (focusedScope.allFocusedSamplesComplete
      ? { tool: "easyar_write_production_validation", arguments: { projectPath: input.root, platform: input.platform } }
      : { tool: "easyar_write_focused_scope_status", arguments: { projectPath: input.root, platform: input.platform } });
  const blockers = [
    ...(!clientSetup.readyForClientConnection
      ? clientSetup.blockers.map((blocker) => ({
          id: `client/${blocker.id}`,
          detail: blocker.detail,
          action: clientSetup.nextActions[0] ?? "Run easyar_write_client_setup and fix required client setup blockers."
        }))
      : []),
    ...(!localConfig.valid
      ? localConfig.checks.filter((check) => !check.ok).map((check) => ({
          id: `config/${check.id}`,
          detail: check.detail,
          action: localConfigAction(check.id)
        }))
      : []),
    ...(accountMaterials.missingRequired.length > 0
      ? [{
          id: "account/materials",
          detail: `Missing account material(s): ${accountMaterials.missingRequired.join(", ")}.`,
          action: "Run easyar_write_account_onboarding, easyar_write_account_materials, and easyar_write_local_config_handoff before Unity automation."
        }]
      : []),
    ...workflowSummaries.filter((workflow) => workflow.blocked).map((workflow) => ({
      id: `workflow/${workflow.sampleId}/${workflow.phase}`,
      detail: workflow.reason,
      action: `Run ${workflow.nextCall.tool} with ${JSON.stringify(workflow.nextCall.arguments)}.`
    }))
  ];
  const nextActions = Array.from(new Set([
    ...blockers.slice(0, 8).map((blocker) => blocker.action),
    `Run easyar_write_project_handoff projectPath=${input.root} platform=${input.platform} after each major setup or Unity run attempt.`,
    "Read PROJECT_HANDOFF.md first when resuming this project in another MCP client."
  ]));

  return {
    generatedAt: new Date().toISOString(),
    projectPath: input.root,
    platform: input.platform,
    client: input.client,
    entrypointMode: input.entrypointMode,
    readyForContinuation: blockers.length === 0,
    topNextCall,
    clientSetup: {
      readyForClientConnection: clientSetup.readyForClientConnection,
      command: clientSetup.command,
      args: clientSetup.args,
      configDestination: clientSetup.configDestination,
      warningCount: clientSetup.warnings.length
    },
    account: {
      readyForLocalConfigValidation: accountMaterials.readyForLocalConfigValidation,
      missingRequired: accountMaterials.missingRequired
    },
    localConfig: {
      valid: localConfig.valid,
      configPath: localConfig.configPath,
      failedChecks: localConfig.checks.filter((check) => !check.ok).map((check) => check.id)
    },
    unity: {
      readyForUnityBatch: unityEnvironment.readyForUnityBatch,
      recommendedUnityPath: unityEnvironment.recommendedUnityPath,
      unityVersion: unityEnvironment.unityVersion
    },
    focusedScope: {
      allFocusedSamplesComplete: focusedScope.allFocusedSamplesComplete,
      completedCount: focusedScope.completedCount,
      blockedCount: focusedScope.blockedCount,
      failedCount: focusedScope.failedCount,
      notRunCount: focusedScope.notRunCount
    },
    workflows: workflowSummaries,
    artifacts: {
      projectHandoff: path.join("Assets", "EasyARGenerated", "PROJECT_HANDOFF.md"),
      accountOnboarding: path.join("Assets", "EasyARGenerated", "ACCOUNT_ONBOARDING.md"),
      localConfigHandoff: path.join("Assets", "EasyARGenerated", "LOCAL_CONFIG_HANDOFF.md"),
      unityEnvironment: path.join("Assets", "EasyARGenerated", "UNITY_ENVIRONMENT.md"),
      focusedScopeStatus: path.join("Assets", "EasyARGenerated", "FOCUSED_SCOPE_STATUS.md")
    },
    blockers: uniqueBlockers(blockers),
    nextActions,
    security: "Project handoff reports status, paths, tool calls, and field presence only. It does not include EasyAR passwords, tokens, license keys, appKey, appSecret, signing keys, provisioning profiles, or raw private logs."
  };
}

async function buildRemainingWorkReport(input: {
  root: string | null;
  platform: typeof mobilePlatforms[number];
  verificationEvidence: "not-provided" | "passed";
  maxScriptIssues: number;
  maxLogBytes: number;
  maxLogIssues: number;
}) {
  const focused = focusedSamples();
  const production = await buildProductionValidationReport(
    input.root,
    input.platform,
    undefined,
    input.verificationEvidence,
    input.maxScriptIssues,
    input.maxLogBytes,
    input.maxLogIssues
  );
  const releaseGate = production.gates.find((gate) => gate.id === "release-manifest");
  const deploymentGate = production.gates.find((gate) => gate.id === "deployment-readiness");
  const officialApiGate = production.gates.find((gate) => gate.id === "official-api-contract");
  const verificationGate = production.gates.find((gate) => gate.id === "verification-commands");
  const officialAccessGates = focused.map((sample) => production.gates.find((gate) => gate.id === `official-access/${sample.id}`));
  const focusedScope = input.root
    ? await buildFocusedScopeStatus(input.root, input.platform, input.maxScriptIssues, input.maxLogBytes, input.maxLogIssues)
    : null;
  const localConfig = input.root ? await buildLocalConfigValidationReport(input.root) : null;
  const unityEnvironment = input.root ? await buildUnityEnvironmentReport(input.root, null) : null;
  const runtimeBridgeFiles = input.root
    ? {
        editor: await exists(path.join(input.root, "Assets", "Editor", "EasyARLocalConfigBridge.cs")),
        runtime: await exists(path.join(input.root, "Assets", "EasyARGenerated", "Runtime", "EasyARLocalConfigRuntime.cs")),
        ignored: await fileContains(path.join(input.root, ".gitignore"), "Assets/StreamingAssets/EasyAR/easyar.runtime.json")
      }
    : { editor: false, runtime: false, ignored: false };
  const completionReports = input.root
    ? await Promise.all(focused.map((sample) => {
        const outputPath = input.platform === "android"
          ? `Builds/${sample.id}.apk`
          : `Builds/iOS/${sample.id}`;
        return buildCompletionReport(input.root!, sample, input.platform, outputPath, input.maxScriptIssues, input.maxLogBytes, input.maxLogIssues);
      }))
    : [];
  const completionBySample = new Map(completionReports.map((report) => [report.sample.id, report]));
  const categories = [
    remainingCategory({
      id: "repository-release-surface",
      title: "Repository, package, install surface, and verification",
      weight: 20,
      checks: [
        remainingCheck("release-manifest", Boolean(releaseGate?.ok), releaseGate?.currentEvidence ?? "Release manifest was not checked.", releaseGate?.nextAction ?? "Run easyar_release_manifest."),
        remainingCheck("deployment-readiness", Boolean(deploymentGate?.ok), deploymentGate?.currentEvidence ?? "Deployment readiness was not checked.", deploymentGate?.nextAction ?? "Run easyar_deployment_readiness."),
        remainingCheck("verification-evidence", input.verificationEvidence === "passed", verificationGate?.currentEvidence ?? "Verification evidence was not provided.", verificationGate?.nextAction ?? "Run local verification commands and record evidence.")
      ]
    }),
    remainingCategory({
      id: "mcp-onboarding-and-handoff",
      title: "MCP onboarding, account handoff, project handoff, and programming assistance",
      weight: 15,
      checks: [
        remainingCheck("first-run-guide-tools", toolCatalog.includes("easyar_first_run_guide") && toolCatalog.includes("easyar_write_first_run_guide"), "FIRST_RUN.md tools are available.", "Keep FIRST_RUN.md as the first artifact for new users."),
        remainingCheck("project-handoff-tools", toolCatalog.includes("easyar_write_project_handoff"), "PROJECT_HANDOFF.md tool is available.", "Regenerate project handoff after major changes."),
        remainingCheck("programming-tools", toolCatalog.includes("easyar_write_programming_context") && toolCatalog.includes("easyar_write_code_plan") && toolCatalog.includes("easyar_review_csharp_scripts"), "Programming context, code plan, and script review tools are available.", "Use them before editing Unity scripts."),
        remainingCheck("runtime-config-bridge", toolCatalog.includes("easyar_create_local_config_bridge"), "Runtime config bridge tool is available.", "Create/export the bridge before mobile builds.")
      ]
    }),
    remainingCategory({
      id: "official-easyar-account-api",
      title: "Official EasyAR account, license, download, and Cloud Recognition API integration",
      weight: 20,
      checks: [
        remainingCheck("official-api-contract", Boolean(officialApiGate?.ok), officialApiGate?.currentEvidence ?? "Official API contract was not checked.", officialApiGate?.nextAction ?? "Configure official endpoint env vars."),
        ...focused.map((sample, index) => remainingCheck(
          `official-access-${sample.id}`,
          Boolean(officialAccessGates[index]?.ok),
          officialAccessGates[index]?.currentEvidence ?? `${sample.name} official access was not checked.`,
          officialAccessGates[index]?.nextAction ?? `Run easyar_write_official_access_report for ${sample.id}.`
        ))
      ]
    }),
    remainingCategory({
      id: "unity-project-config-and-runtime",
      title: "Unity project local config, Unity executable, imports, and runtime config bridge",
      weight: 15,
      checks: [
        remainingCheck("project-path", Boolean(input.root), input.root ? `Project path: ${input.root}.` : "No projectPath was provided.", "Provide projectPath for the validation Unity project."),
        remainingCheck("local-config-valid", Boolean(localConfig?.valid), localConfig?.valid ? "ProjectSettings/EasyAR/easyar.local.json is valid." : `Local config failed: ${localConfig?.checks.filter((check) => !check.ok).map((check) => check.id).join(", ") || "not checked"}.`, "Fill and validate ProjectSettings/EasyAR/easyar.local.json."),
        remainingCheck("unity-batch-ready", Boolean(unityEnvironment?.readyForUnityBatch), unityEnvironment?.readyForUnityBatch ? "Unity batch executable is ready." : "Unity batch executable is not ready or not checked.", "Set EASYAR_UNITY_PATH to a matching Unity executable."),
        remainingCheck("runtime-config-bridge-files", runtimeBridgeFiles.editor && runtimeBridgeFiles.runtime && runtimeBridgeFiles.ignored, `Bridge editor=${runtimeBridgeFiles.editor}, runtime=${runtimeBridgeFiles.runtime}, ignored=${runtimeBridgeFiles.ignored}.`, "Run easyar_create_local_config_bridge and keep runtime config ignored.")
      ]
    }),
    ...focused.map((sample) => {
      const report = completionBySample.get(sample.id);
      const requiredChecks = report?.requiredEvidence.filter((item) => item.required) ?? [];
      return remainingCategory({
        id: `focused-sample-${sample.id}`,
        title: `${sample.name} focused real-device run-through`,
        weight: 15,
        checks: report
          ? requiredChecks.map((item) => remainingCheck(item.id, item.passed, item.detail, report.nextActions[0] ?? `Run easyar_write_completion_report for ${sample.id}.`))
          : [
              remainingCheck("completion-report", false, "No projectPath was provided, so completion evidence was not checked.", `Provide projectPath and run easyar_write_completion_report sampleId=${sample.id}.`)
            ]
      });
    })
  ];
  const earned = categories.reduce((total, category) => total + category.earnedWeight, 0);
  const totalWeight = categories.reduce((total, category) => total + category.weight, 0);
  const percent = totalWeight > 0 ? Math.round((earned / totalWeight) * 100) : 0;
  const incomplete = categories.filter((category) => !category.done);
  const topRemainingAreas = incomplete
    .sort((left, right) => right.remainingWeight - left.remainingWeight)
    .slice(0, 4)
    .map((category) => ({
      id: category.id,
      title: category.title,
      remainingWeight: category.remainingWeight,
      firstNextAction: category.nextActions[0] ?? "Review this category."
    }));
  const nextActions = Array.from(new Set([
    ...topRemainingAreas.map((area) => area.firstNextAction),
    ...(production.nextActions ?? []),
    input.root
      ? `Regenerate this report with easyar_write_remaining_work_report projectPath=${input.root} platform=${input.platform} after each major setup or real-device run.`
      : "Provide a Unity project path and regenerate this report for stronger evidence."
  ])).slice(0, 12);

  return {
    generatedAt: new Date().toISOString(),
    projectPath: input.root,
    platform: input.platform,
    productionReady: production.productionReady,
    verificationEvidence: input.verificationEvidence,
    overall: {
      percent,
      remainingPercent: Math.max(0, 100 - percent),
      earnedWeight: earned,
      totalWeight,
      note: "This is an evidence-weighted estimate, not a claim of completion. True completion still requires every required production and focused sample gate to pass."
    },
    focusedScope: focusedScope
      ? {
          allFocusedSamplesComplete: focusedScope.allFocusedSamplesComplete,
          completedCount: focusedScope.completedCount,
          blockedCount: focusedScope.blockedCount,
          failedCount: focusedScope.failedCount,
          notRunCount: focusedScope.notRunCount
        }
      : {
          allFocusedSamplesComplete: false,
          completedCount: 0,
          blockedCount: 0,
          failedCount: 0,
          notRunCount: focused.length
        },
    categories,
    productionBlockers: production.blockers.map((blocker) => ({
      id: blocker.id,
      title: blocker.title,
      currentEvidence: blocker.currentEvidence,
      nextAction: blocker.nextAction
    })),
    topRemainingAreas,
    nextActions,
    security: "Remaining-work reports use evidence status, paths, and redacted metadata only. They do not include EasyAR passwords, verification codes, account tokens, license keys, appKey, appSecret, signing keys, provisioning secrets, or raw private logs."
  };
}

function remainingCheck(id: string, ok: boolean, evidence: string, nextAction: string) {
  return {
    id,
    ok,
    evidence,
    nextAction
  };
}

function remainingCategory(input: {
  id: string;
  title: string;
  weight: number;
  checks: ReturnType<typeof remainingCheck>[];
}) {
  const passedCount = input.checks.filter((check) => check.ok).length;
  const checkCount = input.checks.length;
  const ratio = checkCount > 0 ? passedCount / checkCount : 0;
  const earnedWeight = Math.round(input.weight * ratio);
  const remainingWeight = Math.max(0, input.weight - earnedWeight);
  const nextActions = Array.from(new Set(input.checks.filter((check) => !check.ok).map((check) => check.nextAction)));
  return {
    id: input.id,
    title: input.title,
    weight: input.weight,
    earnedWeight,
    remainingWeight,
    percent: Math.round(ratio * 100),
    done: passedCount === checkCount,
    passedCount,
    checkCount,
    checks: input.checks,
    nextActions
  };
}

function buildClientLaunch(entrypointMode: typeof clientEntrypointModes[number], serverPath: string | undefined) {
  if (entrypointMode === "package-bin") {
    return {
      mode: entrypointMode,
      command: "easyar-mcp",
      args: [] as string[],
      entrypoint: null as string | null
    };
  }
  if (entrypointMode === "npx") {
    return {
      mode: entrypointMode,
      command: "npx",
      args: ["-y", "mcp-easyar"] as string[],
      entrypoint: null as string | null
    };
  }
  const entrypoint = serverPath ?? process.argv[1] ?? path.join("dist", "index.js");
  return {
    mode: "local-dist" as const,
    command: "node",
    args: [entrypoint],
    entrypoint
  };
}

function buildClientConfig(client: typeof clientKinds[number], launch: ReturnType<typeof buildClientLaunch>, env: Record<string, string>) {
  if (client === "codex") {
    return {
      mcpServers: {
        easyar: {
          command: launch.command,
          args: launch.args,
          env
        }
      }
    };
  }

  if (client === "claude-desktop") {
    return {
      mcpServers: {
        easyar: {
          command: launch.command,
          args: launch.args,
          env
        }
      }
    };
  }

  return {
    name: "easyar",
    transport: "stdio",
    command: launch.command,
    args: launch.args,
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
            step: "Generate official EasyAR import checklist",
            tool: "easyar_generate_import_checklist",
            arguments: { projectPath, sampleId: sample.id },
            expected: "Report whether the official EasyAR Unity Plugin and focused sample scene/assets appear to be imported."
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
            step: "Write official EasyAR import checklist artifact",
            tool: "easyar_write_import_checklist",
            arguments: { projectPath, sampleId: sample.id, overwrite: true },
            expected: `Assets/EasyARGenerated/${sample.id}/IMPORT_CHECKLIST.md records import evidence and missing official package/sample pieces.`
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
              platform,
              logPath: path.join("Logs", "mcp-easyar-CompileCheck.log")
            },
            expected: "Unity opens the project in batch mode, imports scripts, exits without compile errors, and returns suggestedRunResultCall for RUN_RESULT.md handoff."
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
              sampleId: sample.id,
              platform,
              logPath: defaultUnityBatchLogPath("EasyAR.EditorTools.EasyARMobileSettingsHelper.ConfigureMobileSettings")
            },
            expected: "Unity exits successfully after applying package/bundle identifier and camera/network-related settings, then returns suggestedRunResultCall for RUN_RESULT.md handoff."
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
              sampleId: sample.id,
              platform,
              logPath: defaultUnityBatchLogPath("EasyAR.EditorTools.EasyARBuildSettingsHelper.ConfigureBuildSettings")
            },
            expected: "Matching official sample scene is enabled in Build Settings, then suggestedRunResultCall can record the step outcome."
          },
          {
            step: "Validate focused sample inside Unity",
            tool: "easyar_run_unity_method",
            arguments: {
              projectPath,
              executeMethod: "EasyAR.EditorTools.EasyARSampleValidationHelper.ValidateFocusedSample",
              sampleId: sample.id,
              platform,
              logPath: defaultUnityBatchLogPath("EasyAR.EditorTools.EasyARSampleValidationHelper.ValidateFocusedSample")
            },
            expected: "Unity confirms EasyAR import signals, matching sample scene, Build Settings, and focused sample requirements, then suggestedRunResultCall can record the validation outcome."
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
            step: "Write focused real-device validation checklist",
            tool: "easyar_write_device_validation_checklist",
            arguments: { projectPath, sampleId: sample.id, platform, buildOutputPath: outputPath, overwrite: true },
            expected: `Assets/EasyARGenerated/${sample.id}/DEVICE_VALIDATION.md lists required real-device evidence and pass criteria.`
          },
          {
            step: "Run Unity player build",
            tool: "easyar_run_unity_method",
            arguments: {
              projectPath,
              executeMethod: "EasyAR.EditorTools.EasyARDeviceBuildHelper.Build",
              sampleId: sample.id,
              platform,
              logPath: defaultUnityBatchLogPath("EasyAR.EditorTools.EasyARDeviceBuildHelper.Build"),
              timeoutSeconds: 1800
            },
            expected: "Android APK or iOS Xcode project is produced, then suggestedRunResultCall can record the build outcome before real-device validation."
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

async function buildUnityEnvironmentReport(root: string | null, sample: SampleInfo | null) {
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

function chooseUnityCandidate(candidates: Array<{ path: string; exists: boolean }>, unityVersion: string | null): string | null {
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

function unityPathMatchesProjectVersion(unityPath: string | null, unityVersion: string | null): boolean | null {
  if (!unityPath || !unityVersion) {
    return null;
  }
  const versionNeedle = `${path.sep}${unityVersion}${path.sep}`;
  return unityPath.includes(versionNeedle);
}

function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

async function buildSampleReadinessReport(root: string, sample: SampleInfo) {
  const easyarSignals = filterOfficialEasyARSignals(await findFiles(root, ["Assets", "Packages"], /easyar/i, 120));
  const sampleScenes = await findFiles(root, ["Assets"], /\.(unity)$/i, 200);
  const matchingScenes = await matchSampleScenes(root, sample, sampleScenes);
  const packageCacheSamples = await findPackageCacheSamplePaths(root, sample, 20);
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
        : packageCacheSamples.length > 0
          ? `No imported scene matched hints: ${sample.unityScenes.join(", ")}. Package cache contains sample candidate(s): ${packageCacheSamples.join(", ")}.`
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
    packageCacheSamples,
    nextActions
  };
}

async function buildImportChecklist(root: string, sample: SampleInfo) {
  const allEasyARSignals = await findFiles(root, ["Assets", "Packages"], /easyar/i, 160);
  const easyarSignals = filterOfficialEasyARSignals(allEasyARSignals);
  const sampleScenes = await findFiles(root, ["Assets"], /\.(unity)$/i, 200);
  const matchingScenes = await matchSampleScenes(root, sample, sampleScenes);
  const packageCacheSamples = await findPackageCacheSamplePaths(root, sample, 20);
  const targetAssets = sample.id === "image-tracking"
    ? await findFiles(root, ["Assets"], /(imagetarget|image-target|target.*\.(jpg|jpeg|png|json)|targets?\.(json|xml)|\.etd$)/i, 80)
    : [];
  const cloudConfigPath = path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json");
  const cloudConfig = sample.id === "cloud-recognition" ? await readCloudRecognitionConfig(root) : null;
  const items = [
    {
      id: "unity-project-opened",
      required: true,
      ok: await exists(path.join(root, "Assets")) && await exists(path.join(root, "Packages", "manifest.json")) && await exists(path.join(root, "ProjectSettings", "ProjectVersion.txt")),
      evidence: "Assets, Packages/manifest.json, and ProjectSettings/ProjectVersion.txt exist.",
      action: "Open or create the Unity project once before importing EasyAR packages."
    },
    {
      id: "official-unity-plugin-imported",
      required: true,
      ok: easyarSignals.length > 0,
      evidence: easyarSignals.length > 0
        ? `EasyAR import signals: ${easyarSignals.slice(0, 10).join(", ")}`
        : "No official EasyAR import signals were found under Assets or Packages.",
      action: "Download the official EasyAR Sense Unity Plugin from the registered EasyAR account/download page and import it into this project."
    },
    {
      id: "focused-sample-scene-imported",
      required: true,
      ok: matchingScenes.length > 0,
      evidence: matchingScenes.length > 0
        ? `Matching sample scene(s): ${matchingScenes.join(", ")}`
        : packageCacheSamples.length > 0
          ? `No imported scene matched focused sample hints. Package cache sample candidate(s): ${packageCacheSamples.join(", ")}`
          : `No scene matched focused sample hints: ${sample.unityScenes.join(", ")}.`,
      action: packageCacheSamples.length > 0
        ? `Import ${sample.name} from Unity Package Manager Samples, then rerun easyar_generate_import_checklist.`
        : `Import the official ${sample.name} sample scene from the EasyAR Unity sample package.`
    },
    {
      id: "package-cache-sample-available",
      required: false,
      ok: packageCacheSamples.length > 0,
      evidence: packageCacheSamples.length > 0
        ? `Package cache sample candidate(s): ${packageCacheSamples.join(", ")}`
        : "No matching EasyAR Samples~ package cache sample was found.",
      action: "Open Unity Package Manager, select EasyAR Sense Unity Plugin, and import the matching official sample into Assets/Samples."
    },
    {
      id: "sample-scope-supported",
      required: true,
      ok: sample.implementationStatus === "focused",
      evidence: `${sample.name} status is ${sample.implementationStatus}.`,
      action: "Use image-tracking or cloud-recognition until broader sample work resumes."
    },
    {
      id: "official-download-discovery-ready",
      required: false,
      ok: readAuthConfig().downloadsEndpointConfigured,
      evidence: readAuthConfig().downloadsEndpointConfigured
        ? "EASYAR_DOWNLOADS_ENDPOINT is configured for account-scoped package discovery."
        : "EASYAR_DOWNLOADS_ENDPOINT is not configured; use manual official download page or configure the endpoint.",
      action: "Configure EASYAR_DOWNLOADS_ENDPOINT only with an authorized official EasyAR account API."
    },
    {
      id: "local-config-template-present",
      required: false,
      ok: await exists(path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json.example")),
      evidence: "ProjectSettings/EasyAR/easyar.local.json.example is generated by easyar_prepare_unity_project.",
      action: `Run easyar_prepare_unity_project with sampleId "${sample.id}".`
    },
    ...(sample.id === "image-tracking"
      ? [
          {
            id: "image-tracking-target-assets-imported",
            required: true,
            ok: targetAssets.length > 0,
            evidence: targetAssets.length > 0
              ? `Possible target asset(s): ${targetAssets.slice(0, 10).join(", ")}`
              : "No Image Tracking target images/database assets were found.",
            action: "Import the official Image Tracking target assets or add real target images/database files under Assets."
          }
        ]
      : [
          {
            id: "cloud-recognition-local-credentials-ready",
            required: true,
            ok: hasCompleteCloudRecognitionConfig(cloudConfig ?? {}),
            evidence: hasCompleteCloudRecognitionConfig(cloudConfig ?? {})
              ? `Cloud Recognition credentials are configured in ${path.relative(root, cloudConfigPath)}.`
              : `Cloud Recognition credentials are missing or incomplete in ${path.relative(root, cloudConfigPath)}.`,
            action: "Fill CRS AppId and API KEY from the official EasyAR Cloud Recognition account into local config, never into committed source."
          }
        ])
  ];
  const nextActions = items
    .filter((item) => item.required && !item.ok)
    .map((item) => item.action);

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    unityVersion: await readUnityVersion(root),
    matchingScenes,
    packageCacheSamples,
    officialReferences: officialInfo.docs,
    packageVersions: officialInfo.packageVersions,
    readyForFocusedPreparation: items.filter((item) => item.required).every((item) => item.ok),
    items,
    nextActions: nextActions.length > 0
      ? Array.from(new Set(nextActions))
      : ["Official plugin, focused sample scene, and sample-specific import requirements are present. Continue with easyar_prepare_unity_project and easyar_generate_run_sequence."],
    security: "This checklist does not download private packages or expose secrets. It records local import evidence after authorized official EasyAR access."
  };
}

async function buildSampleImportGuide(root: string, sample: SampleInfo) {
  const checklist = await buildImportChecklist(root, sample);
  const sceneItem = checklist.items.find((item) => item.id === "focused-sample-scene-imported");
  const packageCacheItem = checklist.items.find((item) => item.id === "package-cache-sample-available");
  const matchingScenes = checklist.matchingScenes ?? [];
  const packageCacheSamples = checklist.packageCacheSamples ?? [];
  const importedScenes = matchingScenes.filter((scenePath) => scenePath.startsWith("Assets" + path.sep) || scenePath.startsWith("Assets/"));
  const unityPackageSampleName = sample.id === "cloud-recognition"
    ? "ImageTracking_CloudRecognition"
    : sample.unityScenes[0] ?? sample.name;
  const expectedImportLocations = [
    path.join("Assets", "Samples"),
    path.join("Assets", "Samples", "EasyAR Sense Unity Plugin"),
    path.join("Assets", "Samples", "EasyAR Sense Unity Plugin", officialInfo.packageVersions.easyarSenseUnityPlugin),
    path.join("Assets", "Samples", "EasyAR Sense Unity Plugin", officialInfo.packageVersions.easyarSenseUnityPlugin, "ImageTracking"),
    path.join("Assets", "Samples", "EasyAR Sense Unity Plugin", officialInfo.packageVersions.easyarSenseUnityPlugin, "ImageTracking", unityPackageSampleName)
  ];
  const postImportVerification = [
    {
      tool: "easyar_generate_import_checklist",
      arguments: { projectPath: root, sampleId: sample.id },
      expected: "focused-sample-scene-imported is OK and PackageCache candidates are no longer the only sample evidence."
    },
    {
      tool: "easyar_write_import_checklist",
      arguments: { projectPath: root, sampleId: sample.id },
      expected: `Assets/EasyARGenerated/${sample.id}/IMPORT_CHECKLIST.md records the imported focused sample scene.`
    },
    {
      tool: "easyar_check_sample_readiness",
      arguments: { projectPath: root, sampleId: sample.id },
      expected: sample.id === "cloud-recognition"
        ? "Cloud Recognition readiness no longer reports a missing sample scene; local cloud credentials may still block device validation."
        : "Image Tracking readiness no longer reports a missing sample scene; target assets may still block device validation."
    },
    {
      tool: "easyar_write_focused_preflight",
      arguments: { projectPath: root, sampleId: sample.id, platform: "android" },
      expected: "PREFLIGHT.md advances from import blockers to the next real blocker or Unity batch step."
    }
  ];
  const steps = [
    {
      order: 1,
      title: "Open the Unity project",
      action: `Open ${root} in Unity and wait until package import/compilation finishes.`,
      doneWhen: "The Project window and Package Manager are usable."
    },
    {
      order: 2,
      title: "Open Package Manager",
      action: "In Unity, open Window > Package Manager.",
      doneWhen: "Package Manager is visible."
    },
    {
      order: 3,
      title: "Select EasyAR Sense Unity Plugin",
      action: "Select the official EasyAR Sense Unity Plugin package from the project/package list.",
      doneWhen: "The EasyAR package detail panel is selected."
    },
    {
      order: 4,
      title: `Import ${unityPackageSampleName}`,
      action: `Open the Samples section and import ${unityPackageSampleName} into Assets/Samples.`,
      doneWhen: `A matching scene for ${sample.name} exists under Assets/Samples or another Assets folder.`
    },
    {
      order: 5,
      title: "Return to MCP validation",
      action: `Run easyar_generate_import_checklist projectPath=${root} sampleId=${sample.id}, then easyar_check_sample_readiness projectPath=${root} sampleId=${sample.id}.`,
      doneWhen: "The focused sample scene import check is OK."
    }
  ];

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: checklist.sample,
    unityVersion: checklist.unityVersion,
    importComplete: matchingScenes.length > 0,
    importAvailableFromPackageCache: packageCacheSamples.length > 0,
    expectedUnityPackageSampleName: unityPackageSampleName,
    expectedImportLocations,
    importedScenes,
    packageCacheSamples,
    evidence: {
      focusedSampleScene: sceneItem?.evidence ?? "No focused sample scene evidence found.",
      packageCacheSample: packageCacheItem?.evidence ?? "No PackageCache sample evidence found."
    },
    steps,
    mcpAfterImport: postImportVerification.map((call) => ({ tool: call.tool, arguments: call.arguments })),
    postImportVerification,
    nextActions: matchingScenes.length > 0
      ? [
          "Focused sample scene is already imported. Continue with easyar_prepare_unity_project and easyar_next_workflow_step.",
          `Optionally write this guide with easyar_write_sample_import_guide projectPath=${root} sampleId=${sample.id} for handoff history.`
        ]
      : packageCacheSamples.length > 0
        ? [
            `Open Unity Package Manager, select EasyAR Sense Unity Plugin, and import Samples > ${unityPackageSampleName}.`,
            `After import, rerun easyar_generate_import_checklist projectPath=${root} sampleId=${sample.id}.`,
            `Write the guide with easyar_write_sample_import_guide projectPath=${root} sampleId=${sample.id} if another AI tool will continue the project.`
          ]
        : [
            "Download/import the official EasyAR Sense Unity Plugin through an authorized EasyAR account, then open Unity Package Manager Samples.",
            `Import the official ${sample.name} sample into Assets/Samples.`,
            `Rerun easyar_generate_sample_import_guide projectPath=${root} sampleId=${sample.id}.`
          ],
    security: "This guide does not download private packages, bypass official account access, or include license/API/cloud secret values. It only reports local Unity package/sample evidence and manual import steps."
  };
}

async function importSampleFromPackageCache(root: string, sample: SampleInfo, overwrite: boolean, dryRun: boolean) {
  const packageCacheSamples = await findPackageCacheSamplePaths(root, sample, 20);
  const sourceRelativePath = packageCacheSamples[0] ?? null;
  const sourcePath = sourceRelativePath ? path.join(root, sourceRelativePath) : null;
  if (!sourcePath || !sourceRelativePath) {
    return {
      generatedAt: new Date().toISOString(),
      projectPath: root,
      sample: {
        id: sample.id,
        name: sample.name,
        implementationStatus: sample.implementationStatus
      },
      imported: false,
      dryRun,
      sourcePath: null,
      targetPath: null,
      targetExists: false,
      packageCacheSamples,
      nextActions: [
        `Run easyar_generate_sample_import_guide projectPath=${root} sampleId=${sample.id}.`,
        "Open Unity Package Manager and import the official EasyAR sample after the package is available in PackageCache."
      ],
      security: "No files were copied. This tool only imports samples already present in local Unity PackageCache."
    };
  }

  const packageInfo = await readPackageCacheInfo(sourcePath);
  const sampleFolderName = path.basename(sourcePath);
  const targetPath = path.join(root, "Assets", "Samples", packageInfo.displayName, packageInfo.version, sampleFolderName);
  const targetExists = await exists(targetPath);
  const plannedActions = [
    `Copy ${sourceRelativePath} to ${path.relative(root, targetPath)}.`,
    `Rerun easyar_write_import_checklist projectPath=${root} sampleId=${sample.id}.`,
    `Rerun easyar_write_focused_preflight projectPath=${root} sampleId=${sample.id} platform=android.`
  ];

  if (targetExists && !overwrite) {
    return {
      generatedAt: new Date().toISOString(),
      projectPath: root,
      sample: {
        id: sample.id,
        name: sample.name,
        implementationStatus: sample.implementationStatus
      },
      imported: false,
      skipped: true,
      dryRun,
      reason: "Target sample directory already exists and overwrite=false.",
      sourcePath,
      targetPath,
      targetExists,
      package: packageInfo,
      packageCacheSamples,
      nextActions: [
        `Use overwrite=true to replace ${path.relative(root, targetPath)}, or rerun import checks if the existing sample is correct.`,
        ...plannedActions.slice(1)
      ],
      security: "Existing files were not overwritten. No private packages were downloaded."
    };
  }

  if (!dryRun) {
    await mkdir(path.dirname(targetPath), { recursive: true });
    await cp(sourcePath, targetPath, {
      recursive: true,
      force: overwrite,
      errorOnExist: !overwrite
    });
    const sourceMetaPath = `${sourcePath}.meta`;
    if (await exists(sourceMetaPath)) {
      await cp(sourceMetaPath, `${targetPath}.meta`, {
        force: overwrite,
        errorOnExist: !overwrite
      });
    }
  }

  const postImportChecklist = dryRun ? null : await buildImportChecklist(root, sample);

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    imported: !dryRun,
    skipped: false,
    dryRun,
    sourcePath,
    targetPath,
    targetExistsBefore: targetExists,
    package: packageInfo,
    packageCacheSamples,
    postImportReadyForFocusedPreparation: postImportChecklist?.readyForFocusedPreparation ?? null,
    postImportMatchingScenes: postImportChecklist?.matchingScenes ?? null,
    nextActions: dryRun
      ? plannedActions
      : [
          `Imported ${sample.name} into ${path.relative(root, targetPath)}.`,
          `Run easyar_write_import_checklist projectPath=${root} sampleId=${sample.id}.`,
          `Run easyar_check_sample_readiness projectPath=${root} sampleId=${sample.id}.`,
          `Run easyar_write_focused_preflight projectPath=${root} sampleId=${sample.id} platform=android.`
        ],
    security: "This tool copies only from local Unity PackageCache Samples~ into Assets/Samples. It does not download packages, bypass EasyAR account access, or include secret values."
  };
}

async function readPackageCacheInfo(samplePath: string): Promise<{ displayName: string; version: string; packageRoot: string | null }> {
  const samplesMarker = `${path.sep}Samples~${path.sep}`;
  const markerIndex = samplePath.indexOf(samplesMarker);
  const packageRoot = markerIndex >= 0 ? samplePath.slice(0, markerIndex) : null;
  if (packageRoot) {
    try {
      const packageJson = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8")) as { displayName?: string; version?: string };
      return {
        displayName: sanitizeAssetFolderName(packageJson.displayName ?? "EasyAR Sense Unity Plugin"),
        version: sanitizeAssetFolderName(normalizeUnityPackageVersion(packageJson.version)),
        packageRoot
      };
    } catch {
      const folderName = path.basename(packageRoot);
      return {
        displayName: "EasyAR Sense Unity Plugin",
        version: sanitizeAssetFolderName(normalizeUnityPackageVersion(parsePackageCacheFolderVersion(folderName))),
        packageRoot
      };
    }
  }
  return {
    displayName: "EasyAR Sense Unity Plugin",
    version: officialInfo.packageVersions.easyarSenseUnityPlugin,
    packageRoot: null
  };
}

function normalizeUnityPackageVersion(version: string | undefined): string {
  const value = version?.split("+")[0]?.trim();
  if (typeof value === "string" && isNonPlaceholderString(value)) {
    return value;
  }
  return officialInfo.packageVersions.easyarSenseUnityPlugin ?? "unknown";
}

function parsePackageCacheFolderVersion(folderName: string): string | undefined {
  const match = folderName.match(/@([^@]+)$/);
  return match?.[1];
}

function sanitizeAssetFolderName(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, "_").trim() || "EasyAR Sense Unity Plugin";
}

async function buildWorkflowState(
  root: string,
  sample: SampleInfo,
  platform: typeof mobilePlatforms[number],
  outputPath: string,
  maxScriptIssues: number
) {
  const importChecklist = await buildImportChecklist(root, sample);
  const officialAccess = await buildOfficialAccessReport(root, sample, platform, "unity-samples");
  const readiness = await buildSampleReadinessReport(root, sample);
  const configValidation = await buildLocalConfigValidationReport(root);
  const sceneAudit = await buildSampleSceneAudit(root, sample, 25);
  const scriptReview = await buildScriptReviewReport(root, undefined, 80, maxScriptIssues);
  const deviceValidation = await buildDeviceValidationChecklist(root, sample, platform, undefined, outputPath);
  const artifactIndex = await buildArtifactIndex(root, sample);
  const generatedDir = path.relative(root, focusedSampleGeneratedDir(root, sample));
  const missingRequiredImportItems = importChecklist.items.filter((item) => item.required && !item.ok).map((item) => item.id);
  const failingReadinessChecks = readiness.checks.filter((check) => !check.ok).map((check) => check.id);
  const failingConfigChecks = configValidation.checks.filter((check) => !check.ok).map((check) => check.id);
  const missingArtifacts = artifactIndex.missingArtifacts;
  const generatedHelpersMissing = [
    "sample-runner",
    "build-settings-helper",
    "mobile-settings-helper",
    "sample-validation-helper",
    "focused-sample-runbook"
  ].some((id) => failingReadinessChecks.includes(id));
  const state = chooseWorkflowNextState({
    root,
    sample,
    platform,
    outputPath,
    importReady: importChecklist.readyForFocusedPreparation,
    officialAccessReady: officialAccess.readyForOfficialContent,
    officialAccessBlockers: officialAccess.blockers.map((blocker) => blocker.id),
    missingRequiredImportItems,
    readinessReady: readiness.ready,
    failingReadinessChecks,
    configValid: configValidation.valid,
    failingConfigChecks,
    sceneReady: sceneAudit.readyForUnityValidation,
    sceneBlockers: sceneAudit.blockers.map((blocker) => blocker.id),
    scriptIssueCount: scriptReview.issueCount,
    deviceReady: deviceValidation.readyForDeviceValidation,
    deviceBlockers: deviceValidation.blockers.map((blocker) => blocker.id),
    missingArtifacts,
    generatedHelpersMissing
  });

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    platform,
    outputPath,
    generatedDir,
    phase: state.phase,
    blocked: state.blocked,
    reason: state.reason,
    nextCall: state.nextCall,
    summary: {
      importReady: importChecklist.readyForFocusedPreparation,
      officialAccessReady: officialAccess.readyForOfficialContent,
      officialAccessBlockers: officialAccess.blockers.map((blocker) => blocker.id),
      missingRequiredImportItems,
      readinessReady: readiness.ready,
      failingReadinessChecks,
      configValid: configValidation.valid,
      failingConfigChecks,
      sceneReady: sceneAudit.readyForUnityValidation,
      sceneBlockers: sceneAudit.blockers.map((blocker) => blocker.id),
      scriptIssueCount: scriptReview.issueCount,
      deviceReady: deviceValidation.readyForDeviceValidation,
      deviceBlockers: deviceValidation.blockers.map((blocker) => blocker.id),
      missingArtifacts
    },
    recommendedSequence: state.recommendedSequence,
    nextActions: state.nextActions,
    security: "Workflow state does not include secret values. Keep license keys, account tokens, Cloud Recognition credentials, signing keys, and provisioning secrets in local secret storage."
  };
}

function chooseWorkflowNextState(input: {
  root: string;
  sample: SampleInfo;
  platform: typeof mobilePlatforms[number];
  outputPath: string;
  importReady: boolean;
  officialAccessReady: boolean;
  officialAccessBlockers: string[];
  missingRequiredImportItems: string[];
  readinessReady: boolean;
  failingReadinessChecks: string[];
  configValid: boolean;
  failingConfigChecks: string[];
  sceneReady: boolean;
  sceneBlockers: string[];
  scriptIssueCount: number;
  deviceReady: boolean;
  deviceBlockers: string[];
  missingArtifacts: string[];
  generatedHelpersMissing: boolean;
}) {
  const baseArgs = {
    projectPath: input.root,
    sampleId: input.sample.id
  };
  if (input.sample.implementationStatus !== "focused") {
    return workflowDecision(
      "deferred-sample",
      true,
      "This sample is deferred. Current focused run-through scope is image-tracking and cloud-recognition.",
      {
        tool: "easyar_list_samples",
        arguments: {}
      },
      ["Switch to sampleId image-tracking or cloud-recognition for current run-through work."]
    );
  }

  if (!input.officialAccessReady) {
    return workflowDecision(
      "check-official-access",
      true,
      `Official EasyAR access blocker(s): ${input.officialAccessBlockers.join(", ")}.`,
      {
        tool: "easyar_check_official_access",
        arguments: {
          ...baseArgs,
          platform: input.platform,
          packageKind: "unity-samples"
        }
      },
      [
        "Configure EASYAR_API_TOKEN and official EasyAR account/license/download/cloud endpoint environment variables.",
        "Run easyar_check_official_access before expecting account-scoped downloads or Cloud Recognition credentials through MCP.",
        "Use only authorized official EasyAR account APIs; do not bypass login, license, or download gates."
      ],
      [
        { tool: "easyar_write_official_access_report", arguments: { ...baseArgs, platform: input.platform, packageKind: "unity-samples" } },
        { tool: "easyar_auth_status", arguments: {} }
      ]
    );
  }

  if (!input.importReady) {
    const needsDownloadDiscovery = input.missingRequiredImportItems.includes("official-unity-plugin-imported") || input.missingRequiredImportItems.includes("focused-sample-scene-imported");
    return workflowDecision(
      "import-official-assets",
      true,
      `Missing required official import item(s): ${input.missingRequiredImportItems.join(", ")}.`,
      needsDownloadDiscovery
        ? {
            tool: "easyar_discover_downloads",
            arguments: {
              ...baseArgs,
              packageKind: "unity-samples"
            }
          }
        : {
            tool: "easyar_write_import_checklist",
            arguments: baseArgs
          },
      [
        "Import the official EasyAR Unity Plugin and focused sample package from authorized EasyAR downloads.",
        "Rerun easyar_generate_import_checklist after importing official assets.",
        "Do not bypass EasyAR account download authorization."
      ],
      [
        { tool: "easyar_write_import_checklist", arguments: baseArgs },
        { tool: "easyar_check_sample_readiness", arguments: baseArgs }
      ]
    );
  }

  if (input.generatedHelpersMissing) {
    return workflowDecision(
      "prepare-project",
      false,
      `Generated helper/runbook check(s) missing: ${input.failingReadinessChecks.join(", ")}.`,
      {
        tool: "easyar_prepare_unity_project",
        arguments: {
          ...baseArgs,
          overwrite: false
        }
      },
      [
        "Generate focused runbook, local config template, Editor runner, mobile settings helper, Build Settings helper, and validation helper.",
        "Then copy easyar.local.json.example to easyar.local.json and fill official local credentials."
      ],
      [
        { tool: "easyar_write_artifact_index", arguments: baseArgs },
        { tool: "easyar_write_run_sequence", arguments: { ...baseArgs, platform: input.platform } }
      ]
    );
  }

  if (!input.configValid) {
    return workflowDecision(
      "configure-local-secrets",
      true,
      `Local config check(s) failing: ${input.failingConfigChecks.join(", ")}.`,
      {
        tool: "easyar_validate_local_config",
        arguments: {
          projectPath: input.root
        }
      },
      [
        "Copy ProjectSettings/EasyAR/easyar.local.json.example to easyar.local.json.",
        "Fill official EasyAR license/account values locally without committing secrets.",
        input.sample.id === "cloud-recognition"
          ? "Fill Cloud Recognition CRS AppId and API KEY from the official EasyAR account."
          : "For Image Tracking, keep target assets under Assets and avoid secret values in scripts."
      ]
    );
  }

  if (!input.sceneReady) {
    return workflowDecision(
      "configure-unity-scene",
      false,
      `Scene or Build Settings blocker(s): ${input.sceneBlockers.join(", ")}.`,
      {
        tool: "easyar_create_build_settings_helper",
        arguments: {
          ...baseArgs,
          platform: input.platform,
          overwrite: true
        }
      },
      [
        "Run the generated Build Settings helper in Unity batch mode.",
        "Run EasyARSampleValidationHelper.ValidateFocusedSample after Build Settings are configured.",
        "Use easyar_write_scene_audit to preserve the latest scene/build state."
      ],
      [
        { tool: "easyar_run_unity_method", arguments: { projectPath: input.root, executeMethod: "EasyAR.EditorTools.EasyARBuildSettingsHelper.ConfigureBuildSettings" } },
        { tool: "easyar_write_scene_audit", arguments: baseArgs }
      ]
    );
  }

  if (input.scriptIssueCount > 0) {
    return workflowDecision(
      "fix-scripts",
      true,
      `Static script review found ${input.scriptIssueCount} issue(s).`,
      {
        tool: "easyar_review_csharp_scripts",
        arguments: {
          projectPath: input.root
        }
      },
      [
        "Fix static C# issues before Unity compilation.",
        "Write CODE_CHANGE.md after script edits.",
        "Run easyar_run_unity_compile_check once script review is clean."
      ]
    );
  }

  if (input.missingArtifacts.length > 0) {
    return workflowDecision(
      "write-handoff-artifacts",
      false,
      `Missing handoff artifact(s): ${input.missingArtifacts.join(", ")}.`,
      {
        tool: "easyar_write_artifact_index",
        arguments: baseArgs
      },
      [
        "Write the missing handoff artifacts so Codex, Claude, and humans can continue from the same state.",
        "Start with RUN_SEQUENCE.md, RUN_REPORT.md, SCENE_AUDIT.md, SUPPORT_BUNDLE.md, DEVICE_VALIDATION.md, and ARTIFACT_INDEX.md."
      ],
      [
        { tool: "easyar_write_run_sequence", arguments: { ...baseArgs, platform: input.platform, outputPath: input.outputPath } },
        { tool: "easyar_write_run_report", arguments: baseArgs },
        { tool: "easyar_write_support_bundle", arguments: { ...baseArgs, platform: input.platform, outputPath: input.outputPath } }
      ]
    );
  }

  if (!input.deviceReady) {
    return workflowDecision(
      "resolve-device-preflight",
      true,
      `Device validation blocker(s): ${input.deviceBlockers.join(", ")}.`,
      {
        tool: "easyar_write_device_validation_checklist",
        arguments: {
          ...baseArgs,
          platform: input.platform,
          buildOutputPath: input.outputPath
        }
      },
      [
        "Resolve every DEVICE_VALIDATION.md blocker before building to a real device.",
        "Regenerate support bundle after fixes."
      ]
    );
  }

  return workflowDecision(
    "build-and-run-device",
    false,
    "Focused sample preflight is ready for Unity compile, player build, and real-device validation.",
    {
      tool: "easyar_create_device_build_helper",
      arguments: {
        projectPath: input.root,
        platform: input.platform,
        outputPath: input.outputPath,
        developmentBuild: true,
        overwrite: true
      }
    },
    [
      "Run easyar_run_unity_compile_check.",
      "Run EasyARDeviceBuildHelper.Build in Unity batch mode.",
      "Install on a real Android/iOS device and follow DEVICE_VALIDATION.md.",
      "Record the observed result with easyar_write_run_result."
    ],
    [
      { tool: "easyar_run_unity_compile_check", arguments: { ...baseArgs, logPath: path.join("Logs", "mcp-easyar-CompileCheck.log") } },
      { tool: "easyar_run_unity_method", arguments: { projectPath: input.root, executeMethod: "EasyAR.EditorTools.EasyARDeviceBuildHelper.Build", timeoutSeconds: 1800 } },
      { tool: "easyar_write_run_result", arguments: { ...baseArgs, platform: input.platform, overallStatus: "not-run", buildOutputPath: input.outputPath, steps: [] } }
    ]
  );
}

function workflowDecision(
  phase: string,
  blocked: boolean,
  reason: string,
  nextCall: { tool: string; arguments: Record<string, unknown> },
  nextActions: string[],
  recommendedSequence: Array<{ tool: string; arguments: Record<string, unknown> }> = []
) {
  return {
    phase,
    blocked,
    reason,
    nextCall,
    nextActions,
    recommendedSequence: recommendedSequence.length > 0 ? recommendedSequence : [nextCall]
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

async function buildFocusedPreflight(
  root: string,
  sample: SampleInfo,
  platform: typeof mobilePlatforms[number],
  outputPath: string,
  maxScriptIssues: number
) {
  const [
    accountMaterials,
    unityEnvironment,
    localConfig,
    importChecklist,
    sampleImportGuide,
    readiness,
    sceneAudit,
    scriptReview,
    workflowState
  ] = await Promise.all([
    buildAccountMaterialsReport(root, sample, platform),
    buildUnityEnvironmentReport(root, sample),
    buildLocalConfigValidationReport(root),
    buildImportChecklist(root, sample),
    buildSampleImportGuide(root, sample),
    buildSampleReadinessReport(root, sample),
    buildSampleSceneAudit(root, sample, 25),
    buildScriptReviewReport(root, undefined, 80, maxScriptIssues),
    buildWorkflowState(root, sample, platform, outputPath, maxScriptIssues)
  ]);
  const checks = [
    preflightCheck("sample-focus", sample.implementationStatus === "focused", "sample", `${sample.name} status is ${sample.implementationStatus}.`, "Use image-tracking or cloud-recognition for the current focused run-through."),
    preflightCheck("account-materials", accountMaterials.missingRequired.length === 0, "account", accountMaterials.missingRequired.length > 0 ? `Missing account material(s): ${accountMaterials.missingRequired.join(", ")}.` : "Required account materials are present or not required.", "Run easyar_write_account_onboarding and easyar_write_account_materials, then prepare official account values."),
    preflightCheck("local-config", localConfig.valid, "config", localConfig.valid ? "Local EasyAR config is valid." : `Local config failing check(s): ${localConfig.checks.filter((check) => !check.ok).map((check) => check.id).join(", ")}.`, "Run easyar_write_local_config_from_env or fill ProjectSettings/EasyAR/easyar.local.json locally, then validate again."),
    preflightCheck("unity-environment", unityEnvironment.readyForUnityBatch, "unity", unityEnvironment.readyForUnityBatch ? `Unity batch path ready: ${unityEnvironment.recommendedUnityPath}.` : "No Unity executable path is ready for batch automation.", "Run easyar_write_unity_environment_report and set EASYAR_UNITY_PATH or pass unityPath explicitly."),
    preflightCheck("official-imports", importChecklist.readyForFocusedPreparation, "import", importChecklist.readyForFocusedPreparation ? "Official plugin and focused import requirements are present." : `Missing import item(s): ${importChecklist.items.filter((item) => item.required && !item.ok).map((item) => item.id).join(", ")}.`, buildImportChecklistAction(importChecklist)),
    preflightCheck("sample-readiness", readiness.ready, "readiness", readiness.ready ? "Focused sample readiness checks passed." : `Readiness failing check(s): ${readiness.checks.filter((check) => !check.ok).map((check) => check.id).join(", ")}.`, "Run easyar_prepare_unity_project, import official assets, and rerun easyar_check_sample_readiness."),
    preflightCheck("scene-build-settings", sceneAudit.readyForUnityValidation, "scene", sceneAudit.readyForUnityValidation ? "Scene audit is ready for Unity validation." : `Scene blocker(s): ${sceneAudit.blockers.map((blocker) => blocker.id).join(", ")}.`, "Run easyar_create_build_settings_helper and execute the generated Build Settings helper in Unity batch mode."),
    preflightCheck("script-review", scriptReview.issueCount === 0, "code", scriptReview.issueCount === 0 ? "No static C# script issues were found." : `Static script review found ${scriptReview.issueCount} issue(s).`, "Fix script review issues, then write CODE_CHANGE.md and run Unity compile check.")
  ];
  const blockers = checks.filter((check) => !check.ok);
  const readyForUnityBatch = blockers.every((blocker) => !["sample", "account", "config", "unity", "import", "readiness", "code"].includes(blocker.area)) && sceneAudit.readyForUnityValidation;
  const readyForDeviceBuild = blockers.length === 0;
  const nextCall = blockers.length > 0
    ? preflightNextCall(blockers[0], root, sample, platform)
    : {
        tool: "easyar_run_unity_compile_check",
        arguments: {
          projectPath: root,
          sampleId: sample.id,
          logPath: path.join("Logs", "mcp-easyar-CompileCheck.log")
        }
      };

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    platform,
    outputPath,
    readyForUnityBatch,
    readyForDeviceBuild,
    checks,
    blockers,
    nextCall,
    nextActions: blockers.length > 0
      ? Array.from(new Set(blockers.map((blocker) => blocker.action)))
      : [
          "Run easyar_run_unity_compile_check.",
          "Run easyar_create_device_build_helper and EasyARDeviceBuildHelper.Build.",
          "Install on a real device and record the result with easyar_write_run_result."
        ],
    summaries: {
      missingAccountMaterials: accountMaterials.missingRequired,
      unityRecommendedPath: unityEnvironment.recommendedUnityPath,
      importReady: importChecklist.readyForFocusedPreparation,
      packageCacheSamples: sampleImportGuide.packageCacheSamples,
      localConfigValid: localConfig.valid,
      readinessReady: readiness.ready,
      sceneReady: sceneAudit.readyForUnityValidation,
      scriptIssueCount: scriptReview.issueCount,
      workflowPhase: workflowState.phase,
      workflowBlocked: workflowState.blocked
    },
    references: {
      accountMaterials: path.join("Assets", "EasyARGenerated", "ACCOUNT_MATERIALS.md"),
      unityEnvironment: path.join("Assets", "EasyARGenerated", "UNITY_ENVIRONMENT.md"),
      importChecklist: path.relative(root, path.join(focusedSampleGeneratedDir(root, sample), "IMPORT_CHECKLIST.md")),
      sampleImportGuide: path.relative(root, path.join(focusedSampleGeneratedDir(root, sample), "SAMPLE_IMPORT_GUIDE.md")),
      workflowState: path.relative(root, path.join(focusedSampleGeneratedDir(root, sample), "WORKFLOW_STATE.md")),
      runReport: path.relative(root, path.join(focusedSampleGeneratedDir(root, sample), "RUN_REPORT.md")),
      sceneAudit: path.relative(root, path.join(focusedSampleGeneratedDir(root, sample), "SCENE_AUDIT.md"))
    },
    security: "Focused preflight reports field presence, paths, blockers, and next calls only. It does not include EasyAR tokens, license keys, Cloud Recognition secrets, signing keys, or provisioning secrets."
  };
}

function buildImportChecklistAction(importChecklist: Awaited<ReturnType<typeof buildImportChecklist>>): string {
  const missingRequired = importChecklist.items.filter((item) => item.required && !item.ok);
  const missingScene = missingRequired.find((item) => item.id === "focused-sample-scene-imported");
  if (missingScene && importChecklist.packageCacheSamples.length > 0) {
    return "Run easyar_import_sample_from_package_cache with dryRun=true first, then import the focused sample from local PackageCache or use easyar_write_sample_import_guide for manual Unity steps.";
  }
  return missingRequired[0]?.action ?? "Run easyar_generate_import_checklist and resolve the first missing official import item.";
}

function preflightCheck(id: string, ok: boolean, area: string, detail: string, action: string) {
  return {
    id,
    ok,
    area,
    detail,
    action
  };
}

function preflightNextCall(
  blocker: ReturnType<typeof preflightCheck>,
  root: string,
  sample: SampleInfo,
  platform: typeof mobilePlatforms[number]
) {
  if (blocker.id === "account-materials") {
    return { tool: "easyar_write_account_materials", arguments: { projectPath: root, sampleId: sample.id, platform } };
  }
  if (blocker.id === "local-config") {
    return { tool: "easyar_validate_local_config", arguments: { projectPath: root } };
  }
  if (blocker.id === "unity-environment") {
    return { tool: "easyar_write_unity_environment_report", arguments: { projectPath: root, sampleId: sample.id } };
  }
  if (blocker.id === "official-imports") {
    return { tool: "easyar_write_sample_import_guide", arguments: { projectPath: root, sampleId: sample.id } };
  }
  if (blocker.id === "sample-readiness") {
    return { tool: "easyar_check_sample_readiness", arguments: { projectPath: root, sampleId: sample.id } };
  }
  if (blocker.id === "scene-build-settings") {
    return { tool: "easyar_write_scene_audit", arguments: { projectPath: root, sampleId: sample.id } };
  }
  if (blocker.id === "script-review") {
    return { tool: "easyar_review_csharp_scripts", arguments: { projectPath: root } };
  }
  return { tool: "easyar_next_workflow_step", arguments: { projectPath: root, sampleId: sample.id, platform } };
}

async function buildArtifactIndex(root: string, sample: SampleInfo) {
  const artifacts = await Promise.all(focusedArtifactDefinitions(root, sample).map(async (artifact, index) => {
    const absolutePath = path.join(root, artifact.relativePath);
    let fileInfo = {
      exists: false,
      sizeBytes: null as number | null,
      modifiedAt: null as string | null
    };
    try {
      const info = await stat(absolutePath);
      fileInfo = {
        exists: info.isFile(),
        sizeBytes: info.isFile() ? info.size : null,
        modifiedAt: info.isFile() ? info.mtime.toISOString() : null
      };
    } catch {
      // Missing artifacts are reported below.
    }
    return {
      order: index + 1,
      ...artifact,
      ...fileInfo
    };
  }));
  const missingArtifacts = artifacts.filter((artifact) => !artifact.exists);

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    artifacts,
    readOrder: focusedArtifactReadOrder(artifacts),
    missingArtifacts: missingArtifacts.map((artifact) => artifact.relativePath),
    nextActions: missingArtifacts.length > 0
      ? Array.from(new Set(missingArtifacts.map((artifact) => artifact.generateWith)))
      : ["Read PREFLIGHT.md first, then SUPPORT_BUNDLE.md, RUN_RESULT.md, and CODE_CHANGE.md for the latest handoff state."],
    security: "Artifact index contains file metadata only. Individual artifacts should not contain secret values."
  };
}

type FocusedHandoffPackInput = {
  root: string;
  sampleId: typeof focusedHandoffSampleIds[number];
  platform: typeof mobilePlatforms[number];
  accountStage: AccountStage;
  client: typeof clientKinds[number];
  entrypointMode: typeof clientEntrypointModes[number];
  serverPath?: string;
  outputPath?: string;
  developmentBuild: boolean;
  programmingGoal: string;
  codeGoal: string;
  maxScriptIssues: number;
  maxCandidates: number;
  maxLogBytes: number;
  maxLogIssues: number;
};

function focusedHandoffPackSamples(sampleId: typeof focusedHandoffSampleIds[number]) {
  return sampleId === "all"
    ? focusedSamples()
    : [findSample(sampleId)];
}

async function buildFocusedHandoffPackPlan(input: FocusedHandoffPackInput) {
  const samples = focusedHandoffPackSamples(input.sampleId);
  const samplePlans = await Promise.all(samples.map(async (sample) => {
    const outputPath = input.outputPath ?? defaultFocusedOutputPath(sample, input.platform);
    const artifactIndex = await buildArtifactIndex(input.root, sample);
    const plannedArtifacts = focusedHandoffPackArtifactSpecs(input.root, sample).map((artifact) => {
      const current = artifactIndex.artifacts.find((item) => item.relativePath === artifact.relativePath);
      return {
        ...artifact,
        exists: current?.exists ?? false,
        sizeBytes: current?.sizeBytes ?? null
      };
    });
    return {
      sample: {
        id: sample.id,
        name: sample.name,
        implementationStatus: sample.implementationStatus
      },
      outputPath,
      artifactCount: plannedArtifacts.length,
      missingCount: plannedArtifacts.filter((artifact) => !artifact.exists).length,
      plannedArtifacts
    };
  }));

  return {
    generatedAt: new Date().toISOString(),
    projectPath: input.root,
    platform: input.platform,
    requestedSampleId: input.sampleId,
    samples: samplePlans,
    projectArtifacts: [
      path.join("Assets", "EasyARGenerated", "PROJECT_HANDOFF.md"),
      path.join("Assets", "EasyARGenerated", "FOCUSED_SCOPE_STATUS.md"),
      path.join("Assets", "EasyARGenerated", "REMAINING_WORK.md")
    ],
    nextActions: [
      `Run easyar_write_focused_handoff_pack projectPath=${input.root} sampleId=${input.sampleId} platform=${input.platform}.`,
      "After the pack is written, read ARTIFACT_INDEX.md, PREFLIGHT.md, LOCAL_CONFIG_FORM.md, and PROJECT_HANDOFF.md before Unity automation.",
      "Do not mark RUN_RESULT.md as passed until real-device evidence exists."
    ],
    security: "The focused handoff pack plans and writes generated Markdown diagnostics only. It does not create or expose EasyAR account tokens, license keys, Cloud Recognition appKey/appSecret, or passed device evidence."
  };
}

async function writeFocusedHandoffPack(input: FocusedHandoffPackInput & { overwrite: boolean }) {
  const plan = await buildFocusedHandoffPackPlan(input);
  const samples = focusedHandoffPackSamples(input.sampleId);
  const sampleResults = [];
  const written: string[] = [];
  const skipped: string[] = [];
  for (const sample of samples) {
    const outputPath = input.outputPath ?? defaultFocusedOutputPath(sample, input.platform);
    const sampleResult = await writeFocusedHandoffPackForSample(input, sample, outputPath, written, skipped);
    sampleResults.push(sampleResult);
  }

  const projectHandoff = await buildProjectHandoff({
    root: input.root,
    platform: input.platform,
    client: input.client,
    entrypointMode: input.entrypointMode,
    serverPath: input.serverPath,
    maxScriptIssues: input.maxScriptIssues,
    maxLogBytes: input.maxLogBytes,
    maxLogIssues: input.maxLogIssues
  });
  await writePackFile(input.root, path.join("Assets", "EasyARGenerated", "PROJECT_HANDOFF.md"), buildProjectHandoffMarkdown(projectHandoff), input.overwrite, written, skipped);
  const focusedScope = await buildFocusedScopeStatus(input.root, input.platform, input.maxScriptIssues, input.maxLogBytes, input.maxLogIssues);
  await writePackFile(input.root, path.join("Assets", "EasyARGenerated", "FOCUSED_SCOPE_STATUS.md"), buildFocusedScopeStatusMarkdown(focusedScope), input.overwrite, written, skipped);
  const remainingWork = await buildRemainingWorkReport({
    root: input.root,
    platform: input.platform,
    verificationEvidence: "passed",
    maxScriptIssues: input.maxScriptIssues,
    maxLogBytes: input.maxLogBytes,
    maxLogIssues: input.maxLogIssues
  });
  await writePackFile(input.root, path.join("Assets", "EasyARGenerated", "REMAINING_WORK.md"), buildRemainingWorkMarkdown(remainingWork), input.overwrite, written, skipped);

  return {
    generatedAt: new Date().toISOString(),
    projectPath: input.root,
    platform: input.platform,
    requestedSampleId: input.sampleId,
    sampleCount: sampleResults.length,
    samples: sampleResults,
    written,
    skipped,
    writtenCount: written.length,
    skippedCount: skipped.length,
    focusedSamplesComplete: focusedScope.allFocusedSamplesComplete,
    remainingPercent: remainingWork.overall.remainingPercent,
    topNextCall: projectHandoff.topNextCall,
    nextActions: Array.from(new Set([
      ...sampleResults.flatMap((sample) => sample.nextActions),
      ...projectHandoff.nextActions,
      "Keep RUN_RESULT.md and CODE_CHANGE.md evidence-based; generate them only after real runs or real code edits."
    ])).slice(0, 18),
    planned: plan,
    security: "The focused handoff pack wrote generated Markdown diagnostics and forms only. It did not write EasyAR secret values, fake run results, or fake code change evidence."
  };
}

async function writeFocusedHandoffPackForSample(
  input: FocusedHandoffPackInput & { overwrite: boolean },
  sample: SampleInfo,
  outputPath: string,
  written: string[],
  skipped: string[]
) {
  const base = path.relative(input.root, focusedSampleGeneratedDir(input.root, sample));
  const artifacts: Array<{ name: string; relativePath: string; markdown: string }> = [];
  const onboarding = await buildOnboardingReport({
    root: input.root,
    sample,
    client: input.client,
    entrypointMode: input.entrypointMode,
    platform: input.platform,
    serverPath: input.serverPath,
    outputPath,
    maxScriptIssues: input.maxScriptIssues
  });
  artifacts.push({ name: "Onboarding", relativePath: path.join(base, "ONBOARDING.md"), markdown: buildOnboardingMarkdown(onboarding) });
  const localConfigForm = await buildLocalConfigForm(input.root, sample, input.platform, input.accountStage, undefined);
  artifacts.push({ name: "Local Config Form", relativePath: path.join(base, "LOCAL_CONFIG_FORM.md"), markdown: buildLocalConfigFormMarkdown(localConfigForm) });
  const workflowState = await buildWorkflowState(input.root, sample, input.platform, outputPath, input.maxScriptIssues);
  artifacts.push({ name: "Workflow State", relativePath: path.join(base, "WORKFLOW_STATE.md"), markdown: buildWorkflowStateMarkdown(workflowState) });
  const officialAccess = await buildOfficialAccessReport(input.root, sample, input.platform, "unity-samples");
  artifacts.push({ name: "Official Access", relativePath: path.join(base, "OFFICIAL_ACCESS.md"), markdown: buildOfficialAccessMarkdown(officialAccess) });
  const importGuide = await buildSampleImportGuide(input.root, sample);
  artifacts.push({ name: "Sample Import Guide", relativePath: path.join(base, "SAMPLE_IMPORT_GUIDE.md"), markdown: buildSampleImportGuideMarkdown(importGuide) });
  const runSequence = buildFocusedRunSequence({
    projectPath: input.root,
    sample,
    platform: input.platform,
    outputPath,
    developmentBuild: input.developmentBuild
  });
  artifacts.push({ name: "Run Sequence", relativePath: path.join(base, "RUN_SEQUENCE.md"), markdown: buildRunSequenceMarkdown(runSequence) });
  const runReport = await buildFocusedRunReport(input.root, sample, input.maxScriptIssues);
  artifacts.push({ name: "Run Report", relativePath: path.join(base, "RUN_REPORT.md"), markdown: buildRunReportMarkdown(runReport) });
  const preflight = await buildFocusedPreflight(input.root, sample, input.platform, outputPath, input.maxScriptIssues);
  artifacts.push({ name: "Focused Preflight", relativePath: path.join(base, "PREFLIGHT.md"), markdown: buildFocusedPreflightMarkdown(preflight) });
  const sceneAudit = await buildSampleSceneAudit(input.root, sample, input.maxCandidates);
  artifacts.push({ name: "Scene Audit", relativePath: path.join(base, "SCENE_AUDIT.md"), markdown: buildSceneAuditMarkdown(sceneAudit) });
  const supportBundle = await buildSupportBundle({
    root: input.root,
    sample,
    platform: input.platform,
    outputPath,
    developmentBuild: input.developmentBuild,
    maxScriptIssues: input.maxScriptIssues,
    maxCandidates: input.maxCandidates,
    maxLogBytes: input.maxLogBytes,
    maxLogIssues: input.maxLogIssues
  });
  artifacts.push({ name: "Support Bundle", relativePath: path.join(base, "SUPPORT_BUNDLE.md"), markdown: buildSupportBundleMarkdown(supportBundle) });
  const deviceValidation = await buildDeviceValidationChecklist(input.root, sample, input.platform, undefined, outputPath);
  artifacts.push({ name: "Device Validation", relativePath: path.join(base, "DEVICE_VALIDATION.md"), markdown: buildDeviceValidationChecklistMarkdown(deviceValidation) });
  const deviceRunForm = await buildDeviceRunResultForm(input.root, sample, input.platform, undefined, outputPath, undefined);
  artifacts.push({ name: "Device Run Result Form", relativePath: path.join(base, "DEVICE_RUN_RESULT_FORM.md"), markdown: buildDeviceRunResultFormMarkdown(deviceRunForm) });
  const configAudit = await buildConfigIntegrationAudit(input.root, sample, 120, 40);
  artifacts.push({ name: "Config Integration Audit", relativePath: path.join(base, "CONFIG_INTEGRATION.md"), markdown: buildConfigIntegrationAuditMarkdown(configAudit) });
  const programmingContext = await buildProgrammingContext(input.root, sample, input.programmingGoal, 80, input.maxScriptIssues);
  artifacts.push({ name: "Programming Context", relativePath: path.join(base, "PROGRAMMING_CONTEXT.md"), markdown: buildProgrammingContextMarkdown(programmingContext) });
  const codePlan = await buildCodePlan(input.root, sample, input.codeGoal, [], input.maxScriptIssues);
  artifacts.push({ name: "Code Plan", relativePath: path.join(base, "CODE_PLAN.md"), markdown: buildCodePlanMarkdown(codePlan) });

  for (const artifact of artifacts) {
    await writePackFile(input.root, artifact.relativePath, artifact.markdown, input.overwrite, written, skipped);
  }

  const indexBeforePack = await buildArtifactIndex(input.root, sample);
  const packSummary = buildFocusedHandoffPackMarkdown({
    generatedAt: new Date().toISOString(),
    projectPath: input.root,
    sample,
    platform: input.platform,
    outputPath,
    artifactNames: artifacts.map((artifact) => artifact.name),
    artifactIndex: indexBeforePack,
    workflowState,
    preflight,
    localConfigForm
  });
  await writePackFile(input.root, path.join(base, "HANDOFF_PACK.md"), packSummary, input.overwrite, written, skipped);
  const refreshedIndex = await buildArtifactIndex(input.root, sample);
  await writePackFile(input.root, path.join(base, "ARTIFACT_INDEX.md"), buildArtifactIndexMarkdown(refreshedIndex), input.overwrite, written, skipped);

  return {
    sampleId: sample.id,
    sampleName: sample.name,
    outputPath,
    artifactCount: artifacts.length + 2,
    missingArtifactsAfterWrite: refreshedIndex.missingArtifacts,
    workflowPhase: workflowState.phase,
    workflowBlocked: workflowState.blocked,
    readyForUnityBatch: preflight.readyForUnityBatch,
    readyForDeviceBuild: preflight.readyForDeviceBuild,
    localConfigMissingFields: localConfigForm.missingRequiredFields,
    nextActions: Array.from(new Set([
      ...workflowState.nextActions,
      ...preflight.nextActions,
      ...localConfigForm.nextActions
    ])).slice(0, 10)
  };
}

function focusedHandoffPackArtifactSpecs(root: string, sample: SampleInfo) {
  const base = path.relative(root, focusedSampleGeneratedDir(root, sample));
  return [
    "ONBOARDING.md",
    "LOCAL_CONFIG_FORM.md",
    "WORKFLOW_STATE.md",
    "OFFICIAL_ACCESS.md",
    "SAMPLE_IMPORT_GUIDE.md",
    "RUN_SEQUENCE.md",
    "RUN_REPORT.md",
    "PREFLIGHT.md",
    "SCENE_AUDIT.md",
    "SUPPORT_BUNDLE.md",
    "DEVICE_VALIDATION.md",
    "DEVICE_RUN_RESULT_FORM.md",
    "CONFIG_INTEGRATION.md",
    "PROGRAMMING_CONTEXT.md",
    "CODE_PLAN.md",
    "ARTIFACT_INDEX.md",
    "HANDOFF_PACK.md"
  ].map((name) => ({
    name,
    relativePath: path.join(base, name),
    purpose: focusedHandoffPackPurpose(name)
  }));
}

function focusedHandoffPackPurpose(name: string): string {
  const purposes: Record<string, string> = {
    "ONBOARDING.md": "Client, release, official access, and workflow overview.",
    "LOCAL_CONFIG_FORM.md": "Field-by-field local config form without secret values.",
    "WORKFLOW_STATE.md": "Current blocker and next MCP call.",
    "OFFICIAL_ACCESS.md": "Official endpoint/token/license/download access status.",
    "SAMPLE_IMPORT_GUIDE.md": "Focused official sample import instructions.",
    "RUN_SEQUENCE.md": "Ordered MCP and Unity batch commands.",
    "RUN_REPORT.md": "Readiness, config, and script review summary.",
    "PREFLIGHT.md": "Single gate before Unity automation and device validation.",
    "SCENE_AUDIT.md": "Scene, Build Settings, EasyAR, and sample-specific signals.",
    "SUPPORT_BUNDLE.md": "Diagnostic handoff across run report, scene audit, sequence, and logs.",
    "DEVICE_VALIDATION.md": "Real-device validation checklist.",
    "DEVICE_RUN_RESULT_FORM.md": "Fillable real-device result form.",
    "CONFIG_INTEGRATION.md": "Local config wiring audit for scripts/assets/scenes.",
    "PROGRAMMING_CONTEXT.md": "Script inventory and programming handoff.",
    "CODE_PLAN.md": "Scoped plan before C# edits.",
    "ARTIFACT_INDEX.md": "Focused artifact status and reading order.",
    "HANDOFF_PACK.md": "Pack summary for another AI tool or human operator."
  };
  return purposes[name] ?? "Generated focused handoff artifact.";
}

async function writePackFile(
  root: string,
  relativePath: string,
  markdown: string,
  overwrite: boolean,
  written: string[],
  skipped: string[]
) {
  const target = path.resolve(root, relativePath);
  assertInside(root, target);
  const before = written.length;
  await writeGeneratedFile(target, markdown, overwrite, written);
  if (written.length === before) {
    skipped.push(target);
  }
}

function defaultFocusedOutputPath(sample: SampleInfo, platform: typeof mobilePlatforms[number]) {
  return platform === "android"
    ? `Builds/${sample.id}.apk`
    : `Builds/iOS/${sample.id}`;
}

function focusedArtifactReadOrder(artifacts: Array<{ relativePath: string }>): string[] {
  const priority = [
    "ACCOUNT_ONBOARDING.md",
    "ACCOUNT_MATERIALS.md",
    "LOCAL_CONFIG_FORM.md",
    "UNITY_ENVIRONMENT.md",
    "FOCUSED_SCOPE_STATUS.md",
    "PREFLIGHT.md",
    "WORKFLOW_STATE.md",
    "OFFICIAL_ACCESS.md",
    "SAMPLE_IMPORT_GUIDE.md",
    "IMPORT_CHECKLIST.md",
    "RUN_SEQUENCE.md",
    "RUN_REPORT.md",
    "SCENE_AUDIT.md",
    "SUPPORT_BUNDLE.md",
    "DEVICE_VALIDATION.md",
    "DEVICE_RUN_RESULT_FORM.md",
    "RUN_RESULT.md",
    "COMPLETION_REPORT.md",
    "ISSUE_REPORT.md",
    "CONFIG_INTEGRATION.md",
    "PROGRAMMING_CONTEXT.md",
    "CODE_PLAN.md",
    "CODE_CHANGE.md",
    "HANDOFF_PACK.md",
    "ARTIFACT_INDEX.md"
  ];
  return [...artifacts]
    .sort((left, right) => artifactPriority(left.relativePath, priority) - artifactPriority(right.relativePath, priority))
    .map((artifact) => artifact.relativePath);
}

function artifactPriority(relativePath: string, priority: string[]): number {
  const normalized = relativePath.replace(/\\/g, "/");
  const index = priority.findIndex((name) => normalized.endsWith(name));
  return index === -1 ? priority.length : index;
}

function focusedArtifactDefinitions(root: string, sample: SampleInfo) {
  const base = path.relative(root, focusedSampleGeneratedDir(root, sample));
  return [
    {
      name: "Runbook",
      relativePath: path.join(base, "RUNBOOK.md"),
      purpose: "Human-readable focused sample checklist.",
      generateWith: `easyar_prepare_unity_project sampleId=${sample.id}`
    },
    {
      name: "Onboarding",
      relativePath: path.join(base, "ONBOARDING.md"),
      purpose: "First-run overview across client setup, official access, release manifest, and workflow state.",
      generateWith: `easyar_write_onboarding_report sampleId=${sample.id}`
    },
    {
      name: "Account Onboarding",
      relativePath: path.join("Assets", "EasyARGenerated", "ACCOUNT_ONBOARDING.md"),
      purpose: "Official EasyAR registration/login, license, Cloud Recognition, and local secret setup guide.",
      generateWith: `easyar_write_account_onboarding sampleId=${sample.id}`
    },
    {
      name: "Account Materials",
      relativePath: path.join("Assets", "EasyARGenerated", "ACCOUNT_MATERIALS.md"),
      purpose: "Field-by-field EasyAR account material source, storage, and sharing policy checklist.",
      generateWith: `easyar_write_account_materials sampleId=${sample.id}`
    },
    {
      name: "Local Config Form",
      relativePath: path.join(base, "LOCAL_CONFIG_FORM.md"),
      purpose: "Fillable easyar.local.json field form with placeholders, source map, env alternatives, and validation calls.",
      generateWith: `easyar_write_local_config_form sampleId=${sample.id}`
    },
    {
      name: "Unity Environment",
      relativePath: path.join("Assets", "EasyARGenerated", "UNITY_ENVIRONMENT.md"),
      purpose: "Unity executable discovery, EASYAR_UNITY_PATH setup, and batch compile dry-run guidance.",
      generateWith: `easyar_write_unity_environment_report sampleId=${sample.id}`
    },
    {
      name: "Focused Scope Status",
      relativePath: path.join("Assets", "EasyARGenerated", "FOCUSED_SCOPE_STATUS.md"),
      purpose: "Overall Image Tracking and Cloud Recognition completion state and next actions.",
      generateWith: "easyar_write_focused_scope_status"
    },
    {
      name: "Focused Preflight",
      relativePath: path.join(base, "PREFLIGHT.md"),
      purpose: "Single focused gate across account, local config, Unity path, imports, scene readiness, and script review.",
      generateWith: `easyar_write_focused_preflight sampleId=${sample.id}`
    },
    {
      name: "Workflow State",
      relativePath: path.join(base, "WORKFLOW_STATE.md"),
      purpose: "Current focused workflow phase, blockers, and next MCP call.",
      generateWith: `easyar_write_workflow_state sampleId=${sample.id}`
    },
    {
      name: "Official Access",
      relativePath: path.join(base, "OFFICIAL_ACCESS.md"),
      purpose: "Official account, license, downloads, and sample-specific access checks.",
      generateWith: `easyar_write_official_access_report sampleId=${sample.id}`
    },
    {
      name: "Import Checklist",
      relativePath: path.join(base, "IMPORT_CHECKLIST.md"),
      purpose: "Official EasyAR Unity Plugin and focused sample import evidence.",
      generateWith: `easyar_write_import_checklist sampleId=${sample.id}`
    },
    {
      name: "Sample Import Guide",
      relativePath: path.join(base, "SAMPLE_IMPORT_GUIDE.md"),
      purpose: "Unity Package Manager steps for importing the focused official sample from Samples~ into Assets/Samples.",
      generateWith: `easyar_write_sample_import_guide sampleId=${sample.id}`
    },
    {
      name: "Run Sequence",
      relativePath: path.join(base, "RUN_SEQUENCE.md"),
      purpose: "Ordered MCP and Unity batch execution sequence.",
      generateWith: `easyar_write_run_sequence sampleId=${sample.id}`
    },
    {
      name: "Run Report",
      relativePath: path.join(base, "RUN_REPORT.md"),
      purpose: "Current readiness, config, script review, and next phase.",
      generateWith: `easyar_write_run_report sampleId=${sample.id}`
    },
    {
      name: "Scene Audit",
      relativePath: path.join(base, "SCENE_AUDIT.md"),
      purpose: "Scene candidates, Build Settings hints, EasyAR signals, and sample blockers.",
      generateWith: `easyar_write_scene_audit sampleId=${sample.id}`
    },
    {
      name: "Support Bundle",
      relativePath: path.join(base, "SUPPORT_BUNDLE.md"),
      purpose: "Single diagnostic handoff across report, audit, sequence, and latest Unity logs.",
      generateWith: `easyar_write_support_bundle sampleId=${sample.id}`
    },
    {
      name: "Run Result",
      relativePath: path.join(base, "RUN_RESULT.md"),
      purpose: "Latest compile, build, or device validation outcome.",
      generateWith: `easyar_write_run_result sampleId=${sample.id}`
    },
    {
      name: "Completion Report",
      relativePath: path.join(base, "COMPLETION_REPORT.md"),
      purpose: "Final focused run-through status across preflight, device validation, run result, and latest log evidence.",
      generateWith: `easyar_write_completion_report sampleId=${sample.id}`
    },
    {
      name: "Issue Report",
      relativePath: path.join(base, "ISSUE_REPORT.md"),
      purpose: "Redacted GitHub issue body for focused sample failures.",
      generateWith: `easyar_write_issue_report sampleId=${sample.id}`
    },
    {
      name: "Config Integration Audit",
      relativePath: path.join(base, "CONFIG_INTEGRATION.md"),
      purpose: "Local EasyAR config consumer candidates across scripts, scenes, prefabs, and assets.",
      generateWith: `easyar_write_config_integration_audit sampleId=${sample.id}`
    },
    {
      name: "Programming Context",
      relativePath: path.join(base, "PROGRAMMING_CONTEXT.md"),
      purpose: "Focused Unity C# script inventory, generated helper summary, static review, and recommended programming workflow.",
      generateWith: `easyar_write_programming_context sampleId=${sample.id}`
    },
    {
      name: "Device Validation",
      relativePath: path.join(base, "DEVICE_VALIDATION.md"),
      purpose: "Real-device test steps, pass criteria, and evidence prompts.",
      generateWith: `easyar_write_device_validation_checklist sampleId=${sample.id}`
    },
    {
      name: "Device Run Result Form",
      relativePath: path.join(base, "DEVICE_RUN_RESULT_FORM.md"),
      purpose: "Fillable real-device result form and safe easyar_write_run_result templates.",
      generateWith: `easyar_write_device_run_result_form sampleId=${sample.id}`
    },
    {
      name: "Code Plan",
      relativePath: path.join(base, "CODE_PLAN.md"),
      purpose: "Scoped C# implementation plan before script edits.",
      generateWith: `easyar_write_code_plan sampleId=${sample.id}`
    },
    {
      name: "Code Change",
      relativePath: path.join(base, "CODE_CHANGE.md"),
      purpose: "C# change summary after script edits and before Unity compilation.",
      generateWith: `easyar_write_code_change_summary sampleId=${sample.id}`
    },
    {
      name: "Focused Handoff Pack",
      relativePath: path.join(base, "HANDOFF_PACK.md"),
      purpose: "Summary written by easyar_write_focused_handoff_pack for another AI tool or human operator.",
      generateWith: `easyar_write_focused_handoff_pack sampleId=${sample.id}`
    },
    {
      name: "Artifact Index",
      relativePath: path.join(base, "ARTIFACT_INDEX.md"),
      purpose: "Index of focused sample handoff artifacts and reading order.",
      generateWith: `easyar_write_artifact_index sampleId=${sample.id}`
    }
  ];
}

async function buildSampleSceneAudit(root: string, sample: SampleInfo, maxCandidates: number) {
  const allEasyARSignals = await findFiles(root, ["Assets", "Packages"], /easyar/i, maxCandidates * 3);
  const easyarSignals = filterOfficialEasyARSignals(allEasyARSignals).slice(0, maxCandidates);
  const ignoredGeneratedSignals = allEasyARSignals
    .filter((candidatePath) => !filterOfficialEasyARSignals([candidatePath]).includes(candidatePath))
    .slice(0, maxCandidates);
  const sampleScenes = await findFiles(root, ["Assets"], /\.(unity)$/i, maxCandidates * 3);
  const matchingScenes = (await matchSampleScenes(root, sample, sampleScenes)).slice(0, maxCandidates);
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
    codePlan: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "CODE_PLAN.md")),
    artifactIndex: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "ARTIFACT_INDEX.md"))
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

async function buildDeviceRunResultForm(
  root: string,
  sample: SampleInfo,
  platform: typeof mobilePlatforms[number],
  device?: string,
  buildOutputPath?: string,
  notes?: string
) {
  const checklist = await buildDeviceValidationChecklist(root, sample, platform, device, buildOutputPath);
  const recordedDevice = hasRecordedDevice(device ?? null) ? device : "<physical device model and OS>";
  const recordedBuildOutput = isNonPlaceholderString(buildOutputPath) ? buildOutputPath : platform === "android"
    ? "Builds/<sample-id>.apk"
    : "Builds/iOS/<sample-id>";
  const formSteps = [
    {
      name: "Unity compile",
      status: "not-run" as const,
      evidencePrompt: "Project-local Unity compile log path and whether the Editor exited successfully.",
      nextActionPrompt: "Resolve compile/import errors before building for device.",
      requiredForCompletion: true
    },
    {
      name: "Device build",
      status: "not-run" as const,
      evidencePrompt: `Build artifact path, signing/provisioning result, and install result for ${platform}.`,
      nextActionPrompt: "Resolve build, signing, Gradle, Xcode, or install failures before real-device validation.",
      requiredForCompletion: true
    },
    ...checklist.steps
      .filter((step) => step.id !== "record-result")
      .map((step) => ({
        name: step.title === "Verify camera startup"
          ? "Real device validation - camera startup"
          : `Real device validation - ${step.title}`,
        status: "not-run" as const,
        evidencePrompt: `${step.expected} Evidence to record: ${step.action}`,
        nextActionPrompt: "Record the observed behavior, log path, and next fix if this step does not pass.",
        requiredForCompletion: true
      })),
    {
      name: "Real device validation - sample pass criteria",
      status: "not-run" as const,
      evidencePrompt: sampleDevicePassCriteria(sample).join(" "),
      nextActionPrompt: "Only mark passed after every sample-specific criterion is observed on a physical device.",
      requiredForCompletion: true
    }
  ];
  const safeDraftRunResultArguments = {
    projectPath: root,
    sampleId: sample.id,
    platform,
    overallStatus: "blocked",
    device: recordedDevice,
    buildOutputPath: recordedBuildOutput,
    notes: sanitizeRunResultNotes(notes) ?? "Draft device run result. Replace placeholders with observed evidence before writing RUN_RESULT.md.",
    steps: formSteps.map((step) => ({
      name: step.name,
      status: step.status,
      evidence: `<${step.evidencePrompt}>`,
      nextAction: step.nextActionPrompt
    }))
  };
  const passedRunResultTemplate = {
    ...safeDraftRunResultArguments,
    overallStatus: "passed",
    notes: "Use this passed template only after all required real-device validation steps pass with observed evidence.",
    steps: formSteps.map((step) => ({
      name: step.name,
      status: "passed",
      evidence: step.name.includes("sample pass criteria")
        ? `<${sample.name} passed on ${recordedDevice}; record target/recognition outcome without secrets.>`
        : `<Observed on ${recordedDevice}: ${step.evidencePrompt}>`
    }))
  };
  const completionAcceptanceRules = [
    "Write RUN_RESULT.md with overallStatus=passed only after a physical Android or iOS device run passes.",
    "Record a non-placeholder device model or device label.",
    "Include at least one passed step whose name includes Real device validation or Device validation.",
    "Keep compile-only and build-only outcomes as blocked until real-device validation evidence exists.",
    sample.id === "cloud-recognition"
      ? "Record recognition status and target/library identifiers without appKey, appSecret, license keys, tokens, passwords, or raw secret-bearing logs."
      : "Record target image, detection, anchored content, and tracking stability evidence without license keys, tokens, passwords, or raw secret-bearing logs."
  ];

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    platform,
    device: device ?? null,
    buildOutputPath: buildOutputPath ?? null,
    readyForDeviceValidation: checklist.readyForDeviceValidation,
    blockerCount: checklist.blockers.length,
    blockers: checklist.blockers,
    formSteps,
    passCriteria: checklist.passCriteria,
    evidencePrompts: checklist.evidencePrompts,
    completionAcceptanceRules,
    safeDraftRunResultArguments,
    passedRunResultTemplate,
    nextActions: checklist.readyForDeviceValidation
      ? [
          "Run the focused sample on a physical Android or iOS device.",
          "Fill this form with observed evidence.",
          "Call easyar_write_run_result using the safe draft for blocked/failed attempts or the passed template only after every required step passes.",
          `Regenerate completion evidence with easyar_write_completion_report projectPath=${root} sampleId=${sample.id} platform=${platform}.`
        ]
      : [
          ...checklist.nextActions,
          `Regenerate this form after blockers are resolved with easyar_write_device_run_result_form projectPath=${root} sampleId=${sample.id} platform=${platform}.`
        ],
    security: "This form is designed for evidence collection only. Do not paste EasyAR license keys, account tokens, Cloud Recognition appKey/appSecret, signing keys, provisioning profiles, passwords, private device identifiers, or raw secret-bearing logs."
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

async function buildCompletionReport(
  root: string,
  sample: SampleInfo,
  platform: typeof mobilePlatforms[number],
  outputPath: string,
  maxScriptIssues: number,
  maxLogBytes: number,
  maxLogIssues: number
) {
  const [
    preflight,
    deviceValidation,
    latestLog,
    runResultArtifact
  ] = await Promise.all([
    buildFocusedPreflight(root, sample, platform, outputPath, maxScriptIssues),
    buildDeviceValidationChecklist(root, sample, platform, undefined, outputPath),
    buildLatestLogDiagnostic(root, sample, maxLogBytes, maxLogIssues),
    readRunResultArtifact(root, sample)
  ]);
  const preflightPassed = preflight.readyForDeviceBuild;
  const deviceReady = deviceValidation.readyForDeviceValidation;
  const runResultPassed = runResultArtifact.overallStatus === "passed";
  const realDeviceRunPassed = runResultPassed && runResultArtifact.hasPassedDeviceValidationEvidence;
  const hasRunResult = runResultArtifact.exists;
  const hasBlockingLogIssues = latestLog.issues.some((issue) => issue.severity === "high");
  const completionStatus = chooseCompletionStatus(hasRunResult, runResultArtifact.overallStatus, preflightPassed, deviceReady, realDeviceRunPassed, hasBlockingLogIssues);
  const runThroughComplete = completionStatus === "passed";
  const requiredEvidence = [
    {
      id: "focused-preflight",
      required: true,
      passed: preflightPassed,
      detail: "PREFLIGHT.md must report readyForDeviceBuild=true."
    },
    {
      id: "device-validation-ready",
      required: true,
      passed: deviceReady,
      detail: "DEVICE_VALIDATION.md must have no sample/import/scene blockers before real-device testing."
    },
    {
      id: "run-result-passed",
      required: true,
      passed: runResultPassed,
      detail: "RUN_RESULT.md must exist and record Overall status: passed after real device validation."
    },
    {
      id: "real-device-run-evidence",
      required: true,
      passed: realDeviceRunPassed,
      detail: "RUN_RESULT.md must include a recorded device and a passed real-device/device-validation step."
    },
    {
      id: "latest-log-clean",
      required: false,
      passed: !hasBlockingLogIssues,
      detail: "Latest Unity log diagnostics should not contain known error patterns for the focused sample."
    },
    ...sampleDevicePassCriteria(sample).map((criterion, index) => ({
      id: `sample-pass-criterion-${index + 1}`,
      required: true,
      passed: realDeviceRunPassed,
      detail: criterion
    }))
  ];
  const evidence = [
    {
      id: "preflight",
      path: path.relative(root, path.join(focusedSampleGeneratedDir(root, sample), "PREFLIGHT.md")),
      status: preflightPassed ? "passed" : "blocked",
      detail: preflightPassed ? "Focused preflight is ready for device build." : `${preflight.blockers.length} preflight blocker(s) remain.`
    },
    {
      id: "device-validation",
      path: path.relative(root, path.join(focusedSampleGeneratedDir(root, sample), "DEVICE_VALIDATION.md")),
      status: deviceReady ? "passed" : "blocked",
      detail: deviceReady ? "Device validation checklist is ready to execute." : `${deviceValidation.blockers.length} device validation blocker(s) remain.`
    },
    {
      id: "run-result",
      path: runResultArtifact.relativePath,
      status: runResultArtifact.exists ? runResultArtifact.overallStatus ?? "unknown" : "missing",
      detail: runResultArtifact.exists
        ? `Recorded overall status: ${runResultArtifact.overallStatus ?? "unknown"}; real-device evidence: ${runResultArtifact.hasPassedDeviceValidationEvidence ? "yes" : "no"}.`
        : "RUN_RESULT.md has not been written yet."
    },
    {
      id: "latest-unity-log",
      path: latestLog.logPath ? path.relative(root, latestLog.logPath) : "none",
      status: hasBlockingLogIssues ? "failed" : latestLog.analyzed ? "checked" : "not-analyzed",
      detail: latestLog.analyzed ? `${latestLog.issueCount} known focused log issue(s) detected.` : "No latest Unity log was available for analysis."
    }
  ];
  const blockers = [
    ...preflight.blockers.map((blocker) => ({
      id: `preflight/${blocker.id}`,
      detail: blocker.detail,
      action: blocker.action
    })),
    ...deviceValidation.blockers.map((blocker) => ({
      id: `device/${blocker.id}`,
      detail: blocker.detail,
      action: blocker.action
    })),
    ...(!hasRunResult
      ? [{
          id: "run-result/missing",
          detail: "No RUN_RESULT.md artifact exists for this focused sample.",
          action: "Run compile/build/device validation and record the observed result with easyar_write_run_result."
        }]
      : runResultPassed
        ? runResultArtifact.hasPassedDeviceValidationEvidence
          ? []
          : [{
              id: "run-result/missing-real-device-evidence",
              detail: "RUN_RESULT.md is passed but does not include a recorded device plus a passed real-device/device-validation step.",
              action: "Run the focused sample on a real Android or iOS device, then record a passed device validation step with easyar_write_run_result."
            }]
        : [{
            id: "run-result/not-passed",
            detail: `RUN_RESULT.md overall status is ${runResultArtifact.overallStatus ?? "unknown"}, not passed.`,
            action: "Resolve the recorded run result next actions, then rerun the focused sample on a real device."
          }]),
    ...latestLog.issues
      .filter((issue) => issue.severity === "high")
      .map((issue) => ({
        id: `log/${issue.id}`,
        detail: issue.title,
        action: issue.actions.join(" ")
      }))
  ];
  const nextActions = buildCompletionNextActions(completionStatus, preflight, deviceValidation, runResultArtifact, latestLog, root, sample, platform);

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    platform,
    outputPath,
    completionStatus,
    runThroughComplete,
    requiredEvidence,
    evidence,
    parsedRunResult: runResultArtifact,
    summary: {
      readyForUnityBatch: preflight.readyForUnityBatch,
      readyForDeviceBuild: preflight.readyForDeviceBuild,
      readyForDeviceValidation: deviceValidation.readyForDeviceValidation,
      latestLogAnalyzed: latestLog.analyzed,
      latestLogIssueCount: latestLog.issueCount,
      latestRunResultStatus: runResultArtifact.overallStatus
    },
    blockers: uniqueBlockers(blockers),
    nextActions,
    security: "Completion reports use artifact status lines, presence checks, and redacted log diagnostics only. They do not include EasyAR tokens, license keys, Cloud Recognition appKey/appSecret, signing keys, provisioning secrets, or raw Unity logs."
  };
}

function chooseCompletionStatus(
  hasRunResult: boolean,
  runResultStatus: string | null,
  preflightPassed: boolean,
  deviceReady: boolean,
  realDeviceRunPassed: boolean,
  hasBlockingLogIssues: boolean
): typeof runResultStatuses[number] {
  if (!hasRunResult) {
    return "not-run";
  }
  if (runResultStatus === "failed") {
    return "failed";
  }
  if (runResultStatus === "passed" && preflightPassed && deviceReady && realDeviceRunPassed && !hasBlockingLogIssues) {
    return "passed";
  }
  return "blocked";
}

async function readRunResultArtifact(root: string, sample: SampleInfo) {
  const absolutePath = path.join(focusedSampleGeneratedDir(root, sample), "RUN_RESULT.md");
  const relativePath = path.relative(root, absolutePath);
  try {
    const body = await readFile(absolutePath, "utf8");
    const overallStatus = parseRunResultStatus(body);
    const device = parseMarkdownField(body, "Device");
    const buildOutputPath = parseMarkdownField(body, "Build output");
    const passedDeviceValidationStepCount = countPassedDeviceValidationSteps(body);
    return {
      exists: true,
      relativePath,
      overallStatus,
      device,
      buildOutputPath,
      passedStepCount: countMarkdownStepStatuses(body, "passed"),
      passedDeviceValidationStepCount,
      hasPassedDeviceValidationEvidence: hasRecordedDevice(device) && passedDeviceValidationStepCount > 0,
      failedStepCount: countMarkdownStepStatuses(body, "failed"),
      blockedStepCount: countMarkdownStepStatuses(body, "blocked"),
      notRunStepCount: countMarkdownStepStatuses(body, "not-run")
    };
  } catch {
    return {
      exists: false,
      relativePath,
      overallStatus: null,
      device: null,
      buildOutputPath: null,
      passedStepCount: 0,
      passedDeviceValidationStepCount: 0,
      hasPassedDeviceValidationEvidence: false,
      failedStepCount: 0,
      blockedStepCount: 0,
      notRunStepCount: 0
    };
  }
}

function parseRunResultStatus(markdown: string): typeof runResultStatuses[number] | null {
  const value = parseMarkdownField(markdown, "Overall status");
  return runResultStatuses.includes(value as typeof runResultStatuses[number])
    ? value as typeof runResultStatuses[number]
    : null;
}

function parseMarkdownField(markdown: string, field: string): string | null {
  const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = markdown.match(new RegExp(`^${escapedField}:\\s*(.+)$`, "m"));
  return match?.[1]?.trim() ?? null;
}

function countMarkdownStepStatuses(markdown: string, status: typeof runResultStatuses[number]): number {
  const escapedStatus = status.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...markdown.matchAll(new RegExp(`Status:\\s*${escapedStatus}\\b`, "g"))].length;
}

function countPassedDeviceValidationSteps(markdown: string): number {
  const stepBlocks = markdown.split(/\n(?=\d+\.\s+)/g);
  return stepBlocks.filter((block) =>
    /Status:\s*passed\b/i.test(block) &&
    /(real[- ]?device|device validation|on[- ]?device|android device|ios device|iphone|ipad|pixel|camera\/tracking validation|tracking validation)/i.test(block)
  ).length;
}

function hasRecordedDevice(device: string | null): boolean {
  return typeof device === "string" && isNonPlaceholderString(device) && !/^not recorded$/i.test(device.trim());
}

function buildCompletionNextActions(
  completionStatus: typeof runResultStatuses[number],
  preflight: Awaited<ReturnType<typeof buildFocusedPreflight>>,
  deviceValidation: Awaited<ReturnType<typeof buildDeviceValidationChecklist>>,
  runResultArtifact: Awaited<ReturnType<typeof readRunResultArtifact>>,
  latestLog: Awaited<ReturnType<typeof buildLatestLogDiagnostic>>,
  root: string,
  sample: SampleInfo,
  platform: typeof mobilePlatforms[number]
) {
  if (completionStatus === "passed") {
    return [
      "Keep COMPLETION_REPORT.md, RUN_RESULT.md, DEVICE_VALIDATION.md, and SUPPORT_BUNDLE.md as the focused sample run-through evidence.",
      "Move on to the next requested EasyAR workflow only after the user asks to continue."
    ];
  }
  const actions: string[] = [];
  if (!preflight.readyForDeviceBuild) {
    actions.push(`Run easyar_write_focused_preflight projectPath=${root} sampleId=${sample.id} platform=${platform} and resolve the first blocker.`);
    actions.push(...preflight.nextActions);
  }
  if (!deviceValidation.readyForDeviceValidation) {
    actions.push(`Run easyar_write_device_validation_checklist projectPath=${root} sampleId=${sample.id} platform=${platform} and resolve device blockers.`);
    actions.push(...deviceValidation.nextActions);
  }
  if (!runResultArtifact.exists) {
    actions.push("Run Unity compile/build/device validation, then call easyar_write_run_result with observed step evidence.");
  } else if (runResultArtifact.overallStatus !== "passed") {
    actions.push(`RUN_RESULT.md is ${runResultArtifact.overallStatus ?? "unknown"}; resolve recorded failures/blockers and rerun on a real device.`);
  }
  if (latestLog.issues.some((issue) => issue.severity === "high")) {
    actions.push("Run easyar_write_issue_report after reviewing SUPPORT_BUNDLE.md and the latest Unity/device log diagnostics.");
  }
  actions.push(`Regenerate this report with easyar_write_completion_report projectPath=${root} sampleId=${sample.id} platform=${platform}.`);
  return Array.from(new Set(actions)).slice(0, 14);
}

async function buildFocusedScopeStatus(
  root: string,
  platform: typeof mobilePlatforms[number],
  maxScriptIssues: number,
  maxLogBytes: number,
  maxLogIssues: number
) {
  const focused = focusedSamples();
  const reports = await Promise.all(focused.map((sample) => {
    const outputPath = platform === "android"
      ? `Builds/${sample.id}.apk`
      : `Builds/iOS/${sample.id}`;
    return buildCompletionReport(root, sample, platform, outputPath, maxScriptIssues, maxLogBytes, maxLogIssues);
  }));
  const items = reports.map((report) => ({
    sampleId: report.sample.id,
    sampleName: report.sample.name,
    completionStatus: report.completionStatus,
    runThroughComplete: report.runThroughComplete,
    blockerCount: report.blockers.length,
    latestRunResultStatus: report.summary.latestRunResultStatus,
    completionReportPath: path.relative(root, path.join(focusedSampleGeneratedDir(root, findSample(report.sample.id)), "COMPLETION_REPORT.md")),
    runResultPath: report.parsedRunResult.relativePath,
    nextActions: report.nextActions.slice(0, 5)
  }));
  const completedCount = items.filter((item) => item.completionStatus === "passed").length;
  const failedCount = items.filter((item) => item.completionStatus === "failed").length;
  const blockedCount = items.filter((item) => item.completionStatus === "blocked").length;
  const notRunCount = items.filter((item) => item.completionStatus === "not-run").length;
  const allFocusedSamplesComplete = items.length > 0 && items.every((item) => item.runThroughComplete);
  const nextActions = buildFocusedScopeNextActions(root, platform, items);

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    platform,
    scope: "focused-samples",
    focusedSampleIds: focused.map((sample) => sample.id),
    deferredSampleIds: deferredSamples().map((sample) => sample.id),
    focusedSampleCount: items.length,
    completedCount,
    blockedCount,
    failedCount,
    notRunCount,
    allFocusedSamplesComplete,
    items,
    nextActions,
    security: "Focused scope status reports completion states, artifact paths, and next calls only. It does not include EasyAR tokens, license keys, Cloud Recognition appKey/appSecret, signing keys, provisioning secrets, or raw Unity logs."
  };
}

function buildFocusedScopeNextActions(
  root: string,
  platform: typeof mobilePlatforms[number],
  items: Array<{
    sampleId: string;
    completionStatus: typeof runResultStatuses[number];
    runThroughComplete: boolean;
    nextActions: string[];
  }>
) {
  if (items.length > 0 && items.every((item) => item.runThroughComplete)) {
    return [
      "Keep FOCUSED_SCOPE_STATUS.md plus each sample COMPLETION_REPORT.md as focused scope evidence.",
      "Do not start deferred samples until the user asks to continue."
    ];
  }
  const actions: string[] = [];
  for (const item of items.filter((candidate) => !candidate.runThroughComplete)) {
    actions.push(`Run easyar_write_completion_report projectPath=${root} sampleId=${item.sampleId} platform=${platform}.`);
    if (item.completionStatus === "not-run") {
      actions.push(`Run the ${item.sampleId} compile/build/device sequence and record RUN_RESULT.md with easyar_write_run_result.`);
    }
    actions.push(...item.nextActions);
  }
  actions.push(`Regenerate focused scope status with easyar_write_focused_scope_status projectPath=${root} platform=${platform}.`);
  return Array.from(new Set(actions)).slice(0, 16);
}

async function buildIssueReport(input: {
  root: string;
  sample: SampleInfo;
  platform: typeof mobilePlatforms[number];
  overallStatus: typeof runResultStatuses[number];
  device?: string;
  buildOutputPath?: string;
  observedBehavior?: string;
  expectedBehavior?: string;
  reproductionSteps: string[];
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
  const runResult = await buildRunResult({
    root: input.root,
    sample: input.sample,
    platform: input.platform,
    overallStatus: input.overallStatus,
    device: input.device,
    buildOutputPath: input.buildOutputPath,
    notes: input.observedBehavior,
    steps: input.steps,
    maxScriptIssues: input.maxScriptIssues,
    maxCandidates: input.maxCandidates,
    maxLogBytes: input.maxLogBytes,
    maxLogIssues: input.maxLogIssues
  });
  const readiness = await buildSampleReadinessReport(input.root, input.sample);
  const localConfig = await buildLocalConfigValidationReport(
    input.root,
    path.join(input.root, "ProjectSettings", "EasyAR", "easyar.local.json")
  );
  const artifactPaths = {
    onboarding: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "ONBOARDING.md")),
    workflowState: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "WORKFLOW_STATE.md")),
    officialAccess: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "OFFICIAL_ACCESS.md")),
    importChecklist: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "IMPORT_CHECKLIST.md")),
    runSequence: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "RUN_SEQUENCE.md")),
    runReport: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "RUN_REPORT.md")),
    sceneAudit: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "SCENE_AUDIT.md")),
    supportBundle: runResult.supportBundleSummary.supportBundlePath,
    runResult: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "RUN_RESULT.md")),
    deviceValidation: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "DEVICE_VALIDATION.md")),
    latestLog: runResult.supportBundleSummary.logIssueCount > 0
      ? "Latest Unity log was summarized in SUPPORT_BUNDLE.md; do not paste full logs if they contain secrets."
      : "No known focused log issue was detected by the latest log analyzer."
  };
  const reproductionSteps = input.reproductionSteps.length > 0
    ? input.reproductionSteps.map(sanitizeIssueText).filter(isNonEmptyString)
    : defaultIssueReproductionSteps(input.sample, input.platform);
  const title = `[${input.sample.name}] ${input.overallStatus} on ${input.platform}`;
  const labels = [
    "sample-run",
    input.sample.id,
    input.platform,
    input.overallStatus
  ];
  const body = buildIssueReportMarkdown({
    generatedAt: new Date().toISOString(),
    title,
    labels,
    projectPath: input.root,
    sample: runResult.sample,
    platform: input.platform,
    overallStatus: input.overallStatus,
    device: input.device ?? null,
    buildOutputPath: input.buildOutputPath ?? null,
    observedBehavior: sanitizeIssueText(input.observedBehavior) ?? "Describe what happened during the latest run.",
    expectedBehavior: sanitizeIssueText(input.expectedBehavior) ?? sampleExpectedIssueBehavior(input.sample),
    reproductionSteps,
    stepSummary: runResult.steps.map((step) => ({
      name: sanitizeIssueText(step.name) ?? "Unnamed step",
      status: step.status,
      evidence: sanitizeIssueText(step.evidence) ?? null,
      nextAction: sanitizeIssueText(step.nextAction) ?? null
    })),
    readinessSummary: {
      ready: readiness.ready,
      unityVersion: readiness.unityVersion,
      failingChecks: readiness.checks.filter((check) => !check.ok).map((check) => ({
        id: check.id,
        severity: "blocker",
        detail: check.detail,
        action: readinessAction(check.id, input.sample)
      }))
    },
    configSummary: {
      valid: localConfig.valid,
      checkCount: localConfig.checks.length,
      failingChecks: localConfig.checks.filter((check) => !check.ok).map((check) => ({
        id: check.id,
        severity: "blocker",
        detail: check.detail
      }))
    },
    supportSummary: runResult.supportBundleSummary,
    artifactPaths,
    nextActions: runResult.nextActions.map(sanitizeIssueText).filter(isNonEmptyString),
    security: "This issue body is redacted. Do not attach EasyAR license keys, account tokens, Cloud Recognition appKey/appSecret, signing keys, provisioning profiles, or full private logs."
  });

  return {
    generatedAt: new Date().toISOString(),
    title,
    labels,
    body,
    projectPath: input.root,
    sample: runResult.sample,
    platform: input.platform,
    overallStatus: input.overallStatus,
    artifactPaths,
    nextActions: runResult.nextActions.map(sanitizeIssueText).filter(isNonEmptyString),
    security: "The GitHub issue report redacts common token, key, license, credential, password, and secret fields. Review before posting publicly."
  };
}

async function buildDeviceValidationChecklist(
  root: string,
  sample: SampleInfo,
  platform: typeof mobilePlatforms[number],
  device?: string,
  buildOutputPath?: string
) {
  const readiness = await buildSampleReadinessReport(root, sample);
  const importChecklist = await buildImportChecklist(root, sample);
  const sceneAudit = await buildSampleSceneAudit(root, sample, 25);
  const readinessBlockers = readiness.checks
    .filter((check) => !check.ok)
    .map((check) => ({
      id: check.id,
      detail: check.detail,
      action: readinessAction(check.id, sample)
    }));
  const importBlockers = importChecklist.items
    .filter((item) => item.required && !item.ok)
    .map((item) => ({
      id: item.id,
      detail: item.evidence,
      action: item.action
    }));
  const sceneBlockers = sceneAudit.blockers.map((blocker) => ({
    id: blocker.id,
    detail: blocker.detail,
    action: blocker.action
  }));
  const blockers = uniqueBlockers([
    ...readinessBlockers,
    ...importBlockers,
    ...sceneBlockers
  ]);
  const readyForDeviceValidation = blockers.length === 0;
  const steps = buildDeviceValidationSteps(sample, platform);
  const evidencePrompts = [
    "Device model and OS version.",
    "Build output path or installed app version.",
    "Unity build log path and device log capture path.",
    "Observed camera permission behavior.",
    ...sampleDeviceEvidencePrompts(sample)
  ];

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    platform,
    device: device ?? null,
    buildOutputPath: buildOutputPath ?? null,
    readyForDeviceValidation,
    blockers,
    preflightSummary: {
      readinessReady: readiness.ready,
      importReady: importChecklist.readyForFocusedPreparation,
      sceneReady: sceneAudit.readyForUnityValidation,
      unityVersion: readiness.unityVersion
    },
    steps,
    passCriteria: sampleDevicePassCriteria(sample),
    evidencePrompts,
    nextActions: readyForDeviceValidation
      ? [
          "Install the build on a real Android or iOS device.",
          "Run every device validation step and capture the requested evidence.",
          "Record the observed result with easyar_write_run_result."
        ]
      : Array.from(new Set(blockers.map((blocker) => blocker.action))),
    security: "Do not paste EasyAR license keys, account tokens, Cloud Recognition appKey/appSecret, signing keys, provisioning profiles, or device-private identifiers into validation evidence."
  };
}

function buildDeviceValidationSteps(sample: SampleInfo, platform: typeof mobilePlatforms[number]) {
  const platformSteps = platform === "android"
    ? [
        {
          id: "install-android-build",
          title: "Install Android build",
          action: "Install the APK on a physical Android device and grant camera/network permissions when prompted.",
          expected: "The app launches without Android permission, Gradle, or signing failures."
        }
      ]
    : [
        {
          id: "install-ios-build",
          title: "Install iOS build",
          action: "Build/run the generated Xcode project on a physical iOS device with valid signing and camera usage description.",
          expected: "The app launches without signing, provisioning, or camera permission failures."
        }
      ];
  return [
    ...platformSteps,
    {
      id: "camera-startup",
      title: "Verify camera startup",
      action: "Launch the sample and observe the live camera feed.",
      expected: "The camera feed appears and no EasyAR license/plugin initialization error is shown."
    },
    ...sampleSpecificDeviceValidationSteps(sample),
    {
      id: "record-result",
      title: "Record validation result",
      action: "Call easyar_write_run_result with each step status, evidence, and next action.",
      expected: "RUN_RESULT.md captures whether this device validation passed, failed, or is blocked."
    }
  ];
}

function sampleSpecificDeviceValidationSteps(sample: SampleInfo) {
  if (sample.id === "cloud-recognition") {
    return [
      {
        id: "cloud-recognition-network",
        title: "Verify network and cloud service access",
        action: "Run on a device network that can reach the configured EasyAR Cloud Recognition service region.",
        expected: "No unauthorized, timeout, DNS, TLS, or region mismatch errors appear in app/device logs."
      },
      {
        id: "cloud-recognition-result",
        title: "Verify cloud recognition result",
        action: "Present a target configured in the official EasyAR Cloud Recognition library.",
        expected: "The sample receives a cloud recognition result and displays or logs the expected target/content response."
      }
    ];
  }

  return [
    {
      id: "image-target-detection",
      title: "Verify image target detection",
      action: "Present a real target image from the imported Image Tracking target set in stable lighting.",
      expected: "The sample detects the target and shows anchored content at the target pose."
    },
    {
      id: "image-target-tracking-stability",
      title: "Verify tracking stability",
      action: "Move the device around the target and briefly occlude/reveal the target.",
      expected: "Tracking remains stable while visible and recovers predictably after reacquisition."
    }
  ];
}

function sampleDevicePassCriteria(sample: SampleInfo): string[] {
  if (sample.id === "cloud-recognition") {
    return [
      "App launches on a physical device with camera permission granted.",
      "EasyAR initializes without license or plugin import errors.",
      "Cloud Recognition credentials are accepted by the official service.",
      "A configured cloud target is recognized and produces the expected sample response.",
      "No secret values are printed in Unity, device, or support logs."
    ];
  }

  return [
    "App launches on a physical device with camera permission granted.",
    "EasyAR initializes without license or plugin import errors.",
    "A real image target is detected from the focused sample target set.",
    "Anchored content follows the target pose without obvious scale/orientation errors.",
    "Tracking loss and reacquisition behavior is understandable and recorded."
  ];
}

function sampleDeviceEvidencePrompts(sample: SampleInfo): string[] {
  if (sample.id === "cloud-recognition") {
    return [
      "Cloud target/library name or non-secret identifier.",
      "Recognition response status without appKey/appSecret values.",
      "Network/service-region observations."
    ];
  }

  return [
    "Target image/database asset path.",
    "Observed detection distance and lighting conditions.",
    "Tracking stability notes or short screen recording reference."
  ];
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
  const verificationCalls = buildCodePlanVerificationCalls(root, sample);
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
    verificationCalls,
    verificationSteps: [
      "Call easyar_review_csharp_scripts for changed scripts.",
      "Call easyar_run_unity_compile_check with sampleId, platform, and a project-local logPath.",
      "Use the returned suggestedRunResultCall to update RUN_RESULT.md.",
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

async function buildCodeChangeSummary(
  root: string,
  sample: SampleInfo,
  goal: string,
  targetFiles: string[],
  notes: string | undefined,
  maxIssues: number
) {
  if (targetFiles.length === 0) {
    throw new Error("targetFiles must include at least one changed .cs file.");
  }
  const normalizedTargets = targetFiles.map((relativePath) => normalizeProjectRelativePath(root, relativePath));
  const fileSummaries = await Promise.all(normalizedTargets.map(async (relativePath) => {
    const absolutePath = path.join(root, relativePath);
    if (!await exists(absolutePath)) {
      return {
        path: relativePath,
        exists: false,
        sizeBytes: null,
        lineCount: null,
        mentionsEasyAR: false,
        mentionsMonoBehaviour: false
      };
    }
    const text = await readFile(absolutePath, "utf8");
    return {
      path: relativePath,
      exists: true,
      sizeBytes: Buffer.byteLength(text, "utf8"),
      lineCount: text.split(/\r?\n/).length,
      mentionsEasyAR: /\busing\s+EasyAR\b|EasyAR\./.test(text),
      mentionsMonoBehaviour: /:\s*MonoBehaviour\b/.test(text)
    };
  }));
  const scriptReview = await buildScriptReviewReport(root, normalizedTargets, normalizedTargets.length, maxIssues);
  const missingFiles = fileSummaries.filter((file) => !file.exists).map((file) => file.path);
  const nextActions = buildCodeChangeNextActions(sample, scriptReview.issueCount, missingFiles);

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    goal,
    notes: sanitizeRunResultNotes(notes),
    targetFiles: normalizedTargets,
    fileSummaries,
    scriptReview,
    missingFiles,
    nextActions,
    security: "Secret values are not returned. Do not include EasyAR license keys, account tokens, appKey, appSecret, signing keys, or provisioning secrets in code change notes."
  };
}

async function buildProgrammingContext(
  root: string,
  sample: SampleInfo,
  goal: string | undefined,
  maxFiles: number,
  maxIssues: number
) {
  const scriptPaths = await findFiles(root, ["Assets"], /\.cs$/i, maxFiles);
  const scriptDetails = await Promise.all(scriptPaths.map(async (relativePath) => {
    const text = await readFile(path.join(root, relativePath), "utf8").catch(() => "");
    const generated = /^Assets[\/\\]Editor[\/\\]EasyAR.*\.cs$/i.test(relativePath) || /^Assets[\/\\]EasyARGenerated[\/\\]/i.test(relativePath);
    return {
      path: relativePath,
      generated,
      mentionsEasyAR: /\busing\s+EasyAR\b|EasyAR\.|EasyAR/i.test(text),
      mentionsMonoBehaviour: /:\s*MonoBehaviour\b/.test(text),
      lineCount: text ? text.split(/\r?\n/).length : 0,
      sizeBytes: Buffer.byteLength(text, "utf8")
    };
  }));
  const scriptReview = await buildScriptReviewReport(root, undefined, maxFiles, maxIssues);
  const readiness = await buildSampleReadinessReport(root, sample);
  const suggestedPrimaryFile = sample.id === "cloud-recognition"
    ? "Assets/Scripts/CloudRecognitionResultController.cs"
    : "Assets/Scripts/ImageTargetContentController.cs";
  const suggestedTemplateKind = sample.id === "cloud-recognition" ? "cloud-recognition" : "image-tracking";
  const easyarScripts = scriptDetails.filter((script) => script.mentionsEasyAR && !script.generated);
  const monoBehaviours = scriptDetails.filter((script) => script.mentionsMonoBehaviour && !script.generated);
  const generatedHelpers = scriptDetails.filter((script) => script.generated);

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    goal: goal ?? null,
    scriptInventory: {
      totalScripts: scriptDetails.length,
      easyarScripts,
      monoBehaviours,
      generatedHelpers,
      scripts: scriptDetails
    },
    readinessSummary: {
      ready: readiness.ready,
      failingChecks: readiness.checks.filter((check) => !check.ok).map((check) => check.id)
    },
    scriptReview: {
      reviewedFileCount: scriptReview.reviewedFileCount,
      issueCount: scriptReview.issueCount,
      issues: scriptReview.issues
    },
    recommendedWorkflow: [
      "Read PREFLIGHT.md before editing scripts.",
      "Call easyar_write_config_integration_audit before wiring license or Cloud Recognition fields.",
      "Call easyar_generate_code_plan or easyar_write_code_plan with the programming goal.",
      `Create or patch ${suggestedPrimaryFile} with easyar_create_mono_behaviour or easyar_write_csharp_file.`,
      "Run easyar_review_csharp_scripts after edits.",
      "Write CODE_CHANGE.md with easyar_write_code_change_summary.",
      "Run easyar_run_unity_compile_check only after static review is clean."
    ],
    suggestedTemplate: {
      tool: "easyar_create_mono_behaviour",
      arguments: {
        projectPath: root,
        relativePath: suggestedPrimaryFile,
        className: path.basename(suggestedPrimaryFile, ".cs"),
        kind: suggestedTemplateKind
      }
    },
    relatedArtifacts: {
      preflight: path.relative(root, path.join(focusedSampleGeneratedDir(root, sample), "PREFLIGHT.md")),
      configIntegration: path.relative(root, path.join(focusedSampleGeneratedDir(root, sample), "CONFIG_INTEGRATION.md")),
      codePlan: path.relative(root, path.join(focusedSampleGeneratedDir(root, sample), "CODE_PLAN.md")),
      codeChange: path.relative(root, path.join(focusedSampleGeneratedDir(root, sample), "CODE_CHANGE.md")),
      programmingContext: path.relative(root, path.join(focusedSampleGeneratedDir(root, sample), "PROGRAMMING_CONTEXT.md"))
    },
    nextActions: [
      `Run easyar_write_config_integration_audit projectPath=${root} sampleId=${sample.id}.`,
      `Run easyar_write_code_plan projectPath=${root} sampleId=${sample.id} goal="${goal ?? "describe the requested script change"}".`,
      `Use ${easyarScripts.length > 0 ? "existing EasyAR-related scripts as edit candidates" : "the suggested MonoBehaviour template as the first edit candidate"}.`,
      "Do not hardcode EasyAR license keys, account tokens, appKey, appSecret, signing keys, or provisioning secrets.",
      "Run easyar_review_csharp_scripts before Unity compilation."
    ],
    security: "Programming context reports script paths, counts, static findings, and recommended workflow only. It does not include EasyAR local config secret values."
  };
}

async function buildConfigIntegrationAudit(
  root: string,
  sample: SampleInfo,
  maxFiles: number,
  maxCandidates: number
) {
  const [localConfig, readiness, scriptPaths, assetPaths] = await Promise.all([
    buildLocalConfigValidationReport(root),
    buildSampleReadinessReport(root, sample),
    findFiles(root, ["Assets"], /\.cs$/i, maxFiles),
    findFiles(root, ["Assets"], /\.(unity|prefab|asset|controller|playable|mat|yaml|json)$/i, maxFiles)
  ]);
  const scriptCandidates = await scanConfigIntegrationFiles(root, scriptPaths, "script", maxCandidates);
  const assetCandidates = await scanConfigIntegrationFiles(root, assetPaths, "asset", maxCandidates);
  const consumerCandidates = [...scriptCandidates, ...assetCandidates]
    .sort((left, right) => scoreConfigCandidate(right, sample) - scoreConfigCandidate(left, sample))
    .slice(0, maxCandidates);
  const generatedHelpers = scriptCandidates.filter((candidate) => /^Assets[\/\\]Editor[\/\\]EasyAR/i.test(candidate.path));
  const localConfigValid = localConfig.valid;
  const hasLocalConfigReader = consumerCandidates.some((candidate) => candidate.signals.includes("local-config-reader"));
  const hasLicenseConsumer = consumerCandidates.some((candidate) => candidate.signals.includes("license-consumer"));
  const hasCloudConsumer = consumerCandidates.some((candidate) => candidate.signals.includes("cloud-credential-consumer"));
  const needsCloudRecognition = sample.id === "cloud-recognition";
  const blockers = [
    ...(!localConfigValid
      ? [{
          id: "local-config-invalid",
          detail: `Local config failing check(s): ${localConfig.checks.filter((check) => !check.ok).map((check) => check.id).join(", ")}.`,
          action: "Fill ProjectSettings/EasyAR/easyar.local.json locally or use easyar_write_local_config_from_env, then rerun this audit."
        }]
      : []),
    ...(!hasLicenseConsumer
      ? [{
          id: "license-consumer-not-found",
          detail: "No script/scene/asset candidate clearly references an EasyAR license consumer.",
          action: "Inspect the official sample scene and EasyAR settings asset; use CODE_PLAN.md before adding any script that reads license data."
        }]
      : []),
    ...(needsCloudRecognition && !hasCloudConsumer
      ? [{
          id: "cloud-credential-consumer-not-found",
          detail: "No Cloud Recognition appId/apiKey consumer was found in scripts, scenes, prefabs, or assets.",
          action: "Inspect the official Cloud Recognition sample scripts and wire credentials through serialized fields or official APIs without hardcoding secrets."
        }]
      : []),
    ...(!hasLocalConfigReader
      ? [{
          id: "local-config-reader-not-found",
          detail: "No non-generated project script appears to read ProjectSettings/EasyAR/easyar.local.json.",
          action: "Prefer official sample wiring first. If automation is needed, create a small Editor/runtime adapter from CODE_PLAN.md that reads local config without logging values."
        }]
      : [])
  ];
  const nextActions = Array.from(new Set([
    ...blockers.map((blocker) => blocker.action),
    consumerCandidates.length > 0
      ? "Review the top consumer candidates before editing scripts or scene references."
      : "Import the official EasyAR Unity Plugin and focused sample scene, then rerun this audit.",
    `Run easyar_write_programming_context projectPath=${root} sampleId=${sample.id} goal="wire local EasyAR config into the focused sample".`,
    `Run easyar_write_code_plan projectPath=${root} sampleId=${sample.id} goal="wire local EasyAR config without hardcoding secrets" targetFiles=[] before code edits.`
  ]));

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    readyForConfigIntegration: localConfigValid && blockers.length === 0,
    localConfig: {
      valid: localConfig.valid,
      configPath: localConfig.configPath,
      failedChecks: localConfig.checks.filter((check) => !check.ok).map((check) => check.id)
    },
    readinessSummary: {
      ready: readiness.ready,
      failingChecks: readiness.checks.filter((check) => !check.ok).map((check) => check.id)
    },
    scanSummary: {
      scriptFilesScanned: scriptPaths.length,
      assetFilesScanned: assetPaths.length,
      consumerCandidateCount: consumerCandidates.length,
      generatedHelperCount: generatedHelpers.length
    },
    detectedCapabilities: {
      hasLocalConfigReader,
      hasLicenseConsumer,
      hasCloudConsumer,
      needsCloudRecognition
    },
    consumerCandidates,
    blockers: uniqueBlockers(blockers),
    nextActions,
    security: "This audit reports paths, signal names, and redacted snippets only. It never returns EasyAR license keys, account tokens, appKey, appSecret, or local config values."
  };
}

async function scanConfigIntegrationFiles(
  root: string,
  relativePaths: string[],
  kind: "script" | "asset",
  maxCandidates: number
) {
  const candidates = [];
  for (const relativePath of relativePaths) {
    if (candidates.length >= maxCandidates) {
      break;
    }
    const absolutePath = path.join(root, relativePath);
    const text = await readFile(absolutePath, "utf8").catch(() => "");
    if (!text) {
      continue;
    }
    const signals = configIntegrationSignals(text);
    if (signals.length === 0) {
      continue;
    }
    candidates.push({
      path: relativePath,
      kind,
      generated: /^Assets[\/\\](Editor[\/\\]EasyAR|EasyARGenerated[\/\\])/i.test(relativePath),
      signals,
      redactedSnippets: redactedConfigSnippets(text)
    });
  }
  return candidates;
}

function configIntegrationSignals(text: string): string[] {
  const checks = [
    ["easyar-reference", /\bEasyAR\b|EasyAR\./i],
    ["local-config-reader", /easyar\.local\.json|ProjectSettings[\/\\]EasyAR|File\.ReadAllText|JsonUtility|Newtonsoft|System\.Text\.Json/i],
    ["license-consumer", /license(Key)?|SenseLicense|SDK\s*Authorization|EasyAR.*license/i],
    ["cloud-credential-consumer", /cloudRecognition|CloudRecognizer|CloudRecognition|appId|appKey|appSecret|CRS|Cloud\s*Recognition/i],
    ["serialized-field", /\[SerializeField\]|public\s+(string|TextAsset|GameObject|MonoBehaviour)\s+\w+/i],
    ["scene-or-prefab-reference", /m_Script|MonoBehaviour|GameObject|PrefabInstance|SceneRoots/i]
  ] as const;
  return checks.filter(([, pattern]) => pattern.test(text)).map(([id]) => id);
}

function redactedConfigSnippets(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const snippets: string[] = [];
  const pattern = /easyar\.local\.json|license|cloudRecognition|CloudRecognizer|CloudRecognition|appId|appKey|appSecret|CRS/i;
  for (let index = 0; index < lines.length && snippets.length < 5; index += 1) {
    if (pattern.test(lines[index])) {
      snippets.push(`L${index + 1}: ${(sanitizeIssueText(lines[index].trim()) ?? "").slice(0, 220)}`);
    }
  }
  return snippets;
}

function scoreConfigCandidate(candidate: { generated: boolean; signals: string[] }, sample: SampleInfo): number {
  const weights: Record<string, number> = {
    "local-config-reader": 6,
    "cloud-credential-consumer": sample.id === "cloud-recognition" ? 5 : 1,
    "license-consumer": 4,
    "easyar-reference": 3,
    "serialized-field": 2,
    "scene-or-prefab-reference": 1
  };
  return candidate.signals.reduce((score, signal) => score + (weights[signal] ?? 0), candidate.generated ? -2 : 0);
}

function buildCodeChangeNextActions(
  sample: SampleInfo,
  issueCount: number,
  missingFiles: string[]
): string[] {
  const actions: string[] = [];
  if (missingFiles.length > 0) {
    actions.push(`Create or correct missing target file(s): ${missingFiles.join(", ")}.`);
  }
  if (issueCount > 0) {
    actions.push("Fix static script review issues before Unity compilation.");
  }
  actions.push(`Run easyar_run_unity_compile_check with sampleId=${sample.id}.`);
  actions.push("Regenerate easyar_write_support_bundle after Unity compile or build attempts.");
  actions.push("Record the outcome with easyar_write_run_result.");
  return actions;
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

function buildCodePlanVerificationCalls(root: string, sample: SampleInfo) {
  return [
    {
      tool: "easyar_review_csharp_scripts",
      arguments: {
        projectPath: root
      },
      purpose: "Run static EasyAR-focused script review before opening Unity."
    },
    {
      tool: "easyar_run_unity_compile_check",
      arguments: {
        projectPath: root,
        sampleId: sample.id,
        platform: "android",
        logPath: path.join("Logs", "mcp-easyar-CodeCompileCheck.log")
      },
      purpose: "Force Unity script import/compilation and receive suggestedRunResultCall for RUN_RESULT.md."
    },
    {
      tool: "easyar_write_support_bundle",
      arguments: {
        projectPath: root,
        sampleId: sample.id,
        platform: "android"
      },
      purpose: "Refresh SUPPORT_BUNDLE.md after compile/build attempts."
    },
    {
      tool: "easyar_write_run_result",
      arguments: {
        projectPath: root,
        sampleId: sample.id,
        platform: "android",
        overallStatus: "not-run",
        steps: []
      },
      purpose: "Replace the placeholder arguments with the suggestedRunResultCall returned by Unity batch tools."
    }
  ];
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

async function matchSampleScenes(root: string, sample: SampleInfo, scenePaths: string[]): Promise<string[]> {
  const matches: string[] = [];
  for (const scenePath of scenePaths) {
    if (sample.unityScenes.some((hint) => scenePath.toLowerCase().includes(hint.toLowerCase()))) {
      matches.push(scenePath);
      continue;
    }
    if (await sceneContentMatchesSample(root, sample, scenePath)) {
      matches.push(scenePath);
    }
  }
  return matches;
}

async function sceneContentMatchesSample(root: string, sample: SampleInfo, scenePath: string): Promise<boolean> {
  const absolutePath = path.join(root, scenePath);
  if (!absolutePath.startsWith(root + path.sep) || !await exists(absolutePath)) {
    return false;
  }
  let text = "";
  try {
    text = await readFile(absolutePath, "utf8");
  } catch {
    return false;
  }
  if (sample.id === "image-tracking") {
    return /ImageTracking|ImageTarget|ImageTracker|TargetDataFileSource/i.test(text);
  }
  if (sample.id === "cloud-recognition") {
    return /CloudRecognition|CloudRecognizer|CloudRecogniz/i.test(text);
  }
  return false;
}

async function findPackageCacheSamplePaths(root: string, sample: SampleInfo, limit: number): Promise<string[]> {
  const packageCacheRoot = path.join(root, "Library", "PackageCache");
  if (!await exists(packageCacheRoot)) {
    return [];
  }
  const found: string[] = [];
  await walkPackageCacheSamples(root, packageCacheRoot, sample, found, limit, 5);
  return found;
}

async function walkPackageCacheSamples(
  root: string,
  dirPath: string,
  sample: SampleInfo,
  found: string[],
  limit: number,
  depth: number
): Promise<void> {
  if (found.length >= limit || depth < 0) {
    return;
  }
  let entries;
  try {
    entries = await readdir(dirPath, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (found.length >= limit) {
      return;
    }
    const fullPath = path.join(dirPath, entry.name);
    if (!entry.isDirectory()) {
      continue;
    }
    const relativePath = path.relative(root, fullPath);
    if (relativePath.includes(`Samples~${path.sep}`) && packageCacheSamplePathMatches(sample, relativePath)) {
      found.push(relativePath);
      continue;
    }
    await walkPackageCacheSamples(root, fullPath, sample, found, limit, depth - 1);
  }
}

function packageCacheSamplePathMatches(sample: SampleInfo, relativePath: string): boolean {
  const normalized = relativePath.toLowerCase();
  return sample.unityScenes.some((hint) => normalized.includes(hint.toLowerCase()))
    || (sample.id === "cloud-recognition" && normalized.includes("cloudrecognition"))
    || (sample.id === "image-tracking" && normalized.includes("imagetracking"));
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
    return "Fill easyar.cloudRecognition.appId and apiKey in ProjectSettings/EasyAR/easyar.local.json. Legacy appKey/appSecret fields are still accepted.";
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
          ? cloudRecognitionCredentialMode(cloudConfig) === "appId-apiKey"
            ? "Cloud recognition appId and apiKey are configured in local config."
            : "Cloud recognition legacy appId, appKey, and appSecret are configured in local config."
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
  const matchingEnabledScenes = await matchSampleScenes(root, sample, enabledScenes);
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
      apiKey: isNonPlaceholderString(config.apiKey),
      apiSecret: isNonPlaceholderString(config.apiSecret),
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

async function buildLocalConfigFromEnvReport(
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
    accountToken: envFirst(["EASYAR_ACCOUNT_TOKEN", "EASYAR_API_TOKEN"]),
    licenseKey: envFirst(["EASYAR_LICENSE_KEY", "EASYAR_SENSE_LICENSE_KEY"]),
    cloudAppId: envFirst(["EASYAR_CLOUD_APP_ID", "EASYAR_CLOUD_RECOGNITION_APP_ID"]),
    cloudApiKey: envFirst(["EASYAR_CLOUD_API_KEY", "EASYAR_CLOUD_RECOGNITION_API_KEY", "EASYAR_CLOUD_APP_KEY", "EASYAR_CLOUD_RECOGNITION_APP_KEY"]),
    cloudApiSecret: envFirst(["EASYAR_CLOUD_API_SECRET", "EASYAR_CLOUD_RECOGNITION_API_SECRET", "EASYAR_CLOUD_APP_SECRET", "EASYAR_CLOUD_RECOGNITION_APP_SECRET"]),
    bundleIdentifier: bundleIdentifierInput ?? envFirst(["EASYAR_BUNDLE_IDENTIFIER", "EASYAR_UNITY_BUNDLE_IDENTIFIER"]) ?? defaultBundleIdentifier(sample)
  };
  const envPresence = [
    envPresenceItem("easyar.apiBaseUrl", ["EASYAR_API_BASE_URL"], isNonPlaceholderString(envValues.apiBaseUrl), "defaulted to https://www.easyar.cn when unset"),
    envPresenceItem("easyar.accountToken", ["EASYAR_ACCOUNT_TOKEN", "EASYAR_API_TOKEN"], isNonPlaceholderString(envValues.accountToken), "required by local validation"),
    envPresenceItem("easyar.licenseKey", ["EASYAR_LICENSE_KEY", "EASYAR_SENSE_LICENSE_KEY"], isNonPlaceholderString(envValues.licenseKey), "required for focused sample runs"),
    envPresenceItem("unity.bundleIdentifier", ["EASYAR_BUNDLE_IDENTIFIER", "EASYAR_UNITY_BUNDLE_IDENTIFIER"], isNonPlaceholderString(envValues.bundleIdentifier), bundleIdentifierInput ? "provided as non-secret tool argument" : "defaults to focused sample identifier when unset"),
    envPresenceItem("easyar.cloudRecognition.appId", ["EASYAR_CLOUD_APP_ID", "EASYAR_CLOUD_RECOGNITION_APP_ID"], isNonPlaceholderString(envValues.cloudAppId), needsCloudRecognition ? "required for Cloud Recognition" : "optional for Image Tracking"),
    envPresenceItem("easyar.cloudRecognition.apiKey", ["EASYAR_CLOUD_API_KEY", "EASYAR_CLOUD_RECOGNITION_API_KEY", "EASYAR_CLOUD_APP_KEY", "EASYAR_CLOUD_RECOGNITION_APP_KEY"], isNonPlaceholderString(envValues.cloudApiKey), needsCloudRecognition ? "required for Cloud Recognition Sense 4.1+ APPID + API KEY" : "optional for Image Tracking"),
    envPresenceItem("easyar.cloudRecognition.apiSecret", ["EASYAR_CLOUD_API_SECRET", "EASYAR_CLOUD_RECOGNITION_API_SECRET", "EASYAR_CLOUD_APP_SECRET", "EASYAR_CLOUD_RECOGNITION_APP_SECRET"], isNonPlaceholderString(envValues.cloudApiSecret), "optional legacy/management secret; keep local when available")
  ];
  const requiredMissing = envPresence
    .filter((item) =>
      (item.field === "easyar.accountToken"
        || item.field === "easyar.licenseKey"
        || (needsCloudRecognition && (item.field === "easyar.cloudRecognition.appId" || item.field === "easyar.cloudRecognition.apiKey"))) &&
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

async function buildLocalConfigForm(
  root: string,
  sample: SampleInfo,
  platform: "android" | "ios" | "standalone",
  accountStage: AccountStage,
  bundleIdentifierInput?: string
) {
  const [accountMaterials, localConfig, onboarding] = await Promise.all([
    buildAccountMaterialsReport(root, sample, platform),
    buildLocalConfigValidationReport(root),
    buildAccountOnboardingReport(root, sample, platform, accountStage)
  ]);
  const configPath = path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json");
  const examplePath = path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json.example");
  const needsCloudRecognition = sample.id === "cloud-recognition";
  const checkOk = (id: string) => localConfig.checks.some((check) => check.id === id && check.ok);
  const materialPresent = (id: string) => accountMaterials.materials.some((item) => item.id === id && item.present);
  const bundleIdentifier = bundleIdentifierInput ?? defaultBundleIdentifier(sample);
  const fields = [
    localConfigFormField({
      id: "api-base-url",
      jsonPath: "easyar.apiBaseUrl",
      label: "EasyAR API base URL",
      required: true,
      present: checkOk("api-base-url"),
      source: "Official EasyAR service base URL.",
      envNames: ["EASYAR_API_BASE_URL"],
      placeholder: "https://www.easyar.cn",
      sharePolicy: "Safe as an endpoint URL; not a secret.",
      userAction: "Keep the default unless the official deployment gives a different API base URL."
    }),
    localConfigFormField({
      id: "account-token",
      jsonPath: "easyar.accountToken",
      label: "EasyAR account/API token",
      required: true,
      present: checkOk("account-token"),
      source: "Official EasyAR account API token or account-scoped secret store after registration/login.",
      envNames: ["EASYAR_ACCOUNT_TOKEN", "EASYAR_API_TOKEN"],
      placeholder: "<paste locally from EasyAR account secret store>",
      sharePolicy: "Secret. Never paste into chat, logs, GitHub issues, or source files.",
      userAction: "Store locally in easyar.local.json or use the environment-backed writer."
    }),
    localConfigFormField({
      id: "license-key",
      jsonPath: "easyar.licenseKey",
      label: "EasyAR Sense license key",
      required: true,
      present: checkOk("license-key") || materialPresent("license-key"),
      source: `EasyAR development center license entry for ${platform}; it must match the app bundle/package identifier.`,
      envNames: ["EASYAR_LICENSE_KEY", "EASYAR_SENSE_LICENSE_KEY"],
      placeholder: "<paste locally from EasyAR license page>",
      sharePolicy: "Secret or account-scoped value. Never commit or paste publicly.",
      userAction: "Create or locate the license after official EasyAR registration/login."
    }),
    localConfigFormField({
      id: "target-platform",
      jsonPath: "unity.targetPlatform",
      label: "Unity target platform",
      required: true,
      present: checkOk("target-platform"),
      source: "Focused run target selected in MCP.",
      envNames: [],
      placeholder: platform,
      sharePolicy: "Usually safe to share.",
      userAction: "Use android or ios before real-device validation."
    }),
    localConfigFormField({
      id: "bundle-identifier",
      jsonPath: "unity.bundleIdentifier",
      label: "Unity bundle/package identifier",
      required: true,
      present: checkOk("bundle-identifier") && materialPresent("bundle-identifier"),
      source: "Unity Player Settings and the matching EasyAR license configuration.",
      envNames: ["EASYAR_BUNDLE_IDENTIFIER", "EASYAR_UNITY_BUNDLE_IDENTIFIER"],
      placeholder: bundleIdentifier,
      sharePolicy: "Usually safe, but avoid public exposure if the app identifier is private.",
      userAction: "Make this match the identifier used when creating the EasyAR license."
    }),
    localConfigFormField({
      id: "cloud-app-id",
      jsonPath: "easyar.cloudRecognition.appId",
      label: "Cloud Recognition appId",
      required: needsCloudRecognition,
      present: materialPresent("cloud-app-id"),
      source: "EasyAR development center Cloud Recognition/CRS service configuration.",
      envNames: ["EASYAR_CLOUD_APP_ID", "EASYAR_CLOUD_RECOGNITION_APP_ID"],
      placeholder: needsCloudRecognition ? "<paste locally from Cloud Recognition service>" : "",
      sharePolicy: needsCloudRecognition ? "Sensitive account-scoped config. MCP reports presence only." : "Leave empty for Image Tracking.",
      userAction: needsCloudRecognition ? "Fill together with apiKey from the official API KEY list." : "Leave empty unless this project also runs Cloud Recognition."
    }),
    localConfigFormField({
      id: "cloud-api-key",
      jsonPath: "easyar.cloudRecognition.apiKey",
      label: "Cloud Recognition API Key",
      required: needsCloudRecognition,
      present: materialPresent("cloud-api-key"),
      source: "EasyAR development center Cloud Recognition/CRS API KEY list. Sense 4.1+ uses APPID + API KEY.",
      envNames: ["EASYAR_CLOUD_API_KEY", "EASYAR_CLOUD_RECOGNITION_API_KEY", "EASYAR_CLOUD_APP_KEY", "EASYAR_CLOUD_RECOGNITION_APP_KEY"],
      placeholder: needsCloudRecognition ? "<paste locally from API KEY list>" : "",
      sharePolicy: needsCloudRecognition ? "Secret. Never paste into chat, logs, GitHub issues, or source code." : "Leave empty for Image Tracking.",
      userAction: needsCloudRecognition ? "Fill together with appId. Legacy appKey/appSecret fields can stay as aliases when needed." : "Leave empty unless this project also runs Cloud Recognition."
    }),
    localConfigFormField({
      id: "cloud-api-secret",
      jsonPath: "easyar.cloudRecognition.apiSecret",
      label: "Cloud Recognition API Secret",
      required: false,
      present: materialPresent("cloud-api-secret"),
      source: "EasyAR development center Cloud Recognition/CRS API Secret when available for management or legacy integrations.",
      envNames: ["EASYAR_CLOUD_API_SECRET", "EASYAR_CLOUD_RECOGNITION_API_SECRET", "EASYAR_CLOUD_APP_SECRET", "EASYAR_CLOUD_RECOGNITION_APP_SECRET"],
      placeholder: needsCloudRecognition ? "<paste locally from API KEY list when available>" : "",
      sharePolicy: needsCloudRecognition ? "Secret. Never paste into chat, logs, GitHub issues, or source code." : "Leave empty for Image Tracking.",
      userAction: needsCloudRecognition ? "Optional for Sense 4.1+ runtime credential validation; keep it local if the official account exposes it." : "Leave empty unless this project also runs Cloud Recognition."
    }),
    localConfigFormField({
      id: "cloud-app-key-legacy",
      jsonPath: "easyar.cloudRecognition.appKey",
      label: "Cloud Recognition legacy appKey",
      required: false,
      present: materialPresent("cloud-app-key-legacy"),
      source: "Legacy alias for Cloud Recognition API Key.",
      envNames: ["EASYAR_CLOUD_APP_KEY", "EASYAR_CLOUD_RECOGNITION_APP_KEY"],
      placeholder: needsCloudRecognition ? "<optional legacy alias for apiKey>" : "",
      sharePolicy: needsCloudRecognition ? "Secret. Never paste into chat, logs, GitHub issues, or source code." : "Leave empty for Image Tracking.",
      userAction: needsCloudRecognition ? "Prefer apiKey; fill this only for legacy tools or compatibility." : "Leave empty unless this project also runs Cloud Recognition."
    }),
    localConfigFormField({
      id: "cloud-app-secret-legacy",
      jsonPath: "easyar.cloudRecognition.appSecret",
      label: "Cloud Recognition legacy appSecret",
      required: false,
      present: materialPresent("cloud-app-secret-legacy"),
      source: "Legacy alias for Cloud Recognition API Secret.",
      envNames: ["EASYAR_CLOUD_APP_SECRET", "EASYAR_CLOUD_RECOGNITION_APP_SECRET"],
      placeholder: needsCloudRecognition ? "<optional legacy alias for apiSecret>" : "",
      sharePolicy: needsCloudRecognition ? "Secret. Never paste into chat, logs, GitHub issues, or source code." : "Leave empty for Image Tracking.",
      userAction: needsCloudRecognition ? "Prefer apiSecret when the official account exposes a secret; fill this only for legacy tools or compatibility." : "Leave empty unless this project also runs Cloud Recognition."
    })
  ];
  const missingRequiredFields = fields.filter((field) => field.required && !field.present).map((field) => field.jsonPath);
  const jsonSkeleton = {
    sampleId: sample.id,
    sampleName: sample.name,
    easyar: {
      apiBaseUrl: "https://www.easyar.cn",
      accountToken: "<paste locally; never send to MCP chat>",
      licenseKey: "<paste locally; never send to MCP chat>",
      cloudRecognition: {
        appId: needsCloudRecognition ? "<paste locally; required for Cloud Recognition>" : "",
        apiKey: needsCloudRecognition ? "<paste locally; required for Cloud Recognition Sense 4.1+>" : "",
        apiSecret: needsCloudRecognition ? "<paste locally if exposed by API KEY list>" : "",
        appKey: needsCloudRecognition ? "<optional legacy alias for apiKey>" : "",
        appSecret: needsCloudRecognition ? "<optional legacy alias for apiSecret>" : ""
      }
    },
    unity: {
      targetPlatform: platform,
      bundleIdentifier,
      notes: sample.setupNotes
    }
  };
  const envBackedWrite = {
    tool: "easyar_write_local_config_from_env",
    arguments: {
      projectPath: root,
      sampleId: sample.id,
      targetPlatform: platform,
      bundleIdentifier
    },
    requiredEnvNames: fields
      .filter((field) => field.required && field.envNames.length > 0)
      .flatMap((field) => field.envNames)
  };
  const validationChain = [
    `easyar_validate_local_config projectPath=${root}`,
    `easyar_write_account_materials projectPath=${root} sampleId=${sample.id} platform=${platform}`,
    `easyar_write_focused_preflight projectPath=${root} sampleId=${sample.id} platform=${platform}`,
    `easyar_check_sample_readiness projectPath=${root} sampleId=${sample.id}`,
    `easyar_next_workflow_step projectPath=${root} sampleId=${sample.id} platform=${platform}`
  ];
  const nextActions = missingRequiredFields.length > 0
    ? [
        ...(onboarding.stage === "not-registered" ? ["Register or log in at https://www.easyar.cn/ before filling account-scoped values."] : []),
        `Copy ${path.relative(root, examplePath)} to ${path.relative(root, configPath)} if the local file does not exist.`,
        `Fill missing required field(s) locally: ${missingRequiredFields.join(", ")}.`,
        `Run ${validationChain[0]}.`
      ]
    : [
        `Run ${validationChain[0]}.`,
        `Run ${validationChain[2]} and continue with the focused sample workflow.`
      ];

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    platform,
    accountStage: onboarding.stage,
    configPath,
    examplePath,
    localConfig: {
      exists: await exists(configPath),
      valid: localConfig.valid,
      failedChecks: localConfig.checks.filter((check) => !check.ok).map((check) => check.id)
    },
    readyToValidate: missingRequiredFields.length === 0,
    fields,
    missingRequiredFields,
    jsonSkeleton,
    envBackedWrite,
    validationChain,
    nextActions: Array.from(new Set(nextActions)),
    security: "This form returns only field names, placeholders, presence status, and validation calls. Actual account tokens, license keys, API keys, appKey, and appSecret must stay in local files or local environment variables."
  };
}

function localConfigFormField(input: {
  id: string;
  jsonPath: string;
  label: string;
  required: boolean;
  present: boolean;
  source: string;
  envNames: string[];
  placeholder: string;
  sharePolicy: string;
  userAction: string;
}) {
  return input;
}

async function buildLocalConfigHandoffReport(
  root: string,
  sample: SampleInfo,
  platform: "android" | "ios" | "standalone",
  accountStage: AccountStage
) {
  const onboarding = await buildAccountOnboardingReport(root, sample, platform, accountStage);
  const accountMaterials = await buildAccountMaterialsReport(root, sample, platform);
  const localConfig = await buildLocalConfigValidationReport(root);
  const configPath = path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json");
  const examplePath = path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json.example");
  const localConfigExists = await exists(configPath);
  const needsCloudRecognition = sample.id === "cloud-recognition";
  const envPresence = [
    envPresenceItem("easyar.apiBaseUrl", ["EASYAR_API_BASE_URL"], isNonPlaceholderString(envFirst(["EASYAR_API_BASE_URL"]) ?? "https://www.easyar.cn"), "defaults to https://www.easyar.cn when unset"),
    envPresenceItem("easyar.accountToken", ["EASYAR_ACCOUNT_TOKEN", "EASYAR_API_TOKEN"], isNonPlaceholderString(envFirst(["EASYAR_ACCOUNT_TOKEN", "EASYAR_API_TOKEN"])), "required by local validation"),
    envPresenceItem("easyar.licenseKey", ["EASYAR_LICENSE_KEY", "EASYAR_SENSE_LICENSE_KEY"], isNonPlaceholderString(envFirst(["EASYAR_LICENSE_KEY", "EASYAR_SENSE_LICENSE_KEY"])), "required for focused sample runs"),
    envPresenceItem("unity.bundleIdentifier", ["EASYAR_BUNDLE_IDENTIFIER", "EASYAR_UNITY_BUNDLE_IDENTIFIER"], isNonPlaceholderString(envFirst(["EASYAR_BUNDLE_IDENTIFIER", "EASYAR_UNITY_BUNDLE_IDENTIFIER"]) ?? defaultBundleIdentifier(sample)), "defaults to focused sample identifier when unset"),
    envPresenceItem("easyar.cloudRecognition.appId", ["EASYAR_CLOUD_APP_ID", "EASYAR_CLOUD_RECOGNITION_APP_ID"], isNonPlaceholderString(envFirst(["EASYAR_CLOUD_APP_ID", "EASYAR_CLOUD_RECOGNITION_APP_ID"])), needsCloudRecognition ? "required for Cloud Recognition" : "optional for Image Tracking"),
    envPresenceItem("easyar.cloudRecognition.apiKey", ["EASYAR_CLOUD_API_KEY", "EASYAR_CLOUD_RECOGNITION_API_KEY", "EASYAR_CLOUD_APP_KEY", "EASYAR_CLOUD_RECOGNITION_APP_KEY"], isNonPlaceholderString(envFirst(["EASYAR_CLOUD_API_KEY", "EASYAR_CLOUD_RECOGNITION_API_KEY", "EASYAR_CLOUD_APP_KEY", "EASYAR_CLOUD_RECOGNITION_APP_KEY"])), needsCloudRecognition ? "required for Cloud Recognition Sense 4.1+ APPID + API KEY" : "optional for Image Tracking"),
    envPresenceItem("easyar.cloudRecognition.apiSecret", ["EASYAR_CLOUD_API_SECRET", "EASYAR_CLOUD_RECOGNITION_API_SECRET", "EASYAR_CLOUD_APP_SECRET", "EASYAR_CLOUD_RECOGNITION_APP_SECRET"], isNonPlaceholderString(envFirst(["EASYAR_CLOUD_API_SECRET", "EASYAR_CLOUD_RECOGNITION_API_SECRET", "EASYAR_CLOUD_APP_SECRET", "EASYAR_CLOUD_RECOGNITION_APP_SECRET"])), "optional legacy/management secret; keep local when available")
  ];
  const failedLocalChecks = localConfig.checks.filter((check) => !check.ok).map((check) => check.id);
  const manualFileSteps = [
    "Open https://www.easyar.cn/ in a browser and register or log in with the user's EasyAR account.",
    `Create or locate the EasyAR Sense license for ${platform} and the Unity bundle/package identifier.`,
    ...(needsCloudRecognition
      ? ["Create or locate the Cloud Recognition/CRS application and copy CRS AppId plus API KEY locally. Keep API Secret local if the account page exposes it."]
      : ["Cloud Recognition credentials are not required for Image Tracking, but can remain empty as a complete empty group."]),
    "Run easyar_prepare_unity_project if easyar.local.json.example is missing.",
    `Copy ${path.relative(root, examplePath)} to ${path.relative(root, configPath)}.`,
    "Fill the JSON file locally. Do not paste account passwords, API tokens, license keys, API keys, appKey, or appSecret into the AI chat.",
    `Run easyar_validate_local_config projectPath=${root}.`
  ];
  const envBackedWrite = {
    command: "easyar_write_local_config_from_env",
    arguments: {
      projectPath: root,
      sampleId: sample.id,
      targetPlatform: platform
    },
    requiredEnv: envPresence
      .filter((item) => item.field === "easyar.accountToken"
        || item.field === "easyar.licenseKey"
        || (needsCloudRecognition && (item.field === "easyar.cloudRecognition.appId" || item.field === "easyar.cloudRecognition.apiKey")))
      .flatMap((item) => item.envNames)
  };
  const validationChain = [
    `easyar_validate_local_config projectPath=${root}`,
    `easyar_write_import_checklist projectPath=${root} sampleId=${sample.id} platform=${platform}`,
    `easyar_write_focused_preflight projectPath=${root} sampleId=${sample.id} platform=${platform}`,
    `easyar_check_sample_readiness projectPath=${root} sampleId=${sample.id}`,
    `easyar_next_workflow_step projectPath=${root} sampleId=${sample.id} platform=${platform}`
  ];
  const nextActions = Array.from(new Set([
    ...(onboarding.stage === "not-registered"
      ? ["Register or log in at https://www.easyar.cn/ before preparing local credentials."]
      : []),
    ...(accountMaterials.missingRequired.length > 0
      ? [`Prepare missing EasyAR material(s): ${accountMaterials.missingRequired.join(", ")}.`]
      : []),
    ...(failedLocalChecks.length > 0
      ? [`Fix local config check(s): ${failedLocalChecks.join(", ")}.`]
      : []),
    `Use either the manual file steps or ${envBackedWrite.command}; then run ${validationChain[0]}.`,
    needsCloudRecognition
      ? "For Cloud Recognition, appId and apiKey must be filled before the sample can be considered ready. Legacy appKey/appSecret fields are still accepted."
      : "For Image Tracking, leave Cloud Recognition credentials empty unless the project also needs Cloud Recognition."
  ]));

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name
    },
    platform,
    account: {
      requestedStage: accountStage,
      stage: onboarding.stage,
      officialLinks: onboarding.officialLinks,
      firstRunGuide: onboarding.firstRunGuide
    },
    accountMaterials: {
      readyForLocalConfigValidation: accountMaterials.readyForLocalConfigValidation,
      missingRequired: accountMaterials.missingRequired,
      materials: accountMaterials.materials
    },
    localConfig: {
      path: configPath,
      examplePath,
      exists: localConfigExists,
      valid: localConfig.valid,
      failedChecks: failedLocalChecks,
      nextActions: localConfig.nextActions
    },
    envBackedWrite,
    envPresence,
    manualFileSteps,
    validationChain,
    sampleSpecific: needsCloudRecognition
      ? [
          "Cloud Recognition is account-scoped and cannot run with placeholder credentials.",
          "The MCP server should stop at local-config validation until appId and apiKey are present.",
          "Only presence and placeholder status are reported back to the AI client."
        ]
      : [
          "Image Tracking needs an EasyAR license and target assets, but not Cloud Recognition app credentials.",
          "Cloud Recognition fields can stay empty as long as appId, apiKey, apiSecret, appKey, and appSecret are all empty."
        ],
    nextActions,
    security: "This handoff never returns secret values. It guides the user to register/login in the browser and store account-scoped values only in local files or local environment variables."
  };
}

function envFirst(names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (isNonPlaceholderString(value)) {
      return value;
    }
  }
  return undefined;
}

function envPresenceItem(field: string, envNames: string[], present: boolean, note: string) {
  return {
    field,
    envNames,
    present,
    note
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
      detail: "cloudRecognition credentials are either empty, configured as appId + apiKey, or configured with legacy appId + appKey + appSecret."
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
    return "Either leave all cloudRecognition fields empty, fill appId and apiKey for Sense 4.1+, or fill legacy appId, appKey, and appSecret together.";
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
  return sanitizeIssueText(value);
}

function sanitizeIssueText(value: string | undefined | null): string | null {
  if (!value) {
    return null;
  }
  return value.replace(
    /(licenseKey|license|accountToken|apiToken|accessToken|token|credential|appKey|appSecret|password|secret|key)\s*[:=]\s*\S+/gi,
    "$1=<redacted>"
  );
}

function defaultIssueReproductionSteps(sample: SampleInfo, platform: typeof mobilePlatforms[number]): string[] {
  return [
    `Run easyar_write_onboarding_report with sampleId=${sample.id} and platform=${platform}.`,
    `Run easyar_write_import_checklist, easyar_write_run_sequence, easyar_write_run_report, and easyar_write_scene_audit for sampleId=${sample.id}.`,
    "Run Unity validation with EasyAR.EditorTools.EasyARSampleValidationHelper.ValidateFocusedSample.",
    `Build and test the ${sample.name} sample on a real ${platform} device.`,
    "Run easyar_write_support_bundle, easyar_write_run_result, and easyar_write_issue_report after the failure."
  ];
}

function sampleExpectedIssueBehavior(sample: SampleInfo): string {
  if (sample.id === "image-tracking") {
    return "The Image Tracking sample should open the camera, load the configured target image, and show the expected tracking behavior on a real device.";
  }
  if (sample.id === "cloud-recognition") {
    return "The Cloud Recognition sample should open the camera, use configured official Cloud Recognition credentials, reach the service, and return recognition results on a real device.";
  }
  return "The focused EasyAR sample should pass validation and run on a real device.";
}

function hasCloudRecognitionConfig(value: Record<string, unknown>): boolean {
  const fields = [value.appId, value.apiKey, value.apiSecret, value.appKey, value.appSecret];
  const configuredCount = fields.filter(isNonPlaceholderString).length;
  const emptyCount = fields.filter((field) => field === undefined || field === null || (typeof field === "string" && field.trim() === "")).length;
  return hasCompleteCloudRecognitionConfig(value) || emptyCount === fields.length;
}

function hasCompleteCloudRecognitionConfig(value: Record<string, unknown>): boolean {
  const hasAppId = isNonPlaceholderString(value.appId);
  const hasModernApiKey = isNonPlaceholderString(value.apiKey);
  const hasLegacyKeySecret = isNonPlaceholderString(value.appKey) && isNonPlaceholderString(value.appSecret);
  return hasAppId && (hasModernApiKey || hasLegacyKeySecret);
}

function cloudRecognitionCredentialMode(value: Record<string, unknown>): "appId-apiKey" | "legacy-appKey-appSecret" | "empty-or-incomplete" {
  if (isNonPlaceholderString(value.appId) && isNonPlaceholderString(value.apiKey)) {
    return "appId-apiKey";
  }
  if (isNonPlaceholderString(value.appId) && isNonPlaceholderString(value.appKey) && isNonPlaceholderString(value.appSecret)) {
    return "legacy-appKey-appSecret";
  }
  return "empty-or-incomplete";
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
      pattern: /\b(camera|webcam)\b[\s\S]{0,120}\b(permission\s+(denied|missing|disabled)|denied|not authorized|unauthorized)\b|\bpermission\b[\s\S]{0,120}\b(denied|missing|disabled|not authorized|unauthorized)\b[\s\S]{0,120}\b(camera|webcam)\b/i,
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
      pattern: /(gradle|android).{0,200}(failed|failure|exception|error|could not|unable|manifest merger|minSdk|targetSdk|duplicate class)|\b(GradleInvokationException|FAILURE:\s*Build failed|Execution failed for task|Could not download)\b/i,
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
        pattern: /(image\s*target|imagetarget|target\s*(database|asset|image|file|data)).{0,160}(not\s*found|missing|load(ed)?\s*failed|cannot\s*load|invalid|empty)/i,
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
          "Fill easyar.cloudRecognition.appId and apiKey in ProjectSettings/EasyAR/easyar.local.json. Legacy appKey/appSecret is also accepted.",
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
    ...markdownIssueList(failedReadiness.map((check) => `MISSING ${check.id}: ${check.detail}`), "All readiness checks passed."),
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

function buildFocusedPreflightMarkdown(preflight: Awaited<ReturnType<typeof buildFocusedPreflight>>): string {
  return [
    `# EasyAR Focused Preflight - ${preflight.sample.name}`,
    "",
    `Generated at: ${preflight.generatedAt}`,
    `Project: ${preflight.projectPath}`,
    `Sample id: ${preflight.sample.id}`,
    `Status: ${preflight.sample.implementationStatus}`,
    `Platform: ${preflight.platform}`,
    `Output path: ${preflight.outputPath}`,
    `Ready for Unity batch: ${preflight.readyForUnityBatch ? "yes" : "no"}`,
    `Ready for device build: ${preflight.readyForDeviceBuild ? "yes" : "no"}`,
    "",
    "## Blockers",
    "",
    ...markdownIssueList(preflight.blockers.map((blocker) => `${blocker.area}/${blocker.id}: ${blocker.detail} Action: ${blocker.action}`), "No focused preflight blockers."),
    "",
    "## Next Call",
    "",
    `Tool: \`${preflight.nextCall.tool}\``,
    `Arguments: \`${JSON.stringify(preflight.nextCall.arguments)}\``,
    "",
    "## Checks",
    "",
    ...preflight.checks.map((check) => `- ${check.ok ? "OK" : "BLOCKED"} [${check.area}] ${check.id}: ${check.detail}`),
    "",
    "## Summaries",
    "",
    `Missing account materials: ${preflight.summaries.missingAccountMaterials.length > 0 ? preflight.summaries.missingAccountMaterials.join(", ") : "none"}`,
    `Unity recommended path: ${preflight.summaries.unityRecommendedPath ?? "not found"}`,
    `Import ready: ${preflight.summaries.importReady ? "yes" : "no"}`,
    `PackageCache samples: ${preflight.summaries.packageCacheSamples.length > 0 ? preflight.summaries.packageCacheSamples.join(", ") : "none"}`,
    `Local config valid: ${preflight.summaries.localConfigValid ? "yes" : "no"}`,
    `Readiness ready: ${preflight.summaries.readinessReady ? "yes" : "no"}`,
    `Scene ready: ${preflight.summaries.sceneReady ? "yes" : "no"}`,
    `Script issue count: ${preflight.summaries.scriptIssueCount}`,
    `Workflow phase: ${preflight.summaries.workflowPhase}`,
    `Workflow blocked: ${preflight.summaries.workflowBlocked ? "yes" : "no"}`,
    "",
    "## Related Artifacts",
    "",
    ...Object.entries(preflight.references).map(([name, relativePath]) => `- ${name}: ${relativePath}`),
    "",
    "## Next Actions",
    "",
    ...preflight.nextActions.map((action) => `- ${action}`),
    "",
    "## Security",
    "",
    preflight.security,
    ""
  ].join("\n");
}

function buildImportChecklistMarkdown(checklist: Awaited<ReturnType<typeof buildImportChecklist>>): string {
  const missingRequired = checklist.items.filter((item) => item.required && !item.ok);
  return [
    `# EasyAR Import Checklist - ${checklist.sample.name}`,
    "",
    `Generated at: ${checklist.generatedAt}`,
    `Project: ${checklist.projectPath}`,
    `Sample id: ${checklist.sample.id}`,
    `Status: ${checklist.sample.implementationStatus}`,
    `Ready for focused preparation: ${checklist.readyForFocusedPreparation ? "yes" : "no"}`,
    "",
    "## Required Missing Items",
    "",
    ...markdownIssueList(missingRequired.map((item) => `${item.id}: ${item.action}`), "All required import items are present."),
    "",
    "## Checklist",
    "",
    ...checklist.items.flatMap((item) => [
      `- ${item.ok ? "OK" : "MISSING"} ${item.required ? "[required]" : "[recommended]"} ${item.id}`,
      `  Evidence: ${item.evidence}`,
      `  Action: ${item.action}`
    ]),
    "",
    "## Official References",
    "",
    `- Samples: ${checklist.officialReferences.samples}`,
    `- Downloads: ${checklist.officialReferences.downloads}`,
    `- Download history: ${checklist.officialReferences.downloadHistory}`,
    "",
    "## Captured Package Versions",
    "",
    ...Object.entries(checklist.packageVersions).map(([name, version]) => `- ${name}: ${version}`),
    "",
    "## Next Actions",
    "",
    ...checklist.nextActions.map((action) => `- ${action}`),
    "",
    "## Security",
    "",
    checklist.security,
    ""
  ].join("\n");
}

function buildSampleImportGuideMarkdown(guide: Awaited<ReturnType<typeof buildSampleImportGuide>>): string {
  return [
    `# EasyAR Sample Import Guide - ${guide.sample.name}`,
    "",
    `Generated at: ${guide.generatedAt}`,
    `Project: ${guide.projectPath}`,
    `Sample id: ${guide.sample.id}`,
    `Status: ${guide.sample.implementationStatus}`,
    `Unity version: ${guide.unityVersion ?? "unknown"}`,
    `Import complete: ${guide.importComplete ? "yes" : "no"}`,
    `PackageCache sample available: ${guide.importAvailableFromPackageCache ? "yes" : "no"}`,
    `Expected Unity Package Manager sample: ${guide.expectedUnityPackageSampleName}`,
    "",
    "## Evidence",
    "",
    `Focused sample scene: ${guide.evidence.focusedSampleScene}`,
    `PackageCache sample: ${guide.evidence.packageCacheSample}`,
    "",
    "## Imported Scenes",
    "",
    ...markdownIssueList(guide.importedScenes, "No matching focused sample scenes are imported under Assets yet."),
    "",
    "## Expected Import Locations",
    "",
    ...guide.expectedImportLocations.map((location) => `- ${location}`),
    "",
    "## PackageCache Candidates",
    "",
    ...markdownIssueList(guide.packageCacheSamples, "No matching PackageCache Samples~ candidates were found."),
    "",
    "## Unity Steps",
    "",
    ...guide.steps.flatMap((step) => [
      `${step.order}. ${step.title}`,
      `   Action: ${step.action}`,
      `   Done when: ${step.doneWhen}`
    ]),
    "",
    "## MCP After Import",
    "",
    ...guide.mcpAfterImport.map((call) => `- ${call.tool}: ${JSON.stringify(call.arguments)}`),
    "",
    "## Post-Import Verification",
    "",
    ...guide.postImportVerification.flatMap((call) => [
      `- Tool: \`${call.tool}\``,
      `  Arguments: \`${JSON.stringify(call.arguments)}\``,
      `  Expected: ${call.expected}`
    ]),
    "",
    "## Next Actions",
    "",
    ...guide.nextActions.map((action) => `- ${action}`),
    "",
    "## Security",
    "",
    guide.security,
    ""
  ].join("\n");
}

function buildWorkflowStateMarkdown(state: Awaited<ReturnType<typeof buildWorkflowState>>): string {
  return [
    `# EasyAR Workflow State - ${state.sample.name}`,
    "",
    `Generated at: ${state.generatedAt}`,
    `Project: ${state.projectPath}`,
    `Sample id: ${state.sample.id}`,
    `Status: ${state.sample.implementationStatus}`,
    `Platform: ${state.platform}`,
    `Output path: ${state.outputPath}`,
    `Phase: ${state.phase}`,
    `Blocked: ${state.blocked ? "yes" : "no"}`,
    "",
    "## Reason",
    "",
    state.reason,
    "",
    "## Next Call",
    "",
    `Tool: \`${state.nextCall.tool}\``,
    `Arguments: \`${JSON.stringify(state.nextCall.arguments)}\``,
    "",
    "## Summary",
    "",
    `Official access ready: ${state.summary.officialAccessReady ? "yes" : "no"}`,
    `Official access blockers: ${state.summary.officialAccessBlockers.length > 0 ? state.summary.officialAccessBlockers.join(", ") : "none"}`,
    `Import ready: ${state.summary.importReady ? "yes" : "no"}`,
    `Missing import items: ${state.summary.missingRequiredImportItems.length > 0 ? state.summary.missingRequiredImportItems.join(", ") : "none"}`,
    `Readiness ready: ${state.summary.readinessReady ? "yes" : "no"}`,
    `Failing readiness checks: ${state.summary.failingReadinessChecks.length > 0 ? state.summary.failingReadinessChecks.join(", ") : "none"}`,
    `Local config valid: ${state.summary.configValid ? "yes" : "no"}`,
    `Failing config checks: ${state.summary.failingConfigChecks.length > 0 ? state.summary.failingConfigChecks.join(", ") : "none"}`,
    `Scene ready: ${state.summary.sceneReady ? "yes" : "no"}`,
    `Scene blockers: ${state.summary.sceneBlockers.length > 0 ? state.summary.sceneBlockers.join(", ") : "none"}`,
    `Script issue count: ${state.summary.scriptIssueCount}`,
    `Device ready: ${state.summary.deviceReady ? "yes" : "no"}`,
    `Device blockers: ${state.summary.deviceBlockers.length > 0 ? state.summary.deviceBlockers.join(", ") : "none"}`,
    `Missing artifacts: ${state.summary.missingArtifacts.length > 0 ? state.summary.missingArtifacts.join(", ") : "none"}`,
    "",
    "## Recommended Sequence",
    "",
    ...state.recommendedSequence.flatMap((call, index) => [
      `${index + 1}. \`${call.tool}\``,
      `   - Arguments: \`${JSON.stringify(call.arguments)}\``
    ]),
    "",
    "## Next Actions",
    "",
    ...state.nextActions.map((action) => `- ${action}`),
    "",
    "## Security",
    "",
    state.security,
    ""
  ].join("\n");
}

function buildArtifactIndexMarkdown(index: Awaited<ReturnType<typeof buildArtifactIndex>>): string {
  return [
    `# EasyAR Focused Artifact Index - ${index.sample.name}`,
    "",
    `Generated at: ${index.generatedAt}`,
    `Project: ${index.projectPath}`,
    `Sample id: ${index.sample.id}`,
    `Status: ${index.sample.implementationStatus}`,
    "",
    "## Recommended Reading Order",
    "",
    ...index.readOrder.map((artifactPath, indexNumber) => `${indexNumber + 1}. ${artifactPath}`),
    "",
    "## Artifact Status",
    "",
    ...index.artifacts.flatMap((artifact) => [
      `${artifact.order}. ${artifact.name}`,
      `   - Path: ${artifact.relativePath}`,
      `   - Exists: ${artifact.exists ? "yes" : "no"}`,
      `   - Size bytes: ${artifact.sizeBytes ?? "unknown"}`,
      `   - Modified at: ${artifact.modifiedAt ?? "unknown"}`,
      `   - Purpose: ${artifact.purpose}`,
      `   - Generate with: ${artifact.generateWith}`
    ]),
    "",
    "## Missing Artifacts",
    "",
    ...markdownIssueList(index.missingArtifacts, "No missing focused artifacts."),
    "",
    "## Next Actions",
    "",
    ...markdownIssueList(index.nextActions, "Read SUPPORT_BUNDLE.md first."),
    "",
    "## Security",
    "",
    index.security,
    ""
  ].join("\n");
}

function buildFocusedHandoffPackMarkdown(pack: {
  generatedAt: string;
  projectPath: string;
  sample: SampleInfo;
  platform: typeof mobilePlatforms[number];
  outputPath: string;
  artifactNames: string[];
  artifactIndex: Awaited<ReturnType<typeof buildArtifactIndex>>;
  workflowState: Awaited<ReturnType<typeof buildWorkflowState>>;
  preflight: Awaited<ReturnType<typeof buildFocusedPreflight>>;
  localConfigForm: Awaited<ReturnType<typeof buildLocalConfigForm>>;
}): string {
  return [
    `# EasyAR Focused Handoff Pack - ${pack.sample.name}`,
    "",
    `Generated at: ${pack.generatedAt}`,
    `Project: ${pack.projectPath}`,
    `Sample id: ${pack.sample.id}`,
    `Status: ${pack.sample.implementationStatus}`,
    `Platform: ${pack.platform}`,
    `Output path: ${pack.outputPath}`,
    "",
    "## Summary",
    "",
    `Workflow phase: ${pack.workflowState.phase}`,
    `Workflow blocked: ${pack.workflowState.blocked ? "yes" : "no"}`,
    `Ready for Unity batch: ${pack.preflight.readyForUnityBatch ? "yes" : "no"}`,
    `Ready for device build: ${pack.preflight.readyForDeviceBuild ? "yes" : "no"}`,
    `Local config valid: ${pack.localConfigForm.localConfig.valid ? "yes" : "no"}`,
    `Missing artifact count: ${pack.artifactIndex.missingArtifacts.length}`,
    "",
    "## Generated In This Pack",
    "",
    ...pack.artifactNames.map((name) => `- ${name}`),
    "- ARTIFACT_INDEX.md",
    "- HANDOFF_PACK.md",
    "",
    "## Recommended Reading Order",
    "",
    ...pack.artifactIndex.readOrder.map((artifactPath, index) => `${index + 1}. ${artifactPath}`),
    "",
    "## Local Config Missing Fields",
    "",
    ...markdownIssueList(pack.localConfigForm.missingRequiredFields, "No required local config fields are missing."),
    "",
    "## Current Blockers",
    "",
    ...markdownIssueList(pack.preflight.blockers.map((blocker) => `${blocker.id}: ${blocker.detail} Action: ${blocker.action}`), "No preflight blockers."),
    "",
    "## Next Call",
    "",
    `Tool: \`${pack.workflowState.nextCall.tool}\``,
    `Arguments: \`${JSON.stringify(pack.workflowState.nextCall.arguments)}\``,
    "",
    "## Next Actions",
    "",
    ...markdownIssueList(Array.from(new Set([
      ...pack.workflowState.nextActions,
      ...pack.preflight.nextActions,
      ...pack.localConfigForm.nextActions
    ])).slice(0, 16), "No next actions recorded."),
    "",
    "## Evidence Rules",
    "",
    "- This pack does not mark RUN_RESULT.md as passed.",
    "- CODE_CHANGE.md is intentionally generated only after real C# edits.",
    "- Real-device completion still requires a passed RUN_RESULT.md with recorded device validation evidence.",
    "",
    "## Security",
    "",
    "This handoff pack contains paths, field names, placeholders, status summaries, and next calls only. It does not contain EasyAR account tokens, license keys, Cloud Recognition appKey/appSecret, signing keys, provisioning secrets, or raw private logs.",
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

function buildCompletionReportMarkdown(report: Awaited<ReturnType<typeof buildCompletionReport>>): string {
  return [
    `# EasyAR Completion Report - ${report.sample.name}`,
    "",
    `Generated at: ${report.generatedAt}`,
    `Project: ${report.projectPath}`,
    `Sample id: ${report.sample.id}`,
    `Status: ${report.sample.implementationStatus}`,
    `Platform: ${report.platform}`,
    `Output path: ${report.outputPath}`,
    `Completion status: ${report.completionStatus}`,
    `Run-through complete: ${report.runThroughComplete ? "yes" : "no"}`,
    "",
    "## Summary",
    "",
    `Ready for Unity batch: ${report.summary.readyForUnityBatch ? "yes" : "no"}`,
    `Ready for device build: ${report.summary.readyForDeviceBuild ? "yes" : "no"}`,
    `Ready for device validation: ${report.summary.readyForDeviceValidation ? "yes" : "no"}`,
    `Latest log analyzed: ${report.summary.latestLogAnalyzed ? "yes" : "no"}`,
    `Latest log issue count: ${report.summary.latestLogIssueCount}`,
    `Latest run result status: ${report.summary.latestRunResultStatus ?? "none"}`,
    "",
    "## Required Evidence",
    "",
    ...report.requiredEvidence.map((item) => `- ${item.passed ? "OK" : "MISSING"} ${item.required ? "[required]" : "[recommended]"} ${item.id}: ${item.detail}`),
    "",
    "## Evidence",
    "",
    ...report.evidence.map((item) => `- ${item.id}: ${item.status}; path=${item.path}; ${item.detail}`),
    "",
    "## Parsed Run Result",
    "",
    `Exists: ${report.parsedRunResult.exists ? "yes" : "no"}`,
    `Path: ${report.parsedRunResult.relativePath}`,
    `Overall status: ${report.parsedRunResult.overallStatus ?? "none"}`,
    `Device: ${report.parsedRunResult.device ?? "not recorded"}`,
    `Build output: ${report.parsedRunResult.buildOutputPath ?? "not recorded"}`,
    `Passed steps: ${report.parsedRunResult.passedStepCount}`,
    `Passed device validation steps: ${report.parsedRunResult.passedDeviceValidationStepCount}`,
    `Real-device evidence accepted: ${report.parsedRunResult.hasPassedDeviceValidationEvidence ? "yes" : "no"}`,
    `Failed steps: ${report.parsedRunResult.failedStepCount}`,
    `Blocked steps: ${report.parsedRunResult.blockedStepCount}`,
    `Not-run steps: ${report.parsedRunResult.notRunStepCount}`,
    "",
    "## Blockers",
    "",
    ...markdownIssueList(report.blockers.map((blocker) => `${blocker.id}: ${blocker.detail} Action: ${blocker.action}`), "No completion blockers."),
    "",
    "## Next Actions",
    "",
    ...markdownIssueList(report.nextActions, "Focused sample run-through is complete."),
    "",
    "## Security",
    "",
    report.security,
    ""
  ].join("\n");
}

function buildFocusedScopeStatusMarkdown(status: Awaited<ReturnType<typeof buildFocusedScopeStatus>>): string {
  return [
    "# EasyAR Focused Scope Status",
    "",
    `Generated at: ${status.generatedAt}`,
    `Project: ${status.projectPath}`,
    `Platform: ${status.platform}`,
    `Scope: ${status.scope}`,
    `All focused samples complete: ${status.allFocusedSamplesComplete ? "yes" : "no"}`,
    "",
    "## Summary",
    "",
    `Focused sample count: ${status.focusedSampleCount}`,
    `Completed: ${status.completedCount}`,
    `Blocked: ${status.blockedCount}`,
    `Failed: ${status.failedCount}`,
    `Not run: ${status.notRunCount}`,
    `Focused samples: ${status.focusedSampleIds.join(", ")}`,
    `Deferred samples: ${status.deferredSampleIds.join(", ")}`,
    "",
    "## Samples",
    "",
    ...status.items.flatMap((item) => [
      `### ${item.sampleName}`,
      "",
      `Sample id: ${item.sampleId}`,
      `Completion status: ${item.completionStatus}`,
      `Run-through complete: ${item.runThroughComplete ? "yes" : "no"}`,
      `Blocker count: ${item.blockerCount}`,
      `Latest run result status: ${item.latestRunResultStatus ?? "none"}`,
      `Completion report: ${item.completionReportPath}`,
      `Run result: ${item.runResultPath}`,
      "",
      "Next actions:",
      ...markdownIssueList(item.nextActions, "No sample-specific next actions."),
      ""
    ]),
    "## Next Actions",
    "",
    ...markdownIssueList(status.nextActions, "Focused sample scope is complete."),
    "",
    "## Security",
    "",
    status.security,
    ""
  ].join("\n");
}

function buildIssueReportMarkdown(report: {
  generatedAt: string;
  title: string;
  labels: string[];
  projectPath: string;
  sample: {
    id: string;
    name: string;
    implementationStatus: string;
  };
  platform: string;
  overallStatus: string;
  device: string | null;
  buildOutputPath: string | null;
  observedBehavior: string;
  expectedBehavior: string;
  reproductionSteps: string[];
  stepSummary: Array<{
    name: string;
    status: string;
    evidence: string | null;
    nextAction: string | null;
  }>;
  readinessSummary: {
    ready: boolean;
    unityVersion: string | null;
    failingChecks: Array<{
      id: string;
      severity: string;
      detail: string;
      action: string;
    }>;
  };
  configSummary: {
    valid: boolean;
    checkCount: number;
    failingChecks: Array<{
      id: string;
      severity: string;
      detail: string;
    }>;
  };
  supportSummary: {
    overallReady: boolean;
    readyForUnityValidation: boolean;
    logIssueCount: number;
    supportBundlePath: string;
  };
  artifactPaths: Record<string, string>;
  nextActions: string[];
  security: string;
}): string {
  return [
    `# ${report.title}`,
    "",
    `Generated at: ${report.generatedAt}`,
    `Labels: ${report.labels.join(", ")}`,
    "",
    "## Summary",
    "",
    `Sample: ${report.sample.name} (${report.sample.id})`,
    `Focused scope status: ${report.sample.implementationStatus}`,
    `Platform: ${report.platform}`,
    `Overall status: ${report.overallStatus}`,
    `Unity version: ${report.readinessSummary.unityVersion ?? "unknown"}`,
    `Device: ${report.device ?? "not recorded"}`,
    `Build output: ${report.buildOutputPath ?? "not recorded"}`,
    "",
    "## Observed Behavior",
    "",
    report.observedBehavior,
    "",
    "## Expected Behavior",
    "",
    report.expectedBehavior,
    "",
    "## Reproduction Steps",
    "",
    ...markdownNumberedList(report.reproductionSteps, "Run easyar_next_workflow_step for the focused sample, then follow the recommended call."),
    "",
    "## Step Results",
    "",
    ...markdownIssueList(
      report.stepSummary.map((step) => {
        const details = [
          `${step.name}: ${step.status}`,
          step.evidence ? `evidence=${step.evidence}` : null,
          step.nextAction ? `next=${step.nextAction}` : null
        ].filter(isNonEmptyString).join("; ");
        return details;
      }),
      "No explicit step results were provided."
    ),
    "",
    "## Current MCP Diagnostics",
    "",
    `Readiness ready: ${report.readinessSummary.ready ? "yes" : "no"}`,
    `Local config valid: ${report.configSummary.valid ? "yes" : "no"}`,
    `Local config check count: ${report.configSummary.checkCount}`,
    `Support overall ready: ${report.supportSummary.overallReady ? "yes" : "no"}`,
    `Ready for Unity validation: ${report.supportSummary.readyForUnityValidation ? "yes" : "no"}`,
    `Latest log issue count: ${report.supportSummary.logIssueCount}`,
    "",
    "### Failing Readiness Checks",
    "",
    ...markdownIssueList(
      report.readinessSummary.failingChecks.map((check) => `${check.severity} ${check.id}: ${check.detail} Next: ${check.action}`),
      "No failing readiness checks."
    ),
    "",
    "### Failing Local Config Checks",
    "",
    ...markdownIssueList(
      report.configSummary.failingChecks.map((check) => `${check.severity} ${check.id}: ${check.detail}`),
      "No failing local config checks."
    ),
    "",
    "## Generated Artifacts To Attach Or Reference",
    "",
    ...Object.entries(report.artifactPaths).map(([name, artifactPath]) => `- ${name}: ${artifactPath}`),
    "",
    "## Next Actions",
    "",
    ...markdownIssueList(report.nextActions, "No next actions recorded."),
    "",
    "## Security",
    "",
    report.security,
    ""
  ].join("\n");
}

function buildDeviceValidationChecklistMarkdown(checklist: Awaited<ReturnType<typeof buildDeviceValidationChecklist>>): string {
  return [
    `# EasyAR Device Validation - ${checklist.sample.name}`,
    "",
    `Generated at: ${checklist.generatedAt}`,
    `Project: ${checklist.projectPath}`,
    `Sample id: ${checklist.sample.id}`,
    `Status: ${checklist.sample.implementationStatus}`,
    `Platform: ${checklist.platform}`,
    `Device: ${checklist.device ?? "not recorded"}`,
    `Build output: ${checklist.buildOutputPath ?? "not recorded"}`,
    `Ready for device validation: ${checklist.readyForDeviceValidation ? "yes" : "no"}`,
    "",
    "## Preflight Summary",
    "",
    `Readiness ready: ${checklist.preflightSummary.readinessReady ? "yes" : "no"}`,
    `Import ready: ${checklist.preflightSummary.importReady ? "yes" : "no"}`,
    `Scene ready: ${checklist.preflightSummary.sceneReady ? "yes" : "no"}`,
    `Unity version: ${checklist.preflightSummary.unityVersion ?? "unknown"}`,
    "",
    "## Blockers",
    "",
    ...markdownIssueList(checklist.blockers.map((blocker) => `${blocker.id}: ${blocker.detail} Action: ${blocker.action}`), "No device validation blockers."),
    "",
    "## Device Test Steps",
    "",
    ...checklist.steps.flatMap((step, index) => [
      `${index + 1}. ${step.title}`,
      `   - Id: ${step.id}`,
      `   - Action: ${step.action}`,
      `   - Expected: ${step.expected}`
    ]),
    "",
    "## Pass Criteria",
    "",
    ...checklist.passCriteria.map((criterion) => `- ${criterion}`),
    "",
    "## Evidence To Capture",
    "",
    ...checklist.evidencePrompts.map((prompt) => `- ${prompt}`),
    "",
    "## Next Actions",
    "",
    ...checklist.nextActions.map((action) => `- ${action}`),
    "",
    "## Security",
    "",
    checklist.security,
    ""
  ].join("\n");
}

function buildDeviceRunResultFormMarkdown(form: Awaited<ReturnType<typeof buildDeviceRunResultForm>>): string {
  return [
    `# EasyAR Device Run Result Form - ${form.sample.name}`,
    "",
    `Generated at: ${form.generatedAt}`,
    `Project: ${form.projectPath}`,
    `Sample id: ${form.sample.id}`,
    `Status: ${form.sample.implementationStatus}`,
    `Platform: ${form.platform}`,
    `Device: ${form.device ?? "not recorded"}`,
    `Build output: ${form.buildOutputPath ?? "not recorded"}`,
    `Ready for device validation: ${form.readyForDeviceValidation ? "yes" : "no"}`,
    `Blocker count: ${form.blockerCount}`,
    "",
    "## Completion Acceptance Rules",
    "",
    ...form.completionAcceptanceRules.map((rule) => `- ${rule}`),
    "",
    "## Fillable Step Evidence",
    "",
    ...form.formSteps.flatMap((step, index) => [
      `${index + 1}. ${step.name}`,
      `   - Required for completion: ${step.requiredForCompletion ? "yes" : "no"}`,
      `   - Status: ${step.status}`,
      `   - Evidence: ${step.evidencePrompt}`,
      `   - Next action if not passed: ${step.nextActionPrompt}`
    ]),
    "",
    "## Pass Criteria",
    "",
    ...form.passCriteria.map((criterion) => `- ${criterion}`),
    "",
    "## Evidence To Capture",
    "",
    ...form.evidencePrompts.map((prompt) => `- ${prompt}`),
    "",
    "## Blockers",
    "",
    ...markdownIssueList(form.blockers.map((blocker) => `${blocker.id}: ${blocker.detail} Action: ${blocker.action}`), "No device validation blockers."),
    "",
    "## Safe Draft easyar_write_run_result Arguments",
    "",
    "Use this for blocked, failed, or incomplete attempts. Replace placeholders with observed evidence.",
    "",
    "```json",
    JSON.stringify(form.safeDraftRunResultArguments, null, 2),
    "```",
    "",
    "## Passed easyar_write_run_result Template",
    "",
    "Use this only after all required steps pass on a physical device.",
    "",
    "```json",
    JSON.stringify(form.passedRunResultTemplate, null, 2),
    "```",
    "",
    "## Next Actions",
    "",
    ...markdownIssueList(form.nextActions, "No next actions recorded."),
    "",
    "## Security",
    "",
    form.security,
    ""
  ].join("\n");
}

function buildProgrammingContextMarkdown(context: Awaited<ReturnType<typeof buildProgrammingContext>>): string {
  return [
    `# EasyAR Programming Context - ${context.sample.name}`,
    "",
    `Generated at: ${context.generatedAt}`,
    `Project: ${context.projectPath}`,
    `Sample id: ${context.sample.id}`,
    `Status: ${context.sample.implementationStatus}`,
    `Goal: ${context.goal ?? "not provided"}`,
    "",
    "## Script Inventory",
    "",
    `Total scripts: ${context.scriptInventory.totalScripts}`,
    `EasyAR-related scripts: ${context.scriptInventory.easyarScripts.length}`,
    `MonoBehaviours: ${context.scriptInventory.monoBehaviours.length}`,
    `Generated helpers: ${context.scriptInventory.generatedHelpers.length}`,
    "",
    "### EasyAR-Related Scripts",
    "",
    ...markdownIssueList(context.scriptInventory.easyarScripts.map((script) => `${script.path} (${script.lineCount} lines)`), "No non-generated EasyAR-related scripts were found."),
    "",
    "### MonoBehaviours",
    "",
    ...markdownIssueList(context.scriptInventory.monoBehaviours.map((script) => `${script.path} (${script.lineCount} lines)`), "No non-generated MonoBehaviour scripts were found."),
    "",
    "### Generated Helpers",
    "",
    ...markdownIssueList(context.scriptInventory.generatedHelpers.map((script) => script.path), "No generated EasyAR helper scripts were found."),
    "",
    "## Readiness Summary",
    "",
    `Ready: ${context.readinessSummary.ready ? "yes" : "no"}`,
    ...markdownIssueList(context.readinessSummary.failingChecks, "No failing readiness checks."),
    "",
    "## Script Review",
    "",
    `Reviewed files: ${context.scriptReview.reviewedFileCount}`,
    `Issue count: ${context.scriptReview.issueCount}`,
    ...markdownIssueList(context.scriptReview.issues.map((issue) => `${issue.severity} ${issue.file}${issue.line ? `:${issue.line}` : ""} - ${issue.title}`), "No static script issues detected."),
    "",
    "## Recommended Workflow",
    "",
    ...context.recommendedWorkflow.map((step) => `- ${step}`),
    "",
    "## Suggested Template",
    "",
    `Tool: ${context.suggestedTemplate.tool}`,
    `Arguments: ${JSON.stringify(context.suggestedTemplate.arguments)}`,
    "",
    "## Related Artifacts",
    "",
    ...Object.entries(context.relatedArtifacts).map(([name, relativePath]) => `- ${name}: ${relativePath}`),
    "",
    "## Next Actions",
    "",
    ...context.nextActions.map((action) => `- ${action}`),
    "",
    "## Security",
    "",
    context.security,
    ""
  ].join("\n");
}

function buildConfigIntegrationAuditMarkdown(audit: Awaited<ReturnType<typeof buildConfigIntegrationAudit>>): string {
  return [
    `# EasyAR Config Integration Audit - ${audit.sample.name}`,
    "",
    `Generated at: ${audit.generatedAt}`,
    `Project: ${audit.projectPath}`,
    `Sample id: ${audit.sample.id}`,
    `Status: ${audit.sample.implementationStatus}`,
    `Ready for config integration: ${audit.readyForConfigIntegration ? "yes" : "no"}`,
    "",
    "## Local Config",
    "",
    `Path: ${audit.localConfig.configPath}`,
    `Valid: ${audit.localConfig.valid ? "yes" : "no"}`,
    `Failed checks: ${audit.localConfig.failedChecks.length > 0 ? audit.localConfig.failedChecks.join(", ") : "none"}`,
    "",
    "## Readiness",
    "",
    `Ready: ${audit.readinessSummary.ready ? "yes" : "no"}`,
    `Failing checks: ${audit.readinessSummary.failingChecks.length > 0 ? audit.readinessSummary.failingChecks.join(", ") : "none"}`,
    "",
    "## Detected Capabilities",
    "",
    `Needs Cloud Recognition: ${audit.detectedCapabilities.needsCloudRecognition ? "yes" : "no"}`,
    `Local config reader found: ${audit.detectedCapabilities.hasLocalConfigReader ? "yes" : "no"}`,
    `License consumer found: ${audit.detectedCapabilities.hasLicenseConsumer ? "yes" : "no"}`,
    `Cloud credential consumer found: ${audit.detectedCapabilities.hasCloudConsumer ? "yes" : "no"}`,
    "",
    "## Scan Summary",
    "",
    `Script files scanned: ${audit.scanSummary.scriptFilesScanned}`,
    `Asset files scanned: ${audit.scanSummary.assetFilesScanned}`,
    `Consumer candidates: ${audit.scanSummary.consumerCandidateCount}`,
    `Generated helpers: ${audit.scanSummary.generatedHelperCount}`,
    "",
    "## Consumer Candidates",
    "",
    ...markdownConfigConsumerCandidates(audit.consumerCandidates),
    "",
    "## Blockers",
    "",
    ...markdownIssueList(audit.blockers.map((blocker) => `${blocker.id}: ${blocker.detail} Action: ${blocker.action}`), "No config integration blockers."),
    "",
    "## Next Actions",
    "",
    ...audit.nextActions.map((action) => `- ${action}`),
    "",
    "## Security",
    "",
    audit.security,
    ""
  ].join("\n");
}

function markdownConfigConsumerCandidates(candidates: Awaited<ReturnType<typeof buildConfigIntegrationAudit>>["consumerCandidates"]): string[] {
  if (candidates.length === 0) {
    return ["No config consumer candidates found."];
  }
  return candidates.flatMap((candidate) => [
    `### ${candidate.path}`,
    "",
    `Kind: ${candidate.kind}`,
    `Generated: ${candidate.generated ? "yes" : "no"}`,
    `Signals: ${candidate.signals.join(", ")}`,
    "Snippets:",
    ...markdownIssueList(candidate.redactedSnippets, "No matching snippets captured."),
    ""
  ]);
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
    "## Verification Calls",
    "",
    ...plan.verificationCalls.flatMap((call) => [
      `- Tool: \`${call.tool}\``,
      `  Arguments: \`${JSON.stringify(call.arguments)}\``,
      `  Purpose: ${call.purpose}`
    ]),
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

function buildCodeChangeSummaryMarkdown(summary: Awaited<ReturnType<typeof buildCodeChangeSummary>>): string {
  return [
    `# EasyAR Focused Code Change - ${summary.sample.name}`,
    "",
    `Generated at: ${summary.generatedAt}`,
    `Project: ${summary.projectPath}`,
    `Sample id: ${summary.sample.id}`,
    `Status: ${summary.sample.implementationStatus}`,
    "",
    "## Goal",
    "",
    summary.goal,
    "",
    "## Notes",
    "",
    summary.notes ?? "No notes recorded.",
    "",
    "## Target Files",
    "",
    ...summary.fileSummaries.flatMap((file) => [
      `- ${file.path}`,
      `  - Exists: ${file.exists ? "yes" : "no"}`,
      `  - Size bytes: ${file.sizeBytes ?? "unknown"}`,
      `  - Lines: ${file.lineCount ?? "unknown"}`,
      `  - Mentions EasyAR: ${file.mentionsEasyAR ? "yes" : "no"}`,
      `  - MonoBehaviour: ${file.mentionsMonoBehaviour ? "yes" : "no"}`
    ]),
    "",
    "## Static Review",
    "",
    `Reviewed files: ${summary.scriptReview.reviewedFileCount}`,
    `Issue count: ${summary.scriptReview.issueCount}`,
    ...markdownIssueList(summary.scriptReview.issues.map((issue) => `${issue.severity} ${issue.id} ${issue.file}${issue.line ? `:${issue.line}` : ""} - ${issue.title}`), "No static script issues detected."),
    "",
    "## Next Actions",
    "",
    ...summary.nextActions.map((action) => `- ${action}`),
    "",
    "## Security",
    "",
    summary.security,
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

function buildDeploymentReadinessMarkdown(report: DeploymentReadinessReport): string {
  return [
    "# mcp-easyar Deployment Readiness",
    "",
    `Generated at: ${report.generatedAt}`,
    `Ready: ${report.ready ? "yes" : "no"}`,
    `Server: ${report.server.name} ${report.server.version}`,
    `Package: ${report.server.packageName ?? "unknown"}`,
    `Repository: ${report.server.repository ?? "unknown"}`,
    `Bin: ${report.server.binName ?? "unknown"} -> ${report.server.binPath ?? "unknown"}`,
    `Package files: ${report.server.packageFiles.length > 0 ? report.server.packageFiles.join(", ") : "unknown"}`,
    "",
    "## Focused Scope",
    "",
    `Focused samples: ${report.focusedScope.focusedSamples.join(", ")}`,
    `Deferred samples: ${report.focusedScope.deferredSamples.join(", ")}`,
    "",
    "## Blockers",
    "",
    ...markdownCheckList(report.blockers, "No deployment blockers."),
    "",
    "## Warnings",
    "",
    ...markdownCheckList(report.warnings, "No deployment warnings."),
    "",
    "## Groups",
    "",
    ...Object.entries(report.groups).flatMap(([groupName, checks]) => [
      `### ${groupName}`,
      "",
      ...checks.map((item) => `- ${item.ok ? "OK" : "MISSING"} [${item.severity}] ${item.id}: ${item.detail}`),
      ""
    ]),
    "## Unity",
    "",
    `Project: ${report.project.path ?? "not provided"}`,
    `Unity version: ${report.project.unityVersion ?? "unknown"}`,
    `Unity command/path: ${report.unity.pathCommand}`,
    `Unity executable exists: ${report.unity.executableExists === null ? "not checked" : report.unity.executableExists ? "yes" : "no"}`,
    "",
    "## Authorization",
    "",
    `API base URL: ${report.auth.apiBaseUrl}`,
    `Token configured: ${report.auth.hasToken ? "yes" : "no"}`,
    `Account status endpoint: ${report.auth.accountStatusEndpointConfigured ? "yes" : "no"}`,
    `License validation endpoint: ${report.auth.licenseValidationEndpointConfigured ? "yes" : "no"}`,
    `Downloads endpoint: ${report.auth.downloadsEndpointConfigured ? "yes" : "no"}`,
    `Cloud credentials endpoint: ${report.auth.cloudCredentialsEndpointConfigured ? "yes" : "no"}`,
    "",
    "## Next Actions",
    "",
    ...report.nextActions.map((action) => `- ${action}`),
    "",
    "## Security",
    "",
    ...report.security.map((item) => `- ${item}`),
    ""
  ].join("\n");
}

function buildUnityEnvironmentMarkdown(report: Awaited<ReturnType<typeof buildUnityEnvironmentReport>>): string {
  return [
    "# EasyAR Unity Environment",
    "",
    `Generated at: ${report.generatedAt}`,
    `Project: ${report.projectPath ?? "not provided"}`,
    `Sample: ${report.sample ? `${report.sample.name} (${report.sample.id})` : "not provided"}`,
    `Unity project version: ${report.unityVersion ?? "unknown"}`,
    `Ready for Unity batch: ${report.readyForUnityBatch ? "yes" : "no"}`,
    "",
    "## Current Configuration",
    "",
    `EASYAR_UNITY_PATH: ${report.configuredPath ?? "not set"}`,
    `Configured path exists: ${report.configuredExists ? "yes" : "no"}`,
    `PATH command fallback: ${report.pathCommand}`,
    `Recommended Unity path: ${report.recommendedUnityPath ?? "not found"}`,
    `Recommended path matches project version: ${report.recommendedVersionMatchesProject === null ? "unknown" : report.recommendedVersionMatchesProject ? "yes" : "no"}`,
    `Matching project version executable found: ${report.matchingProjectVersionCandidateExists === null ? "unknown" : report.matchingProjectVersionCandidateExists ? "yes" : "no"}`,
    "",
    "## Candidates",
    "",
    ...markdownIssueList(report.candidates.map((candidate) => `${candidate.exists ? "OK" : "MISSING"} ${candidate.path}`), "No Unity executable candidates were found."),
    "",
    "## MCP Client Environment",
    "",
    `Variable: ${report.environment.variable}`,
    `Candidate dirs variable: ${report.environment.candidateDirsVariable}`,
    `Export command: ${report.environment.exportCommand}`,
    `Client config hint: ${report.environment.clientConfigHint}`,
    "",
    "## Dry Run",
    "",
    report.dryRunCompileCommand,
    "",
    "## Next Actions",
    "",
    ...report.nextActions.map((action) => `- ${action}`),
    "",
    "## Security",
    "",
    report.security,
    ""
  ].join("\n");
}

function buildProductionValidationMarkdown(report: Awaited<ReturnType<typeof buildProductionValidationReport>>): string {
  return [
    "# mcp-easyar Production Validation",
    "",
    `Generated at: ${report.generatedAt}`,
    `Production ready: ${report.productionReady ? "yes" : "no"}`,
    `Project: ${report.projectPath ?? "not provided"}`,
    `Platform: ${report.platform}`,
    `Verification evidence: ${report.verificationEvidence}`,
    "",
    "## Server",
    "",
    `Name: ${report.server.name}`,
    `Version: ${report.server.version}`,
    `Package: ${report.server.packageName ?? "unknown"}`,
    `Repository: ${report.server.repository ?? "unknown"}`,
    "",
    "## Scope",
    "",
    `Focused samples: ${report.scope.focusedSamples.join(", ")}`,
    `Deferred samples: ${report.scope.deferredSamples.join(", ")}`,
    report.scope.note,
    "",
    "## Gates",
    "",
    ...report.gates.flatMap((gate) => [
      `### ${gate.title}`,
      "",
      `Gate id: ${gate.id}`,
      `Status: ${gate.status}`,
      `Required: ${gate.required ? "yes" : "no"}`,
      `Required evidence: ${gate.requiredEvidence}`,
      `Current evidence: ${gate.currentEvidence}`,
      `Next action: ${gate.nextAction}`,
      ""
    ]),
    "## Summary",
    "",
    `Deployment ready: ${report.summaries.deploymentReady ? "yes" : "no"}`,
    `Deployment blocker count: ${report.summaries.deploymentBlockerCount}`,
    `Release manifest ready: ${report.summaries.releaseManifestReady ? "yes" : "no"}`,
    `Official API contract ready: ${report.summaries.officialContractReady ? "yes" : "no"}`,
    "",
    "### Official Access",
    "",
    ...markdownIssueList(
      report.summaries.officialAccess.map((item) => `${item.sampleId}: ready=${item.readyForOfficialContent ? "yes" : "no"}, blockers=${item.blockerCount}`),
      "Official access was not checked because no projectPath was provided."
    ),
    "",
    "### Focused Scope",
    "",
    ...(report.summaries.focusedScope
      ? [
          `All focused samples complete: ${report.summaries.focusedScope.allFocusedSamplesComplete ? "yes" : "no"}`,
          `Completed: ${report.summaries.focusedScope.completedCount}`,
          `Blocked: ${report.summaries.focusedScope.blockedCount}`,
          `Failed: ${report.summaries.focusedScope.failedCount}`,
          `Not run: ${report.summaries.focusedScope.notRunCount}`
        ]
      : ["Focused scope status was not generated because no projectPath was provided."]),
    "",
    "## Required Artifacts",
    "",
    ...report.requiredArtifacts.map((artifact) => `- ${artifact}`),
    "",
    "## Blockers",
    "",
    ...markdownIssueList(report.blockers.map((blocker) => `${blocker.id}: ${blocker.currentEvidence} Action: ${blocker.nextAction}`), "No production validation blockers."),
    "",
    "## Next Actions",
    "",
    ...markdownIssueList(report.nextActions, "No next actions recorded."),
    "",
    "## Security",
    "",
    report.security,
    ""
  ].join("\n");
}

function buildAccountOnboardingMarkdown(report: Awaited<ReturnType<typeof buildAccountOnboardingReport>>): string {
  return [
    "# EasyAR Account Onboarding",
    "",
    `Generated at: ${report.generatedAt}`,
    `Stage: ${report.stage}`,
    `Requested stage: ${report.requestedStage}`,
    `Project: ${report.projectPath ?? "not provided"}`,
    `Sample: ${report.sample.name} (${report.sample.id})`,
    `Platform: ${report.platform}`,
    `Needs Cloud Recognition: ${report.needsCloudRecognition ? "yes" : "no"}`,
    "",
    "## Official Links",
    "",
    `- EasyAR website: ${report.officialLinks.website}`,
    `- Register/login entry: ${report.officialLinks.registerAndLogin}`,
    `- Development center: ${report.officialLinks.developCenter}`,
    `- Getting started docs: ${report.officialLinks.docsGettingStarted}`,
    `- API Key docs: ${report.officialLinks.apiKeyDocs}`,
    `- Official downloads page: ${report.officialLinks.downloadsPage}`,
    `- Downloads: ${report.officialLinks.downloads}`,
    `- Samples docs: ${report.officialLinks.samples}`,
    "",
    "## First Run Guide",
    "",
    `Entry question: ${report.firstRunGuide.entryQuestion}`,
    `Design principle: ${report.firstRunGuide.designPrinciple}`,
    "",
    "### Stage Model",
    "",
    ...report.firstRunGuide.stageModel.flatMap((item) => [
      `- ${item.stage}: ${item.userSituation}`,
      `  MCP behavior: ${item.mcpBehavior}`
    ]),
    "",
    ...report.firstRunGuide.routes.flatMap((route) => [
      `### ${route.active ? "[NEXT] " : ""}${route.answer}`,
      "",
      `Route id: ${route.id}`,
      `Guide: ${route.guide}`,
      "Browser actions:",
      ...route.browserActions.map((action) => `- ${action}`),
      `Return prompt: ${route.returnPrompt}`,
      "MCP after user returns:",
      ...route.mcpAfterUserReturns.map((call) => `- ${call}`),
      ""
    ]),
    "### MCP Conversation Rules",
    "",
    ...report.firstRunGuide.mcpConversationRules.map((item) => `- ${item}`),
    "",
    "### What The User Provides To MCP",
    "",
    ...report.firstRunGuide.userProvidesToMcp.map((item) => `- ${item}`),
    "",
    "### What The User Never Provides To MCP",
    "",
    ...report.firstRunGuide.userNeverProvidesToMcp.map((item) => `- ${item}`),
    "",
    "### Local Secret Handoff",
    "",
    ...report.firstRunGuide.localSecretHandoff.map((item) => `- ${item}`),
    "",
    "### Sample Specific Notes",
    "",
    ...report.firstRunGuide.sampleSpecific.map((item) => `- ${item}`),
    "",
    "## Human Steps",
    "",
    ...report.humanSteps.flatMap((step, index) => [
      `${index + 1}. ${step.active ? "[NEXT] " : ""}${step.title}`,
      `   Action: ${step.action}`,
      `   Done when: ${step.doneWhen}`
    ]),
    "",
    "## MCP Steps",
    "",
    ...report.mcpSteps.flatMap((step, index) => [
      `${index + 1}. ${step.tool}`,
      `   Arguments: ${JSON.stringify(step.arguments)}`,
      `   Purpose: ${step.purpose}`
    ]),
    "",
    "## Local Files",
    "",
    `Local config: ${report.localFiles.localConfig ?? "not available until projectPath is provided"}`,
    `Local config exists: ${report.localFiles.localConfigExists === null ? "unknown" : report.localFiles.localConfigExists ? "yes" : "no"}`,
    `Local config valid: ${report.localFiles.localConfigValid === null ? "unknown" : report.localFiles.localConfigValid ? "yes" : "no"}`,
    `Bundle/package identifier: ${report.localFiles.bundleIdentifier}`,
    ...(report.localFiles.cloudCredentialPresence
      ? [
          `Cloud appId present: ${report.localFiles.cloudCredentialPresence.appId ? "yes" : "no"}`,
          `Cloud appKey present: ${report.localFiles.cloudCredentialPresence.appKey ? "yes" : "no"}`,
          `Cloud appSecret present: ${report.localFiles.cloudCredentialPresence.appSecret ? "yes" : "no"}`
        ]
      : []),
    "",
    "## Environment",
    "",
    `API base URL: ${report.environment.apiBaseUrl}`,
    `API token configured: ${report.environment.apiTokenConfigured ? "yes" : "no"}`,
    `Account endpoint configured: ${report.environment.accountStatusEndpointConfigured ? "yes" : "no"}`,
    `License endpoint configured: ${report.environment.licenseValidationEndpointConfigured ? "yes" : "no"}`,
    `Downloads endpoint configured: ${report.environment.downloadsEndpointConfigured ? "yes" : "no"}`,
    `Cloud credentials endpoint configured: ${report.environment.cloudCredentialsEndpointConfigured ? "yes" : "no"}`,
    "",
    "## Blockers",
    "",
    ...markdownIssueList(report.blockers.map((blocker) => `${blocker.id}: ${blocker.detail} Action: ${blocker.action}`), "No account onboarding blockers."),
    "",
    "## Next Actions",
    "",
    ...markdownIssueList(report.nextActions, "No next actions recorded."),
    "",
    "## Security",
    "",
    ...report.security.map((item) => `- ${item}`),
    ""
  ].join("\n");
}

function buildAccountMaterialsMarkdown(report: Awaited<ReturnType<typeof buildAccountMaterialsReport>>): string {
  return [
    "# EasyAR Account Materials",
    "",
    `Generated at: ${report.generatedAt}`,
    `Project: ${report.projectPath ?? "not provided"}`,
    `Sample: ${report.sample.name} (${report.sample.id})`,
    `Platform: ${report.platform}`,
    `Local config: ${report.localConfigPath}`,
    `Needs Cloud Recognition: ${report.needsCloudRecognition ? "yes" : "no"}`,
    `Ready for local config validation: ${report.readyForLocalConfigValidation ? "yes" : "no"}`,
    "",
    "## Materials",
    "",
    ...report.materials.flatMap((item) => [
      `### ${item.label}`,
      "",
      `Required: ${item.required ? "yes" : "no"}`,
      `Present: ${item.present ? "yes" : "no"}`,
      `Source: ${item.source}`,
      `Store in: ${item.storeIn}`,
      `Share policy: ${item.sharePolicy}`,
      `MCP check: ${item.mcpCheck}`,
      ""
    ]),
    "## Missing Required",
    "",
    ...markdownIssueList(report.missingRequired, "No required account materials are missing."),
    "",
    "## Next Actions",
    "",
    ...markdownIssueList(report.nextActions, "No next actions recorded."),
    "",
    "## Security",
    "",
    report.security,
    ""
  ].join("\n");
}

function buildLocalConfigFormMarkdown(form: Awaited<ReturnType<typeof buildLocalConfigForm>>): string {
  return [
    "# EasyAR Local Config Form",
    "",
    `Generated at: ${form.generatedAt}`,
    `Project: ${form.projectPath}`,
    `Sample: ${form.sample.name} (${form.sample.id})`,
    `Platform: ${form.platform}`,
    `Account stage: ${form.accountStage}`,
    `Config path: ${form.configPath}`,
    `Example path: ${form.examplePath}`,
    `Local config exists: ${form.localConfig.exists ? "yes" : "no"}`,
    `Local config valid: ${form.localConfig.valid ? "yes" : "no"}`,
    `Ready to validate: ${form.readyToValidate ? "yes" : "no"}`,
    "",
    "## Fields To Fill Locally",
    "",
    ...form.fields.flatMap((field) => [
      `### ${field.label}`,
      "",
      `JSON path: ${field.jsonPath}`,
      `Required for this sample: ${field.required ? "yes" : "no"}`,
      `Present now: ${field.present ? "yes" : "no"}`,
      `Source: ${field.source}`,
      `Env alternative: ${field.envNames.length > 0 ? field.envNames.join(" or ") : "none"}`,
      `Placeholder: ${field.placeholder === "" ? "(leave empty)" : field.placeholder}`,
      `Share policy: ${field.sharePolicy}`,
      `Action: ${field.userAction}`,
      ""
    ]),
    "## Missing Required Fields",
    "",
    ...markdownIssueList(form.missingRequiredFields, "No required fields are missing."),
    "",
    "## JSON Skeleton",
    "",
    "Copy the example file to easyar.local.json, then use this shape locally. Replace placeholders outside chat.",
    "",
    "```json",
    JSON.stringify(form.jsonSkeleton, null, 2),
    "```",
    "",
    "## Environment-Backed Write",
    "",
    `Tool: ${form.envBackedWrite.tool}`,
    `Arguments: ${JSON.stringify(form.envBackedWrite.arguments)}`,
    "",
    "Required env names:",
    ...Array.from(new Set(form.envBackedWrite.requiredEnvNames)).map((name) => `- ${name}`),
    "",
    "## Validation Chain",
    "",
    ...form.validationChain.map((call, index) => `${index + 1}. ${call}`),
    "",
    "## Failed Current Checks",
    "",
    ...markdownIssueList(form.localConfig.failedChecks, "No current local config checks are failing."),
    "",
    "## Next Actions",
    "",
    ...markdownIssueList(form.nextActions, "No next actions recorded."),
    "",
    "## Security",
    "",
    form.security,
    ""
  ].join("\n");
}

function buildLocalConfigHandoffMarkdown(report: Awaited<ReturnType<typeof buildLocalConfigHandoffReport>>): string {
  return [
    "# EasyAR Local Config Handoff",
    "",
    `Generated at: ${report.generatedAt}`,
    `Project: ${report.projectPath}`,
    `Sample: ${report.sample.name} (${report.sample.id})`,
    `Platform: ${report.platform}`,
    `Requested account stage: ${report.account.requestedStage}`,
    `Derived account stage: ${report.account.stage}`,
    "",
    "## Official Browser Handoff",
    "",
    `- EasyAR website: ${report.account.officialLinks.website}`,
    `- Register/login entry: ${report.account.officialLinks.registerAndLogin}`,
    `- Development center: ${report.account.officialLinks.developCenter}`,
    "",
    "A first-time user may not have an EasyAR account yet. Start with the browser flow, then return here and continue with local config validation.",
    "",
    "## First Run Routes",
    "",
    ...report.account.firstRunGuide.routes.flatMap((route) => [
      `### ${route.active ? "[NEXT] " : ""}${route.answer}`,
      "",
      `Guide: ${route.guide}`,
      ...route.browserActions.map((action) => `- ${action}`),
      `Return prompt: ${route.returnPrompt}`,
      ""
    ]),
    "## Account Materials",
    "",
    `Ready for local config validation: ${report.accountMaterials.readyForLocalConfigValidation ? "yes" : "no"}`,
    "",
    ...report.accountMaterials.materials.flatMap((item) => [
      `### ${item.label}`,
      "",
      `Required: ${item.required ? "yes" : "no"}`,
      `Present: ${item.present ? "yes" : "no"}`,
      `Source: ${item.source}`,
      `Store in: ${item.storeIn}`,
      `Share policy: ${item.sharePolicy}`,
      ""
    ]),
    "Missing required materials:",
    ...markdownIssueList(report.accountMaterials.missingRequired, "No required account materials are missing."),
    "",
    "## Local Config",
    "",
    `Config path: ${report.localConfig.path}`,
    `Example path: ${report.localConfig.examplePath}`,
    `Exists: ${report.localConfig.exists ? "yes" : "no"}`,
    `Valid: ${report.localConfig.valid ? "yes" : "no"}`,
    "",
    "Failed checks:",
    ...markdownIssueList(report.localConfig.failedChecks, "No failed local config checks."),
    "",
    "## Manual File Steps",
    "",
    ...report.manualFileSteps.map((step, index) => `${index + 1}. ${step}`),
    "",
    "## Environment-Backed Write",
    "",
    `Tool: ${report.envBackedWrite.command}`,
    `Arguments: ${JSON.stringify(report.envBackedWrite.arguments)}`,
    "",
    "Required env names:",
    ...Array.from(new Set(report.envBackedWrite.requiredEnv)).map((name) => `- ${name}`),
    "",
    "Current env presence:",
    ...report.envPresence.map((item) => `- ${item.field}: ${item.present ? "present" : "missing"} (${item.envNames.join(" or ")}) - ${item.note}`),
    "",
    "## Validation Chain",
    "",
    ...report.validationChain.map((call, index) => `${index + 1}. ${call}`),
    "",
    "## Sample Notes",
    "",
    ...report.sampleSpecific.map((item) => `- ${item}`),
    "",
    "## Next Actions",
    "",
    ...report.nextActions.map((action) => `- ${action}`),
    "",
    "## Security",
    "",
    report.security,
    ""
  ].join("\n");
}

function buildOfficialAccessMarkdown(report: Awaited<ReturnType<typeof buildOfficialAccessReport>>): string {
  return [
    `# EasyAR Official Access - ${report.sample.name}`,
    "",
    `Generated at: ${report.generatedAt}`,
    `Project: ${report.projectPath}`,
    `Sample id: ${report.sample.id}`,
    `Status: ${report.sample.implementationStatus}`,
    `Platform: ${report.platform}`,
    `Package kind: ${report.packageKind}`,
    `Unity version: ${report.unityVersion ?? "unknown"}`,
    `Ready for official content: ${report.readyForOfficialContent ? "yes" : "no"}`,
    "",
    "## Input Metadata",
    "",
    `License key present: ${report.input.hasLicenseKey ? "yes" : "no"}`,
    `Bundle identifier: ${report.input.bundleIdentifier ?? "not configured"}`,
    "",
    "## Endpoint Configuration",
    "",
    `API base URL: ${report.auth.apiBaseUrl}`,
    `Token configured: ${report.auth.hasToken ? "yes" : "no"}`,
    `Account endpoint: ${report.auth.accountStatusEndpointConfigured ? "yes" : "no"}`,
    `License endpoint: ${report.auth.licenseValidationEndpointConfigured ? "yes" : "no"}`,
    `Downloads endpoint: ${report.auth.downloadsEndpointConfigured ? "yes" : "no"}`,
    `Cloud credentials endpoint: ${report.auth.cloudCredentialsEndpointConfigured ? "yes" : "no"}`,
    "",
    "## Checks",
    "",
    ...report.checks.flatMap((check) => [
      `- ${check.ok ? "OK" : "BLOCKED"} ${check.required ? "[required]" : "[optional]"} ${check.id}`,
      `  Summary: ${check.summary}`,
      `  Detail: ${check.detail}`,
      `  Status code: ${check.statusCode ?? "none"}`
    ]),
    "",
    "## Blockers",
    "",
    ...markdownIssueList(report.blockers.map((blocker) => `${blocker.id}: ${blocker.summary}`), "No official access blockers."),
    "",
    "## Next Actions",
    "",
    ...report.nextActions.map((action) => `- ${action}`),
    "",
    "## Security",
    "",
    report.security,
    ""
  ].join("\n");
}

function buildOfficialApiContractMarkdown(contract: ReturnType<typeof buildOfficialApiContract>): string {
  return [
    "# mcp-easyar Official API Contract",
    "",
    `Generated at: ${contract.generatedAt}`,
    `Server: ${contract.server.name} ${contract.server.version}`,
    `Ready for production official access: ${contract.readyForProductionOfficialAccess ? "yes" : "no"}`,
    "",
    "## Purpose",
    "",
    contract.server.purpose,
    "",
    "## Environment",
    "",
    `Base URL: ${contract.environment.baseUrl}`,
    `Token env: ${contract.environment.tokenEnvName}`,
    `Token configured now: ${contract.environment.tokenConfigured ? "yes" : "no"}`,
    "",
    "### Required Variables",
    "",
    ...contract.environment.required.map((name) => `- ${name}`),
    "",
    "### Current Configuration",
    "",
    ...Object.entries(contract.environment.configured).map(([name, configured]) => `- ${name}: ${configured ? "yes" : "no"}`),
    "",
    "## Authentication",
    "",
    `Scheme: ${contract.authentication.scheme}`,
    `Header: \`${contract.authentication.header}\``,
    `Token source: ${contract.authentication.tokenSource}`,
    "",
    ...contract.authentication.tokenPolicy.map((policy) => `- ${policy}`),
    "",
    "## Endpoints",
    "",
    ...contract.endpoints.flatMap((endpoint) => [
      `### ${endpoint.id}`,
      "",
      `Env: ${endpoint.envName}`,
      `Configured now: ${endpoint.configured ? "yes" : "no"}`,
      `Method: ${endpoint.method}`,
      `Path: ${endpoint.path}`,
      `Expected URL: ${endpoint.expectedUrl}`,
      `Timeout ms: ${endpoint.timeoutMs}`,
      `Authorization: ${endpoint.authorization}`,
      "",
      endpoint.purpose,
      "",
      "Request fields:",
      ...markdownIssueList(endpoint.requestFields, "No request body fields."),
      "",
      "Required response fields:",
      ...endpoint.requiredResponseFields.map((field) => `- ${field}`),
      "",
      "Optional response fields:",
      ...markdownIssueList(endpoint.optionalResponseFields, "No optional response fields listed."),
      "",
      "Used by MCP tools:",
      ...endpoint.usedByTools.map((tool) => `- ${tool}`),
      "",
      `Secret handling: ${endpoint.secretHandling}`,
      ""
    ]),
    "## Examples",
    "",
    ...(contract.examples.length > 0
      ? contract.examples.flatMap((example) => [
          `### ${example.endpoint}`,
          "",
          "```json",
          JSON.stringify(example, null, 2),
          "```",
          ""
        ])
      : ["Examples omitted."]),
    "## Response Policy",
    "",
    ...contract.responsePolicy.map((policy) => `- ${policy}`),
    "",
    "## Production Checklist",
    "",
    ...contract.productionChecklist.map((item) => `- ${item}`),
    "",
    "## Security",
    "",
    contract.security,
    ""
  ].join("\n");
}

function buildOfficialApiHandoffMarkdown(handoff: ReturnType<typeof buildOfficialApiHandoff>): string {
  return [
    "# mcp-easyar Official API Handoff",
    "",
    `Generated at: ${handoff.generatedAt}`,
    `Deployment target: ${handoff.deploymentTarget}`,
    `Server: ${handoff.server.name} ${handoff.server.version}`,
    `Repository: ${handoff.server.repository}`,
    "",
    "## Purpose",
    "",
    "This handoff is for EasyAR backend and operations teams connecting mcp-easyar to authorized registered-user account, license, downloads, and Cloud Recognition services.",
    "",
    "## Environment",
    "",
    `Base URL: ${handoff.environment.baseUrl}`,
    `Token env: ${handoff.environment.tokenEnvName}`,
    `Token configured now: ${handoff.environment.tokenConfigured ? "yes" : "no"}`,
    "",
    "Required variables:",
    ...handoff.environment.required.map((name) => `- ${name}`),
    "",
    "Current configuration:",
    ...Object.entries(handoff.environment.configured).map(([name, configured]) => `- ${name}: ${configured ? "yes" : "no"}`),
    "",
    "## Endpoint Mapping",
    "",
    ...handoff.endpointMapping.flatMap((endpoint) => [
      `### ${endpoint.id}`,
      "",
      `Env: ${endpoint.envName}`,
      `Method: ${endpoint.method}`,
      `Expected URL: ${endpoint.expectedUrl}`,
      "",
      endpoint.purpose,
      "",
      `Backend owner todo: ${endpoint.backendOwnerTodo}`,
      "",
      "Request fields:",
      ...markdownIssueList(endpoint.requestFields, "No request body fields."),
      "",
      "Required response fields:",
      ...endpoint.requiredResponseFields.map((field) => `- ${field}`),
      "",
      "Used by MCP tools:",
      ...endpoint.usedByTools.map((tool) => `- ${tool}`),
      "",
      "Acceptance:",
      ...endpoint.acceptance.map((item) => `- ${item}`),
      "",
      ...(endpoint.canaryCommand
        ? [
            "Canary command template:",
            "```bash",
            endpoint.canaryCommand,
            "```",
            ""
          ]
        : [])
    ]),
    "## Rollout",
    "",
    ...handoff.rollout.map((item, index) => `${index + 1}. ${item}`),
    "",
    "## Acceptance Gates",
    "",
    ...handoff.acceptanceGates.map((item) => `- ${item}`),
    "",
    "## Failure Policy",
    "",
    ...handoff.failurePolicy.map((item) => `- ${item}`),
    "",
    "## Artifacts To Regenerate",
    "",
    ...handoff.artifactsToRegenerate.map((item) => `- ${item}`),
    "",
    "## Next Actions",
    "",
    ...handoff.nextActions.map((item) => `- ${item}`),
    "",
    "## Security",
    "",
    handoff.security,
    ""
  ].join("\n");
}

function buildClientSetupMarkdown(report: Awaited<ReturnType<typeof buildClientSetupReport>>): string {
  return [
    "# mcp-easyar Client Setup",
    "",
    `Generated at: ${report.generatedAt}`,
    `Client: ${report.client}`,
    `Entrypoint mode: ${report.entrypointMode}`,
    `Ready for client connection: ${report.readyForClientConnection ? "yes" : "no"}`,
    `Command: ${report.command}`,
    `Args: ${JSON.stringify(report.args)}`,
    `Server path: ${report.serverPath ?? "not required for this mode"}`,
    `Config destination: ${report.configDestination}`,
    "",
    "## Package",
    "",
    `Name: ${report.package.name ?? "unknown"}`,
    `Version: ${report.package.version ?? "unknown"}`,
    `Bin: ${report.package.binName ?? "unknown"}`,
    `Repository: ${report.package.repository ?? "unknown"}`,
    "",
    "## Checks",
    "",
    ...report.checks.map((check) => `- ${check.ok ? "OK" : "BLOCKED"} ${check.required ? "[required]" : "[recommended]"} ${check.id}: ${check.detail}`),
    "",
    "## Config",
    "",
    "```json",
    JSON.stringify(report.config, null, 2),
    "```",
    "",
    "## Environment",
    "",
    `API base URL: ${report.env.apiBaseUrl}`,
    `Token placeholder included: ${report.env.hasTokenPlaceholder ? "yes" : "no"}`,
    `Account endpoint configured in current env: ${report.env.accountStatusEndpointConfigured ? "yes" : "no"}`,
    `License endpoint configured in current env: ${report.env.licenseValidationEndpointConfigured ? "yes" : "no"}`,
    `Downloads endpoint configured in current env: ${report.env.downloadsEndpointConfigured ? "yes" : "no"}`,
    `Cloud credentials endpoint configured in current env: ${report.env.cloudCredentialsEndpointConfigured ? "yes" : "no"}`,
    "",
    "## Acceptance Checklist",
    "",
    ...report.acceptanceChecklist.map((item) => `- ${item}`),
    "",
    "## First Smoke Calls",
    "",
    ...report.firstSmokeCalls.map((call) => `- \`${call}\``),
    "",
    "## Troubleshooting",
    "",
    ...report.troubleshooting.map((item) => `- ${item}`),
    "",
    "## Next Actions",
    "",
    ...report.nextActions.map((action) => `- ${action}`),
    "",
    "## Security",
    "",
    report.security,
    ""
  ].join("\n");
}

function buildReleaseManifestMarkdown(manifest: Awaited<ReturnType<typeof buildReleaseManifest>>): string {
  return [
    "# mcp-easyar Release Manifest",
    "",
    `Generated at: ${manifest.generatedAt}`,
    `Package: ${manifest.package.name ?? "unknown"} ${manifest.package.version ?? "unknown"}`,
    `Bin: ${manifest.package.binName}`,
    `Node: ${manifest.package.node}`,
    `Repository: ${manifest.package.repository ?? "unknown"}`,
    `Ready for install docs: ${manifest.readyForInstallDocs ? "yes" : "no"}`,
    "",
    "## Focused Scope",
    "",
    `Focused samples: ${manifest.focusedScope.focusedSamples.join(", ")}`,
    `Deferred samples: ${manifest.focusedScope.deferredSamples.join(", ")}`,
    "",
    "## Install Commands",
    "",
    ...manifest.installCommands.map((command) => `- \`${command}\``),
    "",
    "## Install Profiles",
    "",
    ...manifest.installProfiles.flatMap((profile) => [
      `### ${profile.label}`,
      "",
      `Entrypoint mode: \`${profile.entrypointMode}\``,
      "",
      ...profile.commands.map((command) => `- \`${command}\``),
      `- Client config: \`${profile.clientConfigCall}\``,
      ""
    ]),
    "## MCP Entrypoints",
    "",
    ...manifest.mcpEntrypoints.map((entrypoint) => `- ${entrypoint.label}: \`${[entrypoint.command, ...entrypoint.args].join(" ")}\``),
    "",
    "## Verification Commands",
    "",
    ...manifest.verificationCommands.map((command) => `- \`${command}\``),
    "",
    "## First MCP Calls",
    "",
    ...manifest.firstCalls.map((call) => `- \`${call}\``),
    "",
    "## Client Setup Tools",
    "",
    ...manifest.clientSetupTools.map((tool) => `- \`${tool}\``),
    "",
    "## Required Environment",
    "",
    ...manifest.requiredEnvironment.map((name) => `- \`${name}\``),
    "",
    "## Required Files",
    "",
    ...manifest.files.map((file) => `- ${file.exists ? "OK" : "MISSING"} ${file.path}`),
    "",
    "## Package Files",
    "",
    ...manifest.packageFiles.map((file) => `- ${file}`),
    "",
    "## Scripts",
    "",
    ...Object.entries(manifest.scripts).map(([name, command]) => `- \`${name}\`: \`${command}\``),
    "",
    "## Next Actions",
    "",
    ...manifest.nextActions.map((action) => `- ${action}`),
    "",
    "## Security",
    "",
    manifest.security,
    ""
  ].join("\n");
}

function buildOnboardingMarkdown(report: Awaited<ReturnType<typeof buildOnboardingReport>>): string {
  return [
    `# EasyAR Onboarding - ${report.sample.name}`,
    "",
    `Generated at: ${report.generatedAt}`,
    `Project: ${report.projectPath}`,
    `Sample id: ${report.sample.id}`,
    `Client: ${report.client}`,
    `Platform: ${report.platform}`,
    `Output path: ${report.outputPath}`,
    `Ready for first run: ${report.readyForFirstRun ? "yes" : "no"}`,
    "",
    "## Summary",
    "",
    `Release ready: ${report.summary.releaseReady ? "yes" : "no"}`,
    `Client ready: ${report.summary.clientReady ? "yes" : "no"}`,
    `Official access ready: ${report.summary.officialAccessReady ? "yes" : "no"}`,
    `Workflow phase: ${report.summary.workflowPhase}`,
    `Workflow blocked: ${report.summary.workflowBlocked ? "yes" : "no"}`,
    `Focused samples: ${report.summary.focusedSamples.join(", ")}`,
    "",
    "## Blockers",
    "",
    ...markdownIssueList(report.blockers.map((blocker) => `${blocker.area}/${blocker.id}: ${blocker.detail}`), "No onboarding blockers."),
    "",
    "## Next Call",
    "",
    `Tool: \`${report.nextCall.tool}\``,
    `Arguments: \`${JSON.stringify(report.nextCall.arguments)}\``,
    "",
    "## First MCP Calls",
    "",
    ...report.firstCalls.map((call) => `- \`${call}\``),
    "",
    "## Client Setup",
    "",
    `Entrypoint mode: ${report.clientSetup.entrypointMode}`,
    `Command: ${report.clientSetup.command}`,
    `Args: ${report.clientSetup.args.join(" ")}`,
    `Server path: ${report.clientSetup.serverPath ?? "not required for this mode"}`,
    `Warnings: ${report.clientSetup.warnings.length > 0 ? report.clientSetup.warnings.join(", ") : "none"}`,
    "",
    "## Official Access Checks",
    "",
    ...report.officialAccess.checks.map((check) => `- ${check.ok ? "OK" : "BLOCKED"} ${check.id}: configured=${check.configured ? "yes" : "no"}, status=${check.statusCode ?? "none"}`),
    "",
    "## Workflow",
    "",
    `Phase: ${report.workflow.phase}`,
    `Blocked: ${report.workflow.blocked ? "yes" : "no"}`,
    `Reason: ${report.workflow.reason}`,
    `Missing artifacts: ${report.workflow.missingArtifacts.length > 0 ? report.workflow.missingArtifacts.join(", ") : "none"}`,
    "",
    "## Next Actions",
    "",
    ...report.nextActions.map((action) => `- ${action}`),
    "",
    "## Security",
    "",
    report.security,
    ""
  ].join("\n");
}

function buildProjectHandoffMarkdown(handoff: Awaited<ReturnType<typeof buildProjectHandoff>>): string {
  return [
    "# EasyAR Project Handoff",
    "",
    `Generated at: ${handoff.generatedAt}`,
    `Project: ${handoff.projectPath}`,
    `Platform: ${handoff.platform}`,
    `Client: ${handoff.client}`,
    `Entrypoint mode: ${handoff.entrypointMode}`,
    `Ready for continuation: ${handoff.readyForContinuation ? "yes" : "no"}`,
    "",
    "## Top Next Call",
    "",
    `Tool: \`${handoff.topNextCall.tool}\``,
    `Arguments: \`${JSON.stringify(handoff.topNextCall.arguments)}\``,
    "",
    "## Summary",
    "",
    `Client ready: ${handoff.clientSetup.readyForClientConnection ? "yes" : "no"}`,
    `Local config valid: ${handoff.localConfig.valid ? "yes" : "no"}`,
    `Unity batch ready: ${handoff.unity.readyForUnityBatch ? "yes" : "no"}`,
    `All focused samples complete: ${handoff.focusedScope.allFocusedSamplesComplete ? "yes" : "no"}`,
    `Focused counts: completed=${handoff.focusedScope.completedCount}, blocked=${handoff.focusedScope.blockedCount}, failed=${handoff.focusedScope.failedCount}, not-run=${handoff.focusedScope.notRunCount}`,
    "",
    "## Client",
    "",
    `Command: ${handoff.clientSetup.command}`,
    `Args: ${JSON.stringify(handoff.clientSetup.args)}`,
    `Config destination: ${handoff.clientSetup.configDestination}`,
    `Warnings: ${handoff.clientSetup.warningCount}`,
    "",
    "## Account And Config",
    "",
    `Ready for local config validation: ${handoff.account.readyForLocalConfigValidation ? "yes" : "no"}`,
    `Missing account materials: ${handoff.account.missingRequired.length > 0 ? handoff.account.missingRequired.join(", ") : "none"}`,
    `Local config: ${handoff.localConfig.configPath}`,
    `Failed local config checks: ${handoff.localConfig.failedChecks.length > 0 ? handoff.localConfig.failedChecks.join(", ") : "none"}`,
    "",
    "## Unity",
    "",
    `Project version: ${handoff.unity.unityVersion ?? "unknown"}`,
    `Recommended Unity path: ${handoff.unity.recommendedUnityPath ?? "none"}`,
    "",
    "## Focused Workflows",
    "",
    ...handoff.workflows.flatMap((workflow) => [
      `### ${workflow.sampleName}`,
      "",
      `Sample id: ${workflow.sampleId}`,
      `Phase: ${workflow.phase}`,
      `Blocked: ${workflow.blocked ? "yes" : "no"}`,
      `Reason: ${workflow.reason}`,
      `Next tool: ${workflow.nextCall.tool}`,
      `Next arguments: ${JSON.stringify(workflow.nextCall.arguments)}`,
      `Missing artifacts: ${workflow.missingArtifacts.length > 0 ? workflow.missingArtifacts.join(", ") : "none"}`,
      "Next actions:",
      ...markdownIssueList(workflow.nextActions, "No workflow-specific next actions."),
      ""
    ]),
    "## Key Artifacts",
    "",
    ...Object.entries(handoff.artifacts).map(([name, relativePath]) => `- ${name}: ${relativePath}`),
    "",
    "## Blockers",
    "",
    ...markdownIssueList(handoff.blockers.map((blocker) => `${blocker.id}: ${blocker.detail} Action: ${blocker.action}`), "No project handoff blockers."),
    "",
    "## Next Actions",
    "",
    ...handoff.nextActions.map((action) => `- ${action}`),
    "",
    "## Security",
    "",
    handoff.security,
    ""
  ].join("\n");
}

function buildRemainingWorkMarkdown(report: Awaited<ReturnType<typeof buildRemainingWorkReport>>): string {
  return [
    "# EasyAR Remaining Work",
    "",
    `Generated at: ${report.generatedAt}`,
    `Project: ${report.projectPath ?? "not provided"}`,
    `Platform: ${report.platform}`,
    `Production ready: ${report.productionReady ? "yes" : "no"}`,
    `Verification evidence: ${report.verificationEvidence}`,
    "",
    "## Overall",
    "",
    `Evidence-weighted completion: ${report.overall.percent}%`,
    `Remaining estimate: ${report.overall.remainingPercent}%`,
    `Earned weight: ${report.overall.earnedWeight}/${report.overall.totalWeight}`,
    report.overall.note,
    "",
    "## Focused Scope",
    "",
    `All focused samples complete: ${report.focusedScope.allFocusedSamplesComplete ? "yes" : "no"}`,
    `Completed: ${report.focusedScope.completedCount}`,
    `Blocked: ${report.focusedScope.blockedCount}`,
    `Failed: ${report.focusedScope.failedCount}`,
    `Not run: ${report.focusedScope.notRunCount}`,
    "",
    "## Categories",
    "",
    ...report.categories.flatMap((category) => [
      `### ${category.title}`,
      "",
      `Category id: ${category.id}`,
      `Percent: ${category.percent}%`,
      `Weight: ${category.earnedWeight}/${category.weight}`,
      `Done: ${category.done ? "yes" : "no"}`,
      `Checks: ${category.passedCount}/${category.checkCount}`,
      "",
      "Checks:",
      ...category.checks.map((check) => `- ${check.ok ? "OK" : "BLOCKED"} ${check.id}: ${check.evidence}`),
      "",
      "Next actions:",
      ...markdownIssueList(category.nextActions, "No category-specific next actions."),
      ""
    ]),
    "## Top Remaining Areas",
    "",
    ...markdownIssueList(
      report.topRemainingAreas.map((area) => `${area.title} (${area.remainingWeight} weight remaining): ${area.firstNextAction}`),
      "No remaining weighted areas."
    ),
    "",
    "## Production Blockers",
    "",
    ...markdownIssueList(
      report.productionBlockers.map((blocker) => `${blocker.id}: ${blocker.currentEvidence} Action: ${blocker.nextAction}`),
      "No production blockers."
    ),
    "",
    "## Next Actions",
    "",
    ...markdownIssueList(report.nextActions, "No next actions recorded."),
    "",
    "## Security",
    "",
    report.security,
    ""
  ].join("\n");
}

function buildFirstRunGuideMarkdown(guide: Awaited<ReturnType<typeof buildFirstRunGuide>>): string {
  return [
    "# EasyAR First Run",
    "",
    `Generated at: ${guide.generatedAt}`,
    `Project: ${guide.projectPath ?? "not provided"}`,
    `Client: ${guide.client}`,
    `Platform: ${guide.platform}`,
    `Ready for Unity automation: ${guide.readyForUnityAutomation ? "yes" : "no"}`,
    "",
    "## First Question",
    "",
    guide.firstQuestion,
    "",
    "## Top Next Call",
    "",
    `Tool: \`${guide.topNextCall.tool}\``,
    `Arguments: \`${JSON.stringify(guide.topNextCall.arguments)}\``,
    "",
    "## Focused Scope",
    "",
    `Active samples: ${guide.focusedScope.activeSamples.join(", ")}`,
    `Deferred samples: ${guide.focusedScope.deferredSamples.join(", ")}`,
    guide.focusedScope.note,
    "",
    "## Selected Sample",
    "",
    `Sample: ${guide.sample.name} (${guide.sample.id})`,
    `Needs Cloud Recognition credentials: ${guide.sample.needsCloudRecognition ? "yes" : "no"}`,
    "",
    "## Official Browser Route",
    "",
    `Requested account stage: ${guide.account.requestedStage}`,
    `Current account stage: ${guide.account.stage}`,
    `EasyAR website: ${guide.account.officialLinks.website}`,
    `Register/login entry: ${guide.account.officialLinks.registerAndLogin}`,
    `Development center: ${guide.account.officialLinks.developCenter}`,
    "",
    `Route: ${guide.account.browserRoute.answer}`,
    `Guide: ${guide.account.browserRoute.guide}`,
    "Browser actions:",
    ...guide.account.browserRoute.browserActions.map((action) => `- ${action}`),
    `Return prompt: ${guide.account.browserRoute.returnPrompt}`,
    "",
    "## Account Materials",
    "",
    `Ready for local config validation: ${guide.accountMaterials.readyForLocalConfigValidation ? "yes" : "no"}`,
    `Missing required: ${guide.accountMaterials.missingRequired.length > 0 ? guide.accountMaterials.missingRequired.join(", ") : "none"}`,
    "",
    ...guide.accountMaterials.materials.flatMap((item) => [
      `### ${item.label}`,
      "",
      `Required: ${item.required ? "yes" : "no"}`,
      `Present: ${item.present ? "yes" : "no"}`,
      `Source: ${item.source}`,
      `Store in: ${item.storeIn}`,
      `Share policy: ${item.sharePolicy}`,
      ""
    ]),
    "## Local Config",
    "",
    `Config path: ${guide.localConfig.configPath}`,
    `Valid: ${guide.localConfig.valid ? "yes" : "no"}`,
    `Failed checks: ${guide.localConfig.failedChecks.length > 0 ? guide.localConfig.failedChecks.join(", ") : "none"}`,
    "",
    "## First MCP Calls",
    "",
    ...guide.firstCalls.map((call) => `- ${call}`),
    "",
    "## Artifact Reading Order",
    "",
    ...guide.artifactOrder.map((artifact) => `- ${artifact}`),
    "",
    "## Blockers",
    "",
    ...markdownIssueList(guide.blockers.map((blocker) => `${blocker.id}: ${blocker.detail} Action: ${blocker.action}`), "No first-run blockers."),
    "",
    "## Next Actions",
    "",
    ...guide.nextActions.map((action) => `- ${action}`),
    "",
    "## Security",
    "",
    ...guide.security.map((item) => `- ${item}`),
    ""
  ].join("\n");
}

function markdownCheckList(items: ReadinessCheck[], emptyMessage: string): string[] {
  if (items.length === 0) {
    return [`- ${emptyMessage}`];
  }
  return items.map((item) => `- [${item.severity}] ${item.id}: ${item.detail}`);
}

function markdownIssueList(items: string[], emptyMessage: string): string[] {
  if (items.length === 0) {
    return [`- ${emptyMessage}`];
  }
  return items.map((item) => `- ${item}`);
}

function markdownNumberedList(items: string[], emptyMessage: string): string[] {
  if (items.length === 0) {
    return [`1. ${emptyMessage}`];
  }
  return items.map((item, index) => `${index + 1}. ${item}`);
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
            if (!ContainsConfiguredJsonString(localConfig, "appId") || (!ContainsConfiguredJsonString(localConfig, "apiKey") && (!ContainsConfiguredJsonString(localConfig, "appKey") || !ContainsConfiguredJsonString(localConfig, "appSecret"))))
            {
                throw new InvalidOperationException("Cloud Recognition requires appId plus apiKey in easyar.local.json. Legacy appKey/appSecret is also accepted.");
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

function buildLocalConfigBridgeEditor(sample: SampleInfo): string {
  const cloudValidation = sample.id === "cloud-recognition"
    ? `            RequireConfiguredJsonString(json, "appId", "Cloud Recognition appId is missing or still a placeholder.");
            if (!ContainsConfiguredJsonString(json, "apiKey") && (!ContainsConfiguredJsonString(json, "appKey") || !ContainsConfiguredJsonString(json, "appSecret")))
            {
                throw new InvalidOperationException("Cloud Recognition apiKey is missing or legacy appKey/appSecret is incomplete.");
            }
`
    : "";
  const runtimeCloudFields = sample.id === "cloud-recognition"
    ? `                + "    ,\\"cloudRecognition\\": {\\n"
                + "      \\"appId\\": \\"" + JsonEscape(ReadOptionalJsonString(json, "appId")) + "\\",\\n"
                + "      \\"apiKey\\": \\"" + JsonEscape(ReadOptionalJsonString(json, "apiKey")) + "\\"\\n"
                + "    }\\n"`
    : "";

  return `using System;
using System.IO;
using System.Text.RegularExpressions;
using UnityEditor;

namespace EasyAR.EditorTools
{
    public static class EasyARLocalConfigBridge
    {
        private const string SourceRelativePath = "ProjectSettings/EasyAR/easyar.local.json";
        private const string RuntimeRelativePath = "Assets/StreamingAssets/EasyAR/easyar.runtime.json";

        [MenuItem("Tools/EasyAR/Export Local Config For Runtime")]
        public static void ExportRuntimeConfig()
        {
            var projectRoot = Directory.GetCurrentDirectory();
            var sourcePath = Path.Combine(projectRoot, SourceRelativePath);
            if (!File.Exists(sourcePath))
            {
                throw new InvalidOperationException("Missing " + SourceRelativePath + ". Fill it locally before exporting runtime config.");
            }

            var json = File.ReadAllText(sourcePath);
            RequireConfiguredJsonString(json, "licenseKey", "EasyAR licenseKey is missing or still a placeholder.");
${cloudValidation}
            var targetPath = Path.Combine(projectRoot, RuntimeRelativePath);
            Directory.CreateDirectory(Path.GetDirectoryName(targetPath));
            File.WriteAllText(targetPath, BuildRuntimeJson(json));
            AssetDatabase.ImportAsset(RuntimeRelativePath);
            UnityEngine.Debug.Log("Exported EasyAR runtime config to " + RuntimeRelativePath + " without account tokens, API secrets, or printed secret values. The file must stay ignored by git.");
        }

        private static void RequireConfiguredJsonString(string json, string key, string message)
        {
            if (!ContainsConfiguredJsonString(json, key))
            {
                throw new InvalidOperationException(message);
            }
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

        private static string BuildRuntimeJson(string json)
        {
            return "{\\n"
                + "  \\"easyar\\": {\\n"
                + "    \\"licenseKey\\": \\"" + JsonEscape(ReadConfiguredJsonString(json, "licenseKey")) + "\\"\\n"
${runtimeCloudFields}
                + "  },\\n"
                + "  \\"unity\\": {\\n"
                + "    \\"targetPlatform\\": \\"" + JsonEscape(ReadOptionalJsonString(json, "targetPlatform")) + "\\",\\n"
                + "    \\"bundleIdentifier\\": \\"" + JsonEscape(ReadOptionalJsonString(json, "bundleIdentifier")) + "\\"\\n"
                + "  }\\n"
                + "}\\n";
        }

        private static string ReadConfiguredJsonString(string json, string key)
        {
            var value = ReadOptionalJsonString(json, key);
            return ContainsConfiguredValue(value) ? value : string.Empty;
        }

        private static string ReadOptionalJsonString(string json, string key)
        {
            var match = Regex.Match(json, "\\\\\\"" + Regex.Escape(key) + "\\\\\\"\\\\s*:\\\\s*\\\\\\"([^\\\\\\"]*)\\\\\\"");
            return match.Success ? match.Groups[1].Value.Trim() : string.Empty;
        }

        private static bool ContainsConfiguredValue(string value)
        {
            return value.Length > 0
                && value.IndexOf("paste-", StringComparison.OrdinalIgnoreCase) < 0
                && value.IndexOf("placeholder", StringComparison.OrdinalIgnoreCase) < 0
                && value.IndexOf("your_", StringComparison.OrdinalIgnoreCase) < 0;
        }

        private static string JsonEscape(string value)
        {
            return (value ?? string.Empty)
                .Replace("\\\\", "\\\\\\\\")
                .Replace("\\"", "\\\\\\"")
                .Replace("\\r", "\\\\r")
                .Replace("\\n", "\\\\n");
        }
    }
}
`;
}

function buildLocalConfigBridgeRuntime(): string {
  return `using System;
using System.Collections;
using System.Text.RegularExpressions;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.Networking;

namespace EasyAR.Samples.Generated
{
    public sealed class EasyARLocalConfigRuntime : MonoBehaviour
    {
        private const string RuntimeRelativePath = "EasyAR/easyar.runtime.json";

        public static EasyARLocalConfigRuntime Instance { get; private set; }

        [SerializeField] private UnityEvent onConfigLoaded = new UnityEvent();

        private bool loadOnAwake = true;
        private bool dontDestroyOnLoad = true;
        private Coroutine loadRoutine;
        public bool Loaded { get; private set; }
        public string LicenseKey { get; private set; }
        public string BundleIdentifier { get; private set; }
        public string CloudRecognitionAppId { get; private set; }
        public string CloudRecognitionApiKey { get; private set; }

        public bool HasLicenseKey => IsConfigured(LicenseKey);
        public bool HasCloudRecognitionCredentials =>
            IsConfigured(CloudRecognitionAppId)
            && IsConfigured(CloudRecognitionApiKey);

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            if (dontDestroyOnLoad)
            {
                DontDestroyOnLoad(gameObject);
            }

            if (loadOnAwake)
            {
                loadRoutine = StartCoroutine(Load());
            }
        }

        private void OnDisable()
        {
            if (loadRoutine != null)
            {
                StopCoroutine(loadRoutine);
                loadRoutine = null;
            }
        }

        public IEnumerator Load()
        {
            var path = System.IO.Path.Combine(Application.streamingAssetsPath, RuntimeRelativePath);
            string json;
            if (path.Contains("://") || path.Contains(":///"))
            {
                using (var request = UnityWebRequest.Get(path))
                {
                    yield return request.SendWebRequest();
                    if (request.result != UnityWebRequest.Result.Success)
                    {
                        Debug.LogError("EasyAR runtime config could not be loaded from StreamingAssets. Export it before building.");
                        yield break;
                    }
                    json = request.downloadHandler.text;
                }
            }
            else
            {
                if (!System.IO.File.Exists(path))
                {
                    Debug.LogError("EasyAR runtime config is missing from StreamingAssets. Export it before building.");
                    yield break;
                }
                json = System.IO.File.ReadAllText(path);
            }

            ApplyJson(json);
            Loaded = true;
            Debug.Log("EasyAR runtime config loaded. License present: " + HasLicenseKey + ", cloud credentials present: " + HasCloudRecognitionCredentials + ".");
            if (onConfigLoaded != null)
            {
                onConfigLoaded.Invoke();
            }
        }

        public void ApplyJson(string json)
        {
            LicenseKey = ReadString(json, "licenseKey");
            BundleIdentifier = ReadString(json, "bundleIdentifier");
            CloudRecognitionAppId = ReadString(json, "appId");
            CloudRecognitionApiKey = ReadString(json, "apiKey");
        }

        private static string ReadString(string json, string key)
        {
            var match = Regex.Match(json ?? string.Empty, "\\\\\\"" + Regex.Escape(key) + "\\\\\\"\\\\s*:\\\\s*\\\\\\"([^\\\\\\"]*)\\\\\\"");
            return match.Success ? match.Groups[1].Value.Trim() : string.Empty;
        }

        private static bool IsConfigured(string value)
        {
            return !string.IsNullOrWhiteSpace(value)
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
  const needsCloudRecognition = sample.id === "cloud-recognition";
  return `${JSON.stringify(
    {
      _instructions: {
        purpose: "Copy this file to easyar.local.json and fill it locally after official EasyAR registration/login.",
        officialAccountFlow: [
          "Register or log in through https://www.easyar.cn/ or the EasyAR development center in a browser.",
          "Create or locate the EasyAR Sense license for the Unity bundle/package identifier below.",
          ...(needsCloudRecognition
            ? ["Create or locate Cloud Recognition/CRS credentials in the official EasyAR account: the Cloud Recognition/CRS library AppId plus an API KEY. Sense 4.1+ uses CRS AppId + API KEY."]
            : ["Cloud Recognition credentials can stay empty for the Image Tracking focused sample."])
        ],
        neverShareInChat: [
          "EasyAR website password",
          "SMS/email/authenticator verification codes",
          "easyar.accountToken",
          "easyar.licenseKey",
          "easyar.cloudRecognition.apiKey",
          "easyar.cloudRecognition.apiSecret",
          "easyar.cloudRecognition.appKey",
          "easyar.cloudRecognition.appSecret"
        ],
        envAlternative: {
          tool: "easyar_write_local_config_from_env",
          accountToken: ["EASYAR_ACCOUNT_TOKEN", "EASYAR_API_TOKEN"],
          licenseKey: ["EASYAR_LICENSE_KEY", "EASYAR_SENSE_LICENSE_KEY"],
          bundleIdentifier: ["EASYAR_BUNDLE_IDENTIFIER", "EASYAR_UNITY_BUNDLE_IDENTIFIER"],
          cloudAppId: ["EASYAR_CLOUD_APP_ID", "EASYAR_CLOUD_RECOGNITION_APP_ID"],
          cloudApiKey: ["EASYAR_CLOUD_API_KEY", "EASYAR_CLOUD_RECOGNITION_API_KEY", "EASYAR_CLOUD_APP_KEY", "EASYAR_CLOUD_RECOGNITION_APP_KEY"],
          cloudApiSecret: ["EASYAR_CLOUD_API_SECRET", "EASYAR_CLOUD_RECOGNITION_API_SECRET", "EASYAR_CLOUD_APP_SECRET", "EASYAR_CLOUD_RECOGNITION_APP_SECRET"]
        },
        validation: "Run easyar_validate_local_config after editing. The MCP server reports field presence and placeholders only, never secret values."
      },
      sampleId: sample.id,
      sampleName: sample.name,
      easyar: {
        apiBaseUrl: "https://www.easyar.cn",
        accountToken: "paste-official-registered-user-token-here",
        licenseKey: "paste-easyar-license-key-here",
        cloudRecognition: {
          appId: "",
          apiKey: "",
          apiSecret: "",
          appKey: "",
          appSecret: "",
          credentialMode: ""
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
    "1. Run `easyar_write_account_onboarding` and `easyar_write_account_materials` if the EasyAR account, license, or Cloud Recognition credentials are not ready.",
    "2. Run `easyar_write_unity_environment_report` to record `EASYAR_UNITY_PATH` setup before any Unity batch command.",
    "3. Run `easyar_write_focused_preflight` and read `PREFLIGHT.md` before executing Unity automation.",
    "4. Import the official EasyAR Unity Plugin and matching official sample scenes.",
    "5. Copy `ProjectSettings/EasyAR/easyar.local.json.example` to `ProjectSettings/EasyAR/easyar.local.json` or run `easyar_write_local_config_from_env`.",
    "6. Fill the local EasyAR license key and account-scoped values without committing the file.",
    "7. Run `easyar_validate_local_config` and `easyar_check_sample_readiness`.",
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
      "1. Fill `easyar.cloudRecognition.appId` and `apiKey` in local config. Legacy `appKey`/`appSecret` aliases are still accepted.",
      "2. Confirm network access is allowed on the target platform.",
      "3. Verify the cloud database/target library is configured in the official EasyAR account.",
      "4. Test on a real device with a network path to the selected EasyAR cloud recognition service.",
      "",
      "Expected readiness checks:",
      "",
      "- `cloud-recognition-credentials` should report CRS AppId + API Key configured.",
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
        "Fill `ProjectSettings/EasyAR/easyar.local.json` with official CRS `appId` and API `apiKey` values from the registered EasyAR account. Keep `apiSecret` local if the account page exposes it.",
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

function buildUnityRunResultStep(input: {
  stepName: string;
  result: { exitCode: number | null; logPath: string | null };
  issues: Array<{ title: string; actions: string[] }>;
  root: string;
  successNextAction: string;
}) {
  const status: typeof runResultStatuses[number] = input.result.exitCode === 0 && input.issues.length === 0
    ? "passed"
    : input.result.exitCode === null
      ? "blocked"
      : "failed";
  const logEvidence = input.result.logPath ? `Log: ${path.relative(input.root, input.result.logPath)}` : "No project-local Unity log path was provided.";
  const exitEvidence = `Unity exit code: ${input.result.exitCode ?? "unknown"}`;
  const issueEvidence = input.issues.length > 0
    ? `Detected issue(s): ${input.issues.map((issue) => issue.title).join("; ")}`
    : "No known EasyAR/Unity issue patterns detected.";
  const nextAction = status === "passed"
    ? input.successNextAction
    : input.issues[0]?.actions[0] ?? "Inspect the Unity log, fix the failing Unity step, and rerun the focused workflow.";

  return {
    name: input.stepName,
    status,
    evidence: `${exitEvidence}. ${logEvidence}. ${issueEvidence}`,
    nextAction
  };
}

function buildSuggestedRunResultCall(input: {
  root: string;
  sample: SampleInfo;
  platform: typeof mobilePlatforms[number];
  overallStatus?: typeof runResultStatuses[number];
  stepName: string;
  status: typeof runResultStatuses[number];
  evidence: string;
  nextAction: string;
}) {
  const overallStatus = input.overallStatus ?? input.status;
  return {
    tool: "easyar_write_run_result",
    arguments: {
      projectPath: input.root,
      sampleId: input.sample.id,
      platform: input.platform,
      overallStatus,
      steps: [
        {
          name: input.stepName,
          status: input.status,
          evidence: input.evidence,
          nextAction: input.nextAction
        }
      ]
    }
  };
}

function unityMethodStepName(executeMethod: string): string {
  if (/MobileSettingsHelper\.ConfigureMobileSettings$/.test(executeMethod)) {
    return "Configure mobile player settings";
  }
  if (/BuildSettingsHelper\.ConfigureBuildSettings$/.test(executeMethod)) {
    return "Configure Build Settings";
  }
  if (/SampleValidationHelper\.ValidateFocusedSample$/.test(executeMethod)) {
    return "Validate focused sample";
  }
  if (/DeviceBuildHelper\.Build$/.test(executeMethod)) {
    return "Build device player";
  }
  if (/SampleRunner\.OpenSampleScene$/.test(executeMethod)) {
    return "Open focused sample scene";
  }
  return `Run Unity method ${executeMethod}`;
}

function unityMethodSuccessNextAction(executeMethod: string): string {
  if (/MobileSettingsHelper\.ConfigureMobileSettings$/.test(executeMethod)) {
    return "Run the Build Settings helper for the focused sample.";
  }
  if (/BuildSettingsHelper\.ConfigureBuildSettings$/.test(executeMethod)) {
    return "Run the focused sample validation helper, then compile check.";
  }
  if (/SampleValidationHelper\.ValidateFocusedSample$/.test(executeMethod)) {
    return "Run easyar_run_unity_compile_check, then prepare the device build helper.";
  }
  if (/DeviceBuildHelper\.Build$/.test(executeMethod)) {
    return "Install the build on a real Android/iOS device and follow DEVICE_VALIDATION.md.";
  }
  if (/SampleRunner\.OpenSampleScene$/.test(executeMethod)) {
    return "Run Build Settings and focused sample validation after opening the scene.";
  }
  return "Continue with the focused run sequence and record the next observed result.";
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
