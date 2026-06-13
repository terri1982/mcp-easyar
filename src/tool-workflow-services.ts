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














































export { buildCodePlan, buildCodeChangeSummary, buildProgrammingContext, buildConfigIntegrationAudit, scanConfigIntegrationFiles, configIntegrationSignals, redactedConfigSnippets, scoreConfigCandidate, buildCodeChangeNextActions, normalizeProjectRelativePath, buildCodePlanImplementationSteps, buildCodePlanVerificationCalls, buildLatestLogDiagnostic } from "./tool-programming-services.js";
