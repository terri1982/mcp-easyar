import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import path from "node:path";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { jsonText } from "./mcp-response.js";
import {
  analyzeMiniProgramDevtoolsLog,
  buildMiniProgramLocalConfigForm,
  buildMiniProgramLocalConfigFormMarkdown,
  buildMiniProgramPreflightMarkdown,
  buildMiniProgramRunSequence,
  buildMiniProgramRunSequenceMarkdown,
  findMiniProgramSample,
  importMiniProgramSampleFromLocalPackage,
  inspectMiniProgramProject,
  miniProgramSamples,
  redactMiniProgramSecretText,
  writeMiniProgramArtifact
} from "./miniprogram-samples.js";
import { runProcess } from "./runtime.js";
import { ensureDirectory, resolveProjectPath } from "./tool-project.js";

type RegisterTool = McpServer["tool"];

async function executableExists(filePath: string) {
  try {
    await access(filePath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function findWeChatDevToolsCli(cliPath?: string) {
  const candidates = [
    cliPath,
    process.env.WECHAT_DEVTOOLS_CLI,
    "/Applications/wechatwebdevtools.app/Contents/MacOS/cli",
    "/Applications/微信开发者工具.app/Contents/MacOS/cli",
    "cli"
  ].filter((item): item is string => Boolean(item));

  const results = await Promise.all(candidates.map(async (candidate) => ({
    path: candidate,
    exists: candidate === "cli" ? false : await executableExists(candidate)
  })));
  const detected = results.find((item) => item.exists) ?? null;
  return {
    detectedPath: detected?.path ?? null,
    candidates: results,
    environment: {
      variable: "WECHAT_DEVTOOLS_CLI",
      hint: "Set WECHAT_DEVTOOLS_CLI to the WeChat Developer Tools CLI executable path when it is installed outside common locations."
    },
    nextActions: detected
      ? [
          "Open WeChat Developer Tools and make sure the user is logged in.",
          "Use the detected CLI for compile or preview checks after the official EasyAR Mini Program sample is imported."
        ]
      : [
          "Install WeChat Developer Tools.",
          "Open it once and log in with the user's WeChat account.",
          "Set WECHAT_DEVTOOLS_CLI in the MCP client environment if the CLI is not in a common install path."
        ]
  };
}

export function registerMiniProgramSampleTools(registerTool: RegisterTool) {
  registerTool(
    "easyar_list_miniprogram_samples",
    "List focused EasyAR WeChat Mini Program samples supported by mcp-easyar.",
    {},
    async () => jsonText({
      samples: miniProgramSamples,
      focusedSampleIds: miniProgramSamples.map((sample) => sample.id),
      security: "MCP does not collect EasyAR or WeChat passwords, verification codes, raw license keys, API secrets, or upload credentials."
    })
  );

  registerTool(
    "easyar_check_wechat_devtools",
    "Find the local WeChat Developer Tools CLI and report how to configure it.",
    {
      cliPath: z.string().optional().describe("Optional explicit WeChat Developer Tools CLI path.")
    },
    async ({ cliPath }) => jsonText(await findWeChatDevToolsCli(cliPath))
  );

  registerTool(
    "easyar_inspect_miniprogram_project",
    "Inspect a WeChat Mini Program project for EasyAR Mega or CRS sample readiness without returning secrets.",
    {
      projectPath: z.string().describe("WeChat Mini Program project path."),
      sampleId: z.enum(["wechat-mega", "wechat-crs"]).describe("Mini Program sample id.")
    },
    async ({ projectPath, sampleId }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const sample = findMiniProgramSample(sampleId);
      return jsonText(await inspectMiniProgramProject(root, sample));
    }
  );

  registerTool(
    "easyar_generate_miniprogram_local_config_form",
    "Generate a local config form for an EasyAR WeChat Mini Program sample.",
    {
      sampleId: z.enum(["wechat-mega", "wechat-crs"]).describe("Mini Program sample id.")
    },
    async ({ sampleId }) => jsonText(buildMiniProgramLocalConfigForm(findMiniProgramSample(sampleId)))
  );

  registerTool(
    "easyar_write_miniprogram_local_config_form",
    "Write a local config form into easyar-generated/<sampleId>/LOCAL_CONFIG_FORM.md.",
    {
      projectPath: z.string().describe("WeChat Mini Program project path."),
      sampleId: z.enum(["wechat-mega", "wechat-crs"]).describe("Mini Program sample id."),
      overwrite: z.boolean().default(true).describe("Whether to overwrite an existing generated form.")
    },
    async ({ projectPath, sampleId, overwrite }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const sample = findMiniProgramSample(sampleId);
      const form = buildMiniProgramLocalConfigForm(sample);
      const result = await writeMiniProgramArtifact(root, sample, "LOCAL_CONFIG_FORM.md", buildMiniProgramLocalConfigFormMarkdown(form), overwrite);
      return jsonText({
        ...result,
        relativePath: path.relative(root, result.path),
        configFile: form.configFile,
        gitignoreEntries: form.gitignoreEntries,
        note: "Fill the local config file outside chat. This tool writes field names and placeholders only."
      });
    }
  );

  registerTool(
    "easyar_generate_miniprogram_preflight",
    "Generate the preflight report for an EasyAR WeChat Mini Program sample.",
    {
      projectPath: z.string().describe("WeChat Mini Program project path."),
      sampleId: z.enum(["wechat-mega", "wechat-crs"]).describe("Mini Program sample id.")
    },
    async ({ projectPath, sampleId }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const sample = findMiniProgramSample(sampleId);
      return jsonText(await inspectMiniProgramProject(root, sample));
    }
  );

  registerTool(
    "easyar_write_miniprogram_preflight",
    "Write the EasyAR WeChat Mini Program preflight report into easyar-generated/<sampleId>/PREFLIGHT.md.",
    {
      projectPath: z.string().describe("WeChat Mini Program project path."),
      sampleId: z.enum(["wechat-mega", "wechat-crs"]).describe("Mini Program sample id."),
      overwrite: z.boolean().default(true).describe("Whether to overwrite an existing generated preflight.")
    },
    async ({ projectPath, sampleId, overwrite }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const sample = findMiniProgramSample(sampleId);
      const report = await inspectMiniProgramProject(root, sample);
      const result = await writeMiniProgramArtifact(root, sample, "PREFLIGHT.md", buildMiniProgramPreflightMarkdown(report), overwrite);
      return jsonText({
        ...result,
        relativePath: path.relative(root, result.path),
        blockedChecks: report.checks.filter((check) => check.status === "blocked").map((check) => check.name),
        nextActions: report.nextActions
      });
    }
  );

  registerTool(
    "easyar_generate_miniprogram_run_sequence",
    "Generate the run sequence for an EasyAR WeChat Mini Program sample.",
    {
      sampleId: z.enum(["wechat-mega", "wechat-crs"]).describe("Mini Program sample id.")
    },
    async ({ sampleId }) => jsonText(buildMiniProgramRunSequence(findMiniProgramSample(sampleId)))
  );

  registerTool(
    "easyar_write_miniprogram_run_sequence",
    "Write the EasyAR WeChat Mini Program run sequence into easyar-generated/<sampleId>/RUN_SEQUENCE.md.",
    {
      projectPath: z.string().describe("WeChat Mini Program project path."),
      sampleId: z.enum(["wechat-mega", "wechat-crs"]).describe("Mini Program sample id."),
      overwrite: z.boolean().default(true).describe("Whether to overwrite an existing generated run sequence.")
    },
    async ({ projectPath, sampleId, overwrite }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const sample = findMiniProgramSample(sampleId);
      const sequence = buildMiniProgramRunSequence(sample);
      const result = await writeMiniProgramArtifact(root, sample, "RUN_SEQUENCE.md", buildMiniProgramRunSequenceMarkdown(sequence), overwrite);
      return jsonText({
        ...result,
        relativePath: path.relative(root, result.path),
        steps: sequence.steps.map((step) => step.name)
      });
    }
  );

  registerTool(
    "easyar_import_miniprogram_sample_from_local_package",
    "Copy a user-downloaded official EasyAR Mini Program SDK/sample package into the project with a safe dry-run first.",
    {
      projectPath: z.string().describe("WeChat Mini Program project path."),
      sampleId: z.enum(["wechat-mega", "wechat-crs"]).describe("Mini Program sample id."),
      packagePath: z.string().describe("Local path to the official EasyAR Mini Program SDK/sample package downloaded by the user."),
      relativeTargetDir: z.string().optional().describe("Optional target directory inside the Mini Program project. Defaults to miniprogram/easyar-samples/<sampleId>."),
      overwrite: z.boolean().default(false).describe("Whether to overwrite an existing target directory."),
      dryRun: z.boolean().default(true).describe("Keep true first to preview files and skipped private paths before copying.")
    },
    async ({ projectPath, sampleId, packagePath, relativeTargetDir, overwrite, dryRun }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const sample = findMiniProgramSample(sampleId);
      const result = await importMiniProgramSampleFromLocalPackage({
        root,
        sample,
        packagePath,
        relativeTargetDir,
        overwrite,
        dryRun
      });
      return jsonText({
        ...result,
        source: path.relative(root, result.source) || ".",
        target: path.relative(root, result.target) || "."
      });
    }
  );

  registerTool(
    "easyar_analyze_miniprogram_devtools_log",
    "Analyze a WeChat Developer Tools or EasyAR Mini Program log and return redacted issues plus next actions.",
    {
      sampleId: z.enum(["wechat-mega", "wechat-crs"]).optional().describe("Optional Mini Program sample id for sample-specific issue severity."),
      projectPath: z.string().optional().describe("Optional project path used when logPath is relative."),
      logPath: z.string().optional().describe("Optional log file path. Relative paths are resolved under projectPath."),
      logText: z.string().optional().describe("Optional raw log text. Secret-like values are redacted before returning.")
    },
    async ({ sampleId, projectPath, logPath, logText }) => {
      if (!logPath && !logText) {
        throw new Error("Provide either logPath or logText.");
      }
      const sample = sampleId ? findMiniProgramSample(sampleId) : null;
      let text = logText ?? "";
      let resolvedLogPath: string | null = null;
      if (logPath) {
        if (path.isAbsolute(logPath)) {
          resolvedLogPath = logPath;
        } else {
          if (!projectPath) {
            throw new Error("projectPath is required when logPath is relative.");
          }
          const root = resolveProjectPath(projectPath);
          await ensureDirectory(root);
          resolvedLogPath = path.resolve(root, logPath);
        }
        text = await readFile(resolvedLogPath, "utf8");
      }
      return jsonText({
        ...analyzeMiniProgramDevtoolsLog(text, sample),
        logPath: resolvedLogPath ? path.basename(resolvedLogPath) : null
      });
    }
  );

  registerTool(
    "easyar_run_miniprogram_devtools_check",
    "Run a local WeChat Developer Tools CLI open/compile smoke command and write a redacted log analysis.",
    {
      projectPath: z.string().describe("WeChat Mini Program project path."),
      sampleId: z.enum(["wechat-mega", "wechat-crs"]).describe("Mini Program sample id."),
      cliPath: z.string().optional().describe("Optional explicit WeChat Developer Tools CLI path."),
      devtoolsArgs: z.array(z.string()).optional().describe("Optional exact CLI args. Defaults to opening the project with -o <projectPath>."),
      logPath: z.string().optional().describe("Optional relative log path. Defaults to easyar-generated/<sampleId>/DEVTOOLS_CHECK.log."),
      timeoutSeconds: z.number().int().min(5).max(600).default(120).describe("Command timeout in seconds."),
      dryRun: z.boolean().default(true).describe("Preview the command without executing it. Set false only after WeChat Developer Tools is installed and logged in.")
    },
    async ({ projectPath, sampleId, cliPath, devtoolsArgs, logPath, timeoutSeconds, dryRun }) => {
      const root = resolveProjectPath(projectPath);
      await ensureDirectory(root);
      const sample = findMiniProgramSample(sampleId);
      const cli = await findWeChatDevToolsCli(cliPath);
      const command = cli.detectedPath ?? cliPath ?? "cli";
      const args = devtoolsArgs ?? ["-o", root];
      const relativeLogPath = logPath ?? path.join("easyar-generated", sample.id, "DEVTOOLS_CHECK.log");
      const resolvedLogPath = path.resolve(root, relativeLogPath);
      const relative = path.relative(root, resolvedLogPath);
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        throw new Error("logPath must stay inside the Mini Program project.");
      }
      if (dryRun) {
        return jsonText({
          dryRun: true,
          command,
          args,
          detectedCli: cli.detectedPath,
          logPath: relative,
          nextActions: [
            "Open WeChat Developer Tools once and confirm the user is logged in.",
            "Set dryRun=false to execute the local CLI check.",
            "If the official CLI requires different compile/preview arguments, pass them in devtoolsArgs."
          ]
        });
      }
      if (!cli.detectedPath && !cliPath) {
        throw new Error("WeChat Developer Tools CLI was not found. Pass cliPath or set WECHAT_DEVTOOLS_CLI.");
      }
      const result = await runProcess(command, args, timeoutSeconds);
      const sanitizedStdout = redactMiniProgramSecretText(result.stdout);
      const sanitizedStderr = redactMiniProgramSecretText(result.stderr);
      const combinedLog = [
        `$ ${[command, ...args].join(" ")}`,
        "",
        "## stdout",
        sanitizedStdout,
        "",
        "## stderr",
        sanitizedStderr
      ].join("\n");
      await mkdir(path.dirname(resolvedLogPath), { recursive: true });
      await writeFile(resolvedLogPath, combinedLog, "utf8");
      const analysis = analyzeMiniProgramDevtoolsLog(`${sanitizedStdout}\n${sanitizedStderr}`, sample);
      return jsonText({
        command: result.command,
        exitCode: result.exitCode,
        timedOut: result.timedOut,
        logPath: relative,
        stdoutTail: sanitizedStdout.slice(-4000),
        stderrTail: sanitizedStderr.slice(-4000),
        analysis
      });
    }
  );
}
