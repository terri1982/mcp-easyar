import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzeUnityLog } from "../dist/tool-diagnostics.js";
import { parseAdbDevices, redactSecretText } from "../dist/runtime.js";
import { findSample } from "../dist/samples.js";
import { packageCacheSamplePathRank } from "../dist/tool-sample-workflow.js";
import { sanitizeToolErrorText, toolErrorResult } from "../dist/tool-handler.js";
import { buildBuildSettingsHelper, buildDeviceBuildHelper, buildMegaRuntimeProbe, buildMegaRuntimeProbeSceneProcessor, buildMobileSettingsHelper, buildXrealSettingsHelper, instrumentMegaSampleSource } from "../dist/unity-generators.js";

test("redactSecretText redacts local-key and URL secret fields", () => {
  const input = [
    "licenseKey=abc123",
    "appSecret: \"secret-value\"",
    "https://example.test/path?token=plain-token&safe=1",
    `blob=${"A".repeat(96)}`
  ].join("\n");

  const redacted = redactSecretText(input);
  assert(!redacted.includes("abc123"));
  assert(!redacted.includes("secret-value"));
  assert(!redacted.includes("plain-token"));
  assert(!redacted.includes("A".repeat(96)));
  assert(redacted.includes("<redacted>"));
});

test("parseAdbDevices keeps serial, state, and detail fields", () => {
  const devices = parseAdbDevices([
    "List of devices attached",
    "emulator-5554 device product:sdk_gphone model:Android_SDK",
    "ABC123 unauthorized usb:337641472X",
    ""
  ].join("\n"));

  assert.deepEqual(devices, [
    {
      serial: "emulator-5554",
      state: "device",
      detail: "product:sdk_gphone model:Android_SDK"
    },
    {
      serial: "ABC123",
      state: "unauthorized",
      detail: "usb:337641472X"
    }
  ]);
});

test("tool error results are structured and do not expose the home path", () => {
  const raw = `${process.env.HOME}/Projects/mcp-easyar/Builds/missing.apk`;
  const text = sanitizeToolErrorText(new Error(`APK does not exist: ${raw}`));
  assert(!text.includes(process.env.HOME));
  assert(text.includes("~/Projects/mcp-easyar/Builds/missing.apk"));

  const result = toolErrorResult("easyar_android_install_apk", new Error(`APK does not exist: ${raw}`));
  assert.equal(result.isError, true);
  assert.equal(result.content[0].type, "text");
  assert(result.content[0].text.includes("easyar_android_install_apk"));
});

test("Unity log analysis reports broken sample GUID references", () => {
  const issues = analyzeUnityLog([
    "W Unity   : The referenced script on this Behaviour (Game Object 'Sample') is missing!",
    "E Unity   : fail to load target data from easyar.ImageTargetController+Texture2DSourceData: Texture is null"
  ].join("\n"));

  assert(issues.some((issue) => issue.id === "unity-missing-script-guid"));
  assert(issues.some((issue) => issue.id === "unity-broken-asset-guid"));
  assert(issues.some((issue) => issue.actions.some((action) => action.includes(".meta"))));
});

test("Mega package discovery prefers the runnable Sense sample", () => {
  const mega = findSample("mega");
  const candidates = [
    "Library/PackageCache/com.easyar.mega.studio@abc/Samples~/MegaAnnotationExtension",
    "Library/PackageCache/com.easyar.sense@def/Samples~/HeadMountedDisplay/Combination_BasedOn_Xreal",
    "Library/PackageCache/com.easyar.sense@def/Samples~/Mega"
  ];
  candidates.sort((left, right) => packageCacheSamplePathRank(mega, left) - packageCacheSamplePathRank(mega, right));
  assert.equal(candidates[0], "Library/PackageCache/com.easyar.sense@def/Samples~/Mega");
});

test("XREAL helper enables Native Session Manager, assigns the loader, and validates OpenGL ES 3", () => {
  const helper = buildXrealSettingsHelper();
  assert(helper.includes("Unity.XR.XREAL.XREALXRLoader"));
  assert(helper.includes("XRPackageMetadataStore.AssignLoader"));
  assert(helper.includes("GraphicsDeviceType.OpenGLES3"));
  assert(helper.includes("com.xreal.xr 3.1 or newer"));
  assert(!helper.includes("com.xreal.xr.enterprise"));
  assert(helper.includes("EnableNativeSessionManager"));
  assert(helper.includes('SetBool(serialized, "SupportMultiResume", false)'));
  assert(helper.includes("LicenseAssetPath"));
  assert(helper.includes("XREAL Enterprise camera license is not assigned"));
});

test("focused Unity builds isolate one sample scene and clean generated external-drive residue", () => {
  const sample = findSample("image-tracking");
  const settings = buildBuildSettingsHelper(sample, "android");
  const build = buildDeviceBuildHelper("android", "/tmp/image-tracking.apk", false);
  assert(settings.includes("EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(scene, true) }"));
  assert(!settings.includes("existingScenes"));
  assert(build.includes("CleanupGeneratedAppleDoubleFiles"));
  assert(build.includes('Directory.GetFiles(beeRoot, "._*", SearchOption.AllDirectories)'));
  assert(build.includes("CleanupXrSimulationTempResidue"));
  assert(build.includes("BuildOptions.None"));
});

test("Android phone CLI configuration removes a stale XREAL loader", () => {
  const helper = buildMobileSettingsHelper("android", "cn.easyar.test", null, 24, true);
  assert(helper.includes("XRPackageMetadataStore.RemoveLoader"));
  assert(helper.includes("Unity.XR.XREAL.XREALXRLoader"));
  assert(helper.includes("manager.automaticLoading = false"));
  assert(helper.includes('serialized.FindProperty("SupportMultiResume")'));
  assert(helper.includes("multiResume.boolValue = false"));
});

test("Mega runtime probe logs localization status transitions", () => {
  const probe = buildMegaRuntimeProbe();
  const processor = buildMegaRuntimeProbeSceneProcessor();
  assert(probe.includes("LocalizationRespond += OnLocalizationRespond"));
  assert(probe.includes("[EasyAR MCP] Mega localization status:"));
  assert(probe.includes("if (status == lastStatus)"));
  assert(probe.includes("UnityEditor.Callbacks.PostProcessScene"));
  assert(processor.includes("IProcessSceneWithReport"));
  assert(processor.includes("AddComponent<EasyARMegaRuntimeProbe>"));
});

test("Mega sample instrumentation logs official localization callbacks", () => {
  const source = "        var status = response.Status;\r\n        wakingUpCount++;\r\n";
  const instrumented = instrumentMegaSampleSource(source);
  assert(instrumented.includes('[EasyAR MCP] Mega localization status:'));
  assert.equal(instrumentMegaSampleSource(instrumented), instrumented);
});

test("Mega diagnostics treat a later Found status as localization success", () => {
  const mega = findSample("mega");
  const issues = analyzeUnityLog([
    "[EasyAR MCP] Mega localization status: NotFound",
    "[EasyAR MCP] Mega localization status: Found"
  ].join("\n"), mega);
  assert(!issues.some((issue) => issue.id === "mega-block-config"));
  assert(!issues.some((issue) => issue.id === "mega-localization-runtime"));
});
