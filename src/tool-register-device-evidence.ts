import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { access, cp, mkdir, open, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { createEasyARApiClient } from "./easyar-api.js";
import { focusedHandoffSampleIds } from "./focused-scope.js";
import { jsonText, markdownText } from "./mcp-response.js";
import { officialOpenApiPath, packageRoot } from "./paths.js";
import { createToolRegistrar, type ToolRegistrar } from "./tool-handler.js";
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
  DeviceValidationStep,
  FocusedHandoffPackInput,
  ScriptReviewIssue,
  UnityLogCandidate,
  UnityLogRule,
  accountMaterialNextAction,
  analyzeUnityLog,
  androidDeviceInteractionAction,
  artifactPriority,
  assertInside,
  authorizationStrategyNextActions,
  authorizationStrategyToolSequence,
  buildAccountHumanSteps,
  buildAccountMaterialsMarkdown,
  buildAccountMaterialsReport,
  buildAccountMcpSteps,
  buildAccountOnboardingBlockers,
  buildAccountOnboardingMarkdown,
  buildAccountOnboardingNextActions,
  buildAccountOnboardingReport,
  buildAndroidDeviceRunbook,
  buildAndroidDeviceRunbookMarkdown,
  buildArtifactIndex,
  buildArtifactIndexMarkdown,
  buildAuthorizationStrategyMarkdown,
  buildAuthorizationStrategyReport,
  buildClientAcceptanceChecklist,
  buildClientConfig,
  buildClientFirstSmokeCalls,
  buildClientLaunch,
  buildClientSetupMarkdown,
  buildClientSetupReport,
  buildClientTroubleshooting,
  buildCodeChangeNextActions,
  buildCodeChangeSummary,
  buildCodeChangeSummaryMarkdown,
  buildCodePlan,
  buildCodePlanImplementationSteps,
  buildCodePlanMarkdown,
  buildCodePlanVerificationCalls,
  buildCompletionNextActions,
  buildCompletionReport,
  buildCompletionReportMarkdown,
  buildConfigIntegrationAudit,
  buildConfigIntegrationAuditMarkdown,
  buildDeploymentReadiness,
  buildDeploymentReadinessMarkdown,
  buildDeviceRunResultForm,
  buildDeviceRunResultFormMarkdown,
  buildDeviceValidationChecklist,
  buildDeviceValidationChecklistMarkdown,
  buildDeviceValidationSteps,
  buildFirstRunAccountGuide,
  buildFirstRunGuide,
  buildFirstRunGuideMarkdown,
  buildFocusedHandoffPackMarkdown,
  buildFocusedHandoffPackPlan,
  buildFocusedPreflight,
  buildFocusedPreflightMarkdown,
  buildFocusedReleaseEvidence,
  buildFocusedRunReport,
  buildFocusedRunSequence,
  buildFocusedScopeNextActions,
  buildFocusedScopeStatus,
  buildFocusedScopeStatusMarkdown,
  buildImportChecklist,
  buildImportChecklistAction,
  buildImportChecklistMarkdown,
  buildIssueReport,
  buildIssueReportMarkdown,
  buildLatestLogDiagnostic,
  buildLocalConfigForm,
  buildLocalConfigFormMarkdown,
  buildLocalConfigFromEnvReport,
  buildLocalConfigHandoffMarkdown,
  buildLocalConfigHandoffReport,
  buildLocalConfigValidationReport,
  buildOfficialAccessMarkdown,
  buildOfficialAccessReport,
  buildOfficialApiContract,
  buildOfficialApiContractExamples,
  buildOfficialApiContractMarkdown,
  buildOfficialApiHandoff,
  buildOfficialApiHandoffMarkdown,
  buildOnboardingMarkdown,
  buildOnboardingReport,
  buildPortalEvidenceMarkdown,
  buildPortalEvidenceReport,
  buildProductionValidationMarkdown,
  buildProductionValidationReport,
  buildProgrammingContext,
  buildProgrammingContextMarkdown,
  buildProjectHandoff,
  buildProjectHandoffMarkdown,
  buildReleaseManifest,
  buildReleaseManifestMarkdown,
  buildRemainingWorkMarkdown,
  buildRemainingWorkReport,
  buildRunReportMarkdown,
  buildRunResult,
  buildRunResultMarkdown,
  buildRunSequenceMarkdown,
  buildSampleExpansionPlan,
  buildSampleImportGuide,
  buildSampleImportGuideMarkdown,
  buildSampleReadinessReport,
  buildSampleSceneAudit,
  buildSampleSceneAuditSpecifics,
  buildSampleSpecificReadinessChecks,
  buildSceneAuditMarkdown,
  buildScriptReviewActions,
  buildScriptReviewReport,
  buildSuggestedRunResultCall,
  buildSupportBundle,
  buildSupportBundleMarkdown,
  buildUnityEnvironmentMarkdown,
  buildUnityEnvironmentReport,
  buildUnityRunResultStep,
  buildWorkflowState,
  buildWorkflowStateMarkdown,
  check,
  chooseAuthorizationMode,
  chooseCompletionStatus,
  chooseNextRunPhase,
  chooseSampleExpansionOrder,
  chooseUnityCandidate,
  chooseWorkflowNextState,
  clientConfigDestination,
  clientSetupAction,
  clientSetupCheck,
  cloudRecognitionCredentialMode,
  collectUnityExecutables,
  configIntegrationSignals,
  countMarkdownStepStatuses,
  countPassedDeviceValidationSteps,
  defaultFocusedOutputPath,
  defaultIssueReproductionSteps,
  defaultUnityBatchLogPath,
  deploymentNextActions,
  deriveAccountOnboardingStage,
  devicePortalEvidenceBlockers,
  ensureDirectory,
  ensureGitignoreEntries,
  envFirst,
  envPresenceItem,
  escapeRegExp,
  exists,
  extractMethodBody,
  fileContains,
  filterOfficialEasyARSignals,
  findEvidence,
  findFiles,
  findImageTargetsStreamingPackageCandidates,
  findImageTrackingTargetAssets,
  findLineNumber,
  findMegaAssetHints,
  findPackageCacheSamplePaths,
  findUnityCandidates,
  findUnityLogCandidates,
  firstMatchingLine,
  firstRunTopNextCall,
  focusedArtifactDefinitions,
  focusedArtifactReadOrder,
  focusedHandoffPackArtifactSpecs,
  focusedHandoffPackPurpose,
  focusedHandoffPackSamples,
  focusedSampleGeneratedDir,
  focusedSampleRunbookPath,
  hasCloudRecognitionConfig,
  hasCompleteCloudRecognitionConfig,
  hasOfficialImageTargetsStreamingAssets,
  hasPicoHeadsetMegaSignals,
  hasRecordedDevice,
  hasYamlScalar,
  importSampleFromPackageCache,
  isNonEmptyString,
  isNonPlaceholderString,
  isOptionalNonPlaceholderString,
  isPortalEvidenceReadyForSample,
  isRecord,
  localConfigAction,
  localConfigFormField,
  looksLikeStandaloneSecret,
  markdownCheckList,
  markdownConfigConsumerCandidates,
  markdownIssueList,
  markdownNumberedList,
  markdownRunResultSteps,
  matchSampleScenes,
  normalizeProjectRelativePath,
  normalizeUnityPackageVersion,
  officialAccessCheck,
  officialAccessRemoteCheck,
  officialApiBackendTodo,
  officialApiCanaryCommand,
  officialApiEndpointAcceptance,
  officialApiEndpointContract,
  packageCacheSamplePathMatches,
  parseMarkdownField,
  parseNumberField,
  parsePackageCacheFolderVersion,
  parseRunResultStatus,
  parseYesNoField,
  portalEvidenceBlocker,
  portalEvidencePreflightDetail,
  preflightCheck,
  preflightNextCall,
  presenceLabel,
  productionGate,
  readAuthConfig,
  readBuildSettingsSceneHints,
  readCloudRecognitionConfig,
  readFirstExistingFile,
  readFocusedReleaseEvidence,
  readJsonFile,
  readLocalConfigForRemoteValidation,
  readLogFile,
  readLogTail,
  readMegaBlockRootSummary,
  readMegaLocationInputModeSummary,
  readMegaSettingsSummary,
  readOfficialOpenApiContract,
  readPackageCacheInfo,
  readPackageMetadata,
  readPortalEvidenceArtifact,
  readRemoteValidationConfigFromEnv,
  readRunResultArtifact,
  readUnityVersion,
  readinessAction,
  redactedConfigSnippets,
  remainingCategory,
  remainingCheck,
  resolveProjectPath,
  resolveUnityLogPath,
  reviewCsharpScript,
  sampleDeviceEvidencePrompts,
  sampleDevicePassCriteria,
  sampleExpansionPassCriteria,
  sampleExpansionRisks,
  sampleExpectedIssueBehavior,
  samplePassedEvidencePlaceholder,
  sampleSpecificDeviceValidationSteps,
  sampleSpecificLogRules,
  sanitizeAssetFolderName,
  sanitizeIssueText,
  sanitizePortalId,
  sanitizePortalText,
  sanitizePortalUrl,
  sanitizeRunResultNotes,
  scanConfigIntegrationFiles,
  sceneContentMatchesSample,
  scoreConfigCandidate,
  shellSingleQuote,
  summarizeLog,
  uniqueBlockers,
  unityMethodStepName,
  unityMethodSuccessNextAction,
  unityPathMatchesProjectVersion,
  validateLocalConfig,
  walk,
  walkPackageCacheSamples,
  workflowDecision,
  writeFocusedHandoffPack,
  writeFocusedHandoffPackForSample,
  writeFocusedSampleSupportFiles,
  writeGeneratedFile,
  writePackFile
} from "./tool-services.js";

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

