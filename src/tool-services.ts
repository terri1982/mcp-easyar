import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { access, cp, mkdir, open, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { createEasyARApiClient } from "./easyar-api.js";
import { focusedHandoffSampleIds } from "./focused-scope.js";
import { jsonText, markdownText } from "./mcp-response.js";
import { officialOpenApiPath, packageRoot } from "./paths.js";
import {
  accountStageValues,
  activeToolCatalog,
  authorizationModeValues,
  buildPlatforms,
  clientEntrypointModes,
  clientKinds,
  coreToolNames,
  currentGitHubReleaseTag,
  deviceBuildPlatforms,
  mobilePlatforms,
  monoBehaviourKinds,
  resourceCatalog,
  runResultStatuses,
  serverName,
  serverVersion,
  toolCatalog,
  toolProfile
} from "./catalog.js";
import type { AccountStage, AuthorizationMode } from "./catalog.js";
import { deferredSamples, findSample, focusedSamples, officialInfo, quickstartWorkflow, samples } from "./samples.js";
import type { SampleInfo } from "./samples.js";
import { buildAndroidDeviceStatusActions, buildUnityArgs, defaultAndroidLogcatFilter, parseAdbDevices, redactSecretText, runProcess, runUnity } from "./runtime.js";
import { buildBuildSettingsHelper, buildDeviceBuildHelper, buildFocusedSampleRunbook, buildLocalConfigBridgeEditor, buildLocalConfigBridgeRuntime, buildLocalConfigExample, buildMobileSettingsHelper, buildMonoBehaviourTemplate, buildSampleRunner, buildSampleValidationHelper, defaultBundleIdentifier } from "./unity-generators.js";
import {
  extractMethodBody,
  findLineNumber,
  firstMatchingLine,
  walk,
  assertInside,
  writeGeneratedFile,
  ensureGitignoreEntries,
  escapeRegExp,
  resolveUnityLogPath,
  defaultUnityBatchLogPath,
  buildUnityRunResultStep,
  buildSuggestedRunResultCall,
  unityMethodStepName,
  unityMethodSuccessNextAction
} from "./tool-file-utils.js";

export {
  DeviceValidationStep,
  FocusedHandoffPackInput,
  androidDeviceInteractionAction,
  artifactPriority,
  buildAndroidDeviceRunbook,
  buildArtifactIndex,
  buildCompletionNextActions,
  buildCompletionReport,
  buildDeviceRunResultForm,
  buildDeviceValidationChecklist,
  buildDeviceValidationSteps,
  buildFocusedHandoffPackPlan,
  buildFocusedPreflight,
  buildFocusedReleaseEvidence,
  buildFocusedRunReport,
  buildFocusedScopeNextActions,
  buildFocusedScopeStatus,
  buildIssueReport,
  buildRunResult,
  buildSupportBundle,
  chooseCompletionStatus,
  countMarkdownStepStatuses,
  countPassedDeviceValidationSteps,
  defaultFocusedOutputPath,
  defaultIssueReproductionSteps,
  devicePortalEvidenceBlockers,
  focusedArtifactDefinitions,
  focusedArtifactReadOrder,
  focusedHandoffPackArtifactSpecs,
  focusedHandoffPackPurpose,
  focusedHandoffPackSamples,
  hasRecordedDevice,
  isPortalEvidenceReadyForSample,
  parseMarkdownField,
  parseNumberField,
  parseRunResultStatus,
  parseYesNoField,
  portalEvidencePreflightDetail,
  readFocusedReleaseEvidence,
  readPortalEvidenceArtifact,
  readRunResultArtifact,
  sampleDeviceEvidencePrompts,
  sampleDevicePassCriteria,
  sampleExpectedIssueBehavior,
  samplePassedEvidencePlaceholder,
  sampleSpecificDeviceValidationSteps,
  writeFocusedHandoffPack,
  writeFocusedHandoffPackForSample,
  writePackFile
} from "./tool-device-evidence.js";

export {
  readCloudRecognitionConfig,
  readLogFile,
  UnityLogCandidate,
  findUnityLogCandidates,
  readLogTail,
  readJsonFile,
  buildLocalConfigValidationReport,
  buildLocalConfigFromEnvReport,
  envFirst,
  envPresenceItem,
  validateLocalConfig,
  localConfigAction,
  isRecord,
  isNonPlaceholderString,
  isOptionalNonPlaceholderString,
  isNonEmptyString,
  sanitizeRunResultNotes,
  sanitizeIssueText,
  hasCloudRecognitionConfig,
  hasCompleteCloudRecognitionConfig,
  cloudRecognitionCredentialMode
} from "./tool-local-config.js";

export {
  UnityLogRule,
  analyzeUnityLog,
  sampleSpecificLogRules,
  findEvidence,
  ScriptReviewIssue,
  reviewCsharpScript,
  buildScriptReviewReport,
  buildScriptReviewActions,
  chooseNextRunPhase
} from "./tool-diagnostics.js";

export {
  resolveProjectPath,
  exists,
  ensureDirectory,
  readUnityVersion,
  findFiles,
  findUnityCandidates,
  collectUnityExecutables,
  buildUnityEnvironmentReport,
  chooseUnityCandidate,
  unityPathMatchesProjectVersion,
  shellSingleQuote
} from "./tool-project.js";

export {
  buildSampleReadinessReport,
  buildImportChecklist,
  buildSampleImportGuide,
  importSampleFromPackageCache,
  readPackageCacheInfo,
  normalizeUnityPackageVersion,
  parsePackageCacheFolderVersion,
  sanitizeAssetFolderName,
  buildSampleSceneAudit,
  uniqueBlockers,
  filterOfficialEasyARSignals,
  matchSampleScenes,
  sceneContentMatchesSample,
  findPackageCacheSamplePaths,
  walkPackageCacheSamples,
  packageCacheSamplePathMatches,
  readinessAction,
  findImageTrackingTargetAssets,
  findImageTargetsStreamingPackageCandidates,
  hasOfficialImageTargetsStreamingAssets,
  findMegaAssetHints,
  readMegaSettingsSummary,
  readMegaLocationInputModeSummary,
  hasPicoHeadsetMegaSignals,
  readMegaBlockRootSummary,
  hasYamlScalar,
  focusedSampleGeneratedDir,
  focusedSampleRunbookPath,
  buildSampleSpecificReadinessChecks,
  readBuildSettingsSceneHints,
  buildSampleSceneAuditSpecifics
} from "./tool-sample-workflow.js";

import {
  buildSampleReadinessReport,
  buildImportChecklist,
  buildSampleImportGuide,
  importSampleFromPackageCache,
  readPackageCacheInfo,
  normalizeUnityPackageVersion,
  parsePackageCacheFolderVersion,
  sanitizeAssetFolderName,
  buildSampleSceneAudit,
  uniqueBlockers,
  filterOfficialEasyARSignals,
  matchSampleScenes,
  sceneContentMatchesSample,
  findPackageCacheSamplePaths,
  walkPackageCacheSamples,
  packageCacheSamplePathMatches,
  readinessAction,
  findImageTrackingTargetAssets,
  findImageTargetsStreamingPackageCandidates,
  hasOfficialImageTargetsStreamingAssets,
  findMegaAssetHints,
  readMegaSettingsSummary,
  readMegaLocationInputModeSummary,
  hasPicoHeadsetMegaSignals,
  readMegaBlockRootSummary,
  hasYamlScalar,
  focusedSampleGeneratedDir,
  focusedSampleRunbookPath,
  buildSampleSpecificReadinessChecks,
  readBuildSettingsSceneHints,
  buildSampleSceneAuditSpecifics
} from "./tool-sample-workflow.js";

import {
  resolveProjectPath,
  exists,
  ensureDirectory,
  readUnityVersion,
  findFiles,
  findUnityCandidates,
  collectUnityExecutables,
  buildUnityEnvironmentReport,
  chooseUnityCandidate,
  unityPathMatchesProjectVersion,
  shellSingleQuote
} from "./tool-project.js";

import {
  UnityLogRule,
  analyzeUnityLog,
  sampleSpecificLogRules,
  findEvidence,
  ScriptReviewIssue,
  reviewCsharpScript,
  buildScriptReviewReport,
  buildScriptReviewActions,
  chooseNextRunPhase
} from "./tool-diagnostics.js";

import {
  readCloudRecognitionConfig,
  readLogFile,
  UnityLogCandidate,
  findUnityLogCandidates,
  readLogTail,
  readJsonFile,
  buildLocalConfigValidationReport,
  buildLocalConfigFromEnvReport,
  envFirst,
  envPresenceItem,
  validateLocalConfig,
  localConfigAction,
  isRecord,
  isNonPlaceholderString,
  isOptionalNonPlaceholderString,
  isNonEmptyString,
  sanitizeRunResultNotes,
  sanitizeIssueText,
  hasCloudRecognitionConfig,
  hasCompleteCloudRecognitionConfig,
  cloudRecognitionCredentialMode
} from "./tool-local-config.js";
import {
  buildArtifactIndex,
  buildCompletionReport,
  buildFocusedScopeStatus,
  buildRunResult,
  buildDeviceValidationChecklist,
  readFocusedReleaseEvidence
} from "./tool-device-evidence.js";
import {
  buildRunReportMarkdown,
  buildFocusedPreflightMarkdown,
  buildImportChecklistMarkdown,
  buildSampleImportGuideMarkdown,
  buildWorkflowStateMarkdown,
  buildArtifactIndexMarkdown,
  buildFocusedHandoffPackMarkdown,
  buildSceneAuditMarkdown,
  buildSupportBundleMarkdown,
  buildRunResultMarkdown,
  buildCompletionReportMarkdown,
  buildFocusedScopeStatusMarkdown,
  buildIssueReportMarkdown,
  buildDeviceValidationChecklistMarkdown,
  buildDeviceRunResultFormMarkdown,
  buildAndroidDeviceRunbookMarkdown,
  buildProgrammingContextMarkdown,
  buildConfigIntegrationAuditMarkdown,
  markdownConfigConsumerCandidates,
  buildCodePlanMarkdown,
  buildCodeChangeSummaryMarkdown,
  markdownRunResultSteps,
  buildRunSequenceMarkdown,
  buildDeploymentReadinessMarkdown,
  buildUnityEnvironmentMarkdown,
  buildProductionValidationMarkdown,
  buildAuthorizationStrategyMarkdown,
  buildAccountOnboardingMarkdown,
  buildAccountMaterialsMarkdown,
  buildPortalEvidenceMarkdown,
  presenceLabel,
  buildLocalConfigFormMarkdown,
  buildLocalConfigHandoffMarkdown,
  buildOfficialAccessMarkdown,
  buildOfficialApiContractMarkdown,
  buildOfficialApiHandoffMarkdown,
  buildClientSetupMarkdown,
  buildReleaseManifestMarkdown,
  buildOnboardingMarkdown,
  buildProjectHandoffMarkdown,
  buildRemainingWorkMarkdown,
  buildFirstRunGuideMarkdown,
  markdownCheckList,
  markdownIssueList,
  markdownNumberedList
} from "./tool-markdown.js";

export {
  extractMethodBody,
  findLineNumber,
  firstMatchingLine,
  walk,
  assertInside,
  writeGeneratedFile,
  ensureGitignoreEntries,
  escapeRegExp,
  resolveUnityLogPath,
  defaultUnityBatchLogPath,
  buildUnityRunResultStep,
  buildSuggestedRunResultCall,
  unityMethodStepName,
  unityMethodSuccessNextAction
} from "./tool-file-utils.js";


export type ReadinessCheck = {
  id: string;
  ok: boolean;
  severity: "blocker" | "warning" | "info";
  detail: string;
};

export type DeploymentReadinessReport = {
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

const easyarApi = createEasyARApiClient();

export function chooseSampleExpansionOrder(targetSamples: SampleInfo[]) {
  const rank = new Map([
    ["hello-ar", 1],
    ["surface-tracking", 2]
  ]);
  return [...targetSamples]
    .sort((a, b) => (rank.get(a.id) ?? 99) - (rank.get(b.id) ?? 99))
    .map((sample) => ({
      sampleId: sample.id,
      sampleName: sample.name,
      reason: sample.id === "hello-ar"
        ? "Use the smallest camera, ARSession, license, and mobile-build baseline before expanding to tracking-heavy samples."
        : sample.id === "surface-tracking"
          ? "Run after the baseline sample because it needs real-device motion tracking and placement evidence."
          : "Run after its official prerequisites and pass criteria are documented."
    }));
}

export function buildSampleExpansionPlan(
  sample: SampleInfo,
  platform: typeof mobilePlatforms[number],
  unityVersion: string,
  includeOfficialApiTrack: boolean
) {
  return {
    sampleId: sample.id,
    sampleName: sample.name,
    currentStatus: sample.implementationStatus,
    targetStatus: "focused-candidate",
    unityVersion,
    platform,
    purpose: sample.description,
    entryCriteria: [
      "User explicitly asks to continue this sample.",
      "Official EasyAR Sense Unity Plugin is installed from authorized EasyAR materials.",
      "ProjectSettings/EasyAR/easyar.local.json contains required local keys on the user's machine.",
      "No secret values are pasted into chat or committed to git.",
      ...sample.requiredCapabilities.map((capability) => `Capability ready: ${capability}.`)
    ],
    requiredArtifacts: [
      "ACCOUNT_ONBOARDING.md",
      "ACCOUNT_MATERIALS.md",
      `${sample.id}/SAMPLE_IMPORT_GUIDE.md`,
      `${sample.id}/PREFLIGHT.md`,
      `${sample.id}/RUN_SEQUENCE.md`,
      `${sample.id}/DEVICE_VALIDATION.md`,
      `${sample.id}/RUN_RESULT.md`,
      `${sample.id}/COMPLETION_REPORT.md`,
      `${sample.id}/SUPPORT_BUNDLE.md`
    ],
    validationSequence: [
      `easyar_generate_sample_plan sampleId=${sample.id} unityVersion=${unityVersion} platform=${platform}`,
      `easyar_write_account_onboarding projectPath=/path/to/UnityProject sampleId=${sample.id} accountStage=not-registered`,
      `easyar_write_sample_import_guide projectPath=/path/to/UnityProject sampleId=${sample.id}`,
      `easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=${sample.id} platform=${platform}`,
      `easyar_write_run_sequence projectPath=/path/to/UnityProject sampleId=${sample.id} platform=${platform}`,
      `easyar_write_device_validation projectPath=/path/to/UnityProject sampleId=${sample.id} platform=${platform}`,
      `easyar_write_run_result projectPath=/path/to/UnityProject sampleId=${sample.id} platform=${platform} overallStatus=passed`,
      `easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=${sample.id} platform=${platform}`
    ],
    passCriteria: sampleExpansionPassCriteria(sample),
    officialApiTrack: includeOfficialApiTrack
      ? [
          "Configure official EasyAR account, license, downloads, and Cloud Recognition endpoint env vars.",
          "Run npm run official-api:canary against staging or production services.",
          "Require easyar_production_validation to report Production ready: yes before production npm publishing."
        ]
      : [
          "Not required for local-key sample expansion. Use official browser handoff plus local user-owned keys."
        ],
    risks: sampleExpansionRisks(sample),
    security: "Expansion evidence must be status/path based and redacted. Do not commit APKs, Unity packages, local config secrets, raw logs, or EasyAR account credentials."
  };
}

export function sampleExpansionPassCriteria(sample: SampleInfo): string[] {
  if (sample.id === "mega") {
    return [
      "App installs and launches on a physical Android or iOS device.",
      "Camera and location/network permissions are granted as required by the sample.",
      "EasyAR Mega initializes without license, plugin import, or service configuration errors.",
      "The configured Mega Block is loaded and cloud localization succeeds against the selected library.",
      "No secret values appear in generated reports or logs."
    ];
  }
  if (sample.id === "hello-ar") {
    return [
      "App installs and launches on a physical Android or iOS device.",
      "Camera permission is granted.",
      "EasyAR initializes without license or plugin import errors.",
      "ARSession reaches running state with live camera feed.",
      "No secret values appear in generated reports or logs."
    ];
  }
  if (sample.id === "surface-tracking") {
    return [
      "App installs and launches on a physical device with camera permission.",
      "EasyAR initializes without license or plugin import errors.",
      "Motion/surface tracking starts on a supported device.",
      "A deliberate placement action anchors visible content to the tracked surface.",
      "Device screenshots or logs prove the observed placement behavior."
    ];
  }
  return [
    "Official sample imports successfully.",
    "Unity compile check passes.",
    "Device build succeeds.",
    "Real-device behavior proves the sample's advertised EasyAR capability.",
    "No secret values appear in generated reports or logs."
  ];
}

export function sampleExpansionRisks(sample: SampleInfo): string[] {
  if (sample.id === "mega") {
    return [
      "Mega validation depends on a real cloud localization library and matching physical environment.",
      "Editor or emulator startup cannot prove cloud localization behavior.",
      "Incorrect block id, stale Mega Studio import state, or weak device network/GPS can make validation fail."
    ];
  }
  if (sample.id === "surface-tracking") {
    return [
      "Editor or emulator startup cannot prove surface tracking behavior.",
      "Some devices may not support the required motion tracking mode.",
      "Lighting, textureless surfaces, or fast motion can make validation flaky."
    ];
  }
  if (sample.id === "hello-ar") {
    return [
      "A passing launch alone is not enough; the evidence must show EasyAR initialization and live camera/ARSession state.",
      "This sample proves baseline setup but not image, cloud, or surface tracking behavior."
    ];
  }
  return [
    "Unknown official sample prerequisites may require new local config fields or pass criteria.",
    "Real-device evidence is required for camera/tracking samples."
  ];
}

export function readAuthConfig() {
  return easyarApi.authStatus();
}

export async function buildDeploymentReadiness(projectPath: string | null, unityPath?: string): Promise<DeploymentReadinessReport> {
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
      check("release-workflow", await exists(path.join(process.cwd(), ".github", "workflows", "release.yml")), "blocker", "GitHub Actions Release workflow .github/workflows/release.yml exists."),
      check("readme", await fileContains(path.join(process.cwd(), "README.md"), "mcp-easyar"), "blocker", "README.md uses the mcp-easyar project name."),
      check("readme-install-profiles", await fileContains(path.join(process.cwd(), "README.md"), "entrypointMode=package-bin") && await fileContains(path.join(process.cwd(), "README.md"), "entrypointMode=npx"), "warning", "README.md documents package-bin and npx client entrypoint modes."),
      check("release-manifest-install-profiles", await fileContains(path.join(process.cwd(), "docs", "RELEASE_MANIFEST.md"), "Install Profiles") && await fileContains(path.join(process.cwd(), "docs", "RELEASE_MANIFEST.md"), "npm install -g mcp-easyar"), "warning", "docs/RELEASE_MANIFEST.md documents local, package-bin, and npx install profiles."),
      check("license", await exists(path.join(process.cwd(), "LICENSE")), "blocker", "LICENSE exists."),
      check("security-policy", await exists(path.join(process.cwd(), "SECURITY.md")), "warning", "SECURITY.md exists."),
      check("logo", await exists(path.join(process.cwd(), "assets", "easyar-icon.png")), "warning", "assets/easyar-icon.png exists.")
    ],
    authorization: [
      check("local-key-workflow", true, "blocker", "Default authorization workflow is local-key: users log in on www.easyar.cn and fill ProjectSettings/EasyAR/easyar.local.json locally."),
      check("api-base-url", Boolean(auth.apiBaseUrl), "info", `Optional official API base URL is ${auth.apiBaseUrl || "not configured"}.`),
      check("api-token", auth.hasToken, "info", "Optional EASYAR_API_TOKEN is configured only when an official API integration is explicitly enabled."),
      check("account-status-endpoint", auth.accountStatusEndpointConfigured, "info", "Optional EASYAR_ACCOUNT_STATUS_ENDPOINT is configured."),
      check("license-validation-endpoint", auth.licenseValidationEndpointConfigured, "info", "Optional EASYAR_LICENSE_VALIDATE_ENDPOINT is configured."),
      check("downloads-endpoint", auth.downloadsEndpointConfigured, "info", "Optional EASYAR_DOWNLOADS_ENDPOINT is configured."),
      check("cloud-credentials-endpoint", auth.cloudCredentialsEndpointConfigured, "info", "Optional EASYAR_CLOUD_CREDENTIALS_ENDPOINT is configured.")
    ],
    unityAutomation: [
      check("unity-path", Boolean(requestedUnityPath), "warning", "EASYAR_UNITY_PATH or explicit unityPath is configured."),
      check("unity-executable", unityExecutableExists !== false, "warning", requestedUnityPath ? `Unity executable ${requestedUnityPath} exists.` : "Unity executable existence was not checked because no explicit path was provided."),
      check("project-path", projectPath ? project.hasAssets === true && project.hasPackagesManifest === true && project.hasProjectSettings === true : true, "warning", projectPath ? `Project path ${projectPath} has Unity structure.` : "No Unity project path was provided for deployment readiness.")
    ],
    scope: [
      check("focused-samples", focusedSamples().map((sample) => sample.id).join(",") === "image-tracking,cloud-recognition,mega", "blocker", "Focused run-through scope is Image Tracking, Cloud Recognition, and Mega."),
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
      "Keep Image Tracking, Cloud Recognition, and Mega as the active run-through scope until the user asks to continue."
    ]
  };
}

