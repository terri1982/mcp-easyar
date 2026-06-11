# EasyAR Sample Expansion Guide

This guide defines the acceptance bar for adding another EasyAR Unity sample to `mcp-easyar`.

The current active scope remains:

- Image Tracking
- Cloud Recognition

Do not mark another sample as focused until the user explicitly resumes broader sample coverage and the sample has verified evidence.

## Candidate Samples

Known deferred candidates:

- Hello AR
- Surface Tracking
- Additional official EasyAR Sense Unity Plugin samples discovered from the installed package

## Expansion Requirements

Each added sample needs these artifacts before it can be treated as supported:

- Sample catalog entry with scene hints, required capabilities, setup notes, and clear focused/deferred status.
- Official sample import guidance from EasyAR Unity Plugin `Samples~` or official download materials.
- Local config requirements, including whether the sample needs only an EasyAR license key or also Cloud Recognition fields.
- Unity preflight covering account materials, local config, Unity executable, imported scenes, Build Settings, platform settings, and script review.
- Scene audit that can identify the imported sample scene without relying only on exact file names.
- Run sequence for compile, build, install, start, and device validation.
- Device validation checklist with pass criteria that a human or AI tool can follow.
- Redacted run result and completion report evidence.
- Release gate coverage when the sample becomes part of the published support scope.

## Evidence Standard

A sample is not considered run through until all of the following are true:

- `PREFLIGHT.md` exists and reports no blocking setup issues for the selected platform.
- Unity compile check has passed after any generated C# changes.
- A platform build has completed for the selected device target.
- A real device run has been attempted for camera-based AR validation.
- `RUN_RESULT.md` records the observed result without secrets, local credential values, APK uploads, or private logs.
- `COMPLETION_REPORT.md` marks the sample complete only when device validation evidence supports success.
- Focused-scope or expanded-scope release evidence includes the sample in a safe committed summary.

Emulators may be used for install/start smoke checks, but they do not prove camera tracking success.

## Security Standard

Never commit or print:

- EasyAR website passwords or verification codes
- EasyAR license keys
- Cloud Recognition AppId/API Key/API Secret, `appKey`, or `appSecret`
- `ProjectSettings/EasyAR/easyar.local.json`
- runtime secret copies under `Assets/StreamingAssets`
- APKs, Unity packages, signing keys, provisioning profiles, or private device logs

MCP may guide the user to the official EasyAR website, but it must not bypass EasyAR login, license checks, download authorization, enterprise gates, or rate limits.

## Recommended Expansion Flow

1. Keep the target sample deferred while investigating.
2. Use `easyar_list_samples` and project inspection tools to identify official scene and asset names.
3. Add or update the sample catalog entry.
4. Add sample-specific import guidance and readiness checks.
5. Generate preflight, scene audit, run sequence, support bundle, and device validation artifacts.
6. Build and run on a real device.
7. Record only redacted evidence.
8. Update release evidence and release gate coverage.
9. Move the sample from deferred to focused only after the evidence is committed and checks pass.

## Current Next Sample Policy

The next sample should be selected by the project owner. Until then, keep Hello AR, Surface Tracking, and other samples deferred and keep public release notes explicit about the focused Image Tracking and Cloud Recognition scope.
