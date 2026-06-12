import { readFile } from "node:fs/promises";
import path from "node:path";
import type { SampleInfo } from "./samples.js";
import { buildSampleReadinessReport, exists, findFiles } from "./tool-services.js";
import { assertInside, extractMethodBody, findLineNumber, firstMatchingLine, escapeRegExp } from "./tool-file-utils.js";
import { buildLocalConfigValidationReport } from "./tool-local-config.js";

export type UnityLogRule = {
  id: string;
  severity: "high" | "medium" | "low";
  pattern: RegExp;
  title: string;
  actions: string[];
};

export function analyzeUnityLog(logText: string, sample: SampleInfo | null = null) {
  const rules: UnityLogRule[] = [
    {
      id: "easyar-license",
      severity: "high",
      pattern: /easyar[\s\S]{0,120}(license|key|credential|authorize|authorization|unauthorized|invalid)/i,
      title: "EasyAR license or credential problem",
      actions: [
        "Run easyar_auth_status and confirm account environment variables are configured.",
        "Check ProjectSettings/EasyAR/easyar.local.json for the official EasyAR license key and cloud credentials.",
        "Verify the app bundle/package identifier matches the license configuration in the EasyAR account."
      ]
    },
    {
      id: "camera-permission",
      severity: "high",
      pattern: /\b(camera|webcam)\b[\s\S]{0,120}\b(permission\s+(denied|missing|disabled)|denied|not authorized|unauthorized)\b|\bpermission\b[\s\S]{0,120}\b(denied|missing|disabled|not authorized|unauthorized)\b[\s\S]{0,120}\b(camera|webcam)\b/i,
      title: "Camera permission problem",
      actions: [
        "Enable camera permission in Android Player Settings or iOS Info.plist.",
        "Build to a real device and grant camera permission when prompted.",
        "Confirm the target sample requires camera access before testing in Editor."
      ]
    },
    {
      id: "missing-easyar-plugin",
      severity: "high",
      pattern: /(namespace|type).{0,80}EasyAR.{0,80}(does not exist|could not be found)|EasyAR.{0,80}(assembly|plugin).{0,80}(missing|not found)/i,
      title: "EasyAR Unity plugin is missing or not imported correctly",
      actions: [
        "Import the official EasyAR Unity Plugin package from the EasyAR download page.",
        "Run easyar_check_sample_readiness after import to verify EasyAR assets are visible.",
        "Reopen Unity so assemblies and imported packages are recompiled."
      ]
    },
    {
      id: "compile-error",
      severity: "high",
      pattern: /\b(CS\d{4}|Compilation failed|compiler error|Script compilation failed)\b/i,
      title: "Unity C# compilation error",
      actions: [
        "Fix the first C# compiler error before investigating runtime EasyAR behavior.",
        "Use easyar_write_csharp_file or easyar_create_mono_behaviour to patch scripts in the Unity project.",
        "Re-run Unity compilation after each focused fix."
      ]
    },
    {
      id: "android-gradle",
      severity: "medium",
      pattern: /(gradle|android).{0,200}(failed|failure|exception|error|could not|unable|manifest merger|minSdk|targetSdk|duplicate class)|\b(GradleInvokationException|FAILURE:\s*Build failed|Execution failed for task|Could not download)\b/i,
      title: "Android/Gradle build problem",
      actions: [
        "Check Android SDK, Gradle, minSdkVersion, targetSdkVersion, and manifest permissions.",
        "Confirm Unity Android Build Support is installed for the selected Unity version.",
        "Run the generated Build Settings helper with platform=android before building."
      ]
    },
    {
      id: "ios-signing",
      severity: "medium",
      pattern: /(xcode|ios|codesign|provisioning|development team|bundle identifier).{0,160}(failed|error|missing|invalid)/i,
      title: "iOS signing or Xcode build problem",
      actions: [
        "Check bundle identifier, signing team, provisioning profile, and camera usage description.",
        "Run the generated Build Settings helper with platform=ios before exporting.",
        "Open the generated Xcode project and inspect signing errors."
      ]
    },
    {
      id: "scene-missing",
      severity: "medium",
      pattern: /(scene|build settings).{0,160}(missing|not found|not.*enabled|could not be loaded)/i,
      title: "Sample scene is missing from Build Settings or cannot be loaded",
      actions: [
        "Run easyar_create_build_settings_helper for the selected sample.",
        "Run easyar_run_unity_method with EasyAR.EditorTools.EasyARBuildSettingsHelper.ConfigureBuildSettings.",
        "Run easyar_check_sample_readiness and confirm matchingScenes is not empty."
      ]
    }
  ];
  rules.push(...sampleSpecificLogRules(sample));

  const lines = logText.split(/\r?\n/);
  return rules
    .filter((rule) => rule.pattern.test(logText))
    .map((rule) => ({
      id: rule.id,
      severity: rule.severity,
      title: rule.title,
      evidence: findEvidence(lines, rule.pattern),
      actions: rule.actions
    }));
}

