import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { access, cp, mkdir, open, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { createEasyARApiClient } from "./easyar-api.js";
import { focusedHandoffSampleIds } from "./focused-scope.js";
import { jsonText, markdownText } from "./mcp-response.js";
import { officialOpenApiPath, packageRoot } from "./paths.js";
import { readAuthConfig } from "./tool-auth.js";
import { readLocalConfigForRemoteValidation } from "./tool-local-config-remote.js";
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
