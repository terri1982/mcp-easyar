# mcp-easyar Full Goal Plan

This plan keeps the original long-term goal visible while preserving the current released scope.

Current public release: `v0.1.0-local-key.28`

## Goal

Help registered EasyAR users use Codex, Claude, and other MCP clients to:

- install and configure `mcp-easyar`
- complete official EasyAR account and local-key setup safely
- build and run EasyAR Unity samples
- receive Unity project programming assistance during EasyAR development

## Completed Release Slice

The current local-key MVP is complete for the approved focused target:

- Image Tracking
- CRS/Cloud Recognition

Evidence:

- GitHub Release tarball install smoke passes.
- Android real-device evidence exists for both focused samples.
- `easyar://acceptance/fresh-project` defines the fresh Unity project acceptance path.
- `easyar://workflow/programming` defines the safe Unity programming workflow.
- The production gate still reports `Production ready: no` until real official EasyAR account APIs are connected.

## Expansion Track 1: More EasyAR Samples

Purpose: expand from the current two verified samples to more official EasyAR Unity samples without weakening evidence requirements.

Entry criteria for each new sample:

- The user explicitly asks to continue that sample family.
- The official EasyAR Sense Unity Plugin version and Unity version are recorded.
- Local license/API prerequisites are known and documented.
- The sample has an import checklist, preflight, run sequence, device validation checklist, run result, completion report, and support bundle.

Acceptance criteria for each new sample:

- Unity import succeeds from official package materials.
- Compile check passes.
- Android or iOS build succeeds.
- Real-device validation proves the AR behavior that the sample is meant to demonstrate.
- No account passwords, license keys, Cloud Recognition secrets, signing keys, APKs, Unity packages, or raw private logs are committed.

Candidate order:

1. Hello AR: camera permission, ARSession startup, license/config baseline.
2. Surface Tracking: device tracking and placement behavior on a real device.
3. Additional EasyAR Sense Unity Plugin samples after their prerequisites and pass criteria are documented.

## Expansion Track 2: Official API Production Integration

Purpose: move from browser handoff plus local keys to official account-scoped automation for registered EasyAR users.

Required EasyAR-owned services:

- account status endpoint
- license validation endpoint
- download entitlement/package discovery endpoint
- CRS/Cloud Recognition credential metadata endpoint that returns metadata and presence flags without raw secrets
- token issuing, rotation, validation, and revocation policy for MCP clients

Acceptance criteria:

- `npm run official-api:canary` passes against staging or production EasyAR services.
- `easyar_production_validation` reports `Production ready: yes`.
- Production release gate passes with `EASYAR_RELEASE_REQUIRE_PRODUCTION_READY=1`.
- The integration never scrapes website passwords, browser cookies, verification codes, or private page data as an authorization mechanism.

## Expansion Track 3: Unity Programming Service

Purpose: make `mcp-easyar` useful throughout EasyAR Unity project development, not only sample bring-up.

Current base:

- focused preflight
- config integration audit
- programming context
- code plan
- C# script creation and review
- compile/build/device result reporting
- handoff packs for Codex, Claude, and humans

Next hardening steps:

- Add more real project cases for Image Tracking and CRS.
- Add sample-specific programming playbooks as more samples become verified.
- Keep generated code secret-free and scoped to explicit project goals.
- Require compile or device evidence before marking code changes complete.

## Release Policy

GitHub prereleases may continue using `gate=local-key-mvp` while the project is clearly labeled as local-key MVP.

Production npm publishing should wait until one of these is true:

- official EasyAR account APIs are connected and the strict production gate passes
- an explicit prerelease npm policy is approved and the package is labeled as local-key-only

## Safety Boundary

`mcp-easyar` must guide authorized EasyAR workflows. It must not bypass EasyAR account login, license checks, download authorization, enterprise gates, rate limits, or secret handling rules.
