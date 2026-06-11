# mcp-easyar Roadmap

This roadmap tracks the current scoped local-key MVP goal: Image Tracking and CRS/Cloud Recognition only.

## Current State

Status: local-key MVP published as GitHub prerelease `v0.1.0-local-key.22`.

The current release can be installed from GitHub Releases:

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.22/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## Completed

- Repository, package name, README, license, security policy, and EasyAR icon are in place.
- GitHub Release tarball distribution is working.
- Codex, Claude Desktop, and generic MCP client config generation are implemented.
- Install checks, package smoke tests, GitHub Release install smoke tests, and security checks are implemented.
- Local-key onboarding is implemented: users register, log in, download, and create keys on the official EasyAR website in their own browser.
- MCP guides local Unity configuration without collecting website passwords, verification codes, account tokens, license keys, API keys, `appKey`, or `appSecret` in chat.
- Focused Image Tracking and CRS/Cloud Recognition workflows are implemented and have safe committed Android evidence.
- Unity project programming assistance exists for focused sample preflight, scene audit, run sequence, device validation, log collection, C# planning, script writing, and handoff artifacts.

## Active Scope

The active sample target is intentionally limited to:

- Image Tracking
- CRS/Cloud Recognition

Hello AR, Surface Tracking, and other EasyAR samples are not part of the current goal.

## Remaining For Scoped Goal

### Target Samples

- Keep Image Tracking and CRS/Cloud Recognition release evidence aligned with every public prerelease.
- Keep install docs, client acceptance docs, and smoke tests aligned with the latest GitHub Release.
- Continue hardening Unity programming workflows using real Image Tracking and CRS project cases.

### Official API Integration

The scoped local-key MVP does not require official EasyAR account APIs. If production automation is later required, it still needs official service support or an approved internal API contract for:

- Account status
- License validation
- Download entitlement and package discovery
- Cloud Recognition credential discovery
- Real `EASYAR_API_TOKEN` issuing, rotation, validation, and revocation

Until those APIs exist, the safe path is browser handoff plus local Unity keys.

### Distribution

- Keep GitHub Release tarball distribution current for local-key MVP users.
- Publish to npm only after the production gate is intentionally enabled or a separate npm prerelease policy is approved.
- Keep release notes, install docs, `easyar-mcp-check`, and `npm run github-release:smoke` aligned with the latest published tag.

### Unity Coverage

- Keep the verified Unity baseline at Unity `2022.3.62f3` unless the supported version range is expanded.
- Add repeatable evidence for each supported platform and target sample.
- Prefer real-device evidence for AR success; emulators can verify install/startup but cannot prove camera-based tracking success.

## Safety Rules

- Do not ask users to paste EasyAR website passwords, verification codes, license keys, API keys, `appKey`, or `appSecret` into chat.
- Do not commit `ProjectSettings/EasyAR/easyar.local.json`, runtime secret copies, APKs, Unity packages, signing keys, or local logs with credentials.
- Do not bypass EasyAR login, license checks, download authorization, enterprise gates, or rate limits.

## Next Best Actions

1. Keep local-key MVP docs and release smoke tests aligned with the latest GitHub Release.
2. Keep client acceptance checks green for Codex and Claude.
3. Keep Unity programming support focused on Image Tracking and CRS/Cloud Recognition.
4. Decide whether npm publication should ship as a clearly marked local-key MVP or wait.
