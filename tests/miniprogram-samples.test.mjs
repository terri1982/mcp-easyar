import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
  analyzeMiniProgramDevtoolsLog,
  buildMiniProgramCompletionReport,
  buildMiniProgramDevtoolsCommand,
  buildMiniProgramDeviceValidationChecklist,
  buildMiniProgramRunResultMarkdown,
  buildMiniProgramRunThroughStatus,
  buildMiniProgramRunThroughStatusMarkdown,
  buildMiniProgramScopeStatus,
  buildMiniProgramScopeStatusMarkdown,
  buildMiniProgramWorkspacePlan,
  createMiniProgramSampleWorkspace,
  findMiniProgramSample,
  importMiniProgramSampleFromLocalPackage,
  inspectMiniProgramProject,
  miniProgramRunResultHasUsableEvidence,
  miniProgramSamples,
  redactMiniProgramSecretText,
  validateMiniProgramZipEntries
} from "../dist/miniprogram-samples.js";
import { resourceCatalog } from "../dist/catalog.js";
import { registerResources } from "../dist/resources.js";

function execFilePromise(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function withTempDir(fn) {
  const root = await mkdtemp(path.join(os.tmpdir(), "mcp-easyar-mini-"));
  try {
    return await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function createMiniProgramProject(root, sampleId = "wechat-mega") {
  await mkdir(path.join(root, "miniprogram"), { recursive: true });
  await writeFile(
    path.join(root, "project.config.json"),
    JSON.stringify({ appid: "wx-test-appid", miniprogramRoot: "miniprogram/" }, null, 2)
  );
  await writeFile(
    path.join(root, "miniprogram", "app.json"),
    JSON.stringify({ pages: ["pages/index/index"] }, null, 2)
  );
  const configFile = sampleId === "wechat-mega" ? "easyar.mega.local.json" : "easyar.crs.local.json";
  const config = sampleId === "wechat-mega"
    ? {
        wechatAppId: "wx-test-appid",
        easyarLicenseKey: "license-local-only",
        megaAppId: "mega-app",
        megaServerAddress: "https://mega.example.test",
        megaBlockName: "office",
        megaBlockId: "block-1"
      }
    : {
        wechatAppId: "wx-test-appid",
        easyarLicenseKey: "license-local-only",
        crsAppId: "crs-app",
        crsServerAddress: "https://crs.example.test",
        crsApiKey: "api-key-local-only",
        crsApiSecret: "api-secret-local-only"
      };
  await writeFile(path.join(root, configFile), JSON.stringify(config, null, 2));
}

test("Mini Program sample catalog focuses on Mega and CRS", () => {
  assert.deepEqual(miniProgramSamples.map((sample) => sample.id), ["wechat-mega", "wechat-crs"]);
  assert.equal(findMiniProgramSample("wechat-mega").name, "WeChat Mini Program Mega");
  assert(findMiniProgramSample("wechat-mega").handoffBlockers.some((blocker) => blocker.includes("Unity Mega project is not")));
  assert.throws(() => findMiniProgramSample("hello-ar"), /Unknown mini program sampleId/);
});

test("inspectMiniProgramProject reports readiness without returning secret values", async () => {
  await withTempDir(async (root) => {
    await createMiniProgramProject(root, "wechat-crs");
    await writeFile(path.join(root, "miniprogram", "easyar-crs.js"), "export const sdk = true;\n");

    const report = await inspectMiniProgramProject(root, findMiniProgramSample("wechat-crs"));

    assert.equal(report.project.appidPresent, true);
    assert(report.project.sdkHints.includes(path.join("miniprogram", "easyar-crs.js")));
    assert.equal(report.localConfig.fields.every((field) => field.present), true);
    const serialized = JSON.stringify(report);
    assert(!serialized.includes("license-local-only"));
    assert(!serialized.includes("api-secret-local-only"));
  });
});

test("inspectMiniProgramProject accepts root-level Mini Program app.json when miniprogramRoot is omitted", async () => {
  await withTempDir(async (root) => {
    await writeFile(
      path.join(root, "project.config.json"),
      JSON.stringify({ appid: "wx-root-appid" }, null, 2)
    );
    await writeFile(
      path.join(root, "app.json"),
      JSON.stringify({ pages: ["pages/index/index"] }, null, 2)
    );
    await writeFile(path.join(root, "easyar-crs.js"), "export const sdk = true;\n");

    const report = await inspectMiniProgramProject(root, findMiniProgramSample("wechat-crs"));
    assert.equal(report.project.appJson, "app.json");
    assert.equal(report.project.miniprogramRoot, "");
    assert(report.checks.some((check) => check.name === "miniprogram root" && check.status === "passed"));
  });
});

test("importMiniProgramSampleFromLocalPackage previews and skips private package files", async () => {
  await withTempDir(async (root) => {
    await createMiniProgramProject(root, "wechat-mega");
    const officialPackage = path.join(root, "official-package");
    await mkdir(path.join(officialPackage, "src"), { recursive: true });
    await mkdir(path.join(officialPackage, "node_modules", "leftpad"), { recursive: true });
    await writeFile(path.join(officialPackage, "src", "easyar-mega.js"), "export const sdk = true;\n");
    await writeFile(path.join(officialPackage, "project.private.config.json"), "{}\n");
    await writeFile(path.join(officialPackage, "easyar.mega.local.json"), "{\"licenseKey\":\"secret\"}\n");
    await writeFile(path.join(officialPackage, "node_modules", "leftpad", "index.js"), "\n");

    const sample = findMiniProgramSample("wechat-mega");
    const preview = await importMiniProgramSampleFromLocalPackage({
      root,
      sample,
      packagePath: officialPackage,
      overwrite: false,
      dryRun: true
    });

    assert.equal(preview.dryRun, true);
    assert(preview.sampleFiles.includes(path.join("src", "easyar-mega.js")));
    assert(preview.skippedPreview.includes("project.private.config.json"));
    assert(preview.skippedPreview.includes("easyar.mega.local.json"));
    assert(preview.skippedPreview.some((item) => item.startsWith("node_modules")));

    const copied = await importMiniProgramSampleFromLocalPackage({
      root,
      sample,
      packagePath: officialPackage,
      overwrite: false,
      dryRun: false
    });
    const copiedSdk = await readFile(path.join(copied.target, "src", "easyar-mega.js"), "utf8");
    assert(copiedSdk.includes("sdk"));
    await assert.rejects(() => readFile(path.join(copied.target, "easyar.mega.local.json"), "utf8"));
  });
});

test("importMiniProgramSampleFromLocalPackage rejects Unity projects for Mini Program samples", async () => {
  await withTempDir(async (root) => {
    await createMiniProgramProject(root, "wechat-mega");
    const unityProject = path.join(root, "unity-mega-project");
    await mkdir(path.join(unityProject, "Assets"), { recursive: true });
    await mkdir(path.join(unityProject, "ProjectSettings"), { recursive: true });
    await writeFile(path.join(unityProject, "ProjectSettings", "ProjectVersion.txt"), "m_EditorVersion: 2022.3.62f3\n");

    await assert.rejects(() => importMiniProgramSampleFromLocalPackage({
      root,
      sample: findMiniProgramSample("wechat-mega"),
      packagePath: unityProject,
      overwrite: false,
      dryRun: true
    }), /Unity project, not an EasyAR WeChat Mini Program/);
  });
});

test("importMiniProgramSampleFromLocalPackage warns for unknown package shape", async () => {
  await withTempDir(async (root) => {
    await createMiniProgramProject(root, "wechat-crs");
    const packageRoot = path.join(root, "unknown-package");
    await mkdir(packageRoot, { recursive: true });
    await writeFile(path.join(packageRoot, "README.txt"), "official package contents pending\n");

    const preview = await importMiniProgramSampleFromLocalPackage({
      root,
      sample: findMiniProgramSample("wechat-crs"),
      packagePath: packageRoot,
      overwrite: false,
      dryRun: true
    });
    assert.equal(preview.sourceClassification.kind, "unknown");
    assert(preview.nextActions.some((action) => action.includes("does not contain obvious WeChat Mini Program")));
  });
});

test("importMiniProgramSampleFromLocalPackage accepts a user-downloaded zip package when zip is available", { skip: process.platform === "win32" }, async () => {
  await withTempDir(async (root) => {
    await createMiniProgramProject(root, "wechat-crs");
    const officialPackage = path.join(root, "official-zip-package");
    await mkdir(path.join(officialPackage, "sdk"), { recursive: true });
    await mkdir(path.join(officialPackage, "node_modules", "private"), { recursive: true });
    await writeFile(path.join(officialPackage, "sdk", "easyar-crs.js"), "export const sdk = true;\n");
    await writeFile(path.join(officialPackage, "easyar.crs.local.json"), "{\"crsApiSecret\":\"secret\"}\n");
    await writeFile(path.join(officialPackage, "node_modules", "private", "index.js"), "\n");
    const zipPath = path.join(root, "official-zip-package.zip");
    try {
      await execFilePromise("zip", ["-q", "-r", zipPath, "."], { cwd: officialPackage });
    } catch {
      return;
    }

    const sample = findMiniProgramSample("wechat-crs");
    const preview = await importMiniProgramSampleFromLocalPackage({
      root,
      sample,
      packagePath: zipPath,
      overwrite: false,
      dryRun: true
    });
    assert.equal(preview.dryRun, true);
    assert.equal(preview.packageType, "zip");
    assert(preview.sampleFiles.includes(path.join("sdk", "easyar-crs.js")));
    assert(preview.skippedPreview.includes("easyar.crs.local.json"));

    const copied = await importMiniProgramSampleFromLocalPackage({
      root,
      sample,
      packagePath: zipPath,
      overwrite: false,
      dryRun: false
    });
    assert.equal(copied.packageType, "zip");
    const copiedSdk = await readFile(path.join(copied.target, "sdk", "easyar-crs.js"), "utf8");
    assert(copiedSdk.includes("sdk"));
    await assert.rejects(() => readFile(path.join(copied.target, "easyar.crs.local.json"), "utf8"));
  });
});

test("validateMiniProgramZipEntries rejects zip-slip style paths", () => {
  assert.deepEqual(
    validateMiniProgramZipEntries(["sdk/easyar-crs.js", "miniprogram/app.json"]).safe,
    true
  );
  const result = validateMiniProgramZipEntries([
    "sdk/easyar-crs.js",
    "../outside.txt",
    "/tmp/absolute.txt",
    "C:/Users/example/private.txt",
    "nested\\..\\outside.txt"
  ]);
  assert.equal(result.safe, false);
  assert(result.unsafeEntries.includes("../outside.txt"));
  assert(result.unsafeEntries.includes("/tmp/absolute.txt"));
  assert(result.unsafeEntries.includes("C:/Users/example/private.txt"));
  assert(result.unsafeEntries.includes("nested\\..\\outside.txt"));
});

test("Mini Program workspace scaffold creates a safe project shell", async () => {
  await withTempDir(async (root) => {
    const sample = findMiniProgramSample("wechat-crs");
    const plan = buildMiniProgramWorkspacePlan(root, sample, "wx-test-appid");
    assert(plan.files.includes("project.config.json"));
    assert(plan.files.includes(path.join("miniprogram", "app.json")));
    assert(plan.security.some((rule) => rule.includes("not an official EasyAR SDK")));

    const result = await createMiniProgramSampleWorkspace({
      root,
      sample,
      appId: "wx-test-appid",
      projectName: "easyar-crs-test",
      overwrite: false
    });
    assert(result.created.includes("project.config.json"));
    assert(result.created.includes(path.join("miniprogram", "app.json")));
    assert(result.created.includes(path.join("miniprogram", "pages", "index", "index.js")));
    assert(result.created.includes(path.join("easyar-generated", "wechat-crs", "LOCAL_CONFIG_FORM.md")));
    assert.equal(result.appIdConfigured, true);

    const projectConfig = JSON.parse(await readFile(path.join(root, "project.config.json"), "utf8"));
    assert.equal(projectConfig.appid, "wx-test-appid");
    const gitignore = await readFile(path.join(root, ".gitignore"), "utf8");
    assert(gitignore.includes("easyar-generated/**/WECHAT_PREVIEW_QR.png"));
    assert(gitignore.includes("easyar-generated/**/WECHAT_PREVIEW_INFO.json"));
    const report = await inspectMiniProgramProject(root, sample);
    assert.equal(report.project.hasProjectConfig, true);
    assert.equal(report.project.appidPresent, true);
    assert.equal(report.project.appJson, path.join("miniprogram", "app.json"));
    assert(report.checks.some((check) => check.name === "EasyAR Mini Program SDK hints" && check.status === "warning"));

    const second = await createMiniProgramSampleWorkspace({
      root,
      sample,
      appId: "wx-test-appid",
      overwrite: false
    });
    assert(second.skipped.includes("project.config.json"));
  });
});

test("Mini Program DevTools command supports open and preview evidence paths", async () => {
  await withTempDir(async (root) => {
    const sample = findMiniProgramSample("wechat-mega");
    const openCommand = buildMiniProgramDevtoolsCommand({
      root,
      sample,
      mode: "open"
    });
    assert.deepEqual(openCommand.args, ["-o", root]);
    assert.equal(openCommand.logPath.relativePath, path.join("easyar-generated", "wechat-mega", "DEVTOOLS_CHECK.log"));
    assert.equal(openCommand.qrOutputPath, null);

    const previewCommand = buildMiniProgramDevtoolsCommand({
      root,
      sample,
      mode: "preview"
    });
    assert.deepEqual(previewCommand.args, [
      "preview",
      "--project",
      root,
      "--qr-format",
      "image",
      "--qr-output",
      path.join(root, "easyar-generated", "wechat-mega", "WECHAT_PREVIEW_QR.png"),
      "--info-output",
      path.join(root, "easyar-generated", "wechat-mega", "WECHAT_PREVIEW_INFO.json")
    ]);
    assert.equal(previewCommand.qrOutputPath.relativePath, path.join("easyar-generated", "wechat-mega", "WECHAT_PREVIEW_QR.png"));
    assert.equal(previewCommand.infoOutputPath.relativePath, path.join("easyar-generated", "wechat-mega", "WECHAT_PREVIEW_INFO.json"));

    assert.throws(() => buildMiniProgramDevtoolsCommand({
      root,
      sample,
      mode: "preview",
      qrOutputPath: "../leak.png"
    }), /qrOutputPath must stay inside/);
  });
});

test("redactMiniProgramSecretText and log analysis hide credentials while preserving actions", () => {
  const raw = [
    "licenseKey=local-secret-license",
    "https://example.test/path?apiSecret=local-secret-api",
    `token=${"A".repeat(96)}`,
    "Mega localization failed: block not found"
  ].join("\n");

  const redacted = redactMiniProgramSecretText(raw);
  assert(!redacted.includes("local-secret-license"));
  assert(!redacted.includes("local-secret-api"));
  assert(!redacted.includes("A".repeat(96)));

  const analysis = analyzeMiniProgramDevtoolsLog(raw, findMiniProgramSample("wechat-mega"));
  assert(analysis.findings.some((finding) => finding.id === "mega-localization"));
  assert(!analysis.sanitizedTail.includes("local-secret-license"));
});

test("Mini Program log analysis reports sample-specific success signals", () => {
  const megaLog = [
    "scope.camera authorize success",
    "EasyAR Mega localization success, block found, tracking started",
    "licenseKey=local-secret-license"
  ].join("\n");
  const megaAnalysis = analyzeMiniProgramDevtoolsLog(megaLog, findMiniProgramSample("wechat-mega"));
  assert.equal(megaAnalysis.findingCount, 0);
  assert(megaAnalysis.successSignals.some((signal) => signal.id === "camera-ready"));
  assert(megaAnalysis.successSignals.some((signal) => signal.id === "mega-localized"));
  assert(!megaAnalysis.sanitizedTail.includes("local-secret-license"));
  assert(megaAnalysis.nextActions.some((action) => action.includes("easyar_write_miniprogram_run_result")));

  const crsLog = [
    "preview compile success",
    "Cloud Recognition recognized target office-poster successfully",
    "apiSecret=local-secret-api"
  ].join("\n");
  const crsAnalysis = analyzeMiniProgramDevtoolsLog(crsLog, findMiniProgramSample("wechat-crs"));
  assert.equal(crsAnalysis.findingCount, 0);
  assert(crsAnalysis.successSignals.some((signal) => signal.id === "devtools-preview-ready"));
  assert(crsAnalysis.successSignals.some((signal) => signal.id === "crs-recognized"));
  assert(!crsAnalysis.successSignals.some((signal) => signal.id === "mega-localized"));
  assert(!crsAnalysis.sanitizedTail.includes("local-secret-api"));
});

test("Mini Program completion report requires preflight, DevTools log, checklist, and run result", async () => {
  await withTempDir(async (root) => {
    const sample = findMiniProgramSample("wechat-crs");
    const generated = path.join(root, "easyar-generated", sample.id);
    await mkdir(generated, { recursive: true });

    let report = await buildMiniProgramCompletionReport(root, sample);
    assert.equal(report.runThroughComplete, false);
    assert(report.blockers.length >= 4);

    const checklist = buildMiniProgramDeviceValidationChecklist(sample);
    const requiredStepIds = checklist.steps.filter((step) => step.requiredForCompletion).map((step) => step.id);
    await writeFile(path.join(generated, "PREFLIGHT.md"), "- PASSED - project.config.json: Found.\n");
    await writeFile(path.join(generated, "DEVICE_VALIDATION.md"), "# Device Validation\n");
    await writeFile(path.join(generated, "DEVTOOLS_CHECK.log"), "local command emitted unrelated output\n");
    await writeFile(
      path.join(generated, "RUN_RESULT.md"),
      buildMiniProgramRunResultMarkdown({
        sample,
        overallStatus: "passed",
        devtoolsStatus: "passed",
        devicePreviewStatus: "passed",
        passedStepIds: requiredStepIds,
        evidenceSummary: "Real-device WeChat preview recognized the intended CRS cloud target with redacted evidence."
      })
    );

    report = await buildMiniProgramCompletionReport(root, sample);
    assert.equal(report.runThroughComplete, false);
    assert(report.blockers.some((blocker) => blocker.id === "devtools-log"));

    await writeFile(path.join(generated, "DEVTOOLS_CHECK.log"), "compile ok\npreview ready\n");
    await writeFile(
      path.join(generated, "RUN_RESULT.md"),
      [
        "# WeChat Mini Program Run Result",
        "",
        "Run-through complete: yes",
        "",
        "## Evidence",
        "",
        "placeholder",
        "",
        "## Passed Required Steps",
        "",
        ...requiredStepIds.map((id) => `- \`${id}\``),
        ""
      ].join("\n")
    );

    report = await buildMiniProgramCompletionReport(root, sample);
    assert.equal(report.runThroughComplete, false);
    assert(report.blockers.some((blocker) => blocker.id === "run-result"));
    assert.equal(miniProgramRunResultHasUsableEvidence(await readFile(path.join(generated, "RUN_RESULT.md"), "utf8")), false);

    await writeFile(
      path.join(generated, "RUN_RESULT.md"),
      buildMiniProgramRunResultMarkdown({
        sample,
        overallStatus: "passed",
        devtoolsStatus: "passed",
        devicePreviewStatus: "passed",
        passedStepIds: requiredStepIds,
        evidenceSummary: "Real-device WeChat preview recognized the intended CRS cloud target with redacted evidence.",
        redactedEvidencePath: "docs/crs-real-evidence.json"
      })
    );

    report = await buildMiniProgramCompletionReport(root, sample);
    assert.equal(report.runThroughComplete, true);
    assert.deepEqual(report.blockers, []);
    assert(report.devtoolsSuccessSignals.some((signal) => signal.id === "devtools-preview-ready"));
    const runResultText = await readFile(path.join(generated, "RUN_RESULT.md"), "utf8");
    assert(runResultText.includes("Redacted evidence path: docs/crs-real-evidence.json"));
    assert.equal(miniProgramRunResultHasUsableEvidence(runResultText), true);
  });
});

test("Mini Program scope status aggregates Mega and CRS completion reports", async () => {
  await withTempDir(async (root) => {
    let status = await buildMiniProgramScopeStatus(root);
    assert.equal(status.allMiniProgramSamplesComplete, false);
    assert.equal(status.completedCount, 0);
    assert.deepEqual(status.sampleIds, ["wechat-mega", "wechat-crs"]);

    for (const sampleId of status.sampleIds) {
      const sample = findMiniProgramSample(sampleId);
      const generated = path.join(root, "easyar-generated", sample.id);
      await mkdir(generated, { recursive: true });
      const checklist = buildMiniProgramDeviceValidationChecklist(sample);
      const requiredStepIds = checklist.steps.filter((step) => step.requiredForCompletion).map((step) => step.id);
      await writeFile(path.join(generated, "PREFLIGHT.md"), "- PASSED - project.config.json: Found.\n");
      await writeFile(path.join(generated, "DEVICE_VALIDATION.md"), "# Device Validation\n");
      await writeFile(path.join(generated, "DEVTOOLS_CHECK.log"), "compile ok\npreview ready\n");
      await writeFile(
        path.join(generated, "RUN_RESULT.md"),
        buildMiniProgramRunResultMarkdown({
          sample,
          overallStatus: "passed",
          devtoolsStatus: "passed",
          devicePreviewStatus: "passed",
          passedStepIds: requiredStepIds,
          evidenceSummary: `${sample.id} real-device WeChat preview passed with redacted evidence.`
        })
      );
    }

    status = await buildMiniProgramScopeStatus(root);
    assert.equal(status.allMiniProgramSamplesComplete, true);
    assert.equal(status.completedCount, 2);
    assert.equal(status.items.every((item) => item.runThroughComplete), true);
    const markdown = buildMiniProgramScopeStatusMarkdown(status);
    assert(markdown.includes("All Mini Program samples complete: yes"));
    assert(markdown.includes("wechat-mega"));
    assert(markdown.includes("wechat-crs"));
  });
});

test("Mini Program run-through status recommends next calls from current evidence", async () => {
  await withTempDir(async (root) => {
    await createMiniProgramProject(root, "wechat-mega");
    const sample = findMiniProgramSample("wechat-mega");

    let status = await buildMiniProgramRunThroughStatus(root, sample);
    assert.equal(status.runThroughComplete, false);
    assert.equal(status.readiness.blockedCheckCount, 0);
    assert(status.nextCalls.some((call) => call.includes("easyar_write_miniprogram_local_config_form")));
    assert(status.nextCalls.some((call) => call.includes("easyar_write_miniprogram_preflight")));
    assert(status.nextCalls.some((call) => call.includes("easyar_run_miniprogram_devtools_check")));
    assert(status.nextCalls.some((call) => call.includes("mode=preview")));
    assert(status.nextCalls.some((call) => call.includes("official WeChat Mini Program Mega package")));
    assert(status.handoffBlockers.some((blocker) => blocker.includes("Unity Mega project is not")));
    assert(status.artifacts.some((artifact) => artifact.fileName === "WECHAT_PREVIEW_QR.png" && artifact.exists === false));
    assert(!JSON.stringify(status).includes("license-local-only"));

    await writeFile(path.join(root, "miniprogram", "easyar-mega.js"), "export const sdk = true;\n");

    const generated = path.join(root, "easyar-generated", sample.id);
    await mkdir(generated, { recursive: true });
    const checklist = buildMiniProgramDeviceValidationChecklist(sample);
    const requiredStepIds = checklist.steps.filter((step) => step.requiredForCompletion).map((step) => step.id);
    await writeFile(path.join(generated, "LOCAL_CONFIG_FORM.md"), "# form\n");
    await writeFile(path.join(generated, "PREFLIGHT.md"), "- PASSED - project.config.json: Found.\n");
    await writeFile(path.join(generated, "RUN_SEQUENCE.md"), "# run sequence\n");
    await writeFile(path.join(generated, "DEVICE_VALIDATION.md"), "# validation\n");
    await writeFile(path.join(generated, "RUN_RESULT_FORM.md"), "# form\n");
    await writeFile(path.join(generated, "DEVTOOLS_CHECK.log"), "compile ok\npreview ready\n");

    status = await buildMiniProgramRunThroughStatus(root, sample);
    assert(status.nextCalls.some((call) => call.includes("mode=preview dryRun=false")));

    await writeFile(path.join(generated, "WECHAT_PREVIEW_QR.png"), "fake local qr placeholder\n");
    await writeFile(path.join(generated, "WECHAT_PREVIEW_INFO.json"), "{\"status\":\"ok\"}\n");
    await writeFile(
      path.join(generated, "RUN_RESULT.md"),
      buildMiniProgramRunResultMarkdown({
        sample,
        overallStatus: "passed",
        devtoolsStatus: "passed",
        devicePreviewStatus: "passed",
        passedStepIds: requiredStepIds,
        evidenceSummary: "Real-device WeChat preview localized in the mapped Mega environment with redacted evidence."
      })
    );

    status = await buildMiniProgramRunThroughStatus(root, sample);
    assert.equal(status.runThroughComplete, true);
    assert(status.nextCalls.some((call) => call.includes("easyar_write_miniprogram_completion_report")));
    const markdown = buildMiniProgramRunThroughStatusMarkdown(status);
    assert(markdown.includes("Run-through complete: yes"));
    assert(markdown.includes("RUN_RESULT.md"));
  });
});

test("WeChat Mini Program acceptance resource is registered and readable", async () => {
  assert(resourceCatalog.includes("easyar://acceptance/wechat-miniprogram"));
  const registered = new Map();
  const fakeServer = {
    resource(name, uri, handler) {
      registered.set(uri, { name, handler });
    }
  };

  registerResources(fakeServer, {
    samples: [],
    officialInfo: {},
    officialOpenApiPath: path.join(process.cwd(), "docs", "openapi", "easyar-mcp-account-api.openapi.json"),
    packageRoot: process.cwd(),
    quickstartWorkflow: "quickstart",
    buildOfficialApiContract: () => ({}),
    buildOfficialApiContractMarkdown: () => "# contract\n"
  });

  const resource = registered.get("easyar://acceptance/wechat-miniprogram");
  assert(resource, "wechat-miniprogram acceptance resource should be registered");
  assert.equal(resource.name, "easyar-wechat-miniprogram-acceptance");

  const result = await resource.handler({ href: "easyar://acceptance/wechat-miniprogram" });
  assert.equal(result.contents[0].mimeType, "text/markdown");
  assert(result.contents[0].text.includes("EasyAR WeChat Mini Program Sample Acceptance"));
  assert(result.contents[0].text.includes("wechat-mega"));
  assert(result.contents[0].text.includes("wechat-crs"));
  assert(result.contents[0].text.includes("COMPLETION_REPORT.md"));
});
