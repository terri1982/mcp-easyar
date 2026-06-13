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

export function registerSampleArtifactTools(registerTool: RegisterTool) {
  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
    "easyar_generate_focused_handoff_pack",
    "Generate a plan for writing the focused sample handoff artifact pack without writing files.",
    {
      projectPath: z.string().describe("Unity project path."),
      sampleId: z.enum(focusedHandoffSampleIds).default("all").describe("Focused sample id or all focused samples."),
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

  registerTool(
    "easyar_write_focused_handoff_pack",
    "Write the focused sample handoff artifact pack for Image Tracking, Cloud Recognition, Mega, or all focused samples.",
    {
      projectPath: z.string().describe("Unity project path."),
      sampleId: z.enum(focusedHandoffSampleIds).default("all").describe("Focused sample id or all focused samples."),
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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
}
