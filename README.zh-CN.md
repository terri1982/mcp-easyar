<p align="center">
  <img src="assets/easyar-icon.png" alt="EasyAR logo" width="96" height="96">
</p>

# mcp-easyar

[English](README.md) | 简体中文

`mcp-easyar` 帮助 EasyAR 注册用户通过 Codex、Claude 等 AI 工具，安全地完成 EasyAR Unity Sample 的配置、构建、真机验证和项目编程辅助。

当前公开版本是 local-key MVP：用户在 EasyAR 官网注册、登录、下载官方插件并创建本地 license / CRS key；MCP 只做引导、检查和 Unity 自动化，不接触官网密码、验证码、license key、API Secret 或 appSecret。

## 当前状态

- 当前 GitHub 预发布版：`v0.1.0-local-key.33`
- 当前已跑通并发布验证的 Sample：
  - Image Tracking
  - CRS / Cloud Recognition
- 暂缓目标：
  - Hello AR
  - Surface Tracking
  - 其他 EasyAR Sense Unity Plugin 官方 Sample
- Unity 验证基线：`2022.3.62f3`
- GitHub Release tarball、CI、安装 smoke、安全检查均已通过。

## 安装正版包

请从 GitHub Release 下载正版包：

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.33/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

安装检查通过后，把 MCP client 配到 `easyar-mcp` 这个 package binary 即可。

## 工具数量

`mcp-easyar` 默认使用 `core` 工具集，启用工具数约 57 个，低于常见 MCP 客户端 80 个工具的警告线。

如果维护仓库、调试官方 API 合同或需要全部工具，可以用 full profile：

```bash
MCP_EASYAR_TOOL_PROFILE=full easyar-mcp
```

日常给 Codex / Claude 使用时，建议保持默认 core profile。

## 推荐首次调用

```text
easyar_server_status
easyar_check_client_setup client=codex entrypointMode=package-bin includeTokenPlaceholder=false
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_account_onboarding accountStage=not-registered sampleId=cloud-recognition platform=android
```

同时阅读 MCP resource：

```text
easyar://acceptance/fresh-project
easyar://roadmap/full-goal
easyar://workflow/programming
```

## 本地 key 路线

当前版本走 local-key 路线：

1. 用户在浏览器里打开 EasyAR 官网并注册/登录。
2. 用户下载官方 EasyAR Sense Unity Plugin。
3. 用户在官网开发中心创建或找到 license。
4. CRS / Cloud Recognition 用户创建或找到 AppId、识别服务地址、API KEY、API Secret。
5. 用户在本机 Unity 工程里填写 `ProjectSettings/EasyAR/easyar.local.json`。
6. MCP 只检查字段是否存在、是否像占位符，不输出 secret。
7. Unity 构建和真机验证使用本地配置运行，不需要在运行时登录官网。

## 安全边界

不要把以下内容发到聊天、提交到 GitHub 或写进公开日志：

- EasyAR 官网密码
- 邮箱/手机验证码
- license key
- Cloud Recognition API KEY / API Secret
- appKey / appSecret
- signing key
- APK、Unity package、含密钥的本地日志

MCP 不应绕过 EasyAR 登录、license 检查、下载授权、企业权限或限流规则。

## 中文文档目录

- [中文文档索引](docs/zh-CN/README.md)
- [快速开始](docs/zh-CN/quickstart.md)
- [从 GitHub Release 安装](docs/zh-CN/install-from-github-release.md)
- [客户端配置](docs/zh-CN/client-setup.md)
- [新 Unity 项目验收](docs/zh-CN/FRESH_PROJECT_ACCEPTANCE.md)
- [当前状态](docs/zh-CN/STATUS.md)
- [剩余工作](docs/zh-CN/REMAINING_WORK.md)
- [完整目标计划](docs/zh-CN/FULL_GOAL_PLAN.md)
- [路线图](docs/zh-CN/ROADMAP.md)
- [问题排查](docs/zh-CN/troubleshooting.md)
- [客户端验收清单](docs/zh-CN/CLIENT_ACCEPTANCE.md)
- [Release Manifest](docs/zh-CN/RELEASE_MANIFEST.md)
- [local-key MVP 发布说明](docs/zh-CN/release-notes/local-key-mvp.md)
- [官方 API 合同](docs/zh-CN/OFFICIAL_API_CONTRACT.md)
- [官方 API 接入交接](docs/zh-CN/OFFICIAL_API_HANDOFF.md)

## 英文文档

- [新项目验收](docs/FRESH_PROJECT_ACCEPTANCE.md)
- [当前状态](docs/STATUS.md)
- [剩余工作](docs/REMAINING_WORK.md)
- [完整目标计划](docs/FULL_GOAL_PLAN.md)
- [从 GitHub Release 安装](docs/install-from-github-release.md)
- [客户端配置](docs/client-setup.md)

## 当前结论

Image Tracking 和 CRS / Cloud Recognition 的 local-key MVP 已经跑通并发布。后续扩展 Sample 时，先调用：

```text
easyar_generate_sample_expansion_plan sampleId=hello-ar platform=android unityVersion=2022.3.62f3
```

然后按生成的验收清单补 import、build、真机 evidence 和 completion report。
