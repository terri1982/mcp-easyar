# Mega Fresh Project Android Startup And Localization Evidence

Date: 2026-06-12

Scope: fresh Unity project Mega sample startup and localization validation on Android, Unity `2022.3.62f3`.

Safe evidence only. This summary intentionally excludes EasyAR website passwords, verification codes, license keys, API Key/API Secret values, appKey/appSecret, signing keys, APK binaries, Unity packages, and raw private logs.

## Fresh Project Setup

- A new Unity project was created for verification instead of reusing the previous Tiantan project.
- Official downloaded packages were used:
  - `com.easyar.sense` `4002.0.0+4956.1ec38c1ad`
  - `com.easyar.mega` `2.12.6+4956.1ec38c1ad`
- The official `MegaBlock_Basic` sample was copied from the EasyAR package cache into the project.
- Android package name was taken from the logged-in EasyAR development center record: `com.myarcommon.myar`.
- Mega cloud localization AppID used for the selected library: `ab70931ebdd2488c9b7883bab473ca50`.
- The selected library/materials were identified as:
  - Cloud localization library: `视辰信息科技(上海)有限公司`
  - Mega Block storage: `ARMallBlock9.0`
  - Mega Block name: `大厅+办公室+阳台+GPS+0716`
- The sample scene was switched from `Simulator` to `Onsite` mode for real-device validation.
- The official `MegaBlock_Basic` scene was adjusted for the fresh project so `BlockHolder.BlockRootSource` uses `Internal`. This prevents the runtime fatal error `Block root not exist ... (BlockRootSource = External)` when a Mega Block is localized but no external BlockRoot was assigned in the editor.

## Verified Signals

- Android APK build succeeded.
- APK installed successfully on the connected Android device.
- Test device detected through ADB: Samsung `SM_S9210`, serial `RFCY4161BTX`.
- App launched successfully with process alive after startup.
- Camera and location permissions were granted through ADB before launch.
- EasyAR Sense initialized successfully on device:
  - `EasyAR Sense Unity Plugin Version 4002.0.0+4956.1ec38c1ad`
  - `EasyAR Sense CommunityFull (Android-arm64) Version 4.9.0.11908-e5f122cc4`
- Previous startup blockers were not present:
  - no `License Key is empty`
  - no `Invalid Key`
  - no observed `401` or `400` service error during the startup window
  - no Android runtime crash
  - no `Block root not exist`
  - no `Session Broken: RunningFailed`
- The real-device build no longer emitted the `Mega is running in Simulator mode` warning after switching `locationInputMode` to `Onsite`.
- ARCore/camera startup logs showed live camera frame activity.

## Localization Evidence

The fresh project was then tested on the same Android device while the phone camera was pointed at the selected mapped office scene. The device log and on-screen diagnostics for package `com.myarcommon.myar` captured repeated localization and tracking signals:

- `[VioEstimator] Vio start up successful initialization`
- `[MLOC] NCam_Verified results of kLocalizationFullMap`
- `World pose node changing to MapId:315886d2-3094-27d0-8dbf-1686cdc2c8f9`
- `[MLOC] NCam_Verified results of kMapTracking`
- `[M] [Localizer] - loaded map 315886d1-3094-27d0-8c86-ec6f18cb4d51`
- `[M] ADF 315886d2-3094-27d0-8dbf-1686cdc2c8f9 successfully localized against ADF 315886d1-3094-27d0-8c86-ec6f18cb4d51`
- On-screen sample diagnostics showed `Block: 大厅+办公室+阳台+GPS+0716 (a21e8f20-e1b9-4ac1-a5ed-335e74697e6a)` and device pose relative to the localized block.

No license-invalid, AppID-invalid, unauthorized, forbidden, `Block root not exist`, `Session Broken`, or Android runtime-crash blocker was observed in the successful localization window.

## Current Limitation

This evidence proves fresh-project APK build, install, startup, EasyAR initialization, Onsite-mode readiness, real-device Mega localization/tracking log signals, and on-screen localized Block identification for the selected mapped environment. It is still a local evidence summary: raw logs, screenshots, APKs, Unity package files, and secret-bearing Unity settings stay outside the repository.

## Local Evidence Files

The raw logs and Unity project remain local and should not be committed because Unity/EasyAR projects can contain private account or environment details.

- Fresh Unity project: `/Users/tuyi/UnityProjects/EasyARMegaVerification`
- Build log: `/Users/tuyi/UnityProjects/EasyARMegaVerification/Logs/build-android-mega-onsite.log`
- Final BlockRoot fix build log: `/Users/tuyi/UnityProjects/EasyARMegaVerification/Logs/build-android-mega-blockroot-internal.log`
- Final device localization log: `/Users/tuyi/UnityProjects/EasyARMegaVerification/Logs/mega-current-block-debug-20260612-123117.log`
- Final device screenshot: `/Users/tuyi/UnityProjects/EasyARMegaVerification/Logs/mega-current-block-debug-20260612-123120.png`
- APK path: `/Users/tuyi/UnityProjects/EasyARMegaVerification/Builds/EasyARMegaVerification.apk`
