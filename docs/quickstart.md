# mcp-easyar Quickstart

This workflow supports both new and registered EasyAR users connecting Codex, Claude, or another MCP client to local Unity project automation.

## 1. Build The Server

```bash
npm install
npm run build
npm run install:check
```

Before publishing or handing the package to another user, also run `npm run package:smoke` to install the local tarball into a temporary consumer project and execute `easyar-mcp-check`.

## 2. Configure A Client

If you do not have an EasyAR account yet, start with the account guide:

```text
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_write_first_run_guide projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_account_onboarding accountStage=not-registered sampleId=cloud-recognition
easyar_account_materials sampleId=cloud-recognition
easyar_write_account_onboarding projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition
easyar_write_account_materials projectPath=/path/to/UnityProject sampleId=cloud-recognition
easyar_write_portal_evidence projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_local_config_handoff projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_write_local_config_form projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_write_focused_handoff_pack projectPath=/path/to/UnityProject sampleId=all platform=android accountStage=not-registered
```

The guides send users to the official EasyAR website and development center, then list every required field, where it comes from, where it should be stored, and whether it is safe to share. `FIRST_RUN.md` gives the first safe call, focused Image Tracking/Cloud Recognition scope, and artifact reading order. `PORTAL_EVIDENCE.md` records only non-secret development-center observations such as app record ids, service flags, Sense License presence, and Cloud Recognition library/target status. `LOCAL_CONFIG_HANDOFF.md` ties those account steps to the exact `ProjectSettings/EasyAR/easyar.local.json` file. `LOCAL_CONFIG_FORM.md` gives the fillable JSON skeleton, field-by-field source map, environment-backed writer command, and validation chain. `easyar_write_focused_handoff_pack` writes the safe per-sample diagnostics, forms, run sequence, programming context, `HANDOFF_PACK.md`, `ARTIFACT_INDEX.md`, and project dashboards in one call. MCP does not ask for EasyAR website passwords and does not store account credentials.

For a user who has not registered yet, the MCP flow is:

1. Ask only for account state, for example `accountStage=not-registered`; a new user is a valid starting point.
2. Send the user to `https://www.easyar.cn/` in their browser. They use the official login/register entry, activate the account if required, and enter the development center there.
3. After the user returns, ask only which stage is now true: `registered-not-logged-in`, `logged-in`, `has-license`, or `has-cloud-credentials`.
4. Write `FIRST_RUN.md`; it records the first safe MCP call, focused scope, blockers, artifact order, and whether Unity automation is allowed yet.
5. Write `ACCOUNT_ONBOARDING.md`; it records the browser handoff, stage model, return prompts, and secret-handling rules for the next operator or AI tool.
6. After the user returns from the logged-in portal, write `PORTAL_EVIDENCE.md` with only non-secret observations; use presence flags for API KEY/API Secret/license values.
7. Write `LOCAL_CONFIG_HANDOFF.md`; it gives the user both manual-file and env-backed ways to fill the local config without pasting secrets into chat.
8. Guide them to create or locate the EasyAR Sense license for the Unity bundle/package identifier.
9. For Cloud Recognition, guide them to create or locate the CRS/Cloud Recognition AppId plus API KEY. Sense 4.1+ uses `appId` + `apiKey`; legacy `appKey`/`appSecret` fields remain accepted for compatibility.
10. For Cloud Recognition real-device validation, also guide them to create a cloud recognition image library, upload at least one test target image, and keep only a non-secret library name, target count, or dashboard URL for evidence.
11. Keep secrets out of chat: fill `ProjectSettings/EasyAR/easyar.local.json` locally, or use local environment variables with `easyar_write_local_config_from_env`, then let `easyar_validate_local_config` report only presence and placeholder problems.
12. Create `PREFLIGHT.md` with `easyar_write_focused_preflight`; do not run Unity batch automation until that file reports the account, local config, import, Unity path, scene, and script gates.
13. After compile, build, and real-device validation attempts, write `RUN_RESULT.md`, then write `COMPLETION_REPORT.md`. Treat the focused sample as actually run through only when `runThroughComplete=true`; compile/build success alone is not enough.

The MCP should never turn registration into a chat form. Login, email activation, password reset, and verification codes stay in the official browser session. MCP only records account stage and local evidence.

`easyar_write_artifact_index` includes `ACCOUNT_ONBOARDING.md`, `ACCOUNT_MATERIALS.md`, and `PORTAL_EVIDENCE.md` in the handoff reading order so another AI tool can see account prerequisites and logged-in portal evidence before trying Unity validation.

