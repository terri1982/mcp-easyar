# EasyAR Mega WeChat Mini Program MCP Design

This document defines an MCP service scope for registered EasyAR Mega users who want Codex, Claude, or another MCP client to prepare, inspect, run, and validate official WeChat Mini Program samples.

The service must not collect EasyAR passwords, WeChat passwords, verification codes, raw API tokens, license keys, app keys, app secrets, or private certificates in chat. Secret values should be read from local environment variables, local untracked config files, the operating-system keychain, or official platform sessions.

## Goals

- Guide registered EasyAR users through official Mega account, license, SDK, and sample access.
- Create or repair a local WeChat Mini Program sample workspace.
- Validate EasyAR Mega local config without exposing secrets.
- Generate focused sample runbooks and handoff artifacts for Codex and Claude.
- Integrate with WeChat Developer Tools CLI when available.
- Produce evidence for compile, preview, upload, and real-device validation.

## Non-Goals

- Bypass EasyAR account checks, download gates, license checks, or rate limits.
- Automate EasyAR or WeChat login forms with user credentials.
- Store secrets in generated Markdown artifacts.
- Claim a sample is complete without device evidence.

## Core Tool Interfaces

### Server And Catalog

- `easyar_mega_server_status`
  - Purpose: return server version, supported platforms, configured official endpoints, local tool availability, and recommended first calls.
  - Inputs: none.
  - Output: capability summary, auth state, platform state, next calls.

- `easyar_mega_official_info`
  - Purpose: return official links, captured SDK/sample version metadata, and support scope.
  - Inputs: optional `locale`.
  - Output: links, package names, version notes, freshness timestamp.

- `easyar_mega_list_samples`
  - Purpose: list supported WeChat Mini Program sample categories.
  - Inputs: optional `scope`.
  - Output: sample ids, required capabilities, implementation status.
  - Suggested focused sample ids: `image-tracking`, `cloud-recognition`, `geo-spatial`, `mega-scene`.

### Account And Official Access

- `easyar_mega_auth_status`
  - Purpose: report whether local official API env vars are configured.
  - Inputs: none.
  - Output: booleans only; token previews must be redacted.

- `easyar_mega_account_onboarding`
  - Purpose: guide registration/login as a browser handoff.
  - Inputs: `accountStage`, optional `sampleId`.
  - Output: official browser actions, return prompt, next MCP call.

- `easyar_mega_account_materials`
  - Purpose: list required account materials and where each value should live.
  - Inputs: `sampleId`, `platform=wechat-miniprogram`.
  - Output: field source, storage path, share policy.

- `easyar_mega_check_account`
  - Purpose: call configured official account status endpoint.
  - Inputs: none.
  - Output: configured/ok/statusCode/summary, sanitized details.

- `easyar_mega_validate_license`
  - Purpose: verify that an EasyAR Mega license is valid for the Mini Program app id.
  - Inputs: `projectPath`, optional `appId`, optional `licenseKey`.
  - Output: ok, binding summary, redacted details, next actions.

- `easyar_mega_discover_downloads`
  - Purpose: discover account-authorized Mega SDK and official sample packages.
  - Inputs: `sampleId`, optional `sdkVersion`, optional `miniprogramBaseLibVersion`.
  - Output: package metadata and official download instructions, not unauthorized direct downloads.

- `easyar_mega_check_official_access`
  - Purpose: run account, license, downloads, and sample-specific official access checks together.
  - Inputs: `projectPath`, `sampleId`.
  - Output: pass/blocker matrix.

### WeChat Mini Program Project Inspection

- `easyar_mega_inspect_miniprogram_project`
  - Purpose: inspect local Mini Program structure.
  - Inputs: `projectPath`.
  - Output: presence of `project.config.json`, `app.json`, `miniprogram/`, pages, components, npm status, EasyAR files, SDK files.

- `easyar_mega_check_wechat_devtools`
  - Purpose: find and validate WeChat Developer Tools CLI.
  - Inputs: optional `cliPath`, optional `candidateDirs`.
  - Output: detected path, version command result, login requirement hints.

