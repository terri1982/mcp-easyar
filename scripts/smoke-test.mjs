import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const command = process.env.MCP_EASYAR_SMOKE_COMMAND ?? process.execPath;
const args = process.env.MCP_EASYAR_SMOKE_COMMAND
  ? []
  : [path.resolve("dist/index.js")];
const child = spawn(command, args, {
  env: {
    ...process.env,
    EASYAR_API_BASE_URL: "https://www.easyar.cn",
    EASYAR_API_TOKEN: "",
    EASYAR_ACCOUNT_STATUS_ENDPOINT: "",
    EASYAR_LICENSE_VALIDATE_ENDPOINT: "",
    EASYAR_DOWNLOADS_ENDPOINT: "",
    EASYAR_CLOUD_CREDENTIALS_ENDPOINT: ""
  },
  stdio: ["pipe", "pipe", "pipe"]
});

let nextId = 1;
const pending = new Map();
let stderr = "";
let stdoutBuffer = "";

child.stderr.on("data", (chunk) => {
  stderr += chunk.toString();
});

child.stdout.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  stdoutBuffer += chunk;
  const lines = stdoutBuffer.split(/\r?\n/);
  stdoutBuffer = lines.pop() ?? "";
  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }
    const message = JSON.parse(line);
    const resolver = pending.get(message.id);
    if (resolver) {
      pending.delete(message.id);
      resolver(message);
    }
  }
});