Ask the MCP server for a client snippet:

```text
easyar_server_status
easyar_release_manifest
easyar_generate_client_config client=claude-desktop
easyar_generate_client_config client=codex entrypointMode=npx includeTokenPlaceholder=false
easyar_generate_client_config client=generic-json entrypointMode=package-bin
easyar_check_client_setup client=claude-desktop serverPath=/absolute/path/to/mcp-easyar/dist/index.js
easyar_write_client_setup outputRoot=/path/to/report-folder client=claude-desktop serverPath=/absolute/path/to/mcp-easyar/dist/index.js
easyar_onboarding_report projectPath=/path/to/UnityProject sampleId=image-tracking client=claude-desktop platform=android
```

For copyable Codex, Claude Desktop, local-dist, package-bin, and npx setup profiles, see `docs/client-setup.md`.

`CLIENT_SETUP.md` includes the config destination, acceptance checklist, first smoke calls such as `easyar_server_status`, and client-specific troubleshooting steps. Use it before handing a Codex or Claude setup to another user.

`easyar_server_status` also returns a `preflightFirst` onboarding block. The recommended first-call sequence is account guide, account materials, Unity environment report, project preparation, focused preflight, and then reading `PREFLIGHT.md`.

Set these environment variables locally:

```bash
EASYAR_API_BASE_URL=https://www.easyar.cn
EASYAR_API_TOKEN=your_registered_user_token
EASYAR_ACCOUNT_STATUS_ENDPOINT=https://www.easyar.cn/path/to/official/account/status
EASYAR_LICENSE_VALIDATE_ENDPOINT=https://www.easyar.cn/path/to/official/license/validate
EASYAR_DOWNLOADS_ENDPOINT=https://www.easyar.cn/path/to/official/downloads
EASYAR_CLOUD_CREDENTIALS_ENDPOINT=https://www.easyar.cn/path/to/official/cloud-recognition/credentials
EASYAR_UNITY_PATH=/Applications/Unity/Hub/Editor/2022.3.62f1/Unity.app/Contents/MacOS/Unity
EASYAR_UNITY_CANDIDATE_DIRS=/Applications/Unity/Hub/Editor
```

The repository includes `.env.example` as a non-secret template. Copy values into your MCP client environment, OS keychain, CI secrets, or a local untracked `.env`; never commit real EasyAR tokens, license keys, `appKey`, or `appSecret`.

The official backend/API contract is published in `docs/OFFICIAL_API_CONTRACT.md`. The machine-readable OpenAPI contract for gateway import, backend stubs, and client generation is `docs/openapi/easyar-mcp-account-api.openapi.json`. The Markdown contract can be regenerated with:

```text
easyar_generate_official_api_contract
easyar_write_official_api_contract workspacePath=/path/to/workspace
easyar_generate_official_openapi_contract
easyar_write_official_openapi_contract workspacePath=/path/to/workspace
easyar_official_api_handoff deploymentTarget=staging
easyar_write_official_api_handoff workspacePath=/path/to/workspace deploymentTarget=staging
```

MCP clients can also read `easyar://official/api-contract` for Markdown or `easyar://official/openapi` for the machine-readable OpenAPI JSON, or use the `easyar-validate-official-endpoints` prompt before validating registered-user endpoint access. `OFFICIAL_API_HANDOFF.md` is the backend/operations rollout checklist for mapping the contract to real EasyAR account services, setting endpoint env vars, running canaries, and recording official access evidence.

You can inspect local Unity path discovery with:

```text
easyar_unity_environment
```

Never commit account tokens, license keys, cloud recognition credentials, or mobile signing secrets.

For first-time EasyAR users, the intended order is:

1. Register or log in on the official EasyAR website/development center.
2. Create or locate an EasyAR Sense license key for the app bundle/package identifier.
3. For Cloud Recognition, create or locate the CRS AppId plus API KEY in the official account.
4. Put MCP API tokens in the MCP client environment or secret store.
5. Put license and Cloud Recognition values only in `ProjectSettings/EasyAR/easyar.local.json`.
6. Run `easyar_validate_local_config` and `easyar_check_official_access`.

If official EasyAR account endpoints are configured, verify account and license access with:

