# Mega PICO 4 Ultra Enterprise Evidence Summary

Date: 2026-06-12

Scope: `mega` sample on PICO 4 Ultra Enterprise, Unity `2022.3.62f3`.

Safe evidence only. This summary intentionally excludes EasyAR website passwords, verification codes, license keys, API Key/API Secret values, appKey/appSecret, signing keys, APK binaries, Unity packages, and raw private logs.

## Verified Baseline

- Unity: `2022.3.62f3`
- Android package name: `com.easyar.mega.xrtest`
- EasyAR Sense Unity Plugin: `4002.0.0+4956.1ec38c1ad`
- EasyAR Mega: `2.12.6+4956.1ec38c1ad`
- EasyAR Unity XR device extension package: `4000.0.0`
- PICO Unity Integration SDK: `3.4.0`
- Required EasyAR license class: `4.x XR正式版`
- Device: PICO 4 Ultra Enterprise
- EasyAR frame source: `PicoFrameSource`
- Mega cloud localization library/material: `视辰信息科技(上海)有限公司`
- Localized Mega Block: `大厅+办公室+阳台+GPS+0716`

## Verified Signals

- A fresh Unity project was created for the PICO headset validation instead of reusing the previous Tiantan or Android-phone project.
- APK build succeeded from Unity batch mode.
- APK installed successfully on the connected PICO device through ADB.
- App launched as package `com.easyar.mega.xrtest`.
- EasyAR Sense initialized on the headset.
- EasyAR Pico frame source availability check ran.
- PICO VST camera startup succeeded; logs showed `startPreview done, RGB=[0]`.
- The headset stayed awake and the app held the foreground window during the successful capture window.
- On-screen EasyAR diagnostics showed:
  - `Pico (True) received 900+`
  - `Mega Block: min=FiveDof, Simulator`
  - `1222.263, Found`
  - `Block: 大厅+办公室+阳台+GPS+0716 (...)`
- The user confirmed PICO headset passthrough/real-world background was visible in the headset.

## Location Input Note

The PICO path intentionally uses Mega `LocationInputMode=Simulator`. When the same scene was changed to `Onsite`, Unity/EasyAR attempted to start Android location service and PICO returned:

```text
provider "gps" does not exist
```

This is expected because the headset does not expose an Android GPS provider. Therefore, the EasyAR diagnostics caution:

```text
Mega is running in Simulator mode with simulated or no location input.
```

is expected for the verified PICO 4 Ultra Enterprise headset path and does not indicate localization failure. Android phone/tablet Mega validation should still use `Onsite`.

## Screenshot Note

ADB `screencap` can miss the PICO VST passthrough composition layer. Repository evidence should treat headset-visible passthrough plus EasyAR/PICO logs and Mega `Found` diagnostics as the validation signal rather than requiring `screencap` to show the real-world background.

## Local Evidence Files

The raw logs and Unity project remain local and should not be committed because Unity/EasyAR projects can contain private account or environment details.

- Fresh Unity project: `/Users/tuyi/UnityProjects/xrtest`
- Build log: `/Users/tuyi/UnityProjects/xrtest/Logs/build-pico-mega-simulator-vst-bootstrap-fixed.log`
- Focused PICO run log: `/Users/tuyi/UnityProjects/xrtest/Logs/pico-mega-simulator-vst-bootstrap-fixed-focused-20260612.log`
- Active headset screenshot: `/Users/tuyi/UnityProjects/xrtest/Logs/pico_easyar_active.png`
- APK path: `/Users/tuyi/UnityProjects/xrtest/Builds/xrtest-pico-mega.apk`