try {
  await request("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: {
      name: "easyar-mcp-smoke-test",
      version: "0.0.1"
    }
  });
  notify("notifications/initialized", {});

  const tools = await request("tools/list", {});
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_create_mono_behaviour"),
    "easyar_create_mono_behaviour should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_create_mobile_settings_helper"),
    "easyar_create_mobile_settings_helper should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_review_csharp_scripts"),
    "easyar_review_csharp_scripts should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_generate_code_plan"),
    "easyar_generate_code_plan should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_code_plan"),
    "easyar_write_code_plan should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_generate_code_change_summary"),
    "easyar_generate_code_change_summary should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_code_change_summary"),
    "easyar_write_code_change_summary should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_run_unity_compile_check"),
    "easyar_run_unity_compile_check should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_discover_downloads"),
    "easyar_discover_downloads should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_discover_cloud_credentials"),
    "easyar_discover_cloud_credentials should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_run_sequence"),
    "easyar_write_run_sequence should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_generate_artifact_index"),
    "easyar_generate_artifact_index should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_artifact_index"),
    "easyar_write_artifact_index should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_audit_sample_scene"),
    "easyar_audit_sample_scene should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_scene_audit"),
    "easyar_write_scene_audit should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_generate_support_bundle"),
    "easyar_generate_support_bundle should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_support_bundle"),
    "easyar_write_support_bundle should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_generate_device_validation_checklist"),
    "easyar_generate_device_validation_checklist should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_device_validation_checklist"),
    "easyar_write_device_validation_checklist should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_generate_run_result"),
    "easyar_generate_run_result should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_run_result"),
    "easyar_write_run_result should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_deployment_readiness"),
    "easyar_deployment_readiness should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_deployment_readiness"),
    "easyar_write_deployment_readiness should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_generate_import_checklist"),
    "easyar_generate_import_checklist should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_import_checklist"),
    "easyar_write_import_checklist should be listed"
  );

  const prompts = await request("prompts/list", {});
  assert(
    prompts.result.prompts.some((prompt) => prompt.name === "easyar-run-image-tracking"),
    "easyar-run-image-tracking prompt should be listed"
  );
  assert(
    prompts.result.prompts.some((prompt) => prompt.name === "easyar-run-cloud-recognition"),
    "easyar-run-cloud-recognition prompt should be listed"
  );

  const imageTrackingPrompt = await request("prompts/get", {
    name: "easyar-run-image-tracking",
    arguments: {
      projectPath: "/tmp/EasyARProject",
      platform: "android"
    }
  });
  assertPromptIncludes(imageTrackingPrompt, "easyar_generate_run_report");
  assertPromptIncludes(imageTrackingPrompt, "sampleId=image-tracking");

  const status = await callTool("easyar_server_status", {});
  assertTextIncludes(status, "\"name\": \"mcp-easyar\"");
  assertTextIncludes(status, "easyar_check_sample_readiness");
  assertTextIncludes(status, "\"focusedSamples\"");
  assertTextIncludes(status, "\"cloud-recognition\"");
  assertTextIncludes(status, "account-scoped SDK download discovery");

  const officialInfo = await callTool("easyar_official_info", {});
  assertTextIncludes(officialInfo, "easyarSenseUnityPlugin");

  const quickstart = await request("resources/read", {
    uri: "easyar://workflow/quickstart"
  });
  assertResourceIncludes(quickstart, "easyar_check_sample_readiness");

  const authStatus = await callTool("easyar_auth_status", {});
  assertTextIncludes(authStatus, "\"hasToken\": false");
  assertTextIncludes(authStatus, "\"accountStatusEndpointConfigured\": false");
  assertTextIncludes(authStatus, "Secret values are never returned");
  assertTextIncludes(authStatus, "\"downloadsEndpointConfigured\": false");
  assertTextIncludes(authStatus, "\"cloudCredentialsEndpointConfigured\": false");

  const accountCheck = await callTool("easyar_check_account", {});
  assertTextIncludes(accountCheck, "\"configured\": false");
  assertTextIncludes(accountCheck, "EASYAR_ACCOUNT_STATUS_ENDPOINT is not configured");

  const remoteLicenseCheck = await callTool("easyar_validate_license", {
    licenseKey: "test-license-key",
    bundleIdentifier: "com.easyar.testsample",
    platform: "android"
  });
  assertTextIncludes(remoteLicenseCheck, "\"configured\": false");
  assertTextIncludes(remoteLicenseCheck, "\"hasLicenseKey\": true");
  assertTextIncludes(remoteLicenseCheck, "licenseKey are never returned");

  const downloadDiscovery = await callTool("easyar_discover_downloads", {
    sampleId: "image-tracking",
    packageKind: "unity-samples"
  });
  assertTextIncludes(downloadDiscovery, "\"configured\": false");
  assertTextIncludes(downloadDiscovery, "EASYAR_DOWNLOADS_ENDPOINT is not configured");
  assertTextIncludes(downloadDiscovery, "\"sampleId\": \"image-tracking\"");

  const cloudCredentialDiscovery = await callTool("easyar_discover_cloud_credentials", {
    sampleId: "cloud-recognition",
    platform: "android"
  });
  assertTextIncludes(cloudCredentialDiscovery, "\"configured\": false");
  assertTextIncludes(cloudCredentialDiscovery, "EASYAR_CLOUD_CREDENTIALS_ENDPOINT is not configured");
  assertTextIncludes(cloudCredentialDiscovery, "\"sampleId\": \"cloud-recognition\"");

  const clientConfig = await callTool("easyar_generate_client_config", {
    client: "claude-desktop",
    serverPath: "/tmp/mcp-easyar/dist/index.js"
  });
  assertTextIncludes(clientConfig, "\"mcpServers\"");
  assertTextIncludes(clientConfig, "your_registered_user_token");

  const deploymentReadiness = await callTool("easyar_deployment_readiness", {});
  assertTextIncludes(deploymentReadiness, "\"packageName\": \"mcp-easyar\"");
  assertTextIncludes(deploymentReadiness, "\"ready\": false");
  assertTextIncludes(deploymentReadiness, "account-status-endpoint");
  assertTextIncludes(deploymentReadiness, "cloud-credentials-endpoint");
  assertTextIncludes(deploymentReadiness, "\"focusedSamples\"");

  const unityEnvironment = await callTool("easyar_unity_environment", {});
  assertTextIncludes(unityEnvironment, "\"pathCommand\": \"Unity\"");

  const projectPath = await createUnityProject();
  const initialImportChecklist = await callTool("easyar_generate_import_checklist", {
    projectPath,
    sampleId: "image-tracking"
  });
  assertTextIncludes(initialImportChecklist, "\"readyForFocusedPreparation\": false");
  assertTextIncludes(initialImportChecklist, "official-unity-plugin-imported");
  assertTextIncludes(initialImportChecklist, "image-tracking-target-assets-imported");

  const writtenImportChecklist = await callTool("easyar_write_import_checklist", {
    projectPath,
    sampleId: "image-tracking"
  });
  assertTextIncludes(writtenImportChecklist, "IMPORT_CHECKLIST.md");
  const initialImportChecklistMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "image-tracking", "IMPORT_CHECKLIST.md"),
    "utf8"
  );
  assert(initialImportChecklistMarkdown.includes("EasyAR Import Checklist - Image Tracking"), "Import checklist markdown should include title");
  assert(initialImportChecklistMarkdown.includes("official-unity-plugin-imported"), "Import checklist markdown should include plugin check");

  const initialDeviceValidation = await callTool("easyar_generate_device_validation_checklist", {
    projectPath,
    sampleId: "image-tracking",
    platform: "android",
    buildOutputPath: "Builds/image-tracking.apk"
  });
  assertTextIncludes(initialDeviceValidation, "\"readyForDeviceValidation\": false");
  assertTextIncludes(initialDeviceValidation, "official-unity-plugin-imported");
  assertTextIncludes(initialDeviceValidation, "image-target-detection");

  const writtenDeploymentReadiness = await callTool("easyar_write_deployment_readiness", {
    projectPath
  });
  assertTextIncludes(writtenDeploymentReadiness, "DEPLOYMENT_READINESS.md");
  const deploymentReadinessMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "DEPLOYMENT_READINESS.md"),
    "utf8"
  );
  assert(deploymentReadinessMarkdown.includes("mcp-easyar Deployment Readiness"), "Deployment readiness markdown should include title");
  assert(deploymentReadinessMarkdown.includes("account-status-endpoint"), "Deployment readiness markdown should include endpoint blockers");

  const imageRunSequence = await callTool("easyar_generate_run_sequence", {
    projectPath,
    sampleId: "image-tracking",
    platform: "android"
  });
  assertTextIncludes(imageRunSequence, "\"supportedNow\": true");
  assertTextIncludes(imageRunSequence, "easyar_generate_import_checklist");
  assertTextIncludes(imageRunSequence, "easyar_write_import_checklist");
  assertTextIncludes(imageRunSequence, "easyar_write_device_validation_checklist");
  assertTextIncludes(imageRunSequence, "EasyAR.EditorTools.EasyARBuildSettingsHelper.ConfigureBuildSettings");
  assertTextIncludes(imageRunSequence, "easyar_run_unity_compile_check");
  assertTextIncludes(imageRunSequence, "EasyAR.EditorTools.EasyARSampleValidationHelper.ValidateFocusedSample");
  assertTextIncludes(imageRunSequence, "\"logPath\"");
  assertTextIncludes(imageRunSequence, "easyar_analyze_latest_unity_log");
  assertTextIncludes(imageRunSequence, "image-target-assets");

  const cloudRunSequence = await callTool("easyar_generate_run_sequence", {
    projectPath,
    sampleId: "cloud-recognition",
    platform: "ios",
    outputPath: "Builds/iOS/cloud-recognition"
  });
  assertTextIncludes(cloudRunSequence, "cloud-recognition-credentials");
  assertTextIncludes(cloudRunSequence, "Builds/iOS/cloud-recognition");

  const writtenRunSequence = await callTool("easyar_write_run_sequence", {
    projectPath,
    sampleId: "image-tracking",
    platform: "android"
  });
  assertTextIncludes(writtenRunSequence, "RUN_SEQUENCE.md");
  const runSequenceMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "image-tracking", "RUN_SEQUENCE.md"),
    "utf8"
  );
  assert(runSequenceMarkdown.includes("EasyAR Focused Run Sequence - Image Tracking"), "Run sequence markdown should include title");
  assert(runSequenceMarkdown.includes("EasyAR.EditorTools.EasyARBuildSettingsHelper.ConfigureBuildSettings"), "Run sequence markdown should include Unity build settings method");
  assert(runSequenceMarkdown.includes("mcp-easyar-CompileCheck.log"), "Run sequence markdown should include compile log path");

  const writtenCloudRunSequence = await callTool("easyar_write_run_sequence", {
    projectPath,
    sampleId: "cloud-recognition",
    platform: "ios",
    outputPath: "Builds/iOS/cloud-recognition"
  });
  assertTextIncludes(writtenCloudRunSequence, "RUN_SEQUENCE.md");
  const cloudRunSequenceMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "cloud-recognition", "RUN_SEQUENCE.md"),
    "utf8"
  );
  assert(cloudRunSequenceMarkdown.includes("EasyAR Focused Run Sequence - Cloud Recognition"), "Cloud run sequence markdown should include title");
  assert(cloudRunSequenceMarkdown.includes("cloud-recognition-credentials"), "Cloud run sequence markdown should include credential readiness");
  assert(cloudRunSequenceMarkdown.includes("Builds/iOS/cloud-recognition"), "Cloud run sequence markdown should include iOS output path");

  const initialRunReport = await callTool("easyar_generate_run_report", {
    projectPath,
    sampleId: "image-tracking"
  });
  assertTextIncludes(initialRunReport, "\"overallReady\": false");
  assertTextIncludes(initialRunReport, "Fix readiness gaps before Unity batch automation");

  const writtenRunReport = await callTool("easyar_write_run_report", {
    projectPath,
    sampleId: "image-tracking"
  });
  assertTextIncludes(writtenRunReport, "RUN_REPORT.md");
  const runReportMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "image-tracking", "RUN_REPORT.md"),
    "utf8"
  );
  assert(runReportMarkdown.includes("EasyAR Focused Run Report - Image Tracking"), "Run report markdown should include title");
  assert(runReportMarkdown.includes("Next Recommended Phase"), "Run report markdown should include next phase");

  const initialSceneAudit = await callTool("easyar_write_scene_audit", {
    projectPath,
    sampleId: "image-tracking"
  });
  assertTextIncludes(initialSceneAudit, "SCENE_AUDIT.md");
  const initialSceneAuditMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "image-tracking", "SCENE_AUDIT.md"),
    "utf8"
  );
  assert(initialSceneAuditMarkdown.includes("EasyAR Focused Scene Audit - Image Tracking"), "Scene audit markdown should include title");
  assert(initialSceneAuditMarkdown.includes("Ignored Generated Signals"), "Scene audit markdown should list ignored generated signals");

  const initialReadiness = await callTool("easyar_check_sample_readiness", {
    projectPath,
    sampleId: "image-tracking"
  });
  assertTextIncludes(initialReadiness, "\"ready\": false");
  assertTextIncludes(initialReadiness, "Import the official EasyAR Unity Plugin package");
  assertTextIncludes(initialReadiness, "image-target-assets");

  const compileDryRun = await callTool("easyar_run_unity_compile_check", {
    projectPath,
    sampleId: "image-tracking",
    dryRun: true
  });
  assertTextIncludes(compileDryRun, "\"dryRun\": true");
  assertTextIncludes(compileDryRun, "mcp-easyar-CompileCheck.log");

  const prepared = await callTool("easyar_prepare_unity_project", {
    projectPath,
    sampleId: "image-tracking"
  });
  assertTextIncludes(prepared, "easyar.local.json");
  assertTextIncludes(prepared, "EasyARBuildSettingsHelper.cs");
  assertTextIncludes(prepared, "EasyARMobileSettingsHelper.cs");
  assertTextIncludes(prepared, "EasyARSampleValidationHelper.cs");
  assertTextIncludes(prepared, "Assets/EasyARGenerated/image-tracking/RUNBOOK.md");

  const imageTrackingRunbook = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "image-tracking", "RUNBOOK.md"),
    "utf8"
  );
  assert(imageTrackingRunbook.includes("Image Tracking Checklist"), "Image Tracking runbook should include focused checklist");
  const imageTargetsReadme = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "image-tracking", "Targets", "README.md"),
    "utf8"
  );
  assert(imageTargetsReadme.includes("requires real target assets"), "Image Tracking target README should not pretend to be a target asset");

  await copyFile(
    path.join(projectPath, "ProjectSettings", "EasyAR", "easyar.local.json.example"),
    path.join(projectPath, "ProjectSettings", "EasyAR", "easyar.local.json")
  );
  const placeholderConfig = await callTool("easyar_validate_local_config", {
    projectPath
  });
  assertTextIncludes(placeholderConfig, "\"valid\": false");
  assertTextIncludes(placeholderConfig, "easyar.licenseKey is present and not a placeholder");

  await writeFile(
    path.join(projectPath, "ProjectSettings", "EasyAR", "easyar.local.json"),
    JSON.stringify({
      easyar: {
        apiBaseUrl: "https://www.easyar.cn",
        accountToken: "test-account-token",
        licenseKey: "test-license-key",
        cloudRecognition: {
          appId: "",
          appKey: "",
          appSecret: ""
        }
      },
      unity: {
        targetPlatform: "android",
        bundleIdentifier: "com.easyar.testsample"
      }
    }),
    "utf8"
  );
  const validConfig = await callTool("easyar_validate_local_config", {
    projectPath
  });
  assertTextIncludes(validConfig, "\"valid\": true");
  assertTextIncludes(validConfig, "Secret values are not returned");

  await mkdir(path.join(projectPath, "Assets", "Targets"), { recursive: true });
  await writeFile(path.join(projectPath, "Assets", "Targets", "ImageTarget.jpg"), "fake-image-target", "utf8");
  await mkdir(path.join(projectPath, "Assets", "EasyAR"), { recursive: true });
  await writeFile(path.join(projectPath, "Assets", "EasyAR", "EasyARSense.asset"), "fake-easyar-signal", "utf8");
  await mkdir(path.join(projectPath, "Assets", "Scenes"), { recursive: true });
  await writeFile(path.join(projectPath, "Assets", "Scenes", "ImageTracking.unity"), "%YAML 1.1\n", "utf8");
  await writeFile(
    path.join(projectPath, "ProjectSettings", "EditorBuildSettings.asset"),
    [
      "%YAML 1.1",
      "--- !u!1045 &1",
      "EditorBuildSettings:",
      "  m_Scenes:",
      "  - enabled: 1",
      "    path: Assets/Scenes/ImageTracking.unity",
      "    guid: 00000000000000000000000000000000"
    ].join("\n"),
    "utf8"
  );

  const readyImportChecklist = await callTool("easyar_generate_import_checklist", {
    projectPath,
    sampleId: "image-tracking"
  });
  assertTextIncludes(readyImportChecklist, "\"readyForFocusedPreparation\": true");
  assertTextIncludes(readyImportChecklist, "Assets/EasyAR/EasyARSense.asset");
  assertTextIncludes(readyImportChecklist, "Assets/Scenes/ImageTracking.unity");
  assertTextIncludes(readyImportChecklist, "Assets/Targets/ImageTarget.jpg");

  const readySceneAudit = await callTool("easyar_audit_sample_scene", {
    projectPath,
    sampleId: "image-tracking"
  });
  assertTextIncludes(readySceneAudit, "\"readyForUnityValidation\": true");
  assertTextIncludes(readySceneAudit, "Assets/Scenes/ImageTracking.unity");
  assertTextIncludes(readySceneAudit, "Assets/EasyAR/EasyARSense.asset");
  assertTextIncludes(readySceneAudit, "Assets/Targets/ImageTarget.jpg");

  const readyDeviceValidation = await callTool("easyar_write_device_validation_checklist", {
    projectPath,
    sampleId: "image-tracking",
    platform: "android",
    device: "Pixel test device",
    buildOutputPath: "Builds/image-tracking.apk"
  });
  assertTextIncludes(readyDeviceValidation, "DEVICE_VALIDATION.md");
  assertTextIncludes(readyDeviceValidation, "\"readyForDeviceValidation\": true");
  const deviceValidationMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "image-tracking", "DEVICE_VALIDATION.md"),
    "utf8"
  );
  assert(deviceValidationMarkdown.includes("EasyAR Device Validation - Image Tracking"), "Device validation markdown should include title");
  assert(deviceValidationMarkdown.includes("image-target-detection"), "Device validation markdown should include image target test step");
  assert(deviceValidationMarkdown.includes("Pixel test device"), "Device validation markdown should include device label");

  const buildSettingsHelper = await readFile(
    path.join(projectPath, "Assets", "Editor", "EasyARBuildSettingsHelper.cs"),
    "utf8"
  );
  assert(
    buildSettingsHelper.includes("ConfigureBuildSettings"),
    "Build settings helper should include ConfigureBuildSettings"
  );
  const mobileSettingsHelper = await readFile(
    path.join(projectPath, "Assets", "Editor", "EasyARMobileSettingsHelper.cs"),
    "utf8"
  );
  assert(
    mobileSettingsHelper.includes("ConfigureMobileSettings"),
    "Mobile settings helper should include ConfigureMobileSettings"
  );
  const validationHelper = await readFile(
    path.join(projectPath, "Assets", "Editor", "EasyARSampleValidationHelper.cs"),
    "utf8"
  );
  assert(
    validationHelper.includes("ValidateFocusedSample"),
    "Sample validation helper should include ValidateFocusedSample"
  );
  assert(
    validationHelper.includes("Generated MCP helper files do not count"),
    "Sample validation helper should reject generated MCP helpers as official EasyAR import signals"
  );
  assert(
    validationHelper.includes("IsOfficialEasyARAssetSignal"),
    "Sample validation helper should filter official EasyAR asset signals"
  );
  assert(
    validationHelper.includes("first enabled Build Settings scene"),
    "Sample validation helper should verify the matching scene is first in Build Settings"
  );
  assert(
    validationHelper.includes("IsImageTrackingTargetAsset"),
    "Image Tracking validation helper should filter target assets"
  );

  const explicitValidationHelper = await callTool("easyar_create_sample_validation_helper", {
    projectPath,
    sampleId: "image-tracking",
    overwrite: true
  });
  assertTextIncludes(explicitValidationHelper, "EasyAR.EditorTools.EasyARSampleValidationHelper.ValidateFocusedSample");

  const iosMobileSettings = await callTool("easyar_create_mobile_settings_helper", {
    projectPath,
    sampleId: "image-tracking",
    platform: "ios",
    bundleIdentifier: "com.easyar.testsample",
    cameraUsageDescription: "Camera access is required for EasyAR sample tracking.",
    overwrite: true
  });
  assertTextIncludes(iosMobileSettings, "EasyAR.EditorTools.EasyARMobileSettingsHelper.ConfigureMobileSettings");

  const iosMobileSettingsScript = await readFile(
    path.join(projectPath, "Assets", "Editor", "EasyARMobileSettingsHelper.cs"),
    "utf8"
  );
  assert(iosMobileSettingsScript.includes("cameraUsageDescription"), "iOS helper should set camera usage description");

  const standaloneBuildSettings = await callTool("easyar_create_build_settings_helper", {
    projectPath,
    sampleId: "image-tracking",
    platform: "standalone",
    overwrite: true
  });
  assertTextIncludes(standaloneBuildSettings, "EasyAR.EditorTools.EasyARBuildSettingsHelper.ConfigureBuildSettings");

  const deviceBuildHelper = await callTool("easyar_create_device_build_helper", {
    projectPath,
    platform: "android",
    outputPath: "Builds/EasyARSample.apk",
    developmentBuild: true
  });
  assertTextIncludes(deviceBuildHelper, "EasyAR.EditorTools.EasyARDeviceBuildHelper.Build");

  const deviceBuildScript = await readFile(
    path.join(projectPath, "Assets", "Editor", "EasyARDeviceBuildHelper.cs"),
    "utf8"
  );
  assert(deviceBuildScript.includes("BuildPipeline.BuildPlayer"), "Device build helper should call BuildPipeline.BuildPlayer");

  const preparedReadiness = await callTool("easyar_check_sample_readiness", {
    projectPath,
    sampleId: "image-tracking"
  });
  assertTextIncludes(preparedReadiness, "EasyARBuildSettingsHelper.cs exists");
  assertTextIncludes(preparedReadiness, "ImageTarget.jpg");

  const missingCloudReadiness = await callTool("easyar_check_sample_readiness", {
    projectPath,
    sampleId: "cloud-recognition"
  });
  assertTextIncludes(missingCloudReadiness, "cloud-recognition-credentials");
  assertTextIncludes(missingCloudReadiness, "credentials are incomplete");

  const preparedCloud = await callTool("easyar_prepare_unity_project", {
    projectPath,
    sampleId: "cloud-recognition",
    overwrite: true
  });
  assertTextIncludes(preparedCloud, "Assets/EasyARGenerated/cloud-recognition/RUNBOOK.md");
  const cloudRunbook = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "cloud-recognition", "RUNBOOK.md"),
    "utf8"
  );
  assert(cloudRunbook.includes("Cloud Recognition Checklist"), "Cloud Recognition runbook should include focused checklist");
  const cloudValidationHelper = await readFile(
    path.join(projectPath, "Assets", "Editor", "EasyARSampleValidationHelper.cs"),
    "utf8"
  );
  assert(
    cloudValidationHelper.includes("your_"),
    "Cloud Recognition validation helper should reject your_ placeholder credentials"
  );

  await writeFile(
    path.join(projectPath, "ProjectSettings", "EasyAR", "easyar.local.json"),
    JSON.stringify({
      easyar: {
        apiBaseUrl: "https://www.easyar.cn",
        accountToken: "test-account-token",
        licenseKey: "test-license-key",
        cloudRecognition: {
          appId: "test-cloud-app-id",
          appKey: "test-cloud-app-key",
          appSecret: "test-cloud-app-secret"
        }
      },
      unity: {
        targetPlatform: "android",
        bundleIdentifier: "com.easyar.testsample"
      }
    }),
    "utf8"
  );
  const configuredCloudReadiness = await callTool("easyar_check_sample_readiness", {
    projectPath,
    sampleId: "cloud-recognition"
  });
  assertTextIncludes(configuredCloudReadiness, "Cloud recognition appId, appKey, and appSecret are configured");

  const script = await callTool("easyar_create_mono_behaviour", {
    projectPath,
    relativePath: "Assets/Scripts/ImageTargetContentController.cs",
    className: "ImageTargetContentController",
    kind: "image-tracking"
  });
  assertTextIncludes(script, "ImageTargetContentController.cs");

  const generatedScript = await readFile(
    path.join(projectPath, "Assets", "Scripts", "ImageTargetContentController.cs"),
    "utf8"
  );
  assert(generatedScript.includes("OnTargetFound"), "Generated script should include OnTargetFound");

  const codePlan = await callTool("easyar_generate_code_plan", {
    projectPath,
    sampleId: "image-tracking",
    goal: "Show content when an image target is found and hide it when tracking is lost.",
    targetFiles: ["Assets/Scripts/ImageTargetContentController.cs"]
  });
  assertTextIncludes(codePlan, "easyar_create_mono_behaviour");
  assertTextIncludes(codePlan, "ImageTargetContentController.cs");
  assertTextIncludes(codePlan, "Run static script review before opening Unity batch compilation");

  const writtenCodePlan = await callTool("easyar_write_code_plan", {
    projectPath,
    sampleId: "cloud-recognition",
    goal: "Handle cloud recognition timeout and unauthorized states without hardcoded secrets.",
    targetFiles: ["Assets/Scripts/CloudRecognitionResultController.cs"]
  });
  assertTextIncludes(writtenCodePlan, "CODE_PLAN.md");
  const codePlanMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "cloud-recognition", "CODE_PLAN.md"),
    "utf8"
  );
  assert(codePlanMarkdown.includes("EasyAR Focused Code Plan - Cloud Recognition"), "Code plan markdown should include title");
  assert(codePlanMarkdown.includes("never embed appKey or appSecret"), "Code plan should include Cloud Recognition secret guidance");

  await writeFile(
    path.join(projectPath, "Assets", "Scripts", "RiskyEasyARController.cs"),
    [
      "using UnityEngine;",
      "using EasyAR;",
      "",
      "public sealed class RiskyEasyARController : MonoBehaviour",
      "{",
      "    [SerializeField] private GameObject contentRoot;",
      "    private string licenseKey = \"hardcoded-easyar-license-value\";",
      "",
      "    private void Update()",
      "    {",
      "        GameObject.Find(\"ARCamera\");",
      "        if (Input.touchCount > 0)",
      "        {",
      "            contentRoot.SetActive(true);",
      "        }",
      "    }",
      "}"
    ].join("\n"),
    "utf8"
  );
  const scriptReview = await callTool("easyar_review_csharp_scripts", {
    projectPath,
    relativePaths: ["Assets/Scripts/RiskyEasyARController.cs"]
  });
  assertTextIncludes(scriptReview, "hardcoded-easyar-secret");
  assertTextIncludes(scriptReview, "expensive-update-lookup");
  assertTextIncludes(scriptReview, "touch-without-phase-check");

  const codeChangeSummary = await callTool("easyar_generate_code_change_summary", {
    projectPath,
    sampleId: "image-tracking",
    goal: "Audit risky Image Tracking code changes before Unity compilation.",
    targetFiles: ["Assets/Scripts/RiskyEasyARController.cs"],
    notes: "Temporary code review note. appSecret=should-not-leak"
  });
  assertTextIncludes(codeChangeSummary, "hardcoded-easyar-secret");
  assertTextIncludes(codeChangeSummary, "appSecret=<redacted>");
  assertTextIncludes(codeChangeSummary, "easyar_run_unity_compile_check");

  const writtenCodeChange = await callTool("easyar_write_code_change_summary", {
    projectPath,
    sampleId: "image-tracking",
    goal: "Summarize risky Image Tracking code changes.",
    targetFiles: ["Assets/Scripts/RiskyEasyARController.cs"]
  });
  assertTextIncludes(writtenCodeChange, "CODE_CHANGE.md");
  const codeChangeMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "image-tracking", "CODE_CHANGE.md"),
    "utf8"
  );
  assert(codeChangeMarkdown.includes("EasyAR Focused Code Change - Image Tracking"), "Code change markdown should include title");
  assert(codeChangeMarkdown.includes("hardcoded-easyar-secret"), "Code change markdown should include static review issue");

  const riskyRunReport = await callTool("easyar_generate_run_report", {
    projectPath,
    sampleId: "image-tracking",
    maxScriptIssues: 10
  });
  assertTextIncludes(riskyRunReport, "scriptReview");
  assertTextIncludes(riskyRunReport, "Fix static C# review issues before compiling in Unity");

  const logAnalysis = await callTool("easyar_analyze_unity_log", {
    logText: [
      "Assets/Scripts/Foo.cs(10,7): error CS0246: The type or namespace name 'EasyAR' could not be found",
      "Camera permission denied by user"
    ].join("\n")
  });
  assertTextIncludes(logAnalysis, "Unity C# compilation error");
  assertTextIncludes(logAnalysis, "Camera permission problem");

  const imageTrackingLogAnalysis = await callTool("easyar_analyze_unity_log", {
    sampleId: "image-tracking",
    logText: "ImageTarget load failed: target database missing"
  });
  assertTextIncludes(imageTrackingLogAnalysis, "image-tracking-target-load");
  assertTextIncludes(imageTrackingLogAnalysis, "\"id\": \"image-tracking\"");

  const cloudLogAnalysis = await callTool("easyar_analyze_unity_log", {
    sampleId: "cloud-recognition",
    logText: "CloudRecognizer unauthorized: appKey invalid"
  });
  assertTextIncludes(cloudLogAnalysis, "cloud-recognition-credentials");
  assertTextIncludes(cloudLogAnalysis, "\"id\": \"cloud-recognition\"");

  await mkdir(path.join(projectPath, "Logs"), { recursive: true });
  await writeFile(
    path.join(projectPath, "Logs", "Editor.log"),
    "CloudRecognizer network timeout while requesting cloud recognition service",
    "utf8"
  );
  const latestLogAnalysis = await callTool("easyar_analyze_latest_unity_log", {
    projectPath,
    sampleId: "cloud-recognition"
  });
  assertTextIncludes(latestLogAnalysis, "\"analyzed\": true");
  assertTextIncludes(latestLogAnalysis, "cloud-recognition-network");
  assertTextIncludes(latestLogAnalysis, "Editor.log");

  const supportBundle = await callTool("easyar_generate_support_bundle", {
    projectPath,
    sampleId: "cloud-recognition",
    platform: "android"
  });
  assertTextIncludes(supportBundle, "\"sample\"");
  assertTextIncludes(supportBundle, "\"latestLog\"");
  assertTextIncludes(supportBundle, "cloud-recognition-network");
  assertTextIncludes(supportBundle, "SUPPORT_BUNDLE.md");

  const writtenSupportBundle = await callTool("easyar_write_support_bundle", {
    projectPath,
    sampleId: "cloud-recognition",
    platform: "android"
  });
  assertTextIncludes(writtenSupportBundle, "SUPPORT_BUNDLE.md");
  const supportBundleMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "cloud-recognition", "SUPPORT_BUNDLE.md"),
    "utf8"
  );
  assert(supportBundleMarkdown.includes("EasyAR Focused Support Bundle - Cloud Recognition"), "Support bundle markdown should include title");
  assert(supportBundleMarkdown.includes("Latest Unity Log"), "Support bundle markdown should include latest log section");
  assert(supportBundleMarkdown.includes("cloud-recognition-network"), "Support bundle markdown should include focused log issue");

  const runResult = await callTool("easyar_generate_run_result", {
    projectPath,
    sampleId: "cloud-recognition",
    platform: "android",
    overallStatus: "blocked",
    buildOutputPath: "Builds/cloud-recognition.apk",
    notes: "Device run blocked by network timeout. appSecret=should-not-leak",
    steps: [
      {
        name: "Unity compile",
        status: "passed",
        evidence: "Logs/mcp-easyar-CompileCheck.log"
      },
      {
        name: "Device validation",
        status: "blocked",
        evidence: "CloudRecognizer network timeout",
        nextAction: "Verify network access and Cloud Recognition service region."
      }
    ]
  });
  assertTextIncludes(runResult, "\"overallStatus\": \"blocked\"");
  assertTextIncludes(runResult, "Verify network access and Cloud Recognition service region");
  assertTextIncludes(runResult, "appSecret=<redacted>");

  const writtenRunResult = await callTool("easyar_write_run_result", {
    projectPath,
    sampleId: "cloud-recognition",
    platform: "android",
    overallStatus: "blocked",
    notes: "Cloud validation blocked. appKey=should-not-leak",
    steps: [
      {
        name: "Cloud Recognition device validation",
        status: "blocked",
        evidence: "CloudRecognizer network timeout",
        nextAction: "Retry on a real device network and inspect device logs."
      }
    ]
  });
  assertTextIncludes(writtenRunResult, "RUN_RESULT.md");
  const runResultMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "cloud-recognition", "RUN_RESULT.md"),
    "utf8"
  );
  assert(runResultMarkdown.includes("EasyAR Focused Run Result - Cloud Recognition"), "Run result markdown should include title");
  assert(runResultMarkdown.includes("Overall status: blocked"), "Run result markdown should include overall status");
  assert(runResultMarkdown.includes("appKey=<redacted>"), "Run result markdown should redact sensitive notes");

  const cloudDeviceValidation = await callTool("easyar_generate_device_validation_checklist", {
    projectPath,
    sampleId: "cloud-recognition",
    platform: "ios",
    device: "iPhone test device",
    buildOutputPath: "Builds/iOS/cloud-recognition"
  });
  assertTextIncludes(cloudDeviceValidation, "\"readyForDeviceValidation\": false");
  assertTextIncludes(cloudDeviceValidation, "cloud-recognition-network");
  assertTextIncludes(cloudDeviceValidation, "cloud-recognition-result");

  const artifactIndex = await callTool("easyar_generate_artifact_index", {
    projectPath,
    sampleId: "cloud-recognition"
  });
  assertTextIncludes(artifactIndex, "SUPPORT_BUNDLE.md");
  assertTextIncludes(artifactIndex, "IMPORT_CHECKLIST.md");
  assertTextIncludes(artifactIndex, "DEVICE_VALIDATION.md");
  assertTextIncludes(artifactIndex, "CODE_PLAN.md");
  assertTextIncludes(artifactIndex, "ARTIFACT_INDEX.md");

  const writtenArtifactIndex = await callTool("easyar_write_artifact_index", {
    projectPath,
    sampleId: "cloud-recognition"
  });
  assertTextIncludes(writtenArtifactIndex, "ARTIFACT_INDEX.md");
  const artifactIndexMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "cloud-recognition", "ARTIFACT_INDEX.md"),
    "utf8"
  );
  assert(artifactIndexMarkdown.includes("EasyAR Focused Artifact Index - Cloud Recognition"), "Artifact index markdown should include title");
  assert(artifactIndexMarkdown.includes("Recommended Reading Order"), "Artifact index markdown should include reading order");
  assert(artifactIndexMarkdown.includes("SUPPORT_BUNDLE.md"), "Artifact index markdown should list support bundle");

  await rm(projectPath, { recursive: true, force: true });
  child.kill();
  console.log("MCP smoke test passed.");
} catch (error) {
  child.kill();
  console.error(stderr);
  console.error(error);
  process.exit(1);
}