```text
easyar_check_account
easyar_validate_license projectPath=/path/to/UnityProject platform=android
easyar_discover_downloads projectPath=/path/to/UnityProject sampleId=image-tracking packageKind=unity-samples
easyar_discover_cloud_credentials projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_check_official_access projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_official_access_report projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
```

## 3. Choose A Sample

If your MCP client supports prompts, start from `easyar-run-image-tracking` or `easyar-run-cloud-recognition`.

For now, use one of the focused sample workflows:

- `image-tracking`
- `cloud-recognition`

Other EasyAR samples are intentionally deferred until the focused workflows are running cleanly.

Call:

```text
easyar_list_samples
easyar_generate_sample_plan sampleId=image-tracking platform=android
easyar_next_workflow_step projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_generate_focused_preflight projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_generate_sample_import_guide projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_sample_import_guide projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_import_sample_from_package_cache projectPath=/path/to/UnityProject sampleId=cloud-recognition dryRun=true
easyar_write_workflow_state projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_generate_run_sequence projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_run_sequence projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_artifact_index projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_generate_run_report projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_run_report projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_audit_sample_scene projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_scene_audit projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_generate_support_bundle projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_support_bundle projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=image-tracking overallStatus=blocked
easyar_write_issue_report projectPath=/path/to/UnityProject sampleId=image-tracking overallStatus=blocked
easyar_write_first_run_guide projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_write_project_handoff projectPath=/path/to/UnityProject platform=android
easyar_write_remaining_work_report projectPath=/path/to/UnityProject platform=android verificationEvidence=passed
```

After writing artifacts, read `FIRST_RUN.md` first for new users or new MCP clients, then `PROJECT_HANDOFF.md` when resuming the whole Unity project, then `REMAINING_WORK.md` for the evidence-weighted gap estimate, then `PREFLIGHT.md` for the active sample. The project handoff gives a single top next call plus per-sample workflow state; `PREFLIGHT.md` is the focused gate that tells Codex, Claude, or a human operator which blocker must be cleared before Unity batch automation or device builds.

For Cloud Recognition, use `sampleId=cloud-recognition` and fill `easyar.cloudRecognition.appId` plus `apiKey` in `ProjectSettings/EasyAR/easyar.local.json`. Legacy `appKey`/`appSecret` fields are still accepted for compatibility. A passed device result also requires an EasyAR Cloud Recognition target library with at least one uploaded test target image.

Import the official EasyAR Unity Plugin and sample scenes from the EasyAR download page or Unity Package Manager Samples before expecting a real device run to succeed. If `easyar_generate_import_checklist` reports a PackageCache `Samples~` candidate but no imported scene, run `easyar_generate_sample_import_guide`; for Image Tracking this guide also checks the official `Samples~/StreamingAssets/ImageTargets/ImageTargets.unitypackage` import so device builds can load `Assets/StreamingAssets/EasyARSamples/ImageTargets/namecard.jpg`, `namecard.etd`, and `idback.etd`. For Cloud Recognition this guide points users to import `ImageTracking_CloudRecognition` from Package Manager into `Assets/Samples`.

`SAMPLE_IMPORT_GUIDE.md` lists expected `Assets/Samples/...` import locations and post-import verification calls. If the matching sample is already present under local `Library/PackageCache/**/Samples~`, `easyar_import_sample_from_package_cache` can copy it into `Assets/Samples` for the focused sample. After importing, run the listed import checklist, readiness, and focused preflight calls before continuing to Unity batch automation.

When unsure what to do next, call `easyar_next_workflow_step` again. It inspects import status, readiness, local config, scene/Build Settings state, script review, device validation blockers, and handoff artifacts, then returns the next recommended MCP call.

To create the whole safe handoff pack for the focused scope:

```text
easyar_write_focused_handoff_pack projectPath=/path/to/UnityProject sampleId=all platform=android accountStage=logged-in
```

The pack intentionally does not write a passed `RUN_RESULT.md` or `CODE_CHANGE.md`; those remain evidence-based artifacts after real device runs or real script edits.

## 4. Prepare The Unity Project

Call:

```text
easyar_inspect_unity_project projectPath=/path/to/UnityProject
easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_check_sample_readiness projectPath=/path/to/UnityProject sampleId=image-tracking
```

`easyar_prepare_unity_project` also creates a focused runbook under `Assets/EasyARGenerated/<sampleId>/RUNBOOK.md`. For Image Tracking it creates a target-asset staging directory. For Cloud Recognition it creates a cloud credential note directory.

