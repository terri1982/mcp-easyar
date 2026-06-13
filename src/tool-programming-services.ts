import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { access, cp, mkdir, open, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { createEasyARApiClient } from "./easyar-api.js";
import { focusedHandoffSampleIds } from "./focused-scope.js";
import { jsonText, markdownText } from "./mcp-response.js";
import { officialOpenApiPath, packageRoot } from "./paths.js";
import { summarizeLog } from "./tool-log-summary.js";
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


export async function buildCodePlan(root: string, sample: SampleInfo, goal: string, targetFiles: string[], maxScriptIssues: number) {
  const normalizedTargets = targetFiles.map((relativePath) => normalizeProjectRelativePath(root, relativePath));
  const defaultKind = sample.id === "cloud-recognition" ? "cloud-recognition" : "image-tracking";
  const suggestedClassName = sample.id === "cloud-recognition"
    ? "CloudRecognitionResultController"
    : "ImageTargetContentController";
  const suggestedPrimaryFile = normalizedTargets[0] ?? `Assets/Scripts/${suggestedClassName}.cs`;
  const scriptReview = await buildScriptReviewReport(root, normalizedTargets.length > 0 ? normalizedTargets : undefined, 80, maxScriptIssues);
  const readiness = await buildSampleReadinessReport(root, sample);
  const implementationSteps = buildCodePlanImplementationSteps(sample, suggestedPrimaryFile, suggestedClassName, defaultKind);
  const verificationCalls = buildCodePlanVerificationCalls(root, sample);
  const riskChecks = [
    "Do not hardcode EasyAR license keys, account tokens, appKey, appSecret, signing keys, or provisioning secrets.",
    "Keep generated code scoped to target files and avoid unrelated scene/prefab rewrites.",
    "Use serialized fields for scene references so users can wire objects in the Unity Inspector.",
    "Run easyar_review_csharp_scripts before Unity compilation.",
    "Run easyar_run_unity_compile_check after writing scripts."
  ];

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    goal,
    targetFiles: normalizedTargets.length > 0 ? normalizedTargets : [suggestedPrimaryFile],
    suggestedTemplate: {
      tool: "easyar_create_mono_behaviour",
      arguments: {
        projectPath: root,
        relativePath: suggestedPrimaryFile,
        className: suggestedClassName,
        kind: defaultKind
      }
    },
    readinessSummary: {
      ready: readiness.ready,
      failingChecks: readiness.checks.filter((check) => !check.ok).map((check) => check.id)
    },
    scriptReviewSummary: {
      reviewedFileCount: scriptReview.reviewedFileCount,
      issueCount: scriptReview.issueCount,
      issues: scriptReview.issues
    },
    implementationSteps,
    riskChecks,
    verificationCalls,
    verificationSteps: [
      "Call easyar_review_csharp_scripts for changed scripts.",
      "Call easyar_run_unity_compile_check with sampleId, platform, and a project-local logPath.",
      "Use the returned suggestedRunResultCall to update RUN_RESULT.md.",
      "Regenerate easyar_write_support_bundle after Unity compilation or build attempts.",
      "Record outcome with easyar_write_run_result."
    ],
    nextActions: [
      "Review CODE_PLAN.md before editing scripts.",
      normalizedTargets.length > 0
        ? "Patch only the listed target files with easyar_write_csharp_file."
        : "Create the suggested MonoBehaviour template with easyar_create_mono_behaviour, then patch only the generated script.",
      "Run static script review before opening Unity batch compilation."
    ],
    security: "This code plan does not include secret values. Keep official EasyAR credentials in local config or environment-backed storage."
  };
}

