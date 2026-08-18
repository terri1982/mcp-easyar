import { access, chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const repositoryRoot = process.cwd();
const packageInfo = JSON.parse(await readFile(path.join(repositoryRoot, "package.json"), "utf8"));
const tempRoot = await mkdtemp(path.join(tmpdir(), "mcp-easyar-mega-clean-smoke-"));
const packDir = path.join(tempRoot, "pack");
const consumerDir = path.join(tempRoot, "consumer");
const projectDir = path.join(consumerDir, "mega-project");

try {
  await mkdir(packDir, { recursive: true });
  await mkdir(projectDir, { recursive: true });
  await mkdir(path.join(projectDir, "Assets"), { recursive: true });
  await mkdir(path.join(projectDir, "Packages"), { recursive: true });
  await mkdir(path.join(projectDir, "ProjectSettings"), { recursive: true });
  await writeFile(path.join(projectDir, "Packages", "manifest.json"), "{\"dependencies\":{}}\n", "utf8");
  await writeFile(path.join(projectDir, "ProjectSettings", "ProjectVersion.txt"), "m_EditorVersion: 2022.3.62f3\n", "utf8");
  await writeFile(
    path.join(consumerDir, "package.json"),
    JSON.stringify({
      name: "mcp-easyar-mega-clean-smoke-consumer",
      version: "0.0.0",
      private: true,
      type: "module"
    }, null, 2),
    "utf8"
  );

  await run("npm", ["pack", "--pack-destination", packDir, "--silent"], { cwd: repositoryRoot });
  const tarball = path.join(packDir, `${packageInfo.name}-${packageInfo.version}.tgz`);
  await access(tarball, constants.R_OK);
  await run("npm", ["install", "--silent", "--no-audit", "--fund=false", tarball], { cwd: consumerDir });

  const serverBin = path.join(consumerDir, "node_modules", ".bin", "easyar-mcp");
  await access(serverBin, constants.X_OK);

  const prompt = await call(serverBin, consumerDir, "prompts/get", {
    name: "easyar-run-mega",
    arguments: {
      projectPath: projectDir,
      platform: "android",
      targetDevice: "android-phone"
    }
  });
  const promptText = prompt.result.messages.map((message) => message.content?.text ?? "").join("\n");
  assertIncludes(promptText, "SCOPE BOUNDARY: This is the Unity Mega sample path");
  assertIncludes(promptText, "not the WeChat Mini Program sample");
  assertIncludes(promptText, "LocationInputMode to Onsite");
  assertIncludes(promptText, "real-device startup plus Mega localization/tracking");
  assertIncludes(promptText, "overallStatus=blocked");
  assertIncludes(promptText, "Use overallStatus=passed only after");

  const wechatPrompt = await call(serverBin, consumerDir, "prompts/get", {
    name: "easyar-run-wechat-miniprogram",
    arguments: {
      projectPath: path.join(consumerDir, "wechat-project"),
      sampleId: "wechat-mega"
    }
  });
  const wechatPromptText = wechatPrompt.result.messages.map((message) => message.content?.text ?? "").join("\n");
  assertIncludes(wechatPromptText, "This is a WeChat Mini Program project");
  assertIncludes(wechatPromptText, "not a Unity project, Android APK, PICO headset build, or XREAL build");

  const serverStatus = await call(serverBin, consumerDir, "tools/call", {
    name: "easyar_server_status",
    arguments: {}
  });
  assertEqual(serverStatus.result.structuredContent?.name, "mcp-easyar", "server name");
  assertEqual(serverStatus.result.structuredContent?.authorization?.hasToken, false, "clean EasyAR auth token absence");

  const toolList = await call(serverBin, consumerDir, "tools/list", {});
  const startAppTool = toolList.result.tools.find((tool) => tool.name === "easyar_android_start_app");
  assert(startAppTool, "Android start tool must be registered.");
  assertIncludes(startAppTool.description, "foreground");
  assertIncludes(startAppTool.description, "never proves Mega localization");
  assertIncludes(startAppTool.description, "operation success field only describes verified app launch");
  const collectLogcatTool = toolList.result.tools.find((tool) => tool.name === "easyar_android_collect_logcat");
  assert(collectLogcatTool, "Android logcat tool must be registered.");
  assertIncludes(collectLogcatTool.description, "a clean log is not a sample pass");
  assertIncludes(collectLogcatTool.description, "sampleSuccessEvidence=true");

  const prepared = await call(serverBin, consumerDir, "tools/call", {
    name: "easyar_prepare_unity_project",
    arguments: {
      projectPath: projectDir,
      sampleId: "mega"
    }
  });
  const preparedValue = parseToolJson(prepared);
  assertEqual(preparedValue.localConfig, null, "Mega prepare local JSON route");
  assertIncludes(preparedValue.megaSettings, "Assets/XR/Settings/EasyAR Settings.asset");
  assert(!preparedValue.written.some((file) => file.endsWith("easyar.local.json.example")), "Mega prepare must not write easyar.local.json.example.");
  assert(!preparedValue.written.some((file) => file.endsWith("EasyARLocalConfigBridge.cs")), "Mega prepare must not write a local JSON bridge.");

  const megaConfigValidation = await call(serverBin, consumerDir, "tools/call", {
    name: "easyar_validate_local_config",
    arguments: {
      projectPath: projectDir,
      sampleId: "mega"
    }
  });
  const megaConfigValue = parseToolJson(megaConfigValidation);
  assertIncludes(megaConfigValue.configPath, "Assets/XR/Settings/EasyAR Settings.asset");
  assertEqual(megaConfigValue.valid, false, "clean Mega Settings validity");

  const blockedMegaJsonWrite = await call(serverBin, consumerDir, "tools/call", {
    name: "easyar_write_local_config_from_env",
    arguments: {
      projectPath: projectDir,
      sampleId: "mega"
    }
  });
  const blockedMegaJsonValue = parseToolJson(blockedMegaJsonWrite);
  assertEqual(blockedMegaJsonValue.canWrite, false, "Mega JSON env writer gate");
  assertIncludes(JSON.stringify(blockedMegaJsonValue.nextActions), "Mega does not use ProjectSettings/EasyAR/easyar.local.json");

  const fakeAdbPath = path.join(consumerDir, "fake-adb.sh");
  await writeFile(fakeAdbPath, `#!/bin/sh
if [ "$1" = "-s" ]; then
  shift
  shift
fi
if [ "$1" = "shell" ] && [ "$2" = "monkey" ]; then
  echo "Events injected: 1"
  exit 0
fi
case "$2" in
  dumpsys*)
  echo "    topResumedActivity=ActivityRecord{u0 com.example.clean.mega/com.unity3d.player.UnityPlayerActivity}"
  exit 0
  ;;
esac
echo "Success"
exit 0
`, "utf8");
  await chmod(fakeAdbPath, 0o755);
  await mkdir(path.join(projectDir, "Builds"), { recursive: true });
  await writeFile(path.join(projectDir, "Builds", "fake.apk"), "fake-apk", "utf8");

  const install = await call(serverBin, consumerDir, "tools/call", {
    name: "easyar_android_install_apk",
    arguments: {
      projectPath: projectDir,
      sampleId: "mega",
      apkPath: "Builds/fake.apk",
      adbPath: fakeAdbPath,
      deviceSerial: "FAKE123"
    }
  });
  const installValue = parseToolJson(install);
  assertEqual(installValue.success, true, "Mega fake APK installation operation");
  assertEqual(installValue.sampleRunThroughComplete, false, "Mega install completion state");
  assertEqual(installValue.suggestedRunResultCall?.arguments?.overallStatus, "blocked", "Mega install suggested overall status");

  const startApp = await call(serverBin, consumerDir, "tools/call", {
    name: "easyar_android_start_app",
    arguments: {
      projectPath: projectDir,
      sampleId: "mega",
      bundleIdentifier: "com.example.clean.mega",
      adbPath: fakeAdbPath,
      deviceSerial: "FAKE123"
    }
  });
  const startAppValue = parseToolJson(startApp);
  assertEqual(startAppValue.success, true, "Mega fake app launch operation");
  assertEqual(startAppValue.launchVerified, true, "Mega fake app foreground verification");
  assertEqual(startAppValue.foregroundPackage, "com.example.clean.mega", "Mega fake foreground package");
  assertEqual(startAppValue.sampleRunThroughComplete, false, "Mega launch completion state");
  assertEqual(startAppValue.suggestedRunResultCall?.arguments?.overallStatus, "blocked", "Mega launch suggested overall status");
  assertIncludes(JSON.stringify(startAppValue), "does not prove Mega Block localization or tracking");

  const samplePlan = await call(serverBin, consumerDir, "tools/call", {
    name: "easyar_generate_sample_plan",
    arguments: {
      sampleId: "mega",
      platform: "android",
      unityVersion: "2022.3.62f3"
    }
  });
  assertIncludes(toolText(samplePlan), "Sample: Mega");
  assertIncludes(toolText(samplePlan), "Onsite");

  const preflight = await call(serverBin, consumerDir, "tools/call", {
    name: "easyar_write_focused_preflight",
    arguments: {
      projectPath: projectDir,
      sampleId: "mega",
      platform: "android"
    }
  });
  const preflightValue = parseToolJson(preflight);
  assertEqual(preflightValue.readyForUnityBatch, false, "clean Mega preflight readyForUnityBatch");
  assertEqual(preflightValue.readyForDeviceBuild, false, "clean Mega preflight readyForDeviceBuild");
  assert(preflightValue.blockerCount > 0, "Clean Mega preflight must expose blockers.");
  assert(Boolean(preflightValue.nextCall), "Clean Mega preflight must provide one nextCall.");
  assert(preflightValue.nextActions?.length > 0, "Clean Mega preflight must provide next actions.");

  const deviceChecklist = await call(serverBin, consumerDir, "tools/call", {
    name: "easyar_write_device_validation_checklist",
    arguments: {
      projectPath: projectDir,
      sampleId: "mega",
      platform: "android",
      device: "android-phone"
    }
  });
  const deviceChecklistValue = parseToolJson(deviceChecklist);
  assertEqual(deviceChecklistValue.readyForDeviceValidation, false, "clean Mega device checklist readiness");
  assert(deviceChecklistValue.blockerCount > 0, "Clean Mega device checklist must expose blockers.");

  const dryRunInstall = await call(serverBin, consumerDir, "tools/call", {
    name: "easyar_android_install_apk",
    arguments: {
      projectPath: projectDir,
      sampleId: "mega",
      dryRun: true
    }
  });
  const dryRunInstallValue = parseToolJson(dryRunInstall);
  assertEqual(dryRunInstallValue.dryRun, true, "Mega install dry-run flag");
  assertEqual(dryRunInstallValue.apkExists, false, "clean Mega APK existence");
  assertIncludes(JSON.stringify(dryRunInstallValue.nextActions), "Build the APK first");

  const completion = await call(serverBin, consumerDir, "tools/call", {
    name: "easyar_write_completion_report",
    arguments: {
      projectPath: projectDir,
      sampleId: "mega",
      platform: "android"
    }
  });
  const completionValue = parseToolJson(completion);
  assertEqual(completionValue.runThroughComplete, false, "clean Mega completion status");
  assert(completionValue.blockerCount > 0, "Clean Mega completion report must retain blockers.");

  const preflightMarkdown = await readFile(path.join(projectDir, "Assets", "EasyARGenerated", "mega", "PREFLIGHT.md"), "utf8");
  const completionMarkdown = await readFile(path.join(projectDir, "Assets", "EasyARGenerated", "mega", "COMPLETION_REPORT.md"), "utf8");
  assertIncludes(preflightMarkdown, "BLOCKED");
  assertIncludes(completionMarkdown, "Run-through complete: no");

  console.log("Mega clean environment smoke test passed.");
  console.log("Verified: package-bin install, Unity/WeChat prompt separation, Mega Settings routing, Onsite scene gate, clean preflight blockers, missing APK gate, and no false completion claim.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

function cleanEnvironment() {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key.startsWith("EASYAR_")) {
      delete env[key];
    }
  }
  env.MCP_EASYAR_TOOL_PROFILE = "full";
  return env;
}

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: cleanEnvironment(),
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error([
        `Command failed: ${command} ${args.join(" ")}`,
        `Exit code: ${code}`,
        stdout.trim(),
        stderr.trim()
      ].filter(Boolean).join("\n")));
    });
  });
}

