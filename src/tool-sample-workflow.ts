import { cp, mkdir, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import type { SampleInfo } from "./samples.js";
import { officialInfo } from "./samples.js";
import { buildLocalConfigValidationReport, readCloudRecognitionConfig, cloudRecognitionCredentialMode, hasCompleteCloudRecognitionConfig, isNonPlaceholderString, isRecord } from "./tool-local-config.js";
import { assertInside, walk } from "./tool-file-utils.js";
import { exists, findFiles, readUnityVersion } from "./tool-project.js";
import { readAuthConfig } from "./tool-services.js";

export async function buildSampleReadinessReport(root: string, sample: SampleInfo) {
  const easyarSignals = filterOfficialEasyARSignals(await findFiles(root, ["Assets", "Packages"], /easyar/i, 240));
  const sampleScenes = await findFiles(root, ["Assets"], /\.(unity)$/i, 200);
  const matchingScenes = await matchSampleScenes(root, sample, sampleScenes);
  const packageCacheSamples = await findPackageCacheSamplePaths(root, sample, 20);
  const sampleSpecificChecks = await buildSampleSpecificReadinessChecks(root, sample);

  const checks = [
    {
      id: "sample-focus",
      ok: sample.implementationStatus === "focused",
      detail: sample.implementationStatus === "focused"
        ? `${sample.name} is in the current focused run-through set.`
        : `${sample.name} is deferred. Current focused samples are Image Tracking, Cloud Recognition, and Mega.`
    },
    {
      id: "unity-project",
      ok: await exists(path.join(root, "Assets")) && await exists(path.join(root, "ProjectSettings", "ProjectVersion.txt")),
      detail: "Unity project contains Assets and ProjectSettings/ProjectVersion.txt."
    },
    {
      id: "packages-manifest",
      ok: await exists(path.join(root, "Packages", "manifest.json")),
      detail: "Unity Packages/manifest.json exists."
    },
    {
      id: "easyar-assets",
      ok: easyarSignals.length > 0,
      detail: easyarSignals.length > 0
        ? `Found ${easyarSignals.length} EasyAR-related asset/package path(s).`
        : "No EasyAR-related asset/package path was found. Import the official EasyAR Unity Plugin package."
    },
    {
      id: "sample-scene",
      ok: matchingScenes.length > 0,
      detail: matchingScenes.length > 0
        ? `Found matching sample scene(s): ${matchingScenes.join(", ")}.`
        : packageCacheSamples.length > 0
          ? `No imported scene matched hints: ${sample.unityScenes.join(", ")}. Package cache contains sample candidate(s): ${packageCacheSamples.join(", ")}.`
          : `No scene matched hints: ${sample.unityScenes.join(", ")}. Import the official ${sample.name} sample scene.`
    },
    {
      id: "local-config-template",
      ok: await exists(path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json.example")),
      detail: "ProjectSettings/EasyAR/easyar.local.json.example exists."
    },
    {
      id: "local-config",
      ok: await exists(path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json")),
      detail: "ProjectSettings/EasyAR/easyar.local.json exists for local license and account credentials."
    },
    {
      id: "sample-runner",
      ok: await exists(path.join(root, "Assets", "Editor", "EasyARSampleRunner.cs")),
      detail: "Assets/Editor/EasyARSampleRunner.cs exists."
    },
    {
      id: "build-settings-helper",
      ok: await exists(path.join(root, "Assets", "Editor", "EasyARBuildSettingsHelper.cs")),
      detail: "Assets/Editor/EasyARBuildSettingsHelper.cs exists."
    },
    {
      id: "mobile-settings-helper",
      ok: await exists(path.join(root, "Assets", "Editor", "EasyARMobileSettingsHelper.cs")),
      detail: "Assets/Editor/EasyARMobileSettingsHelper.cs exists for Android/iOS camera permission and player settings."
    },
    {
      id: "sample-validation-helper",
      ok: await exists(path.join(root, "Assets", "Editor", "EasyARSampleValidationHelper.cs")),
      detail: "Assets/Editor/EasyARSampleValidationHelper.cs exists for Unity-side focused sample validation."
    },
    {
      id: "focused-sample-runbook",
      ok: await exists(focusedSampleRunbookPath(root, sample)),
      detail: `${path.relative(root, focusedSampleRunbookPath(root, sample))} exists with sample-specific run-through steps.`
    },
    ...sampleSpecificChecks
  ];

  const nextActions = checks
    .filter((check) => !check.ok)
    .map((check) => readinessAction(check.id, sample));

  return {
    projectPath: root,
    sample: sample.name,
    unityVersion: await readUnityVersion(root),
    ready: checks.every((check) => check.ok),
    checks,
    matchingScenes,
    packageCacheSamples,
    nextActions
  };
}

export async function buildImportChecklist(root: string, sample: SampleInfo) {
  const allEasyARSignals = await findFiles(root, ["Assets", "Packages"], /easyar/i, 160);
  const easyarSignals = filterOfficialEasyARSignals(allEasyARSignals);
  const sampleScenes = await findFiles(root, ["Assets"], /\.(unity)$/i, 200);
  const matchingScenes = await matchSampleScenes(root, sample, sampleScenes);
  const packageCacheSamples = await findPackageCacheSamplePaths(root, sample, 20);
  const targetAssets = sample.id === "image-tracking"
    ? await findImageTrackingTargetAssets(root, 80)
    : [];
  const imageTargetsStreamingPackageCandidates = sample.id === "image-tracking"
    ? await findImageTargetsStreamingPackageCandidates(root, 20)
    : [];
  const imageTargetsStreamingAssetsImported = sample.id === "image-tracking"
    ? await hasOfficialImageTargetsStreamingAssets(root)
    : false;
  const cloudConfigPath = path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json");
  const cloudConfig = sample.id === "cloud-recognition" ? await readCloudRecognitionConfig(root) : null;
  const items = [
    {
      id: "unity-project-opened",
      required: true,
      ok: await exists(path.join(root, "Assets")) && await exists(path.join(root, "Packages", "manifest.json")) && await exists(path.join(root, "ProjectSettings", "ProjectVersion.txt")),
      evidence: "Assets, Packages/manifest.json, and ProjectSettings/ProjectVersion.txt exist.",
      action: "Open or create the Unity project once before importing EasyAR packages."
    },
    {
      id: "official-unity-plugin-imported",
      required: true,
      ok: easyarSignals.length > 0,
      evidence: easyarSignals.length > 0
        ? `EasyAR import signals: ${easyarSignals.slice(0, 10).join(", ")}`
        : "No official EasyAR import signals were found under Assets or Packages.",
      action: "Download the official EasyAR Sense Unity Plugin from the registered EasyAR account/download page and import it into this project."
    },
    {
      id: "focused-sample-scene-imported",
      required: true,
      ok: matchingScenes.length > 0,
      evidence: matchingScenes.length > 0
        ? `Matching sample scene(s): ${matchingScenes.join(", ")}`
        : packageCacheSamples.length > 0
          ? `No imported scene matched focused sample hints. Package cache sample candidate(s): ${packageCacheSamples.join(", ")}`
          : `No scene matched focused sample hints: ${sample.unityScenes.join(", ")}.`,
      action: packageCacheSamples.length > 0
        ? `Import ${sample.name} from Unity Package Manager Samples, then rerun easyar_generate_import_checklist.`
        : `Import the official ${sample.name} sample scene from the EasyAR Unity sample package.`
    },
    {
      id: "package-cache-sample-available",
      required: false,
      ok: packageCacheSamples.length > 0,
      evidence: packageCacheSamples.length > 0
        ? `Package cache sample candidate(s): ${packageCacheSamples.join(", ")}`
        : "No matching EasyAR Samples~ package cache sample was found.",
      action: "Open Unity Package Manager, select EasyAR Sense Unity Plugin, and import the matching official sample into Assets/Samples."
    },
    {
      id: "sample-scope-supported",
      required: true,
      ok: sample.implementationStatus === "focused",
      evidence: `${sample.name} status is ${sample.implementationStatus}.`,
      action: "Use image-tracking, cloud-recognition, or mega until broader sample work resumes."
    },
    {
      id: "official-download-discovery-ready",
      required: false,
      ok: readAuthConfig().downloadsEndpointConfigured,
      evidence: readAuthConfig().downloadsEndpointConfigured
        ? "EASYAR_DOWNLOADS_ENDPOINT is configured for account-scoped package discovery."
        : "EASYAR_DOWNLOADS_ENDPOINT is not configured; use manual official download page or configure the endpoint.",
      action: "Configure EASYAR_DOWNLOADS_ENDPOINT only with an authorized official EasyAR account API."
    },
    {
      id: "local-config-template-present",
      required: false,
      ok: await exists(path.join(root, "ProjectSettings", "EasyAR", "easyar.local.json.example")),
      evidence: "ProjectSettings/EasyAR/easyar.local.json.example is generated by easyar_prepare_unity_project.",
      action: `Run easyar_prepare_unity_project with sampleId "${sample.id}".`
    },
    ...(sample.id === "image-tracking"
      ? [
          {
            id: "image-tracking-target-assets-imported",
            required: true,
            ok: targetAssets.length > 0,
            evidence: targetAssets.length > 0
              ? `Possible target asset(s): ${targetAssets.slice(0, 10).join(", ")}`
              : "No Image Tracking target images/database assets were found.",
            action: "Import the official Image Tracking target assets or add real target images/database files under Assets."
          },
          {
            id: "image-tracking-streaming-assets-imported",
            required: true,
            ok: imageTargetsStreamingAssetsImported,
            evidence: imageTargetsStreamingAssetsImported
              ? "Assets/StreamingAssets/EasyARSamples/ImageTargets contains the official Image Tracking .jpg/.etd files."
              : imageTargetsStreamingPackageCandidates.length > 0
                ? `Found ImageTargets.unitypackage candidate(s): ${imageTargetsStreamingPackageCandidates.join(", ")}`
                : "No imported official Image Tracking StreamingAssets files or ImageTargets.unitypackage candidate were found.",
            action: "Import the official Samples~/StreamingAssets/ImageTargets/ImageTargets.unitypackage so device builds can load EasyARSamples/ImageTargets/namecard.jpg, namecard.etd, and idback.etd."
          }
        ]
      : sample.id === "cloud-recognition"
        ? [
          {
            id: "cloud-recognition-local-credentials-ready",
            required: true,
            ok: hasCompleteCloudRecognitionConfig(cloudConfig ?? {}),
            evidence: hasCompleteCloudRecognitionConfig(cloudConfig ?? {})
              ? `Cloud Recognition credentials are configured in ${path.relative(root, cloudConfigPath)}.`
              : `Cloud Recognition credentials are missing or incomplete in ${path.relative(root, cloudConfigPath)}.`,
            action: "Fill CRS AppId and API KEY from the official EasyAR Cloud Recognition account into local config, never into committed source."
          }
        ]
        : sample.id === "mega"
          ? [
              {
                id: "mega-assets-ready",
                required: true,
                ok: (await findMegaAssetHints(root, 40)).length > 0,
                evidence: (await findMegaAssetHints(root, 10)).length > 0
                  ? `Mega asset hint(s): ${(await findMegaAssetHints(root, 10)).join(", ")}`
                  : "No Mega, Mega Block, CloudLocalizer, or TiantanSkyPalace asset hints were found.",
                action: "Import the official EasyAR Sense Unity Plugin for Mega, then use Mega Studio or the generated installer to load the selected Mega Block."
              }
            ]
          : [])
  ];
  const nextActions = items
    .filter((item) => item.required && !item.ok)
    .map((item) => item.action);

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    unityVersion: await readUnityVersion(root),
    matchingScenes,
    packageCacheSamples,
    officialReferences: officialInfo.docs,
    packageVersions: officialInfo.packageVersions,
    readyForFocusedPreparation: items.filter((item) => item.required).every((item) => item.ok),
    items,
    nextActions: nextActions.length > 0
      ? Array.from(new Set(nextActions))
      : ["Official plugin, focused sample scene, and sample-specific import requirements are present. Continue with easyar_prepare_unity_project and easyar_generate_run_sequence."],
    security: "This checklist does not download private packages or expose secrets. It records local import evidence after authorized official EasyAR access."
  };
}

export async function buildSampleImportGuide(root: string, sample: SampleInfo) {
  const checklist = await buildImportChecklist(root, sample);
  const sceneItem = checklist.items.find((item) => item.id === "focused-sample-scene-imported");
  const packageCacheItem = checklist.items.find((item) => item.id === "package-cache-sample-available");
  const imageTargetsStreamingItem = checklist.items.find((item) => item.id === "image-tracking-streaming-assets-imported");
  const matchingScenes = checklist.matchingScenes ?? [];
  const packageCacheSamples = checklist.packageCacheSamples ?? [];
  const imageTargetsStreamingPackageCandidates = sample.id === "image-tracking"
    ? await findImageTargetsStreamingPackageCandidates(root, 20)
    : [];
  const imageTargetsStreamingAssetsImported = sample.id === "image-tracking"
    ? await hasOfficialImageTargetsStreamingAssets(root)
    : false;
  const importedScenes = matchingScenes.filter((scenePath) => scenePath.startsWith("Assets" + path.sep) || scenePath.startsWith("Assets/"));
  const unityPackageSampleName = sample.id === "cloud-recognition"
    ? "ImageTracking_CloudRecognition"
    : sample.unityScenes[0] ?? sample.name;
  const expectedImportLocations = [
    path.join("Assets", "Samples"),
    path.join("Assets", "Samples", "EasyAR Sense Unity Plugin"),
    path.join("Assets", "Samples", "EasyAR Sense Unity Plugin", officialInfo.packageVersions.easyarSenseUnityPlugin),
    path.join("Assets", "Samples", "EasyAR Sense Unity Plugin", officialInfo.packageVersions.easyarSenseUnityPlugin, "ImageTracking"),
    path.join("Assets", "Samples", "EasyAR Sense Unity Plugin", officialInfo.packageVersions.easyarSenseUnityPlugin, "ImageTracking", unityPackageSampleName)
  ];
  const postImportVerification = [
    {
      tool: "easyar_generate_import_checklist",
      arguments: { projectPath: root, sampleId: sample.id },
      expected: "focused-sample-scene-imported is OK and PackageCache candidates are no longer the only sample evidence."
    },
    {
      tool: "easyar_write_import_checklist",
      arguments: { projectPath: root, sampleId: sample.id },
      expected: `Assets/EasyARGenerated/${sample.id}/IMPORT_CHECKLIST.md records the imported focused sample scene.`
    },
    {
      tool: "easyar_check_sample_readiness",
      arguments: { projectPath: root, sampleId: sample.id },
      expected: sample.id === "cloud-recognition"
        ? "Cloud Recognition readiness no longer reports a missing sample scene; local cloud credentials may still block device validation."
        : "Image Tracking readiness no longer reports a missing sample scene; target assets may still block device validation."
    },
    {
      tool: "easyar_write_focused_preflight",
      arguments: { projectPath: root, sampleId: sample.id, platform: "android" },
      expected: "PREFLIGHT.md advances from import blockers to the next real blocker or Unity batch step."
    }
  ];
  const imageTrackingStreamingAssetSteps = sample.id === "image-tracking"
    ? [
        {
          order: 5,
          title: "Import ImageTargets StreamingAssets",
          action: "Import Samples~/StreamingAssets/ImageTargets/ImageTargets.unitypackage from the EasyAR package so Assets/StreamingAssets/EasyARSamples/ImageTargets contains namecard.jpg, namecard.etd, and idback.etd.",
          doneWhen: "The three official ImageTargets files exist under Assets/StreamingAssets/EasyARSamples/ImageTargets and Unity has refreshed the AssetDatabase."
        },
        {
          order: 6,
          title: "Prepare visual target validation",
          action: "Display or print a known target image, then point the connected phone at it after the APK launches.",
          doneWhen: "The device screen shows the Image Tracking sample found the expected target, for example FirstTarget/ImageTarget-argame01 or another imported target."
        }
      ]
    : [];
  const steps = [
    {
      order: 1,
      title: "Open the Unity project",
      action: `Open ${root} in Unity and wait until package import/compilation finishes.`,
      doneWhen: "The Project window and Package Manager are usable."
    },
    {
      order: 2,
      title: "Open Package Manager",
      action: "In Unity, open Window > Package Manager.",
      doneWhen: "Package Manager is visible."
    },
    {
      order: 3,
      title: "Select EasyAR Sense Unity Plugin",
      action: "Select the official EasyAR Sense Unity Plugin package from the project/package list.",
      doneWhen: "The EasyAR package detail panel is selected."
    },
    {
      order: 4,
      title: `Import ${unityPackageSampleName}`,
      action: `Open the Samples section and import ${unityPackageSampleName} into Assets/Samples.`,
      doneWhen: `A matching scene for ${sample.name} exists under Assets/Samples or another Assets folder.`
    },
    ...imageTrackingStreamingAssetSteps,
    {
      order: sample.id === "image-tracking" ? 7 : 5,
      title: "Return to MCP validation",
      action: `Run easyar_generate_import_checklist projectPath=${root} sampleId=${sample.id}, then easyar_check_sample_readiness projectPath=${root} sampleId=${sample.id}.`,
      doneWhen: sample.id === "image-tracking"
        ? "The focused sample scene import and image-target-streaming-assets checks are OK."
        : "The focused sample scene import check is OK."
    }
  ];

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: checklist.sample,
    unityVersion: checklist.unityVersion,
    importComplete: matchingScenes.length > 0,
    importAvailableFromPackageCache: packageCacheSamples.length > 0,
    expectedUnityPackageSampleName: unityPackageSampleName,
    expectedImportLocations,
    importedScenes,
    packageCacheSamples,
    imageTargetsStreamingPackageCandidates,
    imageTargetsStreamingAssetsImported,
    evidence: {
      focusedSampleScene: sceneItem?.evidence ?? "No focused sample scene evidence found.",
      packageCacheSample: packageCacheItem?.evidence ?? "No PackageCache sample evidence found.",
      imageTargetsStreamingAssets: imageTargetsStreamingItem?.evidence ?? "Not applicable for this sample."
    },
    steps,
    mcpAfterImport: postImportVerification.map((call) => ({ tool: call.tool, arguments: call.arguments })),
    postImportVerification,
    nextActions: matchingScenes.length > 0
      ? [
          "Focused sample scene is already imported. Continue with easyar_prepare_unity_project and easyar_next_workflow_step.",
          ...(sample.id === "image-tracking" && !imageTargetsStreamingAssetsImported
            ? ["Import Samples~/StreamingAssets/ImageTargets/ImageTargets.unitypackage before the Android/iOS device build."]
            : []),
          `Optionally write this guide with easyar_write_sample_import_guide projectPath=${root} sampleId=${sample.id} for handoff history.`
        ]
      : packageCacheSamples.length > 0
        ? [
            `Open Unity Package Manager, select EasyAR Sense Unity Plugin, and import Samples > ${unityPackageSampleName}.`,
            `After import, rerun easyar_generate_import_checklist projectPath=${root} sampleId=${sample.id}.`,
            `Write the guide with easyar_write_sample_import_guide projectPath=${root} sampleId=${sample.id} if another AI tool will continue the project.`
          ]
        : [
            "Download/import the official EasyAR Sense Unity Plugin through an authorized EasyAR account, then open Unity Package Manager Samples.",
            `Import the official ${sample.name} sample into Assets/Samples.`,
            `Rerun easyar_generate_sample_import_guide projectPath=${root} sampleId=${sample.id}.`
          ],
    security: "This guide does not download private packages, bypass official account access, or include license/API/cloud secret values. It only reports local Unity package/sample evidence and manual import steps."
  };
}

export async function importSampleFromPackageCache(root: string, sample: SampleInfo, overwrite: boolean, dryRun: boolean) {
  const packageCacheSamples = await findPackageCacheSamplePaths(root, sample, 20);
  const sourceRelativePath = packageCacheSamples[0] ?? null;
  const sourcePath = sourceRelativePath ? path.join(root, sourceRelativePath) : null;
  if (!sourcePath || !sourceRelativePath) {
    return {
      generatedAt: new Date().toISOString(),
      projectPath: root,
      sample: {
        id: sample.id,
        name: sample.name,
        implementationStatus: sample.implementationStatus
      },
      imported: false,
      dryRun,
      sourcePath: null,
      targetPath: null,
      targetExists: false,
      packageCacheSamples,
      nextActions: [
        `Run easyar_generate_sample_import_guide projectPath=${root} sampleId=${sample.id}.`,
        "Open Unity Package Manager and import the official EasyAR sample after the package is available in PackageCache."
      ],
      security: "No files were copied. This tool only imports samples already present in local Unity PackageCache."
    };
  }

  const packageInfo = await readPackageCacheInfo(sourcePath);
  const sampleFolderName = path.basename(sourcePath);
  const targetPath = path.join(root, "Assets", "Samples", packageInfo.displayName, packageInfo.version, sampleFolderName);
  const targetExists = await exists(targetPath);
  const sourceMetaFileCount = await countUnityMetaFiles(sourcePath);
  const plannedActions = [
    `Copy ${sourceRelativePath} to ${path.relative(root, targetPath)} with Unity .meta files preserved.`,
    `Rerun easyar_write_import_checklist projectPath=${root} sampleId=${sample.id}.`,
    `Rerun easyar_write_focused_preflight projectPath=${root} sampleId=${sample.id} platform=android.`
  ];

  if (targetExists && !overwrite) {
    return {
      generatedAt: new Date().toISOString(),
      projectPath: root,
      sample: {
        id: sample.id,
        name: sample.name,
        implementationStatus: sample.implementationStatus
      },
      imported: false,
      skipped: true,
      dryRun,
      reason: "Target sample directory already exists and overwrite=false.",
      sourcePath,
      targetPath,
      targetExists,
      package: packageInfo,
      packageCacheSamples,
      nextActions: [
        `Use overwrite=true to replace ${path.relative(root, targetPath)}, or rerun import checks if the existing sample is correct.`,
        ...plannedActions.slice(1)
      ],
      security: "Existing files were not overwritten. No private packages were downloaded."
    };
  }

  if (!dryRun) {
    await mkdir(path.dirname(targetPath), { recursive: true });
    await cp(sourcePath, targetPath, {
      recursive: true,
      force: overwrite,
      errorOnExist: !overwrite
    });
    const sourceMetaPath = `${sourcePath}.meta`;
    if (await exists(sourceMetaPath)) {
      await cp(sourceMetaPath, `${targetPath}.meta`, {
        force: overwrite,
        errorOnExist: !overwrite
      });
    }
  }

  const targetMetaFileCount = dryRun ? null : await countUnityMetaFiles(targetPath);
  const postImportChecklist = dryRun ? null : await buildImportChecklist(root, sample);

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    imported: !dryRun,
    skipped: false,
    dryRun,
    sourcePath,
    targetPath,
    targetExistsBefore: targetExists,
    package: packageInfo,
    packageCacheSamples,
    unityMetaFiles: {
      sourceCount: sourceMetaFileCount,
      targetCount: targetMetaFileCount,
      preserved: dryRun ? null : targetMetaFileCount === sourceMetaFileCount,
      risk: dryRun || targetMetaFileCount === sourceMetaFileCount
        ? null
        : "Unity .meta file count differs after import. Scene script, prefab, material, or texture GUID references may be broken; retry with overwrite=true or import through Unity Package Manager."
    },
    postImportReadyForFocusedPreparation: postImportChecklist?.readyForFocusedPreparation ?? null,
    postImportMatchingScenes: postImportChecklist?.matchingScenes ?? null,
    nextActions: dryRun
      ? plannedActions
      : [
          `Imported ${sample.name} into ${path.relative(root, targetPath)} with ${targetMetaFileCount ?? 0}/${sourceMetaFileCount} Unity .meta files present.`,
          `Run easyar_write_import_checklist projectPath=${root} sampleId=${sample.id}.`,
          `Run easyar_check_sample_readiness projectPath=${root} sampleId=${sample.id}.`,
          ...(targetMetaFileCount === sourceMetaFileCount
            ? []
            : ["Fix missing Unity .meta files before building; missing .meta breaks scene GUID references and causes missing scripts or null sample assets."]),
          `Run easyar_write_focused_preflight projectPath=${root} sampleId=${sample.id} platform=android.`
        ],
    security: "This tool copies only from local Unity PackageCache Samples~ into Assets/Samples. It does not download packages, bypass EasyAR account access, or include secret values."
  };
}