Copy `ProjectSettings/EasyAR/easyar.local.json.example` to `ProjectSettings/EasyAR/easyar.local.json` and fill it with official local credentials, or write the local file from environment-backed secrets:

The generated example is valid JSON with an `_instructions` block. It tells first-time users which values come from EasyAR registration/login, that Cloud Recognition/CRS needs AppId, Client-end Target Recognition URL, API KEY, and API Secret for Unity CloudRecognizer API Key access, which values must never be pasted into chat, and which environment variables can be used with `easyar_write_local_config_from_env`.

For a handoff document that another AI tool or teammate can resume from:

```text
easyar_write_local_config_handoff projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android accountStage=not-registered
easyar_write_local_config_form projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android accountStage=not-registered
```

`LOCAL_CONFIG_FORM.md` is the safest thing to hand to a first-time user after registration/login: it shows each JSON path, required status for the selected sample, placeholder, official source, env-var alternative, and validation command without containing secret values.

```bash
export EASYAR_API_TOKEN=your_registered_user_token
export EASYAR_LICENSE_KEY=your_easyar_sense_license_key
export EASYAR_BUNDLE_IDENTIFIER=com.company.easyarsample
export EASYAR_CLOUD_APP_ID=your_cloud_recognition_app_id
export EASYAR_CLOUD_SERVER_ADDRESS=https://your_crs_client_target_recognition_url
export EASYAR_CLOUD_API_KEY=your_cloud_recognition_api_key
export EASYAR_CLOUD_API_SECRET=your_cloud_recognition_api_secret
```

```text
easyar_write_local_config_from_env projectPath=/path/to/UnityProject sampleId=cloud-recognition targetPlatform=android
```

The write tool reads secret values only from the local environment, writes `ProjectSettings/EasyAR/easyar.local.json`, and returns only field presence, missing env names, validation status, and next actions. It does not return the token, license key, API KEY, `appKey`, or `appSecret`.

Then validate without exposing secrets:

```text
easyar_validate_local_config projectPath=/path/to/UnityProject
```

Before building to a mobile device, export the ignored runtime copy that the app can read from `StreamingAssets`:

```text
easyar_create_local_config_bridge projectPath=/path/to/UnityProject sampleId=cloud-recognition overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject executeMethod=EasyAR.EditorTools.EasyARLocalConfigBridge.ExportRuntimeConfig
```

The bridge writes a minimized runtime copy to `Assets/StreamingAssets/EasyAR/easyar.runtime.json` after validating required fields and applies the EasyAR global Cloud Recognizer service config for official samples that use GlobalConfig. The runtime file is ignored by git and is intended only for local device builds. It includes only the fields a mobile sample needs at runtime, such as the EasyAR license key, Cloud Recognition `appId`/`serverAddress`/`apiKey`/`apiSecret`, and Unity identifiers; it does not export EasyAR account tokens, website passwords, or legacy `appSecret` values.

Before any Unity batch command, write the Unity executable setup report:

```text
easyar_unity_environment
easyar_write_unity_environment_report projectPath=/path/to/UnityProject sampleId=image-tracking
```

`UNITY_ENVIRONMENT.md` records discovered Unity executable candidates, the recommended `EASYAR_UNITY_PATH` value, and a dry-run `easyar_run_unity_compile_check` command. It does not launch Unity and does not contain EasyAR account or Cloud Recognition secrets.

## 5. Configure Build Settings

First apply mobile player settings for camera-capable samples:

```text
easyar_create_mobile_settings_helper projectPath=/path/to/UnityProject sampleId=image-tracking platform=android bundleIdentifier=com.company.easyarsample overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject executeMethod=EasyAR.EditorTools.EasyARMobileSettingsHelper.ConfigureMobileSettings
```

After importing the official sample scene, call:

```text
easyar_create_build_settings_helper projectPath=/path/to/UnityProject sampleId=image-tracking platform=android overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject executeMethod=EasyAR.EditorTools.EasyARBuildSettingsHelper.ConfigureBuildSettings
```

For repeatable diagnostics, pass `logPath=Logs/mcp-easyar-ConfigureBuildSettings.log` or follow the `easyar_generate_run_sequence` output, which includes project-local log paths for Unity batch calls.

