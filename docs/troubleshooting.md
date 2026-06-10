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

Custom scene note:

The MCP server recognizes Image Tracking scenes by official sample naming hints and by scene content markers such as `ImageTarget`, `ImageTracker`, and `TargetDataFileSource`. This allows custom scenes such as an RMB recognition scene to be treated as Image Tracking candidates even when the filename does not contain `ImageTracking`.

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

- `cloud-recognition-credentials`: `ProjectSettings/EasyAR/easyar.local.json` does not contain non-placeholder `appId` plus `apiKey` for Sense 4.1+, or a complete legacy `appId`/`appKey`/`appSecret` set.
- `cloud-target-library-ready`: the EasyAR account has no Cloud Recognition image library, or the selected library has no uploaded/enabled test target image.
- `focused-sample-scene-imported`: the Cloud Recognition sample exists in the EasyAR package cache but has not been imported into `Assets/Samples`.
- `package-cache-sample-available`: the MCP server found a candidate under `Library/PackageCache/**/Samples~`; import it through Unity Package Manager Samples.
- `cloud-recognition-network`: Unity or device logs indicate timeout, unreachable host, TLS, DNS, or service connectivity problems.
- `sample-scene`: no Cloud Recognition scene candidate was found, or the matching scene is not enabled in Build Settings.
- `camera-permission`: the app cannot access camera permission on device.

Package cache note:

EasyAR package samples can appear under `Library/PackageCache/.../Samples~/ImageTracking/ImageTracking_CloudRecognition` before they are imported into the project. The MCP server reports these paths as import candidates, but Unity must still import the sample into `Assets/Samples` before Build Settings and scene validation can succeed.

Cloud Recognition device pass note:

`easyar_android_install_apk`, `easyar_android_start_app`, and `easyar_android_collect_logcat` prove only install, launch, and log capture. A passed Cloud Recognition `RUN_RESULT.md` also needs a configured EasyAR Cloud Recognition target library, at least one uploaded test target image, a real device network path to the service, and observed recognition of that target.

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

Do not post EasyAR license keys, account tokens, Cloud Recognition API KEY/API Secret, `appKey` or `appSecret`, signing keys, provisioning profiles, device-private identifiers, or full private logs. The MCP reports redact common key names, but users should still review issue content before publishing it on GitHub.