export async function countUnityMetaFiles(dirPath: string): Promise<number> {
  const found: string[] = [];
  await walk(dirPath, dirPath, /\.meta$/i, found, 20000);
  return found.length;
}

export async function readPackageCacheInfo(samplePath: string): Promise<{ displayName: string; version: string; packageRoot: string | null }> {
  const samplesMarker = `${path.sep}Samples~${path.sep}`;
  const markerIndex = samplePath.indexOf(samplesMarker);
  const packageRoot = markerIndex >= 0 ? samplePath.slice(0, markerIndex) : null;
  if (packageRoot) {
    try {
      const packageJson = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8")) as { displayName?: string; version?: string };
      return {
        displayName: sanitizeAssetFolderName(packageJson.displayName ?? "EasyAR Sense Unity Plugin"),
        version: sanitizeAssetFolderName(normalizeUnityPackageVersion(packageJson.version)),
        packageRoot
      };
    } catch {
      const folderName = path.basename(packageRoot);
      return {
        displayName: "EasyAR Sense Unity Plugin",
        version: sanitizeAssetFolderName(normalizeUnityPackageVersion(parsePackageCacheFolderVersion(folderName))),
        packageRoot
      };
    }
  }
  return {
    displayName: "EasyAR Sense Unity Plugin",
    version: officialInfo.packageVersions.easyarSenseUnityPlugin,
    packageRoot: null
  };
}

