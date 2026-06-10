# EasyAR Official MCP Server

[![CI](https://github.com/terri1982/mcp-easyar/actions/workflows/ci.yml/badge.svg)](https://github.com/terri1982/mcp-easyar/actions/workflows/ci.yml)

EasyAR Official MCP Server helps registered EasyAR users connect AI coding tools such as Codex and Claude to authorized EasyAR Unity workflows.

This MVP focuses on local Unity project assistance:

- inspect Unity project structure and EasyAR-related files
- list common EasyAR Unity sample categories
- generate an Editor runner script for opening sample scenes
- generate an Editor helper for adding sample scenes to Unity Build Settings
- prepare a Unity project with EasyAR local config templates and secret ignore rules
- generate Unity MonoBehaviour script templates for common EasyAR workflows
- write C# scripts safely inside a Unity project
- run a Unity static editor method in batch mode
- expose EasyAR workflow guidance as MCP resources

The server is intentionally built for official, authorized use. Production deployments should connect `EASYAR_API_BASE_URL` and `EASYAR_API_TOKEN` to EasyAR account/license APIs before serving private SDK downloads or account-scoped content.

This project must not be used to bypass EasyAR login, license checks, download authorization, enterprise gates, rate limits, or any other access control.

Official references used by this MVP:

- EasyAR sample apps: https://www.easyar.cn/doc/en/develop/samples.html
- EasyAR download page: https://www.easyar.com/view/download.html
- EasyAR download history: https://www.easyar.com/view/downloadHistory.html

## Install

```bash
npm install
npm run build
```

## Run

```bash
npm start
```

Optional environment variables:

```bash
EASYAR_API_BASE_URL=https://www.easyar.cn
EASYAR_API_TOKEN=your_registered_user_token
EASYAR_UNITY_PATH=/Applications/Unity/Hub/Editor/2022.3.62f1/Unity.app/Contents/MacOS/Unity
```

## Claude Desktop

```json
{
  "mcpServers": {
    "easyar": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-easyar/dist/index.js"],
      "env": {
        "EASYAR_API_BASE_URL": "https://www.easyar.cn",
        "EASYAR_API_TOKEN": "your_registered_user_token"
      }
    }
  }
}
```

## Codex

Use the same stdio command:

```bash
node /absolute/path/to/mcp-easyar/dist/index.js
```

## Local Development

```bash
npm install
npm run dev
```

Run checks:

```bash
npm run build
npm run typecheck
npm test
```

## Publish To GitHub

After authenticating GitHub CLI with your account:

```bash
gh auth login
gh repo create mcp-easyar --public --source=. --remote=origin --push
```

Use `--private` instead of `--public` if this repository should not be public yet.

## Tools

- `easyar_list_samples`: list supported sample categories.
- `easyar_official_info`: return official EasyAR links and currently documented package versions captured by this MCP server.
- `easyar_inspect_unity_project`: inspect a Unity project for package, asset, scene, and EasyAR signals.
- `easyar_generate_sample_plan`: create a practical setup/run plan for a sample.
- `easyar_prepare_unity_project`: create a sample runner, EasyAR local config template, and secret ignore rules in a Unity project.
- `easyar_create_build_settings_helper`: create `Assets/Editor/EasyARBuildSettingsHelper.cs` for Build Settings automation.
- `easyar_create_sample_runner`: create `Assets/Editor/EasyARSampleRunner.cs`.
- `easyar_create_mono_behaviour`: create a Unity C# MonoBehaviour template for EasyAR sample development.
- `easyar_write_csharp_file`: create or replace a `.cs` file inside a Unity project.
- `easyar_run_unity_method`: execute a Unity static editor method in batch mode.

## Resources

- `easyar://samples/catalog`
- `easyar://official/info`
- `easyar://unity/checklist`