export async function buildCodeChangeSummary(
  root: string,
  sample: SampleInfo,
  goal: string,
  targetFiles: string[],
  notes: string | undefined,
  maxIssues: number
) {
  if (targetFiles.length === 0) {
    throw new Error("targetFiles must include at least one changed .cs file.");
  }
  const normalizedTargets = targetFiles.map((relativePath) => normalizeProjectRelativePath(root, relativePath));
  const fileSummaries = await Promise.all(normalizedTargets.map(async (relativePath) => {
    const absolutePath = path.join(root, relativePath);
    if (!await exists(absolutePath)) {
      return {
        path: relativePath,
        exists: false,
        sizeBytes: null,
        lineCount: null,
        mentionsEasyAR: false,
        mentionsMonoBehaviour: false
      };
    }
    const text = await readFile(absolutePath, "utf8");
    return {
      path: relativePath,
      exists: true,
      sizeBytes: Buffer.byteLength(text, "utf8"),
      lineCount: text.split(/\r?\n/).length,
      mentionsEasyAR: /\busing\s+EasyAR\b|EasyAR\./.test(text),
      mentionsMonoBehaviour: /:\s*MonoBehaviour\b/.test(text)
    };
  }));
  const scriptReview = await buildScriptReviewReport(root, normalizedTargets, normalizedTargets.length, maxIssues);
  const missingFiles = fileSummaries.filter((file) => !file.exists).map((file) => file.path);
  const nextActions = buildCodeChangeNextActions(sample, scriptReview.issueCount, missingFiles);

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    goal,
    notes: sanitizeRunResultNotes(notes),
    targetFiles: normalizedTargets,
    fileSummaries,
    scriptReview,
    missingFiles,
    nextActions,
    security: "Secret values are not returned. Do not include EasyAR license keys, account tokens, appKey, appSecret, signing keys, or provisioning secrets in code change notes."
  };
}

export async function buildProgrammingContext(
  root: string,
  sample: SampleInfo,
  goal: string | undefined,
  maxFiles: number,
  maxIssues: number
) {
  const scriptPaths = await findFiles(root, ["Assets"], /\.cs$/i, maxFiles);
  const scriptDetails = await Promise.all(scriptPaths.map(async (relativePath) => {
    const text = await readFile(path.join(root, relativePath), "utf8").catch(() => "");
    const generated = /^Assets[\/\\]Editor[\/\\]EasyAR.*\.cs$/i.test(relativePath) || /^Assets[\/\\]EasyARGenerated[\/\\]/i.test(relativePath);
    return {
      path: relativePath,
      generated,
      mentionsEasyAR: /\busing\s+EasyAR\b|EasyAR\.|EasyAR/i.test(text),
      mentionsMonoBehaviour: /:\s*MonoBehaviour\b/.test(text),
      lineCount: text ? text.split(/\r?\n/).length : 0,
      sizeBytes: Buffer.byteLength(text, "utf8")
    };
  }));
  const scriptReview = await buildScriptReviewReport(root, undefined, maxFiles, maxIssues);
  const readiness = await buildSampleReadinessReport(root, sample);
  const suggestedPrimaryFile = sample.id === "cloud-recognition"
    ? "Assets/Scripts/CloudRecognitionResultController.cs"
    : "Assets/Scripts/ImageTargetContentController.cs";
  const suggestedTemplateKind = sample.id === "cloud-recognition" ? "cloud-recognition" : "image-tracking";
  const easyarScripts = scriptDetails.filter((script) => script.mentionsEasyAR && !script.generated);
  const monoBehaviours = scriptDetails.filter((script) => script.mentionsMonoBehaviour && !script.generated);
  const generatedHelpers = scriptDetails.filter((script) => script.generated);

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    goal: goal ?? null,
    scriptInventory: {
      totalScripts: scriptDetails.length,
      easyarScripts,
      monoBehaviours,
      generatedHelpers,
      scripts: scriptDetails
    },
    readinessSummary: {
      ready: readiness.ready,
      failingChecks: readiness.checks.filter((check) => !check.ok).map((check) => check.id)
    },
    scriptReview: {
      reviewedFileCount: scriptReview.reviewedFileCount,
      issueCount: scriptReview.issueCount,
      issues: scriptReview.issues
    },
    recommendedWorkflow: [
      "Read PREFLIGHT.md before editing scripts.",
      "Call easyar_write_config_integration_audit before wiring license or Cloud Recognition fields.",
      "Call easyar_generate_code_plan or easyar_write_code_plan with the programming goal.",
      `Create or patch ${suggestedPrimaryFile} with easyar_create_mono_behaviour or easyar_write_csharp_file.`,
      "Run easyar_review_csharp_scripts after edits.",
      "Write CODE_CHANGE.md with easyar_write_code_change_summary.",
      "Run easyar_run_unity_compile_check only after static review is clean."
    ],
    suggestedTemplate: {
      tool: "easyar_create_mono_behaviour",
      arguments: {
        projectPath: root,
        relativePath: suggestedPrimaryFile,
        className: path.basename(suggestedPrimaryFile, ".cs"),
        kind: suggestedTemplateKind
      }
    },
    relatedArtifacts: {
      preflight: path.relative(root, path.join(focusedSampleGeneratedDir(root, sample), "PREFLIGHT.md")),
      configIntegration: path.relative(root, path.join(focusedSampleGeneratedDir(root, sample), "CONFIG_INTEGRATION.md")),
      codePlan: path.relative(root, path.join(focusedSampleGeneratedDir(root, sample), "CODE_PLAN.md")),
      codeChange: path.relative(root, path.join(focusedSampleGeneratedDir(root, sample), "CODE_CHANGE.md")),
      programmingContext: path.relative(root, path.join(focusedSampleGeneratedDir(root, sample), "PROGRAMMING_CONTEXT.md"))
    },
    nextActions: [
      `Run easyar_write_config_integration_audit projectPath=${root} sampleId=${sample.id}.`,
      `Run easyar_write_code_plan projectPath=${root} sampleId=${sample.id} goal="${goal ?? "describe the requested script change"}".`,
      `Use ${easyarScripts.length > 0 ? "existing EasyAR-related scripts as edit candidates" : "the suggested MonoBehaviour template as the first edit candidate"}.`,
      "Do not hardcode EasyAR license keys, account tokens, appKey, appSecret, signing keys, or provisioning secrets.",
      "Run easyar_review_csharp_scripts before Unity compilation."
    ],
    security: "Programming context reports script paths, counts, static findings, and recommended workflow only. It does not include EasyAR local config secret values."
  };
}

