import { readFile } from "node:fs/promises";
import path from "node:path";
import { miniProgramSamples } from "./miniprogram-samples.js";

type ResourceContext = {
  samples: unknown;
  officialInfo: unknown;
  officialOpenApiPath: string;
  packageRoot: string;
  quickstartWorkflow: string;
  buildOfficialApiContract: (baseUrl: string | undefined, includeExamples: boolean) => any;
  buildOfficialApiContractMarkdown: (contract: any) => string;
};

export function registerResources(server: any, context: ResourceContext) {
  const { samples, officialInfo, officialOpenApiPath, packageRoot, quickstartWorkflow, buildOfficialApiContract, buildOfficialApiContractMarkdown } = context;

  server.resource(
    "easyar-samples-catalog",
    "easyar://samples/catalog",
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(samples, null, 2)
        }
      ]
    })
  );
  
  server.resource(
    "easyar-official-info",
    "easyar://official/info",
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(officialInfo, null, 2)
        }
      ]
    })
  );

  server.resource(
    "easyar-wechat-miniprogram-samples",
    "easyar://samples/wechat-miniprogram",
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(miniProgramSamples, null, 2)
        }
      ]
    })
  );
  
  server.resource(
    "easyar-official-api-contract",
    "easyar://official/api-contract",
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: buildOfficialApiContractMarkdown(buildOfficialApiContract(undefined, true))
        }
      ]
    })
  );
  
  server.resource(
    "easyar-official-openapi",
    "easyar://official/openapi",
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: await readFile(officialOpenApiPath, "utf8")
        }
      ]
    })
  );
  
  server.resource(
    "easyar-client-acceptance",
    "easyar://client/acceptance",
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: await readFile(path.join(packageRoot, "docs", "CLIENT_ACCEPTANCE.md"), "utf8")
        }
      ]
    })
  );
  
  server.resource(
    "easyar-fresh-project-acceptance",
    "easyar://acceptance/fresh-project",
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: await readFile(path.join(packageRoot, "docs", "FRESH_PROJECT_ACCEPTANCE.md"), "utf8")
        }
      ]
    })
  );

  server.resource(
    "easyar-wechat-miniprogram-acceptance",
    "easyar://acceptance/wechat-miniprogram",
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: await readFile(path.join(packageRoot, "docs", "wechat-miniprogram-sample-acceptance.md"), "utf8")
        }
      ]
    })
  );
  
  server.resource(
    "easyar-current-status",
    "easyar://status/current",
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: await readFile(path.join(packageRoot, "docs", "STATUS.md"), "utf8")
        }
      ]
    })
  );
  
  server.resource(
    "easyar-remaining-work-status",
    "easyar://status/remaining-work",
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: await readFile(path.join(packageRoot, "docs", "REMAINING_WORK.md"), "utf8")
        }
      ]
    })
  );
  
  server.resource(
    "easyar-install-github-release",
    "easyar://install/github-release",
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: await readFile(path.join(packageRoot, "docs", "install-from-github-release.md"), "utf8")
        }
      ]
    })
  );
  
  server.resource(
    "easyar-release-local-key-mvp",
    "easyar://release/local-key-mvp",
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: await readFile(path.join(packageRoot, "docs", "release-notes", "local-key-mvp.md"), "utf8")
        }
      ]
    })
  );
  
  server.resource(
    "easyar-roadmap",
    "easyar://roadmap",
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: await readFile(path.join(packageRoot, "docs", "ROADMAP.md"), "utf8")
        }
      ]
    })
  );
  
  server.resource(
    "easyar-full-goal-plan",
    "easyar://roadmap/full-goal",
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: await readFile(path.join(packageRoot, "docs", "FULL_GOAL_PLAN.md"), "utf8")
        }
      ]
    })
  );
  
  server.resource(
    "easyar-unity-checklist",
    "easyar://unity/checklist",
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: [
            "# EasyAR Unity Checklist",
            "",
            "1. Use an official EasyAR account and license key.",
            "2. Import the EasyAR Sense Unity package that matches the target Unity version.",
            "3. Keep generated SDK assets and sample scenes inside the Unity project.",
            "4. Configure Android/iOS camera permissions and build target.",
            "5. Validate tracking samples on a real device.",
            "6. Keep account tokens, license keys, and cloud credentials out of source control."
          ].join("\n")
        }
      ]
    })
  );
  
  server.resource(
    "easyar-quickstart-workflow",
    "easyar://workflow/quickstart",
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: quickstartWorkflow
        }
      ]
    })
  );
  
  server.resource(
    "easyar-focused-scope-workflow",
    "easyar://workflow/focused-scope",
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: [
            "# EasyAR Focused Scope Workflow",
            "",
            "Current focused sample scope:",
            "",
            "- image-tracking",
            "- cloud-recognition",
            "",
            "Deferred samples stay out of the run-through scope until the user explicitly asks to continue.",
            "",
            "Recommended close-out sequence:",
            "",
            "1. Run `easyar_write_completion_report` for `image-tracking`.",
            "2. Run `easyar_write_completion_report` for `cloud-recognition`.",
            "3. Run `easyar_write_focused_scope_status`.",
            "4. Read `Assets/EasyARGenerated/FOCUSED_SCOPE_STATUS.md` first when another AI tool takes over.",
            "5. Treat the focused scope as complete only when `allFocusedSamplesComplete=true`."
          ].join("\n")
        }
      ]
    })
  );
  
  server.resource(
    "easyar-programming-workflow",
    "easyar://workflow/programming",
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: [
            "# EasyAR Unity Programming Workflow",
            "",
            "Use this workflow when Codex, Claude, or another AI tool is asked to change Unity C# code inside an EasyAR project.",
            "",
            "## Before Editing",
            "",
            "1. Run `easyar_write_focused_preflight` for the active focused sample.",
            "2. Run `easyar_write_config_integration_audit` before wiring license, local config, or Cloud Recognition values.",
            "3. Run `easyar_write_programming_context` and read `PROGRAMMING_CONTEXT.md` before planning edits.",
            "4. Run `easyar_write_code_plan` with the requested code goal and read `CODE_PLAN.md` before changing scripts.",
            "",
            "## Editing Rules",
            "",
            "- Keep changes scoped to the files named in `CODE_PLAN.md` or explicitly requested by the user.",
            "- Prefer `easyar_create_mono_behaviour` for a new focused adapter script, then patch that script only.",
            "- Use serialized fields, UnityEvents, or official sample wiring instead of broad scene searches.",
            "- Never hardcode EasyAR license keys, account tokens, API Key, API Secret, legacy appKey/appSecret, signing keys, or provisioning data.",
            "- Do not log secret-bearing local config values.",
            "",
            "## After Editing",
            "",
            "1. Run `easyar_review_csharp_scripts` for changed scripts.",
            "2. Run `easyar_write_code_change_summary` to write `CODE_CHANGE.md`.",
            "3. Run `easyar_run_unity_compile_check` with `sampleId`, `platform`, and a project-local `logPath`.",
            "4. If compile/build/device validation is attempted, record the result with `easyar_write_run_result`.",
            "5. Regenerate support or completion artifacts only after real evidence exists.",
            "",
            "## Handoff Order",
            "",
            "Read artifacts in this order when taking over a programming task:",
            "",
            "1. `PREFLIGHT.md`",
            "2. `CONFIG_INTEGRATION.md`",
            "3. `PROGRAMMING_CONTEXT.md`",
            "4. `CODE_PLAN.md`",
            "5. `CODE_CHANGE.md`",
            "6. Latest Unity compile log summary or `SUPPORT_BUNDLE.md`"
          ].join("\n")
        }
      ]
    })
  );
}
