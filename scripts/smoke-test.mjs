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
    EASYAR_LICENSE_VALIDATE_ENDPOINT: ""
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

  const clientConfig = await callTool("easyar_generate_client_config", {
    client: "claude-desktop",
    serverPath: "/tmp/mcp-easyar/dist/index.js"
  });
  assertTextIncludes(clientConfig, "\"mcpServers\"");
  assertTextIncludes(clientConfig, "your_registered_user_token");

  const unityEnvironment = await callTool("easyar_unity_environment", {});
  assertTextIncludes(unityEnvironment, "\"pathCommand\": \"Unity\"");

  const projectPath = await createUnityProject();
  const initialReadiness = await callTool("easyar_check_sample_readiness", {
    projectPath,
    sampleId: "image-tracking"
  });
  assertTextIncludes(initialReadiness, "\"ready\": false");
  assertTextIncludes(initialReadiness, "Import the official EasyAR Unity Plugin package");
  assertTextIncludes(initialReadiness, "image-target-assets");

  const prepared = await callTool("easyar_prepare_unity_project", {
    projectPath,
    sampleId: "image-tracking"
  });
  assertTextIncludes(prepared, "easyar.local.json");
  assertTextIncludes(prepared, "EasyARBuildSettingsHelper.cs");
  assertTextIncludes(prepared, "EasyARMobileSettingsHelper.cs");
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
