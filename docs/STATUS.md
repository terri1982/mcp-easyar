# mcp-easyar Current Status

This status page summarizes the current evidence-backed state of `mcp-easyar`.

It is not a completion claim for the full EasyAR MCP service goal. The full goal remains open until more EasyAR samples and production official API automation are verified.

## Current Release

Current GitHub prerelease: `v0.1.0-local-key.16`

Install:

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.16/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## Evidence-Weighted Progress

- Full objective: about 66%
- Local-key MVP public usability: about 88%

These percentages are evidence-weighted estimates. They are based on published package checks, focused sample evidence, client setup coverage, and known remaining blockers.

## What Is Ready

- GitHub Release tarball distribution is working.
- `easyar-mcp` and `easyar-mcp-check` package binaries are available.
- Codex, Claude Desktop, and generic MCP client config generation are implemented.
- Client acceptance guidance is available through `docs/CLIENT_ACCEPTANCE.md` and `easyar://client/acceptance`.
- Local-key onboarding is implemented without collecting EasyAR website passwords or secret keys in chat.
- Focused Image Tracking and Cloud Recognition workflows are implemented.
- Safe committed Android evidence exists for the focused Image Tracking and Cloud Recognition scope.
- Unity project programming assistance exists for focused preflight, scene audit, run sequence, device validation, log analysis, C# planning, script writing, review, and handoff artifacts.
- Sample expansion criteria are documented in `docs/SAMPLE_EXPANSION.md` and `easyar://workflow/sample-expansion`.

## Active Scope

Currently focused samples:

- Image Tracking
- Cloud Recognition

Deferred until the project owner resumes broader sample coverage:

- Hello AR
- Surface Tracking
- Additional official EasyAR Sense Unity Plugin samples

## Known Remaining Work

- Run through and verify additional official EasyAR samples.
- Connect production official EasyAR APIs for account status, license validation, download entitlement, and Cloud Recognition credential discovery.
- Decide npm publishing policy for prerelease versus production release.
- Add more real-device and platform evidence if supported Unity versions or target platforms expand.
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
2. If the next priority is more samples, pick exactly one deferred sample and apply `docs/SAMPLE_EXPANSION.md`.
3. If the next priority is production automation, complete the official EasyAR API contract and staging endpoint validation.
4. If the next priority is user adoption, test a fresh Codex and Claude Desktop setup using `docs/CLIENT_ACCEPTANCE.md`.
