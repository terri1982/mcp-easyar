import { mkdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import type { SampleInfo } from "./samples.js";

export function buildUnityArgs(projectPath: string, executeMethod: string | null, logPath: string | null): string[] {
  const args = [
    "-batchmode",
    "-quit",
    "-projectPath",
    projectPath
  ];
  if (executeMethod) {
    args.push("-executeMethod", executeMethod);
  }
  if (logPath) {
    args.push("-logFile", logPath);
  }
  return args;
}

export type ProcessResult = {
  command: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

export type AdbDevice = {
  serial: string;
  state: string;
  detail: string;
};

export async function runProcess(command: string, args: string[], timeoutSeconds: number): Promise<ProcessResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timeout = setTimeout(() => {
      settled = true;
      child.kill("SIGTERM");
      resolve({
        command: [command, ...args].join(" "),
        exitCode: null,
        stdout: stdout.slice(-12000),
        stderr: `${stderr}\nCommand timed out after ${timeoutSeconds} seconds.`.slice(-12000),
        timedOut: true
      });
    }, timeoutSeconds * 1000);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      resolve({
        command: [command, ...args].join(" "),
        exitCode: null,
        stdout: stdout.slice(-12000),
        stderr: `${stderr}\n${error.message}`.slice(-12000),
        timedOut: false
      });
    });
    child.on("close", (exitCode) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      resolve({
        command: [command, ...args].join(" "),
        exitCode,
        stdout: stdout.slice(-12000),
        stderr: stderr.slice(-12000),
        timedOut: false
      });
    });
  });
}

export function parseAdbDevices(stdout: string): AdbDevice[] {
  return stdout
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [serial = "", state = "", ...rest] = line.split(/\s+/);
      return {
        serial,
        state,
        detail: rest.join(" ")
      };
    })
    .filter((device) => device.serial.length > 0);
}

export function buildAndroidDeviceStatusActions(result: ProcessResult, devices: AdbDevice[]): string[] {
  if (result.exitCode === null) {
    return ["Install Android SDK Platform Tools or set EASYAR_ADB_PATH to the adb executable."];
  }
  if (result.exitCode !== 0) {
    return ["Run adb devices manually and fix the reported adb error before device validation."];
  }
  if (devices.some((device) => device.state === "device")) {
    return ["Install the focused APK with easyar_android_install_apk, then start it and collect logcat evidence."];
  }
  if (devices.some((device) => device.state === "unauthorized")) {
    return ["Unlock the Android device and accept the USB debugging authorization prompt, then rerun easyar_android_device_status."];
  }
  return ["Connect a real Android device with USB debugging enabled. Emulators are useful for install checks but cannot prove camera-based EasyAR sample success."];
}

export function defaultAndroidLogcatFilter(sample: SampleInfo): string {
  const sampleTerms = sample.id === "cloud-recognition"
    ? "Cloud|CloudRecognizer|Recognition|CRS|network|http|ssl|tls"
    : "ImageTarget|ImageTracker|ImageTracking|target|camera";
  return `EasyAR|Unity|AndroidRuntime|${sampleTerms}|permission|denied|exception|error|failed|unauthorized`;
}

export function redactSecretText(text: string): string {
  return text
    .replace(/((?:license|licenseKey|accountToken|token|apiKey|apiSecret|appKey|appSecret|secret|credential|password)\s*[:=]\s*)("[^"]+"|'[^']+'|[^\s,;&]+)/gi, "$1<redacted>")
    .replace(/([?&](?:token|apiKey|apiSecret|appKey|appSecret|secret|credential|password)=)[^&\s]+/gi, "$1<redacted>")
    .replace(/\b[A-Za-z0-9+/]{80,}={0,2}\b/g, "<redacted>");
}

export async function runUnity(unity: string, projectPath: string, executeMethod: string | null, timeoutSeconds: number, logPath: string | null) {
  if (logPath) {
    await mkdir(path.dirname(logPath), { recursive: true });
  }
  const args = buildUnityArgs(projectPath, executeMethod, logPath);

  return new Promise<{ command: string; exitCode: number | null; logPath: string | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(unity, args, { stdio: ["ignore", "pipe", "pipe"] });
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Unity command timed out after ${timeoutSeconds} seconds.`));
    }, timeoutSeconds * 1000);

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (exitCode) => {
      clearTimeout(timeout);
      resolve({
        command: [unity, ...args].join(" "),
        exitCode,
        logPath,
        stdout: stdout.slice(-12000),
        stderr: stderr.slice(-12000)
      });
    });
  });
}

