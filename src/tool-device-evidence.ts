import { stat, readFile } from "node:fs/promises";
import path from "node:path";
import { focusedHandoffSampleIds } from "./focused-scope.js";
import {
  clientEntrypointModes,
  clientKinds,
  mobilePlatforms,
  runResultStatuses
} from "./catalog.js";
import type { AccountStage } from "./catalog.js";
import { deferredSamples, findSample, focusedSamples } from "./samples.js";
import type { SampleInfo } from "./samples.js";
import { buildAndroidDeviceStatusActions, parseAdbDevices, redactSecretText, runProcess } from "./runtime.js";
import { defaultBundleIdentifier } from "./unity-generators.js";
import { assertInside, defaultUnityBatchLogPath, writeGeneratedFile } from "./tool-file-utils.js";
import { analyzeUnityLog, buildScriptReviewReport, chooseNextRunPhase } from "./tool-diagnostics.js";
import { isNonEmptyString, isNonPlaceholderString, isRecord, readJsonFile, sanitizeIssueText, sanitizeRunResultNotes } from "./tool-local-config.js";
import { exists } from "./tool-project.js";
import {
  buildImportChecklist,
  buildSampleImportGuide,
  buildSampleReadinessReport,
  buildSampleSceneAudit,
  focusedSampleGeneratedDir,
  focusedSampleRunbookPath,
  readinessAction,
  uniqueBlockers
} from "./tool-sample-workflow.js";
import {
  buildAndroidDeviceRunbookMarkdown,
  buildArtifactIndexMarkdown,
  buildCodePlanMarkdown,
  buildCompletionReportMarkdown,
  buildConfigIntegrationAuditMarkdown,
  buildDeviceRunResultFormMarkdown,
  buildDeviceValidationChecklistMarkdown,
  buildFocusedHandoffPackMarkdown,
  buildFocusedPreflightMarkdown,
  buildFocusedScopeStatusMarkdown,
  buildIssueReportMarkdown,
  buildPortalEvidenceMarkdown,
  buildLocalConfigFormMarkdown,
  buildOfficialAccessMarkdown,
  buildOnboardingMarkdown,
  buildProgrammingContextMarkdown,
  buildProjectHandoffMarkdown,
  buildRemainingWorkMarkdown,
  buildRunReportMarkdown,
  buildRunResultMarkdown,
  buildRunSequenceMarkdown,
  buildSampleImportGuideMarkdown,
  buildSceneAuditMarkdown,
  buildSupportBundleMarkdown,
  buildWorkflowStateMarkdown
} from "./tool-markdown.js";
import {
  buildCodePlan,
  buildConfigIntegrationAudit,
  buildAccountMaterialsReport,
  buildFocusedRunSequence,
  buildLocalConfigForm,
  buildLocalConfigValidationReport,
  buildLatestLogDiagnostic,
  buildOfficialAccessReport,
  buildOnboardingReport,
  buildPortalEvidenceReport,
  buildProgrammingContext,
  buildProjectHandoff,
  buildRemainingWorkReport,
  buildUnityEnvironmentReport,
  buildWorkflowState,
  buildImportChecklistAction,
  preflightCheck,
  preflightNextCall,
  readLocalConfigForRemoteValidation,
  normalizeProjectRelativePath
} from "./tool-services.js";

export async function buildFocusedRunReport(root: string, sample: SampleInfo, maxScriptIssues: number) {
  const readiness = await buildSampleReadinessReport(root, sample);
  const configValidation = await buildLocalConfigValidationReport(root);
  const scriptReview = await buildScriptReviewReport(root, undefined, 80, maxScriptIssues);
  const runSequence = buildFocusedRunSequence({
    projectPath: root,
    sample,
    platform: "android",
    outputPath: `Builds/${sample.id}.apk`,
    developmentBuild: true
  });

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    overallReady: readiness.ready && configValidation.valid && scriptReview.issueCount === 0,
    readiness,
    configValidation,
    scriptReview,
    nextRecommendedPhase: chooseNextRunPhase(readiness, configValidation, scriptReview),
    runSequenceSummary: runSequence.phases.map((phase) => ({
      name: phase.name,
      stepCount: phase.steps.length
    })),
    security: "Secrets are not returned. This report only reports presence, placeholder status, and static code issues."
  };
}



export async function buildFocusedPreflight(
  root: string,
  sample: SampleInfo,
  platform: typeof mobilePlatforms[number],
  outputPath: string,
  maxScriptIssues: number
) {
  const [
    accountMaterials,
    unityEnvironment,
    localConfig,
    importChecklist,
    sampleImportGuide,
    readiness,
    sceneAudit,
    scriptReview,
    workflowState,
    portalEvidence
  ] = await Promise.all([
    buildAccountMaterialsReport(root, sample, platform),
    buildUnityEnvironmentReport(root, sample),
    buildLocalConfigValidationReport(root),
    buildImportChecklist(root, sample),
    buildSampleImportGuide(root, sample),
    buildSampleReadinessReport(root, sample),
    buildSampleSceneAudit(root, sample, 25),
    buildScriptReviewReport(root, undefined, 80, maxScriptIssues),
    buildWorkflowState(root, sample, platform, outputPath, maxScriptIssues),
    readPortalEvidenceArtifact(root, sample)
  ]);
  const portalEvidenceReady = isPortalEvidenceReadyForSample(portalEvidence, sample);
  const checks = [
    preflightCheck("sample-focus", sample.implementationStatus === "focused", "sample", `${sample.name} status is ${sample.implementationStatus}.`, "Use image-tracking or cloud-recognition for the current focused run-through."),
    preflightCheck("account-materials", accountMaterials.missingRequired.length === 0, "account", accountMaterials.missingRequired.length > 0 ? `Missing account material(s): ${accountMaterials.missingRequired.join(", ")}.` : "Required account materials are present or not required.", "Run easyar_write_account_onboarding and easyar_write_account_materials, then prepare official account values."),
    preflightCheck("portal-evidence", portalEvidenceReady, "account", portalEvidenceReady ? "Portal evidence is sufficient for the selected sample." : portalEvidencePreflightDetail(portalEvidence, sample), `Run easyar_write_portal_evidence projectPath=${root} sampleId=${sample.id} platform=${platform} after checking the logged-in EasyAR development center page.`),
    preflightCheck("local-config", localConfig.valid, "config", localConfig.valid ? "Local EasyAR config is valid." : `Local config failing check(s): ${localConfig.checks.filter((check) => !check.ok).map((check) => check.id).join(", ")}.`, "Run easyar_write_local_config_from_env or fill ProjectSettings/EasyAR/easyar.local.json locally, then validate again."),
    preflightCheck("unity-environment", unityEnvironment.readyForUnityBatch, "unity", unityEnvironment.readyForUnityBatch ? `Unity batch path ready: ${unityEnvironment.recommendedUnityPath}.` : "No Unity executable path is ready for batch automation.", "Run easyar_write_unity_environment_report and set EASYAR_UNITY_PATH or pass unityPath explicitly."),
    preflightCheck("official-imports", importChecklist.readyForFocusedPreparation, "import", importChecklist.readyForFocusedPreparation ? "Official plugin and focused import requirements are present." : `Missing import item(s): ${importChecklist.items.filter((item) => item.required && !item.ok).map((item) => item.id).join(", ")}.`, buildImportChecklistAction(importChecklist)),
    preflightCheck("sample-readiness", readiness.ready, "readiness", readiness.ready ? "Focused sample readiness checks passed." : `Readiness failing check(s): ${readiness.checks.filter((check) => !check.ok).map((check) => check.id).join(", ")}.`, "Run easyar_prepare_unity_project, import official assets, and rerun easyar_check_sample_readiness."),
    preflightCheck("scene-build-settings", sceneAudit.readyForUnityValidation, "scene", sceneAudit.readyForUnityValidation ? "Scene audit is ready for Unity validation." : `Scene blocker(s): ${sceneAudit.blockers.map((blocker) => blocker.id).join(", ")}.`, "Run easyar_create_build_settings_helper and execute the generated Build Settings helper in Unity batch mode."),
    preflightCheck("script-review", scriptReview.issueCount === 0, "code", scriptReview.issueCount === 0 ? "No static C# script issues were found." : `Static script review found ${scriptReview.issueCount} issue(s).`, "Fix script review issues, then write CODE_CHANGE.md and run Unity compile check.")
  ];
  const blockers = checks.filter((check) => !check.ok);
  const readyForUnityBatch = blockers.every((blocker) => !["sample", "account", "config", "unity", "import", "readiness", "code"].includes(blocker.area)) && sceneAudit.readyForUnityValidation;
  const readyForDeviceBuild = blockers.length === 0;
  const nextCall = blockers.length > 0
    ? preflightNextCall(blockers[0], root, sample, platform)
    : {
        tool: "easyar_run_unity_compile_check",
        arguments: {
          projectPath: root,
          sampleId: sample.id,
          logPath: path.join("Logs", "mcp-easyar-CompileCheck.log")
        }
      };

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    platform,
    outputPath,
    readyForUnityBatch,
    readyForDeviceBuild,
    checks,
    blockers,
    nextCall,
    nextActions: blockers.length > 0
      ? Array.from(new Set(blockers.map((blocker) => blocker.action)))
      : [
          "Run easyar_run_unity_compile_check.",
          "Run easyar_create_device_build_helper and EasyARDeviceBuildHelper.Build.",
          "Install on a real device and record the result with easyar_write_run_result."
        ],
    summaries: {
      missingAccountMaterials: accountMaterials.missingRequired,
      unityRecommendedPath: unityEnvironment.recommendedUnityPath,
      importReady: importChecklist.readyForFocusedPreparation,
      packageCacheSamples: sampleImportGuide.packageCacheSamples,
      localConfigValid: localConfig.valid,
      portalEvidenceExists: portalEvidence.exists,
      portalSenseLicenseStatus: portalEvidence.senseLicenseStatus,
      portalCloudLibraryStatus: portalEvidence.cloudLibraryStatus,
      portalCloudTargetCount: portalEvidence.cloudTargetCount,
      readinessReady: readiness.ready,
      sceneReady: sceneAudit.readyForUnityValidation,
      scriptIssueCount: scriptReview.issueCount,
      workflowPhase: workflowState.phase,
      workflowBlocked: workflowState.blocked
    },
    references: {
      accountMaterials: path.join("Assets", "EasyARGenerated", "ACCOUNT_MATERIALS.md"),
      portalEvidence: path.join("Assets", "EasyARGenerated", "PORTAL_EVIDENCE.md"),
      unityEnvironment: path.join("Assets", "EasyARGenerated", "UNITY_ENVIRONMENT.md"),
      importChecklist: path.relative(root, path.join(focusedSampleGeneratedDir(root, sample), "IMPORT_CHECKLIST.md")),
      sampleImportGuide: path.relative(root, path.join(focusedSampleGeneratedDir(root, sample), "SAMPLE_IMPORT_GUIDE.md")),
      workflowState: path.relative(root, path.join(focusedSampleGeneratedDir(root, sample), "WORKFLOW_STATE.md")),
      runReport: path.relative(root, path.join(focusedSampleGeneratedDir(root, sample), "RUN_REPORT.md")),
      sceneAudit: path.relative(root, path.join(focusedSampleGeneratedDir(root, sample), "SCENE_AUDIT.md"))
    },
    security: "Focused preflight reports field presence, paths, blockers, and next calls only. It does not include EasyAR tokens, license keys, Cloud Recognition secrets, signing keys, or provisioning secrets."
  };
}



export async function buildArtifactIndex(root: string, sample: SampleInfo) {
  const artifacts = await Promise.all(focusedArtifactDefinitions(root, sample).map(async (artifact, index) => {
    const absolutePath = path.join(root, artifact.relativePath);
    let fileInfo = {
      exists: false,
      sizeBytes: null as number | null,
      modifiedAt: null as string | null
    };
    try {
      const info = await stat(absolutePath);
      fileInfo = {
        exists: info.isFile(),
        sizeBytes: info.isFile() ? info.size : null,
        modifiedAt: info.isFile() ? info.mtime.toISOString() : null
      };
    } catch {
      // Missing artifacts are reported below.
    }
    return {
      order: index + 1,
      ...artifact,
      ...fileInfo
    };
  }));
  const missingArtifacts = artifacts.filter((artifact) => !artifact.exists);

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    artifacts,
    readOrder: focusedArtifactReadOrder(artifacts),
    missingArtifacts: missingArtifacts.map((artifact) => artifact.relativePath),
    nextActions: missingArtifacts.length > 0
      ? Array.from(new Set(missingArtifacts.map((artifact) => artifact.generateWith)))
      : ["Read PREFLIGHT.md first, then SUPPORT_BUNDLE.md, RUN_RESULT.md, and CODE_CHANGE.md for the latest handoff state."],
    security: "Artifact index contains file metadata only. Individual artifacts should not contain secret values."
  };
}