export function sampleSpecificLogRules(sample: SampleInfo | null): UnityLogRule[] {
  if (!sample) {
    return [];
  }

  if (sample.id === "image-tracking") {
    return [
      {
        id: "image-tracking-target-load",
        severity: "high",
        pattern: /(image\s*target|imagetarget|target\s*(database|asset|image|file|data)).{0,160}(not\s*found|missing|load(ed)?\s*failed|cannot\s*load|invalid|empty)/i,
        title: "Image Tracking target asset cannot be loaded",
        actions: [
          "Check Assets/EasyARGenerated/image-tracking/RUNBOOK.md.",
          "Add official Image Tracking target images, target JSON/XML files, `.etd` files, or imported target assets under Assets.",
          "Run easyar_check_sample_readiness with sampleId=image-tracking and confirm image-target-assets passes."
        ]
      },
      {
        id: "image-tracking-no-detection",
        severity: "medium",
        pattern: /(image\s*target|imagetarget|tracker|tracking).{0,160}(not\s*detected|lost|timeout|no\s*target|cannot\s*recognize)/i,
        title: "Image Tracking target is not being detected",
        actions: [
          "Verify target physical size and target database/import settings in the official EasyAR workflow.",
          "Test on a real device with stable lighting and a clear printed or screen-displayed target.",
          "Confirm the Image Tracking sample scene is the active scene in Build Settings."
        ]
      }
    ];
  }

  if (sample.id === "cloud-recognition") {
    return [
      {
        id: "cloud-recognition-credentials",
        severity: "high",
        pattern: /(cloud\s*recognition|cloudrecognizer|cloud).{0,180}(appId|appKey|appSecret|credential|secret|key|unauthorized|forbidden|invalid|missing)/i,
        title: "Cloud Recognition credentials are invalid or missing",
        actions: [
          "Fill easyar.cloudRecognition.appId and apiKey in ProjectSettings/EasyAR/easyar.local.json. Legacy appKey/appSecret is also accepted.",
          "Run easyar_check_sample_readiness with sampleId=cloud-recognition and confirm cloud-recognition-credentials passes.",
          "Verify the credentials and target library in the official EasyAR account."
        ]
      },
      {
        id: "cloud-recognition-network",
        severity: "medium",
        pattern: /(cloud\s*recognition|cloudrecognizer|cloud).{0,180}(network|timeout|dns|http|ssl|tls|connection|service unavailable|gateway)/i,
        title: "Cloud Recognition network or service request failed",
        actions: [
          "Confirm the device has network access and platform Internet permission.",
          "Verify the EasyAR cloud recognition service endpoint/region configured by the official sample.",
          "Retry on a real device network and inspect device logs for HTTP status details."
        ]
      }
    ];
  }

  if (sample.id === "mega") {
    return [
      {
        id: "mega-block-config",
        severity: "high",
        pattern: /(mega|mega\s*block|block|cloud\s*locali[sz]ation|cloudlocalizer).{0,180}(not\s*found|missing|invalid|load(ed)?\s*failed|cannot\s*load|unauthorized|forbidden)/i,
        title: "Mega Block or cloud localization configuration cannot be loaded",
        actions: [
          "Use the logged-in EasyAR website or Mega Studio session to confirm the cloud localization library and Mega Block identifiers.",
          "Load or bind the selected Mega Block in Unity before building the APK.",
          "Run easyar_check_sample_readiness with sampleId=mega and confirm mega-assets passes."
        ]
      },
      {
        id: "mega-hybridclr",
        severity: "high",
        pattern: /(hybridclr|aot|hot\s*update).{0,180}(error|missing|generate|install|metadata|dll|failed|exception)/i,
        title: "HybridCLR generated files are missing or stale for the Mega Android build",
        actions: [
          "Run the HybridCLR installer if the package has not been installed for this Unity project.",
          "Run HybridCLR/Generate/All for the same Android target before building.",
          "Rebuild after switching Unity PlayerSettings to the final Android architecture and scripting backend."
        ]
      },
      {
        id: "mega-arcore-manifest",
        severity: "high",
        pattern: /(arcore|androidmanifest|minSdkVersion|onnxruntime|uses-feature|uses-permission).{0,220}(error|conflict|cannot|failed|smaller|replace|required|missing)/i,
        title: "Android manifest, ARCore, or minSdk configuration blocks the Mega APK",
        actions: [
          "Check AndroidManifest.xml for ARCore metadata conflicts and tools:replace when required.",
          "Set Android minSdkVersion high enough for imported Mega dependencies such as ONNX Runtime.",
          "Confirm camera, location, Internet, and ARCore-related Android settings before rebuilding."
        ]
      },
      {
        id: "mega-localization-runtime",
        severity: "medium",
        pattern: /(mega|locali[sz]ation|cloudlocalizer|cloud\s*locali[sz]ation).{0,180}(lost|timeout|failed|not\s*localized|no\s*pose|tracking\s*lost)/i,
        title: "Mega localization did not succeed on device",
        actions: [
          "Test in the physical environment represented by the selected Mega Block.",
          "Confirm the device has camera, location, and network permissions enabled.",
          "Record device logs and run easyar_write_device_run_result_form after the real-device attempt."
        ]
      }
    ];
  }

  return [
    {
      id: "sample-deferred",
      severity: "low",
      pattern: /easyar|sample|tracking|cloud|camera/i,
      title: "Sample is outside the current focused run-through scope",
      actions: [
        "Current focused run-through work covers image-tracking, cloud-recognition, and mega.",
        `Switch to a focused sample before expecting sample-specific diagnostics for ${sample.id}.`
      ]
    }
  ];
}

