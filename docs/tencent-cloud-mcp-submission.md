# Tencent Cloud MCP Submission

This document collects public, non-secret material for submitting `mcp-easyar` to Tencent Cloud Developer MCP.

## Basic

- Name: `mcp-easyar`
- Display name: mcp-easyar
- Chinese display name: EasyAR MCP 服务
- Category: Developer Tools / 开发者工具
- Tags: `EasyAR`, `Unity`, `AR`, `Image Tracking`, `Cloud Recognition`, `MCP`, `Codex`, `Claude`
- License: Apache-2.0
- Repository: https://github.com/terri1982/mcp-easyar
- Homepage: https://github.com/terri1982/mcp-easyar#readme
- Chinese README: https://github.com/terri1982/mcp-easyar/blob/main/README.zh-CN.md
- Release: https://github.com/terri1982/mcp-easyar/releases/tag/v0.1.0-local-key.33
- Release tarball: https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.33/mcp-easyar-0.1.0.tgz
- Logo: `assets/easyar-icon.png`

## Short Description

Helps registered EasyAR users build and validate EasyAR Unity Image Tracking and Cloud Recognition samples with AI coding tools.

## Chinese Short Description

帮助 EasyAR 注册用户通过 Codex、Claude 等 AI 工具，快速配置、构建和验证 EasyAR Unity 的图像跟踪与 CRS / Cloud Recognition Sample。

## Long Description

`mcp-easyar` is a Model Context Protocol server for authorized EasyAR Unity workflows. The current local-key MVP guides users through official EasyAR website registration/login/download/key creation in their own browser, then helps local Unity projects inspect configuration, generate runbooks, validate Image Tracking and CRS / Cloud Recognition readiness, and produce redacted support artifacts.

The server does not ask users for EasyAR website passwords, verification codes, license keys, Cloud Recognition API secrets, or `EASYAR_API_TOKEN`. Users install the official EasyAR Sense Unity Plugin and fill local Unity config on their own machine.

## Chinese Long Description

`mcp-easyar` 是面向 EasyAR Unity 授权开发流程的 MCP 服务。当前 local-key MVP 只覆盖两个已验证目标：Image Tracking 和 CRS / Cloud Recognition。用户在自己的浏览器里完成 EasyAR 官网注册、登录、插件下载和 key 创建；MCP 负责引导 Unity 本地配置、检查工程状态、生成运行清单、验证构建准备情况，并生成已脱敏的排查材料。

该服务不收集 EasyAR 官网密码、验证码、license key、Cloud Recognition API Secret、appSecret 或 `EASYAR_API_TOKEN`。用户需要自行安装官方 EasyAR Sense Unity Plugin，并在本机 Unity 工程中填写本地配置。

## Install

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.33/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## MCP Command

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

## First Calls

```text
easyar_server_status
easyar_check_client_setup client=codex entrypointMode=package-bin includeTokenPlaceholder=false
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_account_onboarding accountStage=not-registered sampleId=cloud-recognition platform=android
```

## Security Notes

- Do not ask users to provide `EASYAR_API_TOKEN`.
- Do not collect EasyAR website passwords or verification codes.
- Do not collect license keys, Cloud Recognition API KEY/API Secret, `appKey`, or `appSecret` in chat.
- Local Unity credentials stay in `ProjectSettings/EasyAR/easyar.local.json` or local environment variables.
- Generated reports redact common token, key, password, license, and secret fields.

## Current Scope

- Ready: Image Tracking local-key workflow.
- Ready: CRS / Cloud Recognition local-key workflow.
- Deferred: Hello AR, Surface Tracking, and other EasyAR official samples.
- Unity baseline: 2022.3.62f3.

