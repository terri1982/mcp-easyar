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

## Recommended MCP Sequence

Replace `/path/to/miniprogram` and `/path/to/official/package` with local paths.

```text
easyar_list_miniprogram_samples
easyar_check_wechat_devtools
easyar_write_miniprogram_local_config_form projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_import_miniprogram_sample_from_local_package projectPath=/path/to/miniprogram sampleId=wechat-mega packagePath=/path/to/official/package dryRun=true
easyar_import_miniprogram_sample_from_local_package projectPath=/path/to/miniprogram sampleId=wechat-mega packagePath=/path/to/official/package dryRun=false
easyar_inspect_miniprogram_project projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_preflight projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_run_sequence projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_run_miniprogram_devtools_check projectPath=/path/to/miniprogram sampleId=wechat-mega dryRun=true
easyar_run_miniprogram_devtools_check projectPath=/path/to/miniprogram sampleId=wechat-mega dryRun=false
easyar_analyze_miniprogram_devtools_log projectPath=/path/to/miniprogram sampleId=wechat-mega logPath=easyar-generated/wechat-mega/DEVTOOLS_CHECK.log
easyar_write_miniprogram_device_validation_checklist projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_run_result_form projectPath=/path/to/miniprogram sampleId=wechat-mega
```

Use `sampleId=wechat-crs` for the CRS path.

## Real-Device Validation

The sample is not complete until it is previewed on a real phone through WeChat Developer Tools.

For both samples, record:

- tested device model
- WeChat version if known
- whether camera permission was granted
- DevTools preview/open result
- redacted log path or redacted screenshot path
- a short observed behavior summary

For `wechat-mega`, the required proof is real-device localization/tracking in the selected mapped environment. Good evidence includes a redacted log or screenshot note showing localization success, block found, tracking started, or an equivalent official sample success signal.

For `wechat-crs`, the required proof is recognition of an intended cloud target. Good evidence includes a redacted log or screenshot note showing the target name/id or official sample recognition success signal. The target image must already be uploaded to the EasyAR Cloud Recognition library by the user.

## Recording The Result

After real-device preview, write the run result. The `passedStepIds` must come from `DEVICE_VALIDATION.md`.

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
- `DEVTOOLS_CHECK.log` exists and has no known blocker findings.
- `RUN_RESULT.md` says `Run-through complete: yes`.
- The run result references real-device preview evidence.
- `MINIPROGRAM_SCOPE_STATUS.md` reports `All Mini Program samples complete: yes` only after both `wechat-mega` and `wechat-crs` completion reports pass.

## Release Claim Policy

Do not claim `wechat-mega` or `wechat-crs` is run through from generated artifacts alone. A valid public claim needs the local project artifacts plus redacted real-device evidence. Compile/open success alone is useful progress, but it is not sample completion.
