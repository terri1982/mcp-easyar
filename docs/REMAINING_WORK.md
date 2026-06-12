# mcp-easyar Remaining Work

This page gives Codex, Claude Desktop, and other MCP clients a stable, non-secret view of what remains for the current focused release target.

## Current Scope

The current user-approved target is limited to:

- Image Tracking
- CRS/Cloud Recognition
- Mega

Hello AR, Surface Tracking, and other EasyAR Sense Unity Plugin samples are out of scope for the current release target until the user explicitly asks to continue.

## Current Evidence

- Current public prerelease: `v0.1.0-local-key.35`
- Published scoped objective: 100% for the approved Image Tracking and CRS/Cloud Recognition target.
- Active Mega expansion: Android APK install/startup and Mega localization/tracking evidence exists in the current worktree; a separate fresh Unity project pass now proves official package import, APK build, install/startup, EasyAR initialization, Onsite-mode readiness, and real-device localization/tracking log signals.
- Local-key MVP public usability: about 95%
- Android real-device evidence exists for Image Tracking and CRS/Cloud Recognition, including a refreshed CRS recognition screenshot and device log from 2026-06-11.
- GitHub Release tarball install smoke passes, including Codex and Claude Desktop `package-bin` client setup checks.
- Fresh Unity project acceptance guidance exists in `docs/FRESH_PROJECT_ACCEPTANCE.md` and `easyar://acceptance/fresh-project`.
- `npx -y mcp-easyar` is reserved for a future npm publish; the current public prerelease install path is the GitHub Release tarball.
- Security checks pass without committed local config secrets, runtime secrets, APKs, Unity packages, or obvious secret-like values.

## Remaining For Current Scoped Target

- Keep release links, status docs, fresh project acceptance guidance, install checks, and GitHub Release smoke tests aligned with each new prerelease.
- Re-run Image Tracking, CRS/Cloud Recognition, and Mega device evidence when the Unity project, EasyAR Sense Unity Plugin version, supported Unity version, or target platform changes.
- Continue hardening Unity programming workflows with real Image Tracking and CRS project cases.

## Not Required For Current Scoped Target

- Running Hello AR, Surface Tracking, or other EasyAR samples.
- Collecting EasyAR website passwords, verification codes, license keys, CRS API KEY/API Secret, `appKey`, or `appSecret` in chat.
- Calling real EasyAR official account APIs for automated license/download/cloud credential discovery.
- Publishing to npm as a production release.
- Using `npx -y mcp-easyar` before the npm package exists.

## Remaining For Full Production Goal

- EasyAR-owned account status endpoint.
- EasyAR-owned license validation endpoint.
- EasyAR-owned downloads entitlement endpoint.
- EasyAR-owned CRS/Cloud Recognition credential metadata endpoint that returns presence flags and metadata without raw secrets.
- Production token issuance and verification policy for registered EasyAR users.
- Strict production release gate using real official API evidence.

## Best Next MCP Calls

For a new user or fresh client setup:

```text
easyar_server_status
easyar_check_client_setup client=codex entrypointMode=package-bin includeTokenPlaceholder=false
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_account_onboarding accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_generate_sample_plan sampleId=mega platform=android unityVersion=2022.3.62f3
```

Also read MCP resource `easyar://acceptance/fresh-project`.

For a Unity project:

```text
easyar_write_project_handoff projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_remaining_work_report projectPath=/path/to/UnityProject platform=android verificationEvidence=passed
easyar_write_focused_scope_status projectPath=/path/to/UnityProject platform=android
```

## Safety Boundary

The current release follows the local-key MVP route. Users register, log in, download official packages, create license/CRS keys, and fill local Unity project config in their own browser and filesystem. MCP reports only redacted presence, status, artifact paths, and next actions.
