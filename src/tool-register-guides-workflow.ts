import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { access, cp, mkdir, open, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { createEasyARApiClient } from "./easyar-api.js";
import { focusedHandoffSampleIds } from "./focused-scope.js";
import { jsonText, markdownText } from "./mcp-response.js";
import { inlineMarkdownResult, isInlineOutput, outputModeSchema } from "./tool-output.js";
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

export function registerGuidesWorkflowTools(registerTool: RegisterTool) {
  registerTool(
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

  registerTool(
    "easyar_write_first_run_guide",
    "Write FIRST_RUN.md, the first-screen guide for a new EasyAR MCP user or a handoff to another AI tool.",
    {
      projectPath: z.string().optional().describe("Optional Unity project path. If provided, writes to Assets/EasyARGenerated/FIRST_RUN.md by default."),
      outputRoot: z.string().optional().describe("Output directory when projectPath is not provided."),
      sampleId: z.string().optional().describe("Optional focused sample id. Defaults to cloud-recognition because it exercises the full account/config path."),
      platform: z.enum(["android", "ios"]).default("android"),
      accountStage: z.enum(accountStageValues).default("unknown"),
      client: z.enum(clientKinds).default("claude-desktop"),
      output: outputModeSchema,
      relativePath: z.string().optional().describe("Optional output path. Defaults to Assets/EasyARGenerated/FIRST_RUN.md for Unity projects or EasyARGenerated/FIRST_RUN.md for outputRoot."),
      overwrite: z.boolean().default(true).describe("Whether to replace an existing first-run guide.")
    },
    async ({ projectPath, outputRoot, sampleId, platform, accountStage, client, output, relativePath, overwrite }) => {
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
      const markdown = buildFirstRunGuideMarkdown(guide);
      if (isInlineOutput(output)) {
        return inlineMarkdownResult(markdown);
      }
      const defaultRelativePath = projectPath
        ? path.join("Assets", "EasyARGenerated", "FIRST_RUN.md")
        : path.join("EasyARGenerated", "FIRST_RUN.md");
      const target = path.resolve(root, relativePath ?? defaultRelativePath);
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, markdown, overwrite, written);
  
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
    "easyar_write_remaining_work_report",
    "Write REMAINING_WORK.md, an evidence-weighted gap report for the remaining mcp-easyar production and focused sample run-through work.",
    {
      projectPath: z.string().optional().describe("Optional Unity project path. If provided, writes to Assets/EasyARGenerated/REMAINING_WORK.md by default."),
      outputRoot: z.string().optional().describe("Output directory when projectPath is not provided."),
      platform: z.enum(["android", "ios"]).default("android"),
      verificationEvidence: z.enum(["not-provided", "passed"]).default("not-provided").describe("Set to passed only after local verification commands or CI evidence has passed for the current commit."),
      output: outputModeSchema,
      relativePath: z.string().optional().describe("Optional output path. Defaults to Assets/EasyARGenerated/REMAINING_WORK.md for Unity projects or EasyARGenerated/REMAINING_WORK.md for outputRoot."),
      maxScriptIssues: z.number().int().positive().max(100).default(25),
      maxLogBytes: z.number().int().positive().max(1024 * 1024).default(200000),
      maxLogIssues: z.number().int().positive().max(50).default(20),
      overwrite: z.boolean().default(true).describe("Whether to replace an existing remaining-work report.")
    },
    async ({ projectPath, outputRoot, platform, verificationEvidence, output, relativePath, maxScriptIssues, maxLogBytes, maxLogIssues, overwrite }) => {
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
      const markdown = buildRemainingWorkMarkdown(report);
      if (isInlineOutput(output)) {
        return inlineMarkdownResult(markdown);
      }
      const defaultRelativePath = projectPath
        ? path.join("Assets", "EasyARGenerated", "REMAINING_WORK.md")
        : path.join("EasyARGenerated", "REMAINING_WORK.md");
      const target = path.resolve(root, relativePath ?? defaultRelativePath);
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, markdown, overwrite, written);
  
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

  registerTool(
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
          ? `- Official production authentication is configured for ${auth.apiBaseUrl}.`
          : `- Local-key MVP does not require MCP account authentication. Use the official website manually for downloads and keys.`,
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

  registerTool(
    "easyar_generate_sample_expansion_plan",
    "Generate the acceptance plan for moving a deferred EasyAR sample into the verified run-through scope.",
    {
      sampleId: z.string().optional().describe("Optional sample id from easyar_list_samples. Omit to plan all deferred samples."),
      platform: z.enum(["android", "ios"]).default("android"),
      unityVersion: z.string().default("2022.3.62f3").describe("Unity version to use as the validation baseline."),
      includeOfficialApiTrack: z.boolean().default(false).describe("Include official API production prerequisites in addition to local-key acceptance.")
    },
    async ({ sampleId, platform, unityVersion, includeOfficialApiTrack }) => {
      const targetSamples = sampleId ? [findSample(sampleId)] : deferredSamples();
      return jsonText({
        generatedAt: new Date().toISOString(),
        release: currentGitHubReleaseTag,
        platform,
        unityVersion,
        currentFocusedSamples: focusedSamples().map((sample) => sample.id),
        expansionCandidates: targetSamples.map((sample) => buildSampleExpansionPlan(sample, platform, unityVersion, includeOfficialApiTrack)),
        recommendedOrder: chooseSampleExpansionOrder(targetSamples),
        nextMcpCalls: [
          "easyar_list_samples",
          "easyar_generate_sample_plan sampleId=<sampleId> platform=" + platform,
          "easyar_account_onboarding accountStage=not-registered sampleId=<sampleId> platform=" + platform,
          "easyar_write_project_handoff projectPath=/path/to/UnityProject sampleId=<sampleId> platform=" + platform,
          "easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=<sampleId> platform=" + platform
        ],
        security: "Sample expansion must use official EasyAR packages and local user-owned keys. Do not collect website passwords, verification codes, license keys, Cloud Recognition API secrets, signing keys, APKs, Unity packages, or raw private logs in chat or committed files."
      });
    }
  );

  registerTool(
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

  registerTool(
    "easyar_write_focused_preflight",
    "Write the focused sample preflight gate as a Markdown artifact inside the Unity project.",
    {
      projectPath: z.string().describe("Unity project path."),
      sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
      platform: z.enum(["android", "ios"]).default("android"),
      outputPath: z.string().optional().describe("Build output path. Defaults to Builds/<sampleId>.apk for Android or Builds/iOS/<sampleId>."),
      output: outputModeSchema,
      relativePath: z.string().optional().describe("Optional preflight path inside the project. Defaults to Assets/EasyARGenerated/<sampleId>/PREFLIGHT.md."),
      maxScriptIssues: z.number().int().positive().max(100).default(25),
      overwrite: z.boolean().default(true).describe("Whether to replace an existing preflight artifact.")
    },
    async ({ projectPath, sampleId, platform, outputPath, output, relativePath, maxScriptIssues, overwrite }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const sample = findSample(sampleId);
      const defaultOutput = platform === "android"
        ? `Builds/${sample.id}.apk`
        : `Builds/iOS/${sample.id}`;
      const preflight = await buildFocusedPreflight(root, sample, platform, outputPath ?? defaultOutput, maxScriptIssues);
      const markdown = buildFocusedPreflightMarkdown(preflight);
      if (isInlineOutput(output)) {
        return inlineMarkdownResult(markdown);
      }
      const target = relativePath
        ? path.resolve(root, relativePath)
        : path.join(focusedSampleGeneratedDir(root, sample), "PREFLIGHT.md");
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, markdown, overwrite, written);
  
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

  registerTool(
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

  registerTool(
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
}