export type FocusedHandoffPackInput = {
  root: string;
  sampleId: typeof focusedHandoffSampleIds[number];
  platform: typeof mobilePlatforms[number];
  accountStage: AccountStage;
  client: typeof clientKinds[number];
  entrypointMode: typeof clientEntrypointModes[number];
  serverPath?: string;
  outputPath?: string;
  developmentBuild: boolean;
  programmingGoal: string;
  codeGoal: string;
  maxScriptIssues: number;
  maxCandidates: number;
  maxLogBytes: number;
  maxLogIssues: number;
};



export function focusedHandoffPackSamples(sampleId: typeof focusedHandoffSampleIds[number]) {
  return sampleId === "all"
    ? focusedSamples()
    : [findSample(sampleId)];
}



export async function buildFocusedHandoffPackPlan(input: FocusedHandoffPackInput) {
  const samples = focusedHandoffPackSamples(input.sampleId);
  const samplePlans = await Promise.all(samples.map(async (sample) => {
    const outputPath = input.outputPath ?? defaultFocusedOutputPath(sample, input.platform);
    const artifactIndex = await buildArtifactIndex(input.root, sample);
    const plannedArtifacts = focusedHandoffPackArtifactSpecs(input.root, sample).map((artifact) => {
      const current = artifactIndex.artifacts.find((item) => item.relativePath === artifact.relativePath);
      return {
        ...artifact,
        exists: current?.exists ?? false,
        sizeBytes: current?.sizeBytes ?? null
      };
    });
    return {
      sample: {
        id: sample.id,
        name: sample.name,
        implementationStatus: sample.implementationStatus
      },
      outputPath,
      artifactCount: plannedArtifacts.length,
      missingCount: plannedArtifacts.filter((artifact) => !artifact.exists).length,
      plannedArtifacts
    };
  }));

  return {
    generatedAt: new Date().toISOString(),
    projectPath: input.root,
    platform: input.platform,
    requestedSampleId: input.sampleId,
    samples: samplePlans,
    projectArtifacts: [
      path.join("Assets", "EasyARGenerated", "PROJECT_HANDOFF.md"),
      path.join("Assets", "EasyARGenerated", "FOCUSED_SCOPE_STATUS.md"),
      path.join("Assets", "EasyARGenerated", "REMAINING_WORK.md"),
      path.join("Assets", "EasyARGenerated", "PORTAL_EVIDENCE.md")
    ],
    nextActions: [
      `Run easyar_write_focused_handoff_pack projectPath=${input.root} sampleId=${input.sampleId} platform=${input.platform}.`,
      "After the pack is written, read ARTIFACT_INDEX.md, PREFLIGHT.md, LOCAL_CONFIG_FORM.md, and PROJECT_HANDOFF.md before Unity automation.",
      "Do not mark RUN_RESULT.md as passed until real-device evidence exists."
    ],
    security: "The focused handoff pack plans and writes generated Markdown diagnostics only. It does not create or expose EasyAR account tokens, license keys, Cloud Recognition appKey/appSecret, or passed device evidence."
  };
}



export async function writeFocusedHandoffPack(input: FocusedHandoffPackInput & { overwrite: boolean }) {
  const plan = await buildFocusedHandoffPackPlan(input);
  const samples = focusedHandoffPackSamples(input.sampleId);
  const sampleResults = [];
  const written: string[] = [];
  const skipped: string[] = [];
  for (const sample of samples) {
    const outputPath = input.outputPath ?? defaultFocusedOutputPath(sample, input.platform);
    const sampleResult = await writeFocusedHandoffPackForSample(input, sample, outputPath, written, skipped);
    sampleResults.push(sampleResult);
  }

  const projectHandoff = await buildProjectHandoff({
    root: input.root,
    platform: input.platform,
    client: input.client,
    entrypointMode: input.entrypointMode,
    serverPath: input.serverPath,
    maxScriptIssues: input.maxScriptIssues,
    maxLogBytes: input.maxLogBytes,
    maxLogIssues: input.maxLogIssues
  });
  await writePackFile(input.root, path.join("Assets", "EasyARGenerated", "PROJECT_HANDOFF.md"), buildProjectHandoffMarkdown(projectHandoff), input.overwrite, written, skipped);
  const focusedScope = await buildFocusedScopeStatus(input.root, input.platform, input.maxScriptIssues, input.maxLogBytes, input.maxLogIssues);
  await writePackFile(input.root, path.join("Assets", "EasyARGenerated", "FOCUSED_SCOPE_STATUS.md"), buildFocusedScopeStatusMarkdown(focusedScope), input.overwrite, written, skipped);
  const remainingWork = await buildRemainingWorkReport({
    root: input.root,
    platform: input.platform,
    verificationEvidence: "passed",
    maxScriptIssues: input.maxScriptIssues,
    maxLogBytes: input.maxLogBytes,
    maxLogIssues: input.maxLogIssues
  });
  await writePackFile(input.root, path.join("Assets", "EasyARGenerated", "REMAINING_WORK.md"), buildRemainingWorkMarkdown(remainingWork), input.overwrite, written, skipped);
  const portalEvidenceRelativePath = path.join("Assets", "EasyARGenerated", "PORTAL_EVIDENCE.md");
  const portalEvidencePath = path.resolve(input.root, portalEvidenceRelativePath);
  assertInside(input.root, portalEvidencePath);
  if (await exists(portalEvidencePath)) {
    skipped.push(portalEvidencePath);
  } else {
    const portalEvidence = await buildPortalEvidenceReport({
      root: input.root,
      sample: samples.find((sample) => sample.id === "cloud-recognition") ?? samples[0] ?? findSample("cloud-recognition"),
      platform: input.platform,
      cloudServicesEnabled: [],
      tokenStatus: "not-checked",
      senseLicenseStatus: "not-checked",
      cloudLibraryStatus: "not-checked",
      notes: [
        "This default portal evidence artifact is a safe placeholder. Rerun easyar_write_portal_evidence with non-secret observations from the logged-in EasyAR development center page."
      ]
    });
    await writePackFile(input.root, portalEvidenceRelativePath, buildPortalEvidenceMarkdown(portalEvidence), input.overwrite, written, skipped);
  }

  return {
    generatedAt: new Date().toISOString(),
    projectPath: input.root,
    platform: input.platform,
    requestedSampleId: input.sampleId,
    sampleCount: sampleResults.length,
    samples: sampleResults,
    written,
    skipped,
    writtenCount: written.length,
    skippedCount: skipped.length,
    focusedSamplesComplete: focusedScope.allFocusedSamplesComplete,
    remainingPercent: remainingWork.overall.remainingPercent,
    topNextCall: projectHandoff.topNextCall,
    nextActions: Array.from(new Set([
      ...sampleResults.flatMap((sample) => sample.nextActions),
      ...projectHandoff.nextActions,
      "Keep RUN_RESULT.md and CODE_CHANGE.md evidence-based; generate them only after real runs or real code edits."
    ])).slice(0, 18),
    planned: plan,
    security: "The focused handoff pack wrote generated Markdown diagnostics and forms only. It did not write EasyAR secret values, fake run results, or fake code change evidence."
  };
}



export async function writeFocusedHandoffPackForSample(
  input: FocusedHandoffPackInput & { overwrite: boolean },
  sample: SampleInfo,
  outputPath: string,
  written: string[],
  skipped: string[]
) {
  const base = path.relative(input.root, focusedSampleGeneratedDir(input.root, sample));
  const artifacts: Array<{ name: string; relativePath: string; markdown: string }> = [];
  const onboarding = await buildOnboardingReport({
    root: input.root,
    sample,
    client: input.client,
    entrypointMode: input.entrypointMode,
    platform: input.platform,
    serverPath: input.serverPath,
    outputPath,
    maxScriptIssues: input.maxScriptIssues
  });
  artifacts.push({ name: "Onboarding", relativePath: path.join(base, "ONBOARDING.md"), markdown: buildOnboardingMarkdown(onboarding) });
  const localConfigForm = await buildLocalConfigForm(input.root, sample, input.platform, input.accountStage, undefined);
  artifacts.push({ name: "Local Config Form", relativePath: path.join(base, "LOCAL_CONFIG_FORM.md"), markdown: buildLocalConfigFormMarkdown(localConfigForm) });
  const workflowState = await buildWorkflowState(input.root, sample, input.platform, outputPath, input.maxScriptIssues);
  artifacts.push({ name: "Workflow State", relativePath: path.join(base, "WORKFLOW_STATE.md"), markdown: buildWorkflowStateMarkdown(workflowState) });
  const officialAccess = await buildOfficialAccessReport(input.root, sample, input.platform, "unity-samples");
  artifacts.push({ name: "Official Access", relativePath: path.join(base, "OFFICIAL_ACCESS.md"), markdown: buildOfficialAccessMarkdown(officialAccess) });
  const importGuide = await buildSampleImportGuide(input.root, sample);
  artifacts.push({ name: "Sample Import Guide", relativePath: path.join(base, "SAMPLE_IMPORT_GUIDE.md"), markdown: buildSampleImportGuideMarkdown(importGuide) });
  const runSequence = buildFocusedRunSequence({
    projectPath: input.root,
    sample,
    platform: input.platform,
    outputPath,
    developmentBuild: input.developmentBuild
  });
  artifacts.push({ name: "Run Sequence", relativePath: path.join(base, "RUN_SEQUENCE.md"), markdown: buildRunSequenceMarkdown(runSequence) });
  const runReport = await buildFocusedRunReport(input.root, sample, input.maxScriptIssues);
  artifacts.push({ name: "Run Report", relativePath: path.join(base, "RUN_REPORT.md"), markdown: buildRunReportMarkdown(runReport) });
  const preflight = await buildFocusedPreflight(input.root, sample, input.platform, outputPath, input.maxScriptIssues);
  artifacts.push({ name: "Focused Preflight", relativePath: path.join(base, "PREFLIGHT.md"), markdown: buildFocusedPreflightMarkdown(preflight) });
  const sceneAudit = await buildSampleSceneAudit(input.root, sample, input.maxCandidates);
  artifacts.push({ name: "Scene Audit", relativePath: path.join(base, "SCENE_AUDIT.md"), markdown: buildSceneAuditMarkdown(sceneAudit) });
  const supportBundle = await buildSupportBundle({
    root: input.root,
    sample,
    platform: input.platform,
    outputPath,
    developmentBuild: input.developmentBuild,
    maxScriptIssues: input.maxScriptIssues,
    maxCandidates: input.maxCandidates,
    maxLogBytes: input.maxLogBytes,
    maxLogIssues: input.maxLogIssues
  });
  artifacts.push({ name: "Support Bundle", relativePath: path.join(base, "SUPPORT_BUNDLE.md"), markdown: buildSupportBundleMarkdown(supportBundle) });
  const deviceValidation = await buildDeviceValidationChecklist(input.root, sample, input.platform, undefined, outputPath);
  artifacts.push({ name: "Device Validation", relativePath: path.join(base, "DEVICE_VALIDATION.md"), markdown: buildDeviceValidationChecklistMarkdown(deviceValidation) });
  const deviceRunForm = await buildDeviceRunResultForm(input.root, sample, input.platform, undefined, outputPath, undefined);
  artifacts.push({ name: "Device Run Result Form", relativePath: path.join(base, "DEVICE_RUN_RESULT_FORM.md"), markdown: buildDeviceRunResultFormMarkdown(deviceRunForm) });
  if (input.platform === "android") {
    const androidRunbook = await buildAndroidDeviceRunbook({
      root: input.root,
      sample,
      apkPath: outputPath,
      timeoutSeconds: 10
    });
    artifacts.push({ name: "Android Device Runbook", relativePath: path.join(base, "ANDROID_DEVICE_RUNBOOK.md"), markdown: buildAndroidDeviceRunbookMarkdown(androidRunbook) });
  }
  const configAudit = await buildConfigIntegrationAudit(input.root, sample, 120, 40);
  artifacts.push({ name: "Config Integration Audit", relativePath: path.join(base, "CONFIG_INTEGRATION.md"), markdown: buildConfigIntegrationAuditMarkdown(configAudit) });
  const programmingContext = await buildProgrammingContext(input.root, sample, input.programmingGoal, 80, input.maxScriptIssues);
  artifacts.push({ name: "Programming Context", relativePath: path.join(base, "PROGRAMMING_CONTEXT.md"), markdown: buildProgrammingContextMarkdown(programmingContext) });
  const codePlan = await buildCodePlan(input.root, sample, input.codeGoal, [], input.maxScriptIssues);
  artifacts.push({ name: "Code Plan", relativePath: path.join(base, "CODE_PLAN.md"), markdown: buildCodePlanMarkdown(codePlan) });

  for (const artifact of artifacts) {
    await writePackFile(input.root, artifact.relativePath, artifact.markdown, input.overwrite, written, skipped);
  }

  const indexBeforePack = await buildArtifactIndex(input.root, sample);
  const packSummary = buildFocusedHandoffPackMarkdown({
    generatedAt: new Date().toISOString(),
    projectPath: input.root,
    sample,
    platform: input.platform,
    outputPath,
    artifactNames: artifacts.map((artifact) => artifact.name),
    artifactIndex: indexBeforePack,
    workflowState,
    preflight,
    localConfigForm
  });
  await writePackFile(input.root, path.join(base, "HANDOFF_PACK.md"), packSummary, input.overwrite, written, skipped);
  const refreshedIndex = await buildArtifactIndex(input.root, sample);
  await writePackFile(input.root, path.join(base, "ARTIFACT_INDEX.md"), buildArtifactIndexMarkdown(refreshedIndex), input.overwrite, written, skipped);

  return {
    sampleId: sample.id,
    sampleName: sample.name,
    outputPath,
    artifactCount: artifacts.length + 2,
    missingArtifactsAfterWrite: refreshedIndex.missingArtifacts,
    workflowPhase: workflowState.phase,
    workflowBlocked: workflowState.blocked,
    readyForUnityBatch: preflight.readyForUnityBatch,
    readyForDeviceBuild: preflight.readyForDeviceBuild,
    localConfigMissingFields: localConfigForm.missingRequiredFields,
    nextActions: Array.from(new Set([
      ...workflowState.nextActions,
      ...preflight.nextActions,
      ...localConfigForm.nextActions
    ])).slice(0, 10)
  };
}



