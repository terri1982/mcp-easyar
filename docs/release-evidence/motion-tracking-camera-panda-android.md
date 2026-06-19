# Motion Tracking Camera Panda Android Evidence

Date: 2026-06-19

Scope: EasyAR Sense Unity motion tracking sample on Android, Unity `2022.3.62f3`.

Safe evidence only. This summary intentionally excludes EasyAR license keys, signing keys, APK binaries, screenshots from private spaces, Unity package payloads, and raw private logs.

## Verified Result

- Built an Android APK from the EasyAR Sense Unity Plugin motion tracking sample.
- Installed and cold-started the APK on a real Samsung `SM-S9210` Android device.
- Camera image rendered correctly in the app.
- All sample UI, buttons, frame-source dropdowns, EasyAR yellow diagnostics dump, and Unity `Development Build` watermark were hidden.
- The runtime used EasyAR motion tracking with ARCore camera input.
- The scene was changed to automatically place the sample `EasyARPanda` object after a horizontal plane hit is found.
- The APK started without `Invalid Key`, `license invalid`, `EasyARSettings is not found`, `Could not find EasyAR shader`, `FATAL EXCEPTION`, or `Unable to start AR Session`.

## Implementation Notes

- Android package name: `com.easyar.mega.xrtest`.
- EasyAR settings asset was registered through `EditorBuildSettings.AddConfigObject("EasyAR.Settings", ...)` and added to Unity preloaded assets.
- EasyAR camera image shaders were forced into Unity `Always Included Shaders` before build:
  - `EasyAR/CameraImage_RGB`
  - `EasyAR/CameraImage_BGR`
  - `EasyAR/CameraImage_Gray`
  - `EasyAR/CameraImage_YUV_I420_YV12`
  - `EasyAR/CameraImage_YUV_NV12`
  - `EasyAR/CameraImage_YUV_NV21`
- The sample runtime now hides all `Canvas` objects at startup.
- `DiagnosticsController.MessageOutput.SessionDump` is set to `None` to suppress the yellow EasyAR session dump overlay.
- Build options were changed from development/debugging to `BuildOptions.None`.
- Frame source ordering prefers EasyAR `MotionTrackerFrameSource` so horizontal plane hit testing is available for automatic Panda placement.

## Local Evidence Files

The raw build output, APK, and screenshots remain local and should not be committed.

- Unity project: `/private/tmp/easyar-motion-minimal-20260619`
- APK: `/private/tmp/easyar-motion-minimal-20260619/Builds/easyar-motion-tracking.apk`
- Final build log: `/private/tmp/easyar-motion-minimal-20260619/build-no-debug-overlay.log`
- Final screenshot: `/private/tmp/easyar-no-debug-overlay.png`

## Final Build Signals

- `Build Finished, Result: Success.`
- APK size: `668044287` bytes, shown by Finder/ls as about `45M`.
- ADB install result: `Success`.
- Runtime negative check found no fatal startup, license, settings, or shader errors.

## Previous Blockers Cleared

- EasyAR package/license mismatch was fixed by using `com.easyar.mega.xrtest`.
- `EasyARSettings is not found` was fixed by preloading and registering the settings asset.
- `Could not find EasyAR shader for video overlay` was fixed by including all EasyAR camera image shaders in the build.
- Visible debug UI was fixed by disabling sample canvases and EasyAR session dump output.
- Unity `Development Build` watermark was removed by building a non-development APK.