export async function buildConfigIntegrationAudit(
  root: string,
  sample: SampleInfo,
  maxFiles: number,
  maxCandidates: number
) {
  const [localConfig, readiness, scriptPaths, assetPaths] = await Promise.all([
    buildLocalConfigValidationReport(root),
    buildSampleReadinessReport(root, sample),
    findFiles(root, ["Assets"], /\.cs$/i, maxFiles),
    findFiles(root, ["Assets"], /\.(unity|prefab|asset|controller|playable|mat|yaml|json)$/i, maxFiles)
  ]);
  const scriptCandidates = await scanConfigIntegrationFiles(root, scriptPaths, "script", maxCandidates);
  const assetCandidates = await scanConfigIntegrationFiles(root, assetPaths, "asset", maxCandidates);
  const consumerCandidates = [...scriptCandidates, ...assetCandidates]
    .sort((left, right) => scoreConfigCandidate(right, sample) - scoreConfigCandidate(left, sample))
    .slice(0, maxCandidates);
  const generatedHelpers = scriptCandidates.filter((candidate) => /^Assets[\/\\]Editor[\/\\]EasyAR/i.test(candidate.path));
  const localConfigValid = localConfig.valid;
  const hasLocalConfigReader = consumerCandidates.some((candidate) => candidate.signals.includes("local-config-reader"));
  const hasLicenseConsumer = consumerCandidates.some((candidate) => candidate.signals.includes("license-consumer"));
  const hasCloudConsumer = consumerCandidates.some((candidate) => candidate.signals.includes("cloud-credential-consumer"));
  const needsCloudRecognition = sample.id === "cloud-recognition";
  const blockers = [
    ...(!localConfigValid
      ? [{
          id: "local-config-invalid",
          detail: `Local config failing check(s): ${localConfig.checks.filter((check) => !check.ok).map((check) => check.id).join(", ")}.`,
          action: "Fill ProjectSettings/EasyAR/easyar.local.json locally or use easyar_write_local_config_from_env, then rerun this audit."
        }]
      : []),
    ...(!hasLicenseConsumer
      ? [{
          id: "license-consumer-not-found",
          detail: "No script/scene/asset candidate clearly references an EasyAR license consumer.",
          action: "Inspect the official sample scene and EasyAR settings asset; use CODE_PLAN.md before adding any script that reads license data."
        }]
      : []),
    ...(needsCloudRecognition && !hasCloudConsumer
      ? [{
          id: "cloud-credential-consumer-not-found",
          detail: "No Cloud Recognition appId/apiKey consumer was found in scripts, scenes, prefabs, or assets.",
          action: "Inspect the official Cloud Recognition sample scripts and wire credentials through serialized fields or official APIs without hardcoding secrets."
        }]
      : []),
    ...(!hasLocalConfigReader
      ? [{
          id: "local-config-reader-not-found",
          detail: "No non-generated project script appears to read ProjectSettings/EasyAR/easyar.local.json.",
          action: "Prefer official sample wiring first. If automation is needed, create a small Editor/runtime adapter from CODE_PLAN.md that reads local config without logging values."
        }]
      : [])
  ];
  const nextActions = Array.from(new Set([
    ...blockers.map((blocker) => blocker.action),
    consumerCandidates.length > 0
      ? "Review the top consumer candidates before editing scripts or scene references."
      : "Import the official EasyAR Unity Plugin and focused sample scene, then rerun this audit.",
    `Run easyar_write_programming_context projectPath=${root} sampleId=${sample.id} goal="wire local EasyAR config into the focused sample".`,
    `Run easyar_write_code_plan projectPath=${root} sampleId=${sample.id} goal="wire local EasyAR config without hardcoding secrets" targetFiles=[] before code edits.`
  ]));

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    readyForConfigIntegration: localConfigValid && blockers.length === 0,
    localConfig: {
      valid: localConfig.valid,
      configPath: localConfig.configPath,
      failedChecks: localConfig.checks.filter((check) => !check.ok).map((check) => check.id)
    },
    readinessSummary: {
      ready: readiness.ready,
      failingChecks: readiness.checks.filter((check) => !check.ok).map((check) => check.id)
    },
    scanSummary: {
      scriptFilesScanned: scriptPaths.length,
      assetFilesScanned: assetPaths.length,
      consumerCandidateCount: consumerCandidates.length,
      generatedHelperCount: generatedHelpers.length
    },
    detectedCapabilities: {
      hasLocalConfigReader,
      hasLicenseConsumer,
      hasCloudConsumer,
      needsCloudRecognition
    },
    consumerCandidates,
    blockers: uniqueBlockers(blockers),
    nextActions,
    security: "This audit reports paths, signal names, and redacted snippets only. It never returns EasyAR license keys, account tokens, appKey, appSecret, or local config values."
  };
}