export function focusedHandoffPackArtifactSpecs(root: string, sample: SampleInfo) {
  const base = path.relative(root, focusedSampleGeneratedDir(root, sample));
  return [
    "ONBOARDING.md",
    "LOCAL_CONFIG_FORM.md",
    "WORKFLOW_STATE.md",
    "OFFICIAL_ACCESS.md",
    "SAMPLE_IMPORT_GUIDE.md",
    "RUN_SEQUENCE.md",
    "RUN_REPORT.md",
    "PREFLIGHT.md",
    "SCENE_AUDIT.md",
    "SUPPORT_BUNDLE.md",
    "DEVICE_VALIDATION.md",
    "DEVICE_RUN_RESULT_FORM.md",
    "ANDROID_DEVICE_RUNBOOK.md",
    "CONFIG_INTEGRATION.md",
    "PROGRAMMING_CONTEXT.md",
    "CODE_PLAN.md",
    "ARTIFACT_INDEX.md",
    "HANDOFF_PACK.md"
  ].map((name) => ({
    name,
    relativePath: path.join(base, name),
    purpose: focusedHandoffPackPurpose(name)
  }));
}



export function focusedHandoffPackPurpose(name: string): string {
  const purposes: Record<string, string> = {
    "ONBOARDING.md": "Client, release, official access, and workflow overview.",
    "LOCAL_CONFIG_FORM.md": "Field-by-field local config form without secret values.",
    "WORKFLOW_STATE.md": "Current blocker and next MCP call.",
    "OFFICIAL_ACCESS.md": "Official endpoint/token/license/download access status.",
    "SAMPLE_IMPORT_GUIDE.md": "Focused official sample import instructions.",
    "RUN_SEQUENCE.md": "Ordered MCP and Unity batch commands.",
    "RUN_REPORT.md": "Readiness, config, and script review summary.",
    "PREFLIGHT.md": "Single gate before Unity automation and device validation.",
    "SCENE_AUDIT.md": "Scene, Build Settings, EasyAR, and sample-specific signals.",
    "SUPPORT_BUNDLE.md": "Diagnostic handoff across run report, scene audit, sequence, and logs.",
    "DEVICE_VALIDATION.md": "Real-device validation checklist.",
    "DEVICE_RUN_RESULT_FORM.md": "Fillable real-device result form.",
    "ANDROID_DEVICE_RUNBOOK.md": "Android install, launch, logcat, and RUN_RESULT evidence sequence.",
    "CONFIG_INTEGRATION.md": "Local config wiring audit for scripts/assets/scenes.",
    "PROGRAMMING_CONTEXT.md": "Script inventory and programming handoff.",
    "CODE_PLAN.md": "Scoped plan before C# edits.",
    "ARTIFACT_INDEX.md": "Focused artifact status and reading order.",
    "HANDOFF_PACK.md": "Pack summary for another AI tool or human operator."
  };
  return purposes[name] ?? "Generated focused handoff artifact.";
}



export async function writePackFile(
  root: string,
  relativePath: string,
  markdown: string,
  overwrite: boolean,
  written: string[],
  skipped: string[]
) {
  const target = path.resolve(root, relativePath);
  assertInside(root, target);
  const before = written.length;
  await writeGeneratedFile(target, markdown, overwrite, written);
  if (written.length === before) {
    skipped.push(target);
  }
}



export function defaultFocusedOutputPath(sample: SampleInfo, platform: typeof mobilePlatforms[number]) {
  return platform === "android"
    ? `Builds/${sample.id}.apk`
    : `Builds/iOS/${sample.id}`;
}



export function focusedArtifactReadOrder(artifacts: Array<{ relativePath: string }>): string[] {
  const priority = [
    "ACCOUNT_ONBOARDING.md",
    "ACCOUNT_MATERIALS.md",
    "PORTAL_EVIDENCE.md",
    "LOCAL_CONFIG_FORM.md",
    "UNITY_ENVIRONMENT.md",
    "FOCUSED_SCOPE_STATUS.md",
    "PREFLIGHT.md",
    "WORKFLOW_STATE.md",
    "OFFICIAL_ACCESS.md",
    "SAMPLE_IMPORT_GUIDE.md",
    "IMPORT_CHECKLIST.md",
    "RUN_SEQUENCE.md",
    "RUN_REPORT.md",
    "SCENE_AUDIT.md",
    "SUPPORT_BUNDLE.md",
    "DEVICE_VALIDATION.md",
    "DEVICE_RUN_RESULT_FORM.md",
    "ANDROID_DEVICE_RUNBOOK.md",
    "RUN_RESULT.md",
    "COMPLETION_REPORT.md",
    "ISSUE_REPORT.md",
    "CONFIG_INTEGRATION.md",
    "PROGRAMMING_CONTEXT.md",
    "CODE_PLAN.md",
    "CODE_CHANGE.md",
    "HANDOFF_PACK.md",
    "ARTIFACT_INDEX.md"
  ];
  return [...artifacts]
    .sort((left, right) => artifactPriority(left.relativePath, priority) - artifactPriority(right.relativePath, priority))
    .map((artifact) => artifact.relativePath);
}



export function artifactPriority(relativePath: string, priority: string[]): number {
  const normalized = relativePath.replace(/\\/g, "/");
  const index = priority.findIndex((name) => normalized.endsWith(name));
  return index === -1 ? priority.length : index;
}



export function focusedArtifactDefinitions(root: string, sample: SampleInfo) {
  const base = path.relative(root, focusedSampleGeneratedDir(root, sample));
  return [
    {
      name: "Runbook",
      relativePath: path.join(base, "RUNBOOK.md"),
      purpose: "Human-readable focused sample checklist.",
      generateWith: `easyar_prepare_unity_project sampleId=${sample.id}`
    },
    {
      name: "Onboarding",
      relativePath: path.join(base, "ONBOARDING.md"),
      purpose: "First-run overview across client setup, official access, release manifest, and workflow state.",
      generateWith: `easyar_write_onboarding_report sampleId=${sample.id}`
    },
    {
      name: "Account Onboarding",
      relativePath: path.join("Assets", "EasyARGenerated", "ACCOUNT_ONBOARDING.md"),
      purpose: "Official EasyAR registration/login, license, Cloud Recognition, and local secret setup guide.",
      generateWith: `easyar_write_account_onboarding sampleId=${sample.id}`
    },
    {
      name: "Account Materials",
      relativePath: path.join("Assets", "EasyARGenerated", "ACCOUNT_MATERIALS.md"),
      purpose: "Field-by-field EasyAR account material source, storage, and sharing policy checklist.",
      generateWith: `easyar_write_account_materials sampleId=${sample.id}`
    },
    {
      name: "Portal Evidence",
      relativePath: path.join("Assets", "EasyARGenerated", "PORTAL_EVIDENCE.md"),
      purpose: "Safe non-secret EasyAR development center observations: app record ids, service flags, Sense License presence, and Cloud Recognition library/target status.",
      generateWith: `easyar_write_portal_evidence sampleId=${sample.id}`
    },
    {
      name: "Local Config Form",
      relativePath: path.join(base, "LOCAL_CONFIG_FORM.md"),
      purpose: "Fillable easyar.local.json field form with placeholders, source map, env alternatives, and validation calls.",
      generateWith: `easyar_write_local_config_form sampleId=${sample.id}`
    },
    {
      name: "Unity Environment",
      relativePath: path.join("Assets", "EasyARGenerated", "UNITY_ENVIRONMENT.md"),
      purpose: "Unity executable discovery, EASYAR_UNITY_PATH setup, and batch compile dry-run guidance.",
      generateWith: `easyar_write_unity_environment_report sampleId=${sample.id}`
    },
    {
      name: "Focused Scope Status",
      relativePath: path.join("Assets", "EasyARGenerated", "FOCUSED_SCOPE_STATUS.md"),
      purpose: "Overall Image Tracking, Cloud Recognition, and Mega completion state and next actions.",
      generateWith: "easyar_write_focused_scope_status"
    },
    {
      name: "Focused Preflight",
      relativePath: path.join(base, "PREFLIGHT.md"),
      purpose: "Single focused gate across account, local config, Unity path, imports, scene readiness, and script review.",
      generateWith: `easyar_write_focused_preflight sampleId=${sample.id}`
    },
    {
      name: "Workflow State",
      relativePath: path.join(base, "WORKFLOW_STATE.md"),
      purpose: "Current focused workflow phase, blockers, and next MCP call.",
      generateWith: `easyar_write_workflow_state sampleId=${sample.id}`
    },
    {
      name: "Official Access",
      relativePath: path.join(base, "OFFICIAL_ACCESS.md"),
      purpose: "Official account, license, downloads, and sample-specific access checks.",
      generateWith: `easyar_write_official_access_report sampleId=${sample.id}`
    },
    {
      name: "Import Checklist",
      relativePath: path.join(base, "IMPORT_CHECKLIST.md"),
      purpose: "Official EasyAR Unity Plugin and focused sample import evidence.",
      generateWith: `easyar_write_import_checklist sampleId=${sample.id}`
    },
    {
      name: "Sample Import Guide",
      relativePath: path.join(base, "SAMPLE_IMPORT_GUIDE.md"),
      purpose: "Unity Package Manager steps for importing the focused official sample from Samples~ into Assets/Samples.",
      generateWith: `easyar_write_sample_import_guide sampleId=${sample.id}`
    },
    {
      name: "Run Sequence",
      relativePath: path.join(base, "RUN_SEQUENCE.md"),
      purpose: "Ordered MCP and Unity batch execution sequence.",
      generateWith: `easyar_write_run_sequence sampleId=${sample.id}`
    },
    {
      name: "Run Report",
      relativePath: path.join(base, "RUN_REPORT.md"),
      purpose: "Current readiness, config, script review, and next phase.",
      generateWith: `easyar_write_run_report sampleId=${sample.id}`
    },
    {
      name: "Scene Audit",
      relativePath: path.join(base, "SCENE_AUDIT.md"),
      purpose: "Scene candidates, Build Settings hints, EasyAR signals, and sample blockers.",
      generateWith: `easyar_write_scene_audit sampleId=${sample.id}`
    },
    {
      name: "Support Bundle",
      relativePath: path.join(base, "SUPPORT_BUNDLE.md"),
      purpose: "Single diagnostic handoff across report, audit, sequence, and latest Unity logs.",
      generateWith: `easyar_write_support_bundle sampleId=${sample.id}`
    },
    {
      name: "Run Result",
      relativePath: path.join(base, "RUN_RESULT.md"),
      purpose: "Latest compile, build, or device validation outcome.",
      generateWith: `easyar_write_run_result sampleId=${sample.id}`
    },
    {
      name: "Completion Report",
      relativePath: path.join(base, "COMPLETION_REPORT.md"),
      purpose: "Final focused run-through status across preflight, device validation, run result, and latest log evidence.",
      generateWith: `easyar_write_completion_report sampleId=${sample.id}`
    },
    {
      name: "Issue Report",
      relativePath: path.join(base, "ISSUE_REPORT.md"),
      purpose: "Redacted GitHub issue body for focused sample failures.",
      generateWith: `easyar_write_issue_report sampleId=${sample.id}`
    },
    {
      name: "Config Integration Audit",
      relativePath: path.join(base, "CONFIG_INTEGRATION.md"),
      purpose: "Local EasyAR config consumer candidates across scripts, scenes, prefabs, and assets.",
      generateWith: `easyar_write_config_integration_audit sampleId=${sample.id}`
    },
    {
      name: "Programming Context",
      relativePath: path.join(base, "PROGRAMMING_CONTEXT.md"),
      purpose: "Focused Unity C# script inventory, generated helper summary, static review, and recommended programming workflow.",
      generateWith: `easyar_write_programming_context sampleId=${sample.id}`
    },
    {
      name: "Device Validation",
      relativePath: path.join(base, "DEVICE_VALIDATION.md"),
      purpose: "Real-device test steps, pass criteria, and evidence prompts.",
      generateWith: `easyar_write_device_validation_checklist sampleId=${sample.id}`
    },
    {
      name: "Device Run Result Form",
      relativePath: path.join(base, "DEVICE_RUN_RESULT_FORM.md"),
      purpose: "Fillable real-device result form and safe easyar_write_run_result templates.",
      generateWith: `easyar_write_device_run_result_form sampleId=${sample.id}`
    },
    {
      name: "Android Device Runbook",
      relativePath: path.join(base, "ANDROID_DEVICE_RUNBOOK.md"),
      purpose: "Android adb device status, install, launch, logcat, and RUN_RESULT evidence sequence.",
      generateWith: `easyar_write_android_device_runbook sampleId=${sample.id}`
    },
    {
      name: "Code Plan",
      relativePath: path.join(base, "CODE_PLAN.md"),
      purpose: "Scoped C# implementation plan before script edits.",
      generateWith: `easyar_write_code_plan sampleId=${sample.id}`
    },
    {
      name: "Code Change",
      relativePath: path.join(base, "CODE_CHANGE.md"),
      purpose: "C# change summary after script edits and before Unity compilation.",
      generateWith: `easyar_write_code_change_summary sampleId=${sample.id}`
    },
    {
      name: "Focused Handoff Pack",
      relativePath: path.join(base, "HANDOFF_PACK.md"),
      purpose: "Summary written by easyar_write_focused_handoff_pack for another AI tool or human operator.",
      generateWith: `easyar_write_focused_handoff_pack sampleId=${sample.id}`
    },
    {
      name: "Artifact Index",
      relativePath: path.join(base, "ARTIFACT_INDEX.md"),
      purpose: "Index of focused sample handoff artifacts and reading order.",
      generateWith: `easyar_write_artifact_index sampleId=${sample.id}`
    }
  ];
}



