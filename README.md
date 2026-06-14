<p align="center">
  <img src="assets/easyar-icon.png" alt="EasyAR logo" width="96" height="96">
</p>

# mcp-easyar

[English](README.en.md) | 简体中文

`mcp-easyar` 帮助 EasyAR 注册用户通过 Codex、Claude 等 AI 工具，安全地完成 EasyAR Unity Sample 的配置、构建、真机验证和项目编程辅助。

当前公开版本是 local-key MVP：用户在 EasyAR 官网注册、登录、下载官方插件并创建本地 license / CRS key；MCP 只做引导、检查和 Unity 自动化，不接触官网密码、验证码、license key、API Secret 或 appSecret。

当前工作树开始增加微信小程序 Sample 支持：先覆盖 `wechat-mega` 和 `wechat-crs`，提供项目结构检查、微信开发者工具 CLI 检测、本地配置表、官方本地包导入、DevTools 检查、日志分析、preflight、run sequence、真机验证清单、run result、completion report 和小程序 scope status。小程序路径仍走官方网页/官方工具 handoff，不自动登录、不绕过下载授权、不在聊天里收集密钥。

## 当前状态

- 当前 GitHub 预发布版：`v0.1.0-local-key.38`
- 当前已跑通并具备 safe release evidence 的 Sample：
  - Image Tracking
  - CRS / Cloud Recognition
  - Mega（已有 Unity 2022.3.62f3 Android 手机真机定位跟踪日志证据；fresh project 已完成官方 4002 包导入、APK 打包、真机安装启动、Onsite 模式定位/跟踪信号；另新增 PICO 4 Ultra Enterprise 眼镜 sample，已验证 APK 打包、安装、PICO VST、Mega `Found` 和办公室 block 定位）
- 暂缓目标：
  - Hello AR
  - Surface Tracking
  - 其他 EasyAR Sense Unity Plugin 官方 Sample
- 新增小程序目标：
  - WeChat Mini Program Mega（本地检查、本地官方包导入、DevTools 检查和 runbook）
  - WeChat Mini Program CRS / Cloud Recognition（本地检查、本地官方包导入、DevTools 检查和 runbook）
- Unity 验证基线：`2022.3.62f3`
- GitHub Release tarball、CI、安装 smoke、安全检查均已通过。

## 安装正版包

请从 GitHub Release 下载正版包：

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.38/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

安装检查通过后，把 MCP client 配到 `easyar-mcp` 这个 package binary 即可。

## 工具数量

`mcp-easyar` 默认使用 `core` 工具集，启用工具数约 78 个，低于常见 MCP 客户端 80 个工具的警告线。

如果维护仓库、调试官方 API 合同或需要全部工具，可以用 full profile：

```bash
MCP_EASYAR_TOOL_PROFILE=full easyar-mcp
```

日常给 Codex / Claude 使用时，建议保持默认 core profile。

## 推荐首次调用

```text
easyar_server_status
easyar_list_miniprogram_samples
easyar_check_client_setup client=codex entrypointMode=package-bin includeTokenPlaceholder=false
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_account_onboarding accountStage=not-registered sampleId=cloud-recognition platform=android
```

同时阅读 MCP resource：

```text
easyar://acceptance/fresh-project
easyar://acceptance/wechat-miniprogram
easyar://samples/wechat-miniprogram
easyar://roadmap/full-goal
easyar://workflow/programming
```

## 本地 key 路线

当前版本走 local-key 路线：

1. 用户在浏览器里打开 EasyAR 官网并注册/登录。
2. 用户下载官方 EasyAR Sense Unity Plugin。
3. 用户在官网开发中心创建或找到 license。
4. CRS / Cloud Recognition 用户创建或找到 AppId、识别服务地址、API KEY、API Secret；Mega 用户在已登录的 EasyAR 网页端或 Mega Studio 中找到云定位库、Mega Block storage、Block 名称和 Block ID。
5. 用户在本机 Unity 工程里填写 `ProjectSettings/EasyAR/easyar.local.json`。
6. MCP 只检查字段是否存在、是否像占位符，不输出 secret。
7. Unity 构建和真机验证使用本地配置运行，不需要在运行时登录官网。

