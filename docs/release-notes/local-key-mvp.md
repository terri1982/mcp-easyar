# mcp-easyar local-key MVP

This prerelease is the current GitHub distribution path for `mcp-easyar`.

## What Works Now

- Installs from the GitHub Release tarball with `npm install -g`.
- Exposes the `easyar-mcp` and `easyar-mcp-check` package binaries.
- Connects Codex, Claude, and other stdio MCP clients to EasyAR Unity workflow tools.
- Guides first-time or registered EasyAR users through browser-only registration/login/download/key setup.
- Keeps EasyAR website passwords, verification codes, account tokens, license keys, API KEY/API Secret, appKey, and appSecret out of chat.
- Supports the scoped Unity sample run-through target:
  - Image Tracking
  - CRS/Cloud Recognition
- Includes committed safe Android release evidence for the focused scope.
- Prompts for Image Tracking, CRS/Cloud Recognition, and focused close-out now tell clients to read `easyar://acceptance/fresh-project` first.
- Server status, quickstart, install guide, and generated client setup now point fresh users to the same fresh project acceptance resource before Unity automation.
- Provides Unity project assistance tools for local config, preflight, import guidance, build/run sequencing, log diagnostics, C# planning, script writing, and support bundles.

## Install

Use Node.js 20 or newer:

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.26/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

Then configure the MCP client with command:

```bash
easyar-mcp
```

More detail: `docs/install-from-github-release.md`.

## First MCP Calls

```text
easyar_server_status
easyar_authorization_strategy preferredMode=auto sampleId=cloud-recognition platform=android
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_write_local_config_handoff projectPath=/path/to/UnityProject accountStage=logged-in sampleId=cloud-recognition platform=android
easyar_validate_local_config projectPath=/path/to/UnityProject sampleId=cloud-recognition
easyar_next_workflow_step projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
```

For Image Tracking, switch `sampleId` to `image-tracking`.

## Local-Key Boundary

This release intentionally uses the local-key MVP path:

1. The user registers/logs in/downloads/creates keys on the official EasyAR website in a browser.
2. The user installs the official EasyAR Sense Unity Plugin.
3. The user fills EasyAR license and Cloud Recognition fields locally in the Unity project.
4. MCP validates only redacted local presence and guides Unity automation.

Website login is not needed at Unity runtime after the official plugin and local keys are configured.

## Not Included Yet

- Official EasyAR account/license/download/cloud entitlement APIs are not connected yet.
- npm registry publishing is not enabled yet.
- Hello AR, Surface Tracking, and other samples are out of scope for this release target.
- This release does not bypass EasyAR login, license checks, download authorization, enterprise gates, or rate limits.

## Verification

The release gate requires:

- TypeScript typecheck
- MCP smoke tests
- package-bin install check
- package install smoke test
- npm pack dry run
- repository security check
- local-key MVP evidence for Image Tracking and CRS/Cloud Recognition

Additional published-asset check:

```bash
npm run github-release:smoke
```

Current readiness model:

- Local-key MVP ready: yes
- Production official API ready: no
