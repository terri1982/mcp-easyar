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

export { readLocalConfigForRemoteValidation } from "./tool-local-config-remote.js";
export { summarizeLog } from "./tool-log-summary.js";


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
