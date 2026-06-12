# Mega Android Device Evidence Summary

Date: 2026-06-12

Scope: `mega` sample on Android, Unity `2022.3.62f3`.

Safe evidence only. This summary intentionally excludes EasyAR website passwords, verification codes, license keys, Cloud Recognition API KEY/API Secret values, appKey/appSecret, signing keys, APK binaries, Unity packages, and raw private logs.

## Verified Signals

- Android package name was taken from the logged-in EasyAR development center record: `com.myarcommon.myar`.
- APK metadata verified `package: name='com.myarcommon.myar'`.
- Test device detected through ADB: Samsung `SM_S9210`, serial `RFCY4161BTX`.
- APK installed successfully on the real Android device.
- Camera, location, network, and audio runtime permissions were granted where applicable.
- EasyAR Settings loaded on device.
- EasyAR Sense initialized successfully; the previous `Invalid Key: {No matched Package Name}` blocker was cleared.
- Mega Block loaded from `ARMallBlock9.0`: `大厅+办公室+阳台+GPS+0716`.
- EasyAR camera overlay shader blocker was cleared by including `EasyAR/CameraImage_*` shaders in Unity `Always Included Shaders`.
- Long device log showed Mega localization/tracking activity with `[MLOC]`, `kLocalizationFullMap`, `kMapTracking`, and repeated `NCam_Verified results`.

## Local Evidence Files

The raw logs stay local and should not be committed because Unity/EasyAR projects can contain private account or environment details.

- Build log: `/Users/tuyi/UnityProjects/TiantanARSpatial/Logs/mega-android-build-shader-fix-2.log`
- Device log: `/Users/tuyi/UnityProjects/TiantanARSpatial/Logs/mega-device-logcat-20260612-shader-fix-long.log`

## Previous Blockers Cleared

- Unity default Android package name was replaced with the EasyAR portal package name.
- EasyAR license mismatch was fixed by using the portal license for that package name in the local Unity project.
- `EasyARSettings is not found` was fixed by preloading `Assets/XR/Settings/EasyAR Settings.asset`.
- `Could not find EasyAR shader for video overlay` was fixed by adding all required EasyAR camera image shaders to always-included shaders before build.