export function normalizeUnityPackageVersion(version: string | undefined): string {
  const value = version?.split("+")[0]?.trim();
  if (typeof value === "string" && isNonPlaceholderString(value)) {
    return value;
  }
  return officialInfo.packageVersions.easyarSenseUnityPlugin ?? "unknown";
}

export function parsePackageCacheFolderVersion(folderName: string): string | undefined {
  const match = folderName.match(/@([^@]+)$/);
  return match?.[1];
}

export function sanitizeAssetFolderName(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, "_").trim() || "EasyAR Sense Unity Plugin";
}

export async function buildSampleSceneAudit(root: string, sample: SampleInfo, maxCandidates: number) {
  const allEasyARSignals = await findFiles(root, ["Assets", "Packages"], /easyar/i, maxCandidates * 3);
  const easyarSignals = filterOfficialEasyARSignals(allEasyARSignals).slice(0, maxCandidates);
  const ignoredGeneratedSignals = allEasyARSignals
    .filter((candidatePath) => !filterOfficialEasyARSignals([candidatePath]).includes(candidatePath))
    .slice(0, maxCandidates);
  const sampleScenes = await findFiles(root, ["Assets"], /\.(unity)$/i, maxCandidates * 3);
  const matchingScenes = (await matchSampleScenes(root, sample, sampleScenes)).slice(0, maxCandidates);
  const buildSettingsHints = await readBuildSettingsSceneHints(root, sample);
  const sampleSpecific = await buildSampleSceneAuditSpecifics(root, sample, maxCandidates);
  const readiness = await buildSampleReadinessReport(root, sample);
  const blockers = uniqueBlockers([
    ...readiness.checks.filter((check) => !check.ok).map((check) => ({
      id: check.id,
      detail: check.detail,
      action: readinessAction(check.id, sample)
    })),
    ...sampleSpecific.blockers
  ]);

  return {
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus,
      sceneHints: sample.unityScenes
    },
    unityVersion: await readUnityVersion(root),
    readyForUnityValidation: blockers.length === 0 && buildSettingsHints.matchingEnabledScenes.length > 0 && buildSettingsHints.firstEnabledSceneMatches,
    easyarSignals,
    ignoredGeneratedSignals,
    sceneCandidates: sampleScenes.slice(0, maxCandidates),
    matchingScenes,
    buildSettingsHints,
    sampleSpecific,
    blockers,
    nextActions: blockers.length > 0
      ? Array.from(new Set(blockers.map((blocker) => blocker.action)))
      : buildSettingsHints.matchingEnabledScenes.length === 0
        ? ["Run easyar_create_build_settings_helper and easyar_run_unity_method with EasyAR.EditorTools.EasyARBuildSettingsHelper.ConfigureBuildSettings."]
        : buildSettingsHints.firstEnabledSceneMatches
          ? ["Run easyar_run_unity_method with EasyAR.EditorTools.EasyARSampleValidationHelper.ValidateFocusedSample."]
          : ["Run EasyARBuildSettingsHelper.ConfigureBuildSettings again so the focused sample scene is first in Build Settings."],
    security: "Secret values are not returned. Cloud Recognition audit only reports credential presence and placeholder status."
  };
}

