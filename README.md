<p align="center">
  <img src="assets/easyar-icon.png" alt="EasyAR logo" width="96" height="96">
</p>

# mcp-easyar

[![CI](https://github.com/terri1982/mcp-easyar/actions/workflows/ci.yml/badge.svg)](https://github.com/terri1982/mcp-easyar/actions/workflows/ci.yml)

`mcp-easyar` helps registered EasyAR users connect AI coding tools such as Codex and Claude to authorized EasyAR Unity workflows.

This MVP focuses on local Unity project assistance. The current sample run-through scope is intentionally limited to Image Tracking and Cloud Recognition; Hello AR, Surface Tracking, and other samples are cataloged for later expansion.

Current readiness is split into two tracks:

- Local-key MVP: ready for focused Image Tracking and Cloud Recognition assistance when the official EasyAR Sense Unity Plugin is installed and local license/API keys are filled in the Unity project.
- Production official API automation: still requires EasyAR-owned account, license, download, and Cloud Recognition endpoints before private account-scoped distribution can be automated.

Current delivery path: use local-key MVP first. Users register/log in/download/create keys on the official EasyAR website in their own browser, then MCP guides local Unity configuration, validates redacted presence, and runs the focused Unity workflow without handling website passwords.

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
- recognize Image Tracking scenes by scene content markers as well as official sample naming hints
- report EasyAR PackageCache `Samples~` candidates when focused sample scenes have not been imported into `Assets/Samples`
- generate Unity Package Manager sample import guides for moving focused samples from `Samples~` into `Assets/Samples`
- generate focused support bundles that summarize project state, scene audit, run report, and latest Unity log diagnostics
- generate real-device validation checklists for focused Image Tracking and Cloud Recognition tests
- write device validation checklists into Unity projects as Markdown artifacts
- record focused sample run results for compile, build, and device validation handoff
- generate redacted GitHub issue reports for focused sample failures
- plan scoped Unity C# changes before Codex or Claude writes sample scripts
- summarize Unity C# code changes after script edits and before Unity compilation
- list common EasyAR Unity sample categories with focused/deferred status
- generate an Editor runner script for opening sample scenes
- generate an Editor helper for Android/iOS player settings and camera permissions
- generate an Editor helper for adding sample scenes to Unity Build Settings
- generate an Editor helper for Unity-side focused sample validation
- generate an Editor helper for Android/iOS/Standalone player builds
- generate focused runbooks and support directories for Image Tracking and Cloud Recognition
- generate a single focused preflight gate across account, local config, Unity path, imports, scene readiness, and script review
- prepare a Unity project with EasyAR local config templates and secret ignore rules
- validate local EasyAR config files without exposing secrets
- write local EasyAR Unity config from environment-backed secrets without returning secret values
- generate focused Unity programming context before editing C# scripts
- generate Unity MonoBehaviour script templates for common EasyAR workflows
- write C# scripts safely inside a Unity project
- review Unity C# scripts for common EasyAR and AR sample risks
- run a Unity batch compile/import check after code changes
- run a Unity static editor method in batch mode
- inspect Unity executable configuration before batch mode runs
- write Unity executable setup reports with `EASYAR_UNITY_PATH` guidance and compile dry-run commands
- analyze Unity Editor/build logs for common EasyAR issues plus Image Tracking and Cloud Recognition specifics
- find and analyze the latest Unity log after a failed batch run
- expose EasyAR workflow guidance as MCP resources
- expose MCP prompts for Image Tracking, Cloud Recognition, and Unity programming assistance
- guide unregistered users through official EasyAR registration, development center login, license creation, and Cloud Recognition credential setup without collecting passwords
- generate account material checklists that classify EasyAR fields by source, storage location, and share policy
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
- generate first-run onboarding reports across client setup, official access, release metadata, and focused workflow state

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

For package-based clients after publishing, use `npm install -g mcp-easyar` with `entrypointMode=package-bin`, or `entrypointMode=npx` for `npx -y mcp-easyar`.

For the current GitHub local-key MVP release, install the tarball directly:

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.14/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

See [docs/install-from-github-release.md](docs/install-from-github-release.md) for the user-facing GitHub Release install and first-run flow.
See [docs/ROADMAP.md](docs/ROADMAP.md) for the current local-key MVP boundary and remaining work toward the full EasyAR MCP service goal.
See [docs/SAMPLE_EXPANSION.md](docs/SAMPLE_EXPANSION.md) for the acceptance bar before adding more EasyAR samples to the supported scope.

To verify the published GitHub Release tarball from a fresh temporary consumer project:

```bash
npm run github-release:smoke
```

After installing the package, verify the MCP entrypoint without exposing account secrets:

```bash
easyar-mcp-check
```

For a local build, use `npm run install:check`.

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
EASYAR_UNITY_PATH=/Applications/Unity/Hub/Editor/2022.3.62f3/Unity.app/Contents/MacOS/Unity
EASYAR_UNITY_CANDIDATE_DIRS=/Applications/Unity/Hub/Editor
EASYAR_RELEASE_PROJECT_PATH=/path/to/UnityProject
EASYAR_RELEASE_EVIDENCE_PATH=docs/release-evidence/focused-scope.android.json
EASYAR_RELEASE_PLATFORM=android
EASYAR_UNITY_VERSION=2022.3.62f3
EASYAR_CANARY_PROJECT_PATH=/path/to/UnityProject
EASYAR_CANARY_PLATFORM=android
EASYAR_STUB_HOST=127.0.0.1
EASYAR_STUB_PORT=8787
EASYAR_STUB_TOKEN=your_local_stub_token
```

Use [`.env.example`](.env.example) as a non-secret template. Keep real `.env` files, tokens, license keys, and Cloud Recognition credentials local.

`EASYAR_ACCOUNT_STATUS_ENDPOINT`, `EASYAR_LICENSE_VALIDATE_ENDPOINT`, `EASYAR_DOWNLOADS_ENDPOINT`, and `EASYAR_CLOUD_CREDENTIALS_ENDPOINT` are intentionally configurable. Connect them to authorized EasyAR account APIs in production; the open-source default does not guess or bypass private EasyAR endpoints.

See [`docs/OFFICIAL_API_CONTRACT.md`](docs/OFFICIAL_API_CONTRACT.md) or the machine-readable [`docs/openapi/easyar-mcp-account-api.openapi.json`](docs/openapi/easyar-mcp-account-api.openapi.json) for the required official account API contract, request fields, response policy, and secret-handling rules. MCP clients can also call `easyar_generate_official_api_contract`.

## Claude Desktop

```json
{
  "mcpServers": {
    "easyar": {
      "command": "easyar-mcp",
      "args": [],
      "env": {
        "EASYAR_API_BASE_URL": "https://www.easyar.cn"
      }
    }
  }
}
```

## Codex

Use the same package-bin stdio command:

```json
{
  "mcpServers": {
    "easyar": {
      "command": "easyar-mcp",
      "args": [],
      "env": {
        "EASYAR_API_BASE_URL": "https://www.easyar.cn"
      }
    }
  }
}
```

You can also ask the MCP server for a config snippet with `easyar_generate_client_config`. The default `entrypointMode=local-dist` uses `node /absolute/path/to/dist/index.js`; `entrypointMode=package-bin` uses the installed `easyar-mcp` bin; `entrypointMode=npx` uses `npx -y mcp-easyar`.

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
npm run install:check
npm run package:smoke
npm run pack:check
```

## Quickstart

See [docs/quickstart.md](docs/quickstart.md) for the recommended Codex/Claude to Unity workflow.

See [docs/client-setup.md](docs/client-setup.md) for Codex, Claude Desktop, local-dist, package-bin, and npx setup profiles.

See [docs/troubleshooting.md](docs/troubleshooting.md) for focused Image Tracking and Cloud Recognition diagnostics.

## Release Manifest

See [docs/RELEASE_MANIFEST.md](docs/RELEASE_MANIFEST.md) for install commands, MCP entrypoints, focused scope, environment variable names, and release checks.

## GitHub Release

Use the manual GitHub Actions `GitHub Release` workflow to publish a downloadable `npm pack` tarball on GitHub before the official API production gate is complete. Choose `gate=local-key-mvp` to require the committed focused Android evidence and passing package checks. Choose `gate=production` only after the official EasyAR account, license, downloads, and Cloud Recognition endpoints are configured.

## Release Checks

Before publishing a release or npm package:

```bash
npm run typecheck
npm test
npm run bin:smoke
npm run install:check
npm run package:smoke
npm run pack:check
npm run security:check
npm run release:check
```

`release:check` runs the package/repository verification commands and then calls `easyar_production_validation`. It prints both `Production ready` and `Local-key MVP ready`. `Local-key MVP ready: yes` means the current focused scope can be supported from committed package/install docs, passing verification, and safe Image Tracking/Cloud Recognition device-run evidence; it does not mean official account API automation is finished. Set `EASYAR_RELEASE_REQUIRE_LOCAL_KEY_MVP=1` for local-key MVP GitHub releases, or `EASYAR_RELEASE_REQUIRE_PRODUCTION_READY=1` before a production npm publish to make incomplete production readiness fail the command. For local strict checks, set `EASYAR_RELEASE_PROJECT_PATH` to the Unity project that contains the focused `RUN_RESULT.md`, `COMPLETION_REPORT.md`, and `FOCUSED_SCOPE_STATUS.md` evidence; for GitHub release runners, set `EASYAR_RELEASE_EVIDENCE_PATH` to the committed safe evidence JSON.

Npm publishing should use the manual GitHub Actions `Release` workflow. It runs the strict production gate first, then publishes with npm provenance from the protected `npm-publish` environment. Configure the protected environment with the official EasyAR endpoint vars plus `EASYAR_RELEASE_EVIDENCE_PATH`/`EASYAR_RELEASE_PLATFORM` so the GitHub runner can verify focused sample evidence without reading a local Unity project. Local release checks may use `EASYAR_RELEASE_PROJECT_PATH` instead. If the release is intentionally limited to the local-key MVP, keep strict production publishing disabled and document the remaining official API blockers in the release notes.

After staging or production EasyAR account endpoints are configured, run `npm run official-api:canary` with `EASYAR_API_TOKEN`, the four official endpoint variables, and `EASYAR_CANARY_PROJECT_PATH` or `EASYAR_RELEASE_PROJECT_PATH`. The canary checks account status, Image Tracking official access, Cloud Recognition official access, and production validation while printing only blocker ids.

When backend routing is still being wired, run `npm run official-api:stub` to start a local contract-compatible endpoint stub. Use it only for local gateway/canary validation; production must connect to real EasyAR account, license, downloads, and Cloud Recognition services.

The release and canary project path variables should point to a Unity project that already contains focused sample evidence under `Assets/EasyARGenerated`. For GitHub release runners, generate the safe committed evidence file with `easyar_write_release_evidence projectPath=/path/to/UnityProject workspacePath=/path/to/mcp-easyar`. The stub variables are local development placeholders only; do not configure them in production.

See [CHANGELOG.md](CHANGELOG.md) for version history.

## First-Time EasyAR Users

`mcp-easyar` treats account setup as a guided browser handoff. If the user has not registered yet, start with `easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition`; the guide chooses the first safe MCP call, sends the user to the official EasyAR registration/login pages, and explains what to do after they return to Codex or Claude. The MCP server never asks for website passwords, verification codes, raw API tokens, license keys, API keys, `appKey`, or `appSecret` in chat.

After registration/login, the user creates or locates the EasyAR Sense license and, for Cloud Recognition, the CRS/Cloud Recognition AppId, Client-end Target Recognition URL, API KEY, and API Secret. After the official EasyAR Sense Unity Plugin is installed, Unity-side sample execution uses those local keys and does not require website login at runtime. EasyAR Unity CloudRecognizer API Key access uses `easyar.cloudRecognition.appId` + `serverAddress` + `apiKey` + `apiSecret`. Those values are filled locally in `ProjectSettings/EasyAR/easyar.local.json`; `easyar_validate_local_config` reports only whether required fields are present and non-placeholder.

For Unity-project handoff, call `easyar_write_first_run_guide projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition`, then `easyar_write_local_config_handoff projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition`. These write `Assets/EasyARGenerated/FIRST_RUN.md` and `Assets/EasyARGenerated/LOCAL_CONFIG_HANDOFF.md`, combining the official browser registration/login path, focused sample scope, account materials checklist, manual `easyar.local.json` steps, environment-backed writer command, and validation chain.

For brand-new users, the intended conversation is:

1. MCP asks one lightweight question: "Do you already have an EasyAR account?"
2. If the answer is no, MCP uses `accountStage=not-registered` and gives browser-only actions: open `https://www.easyar.cn/`, register from the official login/register entry, activate the email if required, then enter the development center.
3. The user returns with only a stage update, such as `registered-not-logged-in` or `logged-in`; they do not paste credentials into chat.
4. MCP guides license creation, package/bundle identifier matching, official sample/download access, and Cloud Recognition credential setup when the selected sample needs it.
5. Secret values are written locally or supplied from environment variables; MCP validates presence and placeholders, then moves to focused preflight.

The first MCP screen is intentionally account-stage driven:

1. `easyar_server_status` shows `preflightFirst=true` and suggests `easyar_first_run_guide accountStage=not-registered` as a valid starting point.
2. `easyar_write_first_run_guide` creates `FIRST_RUN.md`, the first-screen route for new users, focused scope, top next call, artifact reading order, and Unity-automation gate.
3. `easyar_write_account_onboarding` creates `ACCOUNT_ONBOARDING.md` so another AI tool or human operator can resume the same browser handoff.
4. `easyar_write_account_materials` lists which official materials are needed, where to find them, where to store them locally, and whether they are safe to share.
5. `easyar_write_local_config_handoff` creates `LOCAL_CONFIG_HANDOFF.md`, the safest bridge from EasyAR website registration/login to local secret storage.
6. `easyar_write_local_config_form` creates `LOCAL_CONFIG_FORM.md`, a field-by-field local JSON fill form with placeholders, source pages, env alternatives, and validation calls.
7. `easyar_prepare_unity_project` creates the local `easyar.local.json.example` with field sources, env-variable alternatives, and a never-share list.
8. `easyar_validate_local_config` checks only presence and placeholders.
9. `easyar_write_focused_preflight` creates `PREFLIGHT.md`, the gate before Unity batch or device validation.
10. `easyar_write_focused_handoff_pack` writes the safe handoff pack for Image Tracking, Cloud Recognition, or both focused samples so another AI tool can continue from `HANDOFF_PACK.md` and `ARTIFACT_INDEX.md`.
11. Before recording device evidence, `easyar_write_device_run_result_form` creates `DEVICE_RUN_RESULT_FORM.md`, a fillable real-device evidence form plus safe `easyar_write_run_result` argument templates.
12. After compile/build/device attempts, `easyar_write_completion_report` creates `COMPLETION_REPORT.md`; `runThroughComplete=true` only when preflight, device validation, a passed `RUN_RESULT.md` with recorded real-device validation evidence, and latest log evidence all support a passed focused run-through.

## Tools

- `easyar_list_samples`: list supported sample categories.
- `easyar_server_status`: return server version, capability summary, resources, authorization state, and recommended first calls.
- `easyar_official_info`: return official EasyAR links and currently documented package versions captured by this MCP server.
- `easyar_auth_status`: check EasyAR API environment configuration without returning secrets.
- `easyar_authorization_strategy`: choose the safe authorization path across local key mode, manual browser handoff, official API, local packages, and stub mode without bypassing EasyAR access controls.
- `easyar_write_authorization_strategy`: write `AUTHORIZATION_STRATEGY.md`, explaining that Unity runs from the installed official plugin plus local license/API keys while website login is only for obtaining authorized packages and keys.
- `easyar_check_account`: call a configured official EasyAR account-status endpoint with `EASYAR_API_TOKEN`.
- `easyar_validate_license`: call a configured official EasyAR license-validation endpoint using local config or explicit input without returning secrets.
- `easyar_discover_downloads`: call a configured official downloads endpoint for account-scoped SDK/sample package discovery without returning tokens.
- `easyar_discover_cloud_credentials`: call a configured official Cloud Recognition endpoint for account-scoped credential metadata without returning secrets.
- `easyar_generate_official_api_contract`: generate the official EasyAR account API contract needed for production endpoint integration.
- `easyar_write_official_api_contract`: write the official API contract to `docs/OFFICIAL_API_CONTRACT.md` or a selected workspace path.
- `easyar_generate_official_openapi_contract`: return the machine-readable official OpenAPI contract for gateway import, backend stubs, or client generation.
- `easyar_write_official_openapi_contract`: write the official OpenAPI contract JSON to `docs/openapi/easyar-mcp-account-api.openapi.json` or a selected workspace path.
- `easyar_official_api_handoff`: generate a backend/operations handoff for wiring real EasyAR official account APIs into mcp-easyar.
- `easyar_write_official_api_handoff`: write the official API rollout handoff to `docs/OFFICIAL_API_HANDOFF.md` or a selected workspace path.
- `easyar_check_official_access`: run a focused official account, license, downloads, and sample-specific access check without exposing secrets.
- `easyar_write_official_access_report`: write the official access check to `Assets/EasyARGenerated/<sampleId>/OFFICIAL_ACCESS.md`.
- `easyar_generate_client_config`: generate Codex, Claude Desktop, or generic MCP stdio configuration.
- `easyar_check_client_setup`: validate Node.js, package/bin metadata, built entrypoint, server path, and generated MCP client config.
- `easyar_write_client_setup`: write client setup status, config snippet, acceptance checklist, first smoke calls, and troubleshooting steps to `EasyARGenerated/CLIENT_SETUP.md` or `Assets/EasyARGenerated/CLIENT_SETUP.md`.
- `easyar_deployment_readiness`: generate a deployment readiness report across package metadata, GitHub release files, official endpoint environment, Unity path, focused scope, and security checks.
- `easyar_write_deployment_readiness`: write the deployment readiness report as Markdown inside a project or workspace directory.
- `easyar_production_validation`: generate the final production evidence matrix across release manifest, deployment readiness, official EasyAR endpoints, verification commands, and focused sample completion.
- `easyar_write_production_validation`: write the production validation evidence matrix to `PRODUCTION_VALIDATION.md`; it marks the deployment incomplete unless real evidence is present.
- `easyar_release_manifest`: generate a consumer-facing install/release manifest with package metadata, entrypoints, focused scope, env names, and verification commands.
- `easyar_write_release_manifest`: write the release manifest to `docs/RELEASE_MANIFEST.md` or a selected path.
- `easyar_first_run_guide`: generate the first-screen guide for new MCP users across account stage, official browser route, focused scope, local config, and the first safe MCP calls.
- `easyar_write_first_run_guide`: write `FIRST_RUN.md` to `Assets/EasyARGenerated/FIRST_RUN.md` or `EasyARGenerated/FIRST_RUN.md`.
- `easyar_account_onboarding`: guide new or existing EasyAR users through official registration/login, license setup, Cloud Recognition credentials, and local MCP setup without collecting passwords or secrets.
- `easyar_write_account_onboarding`: write the account onboarding guide to `Assets/EasyARGenerated/ACCOUNT_ONBOARDING.md` or `EasyARGenerated/ACCOUNT_ONBOARDING.md`.
- `easyar_account_materials`: generate a field-by-field checklist of EasyAR account materials, source locations, local storage targets, and share policies.
- `easyar_write_account_materials`: write the account materials checklist to `Assets/EasyARGenerated/ACCOUNT_MATERIALS.md` or `EasyARGenerated/ACCOUNT_MATERIALS.md`.
- `easyar_portal_evidence`: generate a safe EasyAR portal evidence report from non-secret browser observations such as app record id, service flags, license presence, and Cloud Recognition library status.
- `easyar_write_portal_evidence`: write the safe portal evidence report to `Assets/EasyARGenerated/PORTAL_EVIDENCE.md` or `EasyARGenerated/PORTAL_EVIDENCE.md` without storing API KEY/API Secret/license values.
- `easyar_onboarding_report`: generate a first-run project onboarding report across client setup, official access, release manifest, and workflow state.
- `easyar_write_onboarding_report`: write the onboarding report to `Assets/EasyARGenerated/<sampleId>/ONBOARDING.md`.
- `easyar_generate_project_handoff`: generate a project-level continuation dashboard across client setup, account materials, local config, Unity environment, focused sample state, and next calls.
- `easyar_write_project_handoff`: write the project continuation dashboard to `Assets/EasyARGenerated/PROJECT_HANDOFF.md`.
- `easyar_remaining_work_report`: generate an evidence-weighted remaining-work report across repository release surface, official EasyAR APIs, Unity config, and focused sample run-through evidence.
- `easyar_write_remaining_work_report`: write the remaining-work gap report to `Assets/EasyARGenerated/REMAINING_WORK.md` or `EasyARGenerated/REMAINING_WORK.md`.
- `easyar_generate_focused_preflight`: generate a single focused preflight gate across account materials, local config, Unity executable setup, sample imports, scene readiness, and script review.
- `easyar_write_focused_preflight`: write the focused preflight gate to `Assets/EasyARGenerated/<sampleId>/PREFLIGHT.md`.
- `easyar_next_workflow_step`: inspect current focused project state and recommend the next MCP/Unity action.
- `easyar_write_workflow_state`: write current workflow phase, blockers, and next call to `Assets/EasyARGenerated/<sampleId>/WORKFLOW_STATE.md`.
- `easyar_generate_import_checklist`: generate an official EasyAR Unity Plugin and focused sample import checklist for Image Tracking or Cloud Recognition.
- `easyar_write_import_checklist`: write the official import checklist to `Assets/EasyARGenerated/<sampleId>/IMPORT_CHECKLIST.md`.
- `easyar_generate_sample_import_guide`: generate Unity Package Manager steps, expected import locations, and post-import verification calls for importing the focused official sample from PackageCache `Samples~` into `Assets/Samples`.
- `easyar_write_sample_import_guide`: write the focused sample import guide to `Assets/EasyARGenerated/<sampleId>/SAMPLE_IMPORT_GUIDE.md`.
- `easyar_import_sample_from_package_cache`: copy a focused sample already present in local Unity PackageCache `Samples~` into `Assets/Samples` without downloading packages or exposing secrets.
- `easyar_generate_run_sequence`: generate an ordered MCP/Unity batch sequence for Image Tracking or Cloud Recognition.
- `easyar_write_run_sequence`: write the focused run sequence to `Assets/EasyARGenerated/<sampleId>/RUN_SEQUENCE.md`.
- `easyar_generate_artifact_index`: generate an index of focused handoff artifacts, including account onboarding/materials, and recommended reading order.
- `easyar_write_artifact_index`: write the focused artifact index to `Assets/EasyARGenerated/<sampleId>/ARTIFACT_INDEX.md`.
- `easyar_generate_focused_handoff_pack`: preview the safe focused sample handoff pack that can be written for Image Tracking, Cloud Recognition, or both.
- `easyar_write_focused_handoff_pack`: write the focused handoff pack (`HANDOFF_PACK.md`, `ARTIFACT_INDEX.md`, diagnostics, forms, and project dashboards) without writing secrets or fake run results.
- `easyar_generate_run_report`: summarize focused sample readiness, local config validation, script review, and next phase.
- `easyar_write_run_report`: write the focused sample run report to `Assets/EasyARGenerated/<sampleId>/RUN_REPORT.md`.
- `easyar_audit_sample_scene`: audit scene candidates, Build Settings hints, EasyAR import signals, and focused sample blockers.
- `easyar_write_scene_audit`: write the focused scene audit to `Assets/EasyARGenerated/<sampleId>/SCENE_AUDIT.md`.
- `easyar_generate_support_bundle`: generate a focused support bundle summary across run sequence, run report, scene audit, and latest Unity log diagnostics.
- `easyar_write_support_bundle`: write the focused support bundle to `Assets/EasyARGenerated/<sampleId>/SUPPORT_BUNDLE.md`.
- `easyar_generate_device_validation_checklist`: generate focused real-device validation steps, pass criteria, blockers, and evidence prompts.
- `easyar_write_device_validation_checklist`: write the real-device validation checklist to `Assets/EasyARGenerated/<sampleId>/DEVICE_VALIDATION.md`.
- `easyar_generate_device_run_result_form`: generate a fillable real-device run result form plus safe `easyar_write_run_result` templates.
- `easyar_write_device_run_result_form`: write the real-device run result form to `Assets/EasyARGenerated/<sampleId>/DEVICE_RUN_RESULT_FORM.md`.
- `easyar_generate_android_device_runbook`: generate an Android install, launch, logcat, and safe run-result evidence sequence for a focused sample.
- `easyar_write_android_device_runbook`: write the Android runbook to `Assets/EasyARGenerated/<sampleId>/ANDROID_DEVICE_RUNBOOK.md`.
- `easyar_generate_run_result`: generate a focused sample run result summary for compile, build, or device validation attempts.
- `easyar_write_run_result`: write the focused run result to `Assets/EasyARGenerated/<sampleId>/RUN_RESULT.md`.
- `easyar_generate_completion_report`: summarize final focused sample completion status across preflight, device validation, `RUN_RESULT.md`, and latest Unity log evidence.
- `easyar_write_completion_report`: write the final focused completion report to `Assets/EasyARGenerated/<sampleId>/COMPLETION_REPORT.md`.
- `easyar_generate_focused_scope_status`: aggregate Image Tracking and Cloud Recognition completion states into one focused-scope status.
- `easyar_write_focused_scope_status`: write the focused-scope status to `Assets/EasyARGenerated/FOCUSED_SCOPE_STATUS.md`.
- `easyar_generate_issue_report`: generate a redacted GitHub issue body for focused Image Tracking or Cloud Recognition failures.
- `easyar_write_issue_report`: write the redacted issue report to `Assets/EasyARGenerated/<sampleId>/ISSUE_REPORT.md`.
- `easyar_inspect_unity_project`: inspect a Unity project for package, asset, scene, and EasyAR signals.
- `easyar_check_sample_readiness`: report missing local requirements before running a selected sample.
- `easyar_validate_local_config`: validate `ProjectSettings/EasyAR/easyar.local.json` without returning secrets.
- `easyar_generate_local_config_form`: generate a fillable `easyar.local.json` form with field sources, placeholders, environment alternatives, and validation calls.
- `easyar_write_local_config_form`: write the local config form to `Assets/EasyARGenerated/LOCAL_CONFIG_FORM.md` without writing secret values.
- `easyar_write_local_config_from_env`: write `ProjectSettings/EasyAR/easyar.local.json` from local environment variables such as `EASYAR_API_TOKEN`, `EASYAR_LICENSE_KEY`, and Cloud Recognition env vars without returning secret values.
- `easyar_local_config_handoff`: generate a first-run handoff from EasyAR website registration/login to safe local `easyar.local.json` setup and validation.
- `easyar_write_local_config_handoff`: write the first-run local config handoff to `Assets/EasyARGenerated/LOCAL_CONFIG_HANDOFF.md`.
- `easyar_generate_sample_plan`: create a practical setup/run plan for a sample.
- `easyar_prepare_unity_project`: create a sample runner, focused sample runbook, EasyAR local config template, and secret ignore rules in a Unity project.
- `easyar_create_sample_validation_helper`: create `Assets/Editor/EasyARSampleValidationHelper.cs` for Unity-side focused sample validation, excluding generated MCP helper files from official EasyAR import signals.
- `easyar_create_local_config_bridge`: create Editor/runtime scripts that export a minimized EasyAR runtime config into ignored `StreamingAssets` for device builds and read it at runtime without logging secret values or copying account tokens/API secrets.
- `easyar_create_mobile_settings_helper`: create `Assets/Editor/EasyARMobileSettingsHelper.cs` for Android/iOS player settings and camera permission setup.
- `easyar_create_build_settings_helper`: create `Assets/Editor/EasyARBuildSettingsHelper.cs` for Build Settings automation.
- `easyar_create_device_build_helper`: create `Assets/Editor/EasyARDeviceBuildHelper.cs` for Unity player builds.
- `easyar_create_sample_runner`: create `Assets/Editor/EasyARSampleRunner.cs`.
- `easyar_generate_config_integration_audit`: audit how local EasyAR config can be wired into Unity scripts, scenes, prefabs, and assets without exposing secret values.
- `easyar_write_config_integration_audit`: write the local-config integration audit to `Assets/EasyARGenerated/<sampleId>/CONFIG_INTEGRATION.md`.
- `easyar_generate_programming_context`: generate a focused Unity C# script inventory, generated helper summary, static review, and recommended programming workflow before editing scripts.
- `easyar_write_programming_context`: write the focused programming context to `Assets/EasyARGenerated/<sampleId>/PROGRAMMING_CONTEXT.md`.
- `easyar_generate_code_plan`: generate a focused Unity C# implementation plan before editing sample code, including verification calls for script review, Unity compile, support bundle, and run result handoff.
- `easyar_write_code_plan`: write the focused C# implementation plan and verification calls to `Assets/EasyARGenerated/<sampleId>/CODE_PLAN.md`.
- `easyar_create_mono_behaviour`: create a Unity C# MonoBehaviour template for EasyAR sample development.
- `easyar_write_csharp_file`: create or replace a `.cs` file inside a Unity project.
- `easyar_generate_code_change_summary`: generate a focused C# change summary after script edits.
- `easyar_write_code_change_summary`: write the focused C# change summary to `Assets/EasyARGenerated/<sampleId>/CODE_CHANGE.md`.
- `easyar_review_csharp_scripts`: review Unity C# scripts for common EasyAR secret, lifecycle, input, and performance risks.
- `easyar_unity_environment`: inspect `EASYAR_UNITY_PATH` and common Unity install locations without launching Unity.
- `easyar_write_unity_environment_report`: write Unity executable discovery, `EASYAR_UNITY_PATH`, and batch compile dry-run guidance to `Assets/EasyARGenerated/UNITY_ENVIRONMENT.md`.
- `easyar_run_unity_compile_check`: open Unity in batch mode to force script import/compilation, analyze the generated log, and return a suggested `easyar_write_run_result` handoff when `sampleId` is provided.
- `easyar_run_unity_method`: execute a Unity static editor method in batch mode, optionally writing a project-local Unity log with `logPath`; pass `sampleId` to receive focused log diagnostics and a suggested `RUN_RESULT.md` update.
- `easyar_android_device_status`: inspect adb availability and connected Android devices before focused real-device validation.
- `easyar_android_install_apk`: install a focused Android APK with adb and return a safe `RUN_RESULT.md` handoff step.
- `easyar_android_start_app`: launch the focused Android app by package name with adb monkey.
- `easyar_android_collect_logcat`: collect a filtered, redacted adb logcat snapshot into the Unity project for device evidence.
- `easyar_analyze_unity_log`: analyze Unity Editor/build logs and suggest next debugging actions, with optional focused sample diagnostics.
- `easyar_analyze_latest_unity_log`: locate the latest Unity Editor/project log and analyze its tail.

## Resources

- `easyar://samples/catalog`
- `easyar://official/info`
- `easyar://official/api-contract`
- `easyar://official/openapi`
- `easyar://unity/checklist`
- `easyar://workflow/quickstart`
- `easyar://workflow/focused-scope`
- `easyar://workflow/programming`
- `easyar://workflow/sample-expansion`

## Prompts

- `easyar-run-image-tracking`
- `easyar-run-cloud-recognition`
- `easyar-validate-official-endpoints`
- `easyar-close-focused-scope`
- `easyar-unity-programming-assistant`
