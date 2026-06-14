export type SampleInfo = {
  id: string;
  name: string;
  description: string;
  implementationStatus: "focused" | "deferred";
  unityScenes: string[];
  requiredCapabilities: string[];
  setupNotes: string[];
};


export const samples: SampleInfo[] = [
  {
    id: "hello-ar",
    name: "Hello AR",
    description: "Minimal EasyAR scene for camera permission, ARSession startup, and device tracking validation.",
    implementationStatus: "deferred",
    unityScenes: ["HelloAR", "HelloAR_SparseSpatialMap"],
    requiredCapabilities: ["Camera permission", "EasyAR Sense Unity plugin"],
    setupNotes: [
      "Import the official EasyAR Sense Unity package for the target SDK version.",
      "Set the EasyAR license key in the project before building to device.",
      "Use Android or iOS build target for real device validation."
    ]
  },
  {
    id: "image-tracking",
    name: "Image Tracking",
    description: "Detect and track planar image targets, then anchor Unity content to the target pose.",
    implementationStatus: "focused",
    unityScenes: ["ImageTracking", "ImageTracker", "ImageTarget"],
    requiredCapabilities: ["Camera permission", "Image target assets", "EasyAR license key"],
    setupNotes: [
      "Add target images through the EasyAR target workflow used by the imported sample.",
      "Check target physical size and texture import settings.",
      "Test on a real device with stable lighting."
    ]
  },
  {
    id: "surface-tracking",
    name: "Surface Tracking",
    description: "Place virtual content on detected surfaces using EasyAR motion tracking features.",
    implementationStatus: "deferred",
    unityScenes: ["SurfaceTracking", "MotionTracking"],
    requiredCapabilities: ["Camera permission", "Motion tracking support", "Device sensors"],
    setupNotes: [
      "Confirm the target device supports required tracking modes.",
      "Keep AR camera prefab and session lifecycle components from the official sample.",
      "Build to device; most surface tracking workflows cannot be fully validated in the Editor."
    ]
  },
  {
    id: "cloud-recognition",
    name: "Cloud Recognition",
    description: "Recognize targets through EasyAR cloud services and use results to drive AR content.",
    implementationStatus: "focused",
    unityScenes: ["CloudRecognition", "CloudRecognizer", "ImageTracking_CloudRecognition"],
    requiredCapabilities: ["Network access", "Cloud recognition credentials", "EasyAR license key"],
    setupNotes: [
      "Configure official EasyAR cloud recognition credentials from the registered account.",
      "Verify network permissions and service region before testing.",
      "Avoid committing secrets; inject them through local config or CI secrets."
    ]
  },
  {
    id: "mega",
    name: "Mega",
    description: "Run an EasyAR Mega Unity sample with a configured cloud localization library and Mega Block on a real device, including Android phone and PICO 4 Ultra Enterprise validation paths.",
    implementationStatus: "focused",
    unityScenes: ["Mega", "MegaBlock", "MegaLocalization", "TiantanSkyPalace", "Pico"],
    requiredCapabilities: ["Camera permission", "Location/network access", "EasyAR Mega license key", "Mega Block cloud localization library", "PICO Unity Integration SDK 3.1.0+ for PICO headsets"],
    setupNotes: [
      "Install the official EasyAR Sense Unity Plugin for Mega from the EasyAR download page.",
      "For PICO 4 Ultra Enterprise, also install the official EasyAR Unity XR device extension package and PICO Unity Integration SDK 3.1.0 or newer.",
      "Use the user's logged-in EasyAR website or Mega Studio session to find non-secret library and block identifiers.",
      "Keep license keys and service credentials in local EasyAR settings or local config files; do not paste secrets into chat.",
      "Use Onsite location input for Android phone, PICO, and XREAL real-device validation. Simulator mode is only for editor or non-acceptance debugging.",
      "Build and validate on a real Android phone or PICO headset; editor or emulator launch is not enough to prove cloud localization."
    ]
  }
];