export async function buildSupportBundle(input: {
  root: string;
  sample: SampleInfo;
  platform: typeof mobilePlatforms[number];
  outputPath?: string;
  developmentBuild: boolean;
  maxScriptIssues: number;
  maxCandidates: number;
  maxLogBytes: number;
  maxLogIssues: number;
}) {
  const defaultOutput = input.platform === "android"
    ? `Builds/${input.sample.id}.apk`
    : `Builds/iOS/${input.sample.id}`;
  const runSequence = buildFocusedRunSequence({
    projectPath: input.root,
    sample: input.sample,
    platform: input.platform,
    outputPath: input.outputPath ?? defaultOutput,
    developmentBuild: input.developmentBuild
  });
  const runReport = await buildFocusedRunReport(input.root, input.sample, input.maxScriptIssues);
  const sceneAudit = await buildSampleSceneAudit(input.root, input.sample, input.maxCandidates);
  const latestLog = await buildLatestLogDiagnostic(input.root, input.sample, input.maxLogBytes, input.maxLogIssues);
  const generatedArtifacts = {
    runbook: path.relative(input.root, focusedSampleRunbookPath(input.root, input.sample)),
    runSequence: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "RUN_SEQUENCE.md")),
    runReport: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "RUN_REPORT.md")),
    sceneAudit: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "SCENE_AUDIT.md")),
    supportBundle: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "SUPPORT_BUNDLE.md")),
    runResult: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "RUN_RESULT.md")),
    codePlan: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "CODE_PLAN.md")),
    artifactIndex: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "ARTIFACT_INDEX.md"))
  };
  const nextActions = Array.from(new Set([
    runReport.nextRecommendedPhase,
    ...sceneAudit.nextActions,
    ...latestLog.nextActions
  ]));

  return {
    generatedAt: new Date().toISOString(),
    projectPath: input.root,
    sample: runReport.sample,
    platform: input.platform,
    outputPath: runSequence.outputPath,
    developmentBuild: input.developmentBuild,
    generatedArtifacts,
    runSequenceSummary: runSequence.phases.map((phase) => ({
      name: phase.name,
      stepCount: phase.steps.length
    })),
    runReport,
    sceneAudit,
    latestLog,
    nextActions,
    security: "Secret values and full Unity log text are not included. This bundle reports presence, status, excerpts, and recommended actions only."
  };
}



export async function buildDeviceRunResultForm(
  root: string,
  sample: SampleInfo,
  platform: typeof mobilePlatforms[number],
  device?: string,
  buildOutputPath?: string,
  notes?: string
) {
  const checklist = await buildDeviceValidationChecklist(root, sample, platform, device, buildOutputPath);
  const recordedDevice = hasRecordedDevice(device ?? null) ? device ?? "<physical device model and OS>" : "<physical device model and OS>";
  const recordedBuildOutput = isNonPlaceholderString(buildOutputPath) ? buildOutputPath : platform === "android"
    ? "Builds/<sample-id>.apk"
    : "Builds/iOS/<sample-id>";
  const formSteps = [
    {
      name: "Unity compile",
      status: "not-run" as const,
      evidencePrompt: "Project-local Unity compile log path and whether the Editor exited successfully.",
      nextActionPrompt: "Resolve compile/import errors before building for device.",
      requiredForCompletion: true
    },
    {
      name: "Device build",
      status: "not-run" as const,
      evidencePrompt: `Build artifact path, signing/provisioning result, and install result for ${platform}.`,
      nextActionPrompt: "Resolve build, signing, Gradle, Xcode, or install failures before real-device validation.",
      requiredForCompletion: true
    },
    ...checklist.steps
      .filter((step) => step.id !== "record-result")
      .map((step) => ({
        name: step.title === "Verify camera startup"
          ? "Real device validation - camera startup"
          : `Real device validation - ${step.title}`,
        status: "not-run" as const,
        evidencePrompt: `${step.expected} Evidence to record: ${step.action}`,
        nextActionPrompt: "Record the observed behavior, log path, and next fix if this step does not pass.",
        requiredForCompletion: true
      })),
    {
      name: "Real device validation - sample pass criteria",
      status: "not-run" as const,
      evidencePrompt: sampleDevicePassCriteria(sample).join(" "),
      nextActionPrompt: "Only mark passed after every sample-specific criterion is observed on a physical device.",
      requiredForCompletion: true
    }
  ];
  const safeDraftRunResultArguments = {
    projectPath: root,
    sampleId: sample.id,
    platform,
    overallStatus: "blocked",
    device: recordedDevice,
    buildOutputPath: recordedBuildOutput,
    notes: sanitizeRunResultNotes(notes) ?? "Draft device run result. Replace placeholders with observed evidence before writing RUN_RESULT.md.",
    steps: formSteps.map((step) => ({
      name: step.name,
      status: step.status,
      evidence: `<${step.evidencePrompt}>`,
      nextAction: step.nextActionPrompt
    }))
  };
  const passedRunResultTemplate = {
    ...safeDraftRunResultArguments,
    overallStatus: "passed",
    notes: "Use this passed template only after all required real-device validation steps pass with observed evidence.",
    steps: formSteps.map((step) => ({
      name: step.name,
      status: "passed",
      evidence: step.name.includes("sample pass criteria")
        ? samplePassedEvidencePlaceholder(sample, recordedDevice)
        : `<Observed on ${recordedDevice}: ${step.evidencePrompt}>`
    }))
  };
  const completionAcceptanceRules = [
    "Write RUN_RESULT.md with overallStatus=passed only after a physical Android or iOS device run passes.",
    "Record a non-placeholder device model or device label.",
    "Include at least one passed step whose name includes Real device validation or Device validation.",
    "Keep compile-only and build-only outcomes as blocked until real-device validation evidence exists.",
    sample.id === "cloud-recognition"
      ? "Record recognition status and target/library identifiers without appKey, appSecret, license keys, tokens, passwords, or raw secret-bearing logs."
      : sample.id === "mega"
        ? "Record Mega Block, localization status, and physical-environment evidence without license keys, tokens, passwords, appKey/appSecret, or raw secret-bearing logs."
      : "Record target image, detection, anchored content, and tracking stability evidence without license keys, tokens, passwords, or raw secret-bearing logs."
  ];

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    platform,
    device: device ?? null,
    buildOutputPath: buildOutputPath ?? null,
    readyForDeviceValidation: checklist.readyForDeviceValidation,
    blockerCount: checklist.blockers.length,
    blockers: checklist.blockers,
    formSteps,
    passCriteria: checklist.passCriteria,
    evidencePrompts: checklist.evidencePrompts,
    completionAcceptanceRules,
    safeDraftRunResultArguments,
    passedRunResultTemplate,
    nextActions: checklist.readyForDeviceValidation
      ? [
          "Run the focused sample on a physical Android or iOS device.",
          "Fill this form with observed evidence.",
          "Call easyar_write_run_result using the safe draft for blocked/failed attempts or the passed template only after every required step passes.",
          `Regenerate completion evidence with easyar_write_completion_report projectPath=${root} sampleId=${sample.id} platform=${platform}.`
        ]
      : [
          ...checklist.nextActions,
          `Regenerate this form after blockers are resolved with easyar_write_device_run_result_form projectPath=${root} sampleId=${sample.id} platform=${platform}.`
        ],
    security: "This form is designed for evidence collection only. Do not paste EasyAR license keys, account tokens, Cloud Recognition appKey/appSecret, signing keys, provisioning profiles, passwords, private device identifiers, or raw secret-bearing logs."
  };
}



export function samplePassedEvidencePlaceholder(sample: SampleInfo, recordedDevice: string): string {
  if (sample.id === "mega") {
    return `<${sample.name} passed on ${recordedDevice}; record Mega Block/localization outcome without secrets.>`;
  }
  if (sample.id === "cloud-recognition") {
    return `<${sample.name} passed on ${recordedDevice}; record cloud target/recognition outcome without secrets.>`;
  }
  return `<${sample.name} passed on ${recordedDevice}; record target/tracking outcome without secrets.>`;
}



