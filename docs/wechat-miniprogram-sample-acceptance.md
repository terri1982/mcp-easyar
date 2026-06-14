# EasyAR WeChat Mini Program Sample Acceptance

This checklist is the evidence gate for the focused `wechat-mega` and `wechat-crs` samples. It is intentionally local-key and official-tool based: the user signs in to EasyAR and WeChat in the official website or WeChat Developer Tools, downloads official packages, fills local config on their own machine, and lets MCP inspect only local files and redacted evidence.

Do not paste EasyAR passwords, WeChat passwords, verification codes, license keys, CRS API keys/secrets, app secrets, upload keys, preview QR codes, or raw private logs into chat.

## Supported Samples

- `wechat-mega`: EasyAR Mega WeChat Mini Program sample.
- `wechat-crs`: EasyAR CRS / Cloud Recognition WeChat Mini Program sample.

Other WeChat Mini Program samples are out of scope until explicitly requested.

## Required Local Inputs

The user must prepare these outside MCP:

- A WeChat Mini Program project directory with `project.config.json` and `app.json`.
- WeChat Developer Tools installed and logged in locally.
- The official EasyAR Mini Program SDK/sample package downloaded by the user from the EasyAR website.
- An EasyAR license bound to the Mini Program app id.
- For `wechat-mega`: Mega app/server information plus the selected cloud localization library/block metadata.
- For `wechat-crs`: CRS app id, server address, API key, API secret, and at least one uploaded cloud target image.

`wechat-mega` specifically requires the EasyAR Mega WeChat Mini Program SDK/sample package or an existing WeChat Mini Program Mega project. A Unity Mega project, Android APK, PICO build, or XREAL build is useful reference evidence, but it is not a Mini Program Mega sample and cannot complete this target by itself.

## Official Download Handoff

MCP does not sign in to the EasyAR website for the user and does not bypass download entitlement. The user should open the official EasyAR download page in their own browser:

```text
https://www.easyar.cn/view/download.html
```

Suggested search terms:

- `wechat-mega`: 微信小程序, Mega, EasyAR Mega, Mini Program
- `wechat-crs`: 微信小程序, CRS, Cloud Recognition, Mini Program

Current official download entries:

- `wechat-mega`: `EasyAR Mega 微信小程序示例`, version `2.0.3`, file name `easyar-mega-wechat-miniprogram-plugin-2.0.3-1077.647aaae_samples.zip`, docs `https://www.easyar.cn/doc/zh-cn/develop/wechat/mega/quickstart.html`
- `wechat-crs`: `EasyAR CRS 微信小程序示例`, version `2.0.0`, file name `EasyAR-miniprogram-WebAR-Demo-tracking.zip`, docs `https://www.easyar.cn/doc/zh-cn/develop/wechat/cloud-recognition/quickstart.html`

These files are protected by EasyAR website login/entitlement. MCP does not download them with the user's account password and does not bypass authorization; the user should download them in their own official browser session.

After downloading, pass the local extracted directory or `.zip` path to `easyar_import_miniprogram_sample_from_local_package`. If MCP detects a Unity project, it rejects it as a WeChat Mini Program sample source.

## Recommended MCP Sequence

Replace `/path/to/miniprogram` and `/path/to/official/package-or.zip` with local paths. The official package path can be an extracted directory or a downloaded `.zip`.

```text
easyar_list_miniprogram_samples
easyar_check_wechat_devtools
easyar_find_miniprogram_official_package sampleId=wechat-mega searchRoots='["/Users/you/Downloads","/Users/you/Documents"]'
easyar_create_miniprogram_sample_workspace projectPath=/path/to/miniprogram sampleId=wechat-mega appId=wx-your-appid
easyar_write_miniprogram_local_config_form projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_import_miniprogram_sample_from_local_package projectPath=/path/to/miniprogram sampleId=wechat-mega packagePath=/path/to/official/package-or.zip dryRun=true
easyar_import_miniprogram_sample_from_local_package projectPath=/path/to/miniprogram sampleId=wechat-mega packagePath=/path/to/official/package-or.zip dryRun=false
easyar_inspect_miniprogram_project projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_run_through_status projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_preflight projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_run_sequence projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_run_miniprogram_devtools_check projectPath=/path/to/miniprogram sampleId=wechat-mega mode=open dryRun=true
easyar_run_miniprogram_devtools_check projectPath=/path/to/miniprogram sampleId=wechat-mega mode=open dryRun=false
easyar_run_miniprogram_devtools_check projectPath=/path/to/miniprogram sampleId=wechat-mega mode=preview dryRun=true
easyar_run_miniprogram_devtools_check projectPath=/path/to/miniprogram sampleId=wechat-mega mode=preview dryRun=false
easyar_analyze_miniprogram_devtools_log projectPath=/path/to/miniprogram sampleId=wechat-mega logPath=easyar-generated/wechat-mega/DEVTOOLS_CHECK.log
easyar_write_miniprogram_device_validation_checklist projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_run_result_form projectPath=/path/to/miniprogram sampleId=wechat-mega
```

