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

export function registerLocalDiagnosticsTools(registerTool: RegisterTool) {
  registerTool(
    "easyar_validate_local_config",
    "Validate ProjectSettings/EasyAR/easyar.local.json without returning secret values.",
    {
      projectPath: z.string().describe("Unity project path."),
      configPath: z.string().optional().describe("Optional config path. Defaults to ProjectSettings/EasyAR/easyar.local.json inside the project.")
    },
    async ({ projectPath, configPath }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const target = configPath
        ? path.resolve(root, configPath)
        : path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json");
      assertInside(root, target);
  
      if (!await exists(target)) {
        return jsonText({
          configPath: target,
          valid: false,
          checks: [
            {
              id: "file-exists",
              ok: false,
              detail: "Local config file does not exist."
            }
          ],
          nextActions: [
            "Run easyar_prepare_unity_project.",
            "Copy ProjectSettings/EasyAR/easyar.local.json.example to ProjectSettings/EasyAR/easyar.local.json.",
            "Fill the local file with official EasyAR account/license values."
          ]
        });
      }
  
      return jsonText(await buildLocalConfigValidationReport(root, target));
    }
  );

  registerTool(
    "easyar_generate_local_config_form",
    "Generate a fillable ProjectSettings/EasyAR/easyar.local.json form with field sources, placeholders, env alternatives, and validation calls.",
    {
      projectPath: z.string().describe("Unity project path."),
      sampleId: z.string().default("cloud-recognition").describe("Focused sample id: image-tracking or cloud-recognition."),
      platform: z.enum(["android", "ios", "standalone"]).default("android"),
      accountStage: z.enum(accountStageValues).default("unknown").describe("Current EasyAR account stage, if known."),
      bundleIdentifier: z.string().optional().describe("Optional non-secret bundle/package identifier to show in the JSON skeleton.")
    },
    async ({ projectPath, sampleId, platform, accountStage, bundleIdentifier }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const sample = findSample(sampleId);
      return jsonText(await buildLocalConfigForm(root, sample, platform, accountStage, bundleIdentifier));
    }
  );

  registerTool(
    "easyar_write_local_config_form",
    "Write a fillable local config form to Assets/EasyARGenerated/LOCAL_CONFIG_FORM.md without writing secret values.",
    {
      projectPath: z.string().describe("Unity project path."),
      sampleId: z.string().default("cloud-recognition").describe("Focused sample id: image-tracking or cloud-recognition."),
      platform: z.enum(["android", "ios", "standalone"]).default("android"),
      accountStage: z.enum(accountStageValues).default("unknown").describe("Current EasyAR account stage, if known."),
      bundleIdentifier: z.string().optional().describe("Optional non-secret bundle/package identifier to show in the JSON skeleton."),
      relativePath: z.string().optional().describe("Optional form path inside the project. Defaults to Assets/EasyARGenerated/LOCAL_CONFIG_FORM.md."),
      overwrite: z.boolean().default(true).describe("Whether to replace an existing local config form.")
    },
    async ({ projectPath, sampleId, platform, accountStage, bundleIdentifier, relativePath, overwrite }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const sample = findSample(sampleId);
      const form = await buildLocalConfigForm(root, sample, platform, accountStage, bundleIdentifier);
      const target = relativePath
        ? path.resolve(root, relativePath)
        : path.join(root, "Assets", "EasyARGenerated", "LOCAL_CONFIG_FORM.md");
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, buildLocalConfigFormMarkdown(form), overwrite, written);
  
      return jsonText({
        written: written.includes(target) ? target : null,
        skipped: written.includes(target) ? null : target,
        sample: sample.name,
        platform,
        localConfigValid: form.localConfig.valid,
        missingRequiredFields: form.missingRequiredFields,
        nextActions: form.nextActions,
        note: "The form contains placeholders, field presence, and validation calls only. It does not write or return secret values."
      });
    }
  );

  registerTool(
    "easyar_write_local_config_from_env",
    "Write ProjectSettings/EasyAR/easyar.local.json from local environment variables without returning secret values.",
    {
      projectPath: z.string().describe("Unity project path."),
      sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
      targetPlatform: z.enum(["android", "ios", "standalone"]).default("android"),
      bundleIdentifier: z.string().optional().describe("Optional non-secret bundle/package identifier. Defaults to EASYAR_BUNDLE_IDENTIFIER or sample default."),
      relativePath: z.string().optional().describe("Optional config path inside the project. Defaults to ProjectSettings/EasyAR/easyar.local.json."),
      overwrite: z.boolean().default(false).describe("Whether to replace an existing local config file."),
      allowPartial: z.boolean().default(false).describe("Whether to write when required environment variables are missing. Defaults to false.")
    },
    async ({ projectPath, sampleId, targetPlatform, bundleIdentifier, relativePath, overwrite, allowPartial }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const sample = findSample(sampleId);
      const target = relativePath
        ? path.resolve(root, relativePath)
        : path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json");
      assertInside(root, target);
      const report = await buildLocalConfigFromEnvReport(root, sample, targetPlatform, bundleIdentifier, target, overwrite, allowPartial);
      const written: string[] = [];
      if (report.canWrite) {
        await mkdir(path.dirname(target), { recursive: true });
        await writeGeneratedFile(target, report.contents, overwrite, written);
      }
  
      return jsonText({
        configPath: target,
        sample: sample.name,
        canWrite: report.canWrite,
        written: written.includes(target) ? target : null,
        skipped: report.canWrite && !written.includes(target) ? target : null,
        existingFile: report.existingFile,
        overwrite,
        allowPartial,
        requiredMissing: report.requiredMissing,
        envPresence: report.envPresence,
        validation: report.canWrite && written.includes(target) ? await buildLocalConfigValidationReport(root, target) : null,
        nextActions: report.nextActions,
        security: report.security
      });
    }
  );

  registerTool(
    "easyar_local_config_handoff",
    "Generate a first-run handoff for registering/logging into EasyAR, collecting account materials, and filling ProjectSettings/EasyAR/easyar.local.json locally.",
    {
      projectPath: z.string().describe("Unity project path."),
      sampleId: z.string().default("cloud-recognition").describe("Focused sample id: image-tracking or cloud-recognition."),
      platform: z.enum(["android", "ios", "standalone"]).default("android"),
      accountStage: z.enum(accountStageValues).default("unknown").describe("Current EasyAR account stage, if known.")
    },
    async ({ projectPath, sampleId, platform, accountStage }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const sample = findSample(sampleId);
      return jsonText(await buildLocalConfigHandoffReport(root, sample, platform, accountStage));
    }
  );

  registerTool(
    "easyar_write_local_config_handoff",
    "Write a local Markdown handoff that guides first-time EasyAR users from registration/login to safe easyar.local.json validation.",
    {
      projectPath: z.string().describe("Unity project path."),
      sampleId: z.string().default("cloud-recognition").describe("Focused sample id: image-tracking or cloud-recognition."),
      platform: z.enum(["android", "ios", "standalone"]).default("android"),
      accountStage: z.enum(accountStageValues).default("unknown").describe("Current EasyAR account stage, if known."),
      relativePath: z.string().optional().describe("Optional output path inside the project. Defaults to Assets/EasyARGenerated/LOCAL_CONFIG_HANDOFF.md."),
      overwrite: z.boolean().default(true).describe("Whether to replace an existing handoff artifact.")
    },
    async ({ projectPath, sampleId, platform, accountStage, relativePath, overwrite }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const sample = findSample(sampleId);
      const report = await buildLocalConfigHandoffReport(root, sample, platform, accountStage);
      const target = relativePath
        ? path.resolve(root, relativePath)
        : path.join(root, "Assets", "EasyARGenerated", "LOCAL_CONFIG_HANDOFF.md");
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, buildLocalConfigHandoffMarkdown(report), overwrite, written);
  
      return jsonText({
        written: written.includes(target) ? target : null,
        skipped: written.includes(target) ? null : target,
        sample: sample.name,
        stage: report.account.stage,
        localConfigValid: report.localConfig.valid,
        missingRequiredMaterials: report.accountMaterials.missingRequired,
        nextActions: report.nextActions,
        security: report.security
      });
    }
  );

  registerTool(
    "easyar_analyze_unity_log",
    "Analyze Unity Editor or build logs for common and focused-sample EasyAR issues.",
    {
      logText: z.string().optional().describe("Unity log text to analyze."),
      logPath: z.string().optional().describe("Path to a Unity Editor.log or build log file."),
      sampleId: z.string().optional().describe("Optional focused sample id for sample-specific diagnostics, for example image-tracking or cloud-recognition."),
      maxIssues: z.number().int().positive().max(50).default(20)
    },
    async ({ logText, logPath, sampleId, maxIssues }) => {
      if (!logText && !logPath) {
        throw new Error("Provide either logText or logPath.");
      }
  
      const sample = sampleId ? findSample(sampleId) : null;
      const text = logText ?? await readLogFile(logPath as string);
      const issues = analyzeUnityLog(text, sample).slice(0, maxIssues);
      const summary = summarizeLog(text);
  
      return jsonText({
        summary,
        sample: sample ? {
          id: sample.id,
          name: sample.name,
          implementationStatus: sample.implementationStatus
        } : null,
        issueCount: issues.length,
        issues,
        nextActions: issues.length > 0
          ? Array.from(new Set(issues.flatMap((issue) => issue.actions)))
          : ["No known EasyAR/Unity issue patterns were detected. Check the full Unity Console and device logs if the problem persists."]
      });
    }
  );

  registerTool(
    "easyar_analyze_latest_unity_log",
    "Find the most recent Unity Editor/project log and analyze its tail with optional focused sample diagnostics.",
    {
      projectPath: z.string().optional().describe("Optional Unity project path used to search project Logs and Library locations."),
      sampleId: z.string().optional().describe("Optional focused sample id for sample-specific diagnostics."),
      maxBytes: z.number().int().positive().max(1024 * 1024).default(200000).describe("Maximum bytes to read from the end of the latest log."),
      maxIssues: z.number().int().positive().max(50).default(20)
    },
    async ({ projectPath, sampleId, maxBytes, maxIssues }) => {
      const root = projectPath ? resolveProjectPath(projectPath) : null;
      if (root) {
        await ensureDirectory(root);
      }
      const sample = sampleId ? findSample(sampleId) : null;
      const candidates = await findUnityLogCandidates(root);
      const latest = candidates.find((candidate) => candidate.exists);
      if (!latest) {
        return jsonText({
          projectPath: root,
          sample: sample ? {
            id: sample.id,
            name: sample.name,
            implementationStatus: sample.implementationStatus
          } : null,
          analyzed: false,
          candidates,
          nextActions: [
            "Run Unity once, then retry this tool.",
            "If you already have a log file, call easyar_analyze_unity_log with logPath."
          ]
        });
      }
  
      const text = await readLogTail(latest.path, maxBytes);
      const issues = analyzeUnityLog(text, sample).slice(0, maxIssues);
      return jsonText({
        projectPath: root,
        sample: sample ? {
          id: sample.id,
          name: sample.name,
          implementationStatus: sample.implementationStatus
        } : null,
        analyzed: true,
        logPath: latest.path,
        logSizeBytes: latest.size,
        logModifiedAt: latest.modifiedAt,
        bytesRead: Buffer.byteLength(text, "utf8"),
        summary: summarizeLog(text),
        issueCount: issues.length,
        issues,
        nextActions: issues.length > 0
          ? Array.from(new Set(issues.flatMap((issue) => issue.actions)))
          : ["No known EasyAR/Unity issue patterns were detected in the latest log tail."]
      });
    }
  );
}
