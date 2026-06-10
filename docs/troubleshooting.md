# mcp-easyar Focused Sample Troubleshooting

Current run-through work is limited to Image Tracking and Cloud Recognition. Other EasyAR samples are cataloged for later expansion and should not be treated as verified by this MCP server yet.

## First Checks

Run these before debugging a Unity scene by hand:

```text
easyar_write_onboarding_report projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_import_checklist projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_run_report projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_scene_audit projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_support_bundle projectPath=/path/to/UnityProject sampleId=image-tracking
```

Use `sampleId=cloud-recognition` for Cloud Recognition.

## Image Tracking

Common blockers:

- `easyar-official-import`: the official EasyAR Unity Plugin is not visible under `Assets` or `Packages`.
- `sample-scene`: no Image Tracking scene candidate was found, or the matching scene is not enabled in Build Settings.
- `image-target-assets`: target image or target metadata assets are missing.
- `image-tracking-target-load`: Unity logs indicate the target file cannot be loaded.
- `image-tracking-no-detection`: the app opens camera but never detects the target.

Recommended flow:

```text
easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_create_build_settings_helper projectPath=/path/to/UnityProject sampleId=image-tracking platform=android overwrite=true
easyar_create_sample_validation_helper projectPath=/path/to/UnityProject sampleId=image-tracking overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject executeMethod=EasyAR.EditorTools.EasyARSampleValidationHelper.ValidateFocusedSample
easyar_analyze_latest_unity_log projectPath=/path/to/UnityProject sampleId=image-tracking
```

If validation still fails, regenerate:

```text
easyar_write_support_bundle projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=image-tracking platform=android overallStatus=blocked
easyar_write_issue_report projectPath=/path/to/UnityProject sampleId=image-tracking platform=android overallStatus=blocked
```

## Cloud Recognition

Common blockers:

- `cloud-recognition-credentials`: `ProjectSettings/EasyAR/easyar.local.json` does not contain non-placeholder `appId`, `appKey`, and `appSecret`.
- `cloud-recognition-network`: Unity or device logs indicate timeout, unreachable host, TLS, DNS, or service connectivity problems.
- `sample-scene`: no Cloud Recognition scene candidate was found, or the matching scene is not enabled in Build Settings.
- `camera-permission`: the app cannot access camera permission on device.

Recommended flow:

```text
easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=cloud-recognition
easyar_validate_local_config projectPath=/path/to/UnityProject
easyar_check_official_access projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_create_build_settings_helper projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android overwrite=true
easyar_create_sample_validation_helper projectPath=/path/to/UnityProject sampleId=cloud-recognition overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject executeMethod=EasyAR.EditorTools.EasyARSampleValidationHelper.ValidateFocusedSample
easyar_analyze_latest_unity_log projectPath=/path/to/UnityProject sampleId=cloud-recognition
```

If validation or a real-device run still fails, regenerate:

```text
easyar_write_support_bundle projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android overallStatus=blocked
easyar_write_issue_report projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android overallStatus=blocked
```

Paste `ISSUE_REPORT.md` into a GitHub issue and reference `SUPPORT_BUNDLE.md`, `RUN_RESULT.md`, `SCENE_AUDIT.md`, and the Unity log paths listed there. Review every artifact before posting publicly.

## Security

Do not post EasyAR license keys, account tokens, Cloud Recognition `appKey` or `appSecret`, signing keys, provisioning profiles, device-private identifiers, or full private logs. The MCP reports redact common key names, but users should still review issue content before publishing it on GitHub.