When `sampleId` is provided, `easyar_run_unity_compile_check` and `easyar_run_unity_method` return focused log diagnostics plus a `suggestedRunResultCall`. `easyar_generate_run_sequence` includes `sampleId`, `platform`, and project-local `logPath` arguments on Unity batch steps so the suggested `easyar_write_run_result` call can update `Assets/EasyARGenerated/<sampleId>/RUN_RESULT.md` after compile, Build Settings, sample validation, build, or device attempts.

Before the real-device run, generate the fillable result form:

```text
easyar_write_device_run_result_form projectPath=/path/to/UnityProject sampleId=image-tracking platform=android device="Pixel 8 Android 15" buildOutputPath=Builds/image-tracking.apk
easyar_write_device_run_result_form projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android device="Pixel 8 Android 15" buildOutputPath=Builds/cloud-recognition.apk
```

`DEVICE_RUN_RESULT_FORM.md` contains required evidence prompts plus two `easyar_write_run_result` argument templates. Use the safe draft template for blocked or failed attempts. Use the passed template only after every required physical-device step passes, then replace placeholders with observed evidence.

For Android device validation, use the adb helpers after the APK exists:

```text
easyar_android_device_status
easyar_android_install_apk projectPath=/path/to/UnityProject sampleId=image-tracking apkPath=Builds/image-tracking.apk
easyar_android_start_app projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_android_collect_logcat projectPath=/path/to/UnityProject sampleId=image-tracking relativePath=Logs/mcp-easyar-DeviceLog-image-tracking.log
```

Repeat the same sequence with `sampleId=cloud-recognition` and `apkPath=Builds/cloud-recognition.apk`. These helpers only prove install, launch, and log capture. The final `RUN_RESULT.md` should be marked `passed` only after the physical device also satisfies the visual sample criteria in `DEVICE_VALIDATION.md`. For Image Tracking, a practical repeatable check is to display a known target image on the computer screen and point the connected phone at it until the sample reports the expected target. For Cloud Recognition, the recognized target must already be uploaded to the EasyAR Cloud Recognition library.

After `RUN_RESULT.md` is recorded, generate the final focused completion report:

```text
easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
```

`COMPLETION_REPORT.md` parses the latest `RUN_RESULT.md`, checks focused preflight readiness again, verifies device-validation blockers, and summarizes latest Unity log diagnostics. It reports `not-run` when no run result exists, `blocked` or `failed` when the latest evidence is not passed, and `passed` only when the focused sample has a recorded device plus a passed real-device/device-validation step. Compile-only or build-only success remains blocked.

For the current focused scope, aggregate Image Tracking and Cloud Recognition:

```text
easyar_write_focused_scope_status projectPath=/path/to/UnityProject platform=android
```

`FOCUSED_SCOPE_STATUS.md` reports whether both focused samples are complete and lists the next action for each incomplete sample. Deferred samples stay out of this status until the user asks to continue.

MCP clients can read `easyar://workflow/focused-scope` or use the `easyar-close-focused-scope` prompt when handing the focused run-through to another AI tool.

Before tagging, publishing, or calling the deployment complete, generate the production evidence matrix:

```text
easyar_write_deployment_readiness projectPath=/path/to/UnityProject
easyar_write_production_validation projectPath=/path/to/UnityProject platform=android verificationEvidence=not-provided
```

`PRODUCTION_VALIDATION.md` is intentionally strict. It stays incomplete until release files, official EasyAR account endpoints, recorded verification commands, official access reports, and both focused sample completion reports all provide real evidence. After the verification commands pass for the release commit, regenerate it with `verificationEvidence=passed`.

For repository/package verification, run:

```bash
npm run security:check
npm run release:check
```

Before a real npm publish or release tag, enforce the final production gate:

```bash
EASYAR_RELEASE_REQUIRE_PRODUCTION_READY=1 npm run release:check
```

For the npm package, use the manual GitHub Actions `Release` workflow after configuring the protected `npm-publish` environment. The workflow runs the strict gate before `npm publish --provenance`, so package publishing cannot bypass official endpoint and real-device evidence. Set `EASYAR_RELEASE_PROJECT_PATH` to the Unity project containing the passed focused sample artifacts, and set `EASYAR_RELEASE_PLATFORM` to `android` or `ios` so `release:check` can pass that evidence into `easyar_production_validation`.

After official EasyAR staging or production endpoints are configured, run the official API canary:

```bash
EASYAR_CANARY_PROJECT_PATH=/path/to/UnityProject EASYAR_CANARY_PLATFORM=android npm run official-api:canary
```

