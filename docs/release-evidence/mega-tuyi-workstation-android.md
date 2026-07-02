# Mega Tuyi Workstation Android Evidence

Date: 2026-07-02

Scope: EasyAR Mega Block cloud localization against the ARMall `涂意工位测试专用` library in a fresh Unity project, Unity `2022.3.62f3`, Android real device.

Safe evidence only. This summary intentionally excludes EasyAR website passwords, license keys, Mega API Key/API Secret values, signing keys, APK binaries, Unity packages, screenshots with service identifiers, and raw private logs.

## Verified Environment

- Unity project: `/Users/tuyi/UnityProjects/EasyAR-Mega-Tuyi-Workstation-Test`
- APK: `/Users/tuyi/UnityProjects/EasyAR-Mega-Tuyi-Workstation-Test/Builds/Android/EasyAR-Mega-Tuyi-Workstation.apk`
- EasyAR package set:
  - `com.easyar.sense` `4003.0.0+5171.3948ae721`
  - `com.easyar.mega` `2.13.0+5171.3948ae721`
  - `com.easyar.mega.studio` `2.13.0+5171.3948ae721`
- Unity XR dependencies were added for the official sample scene:
  - `com.unity.xr.arfoundation` `5.1.6`
  - `com.unity.xr.arcore` `5.1.6`
  - `com.unity.xr.management` `4.4.0`
- Android package identifier: `com.DefaultCompany.MegaMap`
- Test device: Samsung `SM-S9010`, serial `R5CTA0ZQ6XJ`

## Selected Cloud Localization Material

- Service group: `ARMallMega9.0`
- Cloud localization library: `涂意工位测试专用`
- Bound storage: `ARMallBlock9.0`
- Data format: `3-a`
- Block: `CodexTest01`
- Block ID: `b75f4d7a-134c-4b6a-90d4-1dea938c2c16`
- Runtime mode: `Onsite`

## Verified Signals

- Created and applied a package-name-matched EasyAR Sense 4.x license for `com.DefaultCompany.MegaMap`.
- Configured `MegaBlock_Basic` to use global Mega Block service config and `CodexTest01`.
- Built an Android ARM64 IL2CPP APK successfully.
- Installed the APK on Samsung `SM-S9010` successfully.
- Granted camera/location permissions through ADB.
- EasyAR Sense initialized on device:
  - `EasyAR Sense Unity Plugin Version 4003.0.0+5171.3948ae721`
  - `EasyAR Sense CommunityFull (Android-arm64) Version 4.9.0.11908-e5f122cc4`
- The previous `Invalid Key: {No matched Package Name}` startup blocker was cleared after using the package-name-matched license.
- Missing AR Foundation/XR scene script warnings were cleared by adding the Unity XR packages.
- Runtime used ARCore camera input and opened the real camera stream.
- On-device diagnostics showed the Mega Block cloud localization path using `CodexTest01` and the selected server config.
- The user confirmed the final real-device run localized successfully.

## Blockers Cleared

- Initial reuse of an unrelated local EasyAR license failed with `Invalid Key: {No matched Package Name}`. A new ARMall account Sense license was created for the test package name.
- The official sample initially logged missing scripts on `AR Session`, `XR Origin`, and `Main Camera`. Adding AR Foundation, ARCore XR Plugin, and XR Management resolved those warnings.
- The first Android build failed because CPU architecture / scripting backend settings were incomplete for ARCore batch builds. The build automation now sets IL2CPP and ARM64 and disables the EasyAR 32-bit ARCore preflight dialog in batch mode.
- A previous external-disk Unity project hit repeated Unity asset database errors; the final verified project was recreated on local APFS storage.

## Current Limitations

The committed record is a safe summary. Raw APKs, Unity packages, screenshots, build logs, and service credentials remain local because they may contain private account or environment details.

## Local Evidence Files

- Unity project: `/Users/tuyi/UnityProjects/EasyAR-Mega-Tuyi-Workstation-Test`
- APK: `/Users/tuyi/UnityProjects/EasyAR-Mega-Tuyi-Workstation-Test/Builds/Android/EasyAR-Mega-Tuyi-Workstation.apk`
- Build log: `/Users/tuyi/UnityProjects/EasyAR-Mega-Tuyi-Workstation-Test/Builds/Logs/build-android.log`
- Runtime screenshot: `/tmp/s22-mega-current.png`
