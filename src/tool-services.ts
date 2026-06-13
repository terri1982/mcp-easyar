import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { access, cp, mkdir, open, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { focusedHandoffSampleIds } from "./focused-scope.js";
import { jsonText, markdownText } from "./mcp-response.js";
import { officialOpenApiPath, packageRoot } from "./paths.js";
import { readAuthConfig } from "./tool-auth.js";
import { readLocalConfigForRemoteValidation } from "./tool-local-config-remote.js";
import { summarizeLog } from "./tool-log-summary.js";
import { buildWorkflowState } from "./tool-workflow-services.js";
import {
  buildAccountMaterialsReport,
  buildAccountOnboardingReport
} from "./tool-account-services.js";
import {
  buildOfficialAccessReport,
  buildOfficialApiContract
} from "./tool-official-services.js";
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
};

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

export { chooseSampleExpansionOrder, buildSampleExpansionPlan, sampleExpansionPassCriteria, sampleExpansionRisks } from "./tool-sample-expansion.js";
export { readAuthConfig, readLocalConfigForRemoteValidation, summarizeLog };

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

export { buildAccountOnboardingReport, buildFirstRunAccountGuide, deriveAccountOnboardingStage, buildAccountHumanSteps, buildAccountMcpSteps, buildAccountOnboardingBlockers, buildAccountOnboardingNextActions, buildAccountMaterialsReport, accountMaterialNextAction } from "./tool-account-services.js";

export { readOfficialOpenApiContract, buildOfficialApiContract, officialApiEndpointContract, buildAuthorizationStrategyReport, chooseAuthorizationMode, authorizationStrategyToolSequence, authorizationStrategyNextActions, buildOfficialApiHandoff, officialApiBackendTodo, officialApiEndpointAcceptance, officialApiCanaryCommand, buildOfficialApiContractExamples, buildOfficialAccessReport, readRemoteValidationConfigFromEnv, officialAccessCheck, officialAccessRemoteCheck, buildPortalEvidenceReport, portalEvidenceBlocker, sanitizePortalText, sanitizePortalId, sanitizePortalUrl, looksLikeStandaloneSecret } from "./tool-official-services.js";

export { buildCodePlan, buildCodeChangeSummary, buildProgrammingContext, buildConfigIntegrationAudit, scanConfigIntegrationFiles, configIntegrationSignals, redactedConfigSnippets, scoreConfigCandidate, buildCodeChangeNextActions, normalizeProjectRelativePath, buildCodePlanImplementationSteps, buildCodePlanVerificationCalls, buildLatestLogDiagnostic } from "./tool-programming-services.js";

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

export { buildFocusedRunSequence, buildWorkflowState, chooseWorkflowNextState, workflowDecision, buildImportChecklistAction, preflightCheck, preflightNextCall } from "./tool-workflow-services.js";

export { buildLocalConfigForm, localConfigFormField, buildLocalConfigHandoffReport } from "./tool-local-config-guidance.js";

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
