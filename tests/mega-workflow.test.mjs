import assert from "node:assert/strict";
import { chmod, mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { findSample } from "../dist/samples.js";
import { reviewCsharpScript } from "../dist/tool-diagnostics.js";
import { readLocalConfigForRemoteValidation } from "../dist/tool-local-config-remote.js";
import { defaultAndroidLogcatFilter, hasMegaLocalizationEvidence, parseAndroidForegroundPackage } from "../dist/runtime.js";
import { buildLatestLogDiagnostic } from "../dist/tool-programming-services.js";
import { buildRunResult } from "../dist/tool-device-evidence.js";
import { buildBuildSettingsHelper } from "../dist/unity-generators.js";
import { inspectUnityExecutable } from "../dist/tool-project.js";
import { walk } from "../dist/tool-file-utils.js";
import {
  buildSampleSceneAudit,
  buildSampleReadinessReport,
  buildSampleSceneAuditSpecifics,
  readMegaSceneSummary,
  readMegaSettingsSummary
} from "../dist/tool-sample-workflow.js";

test("Unity executable inspection rejects CLI shims and broken symlinks", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "mcp-easyar-unity-editor-inspection-"));
  try {
    const cliPath = path.join(root, ".unity", "bin", "Unity");
    await mkdir(path.dirname(cliPath), { recursive: true });
    await writeFile(cliPath, "#!/bin/sh\nexit 0\n");
    await chmod(cliPath, 0o755);
    const cli = await inspectUnityExecutable(cliPath);
    assert.equal(cli.executableKind, "unity-cli-or-unknown");
    assert.equal(cli.supportsBatchmode, false);

    const editorPath = path.join(root, "Unity", "Hub", "Editor", "2022.3.62f3", "Unity.app", "Contents", "MacOS", "Unity");
    await mkdir(path.dirname(editorPath), { recursive: true });
    await writeFile(editorPath, "#!/bin/sh\nexit 0\n");
    await chmod(editorPath, 0o755);
    const editor = await inspectUnityExecutable(editorPath);
    assert.equal(editor.executableKind, "unity-editor");
    assert.equal(editor.supportsBatchmode, true);
    assert.equal(editor.detectedVersion, "2022.3.62f3");

    const brokenPath = path.join(root, "Unity", "Hub", "Editor", "6000.0.0f1", "Unity.app", "Contents", "MacOS", "Unity");
    await mkdir(path.dirname(brokenPath), { recursive: true });
    await symlink(path.join(root, "missing-editor"), brokenPath);
    const broken = await inspectUnityExecutable(brokenPath);
    assert.equal(broken.isSymlink, true);
    assert.equal(broken.resolvedPathExists, false);
    assert.equal(broken.supportsBatchmode, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Build Settings helper embeds an explicit Mega scene and fails closed when selection is ambiguous", () => {
  const sample = findSample("mega");
  const explicit = buildBuildSettingsHelper(sample, "android", "Assets/Samples/Mega/Scenes/Onsite.unity");
  assert(explicit.includes('ExplicitScenePath = "Assets/Samples/Mega/Scenes/Onsite.unity"'));
  assert(explicit.includes("LoadAssetAtPath<SceneAsset>"));

  const automatic = buildBuildSettingsHelper(sample, "android");
  assert(automatic.includes("matchingScenes.Length != 1"));
  assert(automatic.includes("regenerate this helper with an explicit scenePath"));
});