- `easyar_mega_check_sample_readiness`
  - Purpose: report local blockers before running a selected sample.
  - Inputs: `projectPath`, `sampleId`.
  - Output: checks for app id, config, SDK import, pages, permissions, domain/network allowlist, assets, package manager.

- `easyar_mega_generate_focused_preflight`
  - Purpose: generate the single gate before running or uploading.
  - Inputs: `projectPath`, `sampleId`, optional `target=devtools|device`.
  - Output: account, config, project, SDK, DevTools, and sample readiness matrix.

- `easyar_mega_write_focused_preflight`
  - Purpose: write `easyar-generated/<sampleId>/PREFLIGHT.md`.
  - Inputs: same as preflight plus `overwrite`.
  - Output: written path and summary.

### Local Config And Secret Handling

- `easyar_mega_prepare_miniprogram_project`
  - Purpose: create generated directories, config templates, `.gitignore` rules, and sample runbook.
  - Inputs: `projectPath`, `sampleId`.
  - Output: written files and next actions.

- `easyar_mega_generate_local_config_form`
  - Purpose: show a fillable non-secret form for `easyar.mega.local.json`.
  - Inputs: `projectPath`, `sampleId`.
  - Output: field list, placeholders, official sources, env alternatives.

- `easyar_mega_write_local_config_form`
  - Purpose: write `easyar-generated/<sampleId>/LOCAL_CONFIG_FORM.md`.
  - Inputs: `projectPath`, `sampleId`.
  - Output: written path.

- `easyar_mega_write_local_config_from_env`
  - Purpose: write local config from environment-backed secrets.
  - Inputs: `projectPath`, `sampleId`.
  - Reads env: `EASYAR_MEGA_LICENSE_KEY`, `EASYAR_MEGA_APP_KEY`, `EASYAR_MEGA_APP_SECRET`, `WECHAT_MINIPROGRAM_APP_ID`.
  - Output: presence and validation result only.

- `easyar_mega_validate_local_config`
  - Purpose: validate required local config fields without returning secrets.
  - Inputs: `projectPath`, `sampleId`.
  - Output: missing/placeholder fields and next actions.

### Sample Import And Code Generation

- `easyar_mega_generate_import_checklist`
  - Purpose: generate official SDK/sample import checklist.
  - Inputs: `projectPath`, `sampleId`.
  - Output: ordered steps and verification calls.

- `easyar_mega_import_sample_from_local_package`
  - Purpose: copy a locally downloaded official sample into the project.
  - Inputs: `projectPath`, `packagePath`, `sampleId`, optional `dryRun`.
  - Output: file plan or copied files.

- `easyar_mega_generate_run_sequence`
  - Purpose: generate the ordered Codex/Claude workflow for the sample.
  - Inputs: `projectPath`, `sampleId`, `target=devtools|device`.
  - Output: steps, commands, evidence fields.

- `easyar_mega_write_run_sequence`
  - Purpose: write `RUN_SEQUENCE.md`.
  - Inputs: `projectPath`, `sampleId`, target.
  - Output: written path.

- `easyar_mega_generate_code_plan`
  - Purpose: plan Mini Program JS/TS/WXML/WXSS edits before writing code.
  - Inputs: `projectPath`, `sampleId`, `changeGoal`.
  - Output: scoped file plan and test plan.

- `easyar_mega_write_miniprogram_file`
  - Purpose: write a JS/TS/WXML/WXSS/JSON file safely under the Mini Program root.
  - Inputs: `projectPath`, `relativePath`, `content`, optional `overwrite`.
  - Output: written path and safety checks.

- `easyar_mega_create_sample_page`
  - Purpose: create a focused sample page with required page registration.
  - Inputs: `projectPath`, `sampleId`, `pagePath`.
  - Output: generated files and app/page config changes.

- `easyar_mega_review_miniprogram_code`
  - Purpose: static review for EasyAR Mega and Mini Program risks.
  - Inputs: `projectPath`, optional `paths`.
  - Output: findings for secrets, permissions, lifecycle, SDK init, canvas/camera use, async cleanup.

### WeChat DevTools Automation

- `easyar_mega_run_miniprogram_compile_check`
  - Purpose: invoke WeChat Developer Tools CLI compile/open check when available.
  - Inputs: `projectPath`, optional `cliPath`, optional `logPath`.
  - Output: exit status, sanitized log analysis, next actions.

