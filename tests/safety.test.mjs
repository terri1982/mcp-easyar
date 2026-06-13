import assert from "node:assert/strict";
import { test } from "node:test";
import { parseAdbDevices, redactSecretText } from "../dist/runtime.js";
import { sanitizeToolErrorText, toolErrorResult } from "../dist/tool-handler.js";

test("redactSecretText redacts local-key and URL secret fields", () => {
  const input = [
    "licenseKey=abc123",
    "appSecret: \"secret-value\"",
    "https://example.test/path?token=plain-token&safe=1",
    `blob=${"A".repeat(96)}`
  ].join("\n");

  const redacted = redactSecretText(input);
  assert(!redacted.includes("abc123"));
  assert(!redacted.includes("secret-value"));
  assert(!redacted.includes("plain-token"));
  assert(!redacted.includes("A".repeat(96)));
  assert(redacted.includes("<redacted>"));
});

test("parseAdbDevices keeps serial, state, and detail fields", () => {
  const devices = parseAdbDevices([
    "List of devices attached",
    "emulator-5554 device product:sdk_gphone model:Android_SDK",
    "ABC123 unauthorized usb:337641472X",
    ""
  ].join("\n"));

  assert.deepEqual(devices, [
    {
      serial: "emulator-5554",
      state: "device",
      detail: "product:sdk_gphone model:Android_SDK"
    },
    {
      serial: "ABC123",
      state: "unauthorized",
      detail: "usb:337641472X"
    }
  ]);
});

test("tool error results are structured and do not expose the home path", () => {
  const raw = `${process.env.HOME}/Projects/mcp-easyar/Builds/missing.apk`;
  const text = sanitizeToolErrorText(new Error(`APK does not exist: ${raw}`));
  assert(!text.includes(process.env.HOME));
  assert(text.includes("~/Projects/mcp-easyar/Builds/missing.apk"));

  const result = toolErrorResult("easyar_android_install_apk", new Error(`APK does not exist: ${raw}`));
  assert.equal(result.isError, true);
  assert.equal(result.content[0].type, "text");
  assert(result.content[0].text.includes("easyar_android_install_apk"));
});