export function uniqueBlockers<T extends { id: string }>(blockers: T[]): T[] {
  const seen = new Set<string>();
  return blockers.filter((blocker) => {
    if (seen.has(blocker.id)) {
      return false;
    }
    seen.add(blocker.id);
    return true;
  });
}

export function filterOfficialEasyARSignals(paths: string[]): string[] {
  return paths.filter((candidatePath) => {
    if (/^Assets[\/\\]EasyARGenerated(?:\.meta|[\/\\])/i.test(candidatePath)) {
      return false;
    }
    if (/^Assets[\/\\]Editor[\/\\]EasyAR.*\.(?:cs|cs\.meta)$/i.test(candidatePath)) {
      return false;
    }
    return true;
  });
}

export async function matchSampleScenes(root: string, sample: SampleInfo, scenePaths: string[]): Promise<string[]> {
  const matches: string[] = [];
  for (const scenePath of scenePaths) {
    if (sample.unityScenes.some((hint) => scenePath.toLowerCase().includes(hint.toLowerCase()))) {
      matches.push(scenePath);
      continue;
    }
    if (await sceneContentMatchesSample(root, sample, scenePath)) {
      matches.push(scenePath);
    }
  }
  return matches;
}

export async function sceneContentMatchesSample(root: string, sample: SampleInfo, scenePath: string): Promise<boolean> {
  const absolutePath = path.join(root, scenePath);
  if (!absolutePath.startsWith(root + path.sep) || !await exists(absolutePath)) {
    return false;
  }
  let text = "";
  try {
    text = await readFile(absolutePath, "utf8");
  } catch {
    return false;
  }
  if (sample.id === "image-tracking") {
    return /ImageTracking|ImageTarget|ImageTracker|TargetDataFileSource/i.test(text);
  }
  if (sample.id === "cloud-recognition") {
    return /CloudRecognition|CloudRecognizer|CloudRecogniz/i.test(text);
  }
  return false;
}