export function findEvidence(lines: string[], pattern: RegExp): string[] {
  return lines
    .filter((line) => pattern.test(line))
    .slice(0, 3)
    .map((line) => line.trim().slice(0, 500));
}

export type ScriptReviewIssue = {
  id: string;
  severity: "high" | "medium" | "low";
  file: string;
  line: number | null;
  title: string;
  evidence: string | null;
  recommendation: string;
};

export function reviewCsharpScript(relativePath: string, text: string): ScriptReviewIssue[] {
  const issues: ScriptReviewIssue[] = [];
  const lines = text.split(/\r?\n/);
  const addIssue = (
    id: string,
    severity: ScriptReviewIssue["severity"],
    line: number | null,
    title: string,
    evidence: string | null,
    recommendation: string
  ) => {
    issues.push({
      id,
      severity,
      file: relativePath,
      line,
      title,
      evidence: evidence?.trim().slice(0, 500) ?? null,
      recommendation
    });
  };

  const usingEasyAR = /\busing\s+EasyAR\b|EasyAR\./.test(text);
  const isMonoBehaviour = /:\s*MonoBehaviour\b/.test(text);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    if (/(license\w*|appSecret|appKey|accountToken)\s*=\s*"[^"]{8,}"/i.test(line)) {
      addIssue(
        "hardcoded-easyar-secret",
        "high",
        lineNumber,
        "Possible EasyAR secret is hardcoded in a C# script",
        line,
        "Move license keys, cloud recognition credentials, and account tokens into local config or secret injection."
      );
    }

    if (/\basync\s+void\b/.test(line) && !/\b(async\s+void\s+(Start|Awake|OnEnable|OnDisable|Update|FixedUpdate|LateUpdate)\s*\()/.test(line)) {
      addIssue(
        "async-void",
        "medium",
        lineNumber,
        "async void method can hide exceptions",
        line,
        "Use Task-returning methods for internal async work and surface failures through Unity logs."
      );
    }
  });

  const updateBody = extractMethodBody(text, "Update");
  if (updateBody && /\b(GameObject\.Find|FindObjectOfType|FindObjectsOfType|Resources\.Load)\s*\(/.test(updateBody)) {
    addIssue(
      "expensive-update-lookup",
      "medium",
      findLineNumber(lines, /\bvoid\s+Update\s*\(/),
      "Update performs expensive scene or resource lookups",
      firstMatchingLine(updateBody, /\b(GameObject\.Find|FindObjectOfType|FindObjectsOfType|Resources\.Load)\s*\(/),
      "Cache references in Awake/Start or assign them with [SerializeField] before running AR tracking loops."
    );
  }

  if (isMonoBehaviour && /\bStartCoroutine\s*\(/.test(text) && !/\bStopCoroutine\s*\(|\bStopAllCoroutines\s*\(/.test(text)) {
    addIssue(
      "coroutine-not-stopped",
      "low",
      findLineNumber(lines, /\bStartCoroutine\s*\(/),
      "Coroutine is started without an obvious stop path",
      firstMatchingLine(text, /\bStartCoroutine\s*\(/),
      "Stop long-running coroutines in OnDisable/OnDestroy so AR session transitions do not leak work."
    );
  }

  if (isMonoBehaviour && /\bInvokeRepeating\s*\(/.test(text) && !/\bCancelInvoke\s*\(/.test(text)) {
    addIssue(
      "invoke-not-cancelled",
      "low",
      findLineNumber(lines, /\bInvokeRepeating\s*\(/),
      "InvokeRepeating is used without CancelInvoke",
      firstMatchingLine(text, /\bInvokeRepeating\s*\(/),
      "Call CancelInvoke in OnDisable/OnDestroy for predictable sample teardown."
    );
  }

  if (isMonoBehaviour && /\[SerializeField\]\s+private\s+[\w<>\[\].]+\s+(\w+)\s*;/.test(text)) {
    const serializedFields = Array.from(text.matchAll(/\[SerializeField\]\s+private\s+[\w<>\[\].]+\s+(\w+)\s*;/g)).map((match) => match[1]);
    for (const field of serializedFields) {
      const fieldUsePattern = new RegExp(`\\b${escapeRegExp(field)}\\s*!=\\s*null|\\b${escapeRegExp(field)}\\s*==\\s*null`);
      if (!fieldUsePattern.test(text)) {
        addIssue(
          "serialized-field-no-null-check",
          "low",
          findLineNumber(lines, new RegExp(`\\b${escapeRegExp(field)}\\b`)),
          "Serialized field has no obvious null guard",
          field,
          "Add a null check or validation log before using Inspector-assigned AR references."
        );
      }
    }
  }

  if (usingEasyAR && !/try\s*\{|catch\s*\(|Debug\.Log(Error|Warning)?\s*\(/.test(text)) {
    addIssue(
      "easyar-code-no-diagnostics",
      "low",
      null,
      "EasyAR-related script has little diagnostic logging",
      null,
      "Add focused Debug.LogWarning/Debug.LogError messages around EasyAR initialization, target events, and credential-dependent paths."
    );
  }

  if (/\bInput\.touchCount\b/.test(text) && !/\bInput\.GetTouch\s*\(\s*0\s*\)\.phase\b/.test(text)) {
    addIssue(
      "touch-without-phase-check",
      "medium",
      findLineNumber(lines, /\bInput\.touchCount\b/),
      "Touch input is read without an obvious phase check",
      firstMatchingLine(text, /\bInput\.touchCount\b/),
      "Gate placement logic on TouchPhase.Began or a deliberate gesture phase to avoid repeated placement every frame."
    );
  }

  return issues;
}

export async function buildScriptReviewReport(root: string, relativePaths: string[] | undefined, maxFiles: number, maxIssues: number) {
  const files = relativePaths && relativePaths.length > 0
    ? relativePaths.map((relativePath) => {
        const target = path.resolve(root, relativePath);
        assertInside(root, target);
        if (!target.endsWith(".cs")) {
          throw new Error("easyar_review_csharp_scripts only reviews .cs files.");
        }
        return target;
      })
    : (await findFiles(root, ["Assets"], /\.cs$/i, maxFiles)).map((relativePath) => path.join(root, relativePath));

  const reviewed: string[] = [];
  const issues: ScriptReviewIssue[] = [];
  for (const filePath of files.slice(0, maxFiles)) {
    if (!await exists(filePath)) {
      issues.push({
        id: "script-missing",
        severity: "high",
        file: path.relative(root, filePath),
        line: null,
        title: "Script file does not exist",
        evidence: null,
        recommendation: "Check the relativePaths input and rerun the review."
      });
      continue;
    }

    const text = await readFile(filePath, "utf8");
    reviewed.push(path.relative(root, filePath));
    issues.push(...reviewCsharpScript(path.relative(root, filePath), text));
    if (issues.length >= maxIssues) {
      break;
    }
  }

  const limitedIssues = issues.slice(0, maxIssues);
  return {
    projectPath: root,
    reviewedFiles: reviewed,
    reviewedFileCount: reviewed.length,
    issueCount: limitedIssues.length,
    issues: limitedIssues,
    nextActions: buildScriptReviewActions(limitedIssues),
    note: "This is a static review. Unity compilation and device testing remain the source of truth."
  };
}

export function buildScriptReviewActions(issues: ScriptReviewIssue[]): string[] {
  if (issues.length === 0) {
    return ["No static script review issues were detected. Run Unity compilation and device tests next."];
  }
  const actions = new Set<string>();
  if (issues.some((issue) => issue.id === "hardcoded-easyar-secret")) {
    actions.add("Move EasyAR secrets into ProjectSettings/EasyAR/easyar.local.json or environment-backed secret storage.");
  }
  if (issues.some((issue) => issue.severity === "high")) {
    actions.add("Fix high-severity script issues before running Unity batch builds.");
  }
  actions.add("Patch focused scripts with easyar_write_csharp_file, then run Unity compilation or easyar_analyze_unity_log.");
  return Array.from(actions);
}

export function chooseNextRunPhase(
  readiness: Awaited<ReturnType<typeof buildSampleReadinessReport>>,
  configValidation: Awaited<ReturnType<typeof buildLocalConfigValidationReport>>,
  scriptReview: Awaited<ReturnType<typeof buildScriptReviewReport>>
): string {
  if (!readiness.ready) {
    return "Fix readiness gaps before Unity batch automation.";
  }
  if (!configValidation.valid) {
    return "Fix local EasyAR config before building to device.";
  }
  if (scriptReview.issueCount > 0) {
    return "Fix static C# review issues before compiling in Unity.";
  }
  return "Run mobile settings, Build Settings, and device build helpers from easyar_generate_run_sequence.";
}
