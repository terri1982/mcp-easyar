# mcp-easyar 当前状态

当前 GitHub 预发布版：`v0.1.0-local-key.38`

官方中文文档快照：2026-07-01。MCP 元数据已更新到 EasyAR Sense Unity Plugin / for Mega `4003.0.0`、EasyAR Mega 支持包与 Mega Studio `2.13.0`、XR 设备扩展包 `4000.0.1`、EasyAR Sense Native `4.9.0`、EasyAR Mega 微信小程序插件 `2.0.3`。详见 `docs/zh-CN/OFFICIAL_DOCS_2026-07-01.md`。

安装：

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.38/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## 已完成

- GitHub Release tarball 可安装。
- 默认 core profile 启用约 70 个工具，低于常见 MCP 客户端 80 个工具警告线。
- full profile 仍可通过 `MCP_EASYAR_TOOL_PROFILE=full easyar-mcp` 启用全部维护工具。
- 已跑通并具备 safe release evidence：
  - Image Tracking
  - CRS / Cloud Recognition
- 当前工作树新增：
  - Mega：已有一轮 Android 真机定位跟踪日志证据，包含 `[MLOC]`、`kMapTracking` / `NCam_Verified results` 等信号。
  - Mega fresh project：已按用户要求新建 Unity 工程，使用官方 4002 Mega 包完成 APK 打包、真机安装启动、EasyAR Sense 初始化、`Onsite` 模式就绪，并在对应办公室映射场景中抓到真机定位/跟踪日志信号。
  - Mega PICO 4 Ultra Enterprise：已按用户要求新建 Unity 工程，使用 PICO Unity Integration SDK `3.4.0`、EasyAR Unity XR 设备扩展包 `4000.0.0` 和 `PicoFrameSource` 完成 APK 打包、PICO 安装启动、PICO VST 相机启动、眼镜内实景透视可见，并定位到办公室 Mega Block。该头显路径现统一使用 `LocationInputMode=Onsite`；如果出现 EasyAR Simulator diagnostics caution，说明场景仍需切到 Onsite 后重新打包。
  - Mega 4003 Android：已使用 EasyAR Sense `4003.0.0+5171.3948ae721`、Mega `2.13.0+5171.3948ae721` 和 ARMall `涂意工位测试专用` 云定位库，在 Samsung `SM-S9010` 上完成 APK 打包、安装、EasyAR 初始化、ARCore 相机启动、`CodexTest01` Block 配置，并由用户确认最终真机定位跑通。
  - Motion Tracking Android：已完成只显示摄像头画面的正式 APK，隐藏 sample UI、EasyAR 黄色诊断 dump 和 Unity Development Build 水印，使用 ARCore 摄像头输入与 EasyAR MotionTracker，水平面命中后自动放置 `EasyARPanda`。
- Codex、Claude Desktop、通用 JSON MCP client 配置生成可用。
- 新用户注册/登录/下载/key 创建采用浏览器引导，不收集官网密码或密钥。
- Unity 项目编程辅助可生成 preflight、scene audit、run sequence、device validation、programming context、code plan、C# review、handoff artifact。
- 微信小程序方向已新增 `wechat-mega` 和 `wechat-crs` 两个 focused sample 元数据，并提供小程序工程检查、微信开发者工具 CLI 检测、本地配置表、用户本地已下载官方包导入、DevTools 检查、日志分析、preflight、run sequence、真机验证清单、run result、completion report、小程序 scope status、`easyar://samples/wechat-miniprogram` resource 和 `easyar://acceptance/wechat-miniprogram` 验收 resource。

## 未完成

- Hello AR、Surface Tracking 和其他 EasyAR 官方 Sample 尚未纳入当前目标。
- 微信小程序 Mega / CRS 目前已覆盖本地检查、本地官方包导入、DevTools 检查、日志分析、真机验证清单、run result、completion report 和小程序 scope status；尚未声明完成微信预览、上传或真机识别/定位验收。
- 4003.0.0 / MegaBlockController Android 手机路径已完成真机验收；头显路径后续仍需按新版 Mega package 单独复测。
- 生产官方 API 自动化仍需 EasyAR-owned account/license/download/CRS endpoint。
- npm production publish 仍应等待生产 gate 或明确 prerelease 策略。

## 当前建议

日常使用请安装 GitHub Release 正版包，并保持默认 core profile。下一步是用三样本与 Motion Tracking safe evidence 跑严格 local-key release gate，并在通过后发布新的 GitHub Release。