export async function findPackageCacheSamplePaths(root: string, sample: SampleInfo, limit: number): Promise<string[]> {
  const packageCacheRoot = path.join(root, "Library", "PackageCache");
  if (!await exists(packageCacheRoot)) {
    return [];
  }
  const found: string[] = [];
  await walkPackageCacheSamples(root, packageCacheRoot, sample, found, limit, 5);
  return found;
}

export async function walkPackageCacheSamples(
  root: string,
  dirPath: string,
  sample: SampleInfo,
  found: string[],
  limit: number,
  depth: number
): Promise<void> {
  if (found.length >= limit || depth < 0) {
    return;
  }
  let entries;
  try {
    entries = await readdir(dirPath, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (found.length >= limit) {
      return;
    }
    const fullPath = path.join(dirPath, entry.name);
    if (!entry.isDirectory()) {
      continue;
    }
    const relativePath = path.relative(root, fullPath);
    if (relativePath.includes(`Samples~${path.sep}`) && packageCacheSamplePathMatches(sample, relativePath)) {
      found.push(relativePath);
      continue;
    }
    await walkPackageCacheSamples(root, fullPath, sample, found, limit, depth - 1);
  }
}

export function packageCacheSamplePathMatches(sample: SampleInfo, relativePath: string): boolean {
  const normalized = relativePath.toLowerCase();
  return sample.unityScenes.some((hint) => normalized.includes(hint.toLowerCase()))
    || (sample.id === "cloud-recognition" && normalized.includes("cloudrecognition"))
    || (sample.id === "image-tracking" && normalized.includes("imagetracking"))
    || (sample.id === "mega" && (normalized.includes("mega") || normalized.includes("cloudlocalizer") || normalized.includes("megablock")));
}

export function readinessAction(checkId: string, sample: SampleInfo): string {
  if (checkId === "sample-focus") {
    return "Use sampleId \"image-tracking\", \"cloud-recognition\", or \"mega\" for the current run-through work.";
  }
  if (checkId === "unity-project") {
    return "Open or create a Unity project before running EasyAR sample tools.";
  }
  if (checkId === "packages-manifest") {
    return "Open the project once in Unity so Packages/manifest.json is created.";
  }
  if (checkId === "easyar-assets") {
    return "Import the official EasyAR Unity Plugin package from the EasyAR download page.";
  }
  if (checkId === "sample-scene") {
    return `Import the official ${sample.name} sample scene, then rerun easyar_check_sample_readiness.`;
  }
  if (checkId === "local-config-template" || checkId === "sample-runner" || checkId === "build-settings-helper" || checkId === "mobile-settings-helper" || checkId === "sample-validation-helper") {
    return `Run easyar_prepare_unity_project with sampleId "${sample.id}".`;
  }
  if (checkId === "focused-sample-runbook") {
    return `Run easyar_prepare_unity_project with sampleId "${sample.id}" to generate the focused sample runbook.`;
  }
  if (checkId === "local-config") {
    return "Copy ProjectSettings/EasyAR/easyar.local.json.example to easyar.local.json and fill it with official local credentials.";
  }
  if (checkId === "image-target-assets") {
    return "Import or create Image Tracking target assets/images before running the Image Tracking sample. For the official sample, also import Samples~/StreamingAssets/ImageTargets/ImageTargets.unitypackage so Assets/StreamingAssets/EasyARSamples/ImageTargets contains the required .etd/.jpg files.";
  }
  if (checkId === "cloud-recognition-credentials") {
    return "Fill easyar.cloudRecognition.appId and apiKey in ProjectSettings/EasyAR/easyar.local.json. Legacy appKey/appSecret fields are still accepted.";
  }
  if (checkId === "mega-assets") {
    return "Import the official EasyAR Sense Unity Plugin for Mega and load the selected Mega Block before running the Mega sample.";
  }
  return "Review the EasyAR Unity checklist and rerun readiness checks.";
}

export async function findImageTrackingTargetAssets(root: string, limit: number): Promise<string[]> {
  const candidates = await findFiles(root, ["Assets"], /\.(?:jpg|jpeg|png|json|xml|etd)$/i, limit * 3);
  return candidates
    .filter((candidatePath) => {
      const normalized = candidatePath.replace(/\\/g, "/");
      return /(?:^|\/)(?:ImageTargets?|Targets?)(?:\/|$)/i.test(normalized)
        || /(?:imagetarget|image-target|target)/i.test(normalized)
        || /^Assets\/StreamingAssets\/EasyARSamples\/ImageTargets\//i.test(normalized);
    })
    .slice(0, limit);
}

export async function findImageTargetsStreamingPackageCandidates(root: string, limit: number): Promise<string[]> {
  const candidates = await findFiles(root, ["Library/PackageCache"], /ImageTargets\.unitypackage$/i, limit * 2);
  return candidates
    .filter((candidatePath) => candidatePath.replace(/\\/g, "/").includes("/Samples~/StreamingAssets/ImageTargets/"))
    .slice(0, limit);
}

export async function hasOfficialImageTargetsStreamingAssets(root: string): Promise<boolean> {
  const requiredPaths = [
    path.join(root, "Assets", "StreamingAssets", "EasyARSamples", "ImageTargets", "namecard.jpg"),
    path.join(root, "Assets", "StreamingAssets", "EasyARSamples", "ImageTargets", "namecard.etd"),
    path.join(root, "Assets", "StreamingAssets", "EasyARSamples", "ImageTargets", "idback.etd")
  ];
  for (const requiredPath of requiredPaths) {
    if (!await exists(requiredPath)) {
      return false;
    }
  }
  return true;
}

export async function findMegaAssetHints(root: string, limit: number): Promise<string[]> {
  const candidates = await findFiles(root, ["Assets", "Packages"], /(?:mega|megablock|cloudlocalizer|tiantanskypalace)/i, limit * 3);
  return candidates
    .filter((candidatePath) => !candidatePath.replace(/\\/g, "/").startsWith("Assets/EasyARGenerated/"))
    .slice(0, limit);
}

export async function readMegaSettingsSummary(root: string) {
  const settingsPath = path.join(root, "Assets", "XR", "Settings", "EasyAR Settings.asset");
  if (!await exists(settingsPath)) {
    return {
      exists: false,
      relativePath: "Assets/XR/Settings/EasyAR Settings.asset",
      licensePresent: false,
      appIdPresent: false,
      serverAddressPresent: false,
      apiKeyPresent: false,
      apiSecretPresent: false
    };
  }

  const text = await readFile(settingsPath, "utf8");
  const block = text.match(/GlobalMegaBlockLocalizationServiceConfig:\s*\n([\s\S]*?)(?:\n  GlobalMegaLandmarkLocalizationServiceConfig:|\n  GlobalSpatialMapServiceConfig:|\n  GlobalCloudRecognizerServiceConfig:|\n  [A-Za-z].*:|$)/)?.[1] ?? "";
  return {
    exists: true,
    relativePath: path.relative(root, settingsPath),
    licensePresent: hasYamlScalar(text, "LicenseKey"),
    appIdPresent: hasYamlScalar(block, "AppID"),
    serverAddressPresent: hasYamlScalar(block, "ServerAddress"),
    apiKeyPresent: hasYamlScalar(block, "APIKey"),
    apiSecretPresent: hasYamlScalar(block, "APISecret")
  };
}

export async function readMegaLocationInputModeSummary(root: string) {
  const sceneCandidates = await findFiles(root, ["Assets"], /(?:mega|megablock|cloudlocalizer).*\.unity$/i, 40);
  const modes: Array<{ path: string; mode: "Onsite" | "Simulator" | "FramePlayer" | "Unknown"; raw: number }> = [];
  for (const scene of sceneCandidates) {
    const text = await readFile(path.join(root, scene), "utf8");
    for (const match of text.matchAll(/locationInputMode:\s*(\d+)/g)) {
      const raw = Number(match[1]);
      modes.push({
        path: scene,
        raw,
        mode: raw === 0 ? "Onsite" : raw === 1 ? "Simulator" : raw === 2 ? "FramePlayer" : "Unknown"
      });
    }
  }
  return {
    sceneCount: sceneCandidates.length,
    modes,
    hasOnsite: modes.some((item) => item.mode === "Onsite"),
    hasSimulator: modes.some((item) => item.mode === "Simulator")
  };
}

export async function hasPicoHeadsetMegaSignals(root: string): Promise<boolean> {
  const hints = await findFiles(root, ["Assets", "Packages"], /(?:pico|picoxr|PXR|PicoFrameSource|com\.easyar\.sense\.ext\.pico|com\.unity\.xr\.picoxr)/i, 60);
  if (hints.length > 0) { return true; }
  const manifestPath = path.join(root, "Packages", "manifest.json");
  if (!await exists(manifestPath)) { return false; }
  const manifest = await readFile(manifestPath, "utf8");
  return /com\.unity\.xr\.picoxr|com\.easyar\.sense\.ext\.pico/i.test(manifest);
}

export async function readMegaBlockRootSummary(root: string) {
  const sceneCandidates = await findFiles(root, ["Assets"], /(?:mega|megablock|cloudlocalizer).*\.unity$/i, 40);
  const holders: Array<{ path: string; source: "External" | "Internal" | "Mixed" | "Unknown"; rawSource: number; hasBlockRoot: boolean }> = [];
  for (const scene of sceneCandidates) {
    const text = await readFile(path.join(root, scene), "utf8");
    const holderPattern = /BlockRootSource:\s*(\d+)[\s\S]*?blockRoot:\s*\{fileID:\s*([^}\s]+)[^}]*\}/g;
    for (const match of text.matchAll(holderPattern)) {
      const rawSource = Number(match[1]);
      const fileId = match[2] ?? "0";
      holders.push({
        path: scene,
        rawSource,
        source: rawSource === 0 ? "External" : rawSource === 1 ? "Internal" : rawSource === 2 ? "Mixed" : "Unknown",
        hasBlockRoot: fileId !== "0"
      });
    }
  }
  const blockers = holders.filter((item) => item.source === "External" && !item.hasBlockRoot);
  return {
    sceneCount: sceneCandidates.length,
    holders,
    ok: holders.length === 0 || blockers.length === 0,
    blockers
  };
}