export async function buildAndroidDeviceRunbook(input: {
  root: string;
  sample: SampleInfo;
  apkPath?: string;
  bundleIdentifier?: string;
  adbPath?: string;
  deviceSerial?: string;
  device?: string;
  logRelativePath?: string;
  timeoutSeconds: number;
}) {
  const adb = input.adbPath ?? process.env.EASYAR_ADB_PATH ?? "adb";
  const localConfig = await readLocalConfigForRemoteValidation(input.root);
  const packageName = input.bundleIdentifier ?? localConfig.bundleIdentifier ?? defaultBundleIdentifier(input.sample);
  const relativeApkPath = input.apkPath ?? path.join("Builds", `${input.sample.id}.apk`);
  const resolvedApk = path.resolve(input.root, relativeApkPath);
  assertInside(input.root, resolvedApk);
  const apkExists = await exists(resolvedApk);
  const logRelativePath = input.logRelativePath ?? path.join("Logs", `mcp-easyar-DeviceLog-${input.sample.id}.log`);
  const logPath = path.resolve(input.root, logRelativePath);
  assertInside(input.root, logPath);
  const deviceStatusResult = await runProcess(adb, ["devices", "-l"], input.timeoutSeconds);
  const devices = parseAdbDevices(deviceStatusResult.stdout);
  const readyForInstall = deviceStatusResult.exitCode === 0 && devices.some((device) => device.state === "device");
  const serialArgs = input.deviceSerial ? ["-s", input.deviceSerial] : [];
  const deviceLabel = input.device
    ?? devices.find((device) => device.serial === input.deviceSerial)?.detail
    ?? devices.find((device) => device.state === "device")?.detail
    ?? null;
  const form = await buildDeviceRunResultForm(input.root, input.sample, "android", deviceLabel ?? input.device, path.relative(input.root, resolvedApk), "Android device runbook generated for focused real-device validation.");
  const commands = [
    {
      id: "device-status",
      tool: "easyar_android_device_status",
      arguments: { adbPath: adb },
      shell: [adb, "devices", "-l"].join(" "),
      purpose: "Confirm adb is installed and a physical Android device is authorized."
    },
    {
      id: "install-apk",
      tool: "easyar_android_install_apk",
      arguments: {
        projectPath: input.root,
        sampleId: input.sample.id,
        apkPath: path.relative(input.root, resolvedApk),
        adbPath: adb,
        ...(input.deviceSerial ? { deviceSerial: input.deviceSerial } : {})
      },
      shell: [adb, ...serialArgs, "install", "-r", "-d", resolvedApk].join(" "),
      purpose: "Install or replace the focused APK on the authorized Android device."
    },
    {
      id: "clear-logcat",
      tool: "easyar_android_collect_logcat",
      arguments: {
        projectPath: input.root,
        sampleId: input.sample.id,
        adbPath: adb,
        relativePath: logRelativePath,
        clearFirst: true,
        ...(input.deviceSerial ? { deviceSerial: input.deviceSerial } : {})
      },
      shell: [adb, ...serialArgs, "logcat", "-c"].join(" "),
      purpose: "Optional: clear logcat before launching so the evidence window is focused."
    },
    {
      id: "start-app",
      tool: "easyar_android_start_app",
      arguments: {
        projectPath: input.root,
        sampleId: input.sample.id,
        bundleIdentifier: packageName,
        adbPath: adb,
        ...(input.deviceSerial ? { deviceSerial: input.deviceSerial } : {})
      },
      shell: [adb, ...serialArgs, "shell", "monkey", "-p", packageName, "-c", "android.intent.category.LAUNCHER", "1"].join(" "),
      purpose: "Launch the focused EasyAR app on the Android device."
    },
    {
      id: "collect-logcat",
      tool: "easyar_android_collect_logcat",
      arguments: {
        projectPath: input.root,
        sampleId: input.sample.id,
        adbPath: adb,
        relativePath: logRelativePath,
        ...(input.deviceSerial ? { deviceSerial: input.deviceSerial } : {})
      },
      shell: [adb, ...serialArgs, "logcat", "-d", "-v", "time"].join(" "),
      purpose: "Collect a filtered, redacted logcat snapshot after launch and sample interaction."
    }
  ];
  const nextActions = [
    ...(apkExists ? [] : [`Build the APK first at ${path.relative(input.root, resolvedApk)}.`]),
    ...buildAndroidDeviceStatusActions(deviceStatusResult, devices),
    "Run the install, launch, and logcat commands in order.",
    androidDeviceInteractionAction(input.sample),
    "Write RUN_RESULT.md with overallStatus=passed only after the physical-device behavior satisfies every pass criterion."
  ];

  return {
    generatedAt: new Date().toISOString(),
    projectPath: input.root,
    sample: {
      id: input.sample.id,
      name: input.sample.name,
      implementationStatus: input.sample.implementationStatus
    },
    platform: "android" as const,
    adb,
    packageName,
    deviceSerial: input.deviceSerial ?? null,
    apk: {
      path: resolvedApk,
      relativePath: path.relative(input.root, resolvedApk),
      exists: apkExists
    },
    log: {
      path: logPath,
      relativePath: path.relative(input.root, logPath)
    },
    deviceStatus: {
      command: deviceStatusResult.command,
      exitCode: deviceStatusResult.exitCode,
      adbAvailable: deviceStatusResult.exitCode !== null,
      readyForInstall,
      devices,
      stderr: redactSecretText(deviceStatusResult.stderr)
    },
    commands,
    completionAcceptanceRules: form.completionAcceptanceRules,
    passCriteria: form.passCriteria,
    evidencePrompts: form.evidencePrompts,
    safeDraftRunResultArguments: form.safeDraftRunResultArguments,
    passedRunResultTemplate: form.passedRunResultTemplate,
    nextActions: Array.from(new Set(nextActions)),
    security: "Android device runbooks record adb metadata, commands, paths, package names, and evidence prompts only. They do not include EasyAR passwords, license keys, API KEY/API Secret values, appKey/appSecret, signing keys, or raw secret-bearing logs."
  };
}



export function androidDeviceInteractionAction(sample: SampleInfo): string {
  if (sample.id === "cloud-recognition") {
    return "On the phone, grant camera permission, point the camera at a target uploaded to the Cloud Recognition library, and record whether recognition succeeds.";
  }
  if (sample.id === "mega") {
    return "On the phone, grant camera, location, and network permissions; test in the selected Mega Block environment until Mega localization succeeds, then record non-secret block/localization evidence.";
  }
  return "On the phone, grant camera permission, point the camera at the focused image target, and record tracking stability.";
}



export async function buildRunResult(input: {
  root: string;
  sample: SampleInfo;
  platform: typeof mobilePlatforms[number];
  overallStatus: typeof runResultStatuses[number];
  device?: string;
  buildOutputPath?: string;
  notes?: string;
  steps: Array<{
    name: string;
    status: typeof runResultStatuses[number];
    evidence?: string;
    nextAction?: string;
  }>;
  maxScriptIssues: number;
  maxCandidates: number;
  maxLogBytes: number;
  maxLogIssues: number;
}) {
  const supportBundle = await buildSupportBundle({
    root: input.root,
    sample: input.sample,
    platform: input.platform,
    outputPath: input.buildOutputPath,
    developmentBuild: input.overallStatus !== "passed",
    maxScriptIssues: input.maxScriptIssues,
    maxCandidates: input.maxCandidates,
    maxLogBytes: input.maxLogBytes,
    maxLogIssues: input.maxLogIssues
  });
  const failedSteps = input.steps.filter((step) => step.status === "failed" || step.status === "blocked");
  const missingSteps = input.steps.filter((step) => step.status === "not-run");
  const recommendedNextActions = Array.from(new Set([
    ...failedSteps.map((step) => step.nextAction).filter(isNonEmptyString),
    ...missingSteps.map((step) => step.nextAction).filter(isNonEmptyString),
    ...supportBundle.nextActions
  ]));

  return {
    generatedAt: new Date().toISOString(),
    projectPath: input.root,
    sample: supportBundle.sample,
    platform: input.platform,
    overallStatus: input.overallStatus,
    device: input.device ?? null,
    buildOutputPath: input.buildOutputPath ?? null,
    notes: sanitizeRunResultNotes(input.notes),
    steps: input.steps,
    failedStepCount: failedSteps.length,
    notRunStepCount: missingSteps.length,
    supportBundleSummary: {
      overallReady: supportBundle.runReport.overallReady,
      readyForUnityValidation: supportBundle.sceneAudit.readyForUnityValidation,
      logIssueCount: supportBundle.latestLog.issueCount,
      supportBundlePath: supportBundle.generatedArtifacts.supportBundle
    },
    nextActions: recommendedNextActions,
    security: "Secret values are not returned. Do not include license keys, account tokens, appKey, appSecret, signing keys, or provisioning secrets in run result notes or evidence."
  };
}



export async function buildCompletionReport(
  root: string,
  sample: SampleInfo,
  platform: typeof mobilePlatforms[number],
  outputPath: string,
  maxScriptIssues: number,
  maxLogBytes: number,
  maxLogIssues: number
) {
  const [
    preflight,
    deviceValidation,
    latestLog,
    runResultArtifact
  ] = await Promise.all([
    buildFocusedPreflight(root, sample, platform, outputPath, maxScriptIssues),
    buildDeviceValidationChecklist(root, sample, platform, undefined, outputPath),
    buildLatestLogDiagnostic(root, sample, maxLogBytes, maxLogIssues),
    readRunResultArtifact(root, sample)
  ]);
  const preflightPassed = preflight.readyForDeviceBuild;
  const deviceReady = deviceValidation.readyForDeviceValidation;
  const runResultPassed = runResultArtifact.overallStatus === "passed";
  const realDeviceRunPassed = runResultPassed && runResultArtifact.hasPassedDeviceValidationEvidence;
  const hasRunResult = runResultArtifact.exists;
  const hasBlockingLogIssues = latestLog.issues.some((issue) => issue.severity === "high");
  const completionStatus = chooseCompletionStatus(hasRunResult, runResultArtifact.overallStatus, preflightPassed, deviceReady, realDeviceRunPassed, hasBlockingLogIssues);
  const runThroughComplete = completionStatus === "passed";
  const portalEvidencePassed = !deviceValidation.blockers.some((blocker) => blocker.id === "portal-evidence");
  const requiredEvidence = [
    {
      id: "focused-preflight",
      required: true,
      passed: preflightPassed,
      detail: "PREFLIGHT.md must report readyForDeviceBuild=true."
    },
    {
      id: "device-validation-ready",
      required: true,
      passed: deviceReady,
      detail: "DEVICE_VALIDATION.md must have no sample/import/scene blockers before real-device testing."
    },
    ...(sample.id === "cloud-recognition"
      ? [{
          id: "portal-evidence",
          required: true,
          passed: portalEvidencePassed,
          detail: "PORTAL_EVIDENCE.md must confirm Sense License is not missing, Cloud Recognition library is present, and target count is greater than zero."
        }]
      : []),
    {
      id: "run-result-passed",
      required: true,
      passed: runResultPassed,
      detail: "RUN_RESULT.md must exist and record Overall status: passed after real device validation."
    },
    {
      id: "real-device-run-evidence",
      required: true,
      passed: realDeviceRunPassed,
      detail: "RUN_RESULT.md must include a recorded device and a passed real-device/device-validation step."
    },
    {
      id: "latest-log-clean",
      required: false,
      passed: !hasBlockingLogIssues,
      detail: "Latest Unity log diagnostics should not contain known error patterns for the focused sample."
    },
    ...sampleDevicePassCriteria(sample).map((criterion, index) => ({
      id: `sample-pass-criterion-${index + 1}`,
      required: true,
      passed: realDeviceRunPassed,
      detail: criterion
    }))
  ];
  const evidence = [
    {
      id: "preflight",
      path: path.relative(root, path.join(focusedSampleGeneratedDir(root, sample), "PREFLIGHT.md")),
      status: preflightPassed ? "passed" : "blocked",
      detail: preflightPassed ? "Focused preflight is ready for device build." : `${preflight.blockers.length} preflight blocker(s) remain.`
    },
    {
      id: "device-validation",
      path: path.relative(root, path.join(focusedSampleGeneratedDir(root, sample), "DEVICE_VALIDATION.md")),
      status: deviceReady ? "passed" : "blocked",
      detail: deviceReady
        ? "Device validation checklist is ready to execute."
        : `${deviceValidation.blockers.length} device validation blocker(s) remain: ${deviceValidation.blockers.map((blocker) => blocker.id).join(", ")}.`
    },
    {
      id: "run-result",
      path: runResultArtifact.relativePath,
      status: runResultArtifact.exists ? runResultArtifact.overallStatus ?? "unknown" : "missing",
      detail: runResultArtifact.exists
        ? `Recorded overall status: ${runResultArtifact.overallStatus ?? "unknown"}; real-device evidence: ${runResultArtifact.hasPassedDeviceValidationEvidence ? "yes" : "no"}.`
        : "RUN_RESULT.md has not been written yet."
    },
    {
      id: "latest-unity-log",
      path: latestLog.logPath ? path.relative(root, latestLog.logPath) : "none",
      status: hasBlockingLogIssues ? "failed" : latestLog.analyzed ? "checked" : "not-analyzed",
      detail: latestLog.analyzed ? `${latestLog.issueCount} known focused log issue(s) detected.` : "No latest Unity log was available for analysis."
    }
  ];
  const blockers = [
    ...preflight.blockers.map((blocker) => ({
      id: `preflight/${blocker.id}`,
      detail: blocker.detail,
      action: blocker.action
    })),
    ...deviceValidation.blockers.map((blocker) => ({
      id: `device/${blocker.id}`,
      detail: blocker.detail,
      action: blocker.action
    })),
    ...(!hasRunResult
      ? [{
          id: "run-result/missing",
          detail: "No RUN_RESULT.md artifact exists for this focused sample.",
          action: "Run compile/build/device validation and record the observed result with easyar_write_run_result."
        }]
      : runResultPassed
        ? runResultArtifact.hasPassedDeviceValidationEvidence
          ? []
          : [{
              id: "run-result/missing-real-device-evidence",
              detail: "RUN_RESULT.md is passed but does not include a recorded device plus a passed real-device/device-validation step.",
              action: "Run the focused sample on a real Android or iOS device, then record a passed device validation step with easyar_write_run_result."
            }]
        : [{
            id: "run-result/not-passed",
            detail: `RUN_RESULT.md overall status is ${runResultArtifact.overallStatus ?? "unknown"}, not passed.`,
            action: "Resolve the recorded run result next actions, then rerun the focused sample on a real device."
          }]),
    ...latestLog.issues
      .filter((issue) => issue.severity === "high")
      .map((issue) => ({
        id: `log/${issue.id}`,
        detail: issue.title,
        action: issue.actions.join(" ")
      }))
  ];
  const nextActions = buildCompletionNextActions(completionStatus, preflight, deviceValidation, runResultArtifact, latestLog, root, sample, platform);

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    platform,
    outputPath,
    completionStatus,
    runThroughComplete,
    requiredEvidence,
    evidence,
    parsedRunResult: runResultArtifact,
    summary: {
      readyForUnityBatch: preflight.readyForUnityBatch,
      readyForDeviceBuild: preflight.readyForDeviceBuild,
      readyForDeviceValidation: deviceValidation.readyForDeviceValidation,
      latestLogAnalyzed: latestLog.analyzed,
      latestLogIssueCount: latestLog.issueCount,
      latestRunResultStatus: runResultArtifact.overallStatus
    },
    blockers: uniqueBlockers(blockers),
    nextActions,
    security: "Completion reports use artifact status lines, presence checks, and redacted log diagnostics only. They do not include EasyAR tokens, license keys, Cloud Recognition appKey/appSecret, signing keys, provisioning secrets, or raw Unity logs."
  };
}