Use `sampleId=wechat-crs` for the CRS path.

## Real-Device Validation

The sample is not complete until it is previewed on a real phone through WeChat Developer Tools.

Use `easyar_run_miniprogram_devtools_check mode=preview` after the project opens successfully. By default it prepares `easyar-generated/<sampleId>/WECHAT_PREVIEW_QR.png` and `easyar-generated/<sampleId>/WECHAT_PREVIEW_INFO.json` as local preview artifacts. The QR code is private local evidence; do not paste or commit it. If the installed WeChat Developer Tools version uses different preview arguments, pass the exact `devtoolsArgs`.

Workspaces created by MCP add these preview artifacts to `.gitignore`; for existing projects, add equivalent ignore rules before running preview.

For both samples, record:

- tested device model
- WeChat version if known
- whether camera permission was granted
- DevTools preview/open result
- redacted log path or redacted screenshot path
- a short observed behavior summary

For `wechat-mega`, the required proof is real-device localization/tracking in the selected mapped environment. Good evidence includes a redacted log or screenshot note showing localization success, block found, tracking started, or an equivalent official sample success signal.

For `wechat-crs`, the required proof is recognition of an intended cloud target. Good evidence includes a redacted log or screenshot note showing the target name/id or official sample recognition success signal. The target image must already be uploaded to the EasyAR Cloud Recognition library by the user.

`easyar_analyze_miniprogram_devtools_log` reports both blocker findings and `successSignals`. For passing evidence, prefer success signals such as `camera-ready`, `devtools-preview-ready`, `mega-localized`, and `crs-recognized`, then copy the redacted evidence line into the run-result summary.

## Recording The Result

After real-device preview, write the run result. The `passedStepIds` must come from `DEVICE_VALIDATION.md`.

If the project already has a redacted local evidence file, such as `docs/crs-real-evidence.json`, pass it as `redactedEvidencePath`. The path must stay inside the Mini Program project. Do not paste QR codes, raw private logs, license keys, API secrets, or tokens into the summary.

Example for Mega:

```text
easyar_write_miniprogram_run_result projectPath=/path/to/miniprogram sampleId=wechat-mega overallStatus=passed devtoolsStatus=passed devicePreviewStatus=passed passedStepIds='["official-login","project-preflight","devtools-check","real-device-preview","mega-service-ready","mega-localized-on-device"]' evidenceSummary="Real-device WeChat preview localized in the mapped Mega environment; redacted log/screenshot evidence recorded locally."
easyar_write_miniprogram_completion_report projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_scope_status projectPath=/path/to/miniprogram
```

Example for CRS:

```text
easyar_write_miniprogram_run_result projectPath=/path/to/miniprogram sampleId=wechat-crs overallStatus=passed devtoolsStatus=passed devicePreviewStatus=passed passedStepIds='["official-login","project-preflight","devtools-check","real-device-preview","crs-service-ready","crs-recognized-on-device"]' evidenceSummary="Real-device WeChat preview recognized the intended CRS cloud target; redacted log/screenshot evidence recorded locally."
easyar_write_miniprogram_completion_report projectPath=/path/to/miniprogram sampleId=wechat-crs
easyar_write_miniprogram_scope_status projectPath=/path/to/miniprogram
```

`COMPLETION_REPORT.md` is complete only when:

- `PREFLIGHT.md` exists and has no blocked checks.
- `DEVICE_VALIDATION.md` exists.
- `DEVTOOLS_CHECK.log` exists, has no known blocker findings, and includes at least one recognized success signal such as `devtools-preview-ready`, `camera-ready`, `mega-localized`, or `crs-recognized`.
- `RUN_RESULT.md` says `Run-through complete: yes` and contains a usable redacted evidence summary, not placeholder text.
- The run result references real-device preview evidence.
- `MINIPROGRAM_SCOPE_STATUS.md` reports `All Mini Program samples complete: yes` only after both `wechat-mega` and `wechat-crs` completion reports pass.

## Release Claim Policy

Do not claim `wechat-mega` or `wechat-crs` is run through from generated artifacts alone. A valid public claim needs the local project artifacts plus redacted real-device evidence. Compile/open success alone is useful progress, but it is not sample completion.