export function hasYamlScalar(text: string, key: string): boolean {
  const match = new RegExp(`^\\s*${key}:\\s*(.*)$`, "m").exec(text);
  return isNonPlaceholderString(match?.[1] ?? "");
}

export function focusedSampleGeneratedDir(root: string, sample: SampleInfo): string {
  return path.join(root, "Assets", "EasyARGenerated", sample.id);
}

export function focusedSampleRunbookPath(root: string, sample: SampleInfo): string {
  return path.join(focusedSampleGeneratedDir(root, sample), "RUNBOOK.md");
}

export async function buildSampleSpecificReadinessChecks(root: string, sample: SampleInfo) {
  if (sample.id === "image-tracking") {
    const targetAssets = await findImageTrackingTargetAssets(root, 80);
    const streamingPackageCandidates = await findImageTargetsStreamingPackageCandidates(root, 20);
    const streamingAssetsImported = await hasOfficialImageTargetsStreamingAssets(root);
    return [
      {
        id: "image-target-assets",
        ok: targetAssets.length > 0,
        detail: targetAssets.length > 0
          ? `Found possible image target asset(s): ${targetAssets.slice(0, 8).join(", ")}.`
          : "No image target asset hints were found under Assets. Import the official Image Tracking sample assets or add target images."
      },
      {
        id: "image-target-streaming-assets",
        ok: streamingAssetsImported,
        detail: streamingAssetsImported
          ? "Official Image Tracking StreamingAssets target files are imported under Assets/StreamingAssets/EasyARSamples/ImageTargets."
          : streamingPackageCandidates.length > 0
            ? `Official ImageTargets StreamingAssets package candidate(s): ${streamingPackageCandidates.join(", ")}. Import ImageTargets.unitypackage before building the official Image Tracking sample.`
            : "Official ImageTargets StreamingAssets package was not found in local PackageCache. Open/import the EasyAR Sense Unity Plugin package samples first."
      }
    ];
  }

  if (sample.id === "cloud-recognition") {
    const cloudConfig = await readCloudRecognitionConfig(root);
    return [
      {
        id: "cloud-recognition-credentials",
        ok: hasCompleteCloudRecognitionConfig(cloudConfig),
        detail: hasCompleteCloudRecognitionConfig(cloudConfig)
          ? cloudRecognitionCredentialMode(cloudConfig) === "appId-apiKey"
            ? "Cloud recognition appId, serverAddress, apiKey, and apiSecret are configured in local config."
            : "Cloud recognition legacy appId, serverAddress, and appSecret are configured in local config."
          : "Cloud recognition credentials are incomplete or missing in ProjectSettings/EasyAR/easyar.local.json."
      }
    ];
  }

  if (sample.id === "mega") {
    const megaHints = await findMegaAssetHints(root, 80);
    const megaSettings = await readMegaSettingsSummary(root);
    const megaLocationInputMode = await readMegaLocationInputModeSummary(root);
    const megaBlockRoot = await readMegaBlockRootSummary(root);
    const locationInputModeOk = megaLocationInputMode.hasOnsite;
    const missingMegaSettings = [
      megaSettings.licensePresent ? null : "license",
      megaSettings.appIdPresent ? null : "GlobalMegaBlock.AppID",
      megaSettings.serverAddressPresent ? null : "GlobalMegaBlock.ServerAddress",
      megaSettings.apiKeyPresent ? null : "GlobalMegaBlock.APIKey",
      megaSettings.apiSecretPresent ? null : "GlobalMegaBlock.APISecret"
    ].filter((item): item is string => item !== null);
    return [
      {
        id: "mega-assets",
        ok: megaHints.length > 0,
        detail: megaHints.length > 0
          ? `Found Mega asset hint(s): ${megaHints.slice(0, 8).join(", ")}.`
          : "No Mega, MegaBlock, CloudLocalizer, or TiantanSkyPalace asset hints were found under Assets or Packages."
      },
      {
        id: "mega-settings",
        ok: megaSettings.exists && missingMegaSettings.length === 0,
        detail: megaSettings.exists
          ? missingMegaSettings.length === 0
            ? `Local EasyAR Settings contain package license and Global Mega Block credential presence at ${megaSettings.relativePath}. Secret values were not read or printed.`
            : `Local EasyAR Settings exist at ${megaSettings.relativePath}, but missing configured presence for: ${missingMegaSettings.join(", ")}.`
          : "Assets/XR/Settings/EasyAR Settings.asset was not found. Create EasyAR Settings and fill local package license plus Global Mega Block AppID/server/API Key/API Secret."
      },
      {
        id: "mega-location-input-mode",
        ok: locationInputModeOk,
        detail: megaLocationInputMode.modes.length > 0
          ? megaLocationInputMode.hasOnsite
            ? `Mega scene LocationInputMode includes Onsite: ${megaLocationInputMode.modes.map((item) => `${item.path}=${item.mode}`).join(", ")}.`
            : `Mega scene LocationInputMode was found but not Onsite: ${megaLocationInputMode.modes.map((item) => `${item.path}=${item.mode}`).join(", ")}. Use Onsite for real-device validation. Use Simulator only for editor or non-acceptance debugging.`
          : "No serialized Mega locationInputMode was found in Mega scene assets. Open the Mega sample scene and set Location Input Mode to Onsite for real-device validation."
      },
      {
        id: "mega-block-root",
        ok: megaBlockRoot.ok,
        detail: megaBlockRoot.holders.length > 0
          ? megaBlockRoot.ok
            ? `Mega BlockHolder root config is usable: ${megaBlockRoot.holders.map((item) => `${item.path}=${item.source}${item.hasBlockRoot ? "+root" : ""}`).join(", ")}.`
            : `Mega BlockHolder is External with empty blockRoot in: ${megaBlockRoot.blockers.map((item) => item.path).join(", ")}. Set BlockRootSource to Internal, Mixed, or assign a BlockRoot generated by Mega Studio; otherwise localization callback can break the session with "Block root not exist".`
          : "No serialized Mega BlockHolder BlockRootSource was found in Mega scene assets. Confirm the Mega scene has a BlockHolder and a usable BlockRoot before device validation."
      }
    ];
  }

  return [];
}