const easyarApi = createEasyARApiClient();

type RegisterTool = McpServer["tool"];

export function registerDeviceEvidenceTools(registerTool: RegisterTool) {
  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
    "easyar_generate_android_device_runbook",
    "Generate an Android real-device runbook for installing, launching, logging, and recording focused EasyAR sample evidence.",
    {
      projectPath: z.string().describe("Unity project path."),
      sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
      apkPath: z.string().optional().describe("APK path. Defaults to Builds/<sampleId>.apk inside the Unity project."),
      bundleIdentifier: z.string().optional().describe("Android package name. Defaults to unity.bundleIdentifier from local config or sample default."),
      adbPath: z.string().optional().describe("Optional adb executable path. Defaults to EASYAR_ADB_PATH or adb on PATH."),
      deviceSerial: z.string().optional().describe("Optional adb serial for a specific device."),
      device: z.string().optional().describe("Optional tested device model or test-device label for RUN_RESULT.md templates."),
      logRelativePath: z.string().optional().describe("Optional device log path inside the project. Defaults to Logs/mcp-easyar-DeviceLog-<sampleId>.log."),
      timeoutSeconds: z.number().int().positive().max(60).default(10)
    },
    async ({ projectPath, sampleId, apkPath, bundleIdentifier, adbPath, deviceSerial, device, logRelativePath, timeoutSeconds }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const sample = findSample(sampleId);
      return jsonText(await buildAndroidDeviceRunbook({
        root,
        sample,
        apkPath,
        bundleIdentifier,
        adbPath,
        deviceSerial,
        device,
        logRelativePath,
        timeoutSeconds
      }));
    }
  );

  registerTool(
    "easyar_write_android_device_runbook",
    "Write the Android real-device runbook to Assets/EasyARGenerated/<sampleId>/ANDROID_DEVICE_RUNBOOK.md.",
    {
      projectPath: z.string().describe("Unity project path."),
      sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
      apkPath: z.string().optional().describe("APK path. Defaults to Builds/<sampleId>.apk inside the Unity project."),
      bundleIdentifier: z.string().optional().describe("Android package name. Defaults to unity.bundleIdentifier from local config or sample default."),
      adbPath: z.string().optional().describe("Optional adb executable path. Defaults to EASYAR_ADB_PATH or adb on PATH."),
      deviceSerial: z.string().optional().describe("Optional adb serial for a specific device."),
      device: z.string().optional().describe("Optional tested device model or test-device label for RUN_RESULT.md templates."),
      logRelativePath: z.string().optional().describe("Optional device log path inside the project. Defaults to Logs/mcp-easyar-DeviceLog-<sampleId>.log."),
      relativePath: z.string().optional().describe("Optional runbook path inside the project. Defaults to Assets/EasyARGenerated/<sampleId>/ANDROID_DEVICE_RUNBOOK.md."),
      timeoutSeconds: z.number().int().positive().max(60).default(10),
      overwrite: z.boolean().default(true).describe("Whether to replace an existing Android device runbook.")
    },
    async ({ projectPath, sampleId, apkPath, bundleIdentifier, adbPath, deviceSerial, device, logRelativePath, relativePath, timeoutSeconds, overwrite }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const sample = findSample(sampleId);
      const runbook = await buildAndroidDeviceRunbook({
        root,
        sample,
        apkPath,
        bundleIdentifier,
        adbPath,
        deviceSerial,
        device,
        logRelativePath,
        timeoutSeconds
      });
      const target = relativePath
        ? path.resolve(root, relativePath)
        : path.join(focusedSampleGeneratedDir(root, sample), "ANDROID_DEVICE_RUNBOOK.md");
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, buildAndroidDeviceRunbookMarkdown(runbook), overwrite, written);
  
      return jsonText({
        written: written.includes(target) ? target : null,
        skipped: written.includes(target) ? null : target,
        sample: sample.name,
        apkExists: runbook.apk.exists,
        readyForInstall: runbook.deviceStatus.readyForInstall,
        packageName: runbook.packageName,
        nextActions: runbook.nextActions,
        note: "The Android device runbook contains commands, safe templates, and evidence prompts only. It does not include EasyAR secret values."
      });
    }
  );
  
  const runResultStepSchema = z.object({
    name: z.string().describe("Step name, for example Unity compile, Build Settings, device build, or real device validation."),
    status: z.enum(runResultStatuses).describe("Observed step status."),
    evidence: z.string().optional().describe("Short evidence, for example log path, build path, device model, or observed behavior."),
    nextAction: z.string().optional().describe("Recommended next action for this step.")
  });

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
    "easyar_generate_focused_scope_status",
    "Generate focused scope status across Image Tracking, Cloud Recognition, and Mega completion reports.",
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

  registerTool(
    "easyar_write_focused_scope_status",
    "Write the focused Image Tracking, Cloud Recognition, and Mega scope status to Assets/EasyARGenerated/FOCUSED_SCOPE_STATUS.md.",
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

  registerTool(
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

  registerTool(
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
}
