# 新 Unity 项目验收

当前稳定发布证据已验证：

- Image Tracking
- CRS / Cloud Recognition

当前开发扩展目标：

- Mega（当前工作树已完成 Android 真机安装启动和 Mega 定位跟踪证据；新项目仍需按自身 license / package name / Mega Block 重新验证）

Hello AR、Surface Tracking 和其他 Sample 需要用户明确要求继续后，再按扩展计划纳入。

## 安装 MCP

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.34/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## Unity 前置条件

- Unity `2022.3.62f3`
- 已安装官方 EasyAR Sense Unity Plugin
- Android 真机或 iOS 真机
- 本地 `ProjectSettings/EasyAR/easyar.local.json`

## Image Tracking 验收

- 官方 sample 已导入。
- 本地 license 已配置。
- Build Settings 指向正确 scene。
- 真机安装启动成功。
- 摄像头对准目标图后识别成功。
- 生成 `RUN_RESULT.md` 和 `COMPLETION_REPORT.md`。

## CRS / Cloud Recognition 验收

- 官方 Cloud Recognition sample 已导入。
- 本地 license、CRS AppId、serverAddress、apiKey、apiSecret 已配置。
- 云端目标库至少有一个可识别目标。
- 真机网络可访问 CRS 服务。
- 摄像头对准云端目标后出现识别结果或 AR 内容。

## Mega 验收

- 官方 EasyAR Sense Unity Plugin for Mega 已安装。
- 已在已登录的 EasyAR 网页端或 Mega Studio 中找到云定位库、Mega Block storage、Block 名称和 Block ID。
- Unity 工程已加载或绑定选定 Mega Block。
- Android APK 打包成功。
- 真机安装启动成功，已授予相机、定位和网络权限。
- 在选定 Mega Block 对应环境中真机定位成功。
- 生成 `RUN_RESULT.md` 和 `COMPLETION_REPORT.md`，并写入安全 release evidence。

## 完成标准

`FOCUSED_SCOPE_STATUS.md` 中 `allFocusedSamplesComplete=true`。新的三样本 release 只能在 Image Tracking、CRS / Cloud Recognition 和 Mega 都具备真机证据，并且 `docs/release-evidence/focused-scope.android.json` 与 release gate 对齐后声明完成。
