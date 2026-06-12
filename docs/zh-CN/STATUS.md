# mcp-easyar 当前状态

当前 GitHub 预发布版：`v0.1.0-local-key.36`

安装：

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.36/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## 已完成

- GitHub Release tarball 可安装。
- 默认 core profile 启用约 57 个工具，低于常见 MCP 客户端 80 个工具警告线。
- full profile 仍可通过 `MCP_EASYAR_TOOL_PROFILE=full easyar-mcp` 启用全部维护工具。
- 已跑通并具备 safe release evidence：
  - Image Tracking
  - CRS / Cloud Recognition
- 当前工作树新增：
  - Mega：已有一轮 Android 真机定位跟踪日志证据，包含 `[MLOC]`、`kMapTracking` / `NCam_Verified results` 等信号。
  - Mega fresh project：已按用户要求新建 Unity 工程，使用官方 4002 Mega 包完成 APK 打包、真机安装启动、EasyAR Sense 初始化、`Onsite` 模式就绪，并在对应办公室映射场景中抓到真机定位/跟踪日志信号。
  - Mega PICO 4 Ultra Enterprise：已按用户要求新建 Unity 工程，使用 PICO Unity Integration SDK `3.4.0`、EasyAR Unity XR 设备扩展包 `4000.0.0` 和 `PicoFrameSource` 完成 APK 打包、PICO 安装启动、PICO VST 相机启动、眼镜内实景透视可见，并定位到办公室 Mega Block。该头显路径使用 `LocationInputMode=Simulator`，因为 PICO 不提供 Android GPS provider；画面中的 EasyAR Simulator diagnostics caution 是预期提示。
- Codex、Claude Desktop、通用 JSON MCP client 配置生成可用。
- 新用户注册/登录/下载/key 创建采用浏览器引导，不收集官网密码或密钥。
- Unity 项目编程辅助可生成 preflight、scene audit、run sequence、device validation、programming context、code plan、C# review、handoff artifact。

## 未完成

- Hello AR、Surface Tracking 和其他 EasyAR 官方 Sample 尚未纳入当前目标。
- 生产官方 API 自动化仍需 EasyAR-owned account/license/download/CRS endpoint。
- npm production publish 仍应等待生产 gate 或明确 prerelease 策略。

## 当前建议

日常使用请安装 GitHub Release 正版包，并保持默认 core profile。下一步是用三样本 safe evidence 跑严格 local-key release gate，并在通过后发布新的 GitHub Release。
