# EasyAR Sense 4003 Android Sample Evidence

Date: 2026-07-02

Scope: EasyAR Sense Unity Plugin `4003.0.0+5171.3948ae721` Android sample build and startup validation in a fresh Unity project, Unity `2022.3.62f3`.

Safe evidence only. This summary intentionally excludes EasyAR website passwords, license keys, Cloud Recognition API Key/API Secret values, appKey/appSecret, signing keys, APK binaries, Unity packages, and raw private logs.

## Verified Environment

- Unity project created on `/Volumes/UnityAPFS` for isolated sample validation.
- Official account-authorized Mega Unity package was downloaded through the logged-in EasyAR website.
- Imported package set:
  - `com.easyar.sense` `4003.0.0+5171.3948ae721`
  - `com.easyar.mega` `2.13.0+5171.3948ae721`
  - `com.easyar.mega.studio` `2.13.0+5171.3948ae721`
- Android test device: Samsung `SM-S9010`, serial `R5CTA0ZQ6XJ`.
- Android package identifier used for the local verification build matched an existing EasyAR license record.
- Cloud Recognition and Mega service config were applied locally from the logged-in EasyAR/ARMall account without committing raw credentials.

## Sample Results

All four APKs built successfully and were installed/launched on the Android device. Each app stayed in the foreground with the process alive during the validation window.

| Sample | Build | Device Startup | Key Runtime Signals |
| --- | --- | --- | --- |
| ImageTracking_Targets | Passed | Passed | EasyAR initialized, camera reached `ACTIVE`, target texture/reference issue cleared after preserving official `.meta` files. |
| ImageTracking_CloudRecognition | Passed | Passed | EasyAR initialized, camera reached `ACTIVE`, no Cloud Recognition service-config-missing error. |
| MotionTracking_DeviceMotionAndPlaneDetection | Passed | Passed | EasyAR initialized, ARCore loaded, camera reached `ACTIVE`; only expected XROrigin warning observed. |
| MegaBlock_Basic | Passed | Passed | EasyAR initialized, camera reached `ACTIVE`, location path engaged in `Onsite` mode, no Simulator-mode warning. |

## Blockers Cleared

- Upgraded from the older local `4002` package to the current downloaded `4003` Sense + Mega package set.
- Imported official sample scenes from PackageCache into `Assets/Samples/EasyAR Sense Unity Plugin/4003.0.0`.
- Preserved official Unity `.meta` files for sample directories. This fixed missing scene scripts and broken texture/prefab references caused by GUID mismatches.
- Added ImageTargets StreamingAssets for Image Tracking target loading.
- Applied Cloud Recognition service config to EasyAR Settings for the cloud sample.
- Applied Mega Block localization service config to EasyAR Settings for the Mega sample.
- Switched `MegaBlock_Basic` `locationInputMode` from `Simulator` to `Onsite` for real-device validation.

## Negative Checks

The successful validation logs did not show:

- Android `FATAL EXCEPTION`
- `The referenced script on this Behaviour is missing`
- `Texture is null`
- `Service config ... NOT set`
- `License Key is empty`
- invalid EasyAR license/key startup failure
- `Session Broken`
- Mega `Simulator mode` warning after switching to `Onsite`

System-level Samsung camera/VPN/location warnings were observed in logcat but were not sample blockers; the apps remained foregrounded and camera streams reached active state.

## MCP Follow-Up

This run exposed an automation requirement now reflected in MCP behavior: official Unity sample imports must preserve all `.meta` files from `PackageCache/Samples~`. Missing `.meta` files break Unity GUID references and can produce runtime `missing script` or null asset errors even when the APK builds successfully.

## Local Evidence Files

The raw build logs, runtime logs, APKs, Unity packages, and temporary Unity project remain local and should not be committed because they may contain private paths or account-specific configuration.

- Local Unity project: `/Volumes/UnityAPFS/EasyAR-Sample-Run-20260701/EasyARSamples`
- Local APK directory: `/Volumes/UnityAPFS/EasyAR-Sample-Run-20260701/Builds`
- Local log directory: `/Volumes/UnityAPFS/EasyAR-Sample-Run-20260701/Logs`
