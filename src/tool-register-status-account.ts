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

export function registerStatusAccountTools(registerTool: RegisterTool) {
  registerTool(
    "easyar_server_status",
    "Return mcp-easyar server version, capability summary, resources, authorization state, and recommended next steps.",
    {},
    async () => {
      const auth = readAuthConfig();
      return jsonText({
        name: serverName,
        version: serverVersion,
        repository: "https://github.com/terri1982/mcp-easyar",
        officialUse: "Designed for registered EasyAR users and official authorized workflows.",
        authorization: {
          apiBaseUrl: auth.apiBaseUrl,
          hasToken: auth.hasToken,
          accountStatusEndpointConfigured: auth.accountStatusEndpointConfigured,
          licenseValidationEndpointConfigured: auth.licenseValidationEndpointConfigured,
          readyForAccountScopedContent: auth.hasToken && auth.accountStatusEndpointConfigured && auth.licenseValidationEndpointConfigured,
          accountScopedFeatures: easyarApi.accountScopedFeatures()
        },
        capabilities: {
          samples: samples.map((sample) => sample.id),
          focusedSamples: focusedSamples().map((sample) => sample.id),
          deferredSamples: deferredSamples().map((sample) => sample.id),
          toolProfile,
          toolsEnabled: activeToolCatalog().length,
          toolsAvailableInFullProfile: toolCatalog.length,
          tools: activeToolCatalog(),
          resources: resourceCatalog,
          unityAutomation: [
            "inspect project",
            "prepare sample helpers",
            "configure mobile player settings",
            "configure Build Settings",
            "generate player build helper",
            "run Unity batch methods",
            "analyze Unity logs",
            "write C# scripts",
            "review C# scripts"
          ]
        },
        onboarding: {
          preflightFirst: true,
          firstQuestion: "Do you already have an EasyAR account?",
          supportedAccountStages: [
            "not-registered",
            "registered-not-logged-in",
            "logged-in",
            "has-license",
            "has-cloud-credentials"
          ],
          newUserRoute: [
            "Read easyar://acceptance/fresh-project before starting a fresh Unity project run.",
            "Call easyar_account_onboarding accountStage=not-registered sampleId=cloud-recognition or sampleId=image-tracking.",
            "Open the official EasyAR website/development center in a browser for registration and login.",
            "Return to MCP after login; do not paste website passwords, verification codes, appKey, appSecret, API token, or license key into chat.",
            "Run easyar_prepare_unity_project to create ProjectSettings/EasyAR/easyar.local.json.example.",
            "Fill ProjectSettings/EasyAR/easyar.local.json locally, then run easyar_validate_local_config.",
            "Run easyar_write_focused_preflight and read PREFLIGHT.md before Unity automation."
          ],
          localSecretTarget: "ProjectSettings/EasyAR/easyar.local.json"
        },
        recommendedFirstCalls: [
          "Read MCP resource easyar://acceptance/fresh-project",
          "easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android",
          "easyar_write_first_run_guide projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition platform=android",
          "easyar_account_onboarding accountStage=not-registered sampleId=cloud-recognition",
          "easyar_write_account_onboarding projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition",
          "easyar_write_account_materials projectPath=/path/to/UnityProject sampleId=cloud-recognition",
          "easyar_write_unity_environment_report projectPath=/path/to/UnityProject sampleId=cloud-recognition",
          "easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=cloud-recognition",
          "easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android",
          "Read Assets/EasyARGenerated/cloud-recognition/PREFLIGHT.md and follow its nextCall"
        ],
        focusedSampleFirstCalls: {
          imageTracking: [
            "easyar_write_account_onboarding projectPath=/path/to/UnityProject accountStage=not-registered sampleId=image-tracking",
            "easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=image-tracking",
            "easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=image-tracking platform=android",
            "Read Assets/EasyARGenerated/image-tracking/PREFLIGHT.md"
          ],
          cloudRecognition: [
            "easyar_write_account_onboarding projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition",
            "easyar_write_account_materials projectPath=/path/to/UnityProject sampleId=cloud-recognition",
            "easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=cloud-recognition",
            "Fill easyar.cloudRecognition.appId and apiKey locally in ProjectSettings/EasyAR/easyar.local.json",
            "easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android",
            "Read Assets/EasyARGenerated/cloud-recognition/PREFLIGHT.md"
          ]
        },
        programmingFirstCalls: [
          "easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=image-tracking platform=android",
          "easyar_write_programming_context projectPath=/path/to/UnityProject sampleId=image-tracking",
          "Read Assets/EasyARGenerated/image-tracking/PROGRAMMING_CONTEXT.md before CODE_PLAN.md"
        ],
        security: [
          "Do not commit account tokens, EasyAR license keys, cloud credentials, signing keys, or provisioning secrets.",
          "This server does not bypass EasyAR login, license checks, download authorization, enterprise gates, or rate limits."
        ]
      });
    }
  );

  registerTool(
    "easyar_list_samples",
    "List known EasyAR Unity sample categories and setup requirements.",
    {},
    async () => jsonText(samples)
  );

  registerTool(
    "easyar_official_info",
    "Return official EasyAR links and package versions captured by this MCP server.",
    {},
    async () => jsonText(officialInfo)
  );

  registerTool(
    "easyar_auth_status",
    "Report whether EasyAR account environment variables are configured without exposing secret values.",
    {},
    async () => {
      const auth = readAuthConfig();
      return jsonText({
        apiBaseUrl: auth.apiBaseUrl,
        hasToken: auth.hasToken,
        tokenPreview: auth.tokenPreview,
        accountStatusEndpointConfigured: auth.accountStatusEndpointConfigured,
        licenseValidationEndpointConfigured: auth.licenseValidationEndpointConfigured,
        downloadsEndpointConfigured: auth.downloadsEndpointConfigured,
        cloudCredentialsEndpointConfigured: auth.cloudCredentialsEndpointConfigured,
        readyForAccountScopedContent: auth.hasToken && auth.accountStatusEndpointConfigured && auth.licenseValidationEndpointConfigured && auth.downloadsEndpointConfigured && auth.cloudCredentialsEndpointConfigured,
        requiredEnvironment: [
          "EASYAR_API_BASE_URL",
          "EASYAR_API_TOKEN",
          "EASYAR_ACCOUNT_STATUS_ENDPOINT",
          "EASYAR_LICENSE_VALIDATE_ENDPOINT",
          "EASYAR_DOWNLOADS_ENDPOINT",
          "EASYAR_CLOUD_CREDENTIALS_ENDPOINT"
        ],
        security: "Secret values are never returned by this tool."
      });
    }
  );

  registerTool(
    "easyar_authorization_strategy",
    "Explain the safe EasyAR authorization strategy: official API, manual browser handoff, local authorized packages, or local stub, without bypassing EasyAR access controls.",
    {
      projectPath: z.string().optional().describe("Optional Unity project path used to inspect local config state."),
      sampleId: z.string().optional().describe("Focused sample id. Defaults to cloud-recognition because it exercises license and Cloud Recognition materials."),
      platform: z.enum(["android", "ios", "standalone", "unknown"]).default("android"),
      accountStage: z.enum(accountStageValues).default("unknown"),
      preferredMode: z.enum(authorizationModeValues).default("auto").describe("Preferred authorization path. auto chooses official-api when ready, otherwise manual-browser/local-packages.")
    },
    async ({ projectPath, sampleId, platform, accountStage, preferredMode }) => {
      const root = projectPath ? resolveProjectPath(projectPath) : null;
      if (root) {
        await ensureDirectory(root);
      }
      const sample = sampleId ? findSample(sampleId) : findSample("cloud-recognition");
      return jsonText(await buildAuthorizationStrategyReport(root, sample, platform, accountStage, preferredMode));
    }
  );

  registerTool(
    "easyar_write_authorization_strategy",
    "Write the safe EasyAR authorization strategy as a Markdown artifact for users, backend teams, and future MCP sessions.",
    {
      projectPath: z.string().optional().describe("Optional Unity project path. If provided, writes to Assets/EasyARGenerated/AUTHORIZATION_STRATEGY.md by default."),
      outputRoot: z.string().optional().describe("Output directory when projectPath is not provided."),
      sampleId: z.string().optional().describe("Focused sample id. Defaults to cloud-recognition."),
      platform: z.enum(["android", "ios", "standalone", "unknown"]).default("android"),
      accountStage: z.enum(accountStageValues).default("unknown"),
      preferredMode: z.enum(authorizationModeValues).default("auto"),
      output: outputModeSchema,
      relativePath: z.string().optional().describe("Optional output path. Defaults to Assets/EasyARGenerated/AUTHORIZATION_STRATEGY.md for Unity projects or EasyARGenerated/AUTHORIZATION_STRATEGY.md for outputRoot."),
      overwrite: z.boolean().default(true).describe("Whether to replace an existing authorization strategy artifact.")
    },
    async ({ projectPath, outputRoot, sampleId, platform, accountStage, preferredMode, output, relativePath, overwrite }) => {
      const root = projectPath ? resolveProjectPath(projectPath) : resolveProjectPath(outputRoot ?? process.cwd());
      await ensureDirectory(root);
      const sample = sampleId ? findSample(sampleId) : findSample("cloud-recognition");
      const report = await buildAuthorizationStrategyReport(projectPath ? root : null, sample, platform, accountStage, preferredMode);
      const markdown = buildAuthorizationStrategyMarkdown(report);
      if (isInlineOutput(output)) {
        return inlineMarkdownResult(markdown);
      }
      const defaultRelativePath = projectPath
        ? path.join("Assets", "EasyARGenerated", "AUTHORIZATION_STRATEGY.md")
        : path.join("EasyARGenerated", "AUTHORIZATION_STRATEGY.md");
      const target = path.resolve(root, relativePath ?? defaultRelativePath);
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, markdown, overwrite, written);
      return jsonText({
        written: written.includes(target) ? target : null,
        skipped: written.includes(target) ? null : target,
        selectedMode: report.selectedMode,
        productionReady: report.productionReady,
        officialApiReady: report.modes.officialApi.ready,
        manualModeReady: report.modes.manualBrowser.ready,
        nextActions: report.nextActions,
        security: report.security
      });
    }
  );

  registerTool(
    "easyar_account_onboarding",
    "Guide new or existing EasyAR users through official registration, login, license, Cloud Recognition credentials, and local MCP setup without collecting passwords or secrets.",
    {
      projectPath: z.string().optional().describe("Optional Unity project path used to inspect local EasyAR config and Unity bundle identifier."),
      sampleId: z.string().optional().describe("Focused sample id. Defaults to cloud-recognition because it needs account cloud credentials."),
      platform: z.enum(["android", "ios", "standalone", "unknown"]).default("android"),
      accountStage: z.enum(accountStageValues).default("unknown").describe("What the user currently knows about their EasyAR account state.")
    },
    async ({ projectPath, sampleId, platform, accountStage }) => {
      const root = projectPath ? resolveProjectPath(projectPath) : null;
      if (root) {
        await ensureDirectory(root);
      }
      const sample = sampleId ? findSample(sampleId) : findSample("cloud-recognition");
      return jsonText(await buildAccountOnboardingReport(root, sample, platform, accountStage));
    }
  );

  registerTool(
    "easyar_write_account_onboarding",
    "Write the EasyAR account registration/login and local secret setup guide as a Markdown artifact.",
    {
      projectPath: z.string().optional().describe("Optional Unity project path. If provided, writes to Assets/EasyARGenerated/ACCOUNT_ONBOARDING.md by default."),
      outputRoot: z.string().optional().describe("Output directory when projectPath is not provided."),
      sampleId: z.string().optional().describe("Focused sample id. Defaults to cloud-recognition because it needs account cloud credentials."),
      platform: z.enum(["android", "ios", "standalone", "unknown"]).default("android"),
      accountStage: z.enum(accountStageValues).default("unknown"),
      output: outputModeSchema,
      relativePath: z.string().optional().describe("Optional output path. Defaults to Assets/EasyARGenerated/ACCOUNT_ONBOARDING.md for Unity projects or EasyARGenerated/ACCOUNT_ONBOARDING.md for outputRoot."),
      overwrite: z.boolean().default(true).describe("Whether to replace an existing account onboarding artifact.")
    },
    async ({ projectPath, outputRoot, sampleId, platform, accountStage, output, relativePath, overwrite }) => {
      const root = projectPath ? resolveProjectPath(projectPath) : resolveProjectPath(outputRoot ?? process.cwd());
      await ensureDirectory(root);
      const sample = sampleId ? findSample(sampleId) : findSample("cloud-recognition");
      const report = await buildAccountOnboardingReport(projectPath ? root : null, sample, platform, accountStage);
      const markdown = buildAccountOnboardingMarkdown(report);
      if (isInlineOutput(output)) {
        return inlineMarkdownResult(markdown);
      }
      const defaultRelativePath = projectPath
        ? path.join("Assets", "EasyARGenerated", "ACCOUNT_ONBOARDING.md")
        : path.join("EasyARGenerated", "ACCOUNT_ONBOARDING.md");
      const target = path.resolve(root, relativePath ?? defaultRelativePath);
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, markdown, overwrite, written);
  
      return jsonText({
        written: written.includes(target) ? target : null,
        skipped: written.includes(target) ? null : target,
        stage: report.stage,
        sample: sample.name,
        nextActions: report.nextActions,
        note: "The account onboarding artifact contains links, checklist items, and local file paths only. It does not include account passwords, tokens, license keys, appKey, or appSecret values."
      });
    }
  );

  registerTool(
    "easyar_account_materials",
    "Generate a field-by-field checklist of EasyAR account materials, where each value comes from, where it must be stored, and whether it is safe to share.",
    {
      projectPath: z.string().optional().describe("Optional Unity project path used to resolve local config paths and current field presence."),
      sampleId: z.string().optional().describe("Focused sample id. Defaults to cloud-recognition because it needs the full account material set."),
      platform: z.enum(["android", "ios", "standalone", "unknown"]).default("android")
    },
    async ({ projectPath, sampleId, platform }) => {
      const root = projectPath ? resolveProjectPath(projectPath) : null;
      if (root) {
        await ensureDirectory(root);
      }
      const sample = sampleId ? findSample(sampleId) : findSample("cloud-recognition");
      return jsonText(await buildAccountMaterialsReport(root, sample, platform));
    }
  );

  registerTool(
    "easyar_write_account_materials",
    "Write the EasyAR account material checklist as a Markdown artifact.",
    {
      projectPath: z.string().optional().describe("Optional Unity project path. If provided, writes to Assets/EasyARGenerated/ACCOUNT_MATERIALS.md by default."),
      outputRoot: z.string().optional().describe("Output directory when projectPath is not provided."),
      sampleId: z.string().optional().describe("Focused sample id. Defaults to cloud-recognition because it needs the full account material set."),
      platform: z.enum(["android", "ios", "standalone", "unknown"]).default("android"),
      output: outputModeSchema,
      relativePath: z.string().optional().describe("Optional output path. Defaults to Assets/EasyARGenerated/ACCOUNT_MATERIALS.md for Unity projects or EasyARGenerated/ACCOUNT_MATERIALS.md for outputRoot."),
      overwrite: z.boolean().default(true)
    },
    async ({ projectPath, outputRoot, sampleId, platform, output, relativePath, overwrite }) => {
      const root = projectPath ? resolveProjectPath(projectPath) : resolveProjectPath(outputRoot ?? process.cwd());
      await ensureDirectory(root);
      const sample = sampleId ? findSample(sampleId) : findSample("cloud-recognition");
      const report = await buildAccountMaterialsReport(projectPath ? root : null, sample, platform);
      const markdown = buildAccountMaterialsMarkdown(report);
      if (isInlineOutput(output)) {
        return inlineMarkdownResult(markdown);
      }
      const defaultRelativePath = projectPath
        ? path.join("Assets", "EasyARGenerated", "ACCOUNT_MATERIALS.md")
        : path.join("EasyARGenerated", "ACCOUNT_MATERIALS.md");
      const target = path.resolve(root, relativePath ?? defaultRelativePath);
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, markdown, overwrite, written);
  
      return jsonText({
        written: written.includes(target) ? target : null,
        skipped: written.includes(target) ? null : target,
        sample: sample.name,
        requiredCount: report.materials.filter((item) => item.required).length,
        missingRequiredCount: report.materials.filter((item) => item.required && !item.present).length,
        nextActions: report.nextActions,
        note: "The account materials artifact lists field names and storage locations only. It does not include secret values."
      });
    }
  );

  registerTool(
    "easyar_portal_evidence",
    "Generate a safe EasyAR portal evidence report from non-secret browser observations such as app id, service flags, license presence, and Cloud Recognition library status.",
    {
      projectPath: z.string().optional().describe("Optional Unity project path used to compare portal observations against local config presence."),
      sampleId: z.string().optional().describe("Focused sample id. Defaults to cloud-recognition because portal evidence is most important for cloud setup."),
      platform: z.enum(["android", "ios", "standalone", "unknown"]).default("android"),
      accountName: z.string().optional().describe("Optional visible account name from the portal. Do not provide passwords or verification codes."),
      apiKeyRecordId: z.string().optional().describe("Non-secret record id from a portal URL such as /apikey/info/<id>."),
      apiKeyAppName: z.string().optional().describe("Visible API KEY application name."),
      apiKeyCreatedAt: z.string().optional().describe("Visible API KEY creation time."),
      cloudServicesEnabled: z.array(z.enum(["cloud-recognition", "spatialmap", "mega-landmark", "ar-operations", "mega-block", "other"])).default([]),
      apiKeyPresent: z.boolean().optional().describe("Whether the API KEY field is present. Do not pass the API KEY value."),
      apiSecretPresent: z.boolean().optional().describe("Whether the API Secret field is present. Do not pass the API Secret value."),
      tokenStatus: z.enum(["not-checked", "not-needed", "present", "missing", "expired", "unknown"]).default("not-checked"),
      senseLicenseStatus: z.enum(["not-checked", "present", "missing", "unknown"]).default("not-checked"),
      senseLicenseRecordId: z.string().optional().describe("Optional non-secret Sense license record id, if visible in the portal URL or table."),
      cloudLibraryStatus: z.enum(["not-checked", "present", "missing", "unknown"]).default("not-checked"),
      cloudLibraryName: z.string().optional().describe("Optional non-secret Cloud Recognition library name."),
      cloudLibraryRecordId: z.string().optional().describe("Optional non-secret Cloud Recognition library record id."),
      cloudTargetCount: z.number().int().nonnegative().optional().describe("Visible number of uploaded Cloud Recognition target images."),
      portalUrl: z.string().url().optional().describe("Optional portal page URL used for the observation. Query strings are redacted in output."),
      notes: z.array(z.string()).default([]).describe("Optional non-secret observations. Secret-looking text is redacted before output.")
    },
    async (input) => {
      const root = input.projectPath ? resolveProjectPath(input.projectPath) : null;
      if (root) {
        await ensureDirectory(root);
      }
      const sample = input.sampleId ? findSample(input.sampleId) : findSample("cloud-recognition");
      return jsonText(await buildPortalEvidenceReport({ ...input, root, sample }));
    }
  );

  registerTool(
    "easyar_write_portal_evidence",
    "Write a safe EasyAR portal evidence report without storing portal passwords, API KEY values, API Secret values, license keys, appKey, or appSecret.",
    {
      projectPath: z.string().optional().describe("Optional Unity project path. If provided, writes to Assets/EasyARGenerated/PORTAL_EVIDENCE.md by default."),
      outputRoot: z.string().optional().describe("Output directory when projectPath is not provided."),
      sampleId: z.string().optional().describe("Focused sample id. Defaults to cloud-recognition because portal evidence is most important for cloud setup."),
      platform: z.enum(["android", "ios", "standalone", "unknown"]).default("android"),
      accountName: z.string().optional(),
      apiKeyRecordId: z.string().optional(),
      apiKeyAppName: z.string().optional(),
      apiKeyCreatedAt: z.string().optional(),
      cloudServicesEnabled: z.array(z.enum(["cloud-recognition", "spatialmap", "mega-landmark", "ar-operations", "mega-block", "other"])).default([]),
      apiKeyPresent: z.boolean().optional(),
      apiSecretPresent: z.boolean().optional(),
      tokenStatus: z.enum(["not-checked", "not-needed", "present", "missing", "expired", "unknown"]).default("not-checked"),
      senseLicenseStatus: z.enum(["not-checked", "present", "missing", "unknown"]).default("not-checked"),
      senseLicenseRecordId: z.string().optional(),
      cloudLibraryStatus: z.enum(["not-checked", "present", "missing", "unknown"]).default("not-checked"),
      cloudLibraryName: z.string().optional(),
      cloudLibraryRecordId: z.string().optional(),
      cloudTargetCount: z.number().int().nonnegative().optional(),
      portalUrl: z.string().url().optional(),
      notes: z.array(z.string()).default([]),
      relativePath: z.string().optional().describe("Optional output path. Defaults to Assets/EasyARGenerated/PORTAL_EVIDENCE.md for Unity projects or EasyARGenerated/PORTAL_EVIDENCE.md for outputRoot."),
      overwrite: z.boolean().default(true)
    },
    async ({ projectPath, outputRoot, relativePath, overwrite, ...input }) => {
      const root = projectPath ? resolveProjectPath(projectPath) : resolveProjectPath(outputRoot ?? process.cwd());
      await ensureDirectory(root);
      const sample = input.sampleId ? findSample(input.sampleId) : findSample("cloud-recognition");
      const report = await buildPortalEvidenceReport({ ...input, root: projectPath ? root : null, sample });
      const defaultRelativePath = projectPath
        ? path.join("Assets", "EasyARGenerated", "PORTAL_EVIDENCE.md")
        : path.join("EasyARGenerated", "PORTAL_EVIDENCE.md");
      const target = path.resolve(root, relativePath ?? defaultRelativePath);
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, buildPortalEvidenceMarkdown(report), overwrite, written);
  
      return jsonText({
        written: written.includes(target) ? target : null,
        skipped: written.includes(target) ? null : target,
        sample: sample.name,
        readyForLocalConfig: report.readyForLocalConfig,
        readyForCloudDeviceValidation: report.readyForCloudDeviceValidation,
        blockerCount: report.blockers.length,
        nextActions: report.nextActions,
        security: report.security
      });
    }
  );

  registerTool(
    "easyar_check_account",
    "Call a configured official EasyAR account-status endpoint when official production authentication is available, without exposing secrets.",
    {},
    async () => jsonText(await easyarApi.checkAccount())
  );

  registerTool(
    "easyar_validate_license",
    "Call a configured official EasyAR license-validation endpoint without exposing license keys or account tokens.",
    {
      projectPath: z.string().optional().describe("Optional Unity project path. If provided, reads ProjectSettings/EasyAR/easyar.local.json for a license key."),
      licenseKey: z.string().optional().describe("Optional EasyAR license key. Prefer projectPath/local config or secret injection; returned output is redacted."),
      bundleIdentifier: z.string().optional().describe("Application bundle/package identifier bound to the EasyAR license."),
      platform: z.enum(["android", "ios", "standalone", "unknown"]).default("unknown")
    },
    async ({ projectPath, licenseKey, bundleIdentifier, platform }) => {
      const localConfig = projectPath ? await readLocalConfigForRemoteValidation(projectPath) : {};
      const result = await easyarApi.validateLicense({
        licenseKey: licenseKey ?? localConfig.licenseKey,
        bundleIdentifier: bundleIdentifier ?? localConfig.bundleIdentifier,
        platform
      });
  
      return jsonText({
        ...result,
        input: {
          projectPath: projectPath ? resolveProjectPath(projectPath) : null,
          hasLicenseKey: Boolean(licenseKey ?? localConfig.licenseKey),
          bundleIdentifier: bundleIdentifier ?? localConfig.bundleIdentifier ?? null,
          platform
        },
        security: "EASYAR_API_TOKEN and licenseKey are never returned by this tool."
      });
    }
  );

  registerTool(
    "easyar_discover_downloads",
    "Call a configured official EasyAR downloads endpoint to discover account-scoped SDK/sample packages without exposing tokens.",
    {
      projectPath: z.string().optional().describe("Optional Unity project path used to read Unity version."),
      sampleId: z.string().optional().describe("Optional focused sample id, for example image-tracking or cloud-recognition."),
      packageKind: z.enum(["unity-plugin", "unity-samples", "native-sdk", "xr-extension", "unknown"]).default("unity-samples")
    },
    async ({ projectPath, sampleId, packageKind }) => {
      const root = projectPath ? resolveProjectPath(projectPath) : null;
      if (root) {
        await ensureDirectory(root);
      }
      const sample = sampleId ? findSample(sampleId) : null;
      const unityVersion = root ? await readUnityVersion(root) : null;
      const result = await easyarApi.discoverDownloads({
        sampleId: sample?.id ?? sampleId,
        packageKind,
        unityVersion
      });
  
      return jsonText({
        ...result,
        input: {
          projectPath: root,
          sampleId: sample?.id ?? sampleId ?? null,
          packageKind,
          unityVersion
        },
        security: "EASYAR_API_TOKEN is never returned. This tool only calls configured official EasyAR endpoints and does not bypass download authorization."
      });
    }
  );

  registerTool(
    "easyar_discover_cloud_credentials",
    "Call a configured official EasyAR Cloud Recognition endpoint to discover account-scoped credential metadata without exposing secrets.",
    {
      projectPath: z.string().optional().describe("Optional Unity project path used to read bundle identifier from local config."),
      sampleId: z.string().optional().describe("Optional sample id. Defaults to cloud-recognition."),
      platform: z.enum(["android", "ios", "standalone", "unknown"]).default("unknown")
    },
    async ({ projectPath, sampleId, platform }) => {
      const root = projectPath ? resolveProjectPath(projectPath) : null;
      if (root) {
        await ensureDirectory(root);
      }
      const localConfig = root ? await readLocalConfigForRemoteValidation(root) : {};
      const sample = sampleId ? findSample(sampleId) : findSample("cloud-recognition");
      const result = await easyarApi.discoverCloudCredentials({
        sampleId: sample.id,
        bundleIdentifier: localConfig.bundleIdentifier,
        platform
      });
  
      return jsonText({
        ...result,
        input: {
          projectPath: root,
          sampleId: sample.id,
          bundleIdentifier: localConfig.bundleIdentifier ?? null,
          platform
        },
        security: "EASYAR_API_TOKEN, appKey, appSecret, and credential values are never returned. This tool only calls configured official EasyAR endpoints."
      });
    }
  );

  registerTool(
    "easyar_generate_official_api_contract",
    "Generate the official EasyAR account API contract required for production mcp-easyar deployment.",
    {
      baseUrl: z.string().optional().describe("Optional official API base URL. Defaults to EASYAR_API_BASE_URL or https://www.easyar.cn."),
      includeExamples: z.boolean().default(true).describe("Whether to include non-secret request/response examples.")
    },
    async ({ baseUrl, includeExamples }) => {
      return jsonText(buildOfficialApiContract(baseUrl, includeExamples));
    }
  );

  registerTool(
    "easyar_write_official_api_contract",
    "Write the official EasyAR account API contract as Markdown for backend, operations, and MCP client handoff.",
    {
      workspacePath: z.string().optional().describe("Workspace or repository path. Defaults to the current working directory."),
      relativePath: z.string().default(path.join("docs", "OFFICIAL_API_CONTRACT.md")).describe("Contract path inside the workspace."),
      baseUrl: z.string().optional().describe("Optional official API base URL. Defaults to EASYAR_API_BASE_URL or https://www.easyar.cn."),
      includeExamples: z.boolean().default(true).describe("Whether to include non-secret request/response examples."),
      overwrite: z.boolean().default(true).describe("Whether to replace an existing contract file.")
    },
    async ({ workspacePath, relativePath, baseUrl, includeExamples, overwrite }) => {
      const root = resolveProjectPath(workspacePath ?? process.cwd());
      await ensureDirectory(root);
      const contract = buildOfficialApiContract(baseUrl, includeExamples);
      const target = path.resolve(root, relativePath);
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, buildOfficialApiContractMarkdown(contract), overwrite, written);
  
      return jsonText({
        written: written.includes(target) ? target : null,
        skipped: written.includes(target) ? null : target,
        endpointCount: contract.endpoints.length,
        requiredEnv: contract.environment.required,
        configuredEnv: contract.environment.configured,
        readyForProductionOfficialAccess: contract.readyForProductionOfficialAccess,
        note: "The official API contract contains endpoint schemas and security requirements only; it does not contain tokens, license keys, appKey, or appSecret values."
      });
    }
  );

  registerTool(
    "easyar_generate_official_openapi_contract",
    "Return the machine-readable OpenAPI contract for official EasyAR account endpoint integration.",
    {},
    async () => jsonText({
      openapi: await readOfficialOpenApiContract(),
      resourceUri: "easyar://official/openapi",
      defaultPath: "docs/openapi/easyar-mcp-account-api.openapi.json",
      note: "This OpenAPI contract contains endpoint schemas and secret-handling policy only; it does not contain EasyAR tokens, license keys, API keys, appKey, appSecret, or passwords."
    })
  );

  registerTool(
    "easyar_write_official_openapi_contract",
    "Write the official EasyAR account OpenAPI contract JSON for backend, gateway, or client generation handoff.",
    {
      workspacePath: z.string().optional().describe("Workspace or repository path. Defaults to the current working directory."),
      relativePath: z.string().default(path.join("docs", "openapi", "easyar-mcp-account-api.openapi.json")).describe("OpenAPI path inside the workspace."),
      overwrite: z.boolean().default(true).describe("Whether to replace an existing OpenAPI file.")
    },
    async ({ workspacePath, relativePath, overwrite }) => {
      const root = resolveProjectPath(workspacePath ?? process.cwd());
      await ensureDirectory(root);
      const contract = await readOfficialOpenApiContract();
      const target = path.resolve(root, relativePath);
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, `${JSON.stringify(contract, null, 2)}\n`, overwrite, written);
  
      return jsonText({
        written: written.includes(target) ? target : null,
        skipped: written.includes(target) ? null : target,
        openapiVersion: contract.openapi,
        title: contract.info?.title ?? null,
        pathCount: Object.keys(contract.paths ?? {}).length,
        resourceUri: "easyar://official/openapi",
        note: "The OpenAPI file is machine-readable contract metadata only; it does not contain EasyAR secret values."
      });
    }
  );

  registerTool(
    "easyar_official_api_handoff",
    "Generate a backend and operations handoff for connecting mcp-easyar to authorized EasyAR account, license, downloads, and Cloud Recognition APIs.",
    {
      baseUrl: z.string().optional().describe("Official API base URL. Defaults to EASYAR_API_BASE_URL or https://www.easyar.cn."),
      includeCurl: z.boolean().default(true).describe("Whether to include non-secret curl canary command templates."),
      deploymentTarget: z.string().optional().describe("Optional deployment environment name, for example staging, production, or internal.")
    },
    async ({ baseUrl, includeCurl, deploymentTarget }) => {
      return jsonText(buildOfficialApiHandoff(baseUrl, includeCurl, deploymentTarget));
    }
  );

  registerTool(
    "easyar_write_official_api_handoff",
    "Write OFFICIAL_API_HANDOFF.md for backend and operations teams wiring real EasyAR official APIs into mcp-easyar.",
    {
      workspacePath: z.string().optional().describe("Workspace or repository path. Defaults to the current working directory."),
      relativePath: z.string().default(path.join("docs", "OFFICIAL_API_HANDOFF.md")).describe("Handoff path inside the workspace."),
      baseUrl: z.string().optional().describe("Official API base URL. Defaults to EASYAR_API_BASE_URL or https://www.easyar.cn."),
      includeCurl: z.boolean().default(true).describe("Whether to include non-secret curl canary command templates."),
      deploymentTarget: z.string().optional().describe("Optional deployment environment name, for example staging, production, or internal."),
      overwrite: z.boolean().default(true).describe("Whether to replace an existing handoff file.")
    },
    async ({ workspacePath, relativePath, baseUrl, includeCurl, deploymentTarget, overwrite }) => {
      const root = resolveProjectPath(workspacePath ?? process.cwd());
      await ensureDirectory(root);
      const handoff = buildOfficialApiHandoff(baseUrl, includeCurl, deploymentTarget);
      const target = path.resolve(root, relativePath);
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, buildOfficialApiHandoffMarkdown(handoff), overwrite, written);
  
      return jsonText({
        written: written.includes(target) ? target : null,
        skipped: written.includes(target) ? null : target,
        deploymentTarget: handoff.deploymentTarget,
        endpointCount: handoff.endpointMapping.length,
        envRequired: handoff.environment.required,
        acceptanceGateCount: handoff.acceptanceGates.length,
        nextActions: handoff.nextActions,
        security: handoff.security
      });
    }
  );

  registerTool(
    "easyar_check_official_access",
    "Run a focused official EasyAR account, license, downloads, and Cloud Recognition access check without exposing secrets.",
    {
      projectPath: z.string().describe("Unity project path used for Unity version, bundle identifier, and local license metadata."),
      sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
      platform: z.enum(["android", "ios", "standalone", "unknown"]).default("android"),
      packageKind: z.enum(["unity-plugin", "unity-samples", "native-sdk", "xr-extension", "unknown"]).default("unity-samples")
    },
    async ({ projectPath, sampleId, platform, packageKind }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const sample = findSample(sampleId);
      return jsonText(await buildOfficialAccessReport(root, sample, platform, packageKind));
    }
  );

  registerTool(
    "easyar_write_official_access_report",
    "Write the focused official EasyAR access check as a Markdown artifact inside the Unity project.",
    {
      projectPath: z.string().describe("Unity project path used for Unity version, bundle identifier, and local license metadata."),
      sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
      platform: z.enum(["android", "ios", "standalone", "unknown"]).default("android"),
      packageKind: z.enum(["unity-plugin", "unity-samples", "native-sdk", "xr-extension", "unknown"]).default("unity-samples"),
      relativePath: z.string().optional().describe("Optional report path inside the project. Defaults to Assets/EasyARGenerated/<sampleId>/OFFICIAL_ACCESS.md."),
      overwrite: z.boolean().default(true).describe("Whether to replace an existing official access report.")
    },
    async ({ projectPath, sampleId, platform, packageKind, relativePath, overwrite }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const sample = findSample(sampleId);
      const report = await buildOfficialAccessReport(root, sample, platform, packageKind);
      const target = relativePath
        ? path.resolve(root, relativePath)
        : path.join(focusedSampleGeneratedDir(root, sample), "OFFICIAL_ACCESS.md");
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, buildOfficialAccessMarkdown(report), overwrite, written);
  
      return jsonText({
        written: written.includes(target) ? target : null,
        skipped: written.includes(target) ? null : target,
        sample: sample.name,
        readyForOfficialContent: report.readyForOfficialContent,
        blockerCount: report.blockers.length,
        nextActions: report.nextActions,
        note: "The official access report includes endpoint status and redacted metadata only."
      });
    }
  );
}