The canary uses the same endpoint env vars as the MCP server, checks both focused samples, and prints only safe blocker ids.

After importing official EasyAR assets and configuring Build Settings, run the generated Unity-side focused sample validator:

```text
easyar_create_sample_validation_helper projectPath=/path/to/UnityProject sampleId=image-tracking overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject executeMethod=EasyAR.EditorTools.EasyARSampleValidationHelper.ValidateFocusedSample
```

The validator ignores generated MCP helper files when checking for official EasyAR import signals and requires the matching focused sample scene to be the first enabled Build Settings scene.

## 6. Add Project Code

For common sample logic, call:

```text
easyar_write_config_integration_audit projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_programming_context projectPath=/path/to/UnityProject sampleId=image-tracking goal="Show content when an image target is found"
easyar_write_code_plan projectPath=/path/to/UnityProject sampleId=image-tracking goal="Show content when an image target is found"
easyar_create_mono_behaviour projectPath=/path/to/UnityProject relativePath=Assets/Scripts/ImageTargetContentController.cs className=ImageTargetContentController kind=image-tracking
```

Read `CONFIG_INTEGRATION.md` and `PROGRAMMING_CONTEXT.md` before `CODE_PLAN.md` when another AI tool or human developer is taking over script work. The config audit points to likely license/cloud credential consumers by path and signal only; it does not print local secret values.

MCP clients can also read `easyar://workflow/programming` before editing Unity C# scripts. It summarizes the required pre-edit artifacts, scoped editing rules, post-edit checks, and handoff order for Codex, Claude, or a human developer.

`CODE_PLAN.md` includes structured verification calls. After script edits, run the listed `easyar_review_csharp_scripts` and `easyar_run_unity_compile_check` call, then use the compile tool's `suggestedRunResultCall` to update `RUN_RESULT.md`.

For custom code, use:

```text
easyar_write_csharp_file
```

Review generated or edited scripts before compiling:

```text
easyar_review_csharp_scripts projectPath=/path/to/UnityProject
easyar_write_code_change_summary projectPath=/path/to/UnityProject sampleId=image-tracking goal="Summarize script changes" targetFiles='["Assets/Scripts/ImageTargetContentController.cs"]'
easyar_run_unity_compile_check projectPath=/path/to/UnityProject sampleId=image-tracking platform=android logPath=Logs/mcp-easyar-CodeCompileCheck.log
```

## 7. Final Readiness Check

Call:

```text
easyar_check_sample_readiness projectPath=/path/to/UnityProject sampleId=image-tracking
```

When `ready` is `true`, open Unity or use batch mode to run the generated editor helpers, then build to a real Android or iOS device for camera/tracking validation.

## 8. Generate A Device Build Helper

After Build Settings are configured, generate a static build method:

```text
easyar_create_device_build_helper projectPath=/path/to/UnityProject platform=android outputPath=Builds/EasyARSample.apk overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject executeMethod=EasyAR.EditorTools.EasyARDeviceBuildHelper.Build
```

For iOS, use an output folder such as `Builds/iOS` and complete signing in Xcode or Unity Player Settings.

## 9. Debug Logs

If Unity compilation, Editor automation, or device builds fail, pass the relevant log excerpt back to the MCP server:

```text
easyar_analyze_unity_log sampleId=image-tracking logText="..."
```

For local log files:

```text
easyar_analyze_unity_log sampleId=cloud-recognition logPath=/path/to/Editor.log
```

To let the MCP server find the newest Unity log automatically:

```text
easyar_analyze_latest_unity_log projectPath=/path/to/UnityProject sampleId=cloud-recognition
```

The tool classifies common EasyAR license, plugin import, camera permission, C# compile, Android/Gradle, iOS signing, and sample scene issues. With `sampleId=image-tracking` or `sampleId=cloud-recognition`, it adds focused target-asset, cloud credential, and network diagnostics.

## 9. File A GitHub Issue

When a focused sample still fails after the generated checks, create a redacted report:

```text
easyar_write_support_bundle projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android overallStatus=blocked
easyar_write_issue_report projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android overallStatus=blocked
```

Paste the contents of `Assets/EasyARGenerated/<sampleId>/ISSUE_REPORT.md` into a GitHub issue and attach or reference `SUPPORT_BUNDLE.md`, `RUN_RESULT.md`, `SCENE_AUDIT.md`, and the Unity log path listed there. Review the report before posting and remove any private license, token, appKey, appSecret, signing, provisioning, or account data.