## 微信小程序 Sample

当前小程序支持先覆盖两类官方 Sample：

- `wechat-mega`：EasyAR Mega 微信小程序 Sample。
- `wechat-crs`：EasyAR CRS / Cloud Recognition 微信小程序 Sample。

推荐调用：

```text
easyar_list_miniprogram_samples
easyar_check_wechat_devtools
easyar_create_miniprogram_sample_workspace projectPath=/path/to/miniprogram sampleId=wechat-mega appId=wx-your-appid
easyar_write_miniprogram_local_config_form projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_import_miniprogram_sample_from_local_package projectPath=/path/to/miniprogram sampleId=wechat-mega packagePath=/path/to/official/package-or.zip dryRun=true
easyar_inspect_miniprogram_project projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_run_through_status projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_preflight projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_run_miniprogram_devtools_check projectPath=/path/to/miniprogram sampleId=wechat-mega mode=open dryRun=true
easyar_run_miniprogram_devtools_check projectPath=/path/to/miniprogram sampleId=wechat-mega mode=preview dryRun=true
easyar_analyze_miniprogram_devtools_log projectPath=/path/to/miniprogram sampleId=wechat-mega logPath=easyar-generated/wechat-mega/DEVTOOLS_CHECK.log
easyar_write_miniprogram_run_sequence projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_device_validation_checklist projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_run_result_form projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_completion_report projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_scope_status projectPath=/path/to/miniprogram
```

CRS 小程序把 `sampleId` 改成 `wechat-crs`。用户仍需自己在 EasyAR 官网和微信开发者工具中完成注册、登录、下载、license / CRS key 创建和真机预览。

支持 prompts 的 MCP 客户端可以直接从 `easyar-run-wechat-miniprogram` 开始，并传入 `sampleId=wechat-mega` 或 `sampleId=wechat-crs`。这个 prompt 会先读取小程序验收资源，禁止在聊天里收集密钥，并要求有真机预览证据后才允许声明完成。

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

## Mega PICO 4 Ultra Enterprise

PICO 4 Ultra Enterprise sample 已验证的基线：

- Unity `2022.3.62f3`
- 包名 `com.easyar.mega.xrtest`
- EasyAR Sense Unity Plugin `4002.0.0`
- EasyAR Mega `2.12.6`
- EasyAR Unity XR 设备扩展包 `4000.0.0`
- PICO Unity Integration SDK `3.4.0`（EasyAR 文档要求 `3.1.0` 或更新版本）
- 官网 license 类型：`4.x XR正式版`

注意：PICO 和 XREAL 的 Mega 头显验收包也应使用 `LocationInputMode=Onsite`。如果眼镜中出现 EasyAR Simulator diagnostics caution，说明场景仍处于 Simulator/非现场输入模式，需要先切到 Onsite 后重新打包。验收以眼镜内 VST 实景可见、Mega 返回 `Found`、并定位到对应办公室 block 为准。`adb screencap` 可能抓不到 PICO 的透视合成层。

## 中文文档目录

- [中文文档索引](docs/zh-CN/README.md)
- [快速开始](docs/zh-CN/quickstart.md)
- [从 GitHub Release 安装](docs/zh-CN/install-from-github-release.md)
- [客户端配置](docs/zh-CN/client-setup.md)
- [新 Unity 项目验收](docs/zh-CN/FRESH_PROJECT_ACCEPTANCE.md)
- [微信小程序 Sample 验收](docs/zh-CN/wechat-miniprogram-sample-acceptance.md)
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
- [EasyAR Mega 微信小程序 MCP 设计](docs/zh-CN/easyar-mega-wechat-miniprogram-mcp.md)
- [微信小程序 Sample 验收](docs/zh-CN/wechat-miniprogram-sample-acceptance.md)

## 英文文档

- [新项目验收](docs/FRESH_PROJECT_ACCEPTANCE.md)
- [WeChat Mini Program sample acceptance](docs/wechat-miniprogram-sample-acceptance.md)
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
