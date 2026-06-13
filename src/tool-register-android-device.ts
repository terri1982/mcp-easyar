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

export function registerAndroidDeviceTools(registerTool: RegisterTool) {
  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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