export function chooseCompletionStatus(
  hasRunResult: boolean,
  runResultStatus: string | null,
  preflightPassed: boolean,
  deviceReady: boolean,
  realDeviceRunPassed: boolean,
  hasBlockingLogIssues: boolean
): typeof runResultStatuses[number] {
  if (!hasRunResult) {
    return "not-run";
  }
  if (runResultStatus === "failed") {
    return "failed";
  }
  if (runResultStatus === "passed" && preflightPassed && deviceReady && realDeviceRunPassed && !hasBlockingLogIssues) {
    return "passed";
  }
  return "blocked";
}



export async function readRunResultArtifact(root: string, sample: SampleInfo) {
  const absolutePath = path.join(focusedSampleGeneratedDir(root, sample), "RUN_RESULT.md");
  const relativePath = path.relative(root, absolutePath);
  try {
    const body = await readFile(absolutePath, "utf8");
    const overallStatus = parseRunResultStatus(body);
    const device = parseMarkdownField(body, "Device");
    const buildOutputPath = parseMarkdownField(body, "Build output");
    const passedDeviceValidationStepCount = countPassedDeviceValidationSteps(body);
    return {
      exists: true,
      relativePath,
      overallStatus,
      device,
      buildOutputPath,
      passedStepCount: countMarkdownStepStatuses(body, "passed"),
      passedDeviceValidationStepCount,
      hasPassedDeviceValidationEvidence: hasRecordedDevice(device) && passedDeviceValidationStepCount > 0,
      failedStepCount: countMarkdownStepStatuses(body, "failed"),
      blockedStepCount: countMarkdownStepStatuses(body, "blocked"),
      notRunStepCount: countMarkdownStepStatuses(body, "not-run")
    };
  } catch {
    return {
      exists: false,
      relativePath,
      overallStatus: null,
      device: null,
      buildOutputPath: null,
      passedStepCount: 0,
      passedDeviceValidationStepCount: 0,
      hasPassedDeviceValidationEvidence: false,
      failedStepCount: 0,
      blockedStepCount: 0,
      notRunStepCount: 0
    };
  }
}



export async function readPortalEvidenceArtifact(root: string, sample: SampleInfo) {
  const absolutePath = path.join(root, "Assets", "EasyARGenerated", "PORTAL_EVIDENCE.md");
  const relativePath = path.relative(root, absolutePath);
  try {
    const body = await readFile(absolutePath, "utf8");
    return {
      exists: true,
      relativePath,
      sampleId: parseMarkdownField(body, "Sample") ?? sample.id,
      apiKeyPresent: parseYesNoField(body, "API KEY present"),
      apiSecretPresent: parseYesNoField(body, "API Secret present"),
      senseLicenseStatus: parseMarkdownField(body, "Sense License status"),
      cloudLibraryStatus: parseMarkdownField(body, "Cloud library status"),
      cloudTargetCount: parseNumberField(body, "Cloud target count")
    };
  } catch {
    return {
      exists: false,
      relativePath,
      sampleId: sample.id,
      apiKeyPresent: null,
      apiSecretPresent: null,
      senseLicenseStatus: null,
      cloudLibraryStatus: null,
      cloudTargetCount: null
    };
  }
}



export function devicePortalEvidenceBlockers(
  root: string,
  sample: SampleInfo,
  platform: typeof mobilePlatforms[number],
  portalEvidence: Awaited<ReturnType<typeof readPortalEvidenceArtifact>>
) {
  const detail = portalEvidencePreflightDetail(portalEvidence, sample);
  return isPortalEvidenceReadyForSample(portalEvidence, sample)
    ? []
    : [{
        id: "portal-evidence",
        detail,
        action: `Run easyar_write_portal_evidence projectPath=${root} sampleId=${sample.id} platform=${platform} with non-secret EasyAR development center observations before device validation.`
      }];
}



export function isPortalEvidenceReadyForSample(portalEvidence: Awaited<ReturnType<typeof readPortalEvidenceArtifact>>, sample: SampleInfo): boolean {
  return sample.id !== "cloud-recognition" || (
    portalEvidence.exists
    && portalEvidence.senseLicenseStatus !== "missing"
    && portalEvidence.cloudLibraryStatus === "present"
    && typeof portalEvidence.cloudTargetCount === "number"
    && portalEvidence.cloudTargetCount > 0
    && portalEvidence.apiKeyPresent !== false
    && portalEvidence.apiSecretPresent !== false
  );
}



export function portalEvidencePreflightDetail(portalEvidence: Awaited<ReturnType<typeof readPortalEvidenceArtifact>>, sample: SampleInfo): string {
  if (sample.id !== "cloud-recognition") {
    return "Portal evidence is optional for this sample.";
  }
  if (!portalEvidence.exists) {
    return "PORTAL_EVIDENCE.md is missing; Cloud Recognition needs non-secret portal evidence before device build.";
  }
  const missing = [
    portalEvidence.apiKeyPresent === false ? "API KEY presence" : null,
    portalEvidence.apiSecretPresent === false ? "API Secret presence" : null,
    portalEvidence.senseLicenseStatus === "missing" ? "Sense License status=missing" : null,
    portalEvidence.cloudLibraryStatus !== "present" ? `cloud library status=${portalEvidence.cloudLibraryStatus ?? "unknown"}` : null,
    !(typeof portalEvidence.cloudTargetCount === "number" && portalEvidence.cloudTargetCount > 0) ? `cloud target count=${portalEvidence.cloudTargetCount ?? "unknown"}` : null
  ].filter((item): item is string => Boolean(item));
  return missing.length > 0
    ? `Cloud Recognition portal evidence is incomplete: ${missing.join(", ")}.`
    : "Cloud Recognition portal evidence is ready.";
}



export function parseRunResultStatus(markdown: string): typeof runResultStatuses[number] | null {
  const value = parseMarkdownField(markdown, "Overall status");
  return runResultStatuses.includes(value as typeof runResultStatuses[number])
    ? value as typeof runResultStatuses[number]
    : null;
}



export function parseYesNoField(markdown: string, field: string): boolean | null {
  const value = parseMarkdownField(markdown, field);
  if (value === "yes") {
    return true;
  }
  if (value === "no") {
    return false;
  }
  return null;
}



export function parseNumberField(markdown: string, field: string): number | null {
  const value = parseMarkdownField(markdown, field);
  if (!value || value === "not recorded") {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}



export function parseMarkdownField(markdown: string, field: string): string | null {
  const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = markdown.match(new RegExp(`^${escapedField}:\\s*(.+)$`, "m"));
  return match?.[1]?.trim() ?? null;
}



export function countMarkdownStepStatuses(markdown: string, status: typeof runResultStatuses[number]): number {
  const escapedStatus = status.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...markdown.matchAll(new RegExp(`Status:\\s*${escapedStatus}\\b`, "g"))].length;
}



export function countPassedDeviceValidationSteps(markdown: string): number {
  const stepBlocks = markdown.split(/\n(?=\d+\.\s+)/g);
  return stepBlocks.filter((block) =>
    /Status:\s*passed\b/i.test(block) &&
    /(real[- ]?device|device validation|on[- ]?device|android device|ios device|iphone|ipad|pixel|camera\/tracking validation|tracking validation)/i.test(block)
  ).length;
}



export function hasRecordedDevice(device: string | null): boolean {
  return typeof device === "string" && isNonPlaceholderString(device) && !/^not recorded$/i.test(device.trim());
}



export function buildCompletionNextActions(
  completionStatus: typeof runResultStatuses[number],
  preflight: Awaited<ReturnType<typeof buildFocusedPreflight>>,
  deviceValidation: Awaited<ReturnType<typeof buildDeviceValidationChecklist>>,
  runResultArtifact: Awaited<ReturnType<typeof readRunResultArtifact>>,
  latestLog: Awaited<ReturnType<typeof buildLatestLogDiagnostic>>,
  root: string,
  sample: SampleInfo,
  platform: typeof mobilePlatforms[number]
) {
  if (completionStatus === "passed") {
    return [
      "Keep COMPLETION_REPORT.md, RUN_RESULT.md, DEVICE_VALIDATION.md, and SUPPORT_BUNDLE.md as the focused sample run-through evidence.",
      "Move on to the next requested EasyAR workflow only after the user asks to continue."
    ];
  }
  const actions: string[] = [];
  if (!preflight.readyForDeviceBuild) {
    actions.push(`Run easyar_write_focused_preflight projectPath=${root} sampleId=${sample.id} platform=${platform} and resolve the first blocker.`);
    actions.push(...preflight.nextActions);
  }
  if (!deviceValidation.readyForDeviceValidation) {
    actions.push(`Run easyar_write_device_validation_checklist projectPath=${root} sampleId=${sample.id} platform=${platform} and resolve device blockers.`);
    actions.push(...deviceValidation.nextActions);
  }
  if (!runResultArtifact.exists) {
    actions.push("Run Unity compile/build/device validation, then call easyar_write_run_result with observed step evidence.");
  } else if (runResultArtifact.overallStatus !== "passed") {
    actions.push(`RUN_RESULT.md is ${runResultArtifact.overallStatus ?? "unknown"}; resolve recorded failures/blockers and rerun on a real device.`);
  }
  if (latestLog.issues.some((issue) => issue.severity === "high")) {
    actions.push("Run easyar_write_issue_report after reviewing SUPPORT_BUNDLE.md and the latest Unity/device log diagnostics.");
  }
  actions.push(`Regenerate this report with easyar_write_completion_report projectPath=${root} sampleId=${sample.id} platform=${platform}.`);
  return Array.from(new Set(actions)).slice(0, 14);
}