function request(method, params) {
  const id = nextId++;
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timed out waiting for ${method}`));
    }, 10000);
    pending.set(id, (message) => {
      clearTimeout(timeout);
      if (message.error) {
        reject(new Error(JSON.stringify(message.error)));
      } else {
        resolve(message);
      }
    });
  });
}

function notify(method, params) {
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
}

function callTool(name, args) {
  return request("tools/call", {
    name,
    arguments: args
  });
}

function assertTextIncludes(response, expected) {
  const text = response.result.content.map((item) => item.text ?? "").join("\n");
  assert(text.includes(expected), `Expected response text to include ${expected}`);
}

function assertResourceIncludes(response, expected) {
  const text = response.result.contents.map((item) => item.text ?? "").join("\n");
  assert(text.includes(expected), `Expected resource text to include ${expected}`);
}

function assertPromptIncludes(response, expected) {
  const text = response.result.messages.map((message) => message.content.text ?? "").join("\n");
  assert(text.includes(expected), `Expected prompt text to include ${expected}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function createUnityProject() {
  const projectPath = await mkdtemp(path.join(tmpdir(), "easyar-mcp-smoke-"));
  await mkdir(path.join(projectPath, "Assets"), { recursive: true });
  await mkdir(path.join(projectPath, "Packages"), { recursive: true });
  await mkdir(path.join(projectPath, "ProjectSettings"), { recursive: true });
  await writeFile(path.join(projectPath, "Packages", "manifest.json"), "{\"dependencies\":{}}\n", "utf8");
  await writeFile(path.join(projectPath, "ProjectSettings", "ProjectVersion.txt"), "m_EditorVersion: 2022.3.62f1\n", "utf8");
  return projectPath;
}