export async function readPackageMetadata(): Promise<{
  name: string | null;
  version: string | null;
  repository: string | null;
  binName: string | null;
  binPath: string | null;
  files: string[];
  private: boolean | null;
}> {
  try {
    const text = await readFirstExistingFile([
      path.join(packageRoot, "package.json"),
      path.join(process.cwd(), "package.json")
    ]);
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

export async function readFirstExistingFile(candidates: string[]): Promise<string> {
  let lastError: unknown = null;
  for (const candidate of candidates) {
    try {
      return await readFile(candidate, "utf8");
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export function check(id: string, ok: boolean, severity: ReadinessCheck["severity"], detail: string): ReadinessCheck {
  return {
    id,
    ok,
    severity,
    detail
  };
}

export async function fileContains(filePath: string, needle: string): Promise<boolean> {
  try {
    return (await readFile(filePath, "utf8")).includes(needle);
  } catch {
    return false;
  }
}

export function deploymentNextActions(
  blockers: ReadinessCheck[],
  warnings: ReadinessCheck[],
  auth: ReturnType<typeof readAuthConfig>,
  requestedUnityPath: string | null
): string[] {
  const actions = new Set<string>();
  if (!auth.hasToken) {
    actions.add("For local-key MVP, no MCP account token is required. Future official API deployments should provide service-managed authentication outside user chat.");
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
    actions.add("Run npm run release:check before tagging or publishing.");
  } else {
    actions.add("After fixing blockers, rerun easyar_deployment_readiness and CI before release.");
  }
  return Array.from(actions);
}

export async function buildProductionValidationReport(
  root: string | null,
  focusedEvidencePath: string | undefined,
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
  const focusedSampleNames = focused.map((sample) => sample.name).join(", ");
  const officialAccessReports = await Promise.all(focused.map((sample) => buildOfficialAccessReport(root, sample, platform, "unity-samples")));
  const focusedScopeStatus = root
    ? await buildFocusedScopeStatus(root, platform, maxScriptIssues, maxLogBytes, maxLogIssues)
    : focusedEvidencePath
      ? await readFocusedReleaseEvidence(focusedEvidencePath, platform)
      : null;
  const focusedEvidenceSource = root
    ? "unity-project"
    : focusedEvidencePath
      ? "release-evidence-file"
      : "not-provided";
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
      "npm run release:check has passed for the commit being released, and EASYAR_RELEASE_REQUIRE_PRODUCTION_READY=1 npm run release:check passes before the final release tag or npm publish.",
      verificationEvidence === "passed"
        ? "Caller recorded verificationEvidence=passed."
        : "No current verification evidence was provided to this report.",
      `Run and record: ${releaseManifest.verificationCommands.join("; ")}. Then regenerate with verificationEvidence=passed.`
    ),
    productionGate(
      "unity-project-evidence",
      "Unity focused sample evidence",
      Boolean(root) || Boolean(focusedScopeStatus?.allFocusedSamplesComplete),
      `A Unity project path or safe focused release evidence file is provided so ${focusedSampleNames} run-through evidence can be verified.`,
      root
        ? `Project path: ${root}.`
        : focusedScopeStatus
          ? `Evidence file: ${focusedEvidencePath}; source=${focusedEvidenceSource}.`
          : "No projectPath or focusedEvidencePath was provided.",
      "Provide projectPath locally, or set EASYAR_RELEASE_EVIDENCE_PATH to a safe JSON evidence file exported with easyar_write_release_evidence."
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
          : "Official access was not checked.",
        access?.nextActions[0] ?? `Run easyar_write_official_access_report projectPath=/path/to/UnityProject sampleId=${sample.id} platform=${platform}.`
      );
    }),
    productionGate(
      "focused-scope-run-through",
      `Focused ${focusedSampleNames} run-through`,
      Boolean(focusedScopeStatus?.allFocusedSamplesComplete),
      "All focused samples have COMPLETION_REPORT.md with runThroughComplete=true based on preflight, device validation, RUN_RESULT.md, and latest log evidence.",
      focusedScopeStatus
        ? focusedScopeStatus.allFocusedSamplesComplete
          ? "All focused samples are complete."
          : `${focusedScopeStatus.completedCount}/${focusedScopeStatus.focusedSampleCount} focused samples complete; blocked=${focusedScopeStatus.blockedCount}, failed=${focusedScopeStatus.failedCount}, notRun=${focusedScopeStatus.notRunCount}.`
        : "Focused scope status was not generated because no projectPath was provided.",
      focusedScopeStatus?.nextActions[0] ?? `Run easyar_write_focused_scope_status projectPath=/path/to/UnityProject platform=${platform}.`
    )
  ];
  const blockers = gates.filter((gate) => gate.required && !gate.ok);
  const productionReady = blockers.length === 0;
  const localKeyMvpReady = releaseManifest.readyForInstallDocs
    && verificationEvidence === "passed"
    && Boolean(focusedScopeStatus?.allFocusedSamplesComplete);

  return {
    generatedAt: new Date().toISOString(),
    productionReady,
    localKeyMvpReady,
    readinessModel: {
      localKeyMvp: `Ready when package/install docs, verification commands, and focused ${focusedSampleNames} run-through evidence pass. It uses locally configured EasyAR license/API keys after the official Unity Plugin is installed.`,
      productionOfficialApi: "Ready only when official EasyAR account/license/download/cloud endpoint env vars and focused official access checks pass."
    },
    projectPath: root,
    focusedEvidencePath: focusedEvidencePath ?? null,
    focusedEvidenceSource,
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
      note: `${focusedSampleNames} are in the active run-through scope.`
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
      "PREFLIGHT.md, DEVICE_VALIDATION.md, RUN_RESULT.md, and COMPLETION_REPORT.md for every focused sample",
      "FOCUSED_SCOPE_STATUS.md",
      "docs/release-evidence/focused-scope.<platform>.json for GitHub release runners that cannot access the Unity project",
      "Passing GitHub Actions or locally recorded verification commands"
    ],
    nextActions: productionReady
      ? [
          "Keep PRODUCTION_VALIDATION.md with the release/tag evidence.",
          "Publish or tag only the verified commit and keep secrets in environment variables or secret storage."
        ]
      : localKeyMvpReady
        ? [
            "Local-key MVP evidence is ready for focused Unity sample assistance.",
            "Keep official API endpoint integration as the remaining production automation work.",
            ...Array.from(new Set(blockers.map((blocker) => blocker.nextAction))).slice(0, 10)
          ]
        : Array.from(new Set(blockers.map((blocker) => blocker.nextAction))).slice(0, 12),
    security: "Production validation reports evidence status and redacted metadata only. They do not include EasyAR passwords, verification codes, account tokens, license keys, appKey, appSecret, signing keys, provisioning secrets, or raw private logs."
  };
}