export const officialInfo = {
  capturedAt: "2026-06-10",
  docs: {
    samples: "https://www.easyar.cn/doc/en/develop/samples.html",
    downloads: "https://www.easyar.com/view/download.html",
    downloadHistory: "https://www.easyar.com/view/downloadHistory.html"
  },
  packageVersions: {
    easyarSenseUnityPlugin: "4002.0.0",
    easyarSenseUnityPluginForMega: "4002.0.0",
    easyarXrExtensionPackage: "4000.0.0",
    easyarSenseNative: "4.9.0"
  },
  notes: [
    "The official sample apps page says Unity samples are obtained from the Unity plugin download page and then imported according to the quickstart.",
    "This MCP server does not bypass account or enterprise download gates; connect it to official EasyAR account APIs before enabling private downloads."
  ]
};

export const quickstartWorkflow = [
  "# mcp-easyar Quickstart",
  "",
  "1. Build the server with `npm install && npm run build`.",
  "2. Use `easyar_generate_client_config` to create a Codex or Claude Desktop MCP config snippet.",
  "3. For the current local-key MVP, configure only local Unity/project paths and local license/CRS values; do not ask users for `EASYAR_API_TOKEN`.",
  "4. Use `easyar_check_account` and `easyar_validate_license` only after official EasyAR endpoints are configured.",
  "5. Read `easyar://acceptance/fresh-project` before a fresh Unity project run so the client keeps the current Image Tracking + CRS/Cloud Recognition scope and safety boundary.",
  "6. Use `easyar_list_samples` and `easyar_generate_sample_plan` to choose a sample.",
  "7. Focus first on `image-tracking`, `cloud-recognition`, or `mega`; other sample workflows are cataloged but deferred.",
  "8. Run `easyar_prepare_unity_project`, `easyar_write_unity_environment_report`, and `easyar_write_focused_preflight` before any Unity batch command.",
  "9. Read `PREFLIGHT.md` first and follow its `nextCall`; do not skip account, local config, import, Unity path, scene, or script blockers.",
  "10. Import the official EasyAR Unity Plugin and matching sample scenes from EasyAR downloads or Unity Package Manager Samples.",
  "11. Use `easyar_write_local_config_from_env` or fill `ProjectSettings/EasyAR/easyar.local.json` locally without committing secrets.",
  "12. Run `easyar_write_run_sequence`, `easyar_write_artifact_index`, `easyar_write_run_report`, `easyar_write_scene_audit`, and `easyar_write_support_bundle` for handoff evidence.",
  "13. Run `easyar_create_mobile_settings_helper` and `easyar_run_unity_method` to apply Android/iOS player settings.",
  "14. Run `easyar_create_build_settings_helper` and `easyar_run_unity_method` to add the sample scene to Build Settings.",
  "15. For project code, write `PROGRAMMING_CONTEXT.md` before `CODE_PLAN.md`, then use `easyar_create_mono_behaviour`, `easyar_write_csharp_file`, `easyar_review_csharp_scripts`, and `easyar_write_code_change_summary`.",
  "16. Run `easyar_run_unity_compile_check`, build to a real Android or iOS device, and use `easyar_write_run_result` after compile, build, or device attempts.",
  "",
  "Do not commit account tokens, EasyAR license keys, cloud credentials, signing keys, or provisioning secrets."
].join("\n");


export function findSample(sampleId: string): SampleInfo {
  const sample = samples.find((candidate) => candidate.id === sampleId);
  if (!sample) {
    throw new Error(`Unknown sampleId "${sampleId}". Use easyar_list_samples first.`);
  }
  return sample;
}

export function focusedSamples(): SampleInfo[] {
  return samples.filter((sample) => sample.implementationStatus === "focused");
}

export function deferredSamples(): SampleInfo[] {
  return samples.filter((sample) => sample.implementationStatus === "deferred");
}