export async function scanConfigIntegrationFiles(
  root: string,
  relativePaths: string[],
  kind: "script" | "asset",
  maxCandidates: number
) {
  const candidates = [];
  for (const relativePath of relativePaths) {
    if (candidates.length >= maxCandidates) {
      break;
    }
    const absolutePath = path.join(root, relativePath);
    const text = await readFile(absolutePath, "utf8").catch(() => "");
    if (!text) {
      continue;
    }
    const signals = configIntegrationSignals(text);
    if (signals.length === 0) {
      continue;
    }
    candidates.push({
      path: relativePath,
      kind,
      generated: /^Assets[\/\\](Editor[\/\\]EasyAR|EasyARGenerated[\/\\])/i.test(relativePath),
      signals,
      redactedSnippets: redactedConfigSnippets(text)
    });
  }
  return candidates;
}

export function configIntegrationSignals(text: string): string[] {
  const checks = [
    ["easyar-reference", /\bEasyAR\b|EasyAR\./i],
    ["local-config-reader", /easyar\.local\.json|ProjectSettings[\/\\]EasyAR|File\.ReadAllText|JsonUtility|Newtonsoft|System\.Text\.Json/i],
    ["license-consumer", /license(Key)?|SenseLicense|SDK\s*Authorization|EasyAR.*license/i],
    ["cloud-credential-consumer", /cloudRecognition|CloudRecognizer|CloudRecognition|appId|appKey|appSecret|CRS|Cloud\s*Recognition/i],
    ["serialized-field", /\[SerializeField\]|public\s+(string|TextAsset|GameObject|MonoBehaviour)\s+\w+/i],
    ["scene-or-prefab-reference", /m_Script|MonoBehaviour|GameObject|PrefabInstance|SceneRoots/i]
  ] as const;
  return checks.filter(([, pattern]) => pattern.test(text)).map(([id]) => id);
}

export function redactedConfigSnippets(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const snippets: string[] = [];
  const pattern = /easyar\.local\.json|license|cloudRecognition|CloudRecognizer|CloudRecognition|appId|appKey|appSecret|CRS/i;
  for (let index = 0; index < lines.length && snippets.length < 5; index += 1) {
    if (pattern.test(lines[index])) {
      snippets.push(`L${index + 1}: ${(sanitizeIssueText(lines[index].trim()) ?? "").slice(0, 220)}`);
    }
  }
  return snippets;
}

export function scoreConfigCandidate(candidate: { generated: boolean; signals: string[] }, sample: SampleInfo): number {
  const weights: Record<string, number> = {
    "local-config-reader": 6,
    "cloud-credential-consumer": sample.id === "cloud-recognition" ? 5 : 1,
    "license-consumer": 4,
    "easyar-reference": 3,
    "serialized-field": 2,
    "scene-or-prefab-reference": 1
  };
  return candidate.signals.reduce((score, signal) => score + (weights[signal] ?? 0), candidate.generated ? -2 : 0);
}

