import { chmod, copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const command = process.env.MCP_EASYAR_SMOKE_COMMAND ?? process.execPath;
const args = process.env.MCP_EASYAR_SMOKE_COMMAND
  ? []
  : [path.resolve("dist/index.js")];
const unityCandidateRoot = await mkdtemp(path.join(tmpdir(), "mcp-easyar-unity-candidates-"));
const fakeHubUnityPath = path.join(unityCandidateRoot, "2022.3.62f1", "Unity.app", "Contents", "MacOS", "Unity");
await mkdir(path.dirname(fakeHubUnityPath), { recursive: true });
await writeFile(fakeHubUnityPath, "#!/bin/sh\nexit 0\n", "utf8");
await chmod(fakeHubUnityPath, 0o755);
const child = spawn(command, args, {
  env: {
    ...process.env,
    EASYAR_API_BASE_URL: "https://www.easyar.cn",
    EASYAR_API_TOKEN: "",
    EASYAR_ACCOUNT_TOKEN: "env-test-account-token",
    EASYAR_LICENSE_KEY: "env-test-license-key",
    EASYAR_BUNDLE_IDENTIFIER: "com.easyar.envsample",
    EASYAR_ACCOUNT_STATUS_ENDPOINT: "",
    EASYAR_LICENSE_VALIDATE_ENDPOINT: "",
    EASYAR_DOWNLOADS_ENDPOINT: "",
    EASYAR_CLOUD_CREDENTIALS_ENDPOINT: "",
    EASYAR_UNITY_PATH: "",
    EASYAR_UNITY_CANDIDATE_DIRS: unityCandidateRoot,
    EASYAR_RELEASE_PROJECT_PATH: "",
    EASYAR_RELEASE_PLATFORM: ""
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
    tools.result.tools.some((tool) => tool.name === "easyar_create_local_config_bridge"),
    "easyar_create_local_config_bridge should be listed"
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
    tools.result.tools.some((tool) => tool.name === "easyar_generate_programming_context"),
    "easyar_generate_programming_context should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_programming_context"),
    "easyar_write_programming_context should be listed"
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
    tools.result.tools.some((tool) => tool.name === "easyar_write_unity_environment_report"),
    "easyar_write_unity_environment_report should be listed"
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
    tools.result.tools.some((tool) => tool.name === "easyar_generate_official_api_contract"),
    "easyar_generate_official_api_contract should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_official_api_contract"),
    "easyar_write_official_api_contract should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_generate_official_openapi_contract"),
    "easyar_generate_official_openapi_contract should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_official_openapi_contract"),
    "easyar_write_official_openapi_contract should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_official_api_handoff"),
    "easyar_official_api_handoff should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_official_api_handoff"),
    "easyar_write_official_api_handoff should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_check_official_access"),
    "easyar_check_official_access should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_official_access_report"),
    "easyar_write_official_access_report should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_check_client_setup"),
    "easyar_check_client_setup should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_client_setup"),
    "easyar_write_client_setup should be listed"
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
    tools.result.tools.some((tool) => tool.name === "easyar_generate_focused_handoff_pack"),
    "easyar_generate_focused_handoff_pack should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_focused_handoff_pack"),
    "easyar_write_focused_handoff_pack should be listed"
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
    tools.result.tools.some((tool) => tool.name === "easyar_generate_device_run_result_form"),
    "easyar_generate_device_run_result_form should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_device_run_result_form"),
    "easyar_write_device_run_result_form should be listed"
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
    tools.result.tools.some((tool) => tool.name === "easyar_generate_completion_report"),
    "easyar_generate_completion_report should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_completion_report"),
    "easyar_write_completion_report should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_generate_focused_scope_status"),
    "easyar_generate_focused_scope_status should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_focused_scope_status"),
    "easyar_write_focused_scope_status should be listed"
  );
  for (const androidTool of [
    "easyar_generate_android_device_runbook",
    "easyar_write_android_device_runbook",
    "easyar_android_device_status",
    "easyar_android_install_apk",
    "easyar_android_start_app",
    "easyar_android_collect_logcat"
  ]) {
    assert(
      tools.result.tools.some((tool) => tool.name === androidTool),
      `${androidTool} should be listed`
    );
  }
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_generate_issue_report"),
    "easyar_generate_issue_report should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_issue_report"),
    "easyar_write_issue_report should be listed"
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
    tools.result.tools.some((tool) => tool.name === "easyar_production_validation"),
    "easyar_production_validation should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_production_validation"),
    "easyar_write_production_validation should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_release_manifest"),
    "easyar_release_manifest should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_release_manifest"),
    "easyar_write_release_manifest should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_first_run_guide"),
    "easyar_first_run_guide should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_first_run_guide"),
    "easyar_write_first_run_guide should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_onboarding_report"),
    "easyar_onboarding_report should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_onboarding_report"),
    "easyar_write_onboarding_report should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_generate_project_handoff"),
    "easyar_generate_project_handoff should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_project_handoff"),
    "easyar_write_project_handoff should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_remaining_work_report"),
    "easyar_remaining_work_report should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_remaining_work_report"),
    "easyar_write_remaining_work_report should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_generate_focused_preflight"),
    "easyar_generate_focused_preflight should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_focused_preflight"),
    "easyar_write_focused_preflight should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_account_onboarding"),
    "easyar_account_onboarding should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_account_onboarding"),
    "easyar_write_account_onboarding should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_account_materials"),
    "easyar_account_materials should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_account_materials"),
    "easyar_write_account_materials should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_portal_evidence"),
    "easyar_portal_evidence should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_portal_evidence"),
    "easyar_write_portal_evidence should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_next_workflow_step"),
    "easyar_next_workflow_step should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_workflow_state"),
    "easyar_write_workflow_state should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_generate_import_checklist"),
    "easyar_generate_import_checklist should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_import_checklist"),
    "easyar_write_import_checklist should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_generate_sample_import_guide"),
    "easyar_generate_sample_import_guide should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_sample_import_guide"),
    "easyar_write_sample_import_guide should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_import_sample_from_package_cache"),
    "easyar_import_sample_from_package_cache should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_generate_local_config_form"),
    "easyar_generate_local_config_form should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_local_config_form"),
    "easyar_write_local_config_form should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_local_config_from_env"),
    "easyar_write_local_config_from_env should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_local_config_handoff"),
    "easyar_local_config_handoff should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_local_config_handoff"),
    "easyar_write_local_config_handoff should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_generate_config_integration_audit"),
    "easyar_generate_config_integration_audit should be listed"
  );
  assert(
    tools.result.tools.some((tool) => tool.name === "easyar_write_config_integration_audit"),
    "easyar_write_config_integration_audit should be listed"
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
  assert(
    prompts.result.prompts.some((prompt) => prompt.name === "easyar-validate-official-endpoints"),
    "easyar-validate-official-endpoints prompt should be listed"
  );
  assert(
    prompts.result.prompts.some((prompt) => prompt.name === "easyar-close-focused-scope"),
    "easyar-close-focused-scope prompt should be listed"
  );

  const imageTrackingPrompt = await request("prompts/get", {
    name: "easyar-run-image-tracking",
    arguments: {
      projectPath: "/tmp/EasyARProject",
      platform: "android"
    }
  });
  assertPromptIncludes(imageTrackingPrompt, "easyar_write_focused_preflight");
  assertPromptIncludes(imageTrackingPrompt, "PREFLIGHT.md");
  assertPromptIncludes(imageTrackingPrompt, "sampleId=image-tracking");

  const programmingPrompt = await request("prompts/get", {
    name: "easyar-unity-programming-assistant",
    arguments: {
      projectPath: "/tmp/EasyARProject",
      sampleId: "cloud-recognition"
    }
  });
  assertPromptIncludes(programmingPrompt, "easyar_write_programming_context");
  assertPromptIncludes(programmingPrompt, "easyar://workflow/programming");
  assertPromptIncludes(programmingPrompt, "PROGRAMMING_CONTEXT.md");

  const officialEndpointPrompt = await request("prompts/get", {
    name: "easyar-validate-official-endpoints",
    arguments: {
      projectPath: "/tmp/EasyARProject",
      platform: "android"
    }
  });
  assertPromptIncludes(officialEndpointPrompt, "easyar://official/api-contract");
  assertPromptIncludes(officialEndpointPrompt, "easyar_check_official_access");

  const focusedScopePrompt = await request("prompts/get", {
    name: "easyar-close-focused-scope",
    arguments: {
      projectPath: "/tmp/EasyARProject",
      platform: "android"
    }
  });
  assertPromptIncludes(focusedScopePrompt, "easyar://workflow/focused-scope");
  assertPromptIncludes(focusedScopePrompt, "easyar_write_focused_scope_status");

  const status = await callTool("easyar_server_status", {});
  assertTextIncludes(status, "\"name\": \"mcp-easyar\"");
  assertTextIncludes(status, "\"preflightFirst\": true");
  assertTextIncludes(status, "easyar_first_run_guide accountStage=not-registered");
  assertTextIncludes(status, "easyar_account_onboarding accountStage=not-registered");
  assertTextIncludes(status, "easyar_write_focused_preflight");
  assertTextIncludes(status, "PREFLIGHT.md");
  assertTextIncludes(status, "easyar_write_programming_context");
  assertTextIncludes(status, "PROGRAMMING_CONTEXT.md");
  assertTextIncludes(status, "\"focusedSamples\"");
  assertTextIncludes(status, "\"cloud-recognition\"");
  assertTextIncludes(status, "account-scoped SDK download discovery");

  const officialInfo = await callTool("easyar_official_info", {});
  assertTextIncludes(officialInfo, "easyarSenseUnityPlugin");

  const quickstart = await request("resources/read", {
    uri: "easyar://workflow/quickstart"
  });
  assertResourceIncludes(quickstart, "easyar_write_focused_preflight");
  assertResourceIncludes(quickstart, "PREFLIGHT.md");
  assertResourceIncludes(quickstart, "PROGRAMMING_CONTEXT.md");

  const officialApiContractResource = await request("resources/read", {
    uri: "easyar://official/api-contract"
  });
  assertResourceIncludes(officialApiContractResource, "mcp-easyar Official API Contract");
  assertResourceIncludes(officialApiContractResource, "cloud-credentials-discovery");
  assertResourceIncludes(officialApiContractResource, "Responses must not include raw license keys");

  const officialOpenApiResource = await request("resources/read", {
    uri: "easyar://official/openapi"
  });
  assertResourceIncludes(officialOpenApiResource, "\"openapi\": \"3.1.0\"");
  assertResourceIncludes(officialOpenApiResource, "\"/mcp/cloud-recognition/credentials\"");
  assertResourceIncludes(officialOpenApiResource, "\"EasyARBearerAuth\"");

  const focusedScopeResource = await request("resources/read", {
    uri: "easyar://workflow/focused-scope"
  });
  assertResourceIncludes(focusedScopeResource, "EasyAR Focused Scope Workflow");
  assertResourceIncludes(focusedScopeResource, "easyar_write_focused_scope_status");
  assertResourceIncludes(focusedScopeResource, "allFocusedSamplesComplete=true");

  const programmingWorkflowResource = await request("resources/read", {
    uri: "easyar://workflow/programming"
  });
  assertResourceIncludes(programmingWorkflowResource, "EasyAR Unity Programming Workflow");
  assertResourceIncludes(programmingWorkflowResource, "easyar_write_config_integration_audit");
  assertResourceIncludes(programmingWorkflowResource, "CODE_CHANGE.md");
  assertResourceIncludes(programmingWorkflowResource, "Never hardcode EasyAR license keys");

  const authStatus = await callTool("easyar_auth_status", {});
  assertTextIncludes(authStatus, "\"hasToken\": false");
  assertTextIncludes(authStatus, "\"accountStatusEndpointConfigured\": false");
  assertTextIncludes(authStatus, "Secret values are never returned");
  assertTextIncludes(authStatus, "\"downloadsEndpointConfigured\": false");
  assertTextIncludes(authStatus, "\"cloudCredentialsEndpointConfigured\": false");

  const officialApiContract = await callTool("easyar_generate_official_api_contract", {
    baseUrl: "https://www.easyar.cn",
    includeExamples: true
  });
  assertTextIncludes(officialApiContract, "\"id\": \"account-status\"");
  assertTextIncludes(officialApiContract, "\"envName\": \"EASYAR_LICENSE_VALIDATE_ENDPOINT\"");
  assertTextIncludes(officialApiContract, "\"apiKeyPresent\"");
  assertTextIncludes(officialApiContract, "\"readyForProductionOfficialAccess\": false");
  assertTextIncludes(officialApiContract, "Responses must not include raw license keys");

  const firstRunGuide = await callTool("easyar_first_run_guide", {
    sampleId: "cloud-recognition",
    accountStage: "not-registered",
    platform: "android"
  });
  assertTextIncludes(firstRunGuide, "\"firstQuestion\": \"Do you already have an EasyAR account?\"");
  assertTextIncludes(firstRunGuide, "\"stage\": \"not-registered\"");
  assertTextIncludes(firstRunGuide, "\"readyForUnityAutomation\": false");
  assertTextIncludes(firstRunGuide, "\"tool\": \"easyar_write_first_run_guide\"");
  assertTextIncludes(firstRunGuide, "https://www.easyar.cn/");
  assertTextIncludes(firstRunGuide, "image-tracking");
  assertTextIncludes(firstRunGuide, "cloud-recognition");
  assertTextIncludes(firstRunGuide, "FIRST_RUN.md");
  assertTextIncludes(firstRunGuide, "Do not paste or commit");

  const firstRunGuideRoot = await createUnityProject();
  const writtenFirstRunGuide = await callTool("easyar_write_first_run_guide", {
    projectPath: firstRunGuideRoot,
    sampleId: "cloud-recognition",
    accountStage: "not-registered",
    platform: "android"
  });
  assertTextIncludes(writtenFirstRunGuide, "FIRST_RUN.md");
  assertTextIncludes(writtenFirstRunGuide, "\"readyForUnityAutomation\": false");
  assertTextIncludes(writtenFirstRunGuide, "\"tool\": \"easyar_write_account_onboarding\"");
  const firstRunGuideMarkdown = await readFile(
    path.join(firstRunGuideRoot, "Assets", "EasyARGenerated", "FIRST_RUN.md"),
    "utf8"
  );
  assert(firstRunGuideMarkdown.includes("EasyAR First Run"), "First-run markdown should include title");
  assert(firstRunGuideMarkdown.includes("Ready for Unity automation: no"), "First-run markdown should block Unity automation for unregistered users");
  assert(firstRunGuideMarkdown.includes("Tool: `easyar_write_account_onboarding`"), "First-run markdown should include top next onboarding call");
  assert(firstRunGuideMarkdown.includes("Active samples: image-tracking, cloud-recognition"), "First-run markdown should include focused sample scope");
  assert(firstRunGuideMarkdown.includes("Artifact Reading Order"), "First-run markdown should include artifact reading order");
  assert(firstRunGuideMarkdown.includes("PORTAL_EVIDENCE.md"), "First-run markdown should include portal evidence in artifact reading order");
  assert(firstRunGuideMarkdown.includes("https://www.easyar.cn/"), "First-run markdown should include official website");
  assert(!firstRunGuideMarkdown.includes("env-test-account-token"), "First-run markdown should not include account token");
  assert(!firstRunGuideMarkdown.includes("env-test-license-key"), "First-run markdown should not include license key");
  await rm(firstRunGuideRoot, { recursive: true, force: true });

  const accountOnboarding = await callTool("easyar_account_onboarding", {
    sampleId: "cloud-recognition",
    accountStage: "not-registered"
  });
  assertTextIncludes(accountOnboarding, "\"stage\": \"not-registered\"");
  assertTextIncludes(accountOnboarding, "https://www.easyar.cn/");
  assertTextIncludes(accountOnboarding, "Register an EasyAR account");
  assertTextIncludes(accountOnboarding, "Development Center entry");
  assertTextIncludes(accountOnboarding, "\"entryQuestion\": \"Do you already have an EasyAR account?\"");
  assertTextIncludes(accountOnboarding, "\"id\": \"new-user\"");
  assertTextIncludes(accountOnboarding, "easyar_write_account_onboarding projectPath=/path/to/UnityProject accountStage=registered-not-logged-in sampleId=cloud-recognition");
  assertTextIncludes(accountOnboarding, "SMS, email, or authenticator verification codes");
  assertTextIncludes(accountOnboarding, "MCP does not ask for or store EasyAR website passwords");

  const accountMaterials = await callTool("easyar_account_materials", {
    sampleId: "cloud-recognition"
  });
  assertTextIncludes(accountMaterials, "easyar.cloudRecognition.appSecret");
  assertTextIncludes(accountMaterials, "cloud-target-library");
  assertTextIncludes(accountMaterials, "cloud-test-target-image");
  assertTextIncludes(accountMaterials, "\"requiredForDeviceRun\": true");
  assertTextIncludes(accountMaterials, "Never paste into chat");
  assertTextIncludes(accountMaterials, "\"missingRequired\"");

  const portalEvidence = await callTool("easyar_portal_evidence", {
    sampleId: "cloud-recognition",
    platform: "android",
    accountName: "armall",
    apiKeyRecordId: "19639",
    apiKeyAppName: "ARMallTest",
    apiKeyCreatedAt: "2025-11-07 17:24",
    cloudServicesEnabled: ["cloud-recognition", "spatialmap", "mega-landmark", "ar-operations", "mega-block"],
    apiKeyPresent: true,
    apiSecretPresent: true,
    senseLicenseStatus: "missing",
    cloudLibraryStatus: "missing",
    cloudTargetCount: 0,
    portalUrl: "https://portal.easyar.cn/apikey/info/19639?token=should-not-leak",
    notes: [
      "Observed API KEY value a22141c97489953f9f57e0e7acf25b25 should redact",
      "Observed API Secret value ea54ff52a76c384c3b62e394ad6b281113507767faaa4b12218c7c48d89d904c should redact"
    ]
  });
  assertTextIncludes(portalEvidence, "\"apiKeyRecordId\": \"19639\"");
  assertTextIncludes(portalEvidence, "\"apiKeyPresent\": true");
  assertTextIncludes(portalEvidence, "\"cloudLibraryStatus\": \"missing\"");
  assertTextIncludes(portalEvidence, "cloud-library");
  assertTextIncludes(portalEvidence, "cloud-target-image");
  assertTextIncludes(portalEvidence, "<redacted>");
  assert(!extractText(portalEvidence).includes("a22141c97489953f9f57e0e7acf25b25"), "Portal evidence should redact API KEY-like values");
  assert(!extractText(portalEvidence).includes("ea54ff52a76c384c3b62e394ad6b281113507767faaa4b12218c7c48d89d904c"), "Portal evidence should redact API Secret-like values");
  assert(!extractText(portalEvidence).includes("should-not-leak"), "Portal evidence should redact URL query strings");

  const portalEvidenceRoot = await createUnityProject();
  const writtenPortalEvidence = await callTool("easyar_write_portal_evidence", {
    projectPath: portalEvidenceRoot,
    sampleId: "cloud-recognition",
    platform: "android",
    accountName: "armall",
    apiKeyRecordId: "19639",
    apiKeyAppName: "ARMallTest",
    cloudServicesEnabled: ["cloud-recognition"],
    apiKeyPresent: true,
    apiSecretPresent: true,
    senseLicenseStatus: "missing",
    cloudLibraryStatus: "missing",
    cloudTargetCount: 0
  });
  assertTextIncludes(writtenPortalEvidence, "PORTAL_EVIDENCE.md");
  const portalEvidenceMarkdown = await readFile(
    path.join(portalEvidenceRoot, "Assets", "EasyARGenerated", "PORTAL_EVIDENCE.md"),
    "utf8"
  );
  assert(portalEvidenceMarkdown.includes("EasyAR Portal Evidence"), "Portal evidence markdown should include title");
  assert(portalEvidenceMarkdown.includes("API KEY record id: 19639"), "Portal evidence markdown should include non-secret API KEY record id");
  assert(portalEvidenceMarkdown.includes("Cloud library status: missing"), "Portal evidence markdown should include cloud library status");
  assert(portalEvidenceMarkdown.includes("No Cloud Recognition image library was observed"), "Portal evidence markdown should include library blocker");
  assert(!portalEvidenceMarkdown.includes("a22141c97489953f9f57e0e7acf25b25"), "Portal evidence markdown should not include API KEY-like values");
  await rm(portalEvidenceRoot, { recursive: true, force: true });

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

  const officialAccessProjectPath = await createUnityProject();
  const writtenOfficialApiContract = await callTool("easyar_write_official_api_contract", {
    workspacePath: officialAccessProjectPath,
    relativePath: "EasyARGenerated/OFFICIAL_API_CONTRACT.md",
    baseUrl: "https://www.easyar.cn"
  });
  assertTextIncludes(writtenOfficialApiContract, "OFFICIAL_API_CONTRACT.md");
  const officialApiContractMarkdown = await readFile(
    path.join(officialAccessProjectPath, "EasyARGenerated", "OFFICIAL_API_CONTRACT.md"),
    "utf8"
  );
  assert(officialApiContractMarkdown.includes("mcp-easyar Official API Contract"), "Official API contract markdown should include title");
  assert(officialApiContractMarkdown.includes("cloud-credentials-discovery"), "Official API contract markdown should include cloud endpoint");
  assert(officialApiContractMarkdown.includes("Responses must not include raw license keys"), "Official API contract markdown should include response policy");

  const officialOpenApiContract = await callTool("easyar_generate_official_openapi_contract", {});
  assertTextIncludes(officialOpenApiContract, "\"openapi\": \"3.1.0\"");
  assertTextIncludes(officialOpenApiContract, "\"/mcp/cloud-recognition/credentials\"");
  assertTextIncludes(officialOpenApiContract, "\"resourceUri\": \"easyar://official/openapi\"");
  assertTextIncludes(officialOpenApiContract, "does not contain EasyAR tokens");

  const writtenOfficialOpenApiContract = await callTool("easyar_write_official_openapi_contract", {
    workspacePath: officialAccessProjectPath,
    relativePath: "EasyARGenerated/easyar-mcp-account-api.openapi.json"
  });
  assertTextIncludes(writtenOfficialOpenApiContract, "easyar-mcp-account-api.openapi.json");
  assertTextIncludes(writtenOfficialOpenApiContract, "\"pathCount\": 4");
  const officialOpenApiContractJson = await readFile(
    path.join(officialAccessProjectPath, "EasyARGenerated", "easyar-mcp-account-api.openapi.json"),
    "utf8"
  );
  assert(officialOpenApiContractJson.includes("\"openapi\": \"3.1.0\""), "Written OpenAPI contract should include OpenAPI version");
  assert(officialOpenApiContractJson.includes("\"EasyARBearerAuth\""), "Written OpenAPI contract should include bearer auth scheme");

  const officialApiHandoff = await callTool("easyar_official_api_handoff", {
    baseUrl: "https://www.easyar.cn",
    deploymentTarget: "staging"
  });
  assertTextIncludes(officialApiHandoff, "\"deploymentTarget\": \"staging\"");
  assertTextIncludes(officialApiHandoff, "account-status");
  assertTextIncludes(officialApiHandoff, "license-validation");
  assertTextIncludes(officialApiHandoff, "downloads-discovery");
  assertTextIncludes(officialApiHandoff, "cloud-credentials-discovery");
  assertTextIncludes(officialApiHandoff, "curl -fsS");
  assertTextIncludes(officialApiHandoff, "Response never includes raw API KEY/API Secret, appKey, or appSecret values");
  assert(!extractText(officialApiHandoff).includes("fixture-token"), "Official API handoff should not include fixture token values");

  const writtenOfficialApiHandoff = await callTool("easyar_write_official_api_handoff", {
    workspacePath: officialAccessProjectPath,
    relativePath: "EasyARGenerated/OFFICIAL_API_HANDOFF.md",
    baseUrl: "https://www.easyar.cn",
    deploymentTarget: "staging"
  });
  assertTextIncludes(writtenOfficialApiHandoff, "OFFICIAL_API_HANDOFF.md");
  const officialApiHandoffMarkdown = await readFile(
    path.join(officialAccessProjectPath, "EasyARGenerated", "OFFICIAL_API_HANDOFF.md"),
    "utf8"
  );
  assert(officialApiHandoffMarkdown.includes("mcp-easyar Official API Handoff"), "Official API handoff markdown should include title");
  assert(officialApiHandoffMarkdown.includes("Endpoint Mapping"), "Official API handoff markdown should include endpoint mapping");
  assert(officialApiHandoffMarkdown.includes("Acceptance Gates"), "Official API handoff markdown should include acceptance gates");
  assert(officialApiHandoffMarkdown.includes("Do not fall back to scraping EasyAR website sessions"), "Official API handoff markdown should include no-bypass policy");
  assert(!officialApiHandoffMarkdown.includes("fixture-token"), "Official API handoff markdown should not include fixture token values");

  const officialAccessNoProject = await callTool("easyar_check_official_access", {
    projectPath: officialAccessProjectPath,
    sampleId: "cloud-recognition",
    platform: "android"
  });
  await rm(officialAccessProjectPath, { recursive: true, force: true });
  assertTextIncludes(officialAccessNoProject, "\"readyForOfficialContent\": false");
  assertTextIncludes(officialAccessNoProject, "account-status");
  assertTextIncludes(officialAccessNoProject, "license-validation");
  assertTextIncludes(officialAccessNoProject, "downloads-discovery");
  assertTextIncludes(officialAccessNoProject, "cloud-credentials-discovery");

  const clientConfig = await callTool("easyar_generate_client_config", {
    client: "claude-desktop",
    serverPath: "/tmp/mcp-easyar/dist/index.js"
  });
  assertTextIncludes(clientConfig, "\"mcpServers\"");
  assertTextIncludes(clientConfig, "your_registered_user_token");

  const npxClientConfig = await callTool("easyar_generate_client_config", {
    client: "codex",
    entrypointMode: "npx",
    includeTokenPlaceholder: false
  });
  assertTextIncludes(npxClientConfig, "\"entrypointMode\": \"npx\"");
  assertTextIncludes(npxClientConfig, "\"command\": \"npx\"");
  assertTextIncludes(npxClientConfig, "mcp-easyar");
  assert(!extractText(npxClientConfig).includes("your_registered_user_token"), "npx client config should omit token placeholder when requested");

  const clientSetup = await callTool("easyar_check_client_setup", {
    client: "claude-desktop",
    serverPath: path.resolve("dist/index.js")
  });
  assertTextIncludes(clientSetup, "\"readyForClientConnection\": true");
  assertTextIncludes(clientSetup, "\"client\": \"claude-desktop\"");
  assertTextIncludes(clientSetup, "\"mcpServers\"");
  assertTextIncludes(clientSetup, "\"acceptanceChecklist\"");
  assertTextIncludes(clientSetup, "easyar_server_status");
  assertTextIncludes(clientSetup, "\"configDestination\"");

  const packageBinClientSetup = await callTool("easyar_check_client_setup", {
    client: "generic-json",
    entrypointMode: "package-bin"
  });
  assertTextIncludes(packageBinClientSetup, "\"entrypointMode\": \"package-bin\"");
  assertTextIncludes(packageBinClientSetup, "\"command\": \"easyar-mcp\"");
  assertTextIncludes(packageBinClientSetup, "\"serverPath\": null");

  const clientSetupRoot = await createUnityProject();
  const writtenClientSetup = await callTool("easyar_write_client_setup", {
    outputRoot: clientSetupRoot,
    client: "codex",
    serverPath: path.resolve("dist/index.js")
  });
  assertTextIncludes(writtenClientSetup, "CLIENT_SETUP.md");
  const clientSetupMarkdown = await readFile(
    path.join(clientSetupRoot, "Assets", "EasyARGenerated", "CLIENT_SETUP.md"),
    "utf8"
  );
  assert(clientSetupMarkdown.includes("mcp-easyar Client Setup"), "Client setup markdown should include title");
  assert(clientSetupMarkdown.includes("\"mcpServers\""), "Client setup markdown should include MCP config");
  assert(clientSetupMarkdown.includes("Entrypoint mode: local-dist"), "Client setup markdown should include entrypoint mode");
  assert(clientSetupMarkdown.includes("Acceptance Checklist"), "Client setup markdown should include acceptance checklist");
  assert(clientSetupMarkdown.includes("First Smoke Calls"), "Client setup markdown should include first smoke calls");
  assert(clientSetupMarkdown.includes("easyar_server_status"), "Client setup markdown should include first status call");
  assert(clientSetupMarkdown.includes("Troubleshooting"), "Client setup markdown should include troubleshooting");
  await rm(clientSetupRoot, { recursive: true, force: true });

  const committedClientSetupGuide = await readFile(
    path.join(process.cwd(), "docs", "client-setup.md"),
    "utf8"
  );
  assert(committedClientSetupGuide.includes("mcp-easyar Client Setup"), "Client setup guide should include title");
  assert(committedClientSetupGuide.includes("entrypointMode=package-bin"), "Client setup guide should include package-bin profile");
  assert(committedClientSetupGuide.includes("entrypointMode=npx"), "Client setup guide should include npx profile");
  assert(committedClientSetupGuide.includes("easyar-mcp-check"), "Client setup guide should include install check bin");
  assert(committedClientSetupGuide.includes("Never paste these values into chat"), "Client setup guide should include secret handling");

  const deploymentReadiness = await callTool("easyar_deployment_readiness", {});
  assertTextIncludes(deploymentReadiness, "\"packageName\": \"mcp-easyar\"");
  assertTextIncludes(deploymentReadiness, "\"ready\": false");
  assertTextIncludes(deploymentReadiness, "package-files-dist");
  assertTextIncludes(deploymentReadiness, "bin-target");
  assertTextIncludes(deploymentReadiness, "release-manifest-install-profiles");
  assertTextIncludes(deploymentReadiness, "account-status-endpoint");
  assertTextIncludes(deploymentReadiness, "cloud-credentials-endpoint");
  assertTextIncludes(deploymentReadiness, "\"focusedSamples\"");

  const productionValidation = await callTool("easyar_production_validation", {});
  assertTextIncludes(productionValidation, "\"productionReady\": false");
  assertTextIncludes(productionValidation, "\"verificationEvidence\": \"not-provided\"");
  assertTextIncludes(productionValidation, "focused-scope-run-through");
  assertTextIncludes(productionValidation, "official-access/cloud-recognition");

  const productionValidationRoot = await createUnityProject();
  const writtenProductionValidation = await callTool("easyar_write_production_validation", {
    projectPath: productionValidationRoot
  });
  assertTextIncludes(writtenProductionValidation, "PRODUCTION_VALIDATION.md");
  const productionValidationMarkdown = await readFile(
    path.join(productionValidationRoot, "Assets", "EasyARGenerated", "PRODUCTION_VALIDATION.md"),
    "utf8"
  );
  assert(productionValidationMarkdown.includes("mcp-easyar Production Validation"), "Production validation markdown should include title");
  assert(productionValidationMarkdown.includes("Production ready: no"), "Production validation markdown should clearly mark incomplete production readiness");
  assert(productionValidationMarkdown.includes("Focused Image Tracking and Cloud Recognition run-through"), "Production validation markdown should include focused scope gate");
  await rm(productionValidationRoot, { recursive: true, force: true });

  const releaseManifest = await callTool("easyar_release_manifest", {});
  assertTextIncludes(releaseManifest, "\"name\": \"mcp-easyar\"");
  assertTextIncludes(releaseManifest, "\"binName\": \"easyar-mcp\"");
  assertTextIncludes(releaseManifest, "\"installProfiles\"");
  assertTextIncludes(releaseManifest, "npm install -g mcp-easyar");
  assertTextIncludes(releaseManifest, "npm run install:check");
  assertTextIncludes(releaseManifest, "npm run package:smoke");
  assertTextIncludes(releaseManifest, "official-api:canary");
  assertTextIncludes(releaseManifest, "npm run release:check");
  assertTextIncludes(releaseManifest, "npm run security:check");
  assertTextIncludes(releaseManifest, "easyar-mcp-check");
  assertTextIncludes(releaseManifest, "\"command\": \"npx\"");
  assertTextIncludes(releaseManifest, "easyar_check_client_setup");
  assertTextIncludes(releaseManifest, "image-tracking");
  assertTextIncludes(releaseManifest, "cloud-recognition");
  assertTextIncludes(releaseManifest, "docs/RELEASE_MANIFEST.md");
  assertTextIncludes(releaseManifest, ".env.example");
  assertTextIncludes(releaseManifest, "docs/OFFICIAL_API_CONTRACT.md");
  assertTextIncludes(releaseManifest, "docs/OFFICIAL_API_HANDOFF.md");
  assertTextIncludes(releaseManifest, "docs/openapi/easyar-mcp-account-api.openapi.json");
  assertTextIncludes(releaseManifest, "docs/client-setup.md");

  const committedReleaseManifest = await readFile(
    path.join(process.cwd(), "docs", "RELEASE_MANIFEST.md"),
    "utf8"
  );
  assert(committedReleaseManifest.includes("mcp-easyar Release Manifest"), "Committed release manifest should include title");
  assert(committedReleaseManifest.includes("easyar_check_client_setup"), "Committed release manifest should include first calls/client setup tools");
  assert(committedReleaseManifest.includes("Install Profiles"), "Committed release manifest should include install profiles");
  assert(committedReleaseManifest.includes("npm install -g mcp-easyar"), "Committed release manifest should include global install profile");
  assert(committedReleaseManifest.includes("npx -y mcp-easyar"), "Committed release manifest should include npx entrypoint");
  assert(committedReleaseManifest.includes("easyar-mcp-check"), "Committed release manifest should include install check bin");
  assert(committedReleaseManifest.includes("npm run package:smoke"), "Committed release manifest should include package install smoke");
  assert(committedReleaseManifest.includes("official-api:canary"), "Committed release manifest should include official API canary");
  assert(committedReleaseManifest.includes("npm run release:check"), "Committed release manifest should include release check");
  assert(committedReleaseManifest.includes("npm run security:check"), "Committed release manifest should include security check");
  assert(committedReleaseManifest.includes("EASYAR_RELEASE_REQUIRE_PRODUCTION_READY=1"), "Committed release manifest should include strict production gate");
  assert(committedReleaseManifest.includes("EASYAR_RELEASE_PROJECT_PATH"), "Committed release manifest should include release project evidence path env");
  assert(committedReleaseManifest.includes(".env.example"), "Committed release manifest should include env example");
  assert(committedReleaseManifest.includes("docs/OFFICIAL_API_HANDOFF.md"), "Committed release manifest should include official API handoff");
  assert(committedReleaseManifest.includes("docs/openapi/easyar-mcp-account-api.openapi.json"), "Committed release manifest should include OpenAPI contract");
  assert(committedReleaseManifest.includes("docs/client-setup.md"), "Committed release manifest should include client setup guide");

  const releaseCheckScript = await readFile(path.join(process.cwd(), "scripts", "release-check.mjs"), "utf8");
  assert(releaseCheckScript.includes("EASYAR_RELEASE_PROJECT_PATH"), "release:check should accept a focused sample evidence project path");
  assert(releaseCheckScript.includes("EASYAR_RELEASE_PLATFORM"), "release:check should accept a focused sample evidence platform");
  const officialApiCanaryScript = await readFile(path.join(process.cwd(), "scripts", "official-api-canary.mjs"), "utf8");
  assert(officialApiCanaryScript.includes("easyar_check_official_access"), "Official API canary should check focused sample official access");
  assert(officialApiCanaryScript.includes("easyar_production_validation"), "Official API canary should check production validation");

  const releaseManifestRoot = await createUnityProject();
  const writtenReleaseManifest = await callTool("easyar_write_release_manifest", {
    outputRoot: releaseManifestRoot
  });
  assertTextIncludes(writtenReleaseManifest, "RELEASE_MANIFEST.md");
  const releaseManifestMarkdown = await readFile(
    path.join(releaseManifestRoot, "docs", "RELEASE_MANIFEST.md"),
    "utf8"
  );
  assert(releaseManifestMarkdown.includes("mcp-easyar Release Manifest"), "Release manifest markdown should include title");
  assert(releaseManifestMarkdown.includes("easyar-mcp"), "Release manifest markdown should include bin name");
  assert(releaseManifestMarkdown.includes("easyar-mcp-check"), "Release manifest markdown should include install check bin");
  assert(releaseManifestMarkdown.includes("Install Profiles"), "Release manifest markdown should include install profiles");
  assert(releaseManifestMarkdown.includes("entrypointMode=package-bin"), "Release manifest markdown should include package-bin client config");
  assert(releaseManifestMarkdown.includes("docs/openapi/easyar-mcp-account-api.openapi.json"), "Release manifest markdown should include OpenAPI contract");
  assert(releaseManifestMarkdown.includes("docs/client-setup.md"), "Release manifest markdown should include client setup guide");
  await rm(releaseManifestRoot, { recursive: true, force: true });

  const unityEnvironment = await callTool("easyar_unity_environment", {});
  assertTextIncludes(unityEnvironment, "\"pathCommand\": \"Unity\"");
  assertTextIncludes(unityEnvironment, "\"readyForUnityBatch\"");
  assertTextIncludes(unityEnvironment, fakeHubUnityPath);
  assertTextIncludes(unityEnvironment, "\"recommendedUnityPath\"");

  const projectPath = await createUnityProject();
  const writtenUnityEnvironment = await callTool("easyar_write_unity_environment_report", {
    projectPath,
    sampleId: "image-tracking"
  });
  assertTextIncludes(writtenUnityEnvironment, "UNITY_ENVIRONMENT.md");
  assertTextIncludes(writtenUnityEnvironment, "\"readyForUnityBatch\"");
  const unityEnvironmentMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "UNITY_ENVIRONMENT.md"),
    "utf8"
  );
  assert(unityEnvironmentMarkdown.includes("EasyAR Unity Environment"), "Unity environment markdown should include title");
  assert(unityEnvironmentMarkdown.includes("EASYAR_UNITY_PATH"), "Unity environment markdown should include env variable");
  assert(unityEnvironmentMarkdown.includes("EASYAR_UNITY_CANDIDATE_DIRS"), "Unity environment markdown should include candidate dirs variable");
  assert(unityEnvironmentMarkdown.includes("easyar_run_unity_compile_check"), "Unity environment markdown should include compile dry-run");

  const mismatchUnityProject = await createUnityProject();
  await writeFile(
    path.join(mismatchUnityProject, "ProjectSettings", "ProjectVersion.txt"),
    "m_EditorVersion: 6000.4.7f1\n",
    "utf8"
  );
  const mismatchUnityEnvironment = await callTool("easyar_write_unity_environment_report", {
    projectPath: mismatchUnityProject,
    sampleId: "image-tracking"
  });
  assertTextIncludes(mismatchUnityEnvironment, "\"readyForUnityBatch\": false");
  const mismatchUnityEnvironmentMarkdown = await readFile(
    path.join(mismatchUnityProject, "Assets", "EasyARGenerated", "UNITY_ENVIRONMENT.md"),
    "utf8"
  );
  assert(mismatchUnityEnvironmentMarkdown.includes("Recommended path matches project version: no"), "Unity environment markdown should show version mismatch");
  await rm(mismatchUnityProject, { recursive: true, force: true });

  const onboardingReport = await callTool("easyar_onboarding_report", {
    projectPath,
    sampleId: "image-tracking",
    client: "claude-desktop",
    entrypointMode: "npx",
    platform: "android",
    serverPath: path.resolve("dist/index.js")
  });
  assertTextIncludes(onboardingReport, "\"readyForFirstRun\": false");
  assertTextIncludes(onboardingReport, "\"entrypointMode\": \"npx\"");
  assertTextIncludes(onboardingReport, "\"area\": \"official-access\"");
  assertTextIncludes(onboardingReport, "\"tool\": \"easyar_check_official_access\"");

  const writtenOnboarding = await callTool("easyar_write_onboarding_report", {
    projectPath,
    sampleId: "image-tracking",
    client: "claude-desktop",
    platform: "android",
    serverPath: path.resolve("dist/index.js")
  });
  assertTextIncludes(writtenOnboarding, "ONBOARDING.md");
  const onboardingMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "image-tracking", "ONBOARDING.md"),
    "utf8"
  );
  assert(onboardingMarkdown.includes("EasyAR Onboarding - Image Tracking"), "Onboarding markdown should include title");
  assert(onboardingMarkdown.includes("official-access"), "Onboarding markdown should include official access blockers");

  const writtenAccountOnboarding = await callTool("easyar_write_account_onboarding", {
    projectPath,
    sampleId: "cloud-recognition",
    accountStage: "not-registered"
  });
  assertTextIncludes(writtenAccountOnboarding, "ACCOUNT_ONBOARDING.md");
  const accountOnboardingMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "ACCOUNT_ONBOARDING.md"),
    "utf8"
  );
  assert(accountOnboardingMarkdown.includes("EasyAR Account Onboarding"), "Account onboarding markdown should include title");
  assert(accountOnboardingMarkdown.includes("Register an EasyAR account"), "Account onboarding markdown should guide registration");
  assert(accountOnboardingMarkdown.includes("First Run Guide"), "Account onboarding markdown should include first-run guide");
  assert(accountOnboardingMarkdown.includes("No, I have not registered yet."), "Account onboarding markdown should include new-user route");
  assert(accountOnboardingMarkdown.includes("What The User Never Provides To MCP"), "Account onboarding markdown should include secret boundary");
  assert(accountOnboardingMarkdown.includes("https://www.easyar.cn/"), "Account onboarding markdown should include official EasyAR website");
  assert(!accountOnboardingMarkdown.includes("test-account-token"), "Account onboarding markdown should not include test tokens");

  const writtenAccountMaterials = await callTool("easyar_write_account_materials", {
    projectPath,
    sampleId: "cloud-recognition"
  });
  assertTextIncludes(writtenAccountMaterials, "ACCOUNT_MATERIALS.md");
  const accountMaterialsMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "ACCOUNT_MATERIALS.md"),
    "utf8"
  );
  assert(accountMaterialsMarkdown.includes("EasyAR Account Materials"), "Account materials markdown should include title");
  assert(accountMaterialsMarkdown.includes("easyar.cloudRecognition.appSecret"), "Account materials markdown should list cloud secret field name");
  assert(accountMaterialsMarkdown.includes("Cloud Recognition target library"), "Account materials markdown should list cloud target library prerequisite");
  assert(accountMaterialsMarkdown.includes("Required before device run: yes"), "Account materials markdown should mark cloud target library as device prerequisite");
  assert(accountMaterialsMarkdown.includes("Secret. Never paste into chat"), "Account materials markdown should include sharing policy");
  assert(!accountMaterialsMarkdown.includes("test-cloud-app-secret"), "Account materials markdown should not include secret values");

  const localConfigHandoff = await callTool("easyar_local_config_handoff", {
    projectPath,
    sampleId: "cloud-recognition",
    platform: "android",
    accountStage: "not-registered"
  });
  assertTextIncludes(localConfigHandoff, "\"stage\": \"not-registered\"");
  assertTextIncludes(localConfigHandoff, "easyar_write_local_config_from_env");
  assertTextIncludes(localConfigHandoff, "EASYAR_CLOUD_APP_SECRET");
  assertTextIncludes(localConfigHandoff, "https://www.easyar.cn/");
  assert(!extractText(localConfigHandoff).includes("env-test-account-token"), "Local config handoff should not return account token value");
  assert(!extractText(localConfigHandoff).includes("env-test-license-key"), "Local config handoff should not return license value");

  const writtenLocalConfigHandoff = await callTool("easyar_write_local_config_handoff", {
    projectPath,
    sampleId: "cloud-recognition",
    platform: "android",
    accountStage: "not-registered"
  });
  assertTextIncludes(writtenLocalConfigHandoff, "LOCAL_CONFIG_HANDOFF.md");
  const localConfigHandoffMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "LOCAL_CONFIG_HANDOFF.md"),
    "utf8"
  );
  assert(localConfigHandoffMarkdown.includes("EasyAR Local Config Handoff"), "Local config handoff markdown should include title");
  assert(localConfigHandoffMarkdown.includes("Official Browser Handoff"), "Local config handoff markdown should include browser handoff");
  assert(localConfigHandoffMarkdown.includes("No, I have not registered yet."), "Local config handoff markdown should include new-user route");
  assert(localConfigHandoffMarkdown.includes("ProjectSettings/EasyAR/easyar.local.json"), "Local config handoff markdown should include local config path");
  assert(localConfigHandoffMarkdown.includes("EASYAR_CLOUD_APP_SECRET"), "Local config handoff markdown should list cloud secret env name");
  assert(localConfigHandoffMarkdown.includes("never returns secret values"), "Local config handoff markdown should include security policy");
  assert(!localConfigHandoffMarkdown.includes("env-test-account-token"), "Local config handoff markdown should not include account token value");
  assert(!localConfigHandoffMarkdown.includes("env-test-license-key"), "Local config handoff markdown should not include license value");

  const localConfigForm = await callTool("easyar_generate_local_config_form", {
    projectPath,
    sampleId: "cloud-recognition",
    platform: "android",
    accountStage: "not-registered",
    bundleIdentifier: "com.easyar.testsample"
  });
  assertTextIncludes(localConfigForm, "\"readyToValidate\": false");
  assertTextIncludes(localConfigForm, "easyar.cloudRecognition.appSecret");
  assertTextIncludes(localConfigForm, "EASYAR_CLOUD_APP_SECRET");
  assertTextIncludes(localConfigForm, "jsonSkeleton");
  assertTextIncludes(localConfigForm, "https://www.easyar.cn");
  assert(!extractText(localConfigForm).includes("env-test-account-token"), "Local config form should not include account token value");
  assert(!extractText(localConfigForm).includes("env-test-license-key"), "Local config form should not include license value");

  const writtenLocalConfigForm = await callTool("easyar_write_local_config_form", {
    projectPath,
    sampleId: "cloud-recognition",
    platform: "android",
    accountStage: "not-registered",
    bundleIdentifier: "com.easyar.testsample"
  });
  assertTextIncludes(writtenLocalConfigForm, "LOCAL_CONFIG_FORM.md");
  const localConfigFormMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "LOCAL_CONFIG_FORM.md"),
    "utf8"
  );
  assert(localConfigFormMarkdown.includes("EasyAR Local Config Form"), "Local config form markdown should include title");
  assert(localConfigFormMarkdown.includes("Fields To Fill Locally"), "Local config form markdown should include field section");
  assert(localConfigFormMarkdown.includes("easyar.cloudRecognition.appSecret"), "Local config form markdown should list cloud appSecret path");
  assert(localConfigFormMarkdown.includes("Environment-Backed Write"), "Local config form markdown should include env-backed write section");
  assert(localConfigFormMarkdown.includes("easyar_validate_local_config"), "Local config form markdown should include validation chain");
  assert(localConfigFormMarkdown.includes("com.easyar.testsample"), "Local config form markdown should include non-secret bundle identifier");
  assert(!localConfigFormMarkdown.includes("env-test-account-token"), "Local config form markdown should not include account token value");
  assert(!localConfigFormMarkdown.includes("env-test-license-key"), "Local config form markdown should not include license value");

  const initialWorkflowState = await callTool("easyar_next_workflow_step", {
    projectPath,
    sampleId: "image-tracking",
    platform: "android"
  });
  assertTextIncludes(initialWorkflowState, "\"phase\": \"check-official-access\"");
  assertTextIncludes(initialWorkflowState, "\"blocked\": true");
  assertTextIncludes(initialWorkflowState, "\"tool\": \"easyar_check_official_access\"");

  const writtenWorkflowState = await callTool("easyar_write_workflow_state", {
    projectPath,
    sampleId: "image-tracking",
    platform: "android"
  });
  assertTextIncludes(writtenWorkflowState, "WORKFLOW_STATE.md");
  const workflowStateMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "image-tracking", "WORKFLOW_STATE.md"),
    "utf8"
  );
  assert(workflowStateMarkdown.includes("EasyAR Workflow State - Image Tracking"), "Workflow state markdown should include title");
  assert(workflowStateMarkdown.includes("check-official-access"), "Workflow state markdown should include phase");

  const projectHandoff = await callTool("easyar_generate_project_handoff", {
    projectPath,
    platform: "android",
    client: "claude-desktop",
    serverPath: path.resolve("dist/index.js")
  });
  assertTextIncludes(projectHandoff, "\"readyForContinuation\": false");
  assertTextIncludes(projectHandoff, "\"topNextCall\"");
  assertTextIncludes(projectHandoff, "image-tracking");
  assertTextIncludes(projectHandoff, "cloud-recognition");
  assertTextIncludes(projectHandoff, "PROJECT_HANDOFF.md");
  assert(!extractText(projectHandoff).includes("env-test-account-token"), "Project handoff should not include account token values");
  assert(!extractText(projectHandoff).includes("env-test-license-key"), "Project handoff should not include license values");

  const writtenProjectHandoff = await callTool("easyar_write_project_handoff", {
    projectPath,
    platform: "android",
    client: "claude-desktop",
    serverPath: path.resolve("dist/index.js")
  });
  assertTextIncludes(writtenProjectHandoff, "PROJECT_HANDOFF.md");
  const projectHandoffMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "PROJECT_HANDOFF.md"),
    "utf8"
  );
  assert(projectHandoffMarkdown.includes("EasyAR Project Handoff"), "Project handoff markdown should include title");
  assert(projectHandoffMarkdown.includes("Top Next Call"), "Project handoff markdown should include top next call");
  assert(projectHandoffMarkdown.includes("Focused Workflows"), "Project handoff markdown should include focused workflows");
  assert(projectHandoffMarkdown.includes("Image Tracking"), "Project handoff markdown should include Image Tracking");
  assert(projectHandoffMarkdown.includes("Cloud Recognition"), "Project handoff markdown should include Cloud Recognition");
  assert(!projectHandoffMarkdown.includes("env-test-account-token"), "Project handoff markdown should not include account token values");
  assert(!projectHandoffMarkdown.includes("env-test-license-key"), "Project handoff markdown should not include license values");

  const remainingWork = await callTool("easyar_remaining_work_report", {
    projectPath,
    platform: "android",
    verificationEvidence: "passed"
  });
  assertTextIncludes(remainingWork, "\"remainingPercent\"");
  assertTextIncludes(remainingWork, "\"productionReady\": false");
  assertTextIncludes(remainingWork, "official-easyar-account-api");
  assertTextIncludes(remainingWork, "focused-sample-image-tracking");
  assertTextIncludes(remainingWork, "focused-sample-cloud-recognition");
  assertTextIncludes(remainingWork, "portal-evidence");
  assertTextIncludes(remainingWork, "This is an evidence-weighted estimate");
  assert(!extractText(remainingWork).includes("env-test-account-token"), "Remaining work report should not include account token values");
  assert(!extractText(remainingWork).includes("env-test-license-key"), "Remaining work report should not include license values");

  const writtenRemainingWork = await callTool("easyar_write_remaining_work_report", {
    projectPath,
    platform: "android",
    verificationEvidence: "passed"
  });
  assertTextIncludes(writtenRemainingWork, "REMAINING_WORK.md");
  const remainingWorkMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "REMAINING_WORK.md"),
    "utf8"
  );
  assert(remainingWorkMarkdown.includes("EasyAR Remaining Work"), "Remaining work markdown should include title");
  assert(remainingWorkMarkdown.includes("Evidence-weighted completion"), "Remaining work markdown should include weighted completion");
  assert(remainingWorkMarkdown.includes("Official EasyAR account"), "Remaining work markdown should include official API category");
  assert(remainingWorkMarkdown.includes("Image Tracking focused real-device run-through"), "Remaining work markdown should include Image Tracking category");
  assert(remainingWorkMarkdown.includes("Cloud Recognition focused real-device run-through"), "Remaining work markdown should include Cloud Recognition category");
  assert(remainingWorkMarkdown.includes("portal-evidence"), "Remaining work markdown should include portal evidence requirement");
  assert(!remainingWorkMarkdown.includes("env-test-account-token"), "Remaining work markdown should not include account token values");
  assert(!remainingWorkMarkdown.includes("env-test-license-key"), "Remaining work markdown should not include license values");

  const writtenOfficialAccess = await callTool("easyar_write_official_access_report", {
    projectPath,
    sampleId: "image-tracking",
    platform: "android"
  });
  assertTextIncludes(writtenOfficialAccess, "OFFICIAL_ACCESS.md");
  const officialAccessMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "image-tracking", "OFFICIAL_ACCESS.md"),
    "utf8"
  );
  assert(officialAccessMarkdown.includes("EasyAR Official Access - Image Tracking"), "Official access markdown should include title");
  assert(officialAccessMarkdown.includes("downloads-discovery"), "Official access markdown should include downloads check");

  const initialImportChecklist = await callTool("easyar_generate_import_checklist", {
    projectPath,
    sampleId: "image-tracking"
  });
  assertTextIncludes(initialImportChecklist, "\"readyForFocusedPreparation\": false");
  assertTextIncludes(initialImportChecklist, "official-unity-plugin-imported");
  assertTextIncludes(initialImportChecklist, "image-tracking-target-assets-imported");
  assertTextIncludes(initialImportChecklist, "image-tracking-streaming-assets-imported");
  assertTextIncludes(initialImportChecklist, "ImageTargets.unitypackage");

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
  assert(deploymentReadinessMarkdown.includes("Bin: easyar-mcp -> dist/index.js"), "Deployment readiness markdown should include bin target");
  assert(deploymentReadinessMarkdown.includes("Package files: dist"), "Deployment readiness markdown should include package files");

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
  assertTextIncludes(imageRunSequence, "\"platform\": \"android\"");
  assertTextIncludes(imageRunSequence, "suggestedRunResultCall");
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
  assert(runSequenceMarkdown.includes("\"sampleId\":\"image-tracking\""), "Run sequence markdown should include sampleId on Unity batch calls");
  assert(runSequenceMarkdown.includes("suggestedRunResultCall"), "Run sequence markdown should mention run result handoff");

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

  const focusedPreflight = await callTool("easyar_generate_focused_preflight", {
    projectPath,
    sampleId: "image-tracking",
    platform: "android"
  });
  assertTextIncludes(focusedPreflight, "\"readyForUnityBatch\": false");
  assertTextIncludes(focusedPreflight, "\"blockers\"");
  assertTextIncludes(focusedPreflight, "\"nextCall\"");
  assertTextIncludes(focusedPreflight, "local-config");

  const writtenPreflight = await callTool("easyar_write_focused_preflight", {
    projectPath,
    sampleId: "image-tracking",
    platform: "android"
  });
  assertTextIncludes(writtenPreflight, "PREFLIGHT.md");
  const preflightMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "image-tracking", "PREFLIGHT.md"),
    "utf8"
  );
  assert(preflightMarkdown.includes("EasyAR Focused Preflight - Image Tracking"), "Preflight markdown should include title");
  assert(preflightMarkdown.includes("Next Call"), "Preflight markdown should include next call");
  assert(preflightMarkdown.includes("Related Artifacts"), "Preflight markdown should include related artifacts");

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
  assertTextIncludes(initialReadiness, "image-target-streaming-assets");

  const compileDryRun = await callTool("easyar_run_unity_compile_check", {
    projectPath,
    sampleId: "image-tracking",
    dryRun: true
  });
  assertTextIncludes(compileDryRun, "\"dryRun\": true");
  assertTextIncludes(compileDryRun, "mcp-easyar-CompileCheck.log");
  assertTextIncludes(compileDryRun, "suggestedRunResultCall");
  assertTextIncludes(compileDryRun, "easyar_write_run_result");

  const fakeUnityPath = await createFakeUnityExecutable(projectPath);
  const compileWithFakeUnity = await callTool("easyar_run_unity_compile_check", {
    projectPath,
    sampleId: "image-tracking",
    platform: "android",
    unityPath: fakeUnityPath,
    logPath: "Logs/mcp-easyar-FakeCompile.log",
    timeoutSeconds: 5
  });
  assertTextIncludes(compileWithFakeUnity, "\"exitCode\": 0");
  assertTextIncludes(compileWithFakeUnity, "\"overallStatus\": \"passed\"");
  assertTextIncludes(compileWithFakeUnity, "Unity compile/import check");
  assertTextIncludes(compileWithFakeUnity, "easyar_write_run_result");

  const methodWithFakeUnity = await callTool("easyar_run_unity_method", {
    projectPath,
    executeMethod: "EasyAR.EditorTools.EasyARBuildSettingsHelper.ConfigureBuildSettings",
    sampleId: "image-tracking",
    platform: "android",
    unityPath: fakeUnityPath,
    logPath: "Logs/mcp-easyar-FakeBuildSettings.log",
    timeoutSeconds: 5
  });
  assertTextIncludes(methodWithFakeUnity, "\"exitCode\": 0");
  assertTextIncludes(methodWithFakeUnity, "Configure Build Settings");
  assertTextIncludes(methodWithFakeUnity, "suggestedRunResultCall");
  assertTextIncludes(methodWithFakeUnity, "Run the focused sample validation helper");

  const prepared = await callTool("easyar_prepare_unity_project", {
    projectPath,
    sampleId: "image-tracking"
  });
  assertTextIncludes(prepared, "easyar.local.json");
  assertTextIncludes(prepared, "EasyARBuildSettingsHelper.cs");
  assertTextIncludes(prepared, "EasyARMobileSettingsHelper.cs");
  assertTextIncludes(prepared, "EasyARSampleValidationHelper.cs");
  assertTextIncludes(prepared, "EasyARLocalConfigBridge.cs");
  assertTextIncludes(prepared, "EasyARLocalConfigRuntime.cs");
  assertTextIncludes(prepared, "Assets/EasyARGenerated/image-tracking/RUNBOOK.md");
  const preparedGitignore = await readFile(path.join(projectPath, ".gitignore"), "utf8");
  assert(preparedGitignore.includes("ProjectSettings/EasyAR/easyar.local.json"), "Prepared project should ignore local config");
  assert(preparedGitignore.includes("Assets/StreamingAssets/EasyAR/easyar.runtime.json"), "Prepared project should ignore exported runtime config");
  const preparedBridgeEditor = await readFile(
    path.join(projectPath, "Assets", "Editor", "EasyARLocalConfigBridge.cs"),
    "utf8"
  );
  assert(preparedBridgeEditor.includes("ExportRuntimeConfig"), "Prepared project should include local config export method");
  assert(preparedBridgeEditor.includes("Assets/StreamingAssets/EasyAR/easyar.runtime.json"), "Bridge editor should write runtime config under StreamingAssets");
  const preparedBridgeRuntime = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "Runtime", "EasyARLocalConfigRuntime.cs"),
    "utf8"
  );
  assert(preparedBridgeRuntime.includes("UnityWebRequest.Get"), "Runtime bridge should support StreamingAssets reads on Android");
  assert(preparedBridgeRuntime.includes("HasCloudRecognitionCredentials"), "Runtime bridge should expose cloud credential presence");
  assert(!preparedBridgeEditor.includes("env-test-license-key"), "Bridge editor should not contain test license value");
  assert(!preparedBridgeRuntime.includes("env-test-license-key"), "Bridge runtime should not contain test license value");
  const imageLocalConfigExample = await readFile(
    path.join(projectPath, "ProjectSettings", "EasyAR", "easyar.local.json.example"),
    "utf8"
  );
  assert(imageLocalConfigExample.includes("\"_instructions\""), "Local config example should include instructions");
  assert(imageLocalConfigExample.includes("neverShareInChat"), "Local config example should include secret sharing policy");
  assert(imageLocalConfigExample.includes("easyar_write_local_config_from_env"), "Local config example should include env-backed writer");
  assert(imageLocalConfigExample.includes("EASYAR_LICENSE_KEY"), "Local config example should list license env var");

  const imageTrackingRunbook = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "image-tracking", "RUNBOOK.md"),
    "utf8"
  );
  assert(imageTrackingRunbook.includes("Image Tracking Checklist"), "Image Tracking runbook should include focused checklist");
  assert(imageTrackingRunbook.includes("easyar_write_account_onboarding"), "Image Tracking runbook should include account onboarding step");
  assert(imageTrackingRunbook.includes("easyar_write_account_materials"), "Image Tracking runbook should include account materials step");
  assert(imageTrackingRunbook.includes("easyar_write_focused_preflight"), "Image Tracking runbook should include preflight step");
  assert(imageTrackingRunbook.includes("easyar_write_local_config_from_env"), "Image Tracking runbook should include env-backed config step");
  const imageTargetsReadme = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "image-tracking", "Targets", "README.md"),
    "utf8"
  );
  assert(imageTargetsReadme.includes("requires real target assets"), "Image Tracking target README should not pretend to be a target asset");

  const missingEnvConfig = await callTool("easyar_write_local_config_from_env", {
    projectPath,
    sampleId: "cloud-recognition",
    targetPlatform: "android"
  });
  assertTextIncludes(missingEnvConfig, "\"canWrite\": false");
  assertTextIncludes(missingEnvConfig, "easyar.cloudRecognition.appId");
  assertTextIncludes(missingEnvConfig, "easyar.cloudRecognition.serverAddress");
  assertTextIncludes(missingEnvConfig, "easyar.cloudRecognition.apiKey");
  assertTextIncludes(missingEnvConfig, "easyar.cloudRecognition.apiSecret");
  assertTextExcludes(missingEnvConfig, "Set local environment variable(s) for easyar.cloudRecognition.appSecret");

  const envWrittenConfig = await callTool("easyar_write_local_config_from_env", {
    projectPath,
    sampleId: "image-tracking",
    targetPlatform: "android"
  });
  assertTextIncludes(envWrittenConfig, "\"canWrite\": true");
  assertTextIncludes(envWrittenConfig, "easyar.local.json");
  assertTextIncludes(envWrittenConfig, "\"valid\": true");
  assert(!extractText(envWrittenConfig).includes("env-test-account-token"), "Env local config tool should not return account token value");
  assert(!extractText(envWrittenConfig).includes("env-test-license-key"), "Env local config tool should not return license value");

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

  const localConfigBridge = await callTool("easyar_create_local_config_bridge", {
    projectPath,
    sampleId: "cloud-recognition",
    overwrite: true
  });
  assertTextIncludes(localConfigBridge, "EasyAR.EditorTools.EasyARLocalConfigBridge.ExportRuntimeConfig");
  assertTextIncludes(localConfigBridge, "EasyARLocalConfigRuntime.cs");
  assertTextIncludes(localConfigBridge, "easyar.runtime.json");
  assert(!extractText(localConfigBridge).includes("test-license-key"), "Local config bridge result should not return local license value");
  const cloudBridgeEditor = await readFile(
    path.join(projectPath, "Assets", "Editor", "EasyARLocalConfigBridge.cs"),
    "utf8"
  );
  assert(cloudBridgeEditor.includes("Cloud Recognition apiKey"), "Cloud bridge editor should validate cloud apiKey presence");
  assert(cloudBridgeEditor.includes("Cloud Recognition serverAddress"), "Cloud bridge editor should validate cloud serverAddress presence");
  assert(cloudBridgeEditor.includes("Cloud Recognition apiSecret"), "Cloud bridge editor should validate cloud apiSecret presence");
  assert(cloudBridgeEditor.includes("BuildRuntimeJson(json)"), "Cloud bridge editor should export a minimized runtime json");
  assert(!cloudBridgeEditor.includes("cloudRecognition\\\": {\\\\\\\\n"), "Cloud bridge editor should not write literal backslash-n into runtime json");
  assert(!cloudBridgeEditor.includes("accountToken\\\":"), "Cloud bridge editor should not export accountToken into runtime json");
  assert(!cloudBridgeEditor.includes("appSecret\\\":"), "Cloud bridge editor should not export appSecret into runtime json");
  assert(cloudBridgeEditor.includes("GlobalCloudRecognizerServiceConfig"), "Cloud bridge editor should apply global CloudRecognizer service config");
  const cloudBridgeRuntime = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "Runtime", "EasyARLocalConfigRuntime.cs"),
    "utf8"
  );
  assert(cloudBridgeRuntime.includes("CloudRecognitionApiKey"), "Cloud bridge runtime should expose cloud apiKey property");
  assert(cloudBridgeRuntime.includes("CloudRecognitionServerAddress"), "Cloud bridge runtime should expose cloud serverAddress property");
  assert(cloudBridgeRuntime.includes("CloudRecognitionApiSecret"), "Cloud bridge runtime should expose cloud apiSecret presence property");
  assert(!cloudBridgeRuntime.includes("AccountToken"), "Cloud bridge runtime should not expose accountToken");
  assert(!cloudBridgeRuntime.includes("CloudRecognitionAppSecret"), "Cloud bridge runtime should not expose cloud appSecret property");
  assert(!cloudBridgeRuntime.includes("test-license-key"), "Cloud bridge runtime should not contain local license value");
  assert(!cloudBridgeRuntime.includes("test-app-secret"), "Cloud bridge runtime should not contain local cloud secret value");

  await mkdir(path.join(projectPath, "Assets", "EasyAR"), { recursive: true });
  await writeFile(
    path.join(projectPath, "Assets", "EasyAR", "CloudConfigAdapter.asset"),
    [
      "%YAML 1.1",
      "--- !u!114 &11400000",
      "MonoBehaviour:",
      "  m_Name: CloudConfigAdapter",
      "  easyarLocalConfigPath: ProjectSettings/EasyAR/easyar.local.json",
      "  licenseKeySource: local-config",
      "  cloudRecognition:",
      "    appId: local-config-field",
      "    appKey: local-config-field",
      "    appSecret: local-config-field",
      "  note: CloudRecognition config asset points to local config without storing values"
    ].join("\n"),
    "utf8"
  );
  const configIntegrationAudit = await callTool("easyar_generate_config_integration_audit", {
    projectPath,
    sampleId: "cloud-recognition"
  });
  assertTextIncludes(configIntegrationAudit, "CloudConfigAdapter.asset");
  assertTextIncludes(configIntegrationAudit, "local-config-reader");
  assertTextIncludes(configIntegrationAudit, "cloud-credential-consumer");
  assertTextIncludes(configIntegrationAudit, "license-consumer");
  assert(!extractText(configIntegrationAudit).includes("env-test-account-token"), "Config integration audit should not return local account token values");
  assert(!extractText(configIntegrationAudit).includes("env-test-license-key"), "Config integration audit should not return local license values");

  const writtenConfigIntegrationAudit = await callTool("easyar_write_config_integration_audit", {
    projectPath,
    sampleId: "cloud-recognition"
  });
  assertTextIncludes(writtenConfigIntegrationAudit, "CONFIG_INTEGRATION.md");
  const configIntegrationMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "cloud-recognition", "CONFIG_INTEGRATION.md"),
    "utf8"
  );
  assert(configIntegrationMarkdown.includes("EasyAR Config Integration Audit - Cloud Recognition"), "Config integration markdown should include title");
  assert(configIntegrationMarkdown.includes("CloudConfigAdapter.asset"), "Config integration markdown should include candidate asset");
  assert(configIntegrationMarkdown.includes("Local config reader found: yes"), "Config integration markdown should detect local config reader");
  assert(configIntegrationMarkdown.includes("Cloud credential consumer found: yes"), "Config integration markdown should detect cloud credential consumer");
  assert(!configIntegrationMarkdown.includes("env-test-account-token"), "Config integration markdown should not return local account token values");
  assert(!configIntegrationMarkdown.includes("env-test-license-key"), "Config integration markdown should not return local license values");

  await mkdir(path.join(projectPath, "Assets", "Targets"), { recursive: true });
  await writeFile(path.join(projectPath, "Assets", "Targets", "ImageTarget.jpg"), "fake-image-target", "utf8");
  await mkdir(path.join(projectPath, "Assets", "EasyAR"), { recursive: true });
  await writeFile(path.join(projectPath, "Assets", "EasyAR", "EasyARSense.asset"), "fake-easyar-signal", "utf8");
  await mkdir(path.join(projectPath, "Assets", "Scenes"), { recursive: true });
  await writeFile(
    path.join(projectPath, "Assets", "Scenes", "RMBRecognition.unity"),
    "%YAML 1.1\nm_Name: ImageTarget-rmb\nTargetDataFileSource:\n",
    "utf8"
  );
  await writeFile(
    path.join(projectPath, "ProjectSettings", "EditorBuildSettings.asset"),
    [
      "%YAML 1.1",
      "--- !u!1045 &1",
      "EditorBuildSettings:",
      "  m_Scenes:",
      "  - enabled: 1",
      "    path: Assets/Scenes/RMBRecognition.unity",
      "    guid: 00000000000000000000000000000000"
    ].join("\n"),
    "utf8"
  );
  await mkdir(path.join(projectPath, "Assets", "StreamingAssets", "EasyARSamples", "ImageTargets"), { recursive: true });
  await writeFile(path.join(projectPath, "Assets", "StreamingAssets", "EasyARSamples", "ImageTargets", "namecard.jpg"), "fixture", "utf8");
  await writeFile(path.join(projectPath, "Assets", "StreamingAssets", "EasyARSamples", "ImageTargets", "namecard.etd"), "fixture", "utf8");
  await writeFile(path.join(projectPath, "Assets", "StreamingAssets", "EasyARSamples", "ImageTargets", "idback.etd"), "fixture", "utf8");

  const readyImportChecklist = await callTool("easyar_generate_import_checklist", {
    projectPath,
    sampleId: "image-tracking"
  });
  assertTextIncludes(readyImportChecklist, "\"readyForFocusedPreparation\": true");
  assertTextIncludes(readyImportChecklist, "Assets/EasyAR/EasyARSense.asset");
  assertTextIncludes(readyImportChecklist, "Assets/Scenes/RMBRecognition.unity");
  assertTextIncludes(readyImportChecklist, "Assets/Targets/ImageTarget.jpg");

  const readySceneAudit = await callTool("easyar_audit_sample_scene", {
    projectPath,
    sampleId: "image-tracking"
  });
  assertTextIncludes(readySceneAudit, "\"readyForUnityValidation\": true");
  assertTextIncludes(readySceneAudit, "Assets/Scenes/RMBRecognition.unity");
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

  const deviceRunResultForm = await callTool("easyar_generate_device_run_result_form", {
    projectPath,
    sampleId: "image-tracking",
    platform: "android",
    device: "Pixel test device",
    buildOutputPath: "Builds/image-tracking.apk",
    notes: "Use appSecret=should-not-leak only as a redaction fixture."
  });
  assertTextIncludes(deviceRunResultForm, "\"readyForDeviceValidation\": true");
  assertTextIncludes(deviceRunResultForm, "Real device validation");
  assertTextIncludes(deviceRunResultForm, "safeDraftRunResultArguments");
  assertTextIncludes(deviceRunResultForm, "passedRunResultTemplate");
  assertTextIncludes(deviceRunResultForm, "A real image target is detected");
  assertTextIncludes(deviceRunResultForm, "appSecret=<redacted>");
  assert(!extractText(deviceRunResultForm).includes("env-test-account-token"), "Device run result form should not include account token values");
  assert(!extractText(deviceRunResultForm).includes("env-test-license-key"), "Device run result form should not include license values");

  const writtenDeviceRunResultForm = await callTool("easyar_write_device_run_result_form", {
    projectPath,
    sampleId: "image-tracking",
    platform: "android",
    device: "Pixel test device",
    buildOutputPath: "Builds/image-tracking.apk"
  });
  assertTextIncludes(writtenDeviceRunResultForm, "DEVICE_RUN_RESULT_FORM.md");
  const deviceRunResultFormMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "image-tracking", "DEVICE_RUN_RESULT_FORM.md"),
    "utf8"
  );
  assert(deviceRunResultFormMarkdown.includes("EasyAR Device Run Result Form - Image Tracking"), "Device run result form markdown should include title");
  assert(deviceRunResultFormMarkdown.includes("Completion Acceptance Rules"), "Device run result form should include acceptance rules");
  assert(deviceRunResultFormMarkdown.includes("Safe Draft easyar_write_run_result Arguments"), "Device run result form should include safe draft arguments");
  assert(deviceRunResultFormMarkdown.includes("Passed easyar_write_run_result Template"), "Device run result form should include passed template");
  assert(deviceRunResultFormMarkdown.includes("Real device validation - Verify image target detection"), "Device run result form should include image target validation");
  assert(deviceRunResultFormMarkdown.includes("overallStatus"), "Device run result form should include run result status field");
  assert(!deviceRunResultFormMarkdown.includes("env-test-account-token"), "Device run result form markdown should not include account token values");
  assert(!deviceRunResultFormMarkdown.includes("env-test-license-key"), "Device run result form markdown should not include license values");

  const fakeAdbPath = path.join(projectPath, "fake-adb.sh");
  await writeFile(
    fakeAdbPath,
    `#!/bin/sh
if [ "$1" = "devices" ]; then
  echo "List of devices attached"
  echo "FAKE123 device product:test model:FakeAndroid device:fake transport_id:1"
  exit 0
fi
if [ "$1" = "-s" ]; then
  shift
  shift
fi
if [ "$1" = "logcat" ] && [ "$2" = "-d" ]; then
  echo "06-11 00:00:00.000 I/Unity: Runtime fixture password=secret-api-key-value"
  echo "06-11 00:00:01.000 I/Unity: EasyAR ImageTarget detected"
  exit 0
fi
if [ "$1" = "logcat" ] && [ "$2" = "-c" ]; then
  exit 0
fi
echo "Success"
exit 0
`,
    "utf8"
  );
  await chmod(fakeAdbPath, 0o755);
  await mkdir(path.join(projectPath, "Builds"), { recursive: true });
  await writeFile(path.join(projectPath, "Builds", "image-tracking.apk"), "fake-apk", "utf8");

  const androidDeviceStatus = await callTool("easyar_android_device_status", {
    adbPath: fakeAdbPath
  });
  assertTextIncludes(androidDeviceStatus, "\"readyForInstall\": true");
  assertTextIncludes(androidDeviceStatus, "FAKE123");

  const androidInstallDryRun = await callTool("easyar_android_install_apk", {
    projectPath,
    sampleId: "image-tracking",
    adbPath: fakeAdbPath,
    dryRun: true
  });
  assertTextIncludes(androidInstallDryRun, "\"dryRun\": true");
  assertTextIncludes(androidInstallDryRun, "image-tracking.apk");

  const androidStartDryRun = await callTool("easyar_android_start_app", {
    projectPath,
    sampleId: "image-tracking",
    adbPath: fakeAdbPath,
    bundleIdentifier: "com.easyar.testsample",
    dryRun: true
  });
  assertTextIncludes(androidStartDryRun, "com.easyar.testsample");
  assertTextIncludes(androidStartDryRun, "monkey");

  const androidLogcat = await callTool("easyar_android_collect_logcat", {
    projectPath,
    sampleId: "image-tracking",
    adbPath: fakeAdbPath,
    deviceSerial: "FAKE123",
    relativePath: "Logs/fake-device.log"
  });
  assertTextIncludes(androidLogcat, "fake-device.log");
  const fakeDeviceLog = await readFile(path.join(projectPath, "Logs", "fake-device.log"), "utf8");
  assert(fakeDeviceLog.includes("EasyAR ImageTarget detected"), "Device log should include filtered EasyAR evidence");
  assert(!fakeDeviceLog.includes("secret-api-key-value"), "Device log should redact apiKey values");

  const androidDeviceRunbook = await callTool("easyar_generate_android_device_runbook", {
    projectPath,
    sampleId: "image-tracking",
    adbPath: fakeAdbPath,
    deviceSerial: "FAKE123",
    bundleIdentifier: "com.easyar.testsample"
  });
  assertTextIncludes(androidDeviceRunbook, "\"readyForInstall\": true");
  assertTextIncludes(androidDeviceRunbook, "easyar_android_install_apk");
  assertTextIncludes(androidDeviceRunbook, "com.easyar.testsample");
  assert(!extractText(androidDeviceRunbook).includes("secret-api-key-value"), "Android runbook should not include secret values");

  const writtenAndroidDeviceRunbook = await callTool("easyar_write_android_device_runbook", {
    projectPath,
    sampleId: "image-tracking",
    adbPath: fakeAdbPath,
    deviceSerial: "FAKE123",
    bundleIdentifier: "com.easyar.testsample"
  });
  assertTextIncludes(writtenAndroidDeviceRunbook, "ANDROID_DEVICE_RUNBOOK.md");
  const androidDeviceRunbookMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "image-tracking", "ANDROID_DEVICE_RUNBOOK.md"),
    "utf8"
  );
  assert(androidDeviceRunbookMarkdown.includes("EasyAR Android Device Runbook - Image Tracking"), "Android runbook markdown should include title");
  assert(androidDeviceRunbookMarkdown.includes("Command Sequence"), "Android runbook markdown should include command sequence");
  assert(androidDeviceRunbookMarkdown.includes("easyar_android_collect_logcat"), "Android runbook markdown should include logcat tool");
  assert(androidDeviceRunbookMarkdown.includes("Safe Draft easyar_write_run_result Arguments"), "Android runbook markdown should include safe draft run result");
  assert(androidDeviceRunbookMarkdown.includes("Passed easyar_write_run_result Template"), "Android runbook markdown should include passed template");
  assert(!androidDeviceRunbookMarkdown.includes("env-test-account-token"), "Android runbook markdown should not include account token values");
  assert(!androidDeviceRunbookMarkdown.includes("env-test-license-key"), "Android runbook markdown should not include license values");

  const notRunCompletionReport = await callTool("easyar_generate_completion_report", {
    projectPath,
    sampleId: "image-tracking",
    platform: "android",
    outputPath: "Builds/image-tracking.apk"
  });
  assertTextIncludes(notRunCompletionReport, "\"completionStatus\": \"not-run\"");
  assertTextIncludes(notRunCompletionReport, "\"runThroughComplete\": false");
  assertTextIncludes(notRunCompletionReport, "RUN_RESULT.md");

  const writtenNotRunCompletionReport = await callTool("easyar_write_completion_report", {
    projectPath,
    sampleId: "image-tracking",
    platform: "android",
    outputPath: "Builds/image-tracking.apk"
  });
  assertTextIncludes(writtenNotRunCompletionReport, "COMPLETION_REPORT.md");
  const completionReportMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "image-tracking", "COMPLETION_REPORT.md"),
    "utf8"
  );
  assert(completionReportMarkdown.includes("EasyAR Completion Report - Image Tracking"), "Completion report markdown should include title");
  assert(completionReportMarkdown.includes("Completion status: not-run"), "Completion report markdown should include not-run status");
  assert(completionReportMarkdown.includes("Run-through complete: no"), "Completion report markdown should clearly mark incomplete run-through");

  await callTool("easyar_write_run_result", {
    projectPath,
    sampleId: "image-tracking",
    platform: "android",
    overallStatus: "passed",
    buildOutputPath: "Builds/image-tracking.apk",
    steps: [
      {
        name: "Unity compile",
        status: "passed",
        evidence: "Logs/mcp-easyar-CompileCheck.log"
      }
    ]
  });
  const compileOnlyCompletionReport = await callTool("easyar_generate_completion_report", {
    projectPath,
    sampleId: "image-tracking",
    platform: "android",
    outputPath: "Builds/image-tracking.apk"
  });
  assertTextIncludes(compileOnlyCompletionReport, "\"completionStatus\": \"blocked\"");
  assertTextIncludes(compileOnlyCompletionReport, "\"runThroughComplete\": false");
  assertTextIncludes(compileOnlyCompletionReport, "real-device-run-evidence");

  await callTool("easyar_write_run_result", {
    projectPath,
    sampleId: "image-tracking",
    platform: "android",
    overallStatus: "passed",
    device: "Pixel test device",
    buildOutputPath: "Builds/image-tracking.apk",
    steps: [
      {
        name: "Real device validation",
        status: "passed",
        evidence: "Pixel test device detected ImageTarget and rendered the Image Tracking augmentation."
      }
    ]
  });
  const passedCompletionReport = await callTool("easyar_write_completion_report", {
    projectPath,
    sampleId: "image-tracking",
    platform: "android",
    outputPath: "Builds/image-tracking.apk"
  });
  assertTextIncludes(passedCompletionReport, "\"completionStatus\": \"passed\"");
  assertTextIncludes(passedCompletionReport, "\"runThroughComplete\": true");
  const passedCompletionMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "image-tracking", "COMPLETION_REPORT.md"),
    "utf8"
  );
  assert(passedCompletionMarkdown.includes("Real-device evidence accepted: yes"), "Completion markdown should show accepted real-device evidence");

  const preparedWorkflowState = await callTool("easyar_next_workflow_step", {
    projectPath,
    sampleId: "image-tracking",
    platform: "android",
    outputPath: "Builds/image-tracking.apk"
  });
  assertTextIncludes(preparedWorkflowState, "\"phase\": \"check-official-access\"");
  assertTextIncludes(preparedWorkflowState, "easyar_check_official_access");

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
  assert(
    validationHelper.includes("HasOfficialImageTargetsStreamingAssets"),
    "Image Tracking validation helper should require official ImageTargets StreamingAssets"
  );
  assert(
    validationHelper.includes("ImageTargets.unitypackage"),
    "Image Tracking validation helper should tell users to import ImageTargets.unitypackage"
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

  await mkdir(
    path.join(projectPath, "Library", "PackageCache", "com.easyar.sense@4002.0.0", "Samples~", "ImageTracking", "ImageTracking_CloudRecognition", "Scenes"),
    { recursive: true }
  );
  await mkdir(
    path.join(projectPath, "Library", "PackageCache", "com.easyar.sense@4002.0.0", "Samples~", "StreamingAssets", "ImageTargets"),
    { recursive: true }
  );
  await writeFile(
    path.join(projectPath, "Library", "PackageCache", "com.easyar.sense@4002.0.0", "Samples~", "ImageTracking", "ImageTracking_CloudRecognition", "Scenes", "ImageTracking_CloudRecognition.unity"),
    "%YAML 1.1\nm_Name: CloudRecognizer\nCloudRecognizerFrameFilter:\n",
    "utf8"
  );
  await writeFile(
    path.join(projectPath, "Library", "PackageCache", "com.easyar.sense@4002.0.0", "Samples~", "StreamingAssets", "ImageTargets", "ImageTargets.unitypackage"),
    "dummy unitypackage fixture",
    "utf8"
  );

  const imageImportGuide = await callTool("easyar_generate_sample_import_guide", {
    projectPath,
    sampleId: "image-tracking"
  });
  assertTextIncludes(imageImportGuide, "ImageTargets.unitypackage");
  assertTextIncludes(imageImportGuide, "imageTargetsStreamingPackageCandidates");
  assertTextIncludes(imageImportGuide, "Prepare visual target validation");

  const missingCloudReadiness = await callTool("easyar_check_sample_readiness", {
    projectPath,
    sampleId: "cloud-recognition"
  });
  assertTextIncludes(missingCloudReadiness, "cloud-recognition-credentials");
  assertTextIncludes(missingCloudReadiness, "credentials are incomplete");
  assertTextIncludes(missingCloudReadiness, "ImageTracking_CloudRecognition");

  const missingCloudImportChecklist = await callTool("easyar_generate_import_checklist", {
    projectPath,
    sampleId: "cloud-recognition"
  });
  assertTextIncludes(missingCloudImportChecklist, "package-cache-sample-available");
  assertTextIncludes(missingCloudImportChecklist, "ImageTracking_CloudRecognition");
  assertTextIncludes(missingCloudImportChecklist, "Unity Package Manager Samples");

  const cloudImportGuide = await callTool("easyar_generate_sample_import_guide", {
    projectPath,
    sampleId: "cloud-recognition"
  });
  assertTextIncludes(cloudImportGuide, "\"importComplete\": false");
  assertTextIncludes(cloudImportGuide, "\"importAvailableFromPackageCache\": true");
  assertTextIncludes(cloudImportGuide, "ImageTracking_CloudRecognition");
  assertTextIncludes(cloudImportGuide, "\"expectedImportLocations\"");
  assertTextIncludes(cloudImportGuide, "\"postImportVerification\"");
  assertTextIncludes(cloudImportGuide, "easyar_write_focused_preflight");
  assertTextIncludes(cloudImportGuide, "Window > Package Manager");
  assertTextIncludes(cloudImportGuide, "Assets/Samples");

  const writtenCloudImportGuide = await callTool("easyar_write_sample_import_guide", {
    projectPath,
    sampleId: "cloud-recognition"
  });
  assertTextIncludes(writtenCloudImportGuide, "SAMPLE_IMPORT_GUIDE.md");
  const cloudImportGuideMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "cloud-recognition", "SAMPLE_IMPORT_GUIDE.md"),
    "utf8"
  );
  assert(cloudImportGuideMarkdown.includes("EasyAR Sample Import Guide - Cloud Recognition"), "Cloud import guide markdown should include title");
  assert(cloudImportGuideMarkdown.includes("Unity Steps"), "Cloud import guide markdown should include Unity steps");
  assert(cloudImportGuideMarkdown.includes("ImageTracking_CloudRecognition"), "Cloud import guide markdown should include UPM sample name");
  assert(cloudImportGuideMarkdown.includes("Expected Import Locations"), "Cloud import guide markdown should include expected import locations");
  assert(cloudImportGuideMarkdown.includes("Post-Import Verification"), "Cloud import guide markdown should include verification calls");
  assert(cloudImportGuideMarkdown.includes("easyar_write_focused_preflight"), "Cloud import guide markdown should include preflight verification");

  const cloudImportDryRun = await callTool("easyar_import_sample_from_package_cache", {
    projectPath,
    sampleId: "cloud-recognition",
    dryRun: true
  });
  assertTextIncludes(cloudImportDryRun, "\"dryRun\": true");
  assertTextIncludes(cloudImportDryRun, "ImageTracking_CloudRecognition");
  assertTextIncludes(cloudImportDryRun, "Assets/Samples");

  const cloudImportResult = await callTool("easyar_import_sample_from_package_cache", {
    projectPath,
    sampleId: "cloud-recognition"
  });
  assertTextIncludes(cloudImportResult, "\"imported\": true");
  assertTextIncludes(cloudImportResult, "\"postImportMatchingScenes\"");
  assertTextIncludes(cloudImportResult, "ImageTracking_CloudRecognition.unity");
  const importedCloudScenePath = path.join(
    projectPath,
    "Assets",
    "Samples",
    "EasyAR Sense Unity Plugin",
    "4002.0.0",
    "ImageTracking_CloudRecognition",
    "Scenes",
    "ImageTracking_CloudRecognition.unity"
  );
  assert(await fileExists(importedCloudScenePath), "PackageCache sample import should copy Cloud Recognition scene into Assets/Samples");

  const importedCloudImportChecklist = await callTool("easyar_generate_import_checklist", {
    projectPath,
    sampleId: "cloud-recognition"
  });
  assertTextIncludes(importedCloudImportChecklist, "\"id\": \"focused-sample-scene-imported\"");
  assertTextIncludes(importedCloudImportChecklist, "\"ok\": true");

  const preparedCloud = await callTool("easyar_prepare_unity_project", {
    projectPath,
    sampleId: "cloud-recognition",
    overwrite: true
  });
  assertTextIncludes(preparedCloud, "Assets/EasyARGenerated/cloud-recognition/RUNBOOK.md");
  const cloudLocalConfigExample = await readFile(
    path.join(projectPath, "ProjectSettings", "EasyAR", "easyar.local.json.example"),
    "utf8"
  );
  assert(cloudLocalConfigExample.includes("Cloud Recognition/CRS credentials"), "Cloud config example should guide official Cloud Recognition credentials");
  assert(cloudLocalConfigExample.includes("EASYAR_CLOUD_APP_ID"), "Cloud config example should list app id env var");
  assert(cloudLocalConfigExample.includes("EASYAR_CLOUD_SERVER_ADDRESS"), "Cloud config example should list server address env var");
  assert(cloudLocalConfigExample.includes("EASYAR_CLOUD_APP_KEY"), "Cloud config example should list app key env var");
  assert(cloudLocalConfigExample.includes("EASYAR_CLOUD_APP_SECRET"), "Cloud config example should list app secret env var");
  const cloudRunbook = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "cloud-recognition", "RUNBOOK.md"),
    "utf8"
  );
  assert(cloudRunbook.includes("Cloud Recognition Checklist"), "Cloud Recognition runbook should include focused checklist");
  assert(cloudRunbook.includes("easyar_write_account_onboarding"), "Cloud runbook should include account onboarding step");
  assert(cloudRunbook.includes("easyar_write_account_materials"), "Cloud runbook should include account materials step");
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
          serverAddress: "https://example.cn1.crs.easyar.com:8443",
          apiKey: "test-cloud-api-key",
          apiSecret: "test-cloud-api-secret"
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
  assertTextIncludes(configuredCloudReadiness, "Cloud recognition appId, serverAddress, apiKey, and apiSecret are configured");

  await writeFile(
    path.join(projectPath, "ProjectSettings", "EasyAR", "easyar.local.json"),
    JSON.stringify({
      easyar: {
        apiBaseUrl: "https://www.easyar.cn",
        accountToken: "test-account-token",
        licenseKey: "test-license-key",
        cloudRecognition: {
          appId: "test-cloud-app-id",
          apiKey: "test-cloud-api-key"
        }
      },
      unity: {
        targetPlatform: "android",
        bundleIdentifier: "com.easyar.testsample"
      }
    }),
    "utf8"
  );
  const configuredModernCloudReadiness = await callTool("easyar_check_sample_readiness", {
    projectPath,
    sampleId: "cloud-recognition"
  });
  assertTextIncludes(configuredModernCloudReadiness, "Cloud recognition credentials are incomplete or missing");

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

  const programmingContext = await callTool("easyar_generate_programming_context", {
    projectPath,
    sampleId: "image-tracking",
    goal: "Show content when an image target is found."
  });
  assertTextIncludes(programmingContext, "ImageTargetContentController.cs");
  assertTextIncludes(programmingContext, "\"recommendedWorkflow\"");
  assertTextIncludes(programmingContext, "easyar_write_code_plan");

  const writtenProgrammingContext = await callTool("easyar_write_programming_context", {
    projectPath,
    sampleId: "image-tracking",
    goal: "Show content when an image target is found."
  });
  assertTextIncludes(writtenProgrammingContext, "PROGRAMMING_CONTEXT.md");
  const programmingContextMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "image-tracking", "PROGRAMMING_CONTEXT.md"),
    "utf8"
  );
  assert(programmingContextMarkdown.includes("EasyAR Programming Context - Image Tracking"), "Programming context markdown should include title");
  assert(programmingContextMarkdown.includes("Recommended Workflow"), "Programming context markdown should include workflow");
  assert(programmingContextMarkdown.includes("ImageTargetContentController.cs"), "Programming context markdown should list generated script");

  const codePlan = await callTool("easyar_generate_code_plan", {
    projectPath,
    sampleId: "image-tracking",
    goal: "Show content when an image target is found and hide it when tracking is lost.",
    targetFiles: ["Assets/Scripts/ImageTargetContentController.cs"]
  });
  assertTextIncludes(codePlan, "easyar_create_mono_behaviour");
  assertTextIncludes(codePlan, "ImageTargetContentController.cs");
  assertTextIncludes(codePlan, "Run static script review before opening Unity batch compilation");
  assertTextIncludes(codePlan, "\"verificationCalls\"");
  assertTextIncludes(codePlan, "mcp-easyar-CodeCompileCheck.log");
  assertTextIncludes(codePlan, "suggestedRunResultCall");

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
  assert(codePlanMarkdown.includes("Verification Calls"), "Code plan markdown should include verification calls");
  assert(codePlanMarkdown.includes("easyar_run_unity_compile_check"), "Code plan markdown should include compile verification call");
  assert(codePlanMarkdown.includes("suggestedRunResultCall"), "Code plan markdown should mention run result handoff");

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

  await writeFile(
    path.join(projectPath, "ProjectSettings", "EasyAR", "easyar.local.json"),
    JSON.stringify({
      easyar: {
        apiBaseUrl: "https://www.easyar.cn",
        accountToken: "test-account-token",
        licenseKey: "test-license-key",
        cloudRecognition: {
          appId: "",
          serverAddress: "",
          apiKey: "",
          apiSecret: "",
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

  const nativeExtensionNoticeAnalysis = await callTool("easyar_analyze_unity_log", {
    sampleId: "image-tracking",
    logText: "Native extension for Android target not found\nNative extension for OSXStandalone target not found"
  });
  assertTextExcludes(nativeExtensionNoticeAnalysis, "image-tracking-target-load");

  const harmlessAndroidAssetLogAnalysis = await callTool("easyar_analyze_unity_log", {
    logText: [
      "Copying Assets/Plugins/Android/permission.CAMERA.aar",
      "DisplayProgressbar: Detecting Android SDK",
      "Android SDK Root: /Applications/Unity/Hub/Editor/2022.3.62f3/PlaybackEngines/AndroidPlayer/SDK"
    ].join("\n")
  });
  assertTextExcludes(harmlessAndroidAssetLogAnalysis, "camera-permission");
  assertTextExcludes(harmlessAndroidAssetLogAnalysis, "android-gradle");

  const failedGradleLogAnalysis = await callTool("easyar_analyze_unity_log", {
    logText: "GradleInvokationException: Could not download com.android.tools.build:gradle:7.4.2"
  });
  assertTextIncludes(failedGradleLogAnalysis, "android-gradle");

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

  const blockedCompletionReport = await callTool("easyar_generate_completion_report", {
    projectPath,
    sampleId: "cloud-recognition",
    platform: "android"
  });
  assertTextIncludes(blockedCompletionReport, "\"completionStatus\": \"blocked\"");
  assertTextIncludes(blockedCompletionReport, "\"runThroughComplete\": false");
  assertTextIncludes(blockedCompletionReport, "\"latestRunResultStatus\": \"blocked\"");
  assertTextIncludes(blockedCompletionReport, "\"id\": \"portal-evidence\"");
  assertTextIncludes(blockedCompletionReport, "Cloud Recognition library is present");

  const focusedScopeStatus = await callTool("easyar_generate_focused_scope_status", {
    projectPath,
    platform: "android"
  });
  assertTextIncludes(focusedScopeStatus, "\"allFocusedSamplesComplete\": false");
  assertTextIncludes(focusedScopeStatus, "\"focusedSampleIds\"");
  assertTextIncludes(focusedScopeStatus, "\"image-tracking\"");
  assertTextIncludes(focusedScopeStatus, "\"cloud-recognition\"");
  assertTextIncludes(focusedScopeStatus, "\"blockedCount\"");
  assertTextIncludes(focusedScopeStatus, "\"notRunCount\"");

  const writtenFocusedScopeStatus = await callTool("easyar_write_focused_scope_status", {
    projectPath,
    platform: "android"
  });
  assertTextIncludes(writtenFocusedScopeStatus, "FOCUSED_SCOPE_STATUS.md");
  const focusedScopeStatusMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "FOCUSED_SCOPE_STATUS.md"),
    "utf8"
  );
  assert(focusedScopeStatusMarkdown.includes("EasyAR Focused Scope Status"), "Focused scope status markdown should include title");
  assert(focusedScopeStatusMarkdown.includes("All focused samples complete: no"), "Focused scope status markdown should mark incomplete scope");
  assert(focusedScopeStatusMarkdown.includes("Image Tracking"), "Focused scope status markdown should include Image Tracking");
  assert(focusedScopeStatusMarkdown.includes("Cloud Recognition"), "Focused scope status markdown should include Cloud Recognition");

  const issueReport = await callTool("easyar_generate_issue_report", {
    projectPath,
    sampleId: "cloud-recognition",
    platform: "android",
    overallStatus: "blocked",
    observedBehavior: "Cloud request timed out. token=should-not-leak",
    expectedBehavior: "Cloud Recognition should return a result.",
    reproductionSteps: [
      "Run EasyARSampleValidationHelper.ValidateFocusedSample.",
      "Install Builds/cloud-recognition.apk and start the scene."
    ],
    steps: [
      {
        name: "Device validation",
        status: "blocked",
        evidence: "CloudRecognizer timeout appSecret=should-not-leak",
        nextAction: "Check official Cloud Recognition credentials and network access."
      }
    ]
  });
  assertTextIncludes(issueReport, "\"title\": \"[Cloud Recognition] blocked on android\"");
  assertTextIncludes(issueReport, "token=<redacted>");
  assertTextIncludes(issueReport, "appSecret=<redacted>");
  assertTextIncludes(issueReport, "SUPPORT_BUNDLE.md");

  const writtenIssueReport = await callTool("easyar_write_issue_report", {
    projectPath,
    sampleId: "cloud-recognition",
    platform: "android",
    overallStatus: "blocked",
    observedBehavior: "Cloud request failed. appKey=should-not-leak",
    steps: [
      {
        name: "Cloud Recognition device validation",
        status: "blocked",
        evidence: "HTTP timeout credential=should-not-leak",
        nextAction: "Retry with a real network and inspect device logs."
      }
    ]
  });
  assertTextIncludes(writtenIssueReport, "ISSUE_REPORT.md");
  const issueReportMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "cloud-recognition", "ISSUE_REPORT.md"),
    "utf8"
  );
  assert(issueReportMarkdown.includes("[Cloud Recognition] blocked on android"), "Issue report markdown should include title");
  assert(issueReportMarkdown.includes("appKey=<redacted>"), "Issue report markdown should redact appKey");
  assert(issueReportMarkdown.includes("credential=<redacted>"), "Issue report markdown should redact credentials");
  assert(issueReportMarkdown.includes("Generated Artifacts To Attach Or Reference"), "Issue report should list artifacts");

  const cloudDeviceValidation = await callTool("easyar_generate_device_validation_checklist", {
    projectPath,
    sampleId: "cloud-recognition",
    platform: "ios",
    device: "iPhone test device",
    buildOutputPath: "Builds/iOS/cloud-recognition"
  });
  assertTextIncludes(cloudDeviceValidation, "\"readyForDeviceValidation\"");
  assertTextIncludes(cloudDeviceValidation, "portal-evidence");
  assertTextIncludes(cloudDeviceValidation, "PORTAL_EVIDENCE.md is missing");
  assertTextIncludes(cloudDeviceValidation, "cloud-recognition-network");
  assertTextIncludes(cloudDeviceValidation, "cloud-target-library-ready");
  assertTextIncludes(cloudDeviceValidation, "cloud-recognition-result");

  const cloudPreflightWithoutPortalEvidence = await callTool("easyar_generate_focused_preflight", {
    projectPath,
    sampleId: "cloud-recognition",
    platform: "android"
  });
  assertTextIncludes(cloudPreflightWithoutPortalEvidence, "portal-evidence");
  assertTextIncludes(cloudPreflightWithoutPortalEvidence, "PORTAL_EVIDENCE.md is missing");

  const preexistingPortalEvidence = await callTool("easyar_write_portal_evidence", {
    projectPath,
    sampleId: "cloud-recognition",
    platform: "android",
    accountName: "armall",
    apiKeyRecordId: "19639",
    apiKeyAppName: "ARMallTest",
    cloudServicesEnabled: ["cloud-recognition"],
    apiKeyPresent: true,
    apiSecretPresent: true,
    senseLicenseStatus: "missing",
    cloudLibraryStatus: "missing",
    cloudTargetCount: 0
  });
  assertTextIncludes(preexistingPortalEvidence, "PORTAL_EVIDENCE.md");

  const cloudPreflightWithMissingLibrary = await callTool("easyar_generate_focused_preflight", {
    projectPath,
    sampleId: "cloud-recognition",
    platform: "android"
  });
  assertTextIncludes(cloudPreflightWithMissingLibrary, "portal-evidence");
  assertTextIncludes(cloudPreflightWithMissingLibrary, "cloud library status=missing");
  assertTextIncludes(cloudPreflightWithMissingLibrary, "cloud target count=0");

  const readyPortalEvidence = await callTool("easyar_write_portal_evidence", {
    projectPath,
    sampleId: "cloud-recognition",
    platform: "android",
    accountName: "armall",
    apiKeyRecordId: "19639",
    apiKeyAppName: "ARMallTest",
    cloudServicesEnabled: ["cloud-recognition"],
    apiKeyPresent: true,
    apiSecretPresent: true,
    senseLicenseStatus: "present",
    cloudLibraryStatus: "present",
    cloudLibraryName: "TestLibrary",
    cloudTargetCount: 1
  });
  assertTextIncludes(readyPortalEvidence, "PORTAL_EVIDENCE.md");

  const cloudPreflightWithReadyPortal = await callTool("easyar_generate_focused_preflight", {
    projectPath,
    sampleId: "cloud-recognition",
    platform: "android"
  });
  assertTextIncludes(cloudPreflightWithReadyPortal, "\"id\": \"portal-evidence\"");
  assertTextIncludes(cloudPreflightWithReadyPortal, "Portal evidence is sufficient");
  assert(!extractText(cloudPreflightWithReadyPortal).includes("cloud library status=missing"), "Ready portal evidence should clear missing library detail");

  const cloudDeviceValidationWithReadyPortal = await callTool("easyar_generate_device_validation_checklist", {
    projectPath,
    sampleId: "cloud-recognition",
    platform: "android",
    device: "Pixel cloud test device",
    buildOutputPath: "Builds/cloud-recognition.apk"
  });
  assertTextIncludes(cloudDeviceValidationWithReadyPortal, "\"portalCloudLibraryStatus\": \"present\"");
  assertTextIncludes(cloudDeviceValidationWithReadyPortal, "\"portalCloudTargetCount\": 1");
  assert(!extractText(cloudDeviceValidationWithReadyPortal).includes("\"id\": \"portal-evidence\""), "Ready portal evidence should clear device validation portal blocker");

  const focusedHandoffPackPlan = await callTool("easyar_generate_focused_handoff_pack", {
    projectPath,
    sampleId: "cloud-recognition",
    platform: "android",
    accountStage: "logged-in"
  });
  assertTextIncludes(focusedHandoffPackPlan, "HANDOFF_PACK.md");
  assertTextIncludes(focusedHandoffPackPlan, "PORTAL_EVIDENCE.md");
  assertTextIncludes(focusedHandoffPackPlan, "DEVICE_RUN_RESULT_FORM.md");
  assertTextIncludes(focusedHandoffPackPlan, "CODE_PLAN.md");
  assert(!extractText(focusedHandoffPackPlan).includes("env-test-account-token"), "Focused handoff pack plan should not include account token value");
  assert(!extractText(focusedHandoffPackPlan).includes("env-test-license-key"), "Focused handoff pack plan should not include license value");

  const writtenFocusedHandoffPack = await callTool("easyar_write_focused_handoff_pack", {
    projectPath,
    sampleId: "cloud-recognition",
    platform: "android",
    accountStage: "logged-in"
  });
  assertTextIncludes(writtenFocusedHandoffPack, "\"writtenCount\"");
  assertTextIncludes(writtenFocusedHandoffPack, "HANDOFF_PACK.md");
  assertTextIncludes(writtenFocusedHandoffPack, "PORTAL_EVIDENCE.md");
  assertTextIncludes(writtenFocusedHandoffPack, "\"focusedSamplesComplete\": false");
  const handoffPackMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "cloud-recognition", "HANDOFF_PACK.md"),
    "utf8"
  );
  assert(handoffPackMarkdown.includes("EasyAR Focused Handoff Pack - Cloud Recognition"), "Focused handoff pack markdown should include title");
  assert(handoffPackMarkdown.includes("Evidence Rules"), "Focused handoff pack should state evidence rules");
  assert(handoffPackMarkdown.includes("PORTAL_EVIDENCE.md"), "Focused handoff pack should reference portal evidence");
  assert(handoffPackMarkdown.includes("does not mark RUN_RESULT.md as passed"), "Focused handoff pack should not claim a passed run result");
  assert(!handoffPackMarkdown.includes("env-test-account-token"), "Focused handoff pack markdown should not include account token value");
  assert(!handoffPackMarkdown.includes("env-test-license-key"), "Focused handoff pack markdown should not include license value");
  const preservedPortalEvidenceMarkdown = await readFile(
    path.join(projectPath, "Assets", "EasyARGenerated", "PORTAL_EVIDENCE.md"),
    "utf8"
  );
  assert(preservedPortalEvidenceMarkdown.includes("API KEY record id: 19639"), "Focused handoff pack should preserve existing portal evidence");
  assert(!preservedPortalEvidenceMarkdown.includes("safe placeholder"), "Focused handoff pack should not overwrite portal evidence with placeholder text");

  const artifactIndex = await callTool("easyar_generate_artifact_index", {
    projectPath,
    sampleId: "cloud-recognition"
  });
  assertTextIncludes(artifactIndex, "SUPPORT_BUNDLE.md");
  assertTextIncludes(artifactIndex, "ONBOARDING.md");
  assertTextIncludes(artifactIndex, "ACCOUNT_ONBOARDING.md");
  assertTextIncludes(artifactIndex, "ACCOUNT_MATERIALS.md");
  assertTextIncludes(artifactIndex, "PORTAL_EVIDENCE.md");
  assertTextIncludes(artifactIndex, "LOCAL_CONFIG_FORM.md");
  assertTextIncludes(artifactIndex, "UNITY_ENVIRONMENT.md");
  assertTextIncludes(artifactIndex, "FOCUSED_SCOPE_STATUS.md");
  assertTextIncludes(artifactIndex, "PREFLIGHT.md");
  assertTextIncludes(artifactIndex, "WORKFLOW_STATE.md");
  assertTextIncludes(artifactIndex, "OFFICIAL_ACCESS.md");
  assertTextIncludes(artifactIndex, "IMPORT_CHECKLIST.md");
  assertTextIncludes(artifactIndex, "SAMPLE_IMPORT_GUIDE.md");
  assertTextIncludes(artifactIndex, "DEVICE_VALIDATION.md");
  assertTextIncludes(artifactIndex, "DEVICE_RUN_RESULT_FORM.md");
  assertTextIncludes(artifactIndex, "COMPLETION_REPORT.md");
  assertTextIncludes(artifactIndex, "ISSUE_REPORT.md");
  assertTextIncludes(artifactIndex, "PROGRAMMING_CONTEXT.md");
  assertTextIncludes(artifactIndex, "CODE_PLAN.md");
  assertTextIncludes(artifactIndex, "HANDOFF_PACK.md");
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
  assert(artifactIndexMarkdown.includes("ACCOUNT_ONBOARDING.md"), "Artifact index markdown should list account onboarding");
  assert(artifactIndexMarkdown.includes("ACCOUNT_MATERIALS.md"), "Artifact index markdown should list account materials");
  assert(artifactIndexMarkdown.includes("PORTAL_EVIDENCE.md"), "Artifact index markdown should list portal evidence");
  assert(artifactIndexMarkdown.includes("LOCAL_CONFIG_FORM.md"), "Artifact index markdown should list local config form");
  assert(artifactIndexMarkdown.includes("UNITY_ENVIRONMENT.md"), "Artifact index markdown should list Unity environment");
  assert(artifactIndexMarkdown.includes("FOCUSED_SCOPE_STATUS.md"), "Artifact index markdown should list focused scope status");
  assert(artifactIndexMarkdown.includes("PREFLIGHT.md"), "Artifact index markdown should list focused preflight");
  assert(artifactIndexMarkdown.includes("SAMPLE_IMPORT_GUIDE.md"), "Artifact index markdown should list sample import guide");
  assert(artifactIndexMarkdown.includes("DEVICE_RUN_RESULT_FORM.md"), "Artifact index markdown should list device run result form");
  assert(artifactIndexMarkdown.includes("ANDROID_DEVICE_RUNBOOK.md"), "Artifact index markdown should list Android device runbook");
  assert(artifactIndexMarkdown.includes("COMPLETION_REPORT.md"), "Artifact index markdown should list completion report");
  assert(artifactIndexMarkdown.includes("ISSUE_REPORT.md"), "Artifact index markdown should list issue report");
  assert(artifactIndexMarkdown.includes("PROGRAMMING_CONTEXT.md"), "Artifact index markdown should list programming context");
  assert(artifactIndexMarkdown.includes("HANDOFF_PACK.md"), "Artifact index markdown should list focused handoff pack");
  assert(
    artifactIndexMarkdown.indexOf("PREFLIGHT.md") < artifactIndexMarkdown.indexOf("RUN_REPORT.md"),
    "Artifact read order should place preflight before run report"
  );
  assert(
    artifactIndexMarkdown.indexOf("FOCUSED_SCOPE_STATUS.md") < artifactIndexMarkdown.indexOf("PREFLIGHT.md"),
    "Artifact read order should place focused scope status before per-sample preflight"
  );
  assert(
    artifactIndexMarkdown.indexOf("PORTAL_EVIDENCE.md") < artifactIndexMarkdown.indexOf("LOCAL_CONFIG_FORM.md"),
    "Artifact read order should place portal evidence before local config form"
  );
  assert(
    artifactIndexMarkdown.indexOf("PREFLIGHT.md") < artifactIndexMarkdown.indexOf("SUPPORT_BUNDLE.md"),
    "Artifact read order should place preflight before support bundle"
  );
  assert(
    artifactIndexMarkdown.indexOf("RUN_RESULT.md") < artifactIndexMarkdown.indexOf("COMPLETION_REPORT.md"),
    "Artifact read order should place run result before completion report"
  );
  assert(
    artifactIndexMarkdown.indexOf("PROGRAMMING_CONTEXT.md") < artifactIndexMarkdown.indexOf("CODE_PLAN.md"),
    "Artifact read order should place programming context before code plan"
  );

  await rm(projectPath, { recursive: true, force: true });
  await rm(unityCandidateRoot, { recursive: true, force: true });
  child.kill();
  console.log("MCP smoke test passed.");
} catch (error) {
  await rm(unityCandidateRoot, { recursive: true, force: true });
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
  const text = extractText(response);
  assert(text.includes(expected), `Expected response text to include ${expected}`);
}

