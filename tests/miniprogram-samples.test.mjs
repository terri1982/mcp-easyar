import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
  analyzeMiniProgramDevtoolsLog,
  buildMiniProgramCompletionReport,
  buildMiniProgramDeviceValidationChecklist,
  buildMiniProgramRunResultMarkdown,
  buildMiniProgramScopeStatus,
  buildMiniProgramScopeStatusMarkdown,
  findMiniProgramSample,
  importMiniProgramSampleFromLocalPackage,
  inspectMiniProgramProject,
  miniProgramSamples,
  redactMiniProgramSecretText
} from "../dist/miniprogram-samples.js";
import { resourceCatalog } from "../dist/catalog.js";
import { registerResources } from "../dist/resources.js";

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
    await writeFile(path.join(generated, "DEVTOOLS_CHECK.log"), "compile ok\npreview ready\n");
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
    assert.equal(report.runThroughComplete, true);
    assert.deepEqual(report.blockers, []);
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