function call(serverBin, cwd, method, params) {
  const child = spawn(serverBin, [], {
    cwd,
    env: cleanEnvironment(),
    stdio: ["pipe", "pipe", "pipe"]
  });
  let nextId = 1;
  let stdoutBuffer = "";
  let stderr = "";
  const pending = new Map();
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  child.stdout.on("data", (chunk) => {
    stdoutBuffer += chunk;
    const lines = stdoutBuffer.split(/\r?\n/);
    stdoutBuffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const message = JSON.parse(line);
      const resolver = pending.get(message.id);
      if (!resolver) continue;
      pending.delete(message.id);
      resolver(message);
    }
  });

  const request = (requestMethod, requestParams) => {
    const id = nextId++;
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method: requestMethod, params: requestParams })}\n`);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Timed out waiting for ${requestMethod}. stderr=${stderr.trim()}`));
      }, 30000);
      pending.set(id, (message) => {
        clearTimeout(timeout);
        if (message.error) {
          reject(new Error(JSON.stringify(message.error)));
        } else {
          resolve(message);
        }
      });
    });
  };

  const notify = (notificationMethod, notificationParams) => {
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: notificationMethod, params: notificationParams })}\n`);
  };

  return (async () => {
    try {
      await request("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "mcp-easyar-mega-clean-smoke", version: "0.0.1" }
      });
      notify("notifications/initialized", {});
      return await request(method, params);
    } finally {
      child.kill();
    }
  })();
}

function toolText(response) {
  return response.result.content.map((item) => item.text ?? "").join("\n");
}

function parseToolJson(response) {
  try {
    return JSON.parse(toolText(response));
  } catch (error) {
    throw new Error(`Expected JSON tool response: ${error instanceof Error ? error.message : String(error)}\n${toolText(response)}`);
  }
}

function assertIncludes(value, expected) {
  assert(String(value).includes(expected), `Expected output to include ${expected}.`);
}

function assertEqual(actual, expected, label) {
  assert(Object.is(actual, expected), `Expected ${label} to equal ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}.`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