- `easyar_mega_run_devtools_preview`
  - Purpose: create a preview QR code through DevTools CLI.
  - Inputs: `projectPath`, optional `cliPath`, optional `qrOutputPath`.
  - Output: QR path, log summary, known blockers.

- `easyar_mega_run_devtools_upload_dry_run`
  - Purpose: verify upload configuration without publishing when supported by local workflow.
  - Inputs: `projectPath`, version, description.
  - Output: command plan, safety gate, local validation result.

- `easyar_mega_analyze_devtools_log`
  - Purpose: analyze WeChat DevTools logs for common project, app id, domain, package, and EasyAR issues.
  - Inputs: `logPath` or `logText`, optional `sampleId`.
  - Output: classified issues and next actions.

### Device Validation And Handoff

- `easyar_mega_generate_device_validation_checklist`
  - Purpose: create a real-device validation checklist.
  - Inputs: `projectPath`, `sampleId`, `devicePlatform=ios|android`.
  - Output: expected camera, network, permission, recognition, and tracking evidence.

- `easyar_mega_write_device_validation_checklist`
  - Purpose: write `DEVICE_VALIDATION.md`.
  - Inputs: project path, sample id, device platform.
  - Output: written path.

- `easyar_mega_generate_run_result`
  - Purpose: summarize compile, preview, upload, and device attempts.
  - Inputs: `projectPath`, `sampleId`, `overallStatus`, evidence fields.
  - Output: redacted result summary.

- `easyar_mega_write_run_result`
  - Purpose: write `RUN_RESULT.md`.
  - Inputs: same as run result.
  - Output: written path.

- `easyar_mega_generate_completion_report`
  - Purpose: determine whether the sample is genuinely run through.
  - Inputs: `projectPath`, `sampleId`.
  - Output: `runThroughComplete`, blocker list, evidence list.

- `easyar_mega_write_completion_report`
  - Purpose: write `COMPLETION_REPORT.md`.
  - Inputs: project path and sample id.
  - Output: written path.

- `easyar_mega_generate_issue_report`
  - Purpose: generate a redacted support issue for failed samples.
  - Inputs: `projectPath`, `sampleId`, status, symptoms.
  - Output: Markdown report without secrets.

## Resource Interfaces

- `easyar-mega://samples/catalog`
- `easyar-mega://official/info`
- `easyar-mega://official/api-contract`
- `easyar-mega://wechat/checklist`
- `easyar-mega://workflow/quickstart`
- `easyar-mega://security/secrets`

## Prompt Interfaces

- `easyar-mega-run-image-tracking`
- `easyar-mega-run-cloud-recognition`
- `easyar-mega-miniprogram-code-review`
- `easyar-mega-validate-official-access`
- `easyar-mega-device-validation`

## Per-Tool Test Strategy

Use three layers for each tool.

1. Schema test
   - Call the MCP tool with valid minimal input.
   - Call it with invalid enum/path/missing required input.
   - Assert Zod/MCP errors are clear and do not include secrets.

2. Fixture test
   - Use a temporary fake Mini Program project containing `project.config.json`, `app.json`, pages, fake EasyAR SDK files, and fake logs.
   - Assert returned readiness checks, blockers, written paths, and Markdown content.

3. Integration smoke test
   - Start the MCP server over stdio.
   - Run `initialize`, `tools/list`, selected `tools/call`, `resources/list`, and selected `resources/read`.
   - Assert JSON-RPC responses are valid and server exits cleanly.

Recommended per-interface tests:

- Server/catalog tools: verify tools/resources/prompts are listed and focused samples are present.
- Account tools: test missing endpoint, missing token, fake 200, fake 401, and secret redaction.
- Project inspection: test empty folder, partial Mini Program, valid Mini Program, and workspace with subpackage.
- Config tools: test missing config, placeholder config, valid config, Cloud Recognition config, env-backed writer.
- Import tools: test dry run, missing package, package outside allowed root, overwrite false, overwrite true.
- Code tools: test safe relative paths, path traversal rejection, JSON registration update, secret scan.
- DevTools tools: test CLI missing, fake CLI success, fake CLI failure, log classification.
- Device/report tools: test blocked, failed, passed without device evidence, passed with device evidence.

