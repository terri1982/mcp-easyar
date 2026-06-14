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
    "Guide Codex or Claude through the focused WeChat Mini Program Mega or CRS run-through.",
    {
      projectPath: z.string().describe("WeChat Mini Program project path."),
      sampleId: z.enum(["wechat-mega", "wechat-crs"]).default("wechat-mega"),
      packagePath: z.string().optional().describe("Optional path to the official EasyAR Mini Program sample or SDK package downloaded by the user.")
    },
    ({ projectPath, sampleId, packagePath }: any) => promptText(
      "Focused WeChat Mini Program run-through",
      [
        `Use the mcp-easyar tools to run the ${sampleId} sample for Mini Program project: ${projectPath}`,
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
        `3. easyar_write_miniprogram_local_config_form projectPath=${projectPath} sampleId=${sampleId}`,
        packagePath
          ? `4. easyar_import_miniprogram_sample_from_local_package projectPath=${projectPath} sampleId=${sampleId} packagePath=${packagePath} dryRun=true`
          : "4. If the user has downloaded the official EasyAR Mini Program package, call easyar_import_miniprogram_sample_from_local_package with packagePath and dryRun=true.",
        `5. easyar_inspect_miniprogram_project projectPath=${projectPath} sampleId=${sampleId}`,
        `6. easyar_write_miniprogram_preflight projectPath=${projectPath} sampleId=${sampleId}`,
        "",
        "Read PREFLIGHT.md and fix readiness blockers before asking WeChat Developer Tools to preview or upload.",
        "",
        "After preflight blockers are clear, call:",
        `1. easyar_write_miniprogram_run_sequence projectPath=${projectPath} sampleId=${sampleId}`,
        `2. easyar_run_miniprogram_devtools_check projectPath=${projectPath} sampleId=${sampleId} dryRun=true`,
        `3. easyar_write_miniprogram_device_validation_checklist projectPath=${projectPath} sampleId=${sampleId}`,
        `4. easyar_write_miniprogram_run_result_form projectPath=${projectPath} sampleId=${sampleId}`,
        "",
        "Only after real-device WeChat preview evidence exists, call easyar_write_miniprogram_run_result and then easyar_write_miniprogram_completion_report.",
        "Do not claim the sample is complete from generated docs, DevTools open success, or a dry run alone.",
        "After both wechat-mega and wechat-crs have passing completion reports, call easyar_write_miniprogram_scope_status."
      ].join("\n")
    )
  );
}
