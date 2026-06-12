import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { access, cp, mkdir, open, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createEasyARApiClient } from "./easyar-api.js";
import { jsonText, markdownText } from "./mcp-response.js";
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

const focusedHandoffSampleIds = ["image-tracking", "cloud-recognition", "mega", "all"] as const;

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

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const officialOpenApiPath = path.join(packageRoot, "docs", "openapi", "easyar-mcp-account-api.openapi.json");
const easyarApi = createEasyARApiClient();

export function registerTools(server: McpServer) {
  server.tool(
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
  
  server.tool(
    "easyar_list_samples",
    "List known EasyAR Unity sample categories and setup requirements.",
    {},
    async () => jsonText(samples)
  );
  
  server.tool(
    "easyar_official_info",
    "Return official EasyAR links and package versions captured by this MCP server.",
    {},
    async () => jsonText(officialInfo)
  );
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
    "easyar_write_authorization_strategy",
    "Write the safe EasyAR authorization strategy as a Markdown artifact for users, backend teams, and future MCP sessions.",
    {
      projectPath: z.string().optional().describe("Optional Unity project path. If provided, writes to Assets/EasyARGenerated/AUTHORIZATION_STRATEGY.md by default."),
      outputRoot: z.string().optional().describe("Output directory when projectPath is not provided."),
      sampleId: z.string().optional().describe("Focused sample id. Defaults to cloud-recognition."),
      platform: z.enum(["android", "ios", "standalone", "unknown"]).default("android"),
      accountStage: z.enum(accountStageValues).default("unknown"),
      preferredMode: z.enum(authorizationModeValues).default("auto"),
      relativePath: z.string().optional().describe("Optional output path. Defaults to Assets/EasyARGenerated/AUTHORIZATION_STRATEGY.md for Unity projects or EasyARGenerated/AUTHORIZATION_STRATEGY.md for outputRoot."),
      overwrite: z.boolean().default(true).describe("Whether to replace an existing authorization strategy artifact.")
    },
    async ({ projectPath, outputRoot, sampleId, platform, accountStage, preferredMode, relativePath, overwrite }) => {
      const root = projectPath ? resolveProjectPath(projectPath) : resolveProjectPath(outputRoot ?? process.cwd());
      await ensureDirectory(root);
      const sample = sampleId ? findSample(sampleId) : findSample("cloud-recognition");
      const report = await buildAuthorizationStrategyReport(projectPath ? root : null, sample, platform, accountStage, preferredMode);
      const defaultRelativePath = projectPath
        ? path.join("Assets", "EasyARGenerated", "AUTHORIZATION_STRATEGY.md")
        : path.join("EasyARGenerated", "AUTHORIZATION_STRATEGY.md");
      const target = path.resolve(root, relativePath ?? defaultRelativePath);
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, buildAuthorizationStrategyMarkdown(report), overwrite, written);
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
  
  server.tool(
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
  
  server.tool(
    "easyar_write_account_onboarding",
    "Write the EasyAR account registration/login and local secret setup guide as a Markdown artifact.",
    {
      projectPath: z.string().optional().describe("Optional Unity project path. If provided, writes to Assets/EasyARGenerated/ACCOUNT_ONBOARDING.md by default."),
      outputRoot: z.string().optional().describe("Output directory when projectPath is not provided."),
      sampleId: z.string().optional().describe("Focused sample id. Defaults to cloud-recognition because it needs account cloud credentials."),
      platform: z.enum(["android", "ios", "standalone", "unknown"]).default("android"),
      accountStage: z.enum(accountStageValues).default("unknown"),
      relativePath: z.string().optional().describe("Optional output path. Defaults to Assets/EasyARGenerated/ACCOUNT_ONBOARDING.md for Unity projects or EasyARGenerated/ACCOUNT_ONBOARDING.md for outputRoot."),
      overwrite: z.boolean().default(true).describe("Whether to replace an existing account onboarding artifact.")
    },
    async ({ projectPath, outputRoot, sampleId, platform, accountStage, relativePath, overwrite }) => {
      const root = projectPath ? resolveProjectPath(projectPath) : resolveProjectPath(outputRoot ?? process.cwd());
      await ensureDirectory(root);
      const sample = sampleId ? findSample(sampleId) : findSample("cloud-recognition");
      const report = await buildAccountOnboardingReport(projectPath ? root : null, sample, platform, accountStage);
      const defaultRelativePath = projectPath
        ? path.join("Assets", "EasyARGenerated", "ACCOUNT_ONBOARDING.md")
        : path.join("EasyARGenerated", "ACCOUNT_ONBOARDING.md");
      const target = path.resolve(root, relativePath ?? defaultRelativePath);
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, buildAccountOnboardingMarkdown(report), overwrite, written);
  
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
  
  server.tool(
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
  
  server.tool(
    "easyar_write_account_materials",
    "Write the EasyAR account material checklist as a Markdown artifact.",
    {
      projectPath: z.string().optional().describe("Optional Unity project path. If provided, writes to Assets/EasyARGenerated/ACCOUNT_MATERIALS.md by default."),
      outputRoot: z.string().optional().describe("Output directory when projectPath is not provided."),
      sampleId: z.string().optional().describe("Focused sample id. Defaults to cloud-recognition because it needs the full account material set."),
      platform: z.enum(["android", "ios", "standalone", "unknown"]).default("android"),
      relativePath: z.string().optional().describe("Optional output path. Defaults to Assets/EasyARGenerated/ACCOUNT_MATERIALS.md for Unity projects or EasyARGenerated/ACCOUNT_MATERIALS.md for outputRoot."),
      overwrite: z.boolean().default(true)
    },
    async ({ projectPath, outputRoot, sampleId, platform, relativePath, overwrite }) => {
      const root = projectPath ? resolveProjectPath(projectPath) : resolveProjectPath(outputRoot ?? process.cwd());
      await ensureDirectory(root);
      const sample = sampleId ? findSample(sampleId) : findSample("cloud-recognition");
      const report = await buildAccountMaterialsReport(projectPath ? root : null, sample, platform);
      const defaultRelativePath = projectPath
        ? path.join("Assets", "EasyARGenerated", "ACCOUNT_MATERIALS.md")
        : path.join("EasyARGenerated", "ACCOUNT_MATERIALS.md");
      const target = path.resolve(root, relativePath ?? defaultRelativePath);
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, buildAccountMaterialsMarkdown(report), overwrite, written);
  
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
    "easyar_check_account",
    "Call a configured official EasyAR account-status endpoint when official production authentication is available, without exposing secrets.",
    {},
    async () => jsonText(await easyarApi.checkAccount())
  );
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
    "easyar_write_client_setup",
    "Write a client setup Markdown report for Codex, Claude Desktop, or another stdio MCP client.",
    {
      outputRoot: z.string().describe("Directory that should receive CLIENT_SETUP.md."),
      client: z.enum(clientKinds).default("claude-desktop").describe("Target MCP client config style."),
      entrypointMode: z.enum(clientEntrypointModes).default("local-dist").describe("How the MCP client should launch the server: local dist path, installed package bin, or npx package command."),
      serverPath: z.string().optional().describe("Absolute path to dist/index.js. Used only when entrypointMode=local-dist. Defaults to this process entrypoint or dist/index.js."),
      includeTokenPlaceholder: z.boolean().default(false).describe("Advanced official-API deployment only: whether the generated config should include EASYAR_API_TOKEN placeholder text. Keep false for local-key MVP users."),
      relativePath: z.string().optional().describe("Optional report path inside outputRoot. Defaults to EasyARGenerated/CLIENT_SETUP.md."),
      overwrite: z.boolean().default(true).describe("Whether to replace an existing client setup report.")
    },
    async ({ outputRoot, client, entrypointMode, serverPath, includeTokenPlaceholder, relativePath, overwrite }) => {
      const root = resolveProjectPath(outputRoot);
      await ensureDirectory(root);
      const report = await buildClientSetupReport(client, entrypointMode, serverPath, includeTokenPlaceholder);
      const defaultRelativePath = await exists(path.join(root, "Assets"))
        ? path.join("Assets", "EasyARGenerated", "CLIENT_SETUP.md")
        : path.join("EasyARGenerated", "CLIENT_SETUP.md");
      const target = path.resolve(root, relativePath ?? defaultRelativePath);
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, buildClientSetupMarkdown(report), overwrite, written);
  
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
    "easyar_write_production_validation",
    "Write a production validation evidence matrix for official mcp-easyar deployment.",
    {
      projectPath: z.string().describe("Directory that should receive the production validation report. Unity projects use Assets/EasyARGenerated by default."),
      platform: z.enum(["android", "ios"]).default("android").describe("Target mobile platform for focused sample completion evidence."),
      unityPath: z.string().optional().describe("Optional Unity executable path. Defaults to EASYAR_UNITY_PATH or Unity command lookup."),
      verificationEvidence: z.enum(["not-provided", "passed"]).default("not-provided").describe("Whether npm/CI verification commands have been run and passed outside this report."),
      relativePath: z.string().optional().describe("Optional report path inside projectPath. Defaults to Assets/EasyARGenerated/PRODUCTION_VALIDATION.md when Assets exists, otherwise EasyARGenerated/PRODUCTION_VALIDATION.md."),
      maxScriptIssues: z.number().int().min(1).max(200).default(40),
      maxLogBytes: z.number().int().min(1024).max(1024 * 1024).default(200000),
      maxLogIssues: z.number().int().min(1).max(200).default(30),
      overwrite: z.boolean().default(true).describe("Whether to replace an existing production validation report.")
    },
    async ({ projectPath, platform, unityPath, verificationEvidence, relativePath, maxScriptIssues, maxLogBytes, maxLogIssues, overwrite }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const report = await buildProductionValidationReport(root, undefined, platform, unityPath, verificationEvidence, maxScriptIssues, maxLogBytes, maxLogIssues);
      const defaultRelativePath = await exists(path.join(root, "Assets"))
        ? path.join("Assets", "EasyARGenerated", "PRODUCTION_VALIDATION.md")
        : path.join("EasyARGenerated", "PRODUCTION_VALIDATION.md");
      const target = path.resolve(root, relativePath ?? defaultRelativePath);
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, buildProductionValidationMarkdown(report), overwrite, written);
  
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
  
  server.tool(
    "easyar_release_manifest",
    "Generate a consumer-facing install and release manifest for mcp-easyar.",
    {},
    async () => jsonText(await buildReleaseManifest())
  );
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
    "easyar_write_first_run_guide",
    "Write FIRST_RUN.md, the first-screen guide for a new EasyAR MCP user or a handoff to another AI tool.",
    {
      projectPath: z.string().optional().describe("Optional Unity project path. If provided, writes to Assets/EasyARGenerated/FIRST_RUN.md by default."),
      outputRoot: z.string().optional().describe("Output directory when projectPath is not provided."),
      sampleId: z.string().optional().describe("Optional focused sample id. Defaults to cloud-recognition because it exercises the full account/config path."),
      platform: z.enum(["android", "ios"]).default("android"),
      accountStage: z.enum(accountStageValues).default("unknown"),
      client: z.enum(clientKinds).default("claude-desktop"),
      relativePath: z.string().optional().describe("Optional output path. Defaults to Assets/EasyARGenerated/FIRST_RUN.md for Unity projects or EasyARGenerated/FIRST_RUN.md for outputRoot."),
      overwrite: z.boolean().default(true).describe("Whether to replace an existing first-run guide.")
    },
    async ({ projectPath, outputRoot, sampleId, platform, accountStage, client, relativePath, overwrite }) => {
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
      const defaultRelativePath = projectPath
        ? path.join("Assets", "EasyARGenerated", "FIRST_RUN.md")
        : path.join("EasyARGenerated", "FIRST_RUN.md");
      const target = path.resolve(root, relativePath ?? defaultRelativePath);
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, buildFirstRunGuideMarkdown(guide), overwrite, written);
  
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
    "easyar_write_remaining_work_report",
    "Write REMAINING_WORK.md, an evidence-weighted gap report for the remaining mcp-easyar production and focused sample run-through work.",
    {
      projectPath: z.string().optional().describe("Optional Unity project path. If provided, writes to Assets/EasyARGenerated/REMAINING_WORK.md by default."),
      outputRoot: z.string().optional().describe("Output directory when projectPath is not provided."),
      platform: z.enum(["android", "ios"]).default("android"),
      verificationEvidence: z.enum(["not-provided", "passed"]).default("not-provided").describe("Set to passed only after local verification commands or CI evidence has passed for the current commit."),
      relativePath: z.string().optional().describe("Optional output path. Defaults to Assets/EasyARGenerated/REMAINING_WORK.md for Unity projects or EasyARGenerated/REMAINING_WORK.md for outputRoot."),
      maxScriptIssues: z.number().int().positive().max(100).default(25),
      maxLogBytes: z.number().int().positive().max(1024 * 1024).default(200000),
      maxLogIssues: z.number().int().positive().max(50).default(20),
      overwrite: z.boolean().default(true).describe("Whether to replace an existing remaining-work report.")
    },
    async ({ projectPath, outputRoot, platform, verificationEvidence, relativePath, maxScriptIssues, maxLogBytes, maxLogIssues, overwrite }) => {
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
      const defaultRelativePath = projectPath
        ? path.join("Assets", "EasyARGenerated", "REMAINING_WORK.md")
        : path.join("EasyARGenerated", "REMAINING_WORK.md");
      const target = path.resolve(root, relativePath ?? defaultRelativePath);
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, buildRemainingWorkMarkdown(report), overwrite, written);
  
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
    "easyar_write_focused_preflight",
    "Write the focused sample preflight gate as a Markdown artifact inside the Unity project.",
    {
      projectPath: z.string().describe("Unity project path."),
      sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
      platform: z.enum(["android", "ios"]).default("android"),
      outputPath: z.string().optional().describe("Build output path. Defaults to Builds/<sampleId>.apk for Android or Builds/iOS/<sampleId>."),
      relativePath: z.string().optional().describe("Optional preflight path inside the project. Defaults to Assets/EasyARGenerated/<sampleId>/PREFLIGHT.md."),
      maxScriptIssues: z.number().int().positive().max(100).default(25),
      overwrite: z.boolean().default(true).describe("Whether to replace an existing preflight artifact.")
    },
    async ({ projectPath, sampleId, platform, outputPath, relativePath, maxScriptIssues, overwrite }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const sample = findSample(sampleId);
      const defaultOutput = platform === "android"
        ? `Builds/${sample.id}.apk`
        : `Builds/iOS/${sample.id}`;
      const preflight = await buildFocusedPreflight(root, sample, platform, outputPath ?? defaultOutput, maxScriptIssues);
      const target = relativePath
        ? path.resolve(root, relativePath)
        : path.join(focusedSampleGeneratedDir(root, sample), "PREFLIGHT.md");
      assertInside(root, target);
      const written: string[] = [];
      await writeGeneratedFile(target, buildFocusedPreflightMarkdown(preflight), overwrite, written);
  
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
    "easyar_unity_environment",
    "Inspect local Unity executable configuration and common install locations without launching Unity.",
    {},
    async () => {
      return jsonText(await buildUnityEnvironmentReport(null, null));
    }
  );
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
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
  
  server.tool(
    "easyar_android_device_status",
    "Inspect adb availability and connected Android devices for focused sample validation.",
    {
      adbPath: z.string().optional().describe("Optional adb executable path. Defaults to EASYAR_ADB_PATH or adb on PATH."),
      timeoutSeconds: z.number().int().positive().max(60).default(10)
    },
    async ({ adbPath, timeoutSeconds }) => {
      const adb = adbPath ?? process.env.EASYAR_ADB_PATH ?? "adb";
      const result = await runProcess(adb, ["devices", "-l"], timeoutSeconds);
      const devices = parseAdbDevices(result.stdout);
      return jsonText({
        adb,
        command: result.command,
        adbAvailable: result.exitCode !== null,
        exitCode: result.exitCode,
        deviceCount: devices.filter((device) => device.state === "device").length,
        devices,
        stderr: redactSecretText(result.stderr),
        readyForInstall: result.exitCode === 0 && devices.some((device) => device.state === "device"),
        nextActions: buildAndroidDeviceStatusActions(result, devices),
        security: "This tool does not read EasyAR credentials and returns adb device metadata only."
      });
    }
  );
  
  server.tool(
    "easyar_android_install_apk",
    "Install a focused sample Android APK on a connected device with adb.",
    {
      projectPath: z.string().describe("Unity project path."),
      sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
      apkPath: z.string().optional().describe("APK path. Defaults to Builds/<sampleId>.apk inside the Unity project."),
      adbPath: z.string().optional().describe("Optional adb executable path. Defaults to EASYAR_ADB_PATH or adb on PATH."),
      deviceSerial: z.string().optional().describe("Optional adb serial for a specific device."),
      reinstall: z.boolean().default(true).describe("Pass adb install -r to replace an existing install."),
      allowDowngrade: z.boolean().default(true).describe("Pass adb install -d when reinstalling an older build."),
      dryRun: z.boolean().default(false).describe("Return the adb command without installing."),
      timeoutSeconds: z.number().int().positive().max(600).default(180)
    },
    async ({ projectPath, sampleId, apkPath, adbPath, deviceSerial, reinstall, allowDowngrade, dryRun, timeoutSeconds }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const sample = findSample(sampleId);
      const adb = adbPath ?? process.env.EASYAR_ADB_PATH ?? "adb";
      const resolvedApk = path.resolve(root, apkPath ?? path.join("Builds", `${sample.id}.apk`));
      assertInside(root, resolvedApk);
      const apkExists = await exists(resolvedApk);
      const args = [
        ...(deviceSerial ? ["-s", deviceSerial] : []),
        "install",
        ...(reinstall ? ["-r"] : []),
        ...(allowDowngrade ? ["-d"] : []),
        resolvedApk
      ];
      if (dryRun) {
        return jsonText({
          dryRun: true,
          sample: sample.name,
          apkPath: resolvedApk,
          apkExists,
          command: [adb, ...args].join(" "),
          nextActions: apkExists
            ? ["Connect a real Android device with USB debugging enabled, then run without dryRun."]
            : ["Build the APK first with easyar_create_device_build_helper and easyar_run_unity_method."]
        });
      }
      if (!apkExists) {
        throw new Error(`APK does not exist: ${resolvedApk}`);
      }
      const result = await runProcess(adb, args, timeoutSeconds);
      const combined = `${result.stdout}\n${result.stderr}`;
      const success = result.exitCode === 0 && /\bSuccess\b/i.test(combined);
      return jsonText({
        sample: sample.name,
        apkPath: resolvedApk,
        deviceSerial: deviceSerial ?? null,
        command: result.command,
        exitCode: result.exitCode,
        success,
        stdout: redactSecretText(result.stdout).slice(-12000),
        stderr: redactSecretText(result.stderr).slice(-12000),
        suggestedRunResultCall: buildSuggestedRunResultCall({
          root,
          sample,
          platform: "android",
          overallStatus: success ? "passed" : "blocked",
          stepName: "Android APK install",
          status: success ? "passed" : "blocked",
          evidence: success ? `Installed ${path.relative(root, resolvedApk)} on ${deviceSerial ?? "connected Android device"}.` : `adb install exitCode=${result.exitCode ?? "unknown"}.`,
          nextAction: success ? "Start the app and collect device logs with easyar_android_start_app and easyar_android_collect_logcat." : "Check adb device authorization, APK path, Android SDK platform tools, and install output."
        }),
        nextActions: success
          ? ["Run easyar_android_start_app for this package, then perform the real sample validation steps."]
          : ["Run easyar_android_device_status, authorize the device, and retry the install."]
      });
    }
  );
  
  server.tool(
    "easyar_android_start_app",
    "Start the focused sample Android app on a connected device with adb monkey.",
    {
      projectPath: z.string().describe("Unity project path."),
      sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
      bundleIdentifier: z.string().optional().describe("Android package name. Defaults to unity.bundleIdentifier from local config or sample default."),
      adbPath: z.string().optional().describe("Optional adb executable path. Defaults to EASYAR_ADB_PATH or adb on PATH."),
      deviceSerial: z.string().optional().describe("Optional adb serial for a specific device."),
      dryRun: z.boolean().default(false).describe("Return the adb command without launching."),
      timeoutSeconds: z.number().int().positive().max(120).default(30)
    },
    async ({ projectPath, sampleId, bundleIdentifier, adbPath, deviceSerial, dryRun, timeoutSeconds }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const sample = findSample(sampleId);
      const localConfig = await readLocalConfigForRemoteValidation(root);
      const packageName = bundleIdentifier ?? localConfig.bundleIdentifier ?? defaultBundleIdentifier(sample);
      const adb = adbPath ?? process.env.EASYAR_ADB_PATH ?? "adb";
      const args = [
        ...(deviceSerial ? ["-s", deviceSerial] : []),
        "shell",
        "monkey",
        "-p",
        packageName,
        "-c",
        "android.intent.category.LAUNCHER",
        "1"
      ];
      if (dryRun) {
        return jsonText({
          dryRun: true,
          sample: sample.name,
          packageName,
          command: [adb, ...args].join(" "),
          nextActions: ["Run without dryRun after installing the APK, then validate camera permission and sample behavior on the device."]
        });
      }
      const result = await runProcess(adb, args, timeoutSeconds);
      const combined = `${result.stdout}\n${result.stderr}`;
      const success = result.exitCode === 0 && !/Error|No activities found|monkey aborted/i.test(combined);
      return jsonText({
        sample: sample.name,
        packageName,
        deviceSerial: deviceSerial ?? null,
        command: result.command,
        exitCode: result.exitCode,
        success,
        stdout: redactSecretText(result.stdout).slice(-12000),
        stderr: redactSecretText(result.stderr).slice(-12000),
        suggestedRunResultCall: buildSuggestedRunResultCall({
          root,
          sample,
          platform: "android",
          overallStatus: success ? "passed" : "blocked",
          stepName: "Android app launch",
          status: success ? "passed" : "blocked",
          evidence: success ? `Launched ${packageName} on ${deviceSerial ?? "connected Android device"}.` : `adb monkey exitCode=${result.exitCode ?? "unknown"}.`,
          nextAction: success ? "Grant camera permission if prompted and perform the focused real-device validation checklist." : "Confirm the package name, install status, launcher activity, and adb output."
        }),
        nextActions: success
          ? ["Perform the real sample validation steps, then collect logcat evidence."]
          : ["Install the APK, confirm the package identifier, and retry app launch."]
      });
    }
  );
  
  server.tool(
    "easyar_android_collect_logcat",
    "Collect a redacted adb logcat snapshot for focused sample device validation.",
    {
      projectPath: z.string().describe("Unity project path."),
      sampleId: z.string().describe("Focused sample id: image-tracking or cloud-recognition."),
      adbPath: z.string().optional().describe("Optional adb executable path. Defaults to EASYAR_ADB_PATH or adb on PATH."),
      deviceSerial: z.string().optional().describe("Optional adb serial for a specific device."),
      relativePath: z.string().optional().describe("Optional log path inside the project. Defaults to Logs/mcp-easyar-DeviceLog-<sampleId>.log."),
      filterPattern: z.string().optional().describe("Optional case-insensitive regex filter for log lines. Defaults to EasyAR/Unity/sample-relevant terms."),
      clearFirst: z.boolean().default(false).describe("Run adb logcat -c before collecting. Use before launching when starting a fresh evidence capture."),
      maxBytes: z.number().int().positive().max(2 * 1024 * 1024).default(300000),
      timeoutSeconds: z.number().int().positive().max(120).default(30)
    },
    async ({ projectPath, sampleId, adbPath, deviceSerial, relativePath, filterPattern, clearFirst, maxBytes, timeoutSeconds }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const sample = findSample(sampleId);
      const adb = adbPath ?? process.env.EASYAR_ADB_PATH ?? "adb";
      if (clearFirst) {
        await runProcess(adb, [...(deviceSerial ? ["-s", deviceSerial] : []), "logcat", "-c"], timeoutSeconds);
      }
      const result = await runProcess(adb, [...(deviceSerial ? ["-s", deviceSerial] : []), "logcat", "-d", "-v", "time"], timeoutSeconds);
      const pattern = new RegExp(filterPattern ?? defaultAndroidLogcatFilter(sample), "i");
      const raw = `${result.stdout}\n${result.stderr}`;
      const filtered = raw.split(/\r?\n/).filter((line) => pattern.test(line)).join("\n");
      const redacted = redactSecretText(filtered || raw).slice(-maxBytes);
      const target = path.resolve(root, relativePath ?? path.join("Logs", `mcp-easyar-DeviceLog-${sample.id}.log`));
      assertInside(root, target);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, redacted + (redacted.endsWith("\n") ? "" : "\n"), "utf8");
      const issues = analyzeUnityLog(redacted, sample);
      return jsonText({
        sample: sample.name,
        deviceSerial: deviceSerial ?? null,
        command: result.command,
        exitCode: result.exitCode,
        written: target,
        filteredLineCount: redacted.split(/\r?\n/).filter(Boolean).length,
        summary: summarizeLog(redacted),
        issueCount: issues.length,
        issues,
        suggestedRunResultCall: buildSuggestedRunResultCall({
          root,
          sample,
          platform: "android",
          overallStatus: result.exitCode === 0 && issues.length === 0 ? "passed" : "blocked",
          stepName: "Android device logcat evidence",
          status: result.exitCode === 0 && issues.length === 0 ? "passed" : "blocked",
          evidence: `Collected redacted logcat snapshot at ${path.relative(root, target)}.`,
          nextAction: "Use this log together with observed device behavior before writing a passed RUN_RESULT.md."
        }),
        nextActions: issues.length > 0
          ? Array.from(new Set(issues.flatMap((issue) => issue.actions)))
          : ["Review the written log and observed device behavior, then record RUN_RESULT.md with real-device evidence."],
        security: "The written log is filtered and redacted for common EasyAR token, key, license, credential, password, and secret fields. Review before sharing publicly."
      });
    }
  );
}
