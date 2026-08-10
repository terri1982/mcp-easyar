import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import { z } from "zod";
import { structuredJsonText } from "./mcp-response.js";
import { runProcess } from "./runtime.js";
import { findSample } from "./samples.js";
import { assertInside, ensureDirectory, exists, importSampleFromPackageCache, resolveProjectPath } from "./tool-services.js";
import { buildBuildSettingsHelper, buildDeviceBuildHelper, buildMegaRuntimeProbe, buildMegaRuntimeProbeSceneProcessor, buildMobileSettingsHelper, buildSampleValidationHelper, buildXrealSettingsHelper, instrumentMegaSampleSource } from "./unity-generators.js";

type RegisterTool = McpServer["tool"];

const actionValues = ["preflight", "import-sample", "prepare", "configure", "validate", "build-android"] as const;
const deviceProfileValues = ["android-phone", "xreal"] as const;
const imageTrackingVariantValues = ["targets", "motion-fusion", "multi-target-single-tracker", "multi-target-multi-tracker", "multi-target-same-image", "video"] as const;
const imageTrackingVariantScenes: Record<typeof imageTrackingVariantValues[number], string> = {
  "targets": "ImageTracking_Targets",
  "motion-fusion": "ImageTracking_MotionFusion",
  "multi-target-single-tracker": "ImageTracking_MultiTarget_SingleTracker",
  "multi-target-multi-tracker": "ImageTracking_MultiTarget_MultiTracker",
  "multi-target-same-image": "ImageTracking_MultiTarget_SameImage",
  "video": "ImageTracking_Video"
};
const actionMethods: Record<Exclude<typeof actionValues[number], "preflight" | "import-sample" | "prepare">, string[]> = {
  "configure": [
    "EasyAR.EditorTools.EasyARMobileSettingsHelper.ConfigureMobileSettings",
    "EasyAR.EditorTools.EasyARBuildSettingsHelper.ConfigureBuildSettings"
  ],
  "validate": ["EasyAR.EditorTools.EasyARSampleValidationHelper.ValidateFocusedSample"],
  "build-android": ["EasyAR.EditorTools.EasyARDeviceBuildHelper.Build"]
};

function methodsForAction(action: keyof typeof actionMethods, deviceProfile: typeof deviceProfileValues[number]) {
  const methods = [...actionMethods[action]];
  if (deviceProfile === "xreal" && action === "configure") {
    methods.splice(1, 0, "EasyAR.EditorTools.EasyARXrealSettingsHelper.ConfigureXreal");
  }
  if (deviceProfile === "xreal" && action === "validate") {
    methods.push("EasyAR.EditorTools.EasyARXrealSettingsHelper.ValidateXreal");
  }
  if (deviceProfile === "xreal" && action === "build-android") {
    methods.unshift("EasyAR.EditorTools.EasyARXrealSettingsHelper.ValidateXreal");
  }
  return methods;
}

function unityCliPath() {
  return process.env.EASYAR_UNITY_CLI_PATH ?? "unity";
}

function parseJsonOutput(output: string) {
  const trimmed = output.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }
}

function unityCliStatusArgs() {
  return ["--non-interactive", "--format", "json", "status"];
}

function unityCliUpgradeCheckArgs() {
  return ["--non-interactive", "--format", "json", "upgrade", "--check", "--channel", "beta"];
}

function latestCliVersion(report: unknown) {
  return (report as { data?: { latestVersion?: string } } | null)?.data?.latestVersion ?? null;
}

function resolveCliSample(sampleId: "image-tracking" | "cloud-recognition" | "mega", imageTrackingVariant?: typeof imageTrackingVariantValues[number]) {
  const sample = findSample(sampleId);
  if (!imageTrackingVariant) {
    return sample;
  }
  if (sample.id !== "image-tracking") {
    throw new Error("imageTrackingVariant can only be used with sampleId=image-tracking.");
  }
  const scene = imageTrackingVariantScenes[imageTrackingVariant];
  return {
    ...sample,
    name: `${sample.name} (${imageTrackingVariant})`,
    unityScenes: [scene]
  };
}

