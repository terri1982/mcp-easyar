# mcp-easyar Current Status

This status page summarizes the current evidence-backed state of `mcp-easyar`.

It is not a completion claim for every EasyAR sample. The current goal has been narrowed to Image Tracking and CRS/Cloud Recognition only.

## Current Release

Current GitHub prerelease: `v0.1.0-local-key.26`

Install:

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.26/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## Evidence-Weighted Progress

- Current scoped objective: 100% for the approved Image Tracking and CRS/Cloud Recognition target.
- Local-key MVP public usability: about 95%

These percentages are evidence-weighted estimates. The scoped objective is complete for the currently approved two-sample target, while the broader production official API goal remains incomplete.

## What Is Ready

- GitHub Release tarball distribution is working.
- `easyar-mcp` and `easyar-mcp-check` package binaries are available.
- Codex, Claude Desktop, and generic MCP client config generation are implemented.
- Client acceptance guidance is available through `docs/CLIENT_ACCEPTANCE.md` and `easyar://client/acceptance`.
- Fresh Unity project acceptance guidance is available through `docs/FRESH_PROJECT_ACCEPTANCE.md` and `easyar://acceptance/fresh-project`.
- Local-key onboarding is implemented without collecting EasyAR website passwords or secret keys in chat.
- Focused Image Tracking and CRS/Cloud Recognition workflows are implemented.
- Safe committed Android evidence exists for the Image Tracking and CRS/Cloud Recognition target scope.
- Unity project programming assistance exists for focused preflight, scene audit, run sequence, device validation, log analysis, C# planning, script writing, review, and handoff artifacts.

## Active Scope

Current target samples:

- Image Tracking
- CRS/Cloud Recognition

Out of scope for the current goal:

- Hello AR
- Surface Tracking
- Additional official EasyAR Sense Unity Plugin samples

## Known Remaining Work

- Keep Image Tracking and CRS/Cloud Recognition evidence, fresh project acceptance docs, and release smoke tests aligned with the latest GitHub Release.
- Decide npm publishing policy for prerelease versus production release.
- Add more real-device and platform evidence if supported Unity versions or target platforms expand for the two target samples.
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
3. Run another clean install/build/device pass only for Image Tracking and CRS/Cloud Recognition when the Unity project changes.
4. Decide whether npm publication is needed for this scoped local-key MVP.
