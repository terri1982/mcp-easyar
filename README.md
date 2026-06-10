<p align="center">
  <img src="assets/easyar-icon.png" alt="EasyAR logo" width="96" height="96">
</p>

# mcp-easyar

[![CI](https://github.com/terri1982/mcp-easyar/actions/workflows/ci.yml/badge.svg)](https://github.com/terri1982/mcp-easyar/actions/workflows/ci.yml)

`mcp-easyar` helps registered EasyAR users connect AI coding tools such as Codex and Claude to authorized EasyAR Unity workflows.

This MVP focuses on local Unity project assistance. The current sample run-through scope is intentionally limited to Image Tracking and Cloud Recognition; Hello AR, Surface Tracking, and other samples are cataloged for later expansion.

- inspect Unity project structure and EasyAR-related files
- report server status, capability summary, resources, and recommended first calls
- diagnose whether a Unity project is ready to run a selected EasyAR sample
- generate official EasyAR Unity Plugin and focused sample import checklists
- write import checklists into Unity projects as Markdown artifacts
- generate an ordered focused sample run sequence for Codex or Claude
- write focused run sequences into Unity projects as Markdown artifacts
- index focused sample handoff artifacts with recommended reading order
- generate a focused sample run report across readiness, config, and script review
- write focused run reports into Unity projects as Markdown artifacts
- audit focused sample scenes, Build Settings hints, EasyAR import signals, and sample-specific blockers
- generate focused support bundles that summarize project state, scene audit, run report, and latest Unity log diagnostics
- generate real-device validation checklists for focused Image Tracking and Cloud Recognition tests
- write device validation checklists into Unity projects as Markdown artifacts
- record focused sample run results for compile, build, and device validation handoff
- plan scoped Unity C# changes before Codex or Claude writes sample scripts
- summarize Unity C# code changes after script edits and before Unity compilation
- list common EasyAR Unity sample categories with focused/deferred status
- generate an Editor runner script for opening sample scenes
- generate an Editor helper for Android/iOS player settings and camera permissions
- generate an Editor helper for adding sample scenes to Unity Build Settings
- generate an Editor helper for Unity-side focused sample validation
- generate an Editor helper for Android/iOS/Standalone player builds
- generate focused runbooks and support directories for Image Tracking and Cloud Recognition
- prepare a Unity project with EasyAR local config templates and secret ignore rules
- validate local EasyAR config files without exposing secrets
- generate Unity MonoBehaviour script templates for common EasyAR workflows
- write C# scripts safely inside a Unity project
- review Unity C# scripts for common EasyAR and AR sample risks
- run a Unity batch compile/import check after code changes
- run a Unity static editor method in batch mode
- inspect Unity executable configuration before batch mode runs
- analyze Unity Editor/build logs for common EasyAR issues plus Image Tracking and Cloud Recognition specifics
- find and analyze the latest Unity log after a failed batch run
- expose EasyAR workflow guidance as MCP resources
- expose MCP prompts for Image Tracking, Cloud Recognition, and Unity programming assistance
- check Codex/Claude/generic MCP client setup before users paste config
- write client setup reports for handoff and troubleshooting
- recommend the next focused workflow step from current project evidence
- write workflow state handoff artifacts for Codex/Claude continuation
- check EasyAR account environment configuration without exposing secrets
- call configured official EasyAR account/license validation endpoints without exposing secrets
- run focused official access checks across account, license, downloads, and Cloud Recognition endpoints
- write official access reports into Unity projects as Markdown artifacts
- generate MCP client configuration snippets for Codex and Claude
- generate and write deployment readiness reports for GitHub release, official endpoint, Unity path, and security checks
- generate release/install manifests for users and AI tools

The server is intentionally built for official, authorized use. Production deployments should connect `EASYAR_API_BASE_URL` and `EASYAR_API_TOKEN` to EasyAR account/license APIs before serving private SDK downloads or account-scoped content.

This project must not be used to bypass EasyAR login, license checks, download authorization, enterprise gates, rate limits, or any other access control.

Official references used by this MVP:

- EasyAR sample apps: https://www.easyar.cn/doc/en/develop/samples.html
- EasyAR download page: https://www.easyar.com/view/download.html
- EasyAR download history: https://www.easyar.com/view/downloadHistory.html

## Install

```bash
npm install
npm run build
```

## Run

```bash
npm start
```

Optional environment variables:

```bash
EASYAR_API_BASE_URL=https://www.easyar.cn
EASYAR_API_TOKEN=your_registered_user_token
EASYAR_ACCOUNT_STATUS_ENDPOINT=https://www.easyar.cn/path/to/official/account/status
EASYAR_LICENSE_VALIDATE_ENDPOINT=https://www.easyar.cn/path/to/official/license/validate
EASYAR_DOWNLOADS_ENDPOINT=https://www.easyar.cn/path/to/official/downloads
EASYAR_CLOUD_CREDENTIALS_ENDPOINT=https://www.easyar.cn/path/to/official/cloud-recognition/credentials
EASYAR_UNITY_PATH=/Applications/Unity/Hub/Editor/2022.3.62f1/Unity.app/Contents/MacOS/Unity
```

`EASYAR_ACCOUNT_STATUS_ENDPOINT`, `EASYAR_LICENSE_VALIDATE_ENDPOINT`, `EASYAR_DOWNLOADS_ENDPOINT`, and `EASYAR_CLOUD_CREDENTIALS_ENDPOINT` are intentionally configurable. Connect them to authorized EasyAR account APIs in production; the open-source default does not guess or bypass private EasyAR endpoints.

## Claude Desktop

```json
{
  "mcpServers": {
    "easyar": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-easyar/dist/index.js"],
      "env": {
        "EASYAR_API_BASE_URL": "https://www.easyar.cn",
        "EASYAR_API_TOKEN": "your_registered_user_token"
      }
    }
  }
}
```

## Codex

Use the same stdio command:

```bash
node /absolute/path/to/mcp-easyar/dist/index.js
```

You can also ask the MCP server for a config snippet with `easyar_generate_client_config`.

## Local Development

```bash
npm install
npm run dev
```

Run checks:

```bash
npm run build
npm run typecheck
npm test
npm run bin:smoke
npm run pack:check
```

## Quickstart

See [docs/quickstart.md](docs/quickstart.md) for the recommended Codex/Claude to Unity workflow.

## Release Manifest

See [docs/RELEASE_MANIFEST.md](docs/RELEASE_MANIFEST.md) for install commands, MCP entrypoints, focused scope, environment variable names, and release checks.

## Release Checks

Before publishing a release or npm package:

```bash
npm run typecheck
npm test
npm run bin:smoke
npm run pack:check
```

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Tools

- `easyar_list_samples`: list supported sample categories.
- `easyar_server_status`: return server version, capability summary, resources, authorization state, and recommended first calls.
- `easyar_official_info`: return official EasyAR links and currently documented package versions captured by this MCP server.
- `easyar_auth_status`: check EasyAR API environment configuration without returning secrets.
- `easyar_check_account`: call a configured official EasyAR account-status endpoint with `EASYAR_API_TOKEN`.
- `easyar_validate_license`: call a configured official EasyAR license-validation endpoint using local config or explicit input without returning secrets.
- `easyar_discover_downloads`: call a configured official downloads endpoint for account-scoped SDK/sample package discovery without returning tokens.
- `easyar_discover_cloud_credentials`: call a configured official Cloud Recognition endpoint for account-scoped credential metadata without returning secrets.
- `easyar_check_official_access`: run a focused official account, license, downloads, and sample-specific access check without exposing secrets.
- `easyar_write_official_access_report`: write the official access check to `Assets/EasyARGenerated/<sampleId>/OFFICIAL_ACCESS.md`.
- `easyar_generate_client_config`: generate Codex, Claude Desktop, or generic MCP stdio configuration.
- `easyar_check_client_setup`: validate Node.js, package/bin metadata, built entrypoint, server path, and generated MCP client config.
- `easyar_write_client_setup`: write client setup status and config snippet to `EasyARGenerated/CLIENT_SETUP.md` or `Assets/EasyARGenerated/CLIENT_SETUP.md`.
- `easyar_deployment_readiness`: generate a deployment readiness report across package metadata, GitHub release files, official endpoint environment, Unity path, focused scope, and security checks.
- `easyar_write_deployment_readiness`: write the deployment readiness report as Markdown inside a project or workspace directory.
- `easyar_release_manifest`: generate a consumer-facing install/release manifest with package metadata, entrypoints, focused scope, env names, and verification commands.
- `easyar_write_release_manifest`: write the release manifest to `docs/RELEASE_MANIFEST.md` or a selected path.
- `easyar_next_workflow_step`: inspect current focused project state and recommend the next MCP/Unity action.
- `easyar_write_workflow_state`: write current workflow phase, blockers, and next call to `Assets/EasyARGenerated/<sampleId>/WORKFLOW_STATE.md`.
- `easyar_generate_import_checklist`: generate an official EasyAR Unity Plugin and focused sample import checklist for Image Tracking or Cloud Recognition.
- `easyar_write_import_checklist`: write the official import checklist to `Assets/EasyARGenerated/<sampleId>/IMPORT_CHECKLIST.md`.
- `easyar_generate_run_sequence`: generate an ordered MCP/Unity batch sequence for Image Tracking or Cloud Recognition.
- `easyar_write_run_sequence`: write the focused run sequence to `Assets/EasyARGenerated/<sampleId>/RUN_SEQUENCE.md`.
- `easyar_generate_artifact_index`: generate an index of focused handoff artifacts and recommended reading order.
- `easyar_write_artifact_index`: write the focused artifact index to `Assets/EasyARGenerated/<sampleId>/ARTIFACT_INDEX.md`.
- `easyar_generate_run_report`: summarize focused sample readiness, local config validation, script review, and next phase.
- `easyar_write_run_report`: write the focused sample run report to `Assets/EasyARGenerated/<sampleId>/RUN_REPORT.md`.
- `easyar_audit_sample_scene`: audit scene candidates, Build Settings hints, EasyAR import signals, and focused sample blockers.
- `easyar_write_scene_audit`: write the focused scene audit to `Assets/EasyARGenerated/<sampleId>/SCENE_AUDIT.md`.
- `easyar_generate_support_bundle`: generate a focused support bundle summary across run sequence, run report, scene audit, and latest Unity log diagnostics.
- `easyar_write_support_bundle`: write the focused support bundle to `Assets/EasyARGenerated/<sampleId>/SUPPORT_BUNDLE.md`.
- `easyar_generate_device_validation_checklist`: generate focused real-device validation steps, pass criteria, blockers, and evidence prompts.
- `easyar_write_device_validation_checklist`: write the real-device validation checklist to `Assets/EasyARGenerated/<sampleId>/DEVICE_VALIDATION.md`.
- `easyar_generate_run_result`: generate a focused sample run result summary for compile, build, or device validation attempts.
- `easyar_write_run_result`: write the focused run result to `Assets/EasyARGenerated/<sampleId>/RUN_RESULT.md`.
- `easyar_inspect_unity_project`: inspect a Unity project for package, asset, scene, and EasyAR signals.
- `easyar_check_sample_readiness`: report missing local requirements before running a selected sample.
- `easyar_validate_local_config`: validate `ProjectSettings/EasyAR/easyar.local.json` without returning secrets.
- `easyar_generate_sample_plan`: create a practical setup/run plan for a sample.
- `easyar_prepare_unity_project`: create a sample runner, focused sample runbook, EasyAR local config template, and secret ignore rules in a Unity project.
- `easyar_create_sample_validation_helper`: create `Assets/Editor/EasyARSampleValidationHelper.cs` for Unity-side focused sample validation, excluding generated MCP helper files from official EasyAR import signals.
- `easyar_create_mobile_settings_helper`: create `Assets/Editor/EasyARMobileSettingsHelper.cs` for Android/iOS player settings and camera permission setup.
- `easyar_create_build_settings_helper`: create `Assets/Editor/EasyARBuildSettingsHelper.cs` for Build Settings automation.
- `easyar_create_device_build_helper`: create `Assets/Editor/EasyARDeviceBuildHelper.cs` for Unity player builds.
- `easyar_create_sample_runner`: create `Assets/Editor/EasyARSampleRunner.cs`.
- `easyar_generate_code_plan`: generate a focused Unity C# implementation plan before editing sample code.
- `easyar_write_code_plan`: write the focused C# implementation plan to `Assets/EasyARGenerated/<sampleId>/CODE_PLAN.md`.
- `easyar_create_mono_behaviour`: create a Unity C# MonoBehaviour template for EasyAR sample development.
- `easyar_write_csharp_file`: create or replace a `.cs` file inside a Unity project.
- `easyar_generate_code_change_summary`: generate a focused C# change summary after script edits.
- `easyar_write_code_change_summary`: write the focused C# change summary to `Assets/EasyARGenerated/<sampleId>/CODE_CHANGE.md`.
- `easyar_review_csharp_scripts`: review Unity C# scripts for common EasyAR secret, lifecycle, input, and performance risks.
- `easyar_unity_environment`: inspect `EASYAR_UNITY_PATH` and common Unity install locations without launching Unity.
- `easyar_run_unity_compile_check`: open Unity in batch mode to force script import/compilation and analyze the generated log.
- `easyar_run_unity_method`: execute a Unity static editor method in batch mode, optionally writing a project-local Unity log with `logPath`.
- `easyar_analyze_unity_log`: analyze Unity Editor/build logs and suggest next debugging actions, with optional focused sample diagnostics.
- `easyar_analyze_latest_unity_log`: locate the latest Unity Editor/project log and analyze its tail.

## Resources

- `easyar://samples/catalog`
- `easyar://official/info`
- `easyar://unity/checklist`
- `easyar://workflow/quickstart`

## Prompts

- `easyar-run-image-tracking`
- `easyar-run-cloud-recognition`
- `easyar-unity-programming-assistant`
