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