export async function buildFocusedScopeStatus(
  root: string,
  platform: typeof mobilePlatforms[number],
  maxScriptIssues: number,
  maxLogBytes: number,
  maxLogIssues: number
) {
  const focused = focusedSamples();
  const reports = await Promise.all(focused.map((sample) => {
    const outputPath = platform === "android"
      ? `Builds/${sample.id}.apk`
      : `Builds/iOS/${sample.id}`;
    return buildCompletionReport(root, sample, platform, outputPath, maxScriptIssues, maxLogBytes, maxLogIssues);
  }));
  const items = reports.map((report) => ({
    sampleId: report.sample.id,
    sampleName: report.sample.name,
    completionStatus: report.completionStatus,
    runThroughComplete: report.runThroughComplete,
    blockerCount: report.blockers.length,
    latestRunResultStatus: report.summary.latestRunResultStatus,
    completionReportPath: path.relative(root, path.join(focusedSampleGeneratedDir(root, findSample(report.sample.id)), "COMPLETION_REPORT.md")),
    runResultPath: report.parsedRunResult.relativePath,
    nextActions: report.nextActions.slice(0, 5)
  }));
  const completedCount = items.filter((item) => item.completionStatus === "passed").length;
  const failedCount = items.filter((item) => item.completionStatus === "failed").length;
  const blockedCount = items.filter((item) => item.completionStatus === "blocked").length;
  const notRunCount = items.filter((item) => item.completionStatus === "not-run").length;
  const allFocusedSamplesComplete = items.length > 0 && items.every((item) => item.runThroughComplete);
  const nextActions = buildFocusedScopeNextActions(root, platform, items);

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    platform,
    scope: "focused-samples",
    focusedSampleIds: focused.map((sample) => sample.id),
    deferredSampleIds: deferredSamples().map((sample) => sample.id),
    focusedSampleCount: items.length,
    completedCount,
    blockedCount,
    failedCount,
    notRunCount,
    allFocusedSamplesComplete,
    items,
    nextActions,
    security: "Focused scope status reports completion states, artifact paths, and next calls only. It does not include EasyAR tokens, license keys, Cloud Recognition appKey/appSecret, signing keys, provisioning secrets, or raw Unity logs."
  };
}



export function buildFocusedReleaseEvidence(status: Awaited<ReturnType<typeof buildFocusedScopeStatus>>) {
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    evidenceKind: "mcp-easyar-focused-scope",
    source: "easyar_write_release_evidence",
    platform: status.platform,
    scope: status.scope,
    focusedSampleIds: status.focusedSampleIds,
    deferredSampleIds: status.deferredSampleIds,
    focusedSampleCount: status.focusedSampleCount,
    completedCount: status.completedCount,
    blockedCount: status.blockedCount,
    failedCount: status.failedCount,
    notRunCount: status.notRunCount,
    allFocusedSamplesComplete: status.allFocusedSamplesComplete,
    items: status.items.map((item) => ({
      sampleId: item.sampleId,
      sampleName: item.sampleName,
      completionStatus: item.completionStatus,
      runThroughComplete: item.runThroughComplete,
      blockerCount: item.blockerCount,
      latestRunResultStatus: item.latestRunResultStatus,
      completionReportPath: item.completionReportPath,
      runResultPath: item.runResultPath
    })),
    security: "Safe release evidence contains completion states and relative artifact paths only. It excludes project absolute paths, EasyAR passwords, account tokens, license keys, Cloud Recognition API KEY/API Secret values, appKey/appSecret, signing keys, provisioning secrets, APKs, Unity packages, and raw logs."
  };
}



export async function readFocusedReleaseEvidence(
  evidencePath: string,
  platform: typeof mobilePlatforms[number]
): Promise<Awaited<ReturnType<typeof buildFocusedScopeStatus>>> {
  const resolved = path.resolve(process.cwd(), evidencePath);
  const parsed = await readJsonFile(resolved);
  if (!isRecord(parsed)) {
    throw new Error(`Focused release evidence must be a JSON object: ${evidencePath}`);
  }
  const expectedSampleIds = focusedSamples().map((sample) => sample.id);
  const items = Array.isArray(parsed.items) ? parsed.items.filter(isRecord) : [];
  const itemSampleIds = items.map((item) => typeof item.sampleId === "string" ? item.sampleId : "").filter(Boolean);
  const missingSamples = expectedSampleIds.filter((sampleId) => !itemSampleIds.includes(sampleId));
  const evidencePlatform = typeof parsed.platform === "string" ? parsed.platform : "unknown";
  const schemaVersion = typeof parsed.schemaVersion === "number" ? parsed.schemaVersion : 0;
  const valid =
    schemaVersion === 1
    && parsed.evidenceKind === "mcp-easyar-focused-scope"
    && evidencePlatform === platform
    && missingSamples.length === 0
    && parsed.allFocusedSamplesComplete === true
    && items.every((item) => item.runThroughComplete === true && item.completionStatus === "passed" && item.latestRunResultStatus === "passed");

  const normalizedItems = items.map((item) => {
    const latestRunResultStatus = item.latestRunResultStatus === "passed"
      ? "passed" as const
      : item.latestRunResultStatus === "failed"
        ? "failed" as const
        : item.latestRunResultStatus === "blocked"
          ? "blocked" as const
          : item.latestRunResultStatus === "not-run"
            ? "not-run" as const
            : null;
    return {
      sampleId: typeof item.sampleId === "string" ? item.sampleId : "unknown",
      sampleName: typeof item.sampleName === "string" ? item.sampleName : typeof item.sampleId === "string" ? item.sampleId : "unknown",
      completionStatus: item.completionStatus === "passed" ? "passed" as const : item.completionStatus === "failed" ? "failed" as const : item.completionStatus === "blocked" ? "blocked" as const : "not-run" as const,
      runThroughComplete: item.runThroughComplete === true,
      blockerCount: typeof item.blockerCount === "number" ? item.blockerCount : 1,
      latestRunResultStatus,
      completionReportPath: typeof item.completionReportPath === "string" ? item.completionReportPath : "unknown",
      runResultPath: typeof item.runResultPath === "string" ? item.runResultPath : "unknown",
      nextActions: item.runThroughComplete === true
        ? ["Keep safe release evidence file with the release/tag record."]
        : ["Regenerate release evidence from the Unity project after focused samples pass."]
    };
  });

  const completedCount = normalizedItems.filter((item) => item.completionStatus === "passed").length;
  const failedCount = normalizedItems.filter((item) => item.completionStatus === "failed").length;
  const blockedCount = normalizedItems.filter((item) => item.completionStatus === "blocked").length;
  const notRunCount = normalizedItems.filter((item) => item.completionStatus === "not-run").length;
  return {
    generatedAt: typeof parsed.generatedAt === "string" ? parsed.generatedAt : new Date().toISOString(),
    projectPath: `release-evidence:${evidencePath}`,
    platform,
    scope: "focused-samples",
    focusedSampleIds: expectedSampleIds,
    deferredSampleIds: deferredSamples().map((sample) => sample.id),
    focusedSampleCount: expectedSampleIds.length,
    completedCount,
    blockedCount,
    failedCount,
    notRunCount,
    allFocusedSamplesComplete: valid,
    items: normalizedItems,
    nextActions: valid
      ? ["Safe release evidence proves the focused sample run-through for this release runner."]
      : [
          `Regenerate focused release evidence with easyar_write_release_evidence. Missing samples: ${missingSamples.join(", ") || "none"}.`,
          `Expected platform ${platform}, evidence platform ${evidencePlatform}.`
        ],
    security: "Focused release evidence was loaded from a safe JSON file and does not contain secret values."
  };
}



export function buildFocusedScopeNextActions(
  root: string,
  platform: typeof mobilePlatforms[number],
  items: Array<{
    sampleId: string;
    completionStatus: typeof runResultStatuses[number];
    runThroughComplete: boolean;
    nextActions: string[];
  }>
) {
  if (items.length > 0 && items.every((item) => item.runThroughComplete)) {
    return [
      "Keep FOCUSED_SCOPE_STATUS.md plus each sample COMPLETION_REPORT.md as focused scope evidence.",
      "Do not start deferred samples until the user asks to continue."
    ];
  }
  const actions: string[] = [];
  for (const item of items.filter((candidate) => !candidate.runThroughComplete)) {
    actions.push(`Run easyar_write_completion_report projectPath=${root} sampleId=${item.sampleId} platform=${platform}.`);
    if (item.completionStatus === "not-run") {
      actions.push(`Run the ${item.sampleId} compile/build/device sequence and record RUN_RESULT.md with easyar_write_run_result.`);
    }
    actions.push(...item.nextActions);
  }
  actions.push(`Regenerate focused scope status with easyar_write_focused_scope_status projectPath=${root} platform=${platform}.`);
  return Array.from(new Set(actions)).slice(0, 16);
}



export async function buildIssueReport(input: {
  root: string;
  sample: SampleInfo;
  platform: typeof mobilePlatforms[number];
  overallStatus: typeof runResultStatuses[number];
  device?: string;
  buildOutputPath?: string;
  observedBehavior?: string;
  expectedBehavior?: string;
  reproductionSteps: string[];
  steps: Array<{
    name: string;
    status: typeof runResultStatuses[number];
    evidence?: string;
    nextAction?: string;
  }>;
  maxScriptIssues: number;
  maxCandidates: number;
  maxLogBytes: number;
  maxLogIssues: number;
}) {
  const runResult = await buildRunResult({
    root: input.root,
    sample: input.sample,
    platform: input.platform,
    overallStatus: input.overallStatus,
    device: input.device,
    buildOutputPath: input.buildOutputPath,
    notes: input.observedBehavior,
    steps: input.steps,
    maxScriptIssues: input.maxScriptIssues,
    maxCandidates: input.maxCandidates,
    maxLogBytes: input.maxLogBytes,
    maxLogIssues: input.maxLogIssues
  });
  const readiness = await buildSampleReadinessReport(input.root, input.sample);
  const localConfig = await buildLocalConfigValidationReport(
    input.root,
    path.join(input.root, "ProjectSettings", "EasyAR", "easyar.local.json")
  );
  const artifactPaths = {
    onboarding: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "ONBOARDING.md")),
    workflowState: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "WORKFLOW_STATE.md")),
    officialAccess: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "OFFICIAL_ACCESS.md")),
    importChecklist: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "IMPORT_CHECKLIST.md")),
    runSequence: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "RUN_SEQUENCE.md")),
    runReport: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "RUN_REPORT.md")),
    sceneAudit: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "SCENE_AUDIT.md")),
    supportBundle: runResult.supportBundleSummary.supportBundlePath,
    runResult: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "RUN_RESULT.md")),
    deviceValidation: path.relative(input.root, path.join(focusedSampleGeneratedDir(input.root, input.sample), "DEVICE_VALIDATION.md")),
    latestLog: runResult.supportBundleSummary.logIssueCount > 0
      ? "Latest Unity log was summarized in SUPPORT_BUNDLE.md; do not paste full logs if they contain secrets."
      : "No known focused log issue was detected by the latest log analyzer."
  };
  const reproductionSteps = input.reproductionSteps.length > 0
    ? input.reproductionSteps.map(sanitizeIssueText).filter(isNonEmptyString)
    : defaultIssueReproductionSteps(input.sample, input.platform);
  const title = `[${input.sample.name}] ${input.overallStatus} on ${input.platform}`;
  const labels = [
    "sample-run",
    input.sample.id,
    input.platform,
    input.overallStatus
  ];
  const body = buildIssueReportMarkdown({
    generatedAt: new Date().toISOString(),
    title,
    labels,
    projectPath: input.root,
    sample: runResult.sample,
    platform: input.platform,
    overallStatus: input.overallStatus,
    device: input.device ?? null,
    buildOutputPath: input.buildOutputPath ?? null,
    observedBehavior: sanitizeIssueText(input.observedBehavior) ?? "Describe what happened during the latest run.",
    expectedBehavior: sanitizeIssueText(input.expectedBehavior) ?? sampleExpectedIssueBehavior(input.sample),
    reproductionSteps,
    stepSummary: runResult.steps.map((step) => ({
      name: sanitizeIssueText(step.name) ?? "Unnamed step",
      status: step.status,
      evidence: sanitizeIssueText(step.evidence) ?? null,
      nextAction: sanitizeIssueText(step.nextAction) ?? null
    })),
    readinessSummary: {
      ready: readiness.ready,
      unityVersion: readiness.unityVersion,
      failingChecks: readiness.checks.filter((check) => !check.ok).map((check) => ({
        id: check.id,
        severity: "blocker",
        detail: check.detail,
        action: readinessAction(check.id, input.sample)
      }))
    },
    configSummary: {
      valid: localConfig.valid,
      checkCount: localConfig.checks.length,
      failingChecks: localConfig.checks.filter((check) => !check.ok).map((check) => ({
        id: check.id,
        severity: "blocker",
        detail: check.detail
      }))
    },
    supportSummary: runResult.supportBundleSummary,
    artifactPaths,
    nextActions: runResult.nextActions.map(sanitizeIssueText).filter(isNonEmptyString),
    security: "This issue body is redacted. Do not attach EasyAR license keys, account tokens, Cloud Recognition appKey/appSecret, signing keys, provisioning profiles, or full private logs."
  });

  return {
    generatedAt: new Date().toISOString(),
    title,
    labels,
    body,
    projectPath: input.root,
    sample: runResult.sample,
    platform: input.platform,
    overallStatus: input.overallStatus,
    artifactPaths,
    nextActions: runResult.nextActions.map(sanitizeIssueText).filter(isNonEmptyString),
    security: "The GitHub issue report redacts common token, key, license, credential, password, and secret fields. Review before posting publicly."
  };
}



