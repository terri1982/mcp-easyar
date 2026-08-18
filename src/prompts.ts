import { z } from "zod";

function promptText(description: string, text: string) {
  return {
    description,
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text
        }
      }
    ]
  };
}

export function registerPrompts(server: any) {
  server.prompt(
    "easyar-run-image-tracking",
    "Guide Codex or Claude through the focused Image Tracking run-through.",
    {
      projectPath: z.string().describe("Unity project path."),
      platform: z.enum(["android", "ios"]).default("android")
    },
    ({ projectPath, platform }: any) => promptText(
      "Focused Image Tracking run-through",
      [
        `Use the mcp-easyar tools to run the Image Tracking sample for project: ${projectPath}`,
        `Target platform: ${platform}`,
        "",
        "Read `easyar://acceptance/fresh-project` first, then keep the run inside the current focused scope.",
        "",
        "Start by calling:",
        `1. easyar_write_account_onboarding projectPath=${projectPath} sampleId=image-tracking`,
        `2. easyar_write_account_materials projectPath=${projectPath} sampleId=image-tracking`,
        `3. easyar_write_unity_environment_report projectPath=${projectPath} sampleId=image-tracking`,
        `4. easyar_prepare_unity_project projectPath=${projectPath} sampleId=image-tracking`,
        `5. easyar_write_focused_preflight projectPath=${projectPath} sampleId=image-tracking platform=${platform}`,
        "",
        "Read PREFLIGHT.md and follow its nextCall before running Unity batch commands. Do not skip readiness failures. Image Tracking must have real target image/database assets before device validation.",
        `After preflight blockers are clear, call easyar_write_run_sequence projectPath=${projectPath} sampleId=image-tracking platform=${platform}.`,
        "If Unity batch fails, call easyar_analyze_latest_unity_log with sampleId=image-tracking."
      ].join("\n")
    )
  );
  
  server.prompt(
    "easyar-run-cloud-recognition",
    "Guide Codex or Claude through the focused Cloud Recognition run-through.",
    {
      projectPath: z.string().describe("Unity project path."),
      platform: z.enum(["android", "ios"]).default("android")
    },
    ({ projectPath, platform }: any) => promptText(
      "Focused Cloud Recognition run-through",
      [
        `Use the mcp-easyar tools to run the Cloud Recognition sample for project: ${projectPath}`,
        `Target platform: ${platform}`,
        "",
        "Read `easyar://acceptance/fresh-project` first, then keep the run inside the current focused scope.",
        "",
        "Start by calling:",
        `1. easyar_write_account_onboarding projectPath=${projectPath} sampleId=cloud-recognition`,
        `2. easyar_write_account_materials projectPath=${projectPath} sampleId=cloud-recognition`,
        `3. easyar_write_unity_environment_report projectPath=${projectPath} sampleId=cloud-recognition`,
        `4. easyar_prepare_unity_project projectPath=${projectPath} sampleId=cloud-recognition`,
        `5. easyar_write_focused_preflight projectPath=${projectPath} sampleId=cloud-recognition platform=${platform}`,
        "",
        "Read PREFLIGHT.md and follow its nextCall before running Unity batch commands. Do not continue to device validation until easyar.cloudRecognition.appId and apiKey are configured locally.",
        `After preflight blockers are clear, call easyar_write_run_sequence projectPath=${projectPath} sampleId=cloud-recognition platform=${platform}.`,
        "If Unity batch or device validation fails, call easyar_analyze_latest_unity_log with sampleId=cloud-recognition."
      ].join("\n")
    )
  );

  server.prompt(
    "easyar-run-mega",
    "Guide Codex or Claude through the focused EasyAR Mega Unity sample run-through on a real Android device or supported headset.",
    {
      projectPath: z.string().describe("Unity project path. This must be a Unity project, not a WeChat Mini Program project."),
      platform: z.enum(["android", "ios"]).default("android"),
      targetDevice: z.enum(["android-phone", "pico-4-ultra-enterprise", "xreal-air2-ultra", "visionos"])
        .default("android-phone")
        .describe("Validation target. PICO and XREAL use the Android build path; visionOS uses the iOS path."),
      outputPath: z.string().optional().describe("Optional existing build path inside the Unity project, for example Builds/Android/EasyAR-Mega-Tuyi-Workstation.apk.")
    },
    ({ projectPath, platform, targetDevice, outputPath }: any) => promptText(
      "Focused Unity EasyAR Mega run-through",
      [
        `Run the EasyAR Mega Unity sample for project: ${projectPath}`,
        `Target platform: ${platform}`,
        `Target device: ${targetDevice}`,
        outputPath ? `Existing build path: ${outputPath}` : "Build path: use the generated default unless an existing APK path is supplied.",
        "",
        "SCOPE BOUNDARY: This is the Unity Mega sample path. It is not the WeChat Mini Program sample `wechat-mega`, not a generic AR sample, and not a documentation-only check. If the supplied project is a WeChat project, stop and direct the user to `easyar-run-wechat-miniprogram` with sampleId=wechat-mega.",
        "",
        "Read `easyar://acceptance/fresh-project` and `easyar://samples/catalog` first. Use sampleId=mega for every Unity tool call in this prompt.",
        "",
        "Security boundary:",
        "- Never ask the user to paste EasyAR passwords, verification codes, license keys, Mega API keys/secrets, signing keys, or raw private logs into chat.",
        "- The user downloads official EasyAR packages and obtains Mega materials in the official browser or Mega Studio session.",
        "- MCP may inspect local project state and write redacted evidence artifacts only.",
        "",
        "Start with these calls in order:",
        "1. easyar_server_status",
        "2. easyar_list_samples",
        `3. easyar_write_account_onboarding projectPath=${projectPath} sampleId=mega platform=${platform}`,
        `4. easyar_write_account_materials projectPath=${projectPath} sampleId=mega platform=${platform}`,
        `5. easyar_write_unity_environment_report projectPath=${projectPath} sampleId=mega`,
        `6. easyar_prepare_unity_project projectPath=${projectPath} sampleId=mega`,
        `7. easyar_validate_local_config projectPath=${projectPath} sampleId=mega`,
        `8. easyar_write_scene_audit projectPath=${projectPath} sampleId=mega`,
        `9. easyar_write_focused_preflight projectPath=${projectPath} sampleId=mega platform=${platform}${outputPath ? ` outputPath=${outputPath}` : ""}`,
        "",
        "Read `Assets/EasyARGenerated/mega/PREFLIGHT.md` before any Unity batch or device action. Treat BLOCKED checks as stop conditions for Unity compile/build actions. For an existing APK, continue to device-only validation only when `Ready for device build: yes` and `Device blockers: none`; otherwise follow the first blocker and its nextCall. Do not continue because a file was generated.",
        "",
        "After preflight has no required blockers:",
        `1. easyar_write_import_checklist projectPath=${projectPath} sampleId=mega`,
        `2. easyar_write_run_sequence projectPath=${projectPath} sampleId=mega platform=${platform}${outputPath ? ` outputPath=${outputPath}` : ""}`,
        `3. easyar_write_device_validation_checklist projectPath=${projectPath} sampleId=mega platform=${platform} device=${targetDevice}${outputPath ? ` buildOutputPath=${outputPath}` : ""}`,
        `4. easyar_write_android_device_runbook projectPath=${projectPath} sampleId=mega device=${targetDevice}${outputPath ? ` apkPath=${outputPath}` : ""}`,
        `5. easyar_run_unity_compile_check projectPath=${projectPath} sampleId=mega platform=${platform}`,
        "",
        "Mega-specific requirements before a real-device claim:",
        "- Use the official MegaBlockController workflow for EasyAR Sense Unity Plugin 4003.0.0 or newer.",
        "- Set the Mega scene LocationInputMode to Onsite. Simulator is allowed only for editor/debugging and never proves the acceptance run.",
        "- Configure the local Mega license and Global Mega Block service fields without exposing their values.",
        "- Mega configuration lives in Assets/XR/Settings/EasyAR Settings.asset. Do not create easyar.local.json or a runtime JSON bridge for Mega.",
        "- Read the scene audit before generating Build Settings. If it reports Explicit scenePath required: yes, call easyar_create_build_settings_helper with the exact recommended Assets/.../*.unity scenePath; never accept an arbitrary first match.",
        "- Use a selected cloud localization library and Mega Block in the mapped physical environment.",
        "- For PICO, install the official XR extension and PICO Integration SDK 3.1.0+; for XREAL/visionOS, follow the platform-specific official package path.",
        "",
        "Real-device sequence:",
        `1. easyar_android_device_status`,
        `2. Install the APK named by the generated runbook with easyar_android_install_apk projectPath=${projectPath} sampleId=mega${outputPath ? ` apkPath=${outputPath}` : ""}`,
        `3. Launch it with easyar_android_start_app projectPath=${projectPath} sampleId=mega`,
        `4. After observing the real device in the mapped environment, collect redacted evidence with easyar_android_collect_logcat projectPath=${projectPath} sampleId=mega`,
        "For Mega, `easyar_android_collect_logcat` must report sampleSuccessEvidence=true/logEvidencePassed=true before its log can support a passed run. If it reports false, keep RUN_RESULT.md blocked and continue the physical localization attempt.",
        `5. Record the observed result with easyar_write_run_result projectPath=${projectPath} sampleId=mega platform=${platform} overallStatus=blocked${outputPath ? ` buildOutputPath=${outputPath}` : ""}`,
        `6. Call easyar_write_completion_report projectPath=${projectPath} sampleId=mega platform=${platform}${outputPath ? ` outputPath=${outputPath}` : ""}`,
        "",
        "Completion gate: claim the Mega sample is run through only when the completion report says runThroughComplete=true and the evidence includes successful real-device startup plus Mega localization/tracking (for example Found, block localized, or equivalent redacted official signals). Build success, Unity compile success, APK install, app launch, Onsite configuration, generated reports, or an editor/Simulator run alone are not completion.",
        "Keep overallStatus=blocked until the completion gate is satisfied. Use overallStatus=passed only after the selected Mega Block is loaded and the real device has produced a redacted localization/tracking success signal in the mapped physical environment.",
        "If any gate is missing, say `Mega sample not complete` and name the exact blocker and next MCP call. Do not silently switch to `wechat-mega` or claim that a Unity APK proves the WeChat Mini Program sample.",
        "If Unity batch fails, call easyar_analyze_latest_unity_log with sampleId=mega. If device logs contain a blocker, keep the run result failed/blocked and do not overwrite it as passed."
      ].join("\n")
    )
  );
  
  server.prompt(
    "easyar-validate-official-endpoints",
    "Guide Codex or Claude through official EasyAR endpoint and registered-user access validation.",
    {
      projectPath: z.string().describe("Unity project path."),
      platform: z.enum(["android", "ios"]).default("android")
    },
    ({ projectPath, platform }: any) => promptText(
      "Official EasyAR endpoint validation",
      [
        `Validate official EasyAR account endpoints for project: ${projectPath}`,
        `Target platform: ${platform}`,
        "",
        "Start by reading `easyar://official/api-contract`.",
        "",
        "Then call:",
        "1. easyar_auth_status",
        "2. easyar_generate_official_api_contract",
        `3. easyar_check_official_access projectPath=${projectPath} sampleId=image-tracking platform=${platform}`,
        `4. easyar_check_official_access projectPath=${projectPath} sampleId=cloud-recognition platform=${platform}`,
        "5. easyar_write_deployment_readiness",
        "",
        "Do not ask the user to paste EASYAR_API_TOKEN, licenseKey, appKey, or appSecret in chat. Report only endpoint readiness, status codes, redacted metadata, and next actions."
      ].join("\n")
    )
  );
  
  server.prompt(
    "easyar-close-focused-scope",
    "Guide Codex or Claude through closing out Image Tracking, Cloud Recognition, and Mega focused sample status.",
    {
      projectPath: z.string().describe("Unity project path."),
      platform: z.enum(["android", "ios"]).default("android")
    },
    ({ projectPath, platform }: any) => promptText(
      "Focused EasyAR scope close-out",
      [
        `Close out the current focused EasyAR sample scope for project: ${projectPath}`,
        `Target platform: ${platform}`,
        "",
        "Read `easyar://acceptance/fresh-project` and `easyar://workflow/focused-scope` first.",
        "",
        "Then call:",
        `1. easyar_write_completion_report projectPath=${projectPath} sampleId=image-tracking platform=${platform}`,
        `2. easyar_write_completion_report projectPath=${projectPath} sampleId=cloud-recognition platform=${platform}`,
        `3. easyar_write_completion_report projectPath=${projectPath} sampleId=mega platform=${platform}`,
        `4. easyar_write_focused_scope_status projectPath=${projectPath} platform=${platform}`,
        "",
        "Read FOCUSED_SCOPE_STATUS.md. If allFocusedSamplesComplete is false, follow the per-sample next actions. Do not start deferred samples unless the user asks to continue."
      ].join("\n")
    )
  );
  
  server.prompt(
    "easyar-unity-programming-assistant",
    "Guide Codex or Claude through Unity C# implementation and diagnostics for an EasyAR project.",
    {
      projectPath: z.string().describe("Unity project path."),
      sampleId: z.enum(["image-tracking", "cloud-recognition", "mega"]).default("image-tracking")
    },
    ({ projectPath, sampleId }: any) => promptText(
      "EasyAR Unity programming assistant",
      [
        `Act as the Unity programming assistant for ${sampleId} in project: ${projectPath}`,
        "",
        "Start by reading `easyar://workflow/programming`.",
        "Then call easyar_write_focused_preflight, easyar_write_config_integration_audit, and easyar_write_programming_context to understand current readiness and script context.",
        "Read PROGRAMMING_CONTEXT.md before CODE_PLAN.md when taking over script work.",
        "When creating or editing C# files, prefer easyar_create_mono_behaviour for common templates and easyar_write_csharp_file for focused patches.",
        "After code changes, call easyar_review_csharp_scripts before asking Unity to compile.",
        "If Unity reports errors, call easyar_analyze_latest_unity_log or easyar_analyze_unity_log with the focused sampleId."
      ].join("\n")
    )
  );

  server.prompt(
    "easyar-run-wechat-miniprogram",
    "Guide Codex or Claude through the focused WeChat Mini Program Mega or CRS run-through. This is not the Unity/Android APK Mega path.",
    {
      projectPath: z.string().describe("WeChat Mini Program project path."),
      sampleId: z.enum(["wechat-mega", "wechat-crs"]).default("wechat-mega"),
      packagePath: z.string().optional().describe("Optional path to the official EasyAR Mini Program sample or SDK package directory or .zip downloaded by the user.")
    },
    ({ projectPath, sampleId, packagePath }: any) => promptText(
      "Focused WeChat Mini Program run-through",
      [
        `Use the mcp-easyar tools to run the ${sampleId} sample for Mini Program project: ${projectPath}`,
        "",
        "SCOPE BOUNDARY: This is a WeChat Mini Program project. It is not a Unity project, Android APK, PICO headset build, or XREAL build. If the user wants the Unity Mega sample, stop and direct them to `easyar-run-mega` with sampleId=mega.",
        "",
        "Read `easyar://acceptance/wechat-miniprogram` and `easyar://samples/wechat-miniprogram` first.",
        "",
        "Security boundary:",
        "- Do not ask the user for EasyAR passwords, WeChat passwords, SMS codes, QR codes, license keys, API keys, API secrets, or EASYAR_API_TOKEN in chat.",
        "- The user signs in, downloads official packages, creates licenses/keys, and fills local config in the official EasyAR website or WeChat Developer Tools.",
        "- MCP may inspect local project files and write redacted evidence artifacts only.",
        "",
        "Start by calling:",
        "1. easyar_list_miniprogram_samples",
        "2. easyar_check_wechat_devtools",
        `3. If the project does not exist yet, call easyar_create_miniprogram_sample_workspace projectPath=${projectPath} sampleId=${sampleId}`,
        `4. easyar_write_miniprogram_local_config_form projectPath=${projectPath} sampleId=${sampleId}`,
        packagePath
          ? `5. easyar_import_miniprogram_sample_from_local_package projectPath=${projectPath} sampleId=${sampleId} packagePath=${packagePath} dryRun=true`
          : `5. Call easyar_find_miniprogram_official_package sampleId=${sampleId}; optionally call easyar_write_miniprogram_official_package_search projectPath=${projectPath} sampleId=${sampleId}; if a package is found, call easyar_import_miniprogram_sample_from_local_package with packagePath and dryRun=true.`,
        `6. easyar_inspect_miniprogram_project projectPath=${projectPath} sampleId=${sampleId}`,
        `7. easyar_write_miniprogram_run_through_status projectPath=${projectPath} sampleId=${sampleId}`,
        `8. easyar_write_miniprogram_preflight projectPath=${projectPath} sampleId=${sampleId}`,
        "",
        "Read PREFLIGHT.md and fix readiness blockers before asking WeChat Developer Tools to preview or upload.",
        "",
        "After preflight blockers are clear, call:",
        `1. easyar_write_miniprogram_run_sequence projectPath=${projectPath} sampleId=${sampleId}`,
        `2. easyar_run_miniprogram_devtools_check projectPath=${projectPath} sampleId=${sampleId} mode=open dryRun=true`,
        `3. easyar_run_miniprogram_devtools_check projectPath=${projectPath} sampleId=${sampleId} mode=preview dryRun=true`,
        `4. After the user confirms WeChat Developer Tools is logged in and the service port is enabled, run mode=open and mode=preview with dryRun=false as appropriate.`,
        `5. easyar_analyze_miniprogram_devtools_log projectPath=${projectPath} sampleId=${sampleId} logPath=easyar-generated/${sampleId}/DEVTOOLS_CHECK.log`,
        `6. easyar_write_miniprogram_device_validation_checklist projectPath=${projectPath} sampleId=${sampleId}`,
        `7. easyar_write_miniprogram_run_result_form projectPath=${projectPath} sampleId=${sampleId}`,
        "",
        "Only after real-device WeChat preview evidence exists, call easyar_write_miniprogram_run_result and then easyar_write_miniprogram_completion_report.",
        "Do not claim the sample is complete from generated docs, DevTools open success, or a dry run alone.",
        "A Unity Mega APK, PICO/XREAL run, or Unity localization log cannot satisfy the wechat-mega completion gate.",
        "After both wechat-mega and wechat-crs have passing completion reports, call easyar_write_miniprogram_scope_status."
      ].join("\n")
    )
  );
}
