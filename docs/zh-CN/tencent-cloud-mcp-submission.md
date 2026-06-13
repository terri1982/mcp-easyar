# 腾讯云 MCP 提交材料

本文档整理提交 `mcp-easyar` 到腾讯云开发者 MCP 所需的公开、非敏感材料。

## 基础信息

- 名称：`mcp-easyar`
- 展示名称：mcp-easyar
- 中文展示名称：EasyAR MCP 服务
- 分类：开发者工具 / Developer Tools
- 标签：`EasyAR`、`Unity`、`AR`、`Image Tracking`、`Cloud Recognition`、`Mega`、`MCP`、`Codex`、`Claude`
- License：Apache-2.0
- 仓库：https://github.com/terri1982/mcp-easyar
- 主页：https://github.com/terri1982/mcp-easyar#readme
- 英文 README：https://github.com/terri1982/mcp-easyar/blob/main/README.en.md
- Release：https://github.com/terri1982/mcp-easyar/releases/tag/v0.1.0-local-key.37
- Release tarball：https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.37/mcp-easyar-0.1.0.tgz
- Logo：`assets/easyar-icon.png`

## 简短描述

帮助 EasyAR 注册用户通过 Codex、Claude 等 AI 工具，快速配置、构建和验证 EasyAR Unity 的图像跟踪、CRS / Cloud Recognition 与 Mega Sample。

## Long Description

`mcp-easyar` is a Model Context Protocol server for authorized EasyAR Unity workflows. The current local-key MVP guides users through official EasyAR website registration/login/download/key creation in their own browser, then helps local Unity projects inspect configuration, generate runbooks, validate Image Tracking, CRS / Cloud Recognition, and Mega readiness, and produce redacted support artifacts.

The server does not ask users for EasyAR website passwords, verification codes, license keys, Cloud Recognition API secrets, or `EASYAR_API_TOKEN`. Users install the official EasyAR Sense Unity Plugin and fill local Unity config on their own machine.

## 详细描述

`mcp-easyar` 是面向 EasyAR Unity 授权开发流程的 MCP 服务。当前 local-key MVP 已覆盖 Image Tracking、CRS / Cloud Recognition，并已扩展 Mega Sample 的本地配置、构建、真机启动和验证引导。用户在自己的浏览器里完成 EasyAR 官网注册、登录、插件下载和 key 创建；MCP 负责引导 Unity 本地配置、检查工程状态、生成运行清单、验证构建准备情况，并生成已脱敏的排查材料。

该服务不收集 EasyAR 官网密码、验证码、license key、Cloud Recognition API Secret、appSecret 或 `EASYAR_API_TOKEN`。用户需要自行安装官方 EasyAR Sense Unity Plugin，并在本机 Unity 工程中填写本地配置。

## 安装

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.37/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## MCP Server Configuration

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

普通 local-key 用户不要填写 `EASYAR_API_TOKEN`。用户自己在 EasyAR 官网完成注册、登录、下载、license / CRS key / Mega 云定位材料查找，并填写到本机 Unity 工程。

## 推荐首次调用

```text
easyar_server_status
easyar_check_client_setup client=codex entrypointMode=package-bin includeTokenPlaceholder=false
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_account_onboarding accountStage=not-registered sampleId=cloud-recognition platform=android
```

## 安全说明

- 不要求用户提供 `EASYAR_API_TOKEN`。
- 不收集 EasyAR 官网密码或验证码。
- 不在聊天里收集 license key、Cloud Recognition API KEY/API Secret、`appKey` 或 `appSecret`。
- 本地 Unity 凭据保存在 `ProjectSettings/EasyAR/easyar.local.json` 或本地环境变量中。
- 生成报告会脱敏常见 token、key、password、license 和 secret 字段。

## 当前范围

- 已验证：Image Tracking local-key workflow。
- 已验证：CRS / Cloud Recognition local-key workflow。
- 已验证：Mega Android 手机 Onsite 路径。
- 已验证：Mega PICO 4 Ultra Enterprise 眼镜路径，使用 `PicoFrameSource` 和 `LocationInputMode=Simulator`。
- 暂缓：Hello AR、Surface Tracking 和其他 EasyAR 官方 Sample。
- Unity 基线：`2022.3.62f3`。
