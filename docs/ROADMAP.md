# mcp-easyar Roadmap

This roadmap tracks the gap between the current local-key MVP and the full EasyAR MCP service goal.

## Current State

Status: local-key MVP published as GitHub prerelease `v0.1.0-local-key.11`.

The current release can be installed from GitHub Releases:

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.11/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## Completed

- Repository, package name, README, license, security policy, and EasyAR icon are in place.
- GitHub Release tarball distribution is working.
- Codex, Claude Desktop, and generic MCP client config generation are implemented.
- Install checks, package smoke tests, GitHub Release install smoke tests, and security checks are implemented.
- Local-key onboarding is implemented: users register, log in, download, and create keys on the official EasyAR website in their own browser.
- MCP guides local Unity configuration without collecting website passwords, verification codes, account tokens, license keys, API keys, `appKey`, or `appSecret` in chat.
- Focused Image Tracking and Cloud Recognition workflows are implemented and have safe committed Android evidence.
- Unity project programming assistance exists for focused sample preflight, scene audit, run sequence, device validation, log collection, C# planning, script writing, and handoff artifacts.

## Active Scope

The active sample scope remains intentionally focused:

- Image Tracking
- Cloud Recognition

Other EasyAR samples remain deferred until explicitly resumed.

## Remaining For Full Goal

### More Samples

Run through, document, and verify additional EasyAR samples after the focused scope is accepted:

- Hello AR
- Surface Tracking
- Additional EasyAR Sense Unity samples exposed by the official plugin package

Each added sample should include project preflight, sample import guidance, build/run sequencing, device validation checklist, safe run evidence, and release gate coverage.

### Production Official API Integration

The local-key MVP does not require official EasyAR account APIs. Production automation still needs official service support or an approved internal API contract for:

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
- Add repeatable evidence for each supported platform and sample.
- Prefer real-device evidence for AR success; emulators can verify install/startup but cannot prove camera-based tracking success.

## Safety Rules

- Do not ask users to paste EasyAR website passwords, verification codes, license keys, API keys, `appKey`, or `appSecret` into chat.
- Do not commit `ProjectSettings/EasyAR/easyar.local.json`, runtime secret copies, APKs, Unity packages, signing keys, or local logs with credentials.
- Do not bypass EasyAR login, license checks, download authorization, enterprise gates, or rate limits.

## Next Best Actions

1. Keep local-key MVP docs and release smoke tests aligned with the latest GitHub Release.
2. Add a repeatable acceptance checklist for the next sample only when the user explicitly resumes broader sample coverage.
3. Define and validate official EasyAR API contracts before enabling production account automation.
4. Decide whether npm publication should wait for production official API readiness or ship as a clearly marked prerelease.
