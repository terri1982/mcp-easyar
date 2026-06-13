# mcp-easyar Current Status

This status page summarizes the current evidence-backed state of `mcp-easyar`.

It is not a completion claim for every EasyAR sample. The active goal now covers Image Tracking, CRS/Cloud Recognition, and Mega only.

## Current Release

Current GitHub prerelease: `v0.1.0-local-key.37`

Install:

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.37/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## Evidence-Weighted Progress

- Published scoped objective: 100% for the approved Image Tracking, CRS/Cloud Recognition, and Mega target.
- Mega Android evidence: device install, launch, EasyAR initialization, Mega Block load, and Mega localization/tracking log evidence were captured on 2026-06-12. A separate fresh Unity project pass now proves official package import, APK build, install/startup, EasyAR initialization, `Onsite` readiness, and real-device localization/tracking log signals in the selected mapped environment. A PICO 4 Ultra Enterprise headset pass now proves APK build/install/startup, EasyAR Pico frame source, PICO VST camera startup, headset-visible passthrough, and Mega `Found` localization against the selected office block.
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
- Mega real-device evidence includes APK install/startup, EasyAR Sense initialization, selected Mega Block load, and `[MLOC]` `kMapTracking` / `NCam_Verified results` signals. Fresh-project Mega evidence now also includes localization/tracking signals such as `successfully localized against ADF`. PICO 4 Ultra Enterprise evidence uses the documented headset path with `PicoFrameSource` and `LocationInputMode=Simulator`; the EasyAR Simulator diagnostics caution is expected because the headset does not expose an Android GPS provider.
- Unity project programming assistance exists for focused preflight, scene audit, run sequence, device validation, log analysis, C# planning, script writing, review, and handoff artifacts.

## Active Scope

Current target samples:

- Image Tracking
- CRS/Cloud Recognition
- Mega

Out of scope for the current goal:

- Hello AR
- Surface Tracking
- Additional official EasyAR Sense Unity Plugin samples

## Known Remaining Work

- Keep Image Tracking, CRS/Cloud Recognition, and Mega evidence, fresh project acceptance docs, and release smoke tests aligned with the latest GitHub Release.
- Decide npm publishing policy for prerelease versus production release.
- Keep Image Tracking, CRS/Cloud Recognition, and Mega evidence current when supported Unity versions or target platforms expand.
- Continue hardening Unity programming workflows with more real project cases.

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