function assertTextExcludes(response, unexpected) {
  const text = extractText(response);
  assert(!text.includes(unexpected), `Expected response text to exclude ${unexpected}`);
}

function extractText(response) {
  return response.result.content.map((item) => item.text ?? "").join("\n");
}

function assertResourceIncludes(response, expected) {
  const text = response.result.contents.map((item) => item.text ?? "").join("\n");
  assert(text.includes(expected), `Expected resource text to include ${expected}`);
}

async function fileExists(filePath) {
  try {
    await readFile(filePath);
    return true;
  } catch {
    return false;
  }
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

async function createFakeUnityExecutable(projectPath) {
  const fakeUnityPath = path.join(projectPath, "fake-unity.sh");
  await writeFile(
    fakeUnityPath,
    `#!/bin/sh
LOG_FILE=""
PREV=""
for ARG in "$@"; do
  if [ "$PREV" = "-logFile" ]; then
    LOG_FILE="$ARG"
  fi
  PREV="$ARG"
done
if [ -n "$LOG_FILE" ]; then
  mkdir -p "$(dirname "$LOG_FILE")"
  printf "Fake Unity run completed successfully\\nScripts have compiler errors: false\\n" > "$LOG_FILE"
fi
exit 0
`,
    "utf8"
  );
  await chmod(fakeUnityPath, 0o755);
  return fakeUnityPath;
}