export async function buildDeviceValidationChecklist(
  root: string,
  sample: SampleInfo,
  platform: typeof mobilePlatforms[number],
  device?: string,
  buildOutputPath?: string
) {
  const readiness = await buildSampleReadinessReport(root, sample);
  const importChecklist = await buildImportChecklist(root, sample);
  const sceneAudit = await buildSampleSceneAudit(root, sample, 25);
  const portalEvidence = await readPortalEvidenceArtifact(root, sample);
  const readinessBlockers = readiness.checks
    .filter((check) => !check.ok)
    .map((check) => ({
      id: check.id,
      detail: check.detail,
      action: readinessAction(check.id, sample)
    }));
  const importBlockers = importChecklist.items
    .filter((item) => item.required && !item.ok)
    .map((item) => ({
      id: item.id,
      detail: item.evidence,
      action: item.action
    }));
  const sceneBlockers = sceneAudit.blockers.map((blocker) => ({
    id: blocker.id,
    detail: blocker.detail,
    action: blocker.action
  }));
  const portalBlockers = devicePortalEvidenceBlockers(root, sample, platform, portalEvidence);
  const blockers = uniqueBlockers([
    ...readinessBlockers,
    ...importBlockers,
    ...sceneBlockers,
    ...portalBlockers
  ]);
  const readyForDeviceValidation = blockers.length === 0;
  const steps = buildDeviceValidationSteps(sample, platform);
  const evidencePrompts = [
    "Device model and OS version.",
    "Build output path or installed app version.",
    "Unity build log path and device log capture path.",
    "Observed camera permission behavior.",
    ...sampleDeviceEvidencePrompts(sample)
  ];

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    platform,
    device: device ?? null,
    buildOutputPath: buildOutputPath ?? null,
    readyForDeviceValidation,
    blockers,
    preflightSummary: {
      readinessReady: readiness.ready,
      importReady: importChecklist.readyForFocusedPreparation,
      sceneReady: sceneAudit.readyForUnityValidation,
      portalEvidenceExists: portalEvidence.exists,
      portalSenseLicenseStatus: portalEvidence.senseLicenseStatus,
      portalCloudLibraryStatus: portalEvidence.cloudLibraryStatus,
      portalCloudTargetCount: portalEvidence.cloudTargetCount,
      unityVersion: readiness.unityVersion
    },
    steps,
    passCriteria: sampleDevicePassCriteria(sample),
    evidencePrompts,
    nextActions: readyForDeviceValidation
      ? [
          "Install the build on a real Android or iOS device.",
          "Run every device validation step and capture the requested evidence.",
          "Record the observed result with easyar_write_run_result."
        ]
      : Array.from(new Set(blockers.map((blocker) => blocker.action))),
    security: "Do not paste EasyAR license keys, account tokens, Cloud Recognition appKey/appSecret, signing keys, provisioning profiles, or device-private identifiers into validation evidence."
  };
}



export type DeviceValidationStep = {
  id: string;
  title: string;
  action: string;
  expected: string;
};



export function buildDeviceValidationSteps(sample: SampleInfo, platform: typeof mobilePlatforms[number]): DeviceValidationStep[] {
  const platformSteps = platform === "android"
    ? [
        {
          id: "install-android-build",
          title: "Install Android build",
          action: "Install the APK on a physical Android device and grant camera/network permissions when prompted.",
          expected: "The app launches without Android permission, Gradle, or signing failures."
        }
      ]
    : [
        {
          id: "install-ios-build",
          title: "Install iOS build",
          action: "Build/run the generated Xcode project on a physical iOS device with valid signing and camera usage description.",
          expected: "The app launches without signing, provisioning, or camera permission failures."
        }
      ];
  return [
    ...platformSteps,
    {
      id: "camera-startup",
      title: "Verify camera startup",
      action: "Launch the sample and observe the live camera feed.",
      expected: "The camera feed appears and no EasyAR license/plugin initialization error is shown."
    },
    ...sampleSpecificDeviceValidationSteps(sample),
    {
      id: "record-result",
      title: "Record validation result",
      action: "Call easyar_write_run_result with each step status, evidence, and next action.",
      expected: "RUN_RESULT.md captures whether this device validation passed, failed, or is blocked."
    }
  ];
}



export function sampleSpecificDeviceValidationSteps(sample: SampleInfo): DeviceValidationStep[] {
  if (sample.id === "cloud-recognition") {
    return [
      {
        id: "cloud-recognition-network",
        title: "Verify network and cloud service access",
        action: "Run on a device network that can reach the configured EasyAR Cloud Recognition service region.",
        expected: "No unauthorized, timeout, DNS, TLS, or region mismatch errors appear in app/device logs."
      },
      {
        id: "cloud-target-library-ready",
        title: "Verify Cloud Recognition target library",
        action: "Confirm the official EasyAR Cloud Recognition library for this AppId has at least one uploaded and enabled target image.",
        expected: "A non-secret library name, dashboard URL, or target count can be recorded for evidence, and no API KEY/API Secret values are exposed."
      },
      {
        id: "cloud-recognition-result",
        title: "Verify cloud recognition result",
        action: "Present a target configured in the official EasyAR Cloud Recognition library.",
        expected: "The sample receives a cloud recognition result and displays or logs the expected target/content response."
      }
    ];
  }

  if (sample.id === "mega") {
    return [
      {
        id: "mega-block-loaded",
        title: "Verify Mega Block is loaded",
        action: "Launch the Mega sample and confirm the selected Mega Block/library configuration is loaded without license or service errors.",
        expected: "The app logs or UI indicate the selected Mega Block is available; no license, credential, or block-not-found error appears."
      },
      {
        id: "mega-localization-environment",
        title: "Verify physical localization environment",
        action: "Run the sample in or near the physical environment represented by the selected Mega Block.",
        expected: "The test location matches the selected cloud localization library/Mega Block closely enough for localization."
      },
      {
        id: "mega-localization-result",
        title: "Verify Mega localization result",
        action: "Move the device slowly while pointing the camera at mapped visual features until the Mega sample reports a localized pose.",
        expected: "The sample reports successful localization/tracking and anchors content consistently to the Mega Block/map."
      },
      {
        id: "mega-runtime-stability",
        title: "Verify Mega runtime stability",
        action: "Keep the sample running for a short validation pass after localization succeeds.",
        expected: "Localization remains stable long enough to record evidence, and no network, GPS, or tracking timeout error blocks the sample."
      }
    ];
  }

  return [
    {
      id: "image-target-detection",
      title: "Verify image target detection",
      action: "Present a real target image from the imported Image Tracking target set in stable lighting.",
      expected: "The sample detects the target and shows anchored content at the target pose."
    },
    {
      id: "image-target-tracking-stability",
      title: "Verify tracking stability",
      action: "Move the device around the target and briefly occlude/reveal the target.",
      expected: "Tracking remains stable while visible and recovers predictably after reacquisition."
    }
  ];
}



export function sampleDevicePassCriteria(sample: SampleInfo): string[] {
  if (sample.id === "cloud-recognition") {
    return [
      "App launches on a physical device with camera permission granted.",
      "EasyAR initializes without license or plugin import errors.",
      "Cloud Recognition credentials are accepted by the official service.",
      "The selected Cloud Recognition library contains at least one uploaded target image for this test.",
      "A configured cloud target is recognized and produces the expected sample response.",
      "No secret values are printed in Unity, device, or support logs."
    ];
  }

  if (sample.id === "mega") {
    return [
      "App launches on a physical device with camera, location, and network permissions granted.",
      "EasyAR Mega initializes without license, plugin import, or service configuration errors.",
      "The selected cloud localization library and Mega Block are loaded or bound in the Unity project.",
      "The device is tested in or near the physical environment represented by the selected Mega Block.",
      "Mega localization succeeds and reports a stable localized/tracking pose long enough to record evidence.",
      "No secret values are printed in Unity, device, or support logs."
    ];
  }

  return [
    "App launches on a physical device with camera permission granted.",
    "EasyAR initializes without license or plugin import errors.",
    "A real image target is detected from the focused sample target set.",
    "Anchored content follows the target pose without obvious scale/orientation errors.",
    "Tracking loss and reacquisition behavior is understandable and recorded."
  ];
}



export function sampleDeviceEvidencePrompts(sample: SampleInfo): string[] {
  if (sample.id === "cloud-recognition") {
    return [
      "Cloud target/library name or non-secret identifier.",
      "Target library count or account-page confirmation that at least one test target image is uploaded.",
      "Recognition response status without appKey/appSecret values.",
      "Network/service-region observations."
    ];
  }

  if (sample.id === "mega") {
    return [
      "Cloud localization library name or non-secret identifier.",
      "Mega Block storage/name/id as non-secret local project material.",
      "Physical test location or mapped area description without private credentials.",
      "Observed Mega localization status, stability, and any timeout/network/GPS notes.",
      "Redacted logcat path captured after localization attempt."
    ];
  }

  return [
    "Target image/database asset path.",
    "Observed detection distance and lighting conditions.",
    "Tracking stability notes or short screen recording reference."
  ];
}



export function defaultIssueReproductionSteps(sample: SampleInfo, platform: typeof mobilePlatforms[number]): string[] {
  return [
    `Run easyar_write_onboarding_report with sampleId=${sample.id} and platform=${platform}.`,
    `Run easyar_write_import_checklist, easyar_write_run_sequence, easyar_write_run_report, and easyar_write_scene_audit for sampleId=${sample.id}.`,
    "Run Unity validation with EasyAR.EditorTools.EasyARSampleValidationHelper.ValidateFocusedSample.",
    `Build and test the ${sample.name} sample on a real ${platform} device.`,
    "Run easyar_write_support_bundle, easyar_write_run_result, and easyar_write_issue_report after the failure."
  ];
}



export function sampleExpectedIssueBehavior(sample: SampleInfo): string {
  if (sample.id === "image-tracking") {
    return "The Image Tracking sample should open the camera, load the configured target image, and show the expected tracking behavior on a real device.";
  }
  if (sample.id === "cloud-recognition") {
    return "The Cloud Recognition sample should open the camera, use configured official Cloud Recognition credentials, reach the service, and return recognition results on a real device.";
  }
  return "The focused EasyAR sample should pass validation and run on a real device.";
}
