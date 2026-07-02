# mcp-easyar Current Status

This status page summarizes the current evidence-backed state of `mcp-easyar`.

It is not a completion claim for every EasyAR sample. The active goal now covers Image Tracking, CRS/Cloud Recognition, and Mega only.

An additional WeChat Mini Program sample track is now being added for EasyAR Mega and CRS/Cloud Recognition. The current implementation provides local inspection, user-downloaded official package import, DevTools smoke checks, log analysis, real-device validation checklists, run-result forms, completion reports, Mini Program scope status, and handoff artifacts; it is not yet a claim of preview, upload, or real-device Mini Program completion.

## Current Release

Current GitHub prerelease: `v0.1.0-local-key.38`

Official EasyAR Chinese docs refresh: 2026-07-01. MCP metadata now tracks EasyAR Sense Unity Plugin / for Mega `4003.0.0`, EasyAR Mega support package and Mega Studio `2.13.0`, XR device extension package `4000.0.1`, EasyAR Sense Native `4.9.0`, and EasyAR Mega WeChat Mini Program Plugin `2.0.3`. See `docs/OFFICIAL_DOCS_2026-07-01.md`.

Install:

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.38/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## Evidence-Weighted Progress

- Published scoped objective: 100% for the approved Image Tracking, CRS/Cloud Recognition, and Mega target.
- Mega Android evidence: device install, launch, EasyAR initialization, Mega Block load, and Mega localization/tracking log evidence were captured on 2026-06-12. A separate fresh Unity project pass now proves official package import, APK build, install/startup, EasyAR initialization, `Onsite` readiness, and real-device localization/tracking log signals in the selected mapped environment. A 2026-07-02 EasyAR Sense `4003.0.0` / Mega `2.13.0` pass now proves the current MegaBlockController workflow against ARMall `涂意工位测试专用` on Samsung `SM-S9010`, including package-name-matched Sense licensing, official XR dependency repair, ARCore camera startup, `CodexTest01` Block config, and user-confirmed successful localization. A PICO 4 Ultra Enterprise headset pass now proves APK build/install/startup, EasyAR Pico frame source, PICO VST camera startup, headset-visible passthrough, and Mega `Found` localization against the selected office block. An Android Motion Tracking pass now proves a clean camera-only sample build with UI/diagnostics hidden, ARCore camera input, EasyAR MotionTracker, and automatic Panda placement on horizontal plane hit.
- Local-key MVP public usability: about 98%

These percentages are evidence-weighted estimates. The published prerelease covers the three-sample local-key target: Image Tracking, CRS/Cloud Recognition, and Mega. The broader production official API goal remains incomplete.

## What Is Ready

- GitHub Release tarball distribution is working.
- `easyar-mcp` and `easyar-mcp-check` package binaries are available.
- Codex, Claude Desktop, and generic MCP client config generation are implemented.
- Client acceptance guidance is available through `docs/CLIENT_ACCEPTANCE.md` and `easyar://client/acceptance`.
- Fresh Unity project acceptance guidance is available through `docs/FRESH_PROJECT_ACCEPTANCE.md` and `easyar://acceptance/fresh-project`.
- Local-key onboarding is implemented without collecting EasyAR website passwords or secret keys in chat.
- Focused Image Tracking, CRS/Cloud Recognition, and Mega workflows are implemented or under active development.
- Safe committed Android evidence exists for the Image Tracking, CRS/Cloud Recognition, and Mega target scope.
- Mega real-device evidence includes APK install/startup, EasyAR Sense initialization, selected Mega Block load, and `[MLOC]` `kMapTracking` / `NCam_Verified results` signals. Fresh-project Mega evidence now also includes localization/tracking signals such as `successfully localized against ADF`. A 4003.0.0 / MegaBlockController Android pass now also covers the `涂意工位测试专用` cloud localization library. PICO 4 Ultra Enterprise evidence uses the documented headset path with `PicoFrameSource` and `LocationInputMode=Onsite`; any EasyAR Simulator diagnostics caution indicates the scene still needs to be switched to Onsite and rebuilt.
- Unity project programming assistance exists for focused preflight, scene audit, run sequence, device validation, log analysis, C# planning, script writing, review, and handoff artifacts.
- WeChat Mini Program support now includes focused sample metadata for `wechat-mega` and `wechat-crs`, project inspection, WeChat Developer Tools CLI detection, local config forms, user-downloaded official package import, DevTools smoke checks, log analysis, preflight reports, run sequences, real-device validation checklists, run results, completion reports, Mini Program scope status, resource `easyar://samples/wechat-miniprogram`, and acceptance resource `easyar://acceptance/wechat-miniprogram`.

## Active Scope

Current target samples:

- Image Tracking
- CRS/Cloud Recognition
- Mega

Out of scope for the current goal:

- Hello AR
- Surface Tracking
- Additional official EasyAR Sense Unity Plugin samples

Additional Mini Program samples beyond `wechat-mega` and `wechat-crs` are out of scope until requested.

## Known Remaining Work

- Keep Image Tracking, CRS/Cloud Recognition, and Mega evidence, fresh project acceptance docs, and release smoke tests aligned with the latest GitHub Release.
- Decide npm publishing policy for prerelease versus production release.
- Keep Image Tracking, CRS/Cloud Recognition, Mega, and Motion Tracking evidence current when supported Unity versions or target platforms expand.
- Continue hardening Unity programming workflows with more real project cases.
- Capture WeChat Developer Tools preview/upload and real-device evidence for `wechat-mega` and `wechat-crs` after official local sample packages, logged-in DevTools, and test Mini Program projects are available.
- Keep the 4003.0.0 / MegaBlockController Android evidence current when the official Mega package or ARMall cloud localization materials change.

## Safety Boundary

The current release uses the local-key MVP path:

1. Users register, log in, download official packages, and create keys on the official EasyAR website in their own browser.
2. Users install the official EasyAR Sense Unity Plugin.
3. Users fill license and Cloud Recognition fields locally in the Unity project.
4. MCP validates only redacted presence and guides Unity automation.

MCP must not ask users to paste EasyAR website passwords, verification codes, license keys, Cloud Recognition API Key/API Secret, `appKey`, or `appSecret` into chat.

## Best Next Actions

1. Keep the GitHub Release tarball and docs aligned with every public prerelease.
2. Test a fresh Codex and Claude Desktop setup using `docs/CLIENT_ACCEPTANCE.md` and `docs/FRESH_PROJECT_ACCEPTANCE.md`.
3. Run another clean install/build/device pass for Image Tracking, CRS/Cloud Recognition, and Mega when the Unity project changes.
4. Decide whether npm publication is needed for this scoped local-key MVP.
