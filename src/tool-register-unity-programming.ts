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

export function registerUnityProgrammingTools(registerTool: RegisterTool) {
  registerTool(
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
      await writeGeneratedFile(mobileSettingsPath, buildMobileSettingsHelper("android", defaultBundleIdentifier(sample), null, sample.id === "mega" ? 24 : null), overwrite, written);
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

  registerTool(
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

  registerTool(
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

  registerTool(
    "easyar_create_mobile_settings_helper",
    "Create a Unity Editor script that applies Android/iOS player settings commonly required by EasyAR camera samples.",
    {
      projectPath: z.string().describe("Unity project path."),
      platform: z.enum(mobilePlatforms).describe("Target mobile platform."),
      sampleId: z.string().optional().describe("Optional sample id used to generate a stable default bundle identifier."),
      bundleIdentifier: z.string().optional().describe("Application bundle/package identifier. Defaults to a sample-specific com.easyar.generated.* id."),
      cameraUsageDescription: z.string().optional().describe("iOS camera usage description. Defaults to an EasyAR AR camera message."),
      minSdkVersion: z.number().int().min(23).max(35).optional().describe("Android minimum SDK API level. Defaults to 23, or 24 for Mega."),
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
        buildMobileSettingsHelper(platform, appId, cameraUsageDescription ?? null, minSdkVersion ?? (sample?.id === "mega" ? 24 : null)),
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
    "easyar_unity_environment",
    "Inspect local Unity executable configuration and common install locations without launching Unity.",
    {},
    async () => {
      return jsonText(await buildUnityEnvironmentReport(null, null));
    }
  );

  registerTool(
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

  registerTool(
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

  registerTool(
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
}