function defaultBundleIdentifier(sampleId: "image-tracking" | "cloud-recognition" | "mega") {
  return `cn.easyar.mcp.${sampleId.replaceAll("-", "")}`;
}

function reportPath(root: string, action: string) {
  return path.join(root, "Assets", "EasyARGenerated", "UnityCli", `${action}-report.json`);
}

async function finish(root: string, action: string, output: "inline" | "file", report: Record<string, unknown>) {
  if (output === "inline") {
    return structuredJsonText(report);
  }

  const target = reportPath(root, action);
  assertInside(root, target);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return structuredJsonText({
    action,
    output: "file",
    reportPath: target,
    summary: "Unity CLI report was written to the project."
  });
}

async function writeHelper(filePath: string, content: string, overwrite: boolean) {
  if (!overwrite && await exists(filePath)) {
    return false;
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
  return true;
}

async function instrumentMegaSample(root: string) {
  const samplesRoot = path.join(root, "Assets", "Samples");
  if (!await exists(samplesRoot)) {
    return { path: null, changed: false, skippedReason: "Import the official Mega sample before runtime instrumentation." };
  }
  const candidates: string[] = [];
  async function visit(directory: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(entryPath);
      } else if (entry.name === "Sample.cs" && entryPath.includes(`${path.sep}MegaBlock_Basic${path.sep}Scripts${path.sep}`)) {
        candidates.push(entryPath);
      }
    }
  }
  await visit(samplesRoot);
  const target = candidates.sort()[0];
  if (!target) {
    return { path: null, changed: false, skippedReason: "Official MegaBlock_Basic Sample.cs was not found under Assets/Samples." };
  }
  const source = await readFile(target, "utf8");
  const instrumented = instrumentMegaSampleSource(source);
  if (instrumented !== source) {
    await writeFile(target, instrumented, "utf8");
  }
  return { path: target, changed: instrumented !== source, skippedReason: null };
}