test("Mega scene audit blocks Simulator-first and ambiguous Onsite candidates", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "mcp-easyar-mega-scene-selection-"));
  try {
    await mkdir(path.join(root, "Assets", "EasyAR", "Scenes"), { recursive: true });
    await mkdir(path.join(root, "Assets", "XR", "Settings"), { recursive: true });
    await mkdir(path.join(root, "Packages"), { recursive: true });
    await mkdir(path.join(root, "ProjectSettings"), { recursive: true });
    await writeFile(path.join(root, "Packages", "manifest.json"), "{\"dependencies\":{}}\n");
    await writeFile(path.join(root, "ProjectSettings", "ProjectVersion.txt"), "m_EditorVersion: 2022.3.62f3\n");
    await writeFile(path.join(root, "Assets", "XR", "Settings", "EasyAR Settings.asset"), [
      "LicenseKey: local-license",
      "GlobalMegaBlockLocalizationServiceConfig:",
      "  AppID: app-id",
      "  ServerAddress: https://clsv3-api.easyar.com",
      "  APIKey: api-key",
      "  APISecret: api-secret"
    ].join("\n"));
    const scene = (mode) => [
      "m_Name: Mega Tracker",
      "locationInputMode: " + mode,
      "m_Name: Mega Block",
      "trackerHasSet: 1",
      ""
    ].join("\n");
    const simulator = "Assets/EasyAR/Scenes/MegaSimulator.unity";
    const onsiteA = "Assets/EasyAR/Scenes/MegaOnsiteA.unity";
    const onsiteB = "Assets/EasyAR/Scenes/MegaOnsiteB.unity";
    await writeFile(path.join(root, simulator), scene(1));
    await writeFile(path.join(root, onsiteA), scene(0));
    await writeFile(path.join(root, onsiteB), scene(0));
    await writeFile(path.join(root, "ProjectSettings", "EditorBuildSettings.asset"), [
      "EditorBuildSettings:",
      "  m_Scenes:",
      "  - enabled: 1",
      `    path: ${simulator}`
    ].join("\n"));

    const audit = await buildSampleSceneAudit(root, findSample("mega"), 30);
    const selection = audit.sampleSpecific.sceneSelection;
    assert.deepEqual(selection.onsiteCandidates.sort(), [onsiteA, onsiteB].sort());
    assert.deepEqual(selection.simulatorCandidates, [simulator]);
    assert.equal(selection.selectedSceneValid, false);
    assert.equal(selection.requiresExplicitSelection, true);
    assert.equal(selection.recommendedScene, onsiteA);
    assert(audit.blockers.some((blocker) => blocker.id === "mega-scene-selection"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("filesystem scans ignore AppleDouble and macOS metadata", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "mcp-easyar-metadata-scan-"));
  try {
    await mkdir(path.join(root, "Assets", "__MACOSX"), { recursive: true });
    await writeFile(path.join(root, "Assets", "RealMega.unity"), "scene");
    await writeFile(path.join(root, "Assets", "._FakeMega.unity"), "metadata");
    await writeFile(path.join(root, "Assets", ".DS_Store"), "metadata");
    await writeFile(path.join(root, "Assets", "__MACOSX", "HiddenMega.unity"), "metadata");
    const found = [];
    await walk(root, path.join(root, "Assets"), /\.unity$/i, found, 20);
    assert.deepEqual(found.map((file) => path.basename(file)), ["RealMega.unity"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("4003 Mega fixture uses EasyAR Settings.asset and MegaBlockController scene signals", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "mcp-easyar-mega-fixture-"));
  try {
    await mkdir(path.join(root, "Assets", "XR", "Settings"), { recursive: true });
    await mkdir(path.join(root, "Assets", "Samples", "EasyAR Sense Unity Plugin", "4003.0.0", "MegaBlock_Basic", "Scenes"), { recursive: true });
    await mkdir(path.join(root, "Packages"), { recursive: true });
    await mkdir(path.join(root, "ProjectSettings"), { recursive: true });
    await writeFile(path.join(root, "Packages", "manifest.json"), "{\"dependencies\":{}}\n");
    await writeFile(path.join(root, "ProjectSettings", "ProjectVersion.txt"), "m_EditorVersion: 2022.3.62f3\n");
    await writeFile(path.join(root, "Assets", "XR", "Settings", "EasyAR Settings.asset"), [
      "LicenseKey: local-license-presence",
      "GlobalMegaBlockLocalizationServiceConfig:",
      "  AppID: mega-app-id",
      "  ServerAddress: https://clsv3-api.easyar.com",
      "  APIKey: local-api-key-presence",
      "  APISecret: local-api-secret-presence",
      "GlobalMegaLandmarkLocalizationServiceConfig:",
      "  AppID: ",
      "  ServerAddress: ",
      "  APIKey: ",
      "  APISecret: "
    ].join("\n") + "\n");
    await writeFile(path.join(root, "Assets", "Samples", "EasyAR Sense Unity Plugin", "4003.0.0", "MegaBlock_Basic", "Scenes", "MegaBlock_Basic.unity"), [
      "%YAML 1.1",
      "--- !u!1 &1",
      "GameObject:",
      "  m_Name: Mega Tracker",
      "--- !u!114 &2",
      "MonoBehaviour:",
      "  locationInputMode: 0",
      "--- !u!1 &3",
      "GameObject:",
      "  m_Name: Mega Block",
      "  trackerHasSet: 1",
      ""
    ].join("\n"));

    const sample = findSample("mega");
    const settings = await readMegaSettingsSummary(root);
    assert.deepEqual(settings, {
      exists: true,
      relativePath: "Assets/XR/Settings/EasyAR Settings.asset",
      licensePresent: true,
      appIdPresent: true,
      serverAddressPresent: true,
      apiKeyPresent: true,
      apiSecretPresent: true
    });

    const scene = await readMegaSceneSummary(root);
    assert.equal(scene.hasMegaBlockController, true);
    assert.equal(scene.hasOnsite, true);

    const specifics = await buildSampleSceneAuditSpecifics(root, sample, 25);
    assert.equal(specifics.kind, "mega");
    assert.deepEqual(specifics.blockers, []);

    const readiness = await buildSampleReadinessReport(root, sample);
    assert.equal(readiness.ready, true);
    assert.equal(readiness.checks.find((check) => check.id === "local-config")?.ok, true);
    assert.equal(readiness.checks.find((check) => check.id === "focused-sample-runbook")?.ok, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Mega license asset paths are not mistaken for embedded license secrets", () => {
  const pathReview = reviewCsharpScript(
    "Assets/Editor/EasyARXrealSettingsHelper.cs",
    "private const string LicenseAssetPath = \"Assets/EasyARGenerated/XREAL/nrsdk_license.bytes\";"
  );
  assert.equal(pathReview.some((issue) => issue.id === "hardcoded-easyar-secret"), false);

  const secretReview = reviewCsharpScript(
    "Assets/Scripts/RiskyController.cs",
    "private string licenseKey = \"hardcoded-easyar-license-value\";"
  );
  assert.equal(secretReview.some((issue) => issue.id === "hardcoded-easyar-secret"), true);
});

test("Mega logcat evidence requires a localization or tracking success signal", () => {
  assert(defaultAndroidLogcatFilter(findSample("mega")).includes("MLOC"));
  assert.equal(hasMegaLocalizationEvidence("EasyAR Mega successfully localized against ADF"), true);
  assert.equal(hasMegaLocalizationEvidence("EasyAR initialized; camera started"), false);
});

test("Android runbook package resolution honors Unity ProjectSettings.asset", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "mcp-easyar-project-settings-"));
  try {
    await mkdir(path.join(root, "ProjectSettings"), { recursive: true });
    await writeFile(path.join(root, "ProjectSettings", "ProjectSettings.asset"), [
      "PlayerSettings:",
      "  applicationIdentifier:",
      "    Android: com.easyar.mega.xrtest",
      "  overrideDefaultApplicationIdentifier: 1",
      ""
    ].join("\n"));

    const config = await readLocalConfigForRemoteValidation(root);
    assert.equal(config.bundleIdentifier, "com.easyar.mega.xrtest");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Android foreground parser prefers the resumed package and rejects unrelated foreground apps", () => {
  const output = [
    "mCurrentFocus=Window{19a2 u0 com.android.launcher3/com.android.launcher3.Launcher}",
    "topResumedActivity: ActivityRecord{b72 u0 com.DefaultCompany.MegaMap/com.unity3d.player.UnityPlayerActivity t42}",
    "mResumedActivity: ActivityRecord{b72 u0 com.DefaultCompany.MegaMap/com.unity3d.player.UnityPlayerActivity t42}"
  ].join("\n");
  assert.equal(parseAndroidForegroundPackage(output), "com.DefaultCompany.MegaMap");
  assert.equal(parseAndroidForegroundPackage("mCurrentFocus=Window{19a2 u0 com.android.launcher3/com.android.launcher3.Launcher}"), "com.android.launcher3");
  assert.equal(parseAndroidForegroundPackage("mCurrentFocus=Window{19a2 u0 com.android.server.wm.WindowManagerService}"), null);
});

test("Mega latest-log diagnostic requires a localization or tracking success signal", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "mcp-easyar-mega-log-gate-"));
  try {
    await mkdir(path.join(root, "Logs"), { recursive: true });
    const logPath = path.join(root, "Logs", "current.log");
    await writeFile(logPath, "EasyAR initialized; camera started\n");
    const blocked = await buildLatestLogDiagnostic(root, findSample("mega"), 200000, 20);
    assert.equal(blocked.sampleSuccessEvidence, false);
    await writeFile(logPath, "EasyAR Mega successfully localized against ADF; tracking started\n");
    const passed = await buildLatestLogDiagnostic(root, findSample("mega"), 200000, 20);
    assert.equal(passed.sampleSuccessEvidence, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Mega run result cannot be written as passed without latest localization evidence", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "mcp-easyar-mega-run-result-gate-"));
  try {
    const result = await buildRunResult({
      root,
      sample: findSample("mega"),
      platform: "android",
      overallStatus: "passed",
      device: "Samsung S22",
      buildOutputPath: "Builds/mega-block-basic-beta3.apk",
      notes: "Attempted pass without localization evidence.",
      steps: [{
        name: "Real device validation - app launch",
        status: "passed",
        evidence: "App launch only.",
        nextAction: "Continue Mega localization."
      }],
      maxScriptIssues: 25,
      maxCandidates: 25,
      maxLogBytes: 200000,
      maxLogIssues: 20
    });
    assert.equal(result.overallStatus, "blocked");
    assert(result.nextActions.some((action) => action.includes("requested passed result was kept blocked")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