export async function readBuildSettingsSceneHints(root: string, sample: SampleInfo) {
  const target = path.join(root, "ProjectSettings", "EditorBuildSettings.asset");
  if (!await exists(target)) {
    return {
      fileExists: false,
      scenes: [],
      enabledScenes: [],
      matchingEnabledScenes: [],
      firstEnabledScene: null,
      firstEnabledSceneMatches: false
    };
  }

  const text = await readFile(target, "utf8");
  const scenes: Array<{ path: string; enabled: boolean }> = [];
  let currentEnabled = true;
  for (const line of text.split(/\r?\n/)) {
    const enabledMatch = /^\s*enabled:\s*(\d+)/.exec(line);
    if (enabledMatch) {
      currentEnabled = enabledMatch[1] !== "0";
      continue;
    }

    const pathMatch = /^\s*path:\s*(.+?)\s*$/.exec(line);
    if (pathMatch) {
      scenes.push({
        path: pathMatch[1].replace(/^"|"$/g, ""),
        enabled: currentEnabled
      });
      currentEnabled = true;
    }
  }

  const enabledScenes = scenes.filter((scene) => scene.enabled).map((scene) => scene.path);
  const matchingEnabledScenes = await matchSampleScenes(root, sample, enabledScenes);
  const firstEnabledScene = enabledScenes[0] ?? null;
  return {
    fileExists: true,
    scenes,
    enabledScenes,
    matchingEnabledScenes,
    firstEnabledScene,
    firstEnabledSceneMatches: firstEnabledScene ? matchingEnabledScenes.includes(firstEnabledScene) : false
  };
}