async function readAndroidBundleIdentifier(root: string) {
  const settingsPath = path.join(root, "ProjectSettings", "ProjectSettings.asset");
  try {
    const settings = await readFile(settingsPath, "utf8");
    const match = settings.match(/applicationIdentifier:\s*\n(?:[^\n]*\n)*?\s+Android:\s*([^\s]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

async function inspectUnityPackage(root: string, packageName: string, minimumVersion?: [number, number]) {
  const manifestPath = path.join(root, "Packages", "manifest.json");
  const lockPath = path.join(root, "Packages", "packages-lock.json");
  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as { dependencies?: Record<string, string> };
    const specification = manifest.dependencies?.[packageName] ?? null;
    let lockedVersion: string | null = null;
    try {
      const lock = JSON.parse(await readFile(lockPath, "utf8")) as { dependencies?: Record<string, { version?: string }> };
      lockedVersion = lock.dependencies?.[packageName]?.version ?? null;
    } catch {
      // Package resolution may not have run yet.
    }
    let version = lockedVersion?.match(/^\d+\.\d+\.\d+/)?.[0] ?? null;
    let cached = false;
    try {
      const cacheRoot = path.join(root, "Library", "PackageCache");
      const packageDirectory = (await readdir(cacheRoot, { withFileTypes: true }))
        .find((entry) => entry.isDirectory() && entry.name.startsWith(`${packageName}@`))?.name;
      if (packageDirectory) {
        cached = true;
        const packageJson = JSON.parse(await readFile(path.join(cacheRoot, packageDirectory, "package.json"), "utf8")) as { version?: string };
        version = packageJson.version ?? version;
      }
    } catch {
      // A local package can be declared before Unity populates PackageCache.
    }
    const installed = Boolean(specification || lockedVersion || cached);
    const parsed = version?.match(/^(\d+)\.(\d+)/);
    const compatible = !minimumVersion || !parsed
      ? installed
      : Number(parsed[1]) > minimumVersion[0] || Number(parsed[1]) === minimumVersion[0] && Number(parsed[2]) >= minimumVersion[1];
    return { installed, specification, version, lockedVersion, cached, compatible };
  } catch {
    return { installed: false, specification: null, version: null, lockedVersion: null, cached: false, compatible: false };
  }
}

async function inspectXrealPackages(root: string) {
  return {
    sdk: await inspectUnityPackage(root, "com.xreal.xr", [3, 1])
  };
}

async function addLocalUnityPackage(root: string, sourcePath: string, expectedName: string, minimumVersion?: [number, number]) {
  const source = path.resolve(sourcePath);
  if (!await exists(source)) {
    throw new Error(`Unity package was not found: ${source}`);
  }

  const sourceStat = await stat(source);
  let packageJsonText: string;
  if (sourceStat.isDirectory()) {
    packageJsonText = await readFile(path.join(source, "package.json"), "utf8");
  } else {
    const compressed = await readFile(source);
    const archive = source.endsWith(".tgz") || source.endsWith(".tar.gz") ? gunzipSync(compressed) : compressed;
    const packageJson = readTarEntries(archive).find((entry) => entry.name === "package/package.json" || entry.name === "package.json");
    if (!packageJson) {
      throw new Error(`Unity package archive does not contain package/package.json: ${source}`);
    }
    packageJsonText = packageJson.data.toString("utf8");
  }

  const metadata = JSON.parse(packageJsonText) as { name?: string; version?: string };
  if (metadata.name !== expectedName) {
    throw new Error(`Expected Unity package ${expectedName}, but the local package declares ${metadata.name ?? "no name"}.`);
  }
  const parsedVersion = metadata.version?.match(/^(\d+)\.(\d+)/);
  if (minimumVersion && parsedVersion && !(Number(parsedVersion[1]) > minimumVersion[0] || Number(parsedVersion[1]) === minimumVersion[0] && Number(parsedVersion[2]) >= minimumVersion[1])) {
    throw new Error(`Unity package ${expectedName} must be ${minimumVersion[0]}.${minimumVersion[1]} or newer; the local package declares ${metadata.version}.`);
  }

  const manifestPath = path.join(root, "Packages", "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as { dependencies?: Record<string, string> };
  manifest.dependencies ??= {};
  const specification = `file:${source}`;
  manifest.dependencies[expectedName] = specification;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return { packageName: expectedName, version: metadata.version ?? null, sourcePath: source, specification };
}

const xrealLicenseAssetPath = path.join("Assets", "EasyARGenerated", "XREAL", "nrsdk_license.bytes");

async function installXrealLicense(root: string, sourcePath: string) {
  const source = path.resolve(sourcePath);
  if (!await exists(source)) {
    throw new Error(`XREAL Enterprise license file was not found: ${source}`);
  }
  const data = await readFile(source);
  if (data.length === 0) {
    throw new Error("XREAL Enterprise license file is empty.");
  }
  const target = path.join(root, xrealLicenseAssetPath);
  assertInside(root, target);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
  return { sourcePath: source, assetPath: xrealLicenseAssetPath.replaceAll(path.sep, "/"), byteLength: data.length };
}

type TarEntry = { name: string; data: Buffer };

function readTarEntries(archive: Buffer): TarEntry[] {
  const entries: TarEntry[] = [];
  for (let offset = 0; offset + 512 <= archive.length;) {
    const header = archive.subarray(offset, offset + 512);
    const name = header.subarray(0, 100).toString("utf8").replace(/\0.*$/, "");
    if (!name) {
      break;
    }
    const sizeText = header.subarray(124, 136).toString("utf8").replace(/\0.*$/, "").trim();
    const size = Number.parseInt(sizeText || "0", 8);
    if (!Number.isFinite(size) || size < 0) {
      throw new Error("Official ImageTargets archive has an invalid tar entry size.");
    }
    const start = offset + 512;
    const end = start + size;
    if (end > archive.length) {
      throw new Error("Official ImageTargets archive ended before a tar entry was complete.");
    }
    entries.push({ name, data: archive.subarray(start, end) });
    offset = start + Math.ceil(size / 512) * 512;
  }
  return entries;
}

async function importImageTrackingStreamingAssets(root: string) {
  const cacheRoot = path.join(root, "Library", "PackageCache");
  const packageDirectory = (await readdir(cacheRoot, { withFileTypes: true }))
    .find((entry) => entry.isDirectory() && entry.name.startsWith("com.easyar.sense@"))?.name;
  if (!packageDirectory) {
    throw new Error("EasyAR Sense PackageCache is unavailable. Open the project once with Unity CLI before importing Image Tracking assets.");
  }
  const source = path.join(cacheRoot, packageDirectory, "Samples~", "StreamingAssets", "ImageTargets", "ImageTargets.unitypackage");
  const entries = readTarEntries(gunzipSync(await readFile(source)));
  const byName = new Map(entries.map((entry) => [entry.name, entry]));
  const targetPrefix = "Assets/StreamingAssets/EasyARSamples/ImageTargets/";
  const copied: string[] = [];
  for (const entry of entries.filter((candidate) => candidate.name.endsWith("/pathname"))) {
    const relativeTarget = entry.data.toString("utf8").trim();
    if (!relativeTarget.startsWith(targetPrefix)) {
      continue;
    }
    const id = entry.name.slice(0, -"/pathname".length);
    const asset = byName.get(`${id}/asset`);
    const meta = byName.get(`${id}/asset.meta`);
    if (!asset || !meta) {
      throw new Error(`Official ImageTargets archive is missing asset data for ${relativeTarget}.`);
    }
    const target = path.resolve(root, relativeTarget);
    assertInside(root, target);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, asset.data);
    await writeFile(`${target}.meta`, meta.data);
    copied.push(relativeTarget);
  }
  const required = ["namecard.jpg", "namecard.etd", "idback.etd"];
  const targetRoot = path.join(root, targetPrefix);
  const missing = [];
  for (const name of required) {
    if (!await exists(path.join(targetRoot, name))) {
      missing.push(name);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Official ImageTargets archive did not contain required files: ${missing.join(", ")}.`);
  }
  return { source, copied };
}

async function runUnityBuild(root: string, executeMethod: string, timeoutSeconds: number) {
  return runProcess(unityCliPath(), [
    "--non-interactive",
    "build",
    root,
    "--target", "Android",
    "--execute-method", executeMethod,
    "--no-tail",
    "--allow-dirty-build"
  ], timeoutSeconds);
}

export function registerUnityCliTools(registerTool: RegisterTool) {
  registerTool(
    "easyar_unity_cli_status",
    "Inspect the installed Unity CLI and Pipeline availability without opening or modifying a Unity project.",
    { output: z.enum(["inline", "file"]).default("inline").describe("Return the status inline or write a project report when projectPath is supplied."), projectPath: z.string().optional().describe("Optional Unity project path used only when output=file.") },
    async ({ output, projectPath }) => {
      const root = projectPath ? resolveProjectPath(projectPath) : null;
      if (output === "file" && !root) {
        throw new Error("projectPath is required when output=file.");
      }
      if (root) {
        await ensureDirectory(root);
      }
      const [version, status, upgradeCheck] = await Promise.all([
        runProcess(unityCliPath(), ["--version"], 15),
        runProcess(unityCliPath(), unityCliStatusArgs(), 15),
        runProcess(unityCliPath(), unityCliUpgradeCheckArgs(), 30)
      ]);
      const pipelineStatus = parseJsonOutput(status.stdout);
      const upgradeStatus = parseJsonOutput(upgradeCheck.stdout);
      const installedVersion = version.stdout.trim() || null;
      const latestVersion = latestCliVersion(upgradeStatus);
      const report = {
        action: "status",
        unityCliPath: unityCliPath(),
        available: version.exitCode === 0,
        version: installedVersion,
        latestVersion,
        updateAvailable: Boolean(installedVersion && latestVersion && installedVersion !== latestVersion),
        upgradeCheck: upgradeStatus,
        pipelineAvailable: status.exitCode === 0,
        pipelineStatus,
        diagnostics: [
          ...(upgradeCheck.exitCode === 0 && latestVersion ? [] : ["Unity CLI beta-channel update check did not return a latest version."]),
          ...(status.exitCode === 0 && pipelineStatus ? [] : ["No Pipeline-enabled editor is currently open, or Unity CLI did not return machine-readable status. Batch build actions remain available through unity build."])
        ],
        generatedAt: new Date().toISOString()
      };
      return root ? finish(root, "status", output, report) : structuredJsonText(report);
    }
  );

  registerTool(
    "easyar_unity_cli",
    "Run a fixed EasyAR Unity CLI workflow action. It never accepts arbitrary shell commands or C# method names.",
    {
      projectPath: z.string().describe("Unity project path."),
      action: z.enum(actionValues).describe("Fixed workflow action."),
      sampleId: z.enum(["image-tracking", "cloud-recognition", "mega"]).default("image-tracking").describe("Official focused EasyAR sample."),
      deviceProfile: z.enum(deviceProfileValues).default("android-phone").describe("Target a standard Android phone or an XREAL glasses workflow. XREAL requires com.xreal.xr 3.1+, an XREAL Enterprise license file, and Native Session Manager for EasyAR frame access."),
      xrealSdkPackagePath: z.string().optional().describe("Optional local com.xreal.xr 3.1+ package directory, .tgz, or .tar.gz. During XREAL prepare, MCP validates its package name and adds it to Packages/manifest.json."),
      xrealLicensePath: z.string().optional().describe("Local XREAL Enterprise nrsdk_license.bin path. Required by prepare when deviceProfile=xreal; copied into the Unity project as a TextAsset without returning its contents."),
      imageTrackingVariant: z.enum(imageTrackingVariantValues).optional().describe("Optional official Image Tracking scene variant. Only available with sampleId=image-tracking."),
      output: z.enum(["inline", "file"]).default("inline").describe("Return the report inline or write it below Assets/EasyARGenerated/UnityCli."),
      mode: z.enum(["plan", "execute"]).default("plan").describe("plan reports the exact bounded action; execute changes the selected project or starts a build."),
      outputPath: z.string().optional().describe("Android APK path relative to the project. Only used by build-android."),
      bundleIdentifier: z.string().optional().describe("Optional Android package name. Defaults to the project's existing Android identifier so a package-bound EasyAR license remains valid."),
      overwrite: z.boolean().default(false).describe("Replace generated helper scripts or an already imported sample."),
      timeoutSeconds: z.number().int().positive().max(1800).default(900).describe("Maximum Unity build command duration.")
    },
    async ({ projectPath, action, sampleId, deviceProfile, xrealSdkPackagePath, xrealLicensePath, imageTrackingVariant, output, mode, outputPath, bundleIdentifier, overwrite, timeoutSeconds }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const sample = resolveCliSample(sampleId, imageTrackingVariant);
      let xrealPackages = deviceProfile === "xreal" ? await inspectXrealPackages(root) : null;
      const projectXrealSdk = xrealPackages?.sdk ?? await inspectUnityPackage(root, "com.xreal.xr", [3, 1]);
      const androidMinSdkVersion = deviceProfile === "xreal" || projectXrealSdk.installed ? 29 : 24;
      const outputSlug = imageTrackingVariant ? `${sampleId}-${imageTrackingVariant}` : sampleId;
      const apkPath = path.resolve(root, outputPath ?? path.join("Builds", `${outputSlug}.apk`));
      assertInside(root, apkPath);
      const plan = {
        preflight: ["Read Unity CLI version and Pipeline status."],
        "import-sample": [`Copy local PackageCache ${sample.name} files into Assets/Samples with .meta files preserved.`],
        prepare: ["Create fixed EasyAR editor helpers for Android settings, scene setup, sample validation, and APK build."],
        configure: methodsForAction("configure", deviceProfile).map((method) => `unity build --target Android --execute-method ${method}`),
        validate: methodsForAction("validate", deviceProfile).map((method) => `unity build --target Android --execute-method ${method}`),
        "build-android": methodsForAction("build-android", deviceProfile).map((method) => `unity build --target Android --execute-method ${method}`)
      }[action];

      if (mode === "plan") {
        return finish(root, action, output, {
          action,
          mode,
          projectPath: root,
          sample: { id: sample.id, name: sample.name },
          deviceProfile,
          xrealPackages,
          xrealLocalPackages: deviceProfile === "xreal" ? {
            sdkProvided: Boolean(xrealSdkPackagePath)
          } : null,
          xrealEnterpriseLicense: deviceProfile === "xreal" ? { required: true, provided: Boolean(xrealLicensePath) } : null,
          plan,
          outputPath: action === "build-android" ? apkPath : null,
          safety: "Only fixed EasyAR workflow actions are allowed. No arbitrary commands or C# methods are accepted."
        });
      }

      if (action === "preflight") {
        const [version, status, upgradeCheck] = await Promise.all([
          runProcess(unityCliPath(), ["--version"], 15),
          runProcess(unityCliPath(), unityCliStatusArgs(), 15),
          runProcess(unityCliPath(), unityCliUpgradeCheckArgs(), 30)
        ]);
        const installedVersion = version.stdout.trim() || null;
        const upgradeStatus = parseJsonOutput(upgradeCheck.stdout);
        const latestVersion = latestCliVersion(upgradeStatus);
        return finish(root, action, output, {
          action,
          mode,
          projectPath: root,
          unityCliPath: unityCliPath(),
          available: version.exitCode === 0,
          version: installedVersion,
          latestVersion,
          updateAvailable: Boolean(installedVersion && latestVersion && installedVersion !== latestVersion),
          upgradeCheck: upgradeStatus,
          pipelineStatus: parseJsonOutput(status.stdout),
          deviceProfile,
          xrealPackages,
          xrealLocalPackages: deviceProfile === "xreal" ? {
            sdkProvided: Boolean(xrealSdkPackagePath)
          } : null,
          xrealEnterpriseLicense: deviceProfile === "xreal" ? { required: true, provided: Boolean(xrealLicensePath) } : null,
          nextActions: ["Run import-sample, prepare, configure, validate, then build-android."]
        });
      }

      if (action === "import-sample") {
        const imported = await importSampleFromPackageCache(root, sample, overwrite, false);
        const streamingAssets = sample.id === "image-tracking" && imported.imported
          ? await importImageTrackingStreamingAssets(root)
          : null;
        return finish(root, action, output, { action, mode, ...imported, streamingAssets });
      }

      const xrealLocalPackages = [];
      if (deviceProfile === "xreal" && action === "prepare") {
        if (!xrealLicensePath) {
          throw new Error("deviceProfile=xreal requires xrealLicensePath during prepare. EasyAR XREALFrameSource uses XREAL Enterprise camera data; obtain nrsdk_license.bin from an authorized XREAL Enterprise account.");
        }
        if (!xrealPackages?.sdk.installed && !xrealSdkPackagePath) {
          throw new Error("deviceProfile=xreal prepare requires either an installed com.xreal.xr 3.1+ package or xrealSdkPackagePath.");
        }
        if (xrealSdkPackagePath) {
          xrealLocalPackages.push(await addLocalUnityPackage(root, xrealSdkPackagePath, "com.xreal.xr", [3, 1]));
        }
        if (xrealLocalPackages.length > 0) {
          xrealPackages = await inspectXrealPackages(root);
        }
      }

      if (deviceProfile === "xreal" && !xrealPackages?.sdk.installed) {
        throw new Error("deviceProfile=xreal requires com.xreal.xr 3.1 or newer in Packages/manifest.json. Download the official XREAL SDK tarball and add it as a Unity package first.");
      }
      if (deviceProfile === "xreal" && xrealPackages?.sdk.version && !xrealPackages.sdk.compatible) {
        throw new Error(`deviceProfile=xreal requires com.xreal.xr 3.1 or newer; the resolved version is ${xrealPackages.sdk.version}.`);
      }
      if (action === "build-android" && overwrite) {
        const helperPath = path.join(root, "Assets", "Editor", "EasyARDeviceBuildHelper.cs");
        await writeHelper(helperPath, buildDeviceBuildHelper("android", apkPath, false), true);
      }

      if (action === "prepare") {
        const editorPath = path.join(root, "Assets", "Editor");
        const xrealLicense = deviceProfile === "xreal" && xrealLicensePath
          ? await installXrealLicense(root, xrealLicensePath)
          : null;
        const xrealHelperPath = path.join(editorPath, "EasyARXrealSettingsHelper.cs");
        if (deviceProfile === "xreal" && !overwrite && await exists(xrealHelperPath)) {
          const existingHelper = await readFile(xrealHelperPath, "utf8");
          if (!existingHelper.includes("LicenseAssetPath") || !existingHelper.includes("EnableNativeSessionManager")) {
            throw new Error("The existing EasyARXrealSettingsHelper.cs predates the current XREAL license or Native Session Manager validation. Rerun prepare with overwrite=true to upgrade the generated helper.");
          }
        }
        const resolvedBundleIdentifier = bundleIdentifier ?? await readAndroidBundleIdentifier(root) ?? defaultBundleIdentifier(sampleId);
        const helpers: Array<[string, string]> = [
          ["EasyARMobileSettingsHelper.cs", buildMobileSettingsHelper("android", resolvedBundleIdentifier, null, androidMinSdkVersion, deviceProfile === "android-phone")],
          ["EasyARBuildSettingsHelper.cs", buildBuildSettingsHelper(sample, "android")],
          ["EasyARSampleValidationHelper.cs", buildSampleValidationHelper(sample)],
          ["EasyARDeviceBuildHelper.cs", buildDeviceBuildHelper("android", apkPath, false)]
        ];
        if (deviceProfile === "xreal") {
          helpers.push(["EasyARXrealSettingsHelper.cs", buildXrealSettingsHelper(xrealLicenseAssetPath.replaceAll(path.sep, "/"))]);
        }
        if (sample.id === "mega") {
          helpers.push(["EasyARMegaRuntimeProbeSceneProcessor.cs", buildMegaRuntimeProbeSceneProcessor()]);
          helpers.push([path.join("..", "EasyARGenerated", "Diagnostics", "EasyARMegaRuntimeProbe.cs"), buildMegaRuntimeProbe()]);
        }
        const written = await Promise.all(helpers.map(async ([name, content]) => {
          const filePath = path.join(editorPath, name);
          return await writeHelper(filePath, content, overwrite) ? filePath : null;
        }));
        const runtimeInstrumentation = sample.id === "mega" ? await instrumentMegaSample(root) : null;
        return finish(root, action, output, {
          action,
          mode,
          projectPath: root,
          deviceProfile,
          xrealPackages,
          xrealLocalPackages,
          xrealLicense,
          androidMinSdkVersion,
          bundleIdentifier: resolvedBundleIdentifier,
          written: written.filter(Boolean),
          runtimeInstrumentation,
          skipped: written.filter((item) => !item).length,
          nextActions: ["Run configure so Unity imports helpers, imports ImageTargets StreamingAssets, and selects the official sample scene."]
        });
      }

      const methods = methodsForAction(action as keyof typeof actionMethods, deviceProfile);
      const results = [];
      for (const method of methods) {
        results.push(await runUnityBuild(root, method, timeoutSeconds));
        if (results.at(-1)?.exitCode !== 0) {
          break;
        }
      }
      return finish(root, action, output, {
        action,
        mode,
        projectPath: root,
        sample: { id: sample.id, name: sample.name },
        deviceProfile,
        xrealPackages,
        outputPath: action === "build-android" ? apkPath : null,
        succeeded: results.length === methods.length && results.every((result) => result.exitCode === 0 && !result.timedOut),
        results
      });
    }
  );
}
