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

export function registerClientReleaseTools(registerTool: RegisterTool) {
  registerTool(
    "easyar_generate_client_config",
    "Generate MCP client configuration snippets for connecting Codex, Claude Desktop, or another stdio MCP client.",
    {
      client: z.enum(clientKinds).describe("Target MCP client config style."),
      entrypointMode: z.enum(clientEntrypointModes).default("local-dist").describe("How the MCP client should launch the server: local dist path, installed package bin, or npx package command."),
      serverPath: z.string().optional().describe("Absolute path to dist/index.js. Used only when entrypointMode=local-dist. Defaults to this process entrypoint."),
      includeTokenPlaceholder: z.boolean().default(false).describe("Advanced official-API deployment only: whether to include EASYAR_API_TOKEN placeholder text. Keep false for local-key MVP users.")
    },
    async ({ client, entrypointMode, serverPath, includeTokenPlaceholder }) => {
      const env = {
        EASYAR_API_BASE_URL: process.env.EASYAR_API_BASE_URL ?? "https://www.easyar.cn",
        EASYAR_ACCOUNT_STATUS_ENDPOINT: process.env.EASYAR_ACCOUNT_STATUS_ENDPOINT ?? "https://www.easyar.cn/path/to/official/account/status",
        EASYAR_LICENSE_VALIDATE_ENDPOINT: process.env.EASYAR_LICENSE_VALIDATE_ENDPOINT ?? "https://www.easyar.cn/path/to/official/license/validate",
        EASYAR_DOWNLOADS_ENDPOINT: process.env.EASYAR_DOWNLOADS_ENDPOINT ?? "https://www.easyar.cn/path/to/official/downloads",
        EASYAR_CLOUD_CREDENTIALS_ENDPOINT: process.env.EASYAR_CLOUD_CREDENTIALS_ENDPOINT ?? "https://www.easyar.cn/path/to/official/cloud-recognition/credentials",
        ...(includeTokenPlaceholder ? { EASYAR_API_TOKEN: "official_api_token_from_secret_store" } : {})
      };
      const launch = buildClientLaunch(entrypointMode, serverPath);
      const config = buildClientConfig(client, launch, env);
  
      return jsonText({
        client,
        entrypointMode,
        command: launch.command,
        args: launch.args,
        env,
        config,
        note: includeTokenPlaceholder
          ? "Advanced official-API deployment only: store tokens in local secret storage. Do not ask users to paste tokens into chat or commit secrets."
          : "Local-key MVP config omits official account token fields. Users should configure EasyAR license and CRS keys inside their local Unity project, not in MCP client chat."
      });
    }
  );

  registerTool(
    "easyar_check_client_setup",
    "Check whether a Codex, Claude Desktop, or generic stdio MCP client can be configured for mcp-easyar.",
    {
      client: z.enum(clientKinds).default("claude-desktop").describe("Target MCP client config style."),
      entrypointMode: z.enum(clientEntrypointModes).default("local-dist").describe("How the MCP client should launch the server: local dist path, installed package bin, or npx package command."),
      serverPath: z.string().optional().describe("Absolute path to dist/index.js. Used only when entrypointMode=local-dist. Defaults to this process entrypoint or dist/index.js."),
      includeTokenPlaceholder: z.boolean().default(false).describe("Advanced official-API deployment only: whether the generated config should include EASYAR_API_TOKEN placeholder text. Keep false for local-key MVP users.")
    },
    async ({ client, entrypointMode, serverPath, includeTokenPlaceholder }) => jsonText(await buildClientSetupReport(client, entrypointMode, serverPath, includeTokenPlaceholder))
  );

  registerTool(
    "easyar_write_client_setup",
    "Write a client setup Markdown report for Codex, Claude Desktop, or another stdio MCP client.",
    {
      outputRoot: z.string().describe("Directory that should receive CLIENT_SETUP.md."),
      client: z.enum(clientKinds).default("claude-desktop").describe("Target MCP client config style."),
      entrypointMode: z.enum(clientEntrypointModes).default("local-dist").describe("How the MCP client should launch the server: local dist path, installed package bin, or npx package command."),
      serverPath: z.string().optional().describe("Absolute path to dist/index.js. Used only when entrypointMode=local-dist. Defaults to this process entrypoint or dist/index.js."),
      includeTokenPlaceholder: z.boolean().default(false).describe("Advanced official-API deployment only: whether the generated config should include EASYAR_API_TOKEN placeholder text. Keep false for local-key MVP users."),
      output: outputModeSchema,
      relativePath: z.string().optional().describe("Optional report path inside outputRoot. Defaults to EasyARGenerated/CLIENT_SETUP.md."),
      overwrite: z.boolean().default(true).describe("Whether to replace an existing client setup report.")
    },
    async ({ outputRoot, client, entrypointMode, serverPath, includeTokenPlaceholder, output, relativePath, overwrite }) => {
      const root = resolveProjectPath(outputRoot);
      await ensureDirectory(root);
      const report = await buildClientSetupReport(client, entrypointMode, serverPath, includeTokenPlaceholder);
      const markdown = buildClientSetupMarkdown(report);
      if (isInlineOutput(output)) {
        return inlineMarkdownResult(markdown);
      }
      const defaultRelativePath = await exists(path.join(root, "Assets"))
        ? path.join("Assets", "EasyARGenerated", "CLIENT_SETUP.md")
        : path.join("EasyARGenerated", "CLIENT_SETUP.md");
      const target = path.resolve(root, relativePath ?? defaultRelativePath);
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, markdown, overwrite, written);
  
      return jsonText({
        written: written.includes(target) ? target : null,
        skipped: written.includes(target) ? null : target,
        client,
        readyForClientConnection: report.readyForClientConnection,
        blockerCount: report.blockers.length,
        nextActions: report.nextActions,
        note: "The client setup report contains config shape and redacted/placeholder environment metadata only."
      });
    }
  );

  registerTool(
    "easyar_deployment_readiness",
    "Generate a deployment readiness report for publishing and operating mcp-easyar without exposing secrets.",
    {
      projectPath: z.string().optional().describe("Optional Unity project path to include Unity-side readiness signals."),
      unityPath: z.string().optional().describe("Optional Unity executable path. Defaults to EASYAR_UNITY_PATH or Unity command lookup.")
    },
    async ({ projectPath, unityPath }) => {
      const root = projectPath ? resolveProjectPath(projectPath) : null;
      if (root) {
        await ensureDirectory(root);
      }
  
      return jsonText(await buildDeploymentReadiness(root, unityPath));
    }
  );

  registerTool(
    "easyar_write_deployment_readiness",
    "Write a deployment readiness Markdown report inside the selected project or workspace directory.",
    {
      projectPath: z.string().describe("Directory that should receive the readiness report. Unity projects use Assets/EasyARGenerated by default."),
      unityPath: z.string().optional().describe("Optional Unity executable path. Defaults to EASYAR_UNITY_PATH or Unity command lookup."),
      relativePath: z.string().optional().describe("Optional report path inside projectPath. Defaults to Assets/EasyARGenerated/DEPLOYMENT_READINESS.md when Assets exists, otherwise EasyARGenerated/DEPLOYMENT_READINESS.md."),
      overwrite: z.boolean().default(true).describe("Whether to replace an existing readiness report.")
    },
    async ({ projectPath, unityPath, relativePath, overwrite }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const report = await buildDeploymentReadiness(root, unityPath);
      const defaultRelativePath = await exists(path.join(root, "Assets"))
        ? path.join("Assets", "EasyARGenerated", "DEPLOYMENT_READINESS.md")
        : path.join("EasyARGenerated", "DEPLOYMENT_READINESS.md");
      const target = path.resolve(root, relativePath ?? defaultRelativePath);
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, buildDeploymentReadinessMarkdown(report), overwrite, written);
  
      return jsonText({
        written: written.includes(target) ? target : null,
        skipped: written.includes(target) ? null : target,
        ready: report.ready,
        blockerCount: report.blockers.length,
        warningCount: report.warnings.length,
        nextActions: report.nextActions,
        note: "The deployment readiness report does not include secret values."
      });
    }
  );

  registerTool(
    "easyar_production_validation",
    "Generate a production validation evidence matrix for official mcp-easyar deployment and focused sample run-through readiness.",
    {
      projectPath: z.string().optional().describe("Optional Unity project path used to inspect focused sample completion evidence."),
      focusedEvidencePath: z.string().optional().describe("Optional safe JSON evidence file exported from a completed Unity focused sample run. Used by CI/release runners that cannot access the local Unity project."),
      platform: z.enum(["android", "ios"]).default("android").describe("Target mobile platform for focused sample completion evidence."),
      unityPath: z.string().optional().describe("Optional Unity executable path. Defaults to EASYAR_UNITY_PATH or Unity command lookup."),
      verificationEvidence: z.enum(["not-provided", "passed"]).default("not-provided").describe("Whether npm/CI verification commands have been run and passed outside this report."),
      maxScriptIssues: z.number().int().min(1).max(200).default(40),
      maxLogBytes: z.number().int().min(1024).max(1024 * 1024).default(200000),
      maxLogIssues: z.number().int().min(1).max(200).default(30)
    },
    async ({ projectPath, focusedEvidencePath, platform, unityPath, verificationEvidence, maxScriptIssues, maxLogBytes, maxLogIssues }) => {
      const root = projectPath ? resolveProjectPath(projectPath) : null;
      if (root) {
        await ensureDirectory(root);
      }
      return jsonText(await buildProductionValidationReport(root, focusedEvidencePath, platform, unityPath, verificationEvidence, maxScriptIssues, maxLogBytes, maxLogIssues));
    }
  );

  registerTool(
    "easyar_write_release_evidence",
    "Export a safe focused sample release evidence JSON file for GitHub release runners that cannot access the local Unity project.",
    {
      projectPath: z.string().describe("Unity project path containing completed focused sample evidence."),
      workspacePath: z.string().default(process.cwd()).describe("Workspace/repository path that should receive the safe evidence file."),
      relativePath: z.string().optional().describe("Evidence path inside workspacePath. Defaults to docs/release-evidence/focused-scope.<platform>.json."),
      platform: z.enum(["android", "ios"]).default("android"),
      maxScriptIssues: z.number().int().min(1).max(200).default(40),
      maxLogBytes: z.number().int().min(1024).max(1024 * 1024).default(200000),
      maxLogIssues: z.number().int().min(1).max(200).default(30),
      overwrite: z.boolean().default(true).describe("Whether to replace an existing evidence file.")
    },
    async ({ projectPath, workspacePath, relativePath, platform, maxScriptIssues, maxLogBytes, maxLogIssues, overwrite }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const workspace = resolveProjectPath(workspacePath);
      await ensureDirectory(workspace);
      const status = await buildFocusedScopeStatus(root, platform, maxScriptIssues, maxLogBytes, maxLogIssues);
      const evidence = buildFocusedReleaseEvidence(status);
      const target = path.resolve(workspace, relativePath ?? path.join("docs", "release-evidence", `focused-scope.${platform}.json`));
      assertInside(workspace, target);
      const written: string[] = [];
      await writeGeneratedFile(target, `${JSON.stringify(evidence, null, 2)}\n`, overwrite, written);
      return jsonText({
        written: written.includes(target) ? target : null,
        skipped: written.includes(target) ? null : target,
        allFocusedSamplesComplete: evidence.allFocusedSamplesComplete,
        completedCount: evidence.completedCount,
        sampleIds: evidence.items.map((item) => item.sampleId),
        security: evidence.security
      });
    }
  );

  registerTool(
    "easyar_write_production_validation",
    "Write a production validation evidence matrix for official mcp-easyar deployment.",
    {
      projectPath: z.string().describe("Directory that should receive the production validation report. Unity projects use Assets/EasyARGenerated by default."),
      platform: z.enum(["android", "ios"]).default("android").describe("Target mobile platform for focused sample completion evidence."),
      unityPath: z.string().optional().describe("Optional Unity executable path. Defaults to EASYAR_UNITY_PATH or Unity command lookup."),
      verificationEvidence: z.enum(["not-provided", "passed"]).default("not-provided").describe("Whether npm/CI verification commands have been run and passed outside this report."),
      output: outputModeSchema,
      relativePath: z.string().optional().describe("Optional report path inside projectPath. Defaults to Assets/EasyARGenerated/PRODUCTION_VALIDATION.md when Assets exists, otherwise EasyARGenerated/PRODUCTION_VALIDATION.md."),
      maxScriptIssues: z.number().int().min(1).max(200).default(40),
      maxLogBytes: z.number().int().min(1024).max(1024 * 1024).default(200000),
      maxLogIssues: z.number().int().min(1).max(200).default(30),
      overwrite: z.boolean().default(true).describe("Whether to replace an existing production validation report.")
    },
    async ({ projectPath, platform, unityPath, verificationEvidence, output, relativePath, maxScriptIssues, maxLogBytes, maxLogIssues, overwrite }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const report = await buildProductionValidationReport(root, undefined, platform, unityPath, verificationEvidence, maxScriptIssues, maxLogBytes, maxLogIssues);
      const markdown = buildProductionValidationMarkdown(report);
      if (isInlineOutput(output)) {
        return inlineMarkdownResult(markdown);
      }
      const defaultRelativePath = await exists(path.join(root, "Assets"))
        ? path.join("Assets", "EasyARGenerated", "PRODUCTION_VALIDATION.md")
        : path.join("EasyARGenerated", "PRODUCTION_VALIDATION.md");
      const target = path.resolve(root, relativePath ?? defaultRelativePath);
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, markdown, overwrite, written);
  
      return jsonText({
        written: written.includes(target) ? target : null,
        skipped: written.includes(target) ? null : target,
        productionReady: report.productionReady,
        gateCount: report.gates.length,
        blockerCount: report.blockers.length,
        nextActions: report.nextActions,
        note: "The production validation report is an evidence matrix only. It does not include EasyAR secrets or raw private logs."
      });
    }
  );

  registerTool(
    "easyar_release_manifest",
    "Generate a consumer-facing install and release manifest for mcp-easyar.",
    {},
    async () => jsonText(await buildReleaseManifest())
  );

  registerTool(
    "easyar_write_release_manifest",
    "Write a consumer-facing install and release manifest as Markdown.",
    {
      outputRoot: z.string().describe("Directory that should receive RELEASE_MANIFEST.md."),
      relativePath: z.string().optional().describe("Optional report path inside outputRoot. Defaults to docs/RELEASE_MANIFEST.md."),
      overwrite: z.boolean().default(true).describe("Whether to replace an existing release manifest.")
    },
    async ({ outputRoot, relativePath, overwrite }) => {
      const root = resolveProjectPath(outputRoot);
      await ensureDirectory(root);
      const manifest = await buildReleaseManifest();
      const target = path.resolve(root, relativePath ?? path.join("docs", "RELEASE_MANIFEST.md"));
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, buildReleaseManifestMarkdown(manifest), overwrite, written);
  
      return jsonText({
        written: written.includes(target) ? target : null,
        skipped: written.includes(target) ? null : target,
        packageName: manifest.package.name,
        version: manifest.package.version,
        readyForInstallDocs: manifest.readyForInstallDocs,
        missingCount: manifest.missingRequiredFiles.length,
        nextActions: manifest.nextActions
      });
    }
  );
}
