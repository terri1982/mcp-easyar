# Install mcp-easyar From GitHub Release

This guide is for the current local-key MVP release path. It helps a registered or first-time EasyAR user connect Codex, Claude, or another MCP client to local Unity workflows without giving MCP the EasyAR website password.

Current target scope:

- Image Tracking
- CRS/Cloud Recognition

Out of scope for this release target:

- Hello AR
- Surface Tracking
- Other EasyAR samples

## 1. Install The Release Tarball

Use Node.js 20 or newer.

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.36/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

`easyar-mcp-check` should report `server-name`, focused scope, tools, prompts, and resources as OK. It does not need EasyAR secrets.

## 2. Configure The MCP Client

For package-bin mode, the MCP server command is:

```bash
easyar-mcp
```

For Claude Desktop:

```json
{
  "mcpServers": {
    "easyar": {
      "command": "easyar-mcp",
      "args": [],
      "env": {
        "EASYAR_API_BASE_URL": "https://www.easyar.cn"
      }
    }
  }
}
```

For Codex:

```json
{
  "mcpServers": {
    "easyar": {
      "command": "easyar-mcp",
      "args": [],
      "env": {
        "EASYAR_API_BASE_URL": "https://www.easyar.cn"
      }
    }
  }
}
```

Other stdio MCP clients should use the same command, args, and env shape.

Do not use `npx -y mcp-easyar` for this GitHub prerelease path unless the package has also been published to npm. The current public install route is the GitHub Release tarball plus `entrypointMode=package-bin`.

## 3. Start With Local-Key MVP

Call these MCP tools first:

```text
easyar_server_status
easyar_authorization_strategy preferredMode=auto sampleId=cloud-recognition platform=android
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
```

Also read MCP resource `easyar://acceptance/fresh-project` before running Unity setup.

The normal MVP mode is `local-key`.

The user completes these actions in the browser:

1. Register or log in at the official EasyAR website.
2. Download/install the official EasyAR Sense Unity Plugin.
3. Create or locate the EasyAR Sense license for the Unity package/bundle identifier.
4. For Cloud Recognition, create or locate AppId, Client-end Target Recognition URL, API KEY, and API Secret.
5. Return to the MCP client with only the account stage, such as `logged-in` or `has-cloud-credentials`.

MCP must not receive EasyAR website passwords, verification codes, raw account tokens, license keys, API KEY/API Secret, appKey, or appSecret in chat.

## 4. Prepare The Unity Project

Run the handoff writers:

```text
easyar_write_first_run_guide projectPath=/path/to/UnityProject accountStage=logged-in sampleId=cloud-recognition platform=android
easyar_write_local_config_handoff projectPath=/path/to/UnityProject accountStage=logged-in sampleId=cloud-recognition platform=android
easyar_write_local_config_form projectPath=/path/to/UnityProject accountStage=logged-in sampleId=cloud-recognition platform=android
easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
```

Fill `ProjectSettings/EasyAR/easyar.local.json` locally, or use environment-backed writing:

```text
easyar_write_local_config_from_env projectPath=/path/to/UnityProject sampleId=cloud-recognition
easyar_validate_local_config projectPath=/path/to/UnityProject sampleId=cloud-recognition
```

Validation reports only presence and placeholder problems. It does not print secret values.

## 5. Run The Focused Workflow

For Image Tracking:

```text
easyar_next_workflow_step projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_run_sequence projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
```

For Cloud Recognition:

```text
easyar_next_workflow_step projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_run_sequence projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
```

Continue only when `PREFLIGHT.md` shows the selected sample is ready. After a real device run, record evidence with:

```text
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=image-tracking platform=android overallStatus=passed
easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
```

Use `sampleId=cloud-recognition` for the Cloud Recognition run.

## 6. Troubleshooting

If the MCP client cannot start the server:

```bash
which easyar-mcp
easyar-mcp-check
```

If Unity automation is blocked:

```text
easyar_unity_environment projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_analyze_latest_unity_log projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_support_bundle projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
```

For Cloud Recognition, switch `sampleId` to `cloud-recognition`.

## Security Boundary

The local-key MVP does not prove remote account entitlement. It assumes the user obtained plugin and key materials through the official EasyAR website. Production account/license/download/cloud entitlement automation remains a separate official API track.

Do not bypass EasyAR login, license checks, download authorization, enterprise gates, or rate limits.
