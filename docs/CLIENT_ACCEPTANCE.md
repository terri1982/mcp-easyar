# mcp-easyar Client Acceptance Checklist

Use this checklist after installing `mcp-easyar` from a GitHub Release tarball, npm package, local checkout, or npx profile.

The goal is to prove that Codex, Claude Desktop, or another stdio MCP client can start the server, list tools/resources, and reach the first EasyAR workflow calls without exposing secrets.

## Install Check

Run the package check from the same shell environment that the MCP client will use:

```bash
easyar-mcp-check
```

Expected result:

- `OK server-name`
- `OK tools`
- `OK prompts`
- `OK resources`
- `OK github-release-install`
- `OK local-key-release-notes`
- `OK roadmap`
- `OK focused-scope-workflow`

The check must not require EasyAR website passwords, license keys, Cloud Recognition API secrets, `appKey`, or `appSecret`.

## Package-Bin Client Config

Use package-bin mode after installing from GitHub Release or npm:

```text
easyar_generate_client_config client=codex entrypointMode=package-bin includeTokenPlaceholder=false
easyar_generate_client_config client=claude-desktop entrypointMode=package-bin includeTokenPlaceholder=false
easyar_check_client_setup client=codex entrypointMode=package-bin includeTokenPlaceholder=false
easyar_check_client_setup client=claude-desktop entrypointMode=package-bin includeTokenPlaceholder=false
```

Expected MCP command:

```json
{
  "command": "easyar-mcp",
  "args": []
}
```

## First Client Calls

After restarting the MCP client with the generated config, run:

```text
easyar_server_status
easyar_auth_status
easyar_release_manifest
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
```

Expected result:

- The server reports name `mcp-easyar`.
- Focused samples include `image-tracking` and `cloud-recognition`.
- Resources include `easyar://status/current`, `easyar://workflow/focused-scope`, and `easyar://workflow/programming`.
- `easyar_auth_status` reports secret presence only as booleans or redacted previews.

## Unity Project Handoff

For a Unity project, write a client setup artifact before Unity automation:

```text
easyar_write_client_setup outputRoot=/path/to/report-folder client=codex entrypointMode=package-bin
easyar_write_first_run_guide projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_write_local_config_handoff projectPath=/path/to/UnityProject accountStage=logged-in sampleId=cloud-recognition platform=android
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
```

Read `CLIENT_SETUP.md`, `FIRST_RUN.md`, `LOCAL_CONFIG_HANDOFF.md`, and `PREFLIGHT.md` before asking the client to run Unity batch commands.

## Failure Triage

- If `tools/list` is empty, restart the MCP client and verify the JSON is nested under `mcpServers.easyar`.
- If `easyar-mcp` is not found, reinstall the package or use an absolute `node dist/index.js` local-dist config.
- If `package-bin` works in Terminal but not in the client, align the client environment `PATH`.
- If official account tools report endpoint variables as missing, continue with local-key browser handoff unless production official APIs are intentionally configured.
- If Unity calls fail, run `easyar_write_unity_environment_report` and `easyar_write_focused_preflight` before changing project files.

## Security

Do not paste or commit EasyAR website passwords, verification codes, license keys, Cloud Recognition API Key/API Secret, `appKey`, `appSecret`, signing keys, APKs, Unity packages, or private logs.