export function buildCodeChangeNextActions(
  sample: SampleInfo,
  issueCount: number,
  missingFiles: string[]
): string[] {
  const actions: string[] = [];
  if (missingFiles.length > 0) {
    actions.push(`Create or correct missing target file(s): ${missingFiles.join(", ")}.`);
  }
  if (issueCount > 0) {
    actions.push("Fix static script review issues before Unity compilation.");
  }
  actions.push(`Run easyar_run_unity_compile_check with sampleId=${sample.id}.`);
  actions.push("Regenerate easyar_write_support_bundle after Unity compile or build attempts.");
  actions.push("Record the outcome with easyar_write_run_result.");
  return actions;
}

export function normalizeProjectRelativePath(root: string, relativePath: string): string {
  const target = path.resolve(root, relativePath);
  assertInside(root, target);
  const normalized = path.relative(root, target);
  if (!normalized.endsWith(".cs")) {
    throw new Error("Code plan targetFiles must point to .cs files.");
  }
  return normalized;
}

export function buildCodePlanImplementationSteps(
  sample: SampleInfo,
  primaryFile: string,
  className: string,
  kind: typeof monoBehaviourKinds[number]
): string[] {
  const common = [
    `Use ${primaryFile} as the primary implementation file.`,
    `Prefer easyar_create_mono_behaviour with className=${className} and kind=${kind} when starting from a new script.`,
    "Expose GameObject, Text, Renderer, or event references with [SerializeField] fields instead of searching every frame.",
    "Keep Update lightweight; use EasyAR callbacks, UnityEvents, or explicit methods for state changes."
  ];
  if (sample.id === "image-tracking") {
    return [
      ...common,
      "Represent target found/lost transitions with explicit methods such as OnTargetFound and OnTargetLost.",
      "Keep target physical-size, target database, and target asset setup in the official EasyAR workflow rather than hardcoding it in gameplay scripts."
    ];
  }
  if (sample.id === "cloud-recognition") {
    return [
      ...common,
      "Represent cloud success, timeout, unauthorized, and network failure states separately.",
      "Read cloud credentials from local config or the official sample wiring; never embed appKey or appSecret in scripts."
    ];
  }
  return common;
}

export function buildCodePlanVerificationCalls(root: string, sample: SampleInfo) {
  return [
    {
      tool: "easyar_review_csharp_scripts",
      arguments: {
        projectPath: root
      },
      purpose: "Run static EasyAR-focused script review before opening Unity."
    },
    {
      tool: "easyar_run_unity_compile_check",
      arguments: {
        projectPath: root,
        sampleId: sample.id,
        platform: "android",
        logPath: path.join("Logs", "mcp-easyar-CodeCompileCheck.log")
      },
      purpose: "Force Unity script import/compilation and receive suggestedRunResultCall for RUN_RESULT.md."
    },
    {
      tool: "easyar_write_support_bundle",
      arguments: {
        projectPath: root,
        sampleId: sample.id,
        platform: "android"
      },
      purpose: "Refresh SUPPORT_BUNDLE.md after compile/build attempts."
    },
    {
      tool: "easyar_write_run_result",
      arguments: {
        projectPath: root,
        sampleId: sample.id,
        platform: "android",
        overallStatus: "not-run",
        steps: []
      },
      purpose: "Replace the placeholder arguments with the suggestedRunResultCall returned by Unity batch tools."
    }
  ];
}

export async function buildLatestLogDiagnostic(root: string, sample: SampleInfo, maxLogBytes: number, maxLogIssues: number) {
  const candidates = await findUnityLogCandidates(root);
  const latest = candidates.find((candidate) => candidate.exists);
  if (!latest) {
    return {
      analyzed: false,
      logPath: null,
      logSizeBytes: null,
      logModifiedAt: null,
      summary: null,
      issueCount: 0,
      issues: [],
      candidates: candidates.slice(0, 8),
      nextActions: [
        "Run Unity once, then regenerate the support bundle.",
        "If you already have a log file, call easyar_analyze_unity_log with logPath."
      ]
    };
  }

  const text = await readLogTail(latest.path, maxLogBytes);
  const issues = analyzeUnityLog(text, sample).slice(0, maxLogIssues);
  return {
    analyzed: true,
    logPath: latest.path,
    logSizeBytes: latest.size,
    logModifiedAt: latest.modifiedAt,
    bytesRead: Buffer.byteLength(text, "utf8"),
    summary: summarizeLog(text),
    issueCount: issues.length,
    issues,
    candidates: candidates.slice(0, 8),
    nextActions: issues.length > 0
      ? Array.from(new Set(issues.flatMap((issue) => issue.actions)))
      : ["No known EasyAR/Unity issue patterns were detected in the latest log tail."]
  };
}