export function productionGate(
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

export async function buildAccountOnboardingReport(
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

export function buildFirstRunAccountGuide(
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

export function deriveAccountOnboardingStage(
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

export function buildAccountHumanSteps(
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

export function buildAccountMcpSteps(
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

export function buildAccountOnboardingBlockers(
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
      detail: "Official MCP account authentication is not configured.",
      action: "For local-key MVP, ignore this and continue with browser login/download/key creation on the EasyAR website. Do not ask users for EASYAR_API_TOKEN."
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

export function buildAccountOnboardingNextActions(
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

export async function buildAccountMaterialsReport(
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
          },
          {
            id: "cloud-target-library",
            label: "Cloud Recognition target library",
            required: false,
            requiredForDeviceRun: true,
            present: false,
            source: "EasyAR development center Cloud Recognition management page. Create a cloud recognition image library, upload at least one target image, and make sure the target is enabled for the selected AppId/API KEY.",
            storeIn: "EasyAR official account; optionally record only the non-secret library name or dashboard URL in run evidence.",
            sharePolicy: "Do not share API keys or secrets. A library name, target count, or dashboard URL is usually acceptable for private support artifacts; review before posting publicly.",
            mcpCheck: "easyar_discover_cloud_credentials targetLibraryCount or manual account-page confirmation"
          },
          {
            id: "cloud-test-target-image",
            label: "Cloud Recognition test target image",
            required: false,
            requiredForDeviceRun: true,
            present: false,
            source: "A printed or screen-displayed image that has already been uploaded to the EasyAR Cloud Recognition target library.",
            storeIn: "Physical test setup or local private test assets; do not commit private customer target images unless they are intended test fixtures.",
            sharePolicy: "Share only non-sensitive target names or screenshots cleared for support. Do not attach private customer imagery to public issues.",
            mcpCheck: "DEVICE_VALIDATION.md real-device evidence"
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

export function accountMaterialNextAction(
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
  if (item.id === "cloud-target-library") {
    return "Create a Cloud Recognition image library in the EasyAR development center, upload at least one target image, and keep a non-secret library name or dashboard URL for device evidence.";
  }
  if (item.id === "cloud-test-target-image") {
    return "Prepare a physical or screen-displayed target image that is already uploaded to the Cloud Recognition library before running the device test.";
  }
  if (item.id.startsWith("cloud-")) {
    return `Create or locate the Cloud Recognition/CRS credentials in the official account and fill the required cloud fields in ${localConfigPath}.`;
  }
  if (item.id === "bundle-identifier") {
    return `Choose the Unity package/bundle identifier and make it match the EasyAR license configuration in ${localConfigPath}.`;
  }
  return `Prepare ${item.label} from the official EasyAR account flow and store it in ${item.storeIn}.`;
}

export async function readOfficialOpenApiContract(): Promise<{
  openapi?: string;
  info?: { title?: string };
  paths?: Record<string, unknown>;
}> {
  return JSON.parse(await readFile(officialOpenApiPath, "utf8"));
}

export function buildOfficialApiContract(baseUrl: string | undefined, includeExamples: boolean) {
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
    authorizationBoundary: {
      localKeyMvp: "Unity sample execution can run after the user installs the official EasyAR Sense Unity Plugin and fills local license/API key material in the Unity project. Website login is not needed at Unity runtime.",
      whyOfficialSupportIsRequired: [
        "Account status is authoritative only inside the EasyAR account system; MCP cannot prove registration, account state, organization membership, or product entitlement from local files.",
        "License validation must be checked against EasyAR server-side license records to prove product, platform, expiration, and Unity bundle/package identifier compatibility.",
        "Download discovery must respect EasyAR login, entitlement, enterprise, and rate-limit gates; MCP must not invent private download URLs or reuse browser sessions.",
        "Cloud Recognition credential discovery belongs to the user's EasyAR cloud project; MCP should receive only metadata and presence flags unless the user stores runtime keys locally."
      ],
      notAccepted: [
        "Scraping EasyAR website pages or browser cookies as a production authorization mechanism.",
        "Asking users to paste EasyAR website passwords, verification codes, account tokens, license keys, API KEY/API Secret, appKey, or appSecret into chat.",
        "Treating local config presence as proof of account entitlement or private download authorization."
      ],
      acceptedFallback: "When official API endpoints are not available, use browser-only handoff plus local-key validation. MCP records account stage and non-secret evidence, while the user obtains plugin/key materials from the official EasyAR website."
    },
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

export function officialApiEndpointContract(input: {
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

export async function buildAuthorizationStrategyReport(
  root: string | null,
  sample: SampleInfo,
  platform: "android" | "ios" | "standalone" | "unknown",
  accountStage: AccountStage,
  preferredMode: AuthorizationMode
) {
  const auth = readAuthConfig();
  const localConfig = root ? await buildLocalConfigValidationReport(root) : null;
  const cloudConfig = root ? await readCloudRecognitionConfig(root) : {};
  const needsCloudRecognition = sample.id === "cloud-recognition";
  const derivedStage = deriveAccountOnboardingStage(accountStage, auth, localConfig, cloudConfig, needsCloudRecognition);
  const localLicenseReady = localConfig?.checks.some((check) => check.id === "license-key" && check.ok) ?? false;
  const localCloudReady = !needsCloudRecognition || hasCompleteCloudRecognitionConfig(cloudConfig);
  const officialApiReady = auth.hasToken
    && auth.accountStatusEndpointConfigured
    && auth.licenseValidationEndpointConfigured
    && auth.downloadsEndpointConfigured
    && auth.cloudCredentialsEndpointConfigured;
  const localKeyReady = localLicenseReady && localCloudReady;
  const portalReadyForKeyCollection = ["logged-in", "has-license", "has-cloud-credentials"].includes(derivedStage) || localLicenseReady;
  const selectedMode = chooseAuthorizationMode(preferredMode, officialApiReady, localKeyReady, portalReadyForKeyCollection);
  const nextActions = authorizationStrategyNextActions(selectedMode, root, sample, platform, needsCloudRecognition, officialApiReady, localKeyReady, portalReadyForKeyCollection);

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      needsCloudRecognition
    },
    platform,
    requestedMode: preferredMode,
    selectedMode,
    accountStage: {
      requested: accountStage,
      derived: derivedStage
    },
    productionReady: officialApiReady,
    focusedUnityRunReadyWithoutOfficialApi: localKeyReady,
    keyModel: {
      statement: "After the official EasyAR Sense Unity Plugin is installed in Unity, focused sample execution is driven by local EasyAR license/API key configuration; users do not need to log in to www.easyar.cn at Unity runtime.",
      accountUse: "The EasyAR website account is still used to obtain authorized plugin packages, license keys, and Cloud Recognition/CRS AppId/API KEY materials.",
      mcpUse: "mcp-easyar guides the user to store those materials locally and validates presence/redacted readiness without collecting passwords or secret values in chat."
    },
    noBypassPolicy: {
      allowed: false,
      statement: "mcp-easyar must not bypass EasyAR login, license, download, Cloud Recognition, enterprise, or rate-limit gates.",
      forbiddenApproaches: [
        "Scraping or reusing browser login sessions/cookies.",
        "Guessing private EasyAR backend endpoints.",
        "Minting or exposing unauthorized SDK/sample download URLs.",
        "Asking users to paste website passwords, verification codes, account tokens, license keys, API KEY/API Secret, appKey, or appSecret into chat.",
        "Embedding EasyAR account materials in source code, GitHub issues, CI logs, Unity logs, APKs, or npm package files."
      ],
      safeAlternatives: [
        "Local key mode for Unity sample execution after authorized plugin/key setup.",
        "Official API mode for future production automation of account status, entitlement, and downloads.",
        "Local authorized package import after the user downloads packages through their EasyAR account.",
        "Local stub mode for backend contract wiring only."
      ]
    },
    modes: {
      localKey: {
        ready: localKeyReady,
        purpose: "Primary MVP/internal path for Unity execution after the user has installed the official plugin and filled local keys.",
        requires: [
          "Official EasyAR Sense Unity Plugin installed in the Unity project.",
          "ProjectSettings/EasyAR/easyar.local.json contains a matching EasyAR license key and bundle/package identifier.",
          ...(needsCloudRecognition ? ["Cloud Recognition appId/serverAddress/apiKey/apiSecret are filled locally from the EasyAR account page."] : [])
        ],
        enables: [
          "MCP can validate local config presence without printing values.",
          "MCP can prepare/import Unity assets.",
          "MCP can build, install, and help verify focused samples on a real device."
        ],
        limitations: [
          "Does not automatically download private packages.",
          "Does not remotely prove account entitlement without official API responses.",
          "Production auto-distribution/release gate still remains blocked on official API readiness."
        ]
      },
      officialApi: {
        ready: officialApiReady,
        purpose: "Future production account-scoped automation for registered EasyAR users.",
        requires: [
          "EASYAR_API_TOKEN issued or validated by official EasyAR account infrastructure.",
          "EASYAR_ACCOUNT_STATUS_ENDPOINT",
          "EASYAR_LICENSE_VALIDATE_ENDPOINT",
          "EASYAR_DOWNLOADS_ENDPOINT",
          "EASYAR_CLOUD_CREDENTIALS_ENDPOINT"
        ],
        enables: [
          "Account status checks.",
          "License validation.",
          "Authorized SDK/sample package discovery.",
          "Cloud Recognition credential presence checks."
        ],
        limitations: officialApiReady
          ? ["Still must not return raw secrets or unauthorized download URLs."]
          : ["Not ready until EasyAR official account API endpoints and token validation are configured."]
      },
      manualBrowser: {
        ready: portalReadyForKeyCollection,
        purpose: "Browser-only handoff for obtaining authorized plugin/key materials when official API endpoints are not available.",
        requires: [
          "User registers/logs in only through https://www.easyar.cn/ in a browser.",
          "User creates/locates license and Cloud Recognition materials in the EasyAR development center.",
          "User stores values locally in ProjectSettings/EasyAR/easyar.local.json or environment/secret storage."
        ],
        enables: [
          "Transitions into local-key mode.",
          "Avoids website password or verification-code handling by MCP."
        ],
        limitations: [
          "MCP cannot prove account entitlement to downloads without official API responses.",
          "MCP cannot distribute private SDK/sample packages automatically."
        ]
      },
      localPackages: {
        ready: localKeyReady,
        purpose: "Use officially downloaded local Unity packages and samples without account API calls.",
        requires: [
          "Official EasyAR Unity Plugin and samples were downloaded/imported by the registered user.",
          "Local config has a matching license key and bundle/package identifier.",
          ...(needsCloudRecognition ? ["Cloud Recognition service config is filled locally."] : [])
        ],
        enables: [
          "Focused preflight.",
          "Unity compile/build automation.",
          "Real-device run result recording."
        ],
        limitations: [
          "Does not replace official download authorization.",
          "Does not validate account entitlement remotely."
        ]
      },
      stub: {
        ready: true,
        purpose: "Backend/gateway contract wiring before real EasyAR services exist.",
        requires: [
          "npm run official-api:stub in a local shell.",
          "Endpoint env vars exported from the stub output.",
          "A fixture token only for local validation."
        ],
        enables: [
          "Canary/client routing tests.",
          "Endpoint schema compatibility checks."
        ],
        limitations: [
          "Not a production account service.",
          "Must not be deployed as a real authorization backend.",
          "Does not prove any real EasyAR user entitlement."
        ]
      }
    },
    recommendedToolSequence: authorizationStrategyToolSequence(selectedMode, root, sample, platform),
    nextActions,
    security: "This strategy contains policy, readiness flags, and tool calls only. It does not include EasyAR passwords, verification codes, account tokens, license keys, Cloud Recognition API KEY/API Secret values, appKey, appSecret, signing keys, provisioning secrets, APKs, Unity packages, or raw logs."
  };
}

export function chooseAuthorizationMode(
  preferredMode: AuthorizationMode,
  officialApiReady: boolean,
  localKeyReady: boolean,
  portalReadyForKeyCollection: boolean
): Exclude<AuthorizationMode, "auto"> {
  if (preferredMode !== "auto") {
    return preferredMode;
  }
  if (officialApiReady) {
    return "official-api";
  }
  if (localKeyReady) {
    return "local-key";
  }
  if (portalReadyForKeyCollection) {
    return "manual-browser";
  }
  return "manual-browser";
}

export function authorizationStrategyToolSequence(
  selectedMode: Exclude<AuthorizationMode, "auto">,
  root: string | null,
  sample: SampleInfo,
  platform: "android" | "ios" | "standalone" | "unknown"
) {
  const projectPath = root ?? "/path/to/UnityProject";
  if (selectedMode === "official-api") {
    return [
      { tool: "easyar_auth_status", arguments: {} },
      { tool: "easyar_check_official_access", arguments: { projectPath, sampleId: sample.id, platform } },
      { tool: "easyar_write_official_access_report", arguments: { projectPath, sampleId: sample.id, platform } },
      { tool: "easyar_next_workflow_step", arguments: { projectPath, sampleId: sample.id, platform } }
    ];
  }
  if (selectedMode === "stub") {
    return [
      { command: "npm run official-api:stub" },
      { command: "npm run official-api:canary" },
      { tool: "easyar_write_official_api_handoff", arguments: { workspacePath: "/path/to/mcp-easyar", deploymentTarget: "staging" } }
    ];
  }
  return [
    { tool: "easyar_account_onboarding", arguments: { projectPath, sampleId: sample.id, platform, accountStage: "not-registered" } },
    { tool: "easyar_write_local_config_handoff", arguments: { projectPath, sampleId: sample.id, platform, accountStage: "logged-in" } },
    { tool: "easyar_validate_local_config", arguments: { projectPath } },
    { tool: "easyar_write_import_checklist", arguments: { projectPath, sampleId: sample.id, platform } },
    { tool: "easyar_next_workflow_step", arguments: { projectPath, sampleId: sample.id, platform } }
  ];
}

export function authorizationStrategyNextActions(
  selectedMode: Exclude<AuthorizationMode, "auto">,
  root: string | null,
  sample: SampleInfo,
  platform: "android" | "ios" | "standalone" | "unknown",
  needsCloudRecognition: boolean,
  officialApiReady: boolean,
  localKeyReady: boolean,
  portalReadyForKeyCollection: boolean
) {
  const projectPath = root ?? "/path/to/UnityProject";
  const actions: string[] = [];
  if (!officialApiReady) {
    actions.push("Treat official API work as future production automation; do not bypass EasyAR account/download gates.");
  }
  if (selectedMode === "official-api") {
    actions.push(`Run easyar_check_official_access projectPath=${projectPath} sampleId=${sample.id} platform=${platform}.`);
    actions.push("Run npm run official-api:canary with a registered EasyAR test account before enabling strict production release.");
  } else if (selectedMode === "stub") {
    actions.push("Run npm run official-api:stub only for local contract wiring; never deploy it as production authorization.");
    actions.push("Replace stub routes with official EasyAR account/license/download/cloud services before release.");
  } else {
    if (!portalReadyForKeyCollection) {
      actions.push("Start with easyar_account_onboarding accountStage=not-registered and guide the user through browser-only registration/login to obtain plugin/key materials.");
    }
    actions.push(`Write local handoff: easyar_write_local_config_handoff projectPath=${projectPath} sampleId=${sample.id} platform=${platform}.`);
    actions.push("Have the user fill ProjectSettings/EasyAR/easyar.local.json locally, then run easyar_validate_local_config.");
    actions.push("Install/import only packages obtained through the user's authorized EasyAR account or official public download page.");
    if (needsCloudRecognition && !localKeyReady) {
      actions.push("For Cloud Recognition, fill the official CRS/Cloud Recognition AppId, serverAddress, API KEY, and API Secret locally.");
    }
    actions.push(`Continue with easyar_next_workflow_step projectPath=${projectPath} sampleId=${sample.id} platform=${platform}.`);
  }
  return Array.from(new Set(actions));
}

export function buildOfficialApiHandoff(baseUrl: string | undefined, includeCurl: boolean, deploymentTarget: string | undefined) {
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
    whyOfficialSupportIsRequired: contract.authorizationBoundary,
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

export function officialApiBackendTodo(endpointId: string): string {
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

export function officialApiEndpointAcceptance(endpointId: string): string[] {
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
      "Configured Cloud Recognition app returns appId plus serverAddress and apiKeyPresent/apiSecretPresent flags.",
      "Response never includes raw API KEY/API Secret, appKey, or appSecret values."
    ];
  }
  return ["Endpoint passes its required response fields and redaction policy."];
}

export function officialApiCanaryCommand(endpoint: ReturnType<typeof officialApiEndpointContract>): string {
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

export function buildOfficialApiContractExamples(baseUrl: string) {
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

export async function buildOfficialAccessReport(
  root: string | null,
  sample: SampleInfo,
  platform: "android" | "ios" | "standalone" | "unknown",
  packageKind: "unity-plugin" | "unity-samples" | "native-sdk" | "xr-extension" | "unknown"
) {
  const auth = readAuthConfig();
  const unityVersion = root
    ? await readUnityVersion(root)
    : envFirst(["EASYAR_UNITY_VERSION", "UNITY_VERSION"]) ?? "2022.3.62f3";
  const localConfig = root
    ? await readLocalConfigForRemoteValidation(root)
    : readRemoteValidationConfigFromEnv(sample);
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
    officialAccessCheck("api-token", auth.hasToken, true, "Official production authentication is configured for account-scoped requests.", auth.hasToken ? "Authentication material is present and redacted." : "Official production authentication is not configured; local-key MVP can proceed without it."),
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
      bundleIdentifier: localConfig.bundleIdentifier ?? null,
      source: root ? "project-local-config" : "environment"
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

export function readRemoteValidationConfigFromEnv(sample: SampleInfo): {
  licenseKey?: string;
  bundleIdentifier?: string;
} {
  return {
    licenseKey: envFirst(["EASYAR_LICENSE_KEY", "EASYAR_SENSE_LICENSE_KEY"]),
    bundleIdentifier: envFirst(["EASYAR_BUNDLE_IDENTIFIER", "EASYAR_UNITY_BUNDLE_IDENTIFIER"]) ?? defaultBundleIdentifier(sample)
  };
}

export function officialAccessCheck(id: string, ok: boolean, required: boolean, summary: string, detail: string) {
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

export function officialAccessRemoteCheck(id: string, required: boolean, result: Awaited<ReturnType<typeof easyarApi.checkAccount>>) {
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

export async function buildPortalEvidenceReport(input: {
  root: string | null;
  sample: SampleInfo;
  platform: "android" | "ios" | "standalone" | "unknown";
  accountName?: string;
  apiKeyRecordId?: string;
  apiKeyAppName?: string;
  apiKeyCreatedAt?: string;
  cloudServicesEnabled: Array<"cloud-recognition" | "spatialmap" | "mega-landmark" | "ar-operations" | "mega-block" | "other">;
  apiKeyPresent?: boolean;
  apiSecretPresent?: boolean;
  tokenStatus: "not-checked" | "not-needed" | "present" | "missing" | "expired" | "unknown";
  senseLicenseStatus: "not-checked" | "present" | "missing" | "unknown";
  senseLicenseRecordId?: string;
  cloudLibraryStatus: "not-checked" | "present" | "missing" | "unknown";
  cloudLibraryName?: string;
  cloudLibraryRecordId?: string;
  cloudTargetCount?: number;
  portalUrl?: string;
  notes: string[];
}) {
  const needsCloudRecognition = input.sample.id === "cloud-recognition";
  const localConfig = input.root ? await buildLocalConfigValidationReport(input.root) : null;
  const cloudConfig = input.root ? await readCloudRecognitionConfig(input.root) : {};
  const localConfigForRemote = input.root ? await readLocalConfigForRemoteValidation(input.root) : {};
  const hasCloudLibrary = input.cloudLibraryStatus === "present";
  const hasCloudTargets = typeof input.cloudTargetCount === "number" && input.cloudTargetCount > 0;
  const cloudServiceEnabled = input.cloudServicesEnabled.includes("cloud-recognition");
  const localCloudReady = !needsCloudRecognition || (
    isNonPlaceholderString(cloudConfig.appId)
    && (
      isNonPlaceholderString(cloudConfig.apiKey)
      || (isNonPlaceholderString(cloudConfig.appKey) && isNonPlaceholderString(cloudConfig.appSecret))
    )
  );
  const localLicenseReady = localConfig
    ? localConfig.checks.some((check) => check.id === "license-key" && check.ok)
    : false;
  const blockers = [
    portalEvidenceBlocker(
      "sense-license",
      input.senseLicenseStatus !== "missing",
      "Sense License record is missing in the observed portal page.",
      "Create or locate the EasyAR Sense license bound to the Unity bundle/package identifier."
    ),
    portalEvidenceBlocker(
      "local-license-config",
      !input.root || localLicenseReady,
      "Local easyar.local.json does not have a valid EasyAR license presence check.",
      "Fill easyar.licenseKey locally, then run easyar_validate_local_config."
    ),
    portalEvidenceBlocker(
      "cloud-service-enabled",
      !needsCloudRecognition || cloudServiceEnabled,
      "Cloud Recognition is not listed as enabled for the observed API KEY app.",
      "Enable Cloud Recognition for the API KEY app in the EasyAR development center."
    ),
    portalEvidenceBlocker(
      "cloud-api-key-presence",
      !needsCloudRecognition || input.apiKeyPresent === true,
      "Portal API KEY presence was not confirmed.",
      "Confirm the API KEY field exists in the portal, but do not paste the value into MCP chat."
    ),
    portalEvidenceBlocker(
      "cloud-api-secret-presence",
      !needsCloudRecognition || input.apiSecretPresent === true,
      "Portal API Secret presence was not confirmed.",
      "Confirm the API Secret field exists in the portal, but do not paste the value into MCP chat."
    ),
    portalEvidenceBlocker(
      "local-cloud-config",
      !input.root || localCloudReady,
      "Local Cloud Recognition credentials are not complete for the focused sample.",
      "Fill easyar.cloudRecognition.appId, serverAddress, apiKey, and apiSecret locally, then validate local config."
    ),
    portalEvidenceBlocker(
      "cloud-library",
      !needsCloudRecognition || hasCloudLibrary,
      "No Cloud Recognition image library was observed.",
      "Create a Cloud Recognition image library in the EasyAR development center."
    ),
    portalEvidenceBlocker(
      "cloud-target-image",
      !needsCloudRecognition || hasCloudTargets,
      "No uploaded Cloud Recognition target image count was observed.",
      "Upload at least one test target image to the Cloud Recognition library before device validation."
    )
  ].filter((blocker) => !blocker.ok);
  const readyForLocalConfig = input.root ? Boolean(localConfig?.valid) : false;
  const readyForCloudDeviceValidation = !needsCloudRecognition || (readyForLocalConfig && cloudServiceEnabled && hasCloudLibrary && hasCloudTargets);

  return {
    generatedAt: new Date().toISOString(),
    projectPath: input.root,
    sample: {
      id: input.sample.id,
      name: input.sample.name
    },
    platform: input.platform,
    portal: {
      accountName: sanitizePortalText(input.accountName),
      portalUrl: sanitizePortalUrl(input.portalUrl),
      apiKeyRecordId: sanitizePortalId(input.apiKeyRecordId),
      apiKeyAppName: sanitizePortalText(input.apiKeyAppName),
      apiKeyCreatedAt: sanitizePortalText(input.apiKeyCreatedAt),
      cloudServicesEnabled: input.cloudServicesEnabled,
      apiKeyPresent: input.apiKeyPresent ?? null,
      apiSecretPresent: input.apiSecretPresent ?? null,
      tokenStatus: input.tokenStatus,
      senseLicenseStatus: input.senseLicenseStatus,
      senseLicenseRecordId: sanitizePortalId(input.senseLicenseRecordId),
      cloudLibraryStatus: input.cloudLibraryStatus,
      cloudLibraryName: sanitizePortalText(input.cloudLibraryName),
      cloudLibraryRecordId: sanitizePortalId(input.cloudLibraryRecordId),
      cloudTargetCount: input.cloudTargetCount ?? null
    },
    localConfig: input.root
      ? {
          path: path.join(input.root, "ProjectSettings", "EasyAR", "easyar.local.json"),
          valid: localConfig?.valid ?? false,
          licenseKeyPresent: localLicenseReady,
          bundleIdentifier: localConfigForRemote.bundleIdentifier ?? null,
          cloudRecognition: {
            appIdPresent: isNonPlaceholderString(cloudConfig.appId),
            apiKeyPresent: isNonPlaceholderString(cloudConfig.apiKey),
            apiSecretPresent: isNonPlaceholderString(cloudConfig.apiSecret),
            appKeyPresent: isNonPlaceholderString(cloudConfig.appKey),
            appSecretPresent: isNonPlaceholderString(cloudConfig.appSecret)
          }
        }
      : null,
    readyForLocalConfig,
    readyForCloudDeviceValidation,
    blockers,
    notes: input.notes.map((note) => sanitizePortalText(note)).filter((note): note is string => Boolean(note)),
    nextActions: blockers.length > 0
      ? Array.from(new Set(blockers.map((blocker) => blocker.action)))
      : [
          "Portal evidence and local config presence are sufficient for the focused account-material handoff.",
          "Continue with easyar_write_focused_preflight and the Unity compile/build/device validation sequence."
        ],
    security: "Portal evidence stores only non-secret ids, names, service flags, presence booleans, counts, and redacted notes. It must not include EasyAR passwords, verification codes, API KEY values, API Secret values, license keys, appKey, appSecret, tokens, signing keys, or private account data."
  };
}

export function portalEvidenceBlocker(id: string, ok: boolean, detail: string, action: string) {
  return {
    id,
    ok,
    detail,
    action
  };
}

export function sanitizePortalText(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const redacted = redactSecretText(value.trim())
    .replace(/\b[A-Fa-f0-9]{24,}\b/g, "<redacted>")
    .replace(/\b[A-Za-z0-9+/=_-]{40,}\b/g, "<redacted>");
  if (looksLikeStandaloneSecret(redacted)) {
    return "<redacted>";
  }
  return redacted;
}

export function sanitizePortalId(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!/^[A-Za-z0-9._:-]{1,64}$/.test(trimmed) || looksLikeStandaloneSecret(trimmed)) {
    return "<redacted>";
  }
  return trimmed;
}

export function sanitizePortalUrl(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  try {
    const parsed = new URL(value);
    parsed.search = "";
    parsed.hash = "";
    return redactSecretText(parsed.toString());
  } catch {
    return sanitizePortalText(value);
  }
}

export function looksLikeStandaloneSecret(value: string): boolean {
  if (value === "<redacted>") {
    return false;
  }
  return /^(?:[A-Fa-f0-9]{24,}|[A-Za-z0-9+/=_-]{40,})$/.test(value);
}

export async function buildClientSetupReport(
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
    ...(includeTokenPlaceholder ? { EASYAR_API_TOKEN: "official_api_token_from_secret_store" } : {})
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
    clientSetupCheck("api-token-placeholder", true, false, includeTokenPlaceholder ? "Generated config includes an advanced official-API token placeholder." : "Generated config omits official account token fields for local-key MVP users."),
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

export function clientConfigDestination(client: typeof clientKinds[number]): string {
  if (client === "claude-desktop") {
    return "Claude Desktop MCP settings JSON, usually claude_desktop_config.json.";
  }
  if (client === "codex") {
    return "Codex MCP configuration for this workspace or user profile.";
  }
  return "Any stdio MCP client configuration that accepts command, args, and env fields.";
}

export function buildClientAcceptanceChecklist(client: typeof clientKinds[number], entrypointMode: typeof clientEntrypointModes[number]) {
  return [
    "The generated config is pasted into the selected client config location.",
    "Real EasyAR endpoint and token values are stored in client environment/secret storage, not committed files.",
    entrypointMode === "local-dist"
      ? "The local repository has run npm install and npm run build; dist/index.js exists at the configured absolute path."
      : entrypointMode === "package-bin"
        ? "The easyar-mcp binary is available on the PATH used by the MCP client."
        : "After npm publishing, the client machine can run npx -y mcp-easyar with network access to the npm registry.",
    `${client} has been restarted after editing MCP configuration.`,
    "easyar_server_status returns server name mcp-easyar and lists focused samples.",
    "easyar://acceptance/fresh-project is readable and confirms the fresh Unity project acceptance scope.",
    "easyar_auth_status reports only presence/redacted endpoint state and does not print secret values.",
    "easyar_account_onboarding or easyar_write_local_config_handoff is the first user-facing EasyAR workflow call."
  ];
}

export function buildClientFirstSmokeCalls() {
  return [
    "easyar_server_status",
    "Read MCP resource easyar://acceptance/fresh-project",
    "easyar_auth_status",
    "easyar_authorization_strategy preferredMode=auto sampleId=cloud-recognition",
    "easyar_list_samples",
    "easyar_account_onboarding accountStage=not-registered sampleId=cloud-recognition",
    "easyar_check_client_setup"
  ];
}

export function buildClientTroubleshooting(client: typeof clientKinds[number], entrypointMode: typeof clientEntrypointModes[number]) {
  return [
    "If the client cannot start the server, copy the Command and Args from this report and run them in a terminal.",
    entrypointMode === "local-dist"
      ? "If local-dist fails, rerun npm install && npm run build and confirm the serverPath is absolute."
      : entrypointMode === "package-bin"
        ? "If package-bin fails, run easyar-mcp-check from the same shell environment used to launch the MCP client."
        : "If npx fails after npm publishing, check npm registry access and try npx -y mcp-easyar in a terminal. Before npm publishing, use the GitHub Release package profile.",
    "If tools/list is empty, restart the MCP client and verify the JSON nesting under mcpServers/easyar.",
    "If official account calls fail, local-key MVP users can ignore them; production deployments should check official endpoint env vars and service-managed authentication.",
    `${client} logs should be inspected only for startup errors; remove any copied private token or license values before sharing logs.`
  ];
}

export function clientSetupCheck(id: string, ok: boolean, required: boolean, detail: string) {
  return {
    id,
    ok,
    required,
    detail
  };
}

export function clientSetupAction(id: string): string {
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

export async function buildReleaseManifest() {
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
    "docs/openapi/easyar-mcp-account-api.openapi.json",
    "docs/release-evidence/focused-scope.android.json",
    "docs/release-notes/local-key-mvp.md",
    "docs/CLIENT_ACCEPTANCE.md",
    "docs/FRESH_PROJECT_ACCEPTANCE.md",
    "docs/client-setup.md",
    "docs/install-from-github-release.md",
    "docs/REMAINING_WORK.md",
    "docs/ROADMAP.md",
    "docs/FULL_GOAL_PLAN.md",
    "docs/STATUS.md",
    "docs/RELEASE_MANIFEST.md",
    "docs/troubleshooting.md",
    "assets/easyar-icon.png",
    "dist/index.js",
    "dist/easyar-api.js",
    ".github/ISSUE_TEMPLATE/focused-sample-run.yml",
    ".github/workflows/ci.yml",
    ".github/workflows/github-release.yml",
    ".github/workflows/release.yml"
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
      availability: "development checkout",
      clientConfigCall: "easyar_generate_client_config client=claude-desktop entrypointMode=local-dist serverPath=/absolute/path/to/mcp-easyar/dist/index.js"
    },
    {
      id: "github-release-package",
      label: "GitHub Release package",
      commands: [`npm install -g https://github.com/terri1982/mcp-easyar/releases/download/${currentGitHubReleaseTag}/mcp-easyar-${serverVersion}.tgz`, "easyar-mcp-check"],
      entrypointMode: "package-bin",
      availability: "current public prerelease path",
      clientConfigCall: "easyar_generate_client_config client=claude-desktop entrypointMode=package-bin"
    },
    {
      id: "global-package",
      label: "Global npm package after npm publish",
      commands: [`npm install -g ${packageJson.name ?? serverName}`],
      entrypointMode: "package-bin",
      availability: "post-npm-publish only",
      clientConfigCall: "easyar_generate_client_config client=claude-desktop entrypointMode=package-bin"
    },
    {
      id: "npx-package",
      label: "npx package after npm publish",
      commands: [`npx -y ${packageJson.name ?? serverName}`],
      entrypointMode: "npx",
      availability: "post-npm-publish only",
      clientConfigCall: "easyar_generate_client_config client=claude-desktop entrypointMode=npx"
    }
  ];
  const verificationCommands = [
    "npm run typecheck",
    "npm test",
    "npm run bin:smoke",
    "npm run install:check",
    "npm run package:smoke",
    "npm run pack:check",
    "npm run security:check",
    "npm run release:check",
    "EASYAR_RELEASE_EVIDENCE_PATH=docs/release-evidence/focused-scope.android.json EASYAR_RELEASE_PLATFORM=android npm run release:check",
    "EASYAR_RELEASE_REQUIRE_LOCAL_KEY_MVP=1 EASYAR_RELEASE_EVIDENCE_PATH=docs/release-evidence/focused-scope.android.json EASYAR_RELEASE_PLATFORM=android npm run release:check",
    "EASYAR_RELEASE_REQUIRE_PRODUCTION_READY=1 npm run release:check"
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
      label: "npx package after npm publish",
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
    readinessModel: {
      localKeyMvp: "Ready for focused Image Tracking, Cloud Recognition, and Mega assistance when package/install docs pass, verification commands pass, and safe Android focused-scope evidence is provided.",
      productionOfficialApi: "Ready only after EasyAR account, license, downloads, and Cloud Recognition endpoint variables are connected to authorized EasyAR services and focused official access checks pass.",
      unityRuntime: "After the official EasyAR Sense Unity Plugin is installed, Unity-side sample execution uses local license/API key configuration and does not require website login at runtime."
    },
    releaseWorkflows: [
      {
        id: "github-local-key-mvp",
        workflow: "GitHub Release",
        gate: "local-key-mvp",
        purpose: "Validate focused evidence and upload an npm-compatible tarball to GitHub Releases before npm publishing."
      },
      {
        id: "npm-production",
        workflow: "Release",
        gate: "production",
        purpose: "Publish to npm with provenance only after official EasyAR endpoint integration is production-ready."
      }
    ],
    installCommands,
    installProfiles,
    verificationCommands,
    publishedAssetVerification: [
      "npm run github-release:smoke"
    ],
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
      "EASYAR_UNITY_PATH",
      "EASYAR_RELEASE_PROJECT_PATH",
      "EASYAR_RELEASE_EVIDENCE_PATH",
      "EASYAR_RELEASE_PLATFORM"
    ],
    validationEnvironment: [
      "EASYAR_RELEASE_REQUIRE_LOCAL_KEY_MVP",
      "EASYAR_RELEASE_REQUIRE_PRODUCTION_READY",
      "EASYAR_UNITY_VERSION",
      "EASYAR_BUNDLE_IDENTIFIER",
      "EASYAR_LICENSE_KEY",
      "EASYAR_CANARY_PROJECT_PATH",
      "EASYAR_CANARY_PLATFORM",
      "EASYAR_STUB_HOST",
      "EASYAR_STUB_PORT",
      "EASYAR_STUB_TOKEN"
    ],
    firstCalls: [
      "easyar_server_status",
      "easyar_release_manifest",
      "easyar_authorization_strategy",
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
          "Use the manual GitHub Actions GitHub Release workflow for local-key MVP GitHub distribution.",
          "Use the manual GitHub Actions Release workflow for npm publishing after configuring the protected npm-publish environment.",
          "Use easyar_check_client_setup to validate the MCP client config path or selected package/npx entrypoint before giving it to Codex or Claude.",
          "Keep official EasyAR account tokens and Cloud Recognition credentials out of committed config files."
        ],
    security: "The release manifest is safe to commit. It lists required environment variable names and placeholder commands, not secret values."
  };
}

export async function buildOnboardingReport(input: {
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

export async function buildFirstRunGuide(input: {
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
    path.join("Assets", "EasyARGenerated", "PORTAL_EVIDENCE.md"),
    path.join("Assets", "EasyARGenerated", "LOCAL_CONFIG_HANDOFF.md"),
    path.join("Assets", "EasyARGenerated", "PROJECT_HANDOFF.md"),
    path.join("Assets", "EasyARGenerated", input.sample.id, "PREFLIGHT.md")
  ];
  const firstCalls = [
    `easyar_write_authorization_strategy projectPath=${input.root ?? "/path/to/UnityProject"} preferredMode=auto sampleId=${input.sample.id} platform=${input.platform}`,
    `easyar_write_first_run_guide projectPath=${input.root ?? "/path/to/UnityProject"} accountStage=${accountOnboarding.stage} sampleId=${input.sample.id} platform=${input.platform}`,
    `easyar_write_account_onboarding projectPath=${input.root ?? "/path/to/UnityProject"} accountStage=${accountOnboarding.stage} sampleId=${input.sample.id} platform=${input.platform}`,
    `easyar_write_account_materials projectPath=${input.root ?? "/path/to/UnityProject"} sampleId=${input.sample.id} platform=${input.platform}`,
    `easyar_write_portal_evidence projectPath=${input.root ?? "/path/to/UnityProject"} sampleId=${input.sample.id} platform=${input.platform}`,
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
      note: "Current run-through work is intentionally limited to Image Tracking, Cloud Recognition, and Mega until the user asks to continue other samples."
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

export function firstRunTopNextCall(
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

export async function buildProjectHandoff(input: {
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

export async function buildRemainingWorkReport(input: {
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
    undefined,
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
  const localKeyMvpCategories = categories.filter((category) => category.id !== "official-easyar-account-api");
  const localKeyMvpEarned = localKeyMvpCategories.reduce((total, category) => total + category.earnedWeight, 0);
  const localKeyMvpTotal = localKeyMvpCategories.reduce((total, category) => total + category.weight, 0);
  const localKeyMvpPercent = localKeyMvpTotal > 0 ? Math.round((localKeyMvpEarned / localKeyMvpTotal) * 100) : 0;
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
    localKeyMvpReady: production.localKeyMvpReady,
    verificationEvidence: input.verificationEvidence,
    overall: {
      percent,
      remainingPercent: Math.max(0, 100 - percent),
      earnedWeight: earned,
      totalWeight,
      note: "This is an evidence-weighted estimate, not a claim of completion. True completion still requires every required production and focused sample gate to pass."
    },
    localKeyMvp: {
      percent: localKeyMvpPercent,
      remainingPercent: Math.max(0, 100 - localKeyMvpPercent),
      earnedWeight: localKeyMvpEarned,
      totalWeight: localKeyMvpTotal,
      ready: production.localKeyMvpReady,
      note: "This excludes official EasyAR account API automation. It measures readiness for Codex/Claude to help users run focused Unity samples with the installed official plugin and local license/API keys."
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

export function remainingCheck(id: string, ok: boolean, evidence: string, nextAction: string) {
  return {
    id,
    ok,
    evidence,
    nextAction
  };
}

export function remainingCategory(input: {
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

export function buildClientLaunch(entrypointMode: typeof clientEntrypointModes[number], serverPath: string | undefined) {
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

export function buildClientConfig(client: typeof clientKinds[number], launch: ReturnType<typeof buildClientLaunch>, env: Record<string, string>) {
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

export function buildFocusedRunSequence(input: {
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

export async function buildWorkflowState(
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

export function chooseWorkflowNextState(input: {
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

export function workflowDecision(
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



export function buildImportChecklistAction(importChecklist: Awaited<ReturnType<typeof buildImportChecklist>>): string {
  const missingRequired = importChecklist.items.filter((item) => item.required && !item.ok);
  const missingScene = missingRequired.find((item) => item.id === "focused-sample-scene-imported");
  if (missingScene && importChecklist.packageCacheSamples.length > 0) {
    return "Run easyar_import_sample_from_package_cache with dryRun=true first, then import the focused sample from local PackageCache or use easyar_write_sample_import_guide for manual Unity steps.";
  }
  return missingRequired[0]?.action ?? "Run easyar_generate_import_checklist and resolve the first missing official import item.";
}

export function preflightCheck(id: string, ok: boolean, area: string, detail: string, action: string) {
  return {
    id,
    ok,
    area,
    detail,
    action
  };
}

export function preflightNextCall(
  blocker: ReturnType<typeof preflightCheck>,
  root: string,
  sample: SampleInfo,
  platform: typeof mobilePlatforms[number]
) {
  if (blocker.id === "account-materials") {
    return { tool: "easyar_write_account_materials", arguments: { projectPath: root, sampleId: sample.id, platform } };
  }
  if (blocker.id === "portal-evidence") {
    return { tool: "easyar_write_portal_evidence", arguments: { projectPath: root, sampleId: sample.id, platform } };
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














































export async function buildCodePlan(root: string, sample: SampleInfo, goal: string, targetFiles: string[], maxScriptIssues: number) {
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

export async function buildCodeChangeSummary(
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

export async function buildProgrammingContext(
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

export async function buildConfigIntegrationAudit(
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

export async function scanConfigIntegrationFiles(
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

export function configIntegrationSignals(text: string): string[] {
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

export function redactedConfigSnippets(text: string): string[] {
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

export function scoreConfigCandidate(candidate: { generated: boolean; signals: string[] }, sample: SampleInfo): number {
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

export function buildCodeChangeNextActions(
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

export function normalizeProjectRelativePath(root: string, relativePath: string): string {
  const target = path.resolve(root, relativePath);
  assertInside(root, target);
  const normalized = path.relative(root, target);
  if (!normalized.endsWith(".cs")) {
    throw new Error("Code plan targetFiles must point to .cs files.");
  }
  return normalized;
}

export function buildCodePlanImplementationSteps(
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

export function buildCodePlanVerificationCalls(root: string, sample: SampleInfo) {
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

export async function buildLatestLogDiagnostic(root: string, sample: SampleInfo, maxLogBytes: number, maxLogIssues: number) {
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

export async function buildLocalConfigForm(
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
      required: false,
      present: checkOk("account-token"),
      source: "Optional local account material if a selected EasyAR Unity workflow requires it. Current Image Tracking/CRS local-key MVP runs should leave this empty.",
      envNames: ["EASYAR_ACCOUNT_TOKEN"],
      placeholder: "",
      sharePolicy: "Optional secret. Leave empty for current focused local-key sample runs unless a local workflow explicitly requires it.",
      userAction: "Leave empty for Image Tracking/CRS local-key MVP unless the project has a local account-token consumer."
    }),
    localConfigFormField({
      id: "license-key",
      jsonPath: "easyar.licenseKey",
      label: "EasyAR Sense license key",
      required: true,
      present: checkOk("license-key") || materialPresent("license-key"),
      source: `EasyAR development center license entry for ${platform}; it must match the app bundle/package identifier.`,
      envNames: ["EASYAR_LICENSE_KEY", "EASYAR_SENSE_LICENSE_KEY"],
      placeholder: "<local-only-placeholder: fill in ignored Unity config>",
      sharePolicy: "Secret or account-scoped value. Never commit, paste into chat, or submit to marketplace forms.",
      userAction: "Log in to the official EasyAR website in your own browser, locate the license there yourself, then enter it only in local Unity config or local environment variables."
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
      source: "EasyAR development center Cloud Recognition/CRS service configuration found by the user after browser login.",
      envNames: ["EASYAR_CLOUD_APP_ID", "EASYAR_CLOUD_RECOGNITION_APP_ID"],
      placeholder: needsCloudRecognition ? "<local-only-placeholder: fill from EasyAR website>" : "",
      sharePolicy: needsCloudRecognition ? "Sensitive account-scoped config. MCP reports presence only." : "Leave empty for Image Tracking.",
      userAction: needsCloudRecognition ? "After logging in to the EasyAR website in your own browser, find this value yourself and fill it only in local Unity config or local environment variables." : "Leave empty unless this project also runs Cloud Recognition."
    }),
    localConfigFormField({
      id: "cloud-server-address",
      jsonPath: "easyar.cloudRecognition.serverAddress",
      label: "Cloud Recognition server address",
      required: needsCloudRecognition,
      present: materialPresent("cloud-server-address") || checkOk("cloud-recognition"),
      source: "EasyAR development center Cloud Recognition/CRS library key page, shown as Client-end (Target Recognition) URL, found by the user after browser login.",
      envNames: ["EASYAR_CLOUD_SERVER_ADDRESS", "EASYAR_CLOUD_RECOGNITION_SERVER_ADDRESS", "EASYAR_CRS_SERVER_ADDRESS", "EASYAR_CRS_RECOGNITION_URL"],
      placeholder: needsCloudRecognition ? "<local-only-placeholder: fill from EasyAR website>" : "",
      sharePolicy: needsCloudRecognition ? "Endpoint URL. Usually safe, but keep account-specific service URLs local by default." : "Leave empty for Image Tracking.",
      userAction: needsCloudRecognition ? "After logging in to the EasyAR website in your own browser, find this value yourself and fill it only in local Unity config or local environment variables." : "Leave empty unless this project also runs Cloud Recognition."
    }),
    localConfigFormField({
      id: "cloud-api-key",
      jsonPath: "easyar.cloudRecognition.apiKey",
      label: "Cloud Recognition API Key",
      required: needsCloudRecognition,
      present: materialPresent("cloud-api-key"),
      source: "EasyAR development center Cloud Recognition/CRS API KEY list, found by the user after browser login. Sense 4.1+ uses APPID + API KEY.",
      envNames: ["EASYAR_CLOUD_API_KEY", "EASYAR_CLOUD_RECOGNITION_API_KEY", "EASYAR_CLOUD_APP_KEY", "EASYAR_CLOUD_RECOGNITION_APP_KEY"],
      placeholder: needsCloudRecognition ? "<local-only-placeholder: fill from EasyAR website>" : "",
      sharePolicy: needsCloudRecognition ? "Secret. Never paste into chat, logs, GitHub issues, or source code." : "Leave empty for Image Tracking.",
      userAction: needsCloudRecognition ? "After logging in to the EasyAR website in your own browser, find this value yourself and fill it only in local Unity config or local environment variables." : "Leave empty unless this project also runs Cloud Recognition."
    }),
    localConfigFormField({
      id: "cloud-api-secret",
      jsonPath: "easyar.cloudRecognition.apiSecret",
      label: "Cloud Recognition API Secret",
      required: needsCloudRecognition,
      present: materialPresent("cloud-api-secret"),
      source: "EasyAR development center Cloud Recognition/CRS API Secret for API KEY access, found by the user after browser login.",
      envNames: ["EASYAR_CLOUD_API_SECRET", "EASYAR_CLOUD_RECOGNITION_API_SECRET", "EASYAR_CLOUD_APP_SECRET", "EASYAR_CLOUD_RECOGNITION_APP_SECRET"],
      placeholder: needsCloudRecognition ? "<local-only-placeholder: fill from EasyAR website>" : "",
      sharePolicy: needsCloudRecognition ? "Secret. Never paste into chat, logs, GitHub issues, or source code." : "Leave empty for Image Tracking.",
      userAction: needsCloudRecognition ? "After logging in to the EasyAR website in your own browser, find this value yourself and fill it only in local Unity config or local environment variables." : "Leave empty unless this project also runs Cloud Recognition."
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
      accountToken: "",
      licenseKey: "<local-only-placeholder: find on EasyAR website, fill in ignored config>",
      cloudRecognition: {
        appId: needsCloudRecognition ? "<local-only-placeholder: find on EasyAR website, fill in ignored config>" : "",
        serverAddress: needsCloudRecognition ? "<local-only-placeholder: find on EasyAR website, fill in ignored config>" : "",
        apiKey: needsCloudRecognition ? "<local-only-placeholder: find on EasyAR website, fill in ignored config>" : "",
        apiSecret: needsCloudRecognition ? "<local-only-placeholder: find on EasyAR website, fill in ignored config>" : "",
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
    nextActions: Array.from(new Set([
      ...nextActions,
      ...(needsCloudRecognition
        ? [
            "Before real-device Cloud Recognition validation, create a Cloud Recognition image library in the EasyAR development center and upload at least one test target image.",
            "Keep a non-secret target library name, target count, or dashboard URL for RUN_RESULT.md evidence; never record API Key/API Secret values."
          ]
        : [])
    ])),
    security: "This form returns only field names, placeholders, presence status, and validation calls. Actual account tokens, license keys, API keys, appKey, and appSecret must stay in local files or local environment variables."
  };
}

export function localConfigFormField(input: {
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

export async function buildLocalConfigHandoffReport(
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
    envPresenceItem("easyar.accountToken", ["EASYAR_ACCOUNT_TOKEN"], isNonPlaceholderString(envFirst(["EASYAR_ACCOUNT_TOKEN"])), "optional local Unity config material; not required for current focused sample runs"),
    envPresenceItem("easyar.licenseKey", ["EASYAR_LICENSE_KEY", "EASYAR_SENSE_LICENSE_KEY"], isNonPlaceholderString(envFirst(["EASYAR_LICENSE_KEY", "EASYAR_SENSE_LICENSE_KEY"])), "required for focused sample runs"),
    envPresenceItem("unity.bundleIdentifier", ["EASYAR_BUNDLE_IDENTIFIER", "EASYAR_UNITY_BUNDLE_IDENTIFIER"], isNonPlaceholderString(envFirst(["EASYAR_BUNDLE_IDENTIFIER", "EASYAR_UNITY_BUNDLE_IDENTIFIER"]) ?? defaultBundleIdentifier(sample)), "defaults to focused sample identifier when unset"),
    envPresenceItem("easyar.cloudRecognition.appId", ["EASYAR_CLOUD_APP_ID", "EASYAR_CLOUD_RECOGNITION_APP_ID"], isNonPlaceholderString(envFirst(["EASYAR_CLOUD_APP_ID", "EASYAR_CLOUD_RECOGNITION_APP_ID"])), needsCloudRecognition ? "required for Cloud Recognition" : "optional for Image Tracking"),
    envPresenceItem("easyar.cloudRecognition.serverAddress", ["EASYAR_CLOUD_SERVER_ADDRESS", "EASYAR_CLOUD_RECOGNITION_SERVER_ADDRESS", "EASYAR_CRS_SERVER_ADDRESS", "EASYAR_CRS_RECOGNITION_URL"], isNonPlaceholderString(envFirst(["EASYAR_CLOUD_SERVER_ADDRESS", "EASYAR_CLOUD_RECOGNITION_SERVER_ADDRESS", "EASYAR_CRS_SERVER_ADDRESS", "EASYAR_CRS_RECOGNITION_URL"])), needsCloudRecognition ? "required Cloud Recognition Client-end Target Recognition URL" : "optional for Image Tracking"),
    envPresenceItem("easyar.cloudRecognition.apiKey", ["EASYAR_CLOUD_API_KEY", "EASYAR_CLOUD_RECOGNITION_API_KEY", "EASYAR_CLOUD_APP_KEY", "EASYAR_CLOUD_RECOGNITION_APP_KEY"], isNonPlaceholderString(envFirst(["EASYAR_CLOUD_API_KEY", "EASYAR_CLOUD_RECOGNITION_API_KEY", "EASYAR_CLOUD_APP_KEY", "EASYAR_CLOUD_RECOGNITION_APP_KEY"])), needsCloudRecognition ? "required for Cloud Recognition API Key access" : "optional for Image Tracking"),
    envPresenceItem("easyar.cloudRecognition.apiSecret", ["EASYAR_CLOUD_API_SECRET", "EASYAR_CLOUD_RECOGNITION_API_SECRET", "EASYAR_CLOUD_APP_SECRET", "EASYAR_CLOUD_RECOGNITION_APP_SECRET"], isNonPlaceholderString(envFirst(["EASYAR_CLOUD_API_SECRET", "EASYAR_CLOUD_RECOGNITION_API_SECRET", "EASYAR_CLOUD_APP_SECRET", "EASYAR_CLOUD_RECOGNITION_APP_SECRET"])), needsCloudRecognition ? "required for Cloud Recognition API Key access" : "optional for Image Tracking")
  ];
  const failedLocalChecks = localConfig.checks.filter((check) => !check.ok).map((check) => check.id);
  const manualFileSteps = [
    "Open https://www.easyar.cn/ in a browser and register or log in with the user's EasyAR account.",
    `Create or locate the EasyAR Sense license for ${platform} and the Unity bundle/package identifier.`,
    ...(needsCloudRecognition
      ? [
          "Create or locate the Cloud Recognition/CRS application and copy CRS AppId plus API KEY locally. Keep API Secret local if the account page exposes it.",
          "Create or locate a Cloud Recognition image library, upload at least one test target image, and keep only a non-secret library name, target count, or dashboard URL for run evidence."
        ]
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
      .filter((item) => item.field === "easyar.licenseKey"
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
      ? "For Cloud Recognition, appId, serverAddress, apiKey, and apiSecret must be filled before the sample can be considered ready. A cloud target library with at least one uploaded target image is also required before real-device validation can pass."
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



export function summarizeLog(logText: string) {
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


export {
  buildRunReportMarkdown,
  buildFocusedPreflightMarkdown,
  buildImportChecklistMarkdown,
  buildSampleImportGuideMarkdown,
  buildWorkflowStateMarkdown,
  buildArtifactIndexMarkdown,
  buildFocusedHandoffPackMarkdown,
  buildSceneAuditMarkdown,
  buildSupportBundleMarkdown,
  buildRunResultMarkdown,
  buildCompletionReportMarkdown,
  buildFocusedScopeStatusMarkdown,
  buildIssueReportMarkdown,
  buildDeviceValidationChecklistMarkdown,
  buildDeviceRunResultFormMarkdown,
  buildAndroidDeviceRunbookMarkdown,
  buildProgrammingContextMarkdown,
  buildConfigIntegrationAuditMarkdown,
  markdownConfigConsumerCandidates,
  buildCodePlanMarkdown,
  buildCodeChangeSummaryMarkdown,
  markdownRunResultSteps,
  buildRunSequenceMarkdown,
  buildDeploymentReadinessMarkdown,
  buildUnityEnvironmentMarkdown,
  buildProductionValidationMarkdown,
  buildAuthorizationStrategyMarkdown,
  buildAccountOnboardingMarkdown,
  buildAccountMaterialsMarkdown,
  buildPortalEvidenceMarkdown,
  presenceLabel,
  buildLocalConfigFormMarkdown,
  buildLocalConfigHandoffMarkdown,
  buildOfficialAccessMarkdown,
  buildOfficialApiContractMarkdown,
  buildOfficialApiHandoffMarkdown,
  buildClientSetupMarkdown,
  buildReleaseManifestMarkdown,
  buildOnboardingMarkdown,
  buildProjectHandoffMarkdown,
  buildRemainingWorkMarkdown,
  buildFirstRunGuideMarkdown,
  markdownCheckList,
  markdownIssueList,
  markdownNumberedList
} from "./tool-markdown.js";

export async function writeFocusedSampleSupportFiles(root: string, sample: SampleInfo, overwrite: boolean, written: string[]) {
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
        "Before marking the sample as passed, create or locate a Cloud Recognition image library in the EasyAR development center, upload at least one test target image, and record only a non-secret library name, target count, or dashboard URL in `RUN_RESULT.md`.",
        "",
        "Do not commit cloud recognition credentials. The generated `.gitignore` protects the local config file."
      ].join("\n") + "\n",
      overwrite,
      written
    );
  }

  if (sample.id === "mega") {
    const megaDir = path.join(focusedSampleGeneratedDir(root, sample), "Mega");
    await mkdir(megaDir, { recursive: true });
    await writeGeneratedFile(
      path.join(megaDir, "README.md"),
      [
        "# Mega Local Materials",
        "",
        "Use the logged-in EasyAR website or Mega Studio session to find the non-secret cloud localization library name, Mega Block storage name, Mega Block display name, and Block ID.",
        "",
        "Configure `Assets/XR/Settings/EasyAR Settings.asset` locally with the package-bound Sense license and Global Mega Block AppID/server/API Key/API Secret. Keep those values local.",
        "",
        "For Android phone validation, set the Mega sample scene `LocationInputMode` to `Onsite`. For PICO 4 Ultra Enterprise, use `Simulator` location input with the official EasyAR Unity XR device extension package and `PicoFrameSource`; the headset does not expose an Android GPS provider.",
        "",
        "PICO 4 Ultra Enterprise verified baseline: Unity 2022.3.62f3, EasyAR Sense Unity Plugin 4002.0.0, EasyAR Mega 2.12.6, EasyAR Unity XR device extension package 4000.0.0, PICO Unity Integration SDK 3.4.0, package name `com.easyar.mega.xrtest`, and a matching `4.x XR正式版` license.",
        "",
        "Keep EasyAR license keys, API keys, account tokens, and any service credentials in local Unity settings or ignored local config files. Do not paste them into chat or commit them.",
        "",
        "A passed Mega result needs APK build evidence plus real-device localization evidence for the selected Mega Block."
      ].join("\n") + "\n",
      overwrite,
      written
    );
  }
}