## Platform Support And Platform Tests

### Codex

Supported entrypoints:

- local dist: `node /absolute/path/to/dist/index.js`
- package bin: `easyar-mcp`
- npx: `npx -y mcp-easyar`

Tests:

- Generate Codex config with `easyar_mega_generate_client_config client=codex`.
- Run `easyar_mega_server_status`.
- Run `easyar_mega_inspect_miniprogram_project` on a fixture project.
- Run `easyar_mega_write_focused_preflight` and verify generated Markdown.
- Run `easyar_mega_review_miniprogram_code` after a controlled sample edit.

### Claude Desktop

Supported entrypoints:

- stdio MCP server configured in Claude Desktop JSON.

Tests:

- Generate Claude config with `easyar_mega_generate_client_config client=claude-desktop`.
- Confirm `tools/list` shows all EasyAR Mega tools.
- Ask Claude to call `easyar_mega_server_status`.
- Ask Claude to create `LOCAL_CONFIG_FORM.md` and `PREFLIGHT.md` in a fixture project.
- Confirm generated artifacts contain no secret values.

### Generic MCP Clients

Supported entrypoints:

- Any MCP client that supports stdio transport and MCP tools/resources/prompts.

Tests:

- JSON-RPC stdio smoke test with `initialize`, `tools/list`, `resources/list`, and three representative `tools/call` requests.
- Validate compatibility with the declared MCP protocol version.

### WeChat Developer Tools

Supported surface:

- Local DevTools CLI for compile/open/preview/upload validation when installed and logged in.

Tests:

- Missing CLI returns a clear blocker.
- Fake CLI fixture returns successful compile and preview logs.
- Real CLI test on a developer machine:
  - `easyar_mega_check_wechat_devtools`
  - `easyar_mega_run_miniprogram_compile_check`
  - `easyar_mega_run_devtools_preview`
- Validate QR output path exists when preview succeeds.
- Validate logs are redacted and classified.

### EasyAR Official Backend

Supported surface:

- Configurable official endpoints for account, license, downloads, and sample metadata.

Tests:

- Missing endpoint returns configured=false.
- Missing token returns configured=true and ok=null.
- Mock 200 returns ok=true.
- Mock 401/403 returns ok=false and account/license next actions.
- Response fields matching token/key/secret/license/password are redacted recursively.

### GitHub Actions Or Other CI

Supported surface:

- Non-secret package, typecheck, smoke, and fixture tests.

Tests:

- `npm run typecheck`
- `npm test`
- `npm run package:smoke`
- No real EasyAR or WeChat secrets required.
- Optional nightly job can use official test account secrets from CI secret storage.

### macOS, Windows, Linux

Support expectation:

- MCP server itself should run anywhere Node.js 20+ runs.
- WeChat Developer Tools automation is primarily validated on developer machines where DevTools CLI is installed.

Tests:

- Path handling for absolute paths and spaces.
- Executable discovery by platform.
- Fixture project tests on all OS targets.
- Real DevTools CLI smoke on macOS and Windows developer machines.

## Recommended First User Flow

1. `easyar_mega_server_status`
2. `easyar_mega_account_onboarding accountStage=logged-in sampleId=image-tracking`
3. `easyar_mega_account_materials sampleId=image-tracking`
4. `easyar_mega_prepare_miniprogram_project projectPath=/path/to/miniprogram sampleId=image-tracking`
5. `easyar_mega_write_local_config_form projectPath=/path/to/miniprogram sampleId=image-tracking`
6. User fills local config outside chat, or sets env vars.
7. `easyar_mega_validate_local_config projectPath=/path/to/miniprogram sampleId=image-tracking`
8. `easyar_mega_check_wechat_devtools`
9. `easyar_mega_write_focused_preflight projectPath=/path/to/miniprogram sampleId=image-tracking`
10. `easyar_mega_run_miniprogram_compile_check projectPath=/path/to/miniprogram`
11. `easyar_mega_run_devtools_preview projectPath=/path/to/miniprogram`
12. Real-device scan and validation.
13. `easyar_mega_write_run_result`
14. `easyar_mega_write_completion_report`