export async function buildSampleSceneAuditSpecifics(root: string, sample: SampleInfo, maxCandidates: number) {
  if (sample.id === "image-tracking") {
    const targetAssets = await findImageTrackingTargetAssets(root, maxCandidates);
    return {
      kind: "image-tracking",
      targetAssets,
      cloudConfig: null,
      blockers: targetAssets.length > 0
        ? []
        : [
            {
              id: "image-target-assets",
              detail: "No Image Tracking target asset candidates were found.",
              action: readinessAction("image-target-assets", sample)
            }
          ]
    };
  }

  if (sample.id === "cloud-recognition") {
    const configReport = await buildLocalConfigValidationReport(root);
    const cloudCheck = configReport.checks.find((check) => check.id === "cloud-recognition");
    const config = await readCloudRecognitionConfig(root);
    const presence = {
      appId: isNonPlaceholderString(config.appId),
      apiKey: isNonPlaceholderString(config.apiKey),
      apiSecret: isNonPlaceholderString(config.apiSecret),
      appKey: isNonPlaceholderString(config.appKey),
      appSecret: isNonPlaceholderString(config.appSecret)
    };
    return {
      kind: "cloud-recognition",
      targetAssets: [],
      cloudConfig: {
        valid: Boolean(cloudCheck?.ok),
        presence,
        detail: cloudCheck?.detail ?? "Cloud Recognition config was not found."
      },
      blockers: cloudCheck?.ok
        ? []
        : [
            {
              id: "cloud-recognition-credentials",
              detail: cloudCheck?.detail ?? "Cloud recognition credentials are incomplete or missing.",
              action: readinessAction("cloud-recognition-credentials", sample)
            }
          ]
    };
  }

  return {
    kind: "deferred",
    targetAssets: [],
    cloudConfig: null,
    blockers: [
      {
        id: "sample-deferred",
        detail: `${sample.name} is outside the current focused sample run-through scope.`,
        action: readinessAction("sample-focus", sample)
      }
    ]
  };
}
