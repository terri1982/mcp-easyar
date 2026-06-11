# mcp-easyar Client Setup

Use this guide when connecting Codex, Claude Desktop, or another stdio MCP client to `mcp-easyar`.

## Install Profiles

### Local repository

Use this while developing or testing the repository directly.

```bash
npm install
npm run build
npm run install:check
```

MCP launch:

```json
{
  "mcpServers": {
    "easyar": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-easyar/dist/index.js"],
      "env": {
        "EASYAR_API_BASE_URL": "https://www.easyar.cn"
      }
    }
  }
}
```

Generate a local config snippet:

```text
easyar_generate_client_config client=claude-desktop entrypointMode=local-dist serverPath=/absolute/path/to/mcp-easyar/dist/index.js
easyar_check_client_setup client=claude-desktop entrypointMode=local-dist serverPath=/absolute/path/to/mcp-easyar/dist/index.js
```

### GitHub Release package

Use this for the current local-key MVP GitHub Release. This installs the package binary without waiting for npm registry publishing.

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.20/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

Claude Desktop MCP launch:

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

Codex MCP launch uses the same stdio shape:

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

Generate a package-bin config snippet:

```text
easyar_generate_client_config client=claude-desktop entrypointMode=package-bin
easyar_generate_client_config client=codex entrypointMode=package-bin includeTokenPlaceholder=false
easyar_check_client_setup client=claude-desktop entrypointMode=package-bin
```

### Global npm package after npm publish

Use this after the package is published to npm.

```bash
npm install -g mcp-easyar
easyar-mcp-check
```

After installation, use the same `package-bin` MCP launch config shown above.

### npx package after npm publish

Use this after `mcp-easyar` is published to npm, when the client machine can reach the npm registry and you do not want a global install. For the current GitHub prerelease, use the GitHub Release package profile above.

```bash
npx -y mcp-easyar
```

MCP launch:

```json
{
  "mcpServers": {
    "easyar": {
      "command": "npx",
      "args": ["-y", "mcp-easyar"],
      "env": {
        "EASYAR_API_BASE_URL": "https://www.easyar.cn"
      }
    }
  }
}
```

Generate an npx config snippet:

```text
easyar_generate_client_config client=codex entrypointMode=npx includeTokenPlaceholder=false
easyar_check_client_setup client=codex entrypointMode=npx includeTokenPlaceholder=false
```

## Secret Handling

Keep real EasyAR values in the MCP client environment, OS keychain, deployment secret store, or local ignored project config.

Never paste these values into chat, GitHub issues, committed files, or generated support artifacts:

- EasyAR website passwords
- verification codes
- `EASYAR_API_TOKEN`
- EasyAR license keys
- Cloud Recognition API Key/API Secret
- legacy `appKey`/`appSecret`
- mobile signing keys or provisioning files

The install check and client setup tools report only presence, entrypoint shape, resource readability, and next actions.

## First Smoke Calls

After the client starts the server, call:

```text
easyar_server_status
easyar_auth_status
easyar_release_manifest
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_write_client_setup outputRoot=/path/to/report-folder client=claude-desktop entrypointMode=package-bin
```

Then follow the generated `CLIENT_SETUP.md`, `FIRST_RUN.md`, and `PREFLIGHT.md` artifacts before asking the client to run Unity automation.

## Troubleshooting

- If `tools/list` is empty, restart the MCP client and verify that the JSON is nested under `mcpServers.easyar`.
- If `local-dist` fails, rerun `npm install && npm run build` and use an absolute `dist/index.js` path.
- If `package-bin` fails, run `easyar-mcp-check` in the same shell environment used by the MCP client.
- If `npx` fails after npm publishing, verify npm registry/network access and run `npx -y mcp-easyar` in a terminal. Before npm publishing, use the GitHub Release package profile instead.
- If official account tools return `configured=false`, set the official endpoint env vars and `EASYAR_API_TOKEN` in the MCP client environment.
