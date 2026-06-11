# mcp-easyar Fresh Project Acceptance

This checklist proves that a fresh Unity project can use the current local-key MVP to reach the focused EasyAR sample target.

Current acceptance scope:

- Image Tracking
- CRS/Cloud Recognition

Out of scope until the user explicitly continues:

- Hello AR
- Surface Tracking
- Other EasyAR Sense Unity Plugin samples
- Automated official EasyAR account API access
- npm or npx install before the npm package is published

## Preconditions

- Unity `2022.3.62f3` or a compatible Unity 2022.3 LTS editor is installed.
- Node.js 20 or newer is available.
- The MCP package is installed from the current GitHub Release tarball.
- The official EasyAR Sense Unity Plugin is downloaded from the EasyAR website and imported into the Unity project.
- Android device validation is preferred for final evidence. Editor-only checks are not enough to prove AR recognition.

Install the current prerelease:

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.28/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## Safety Rules

The local-key MVP intentionally keeps account and secret material outside chat.

Do not paste these values into Codex, Claude, issue comments, docs, logs, or committed files:

- EasyAR website password
- Verification code
- License key
- CRS API Key or API Secret
- `appKey`
- `appSecret`

Users register, log in, download packages, create keys, and manage cloud target libraries in their own browser at the official EasyAR website. MCP only guides the process and validates redacted local presence.

The Unity project local config path is:

```text
ProjectSettings/EasyAR/easyar.local.json
```

This file must stay local and ignored by git.

## First Client Calls

After connecting Codex, Claude Desktop, or another MCP client, call:

```text
easyar_server_status
easyar_check_client_setup client=codex entrypointMode=package-bin includeTokenPlaceholder=false
```

Then read these resources:

```text
easyar://client/acceptance
easyar://acceptance/fresh-project
easyar://status/remaining-work
easyar://workflow/focused-scope
easyar://workflow/programming
```

The client is ready when the server name is `mcp-easyar`, the focused samples include `image-tracking` and `cloud-recognition`, and `easyar-mcp-check` reports all required resources as OK.

## New Unity Project Flow

Create the first local handoff artifacts:

```text
easyar_write_client_setup outputRoot=/path/to/report-folder client=codex entrypointMode=package-bin
easyar_write_first_run_guide projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_write_local_config_handoff projectPath=/path/to/UnityProject accountStage=logged-in sampleId=cloud-recognition platform=android
easyar_write_local_config_form projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
```

Fill `ProjectSettings/EasyAR/easyar.local.json` locally, or write it from local environment variables with:

```text
easyar_write_local_config_from_env projectPath=/path/to/UnityProject overwrite=false
easyar_validate_local_config projectPath=/path/to/UnityProject sampleId=cloud-recognition
```

For Image Tracking, run the focused setup sequence:

```text
easyar_write_import_checklist projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_sample_import_guide projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_import_sample_from_package_cache projectPath=/path/to/UnityProject sampleId=image-tracking dryRun=true
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_create_sample_validation_helper projectPath=/path/to/UnityProject overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject methodName=EasyARGenerated.SampleValidationHelper.ValidateFocusedSample sampleId=image-tracking platform=android
easyar_write_run_sequence projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
```

For CRS/Cloud Recognition, run the same focused setup sequence with `sampleId=cloud-recognition`. The user must already have a CRS cloud target library with at least one uploaded target image and the required local CRS fields filled.

```text
easyar_write_import_checklist projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_sample_import_guide projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_import_sample_from_package_cache projectPath=/path/to/UnityProject sampleId=cloud-recognition dryRun=true
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_run_unity_method projectPath=/path/to/UnityProject methodName=EasyARGenerated.SampleValidationHelper.ValidateFocusedSample sampleId=cloud-recognition platform=android
easyar_write_run_sequence projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
```

Build and device validation should then write focused evidence:

```text
easyar_android_device_status
easyar_write_device_validation_checklist projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=image-tracking platform=android status=passed recognitionVerified=true
easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=image-tracking platform=android runThroughComplete=true
easyar_write_device_validation_checklist projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android status=passed recognitionVerified=true
easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android runThroughComplete=true
easyar_write_focused_scope_status projectPath=/path/to/UnityProject platform=android
```

## Acceptance Criteria

- `easyar-mcp-check` passes and reports the fresh project acceptance resource.
- Client setup works through `package-bin` for Codex or Claude Desktop.
- `ProjectSettings/EasyAR/easyar.local.json` validates locally without printing secret values.
- Image Tracking completes a real-device recognition pass.
- CRS/Cloud Recognition completes a real-device recognition pass against a cloud target.
- `FOCUSED_SCOPE_STATUS.md` reports `allFocusedSamplesComplete=true`.
- Generated reports contain paths, redacted presence, and next actions, not raw secrets.
- GitHub Release tarball smoke passes for the same release tag.

When these checks pass, the current focused local-key MVP is acceptable for a fresh Unity project.
