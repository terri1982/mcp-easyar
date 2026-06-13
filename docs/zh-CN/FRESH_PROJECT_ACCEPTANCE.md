# 新 Unity 项目验收

当前稳定发布证据已验证：

- Image Tracking
- CRS / Cloud Recognition

当前开发扩展目标：

- Mega（当前工作树已有 Android 手机真机定位跟踪证据；fresh project 已完成官方包导入、APK 打包、真机安装启动、Onsite 模式就绪，并在对应办公室映射场景抓到定位/跟踪日志信号；PICO 4 Ultra Enterprise 眼镜 sample 已完成 APK 打包、安装、PICO VST、眼镜内实景透视、Mega `Found` 和办公室 block 定位。新项目仍需按自身 license / package name / Mega Block 做同样的现场验证）

Hello AR、Surface Tracking 和其他 Sample 需要用户明确要求继续后，再按扩展计划纳入。

## 安装 MCP

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.37/mcp-easyar-0.1.0.tgz
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
- Android 手机/平板验证时，Mega sample 场景 `LocationInputMode` 设为 `Onsite`。
- PICO 4 Ultra Enterprise 眼镜验证时，安装官方 EasyAR Unity XR 设备扩展包和 PICO Unity Integration SDK `3.1.0` 或更新版本，只保留 `PicoFrameSource`，并使用 `LocationInputMode=Simulator`。这是已验证的头显路径，因为 PICO 不提供 Android GPS provider。
- Android APK 打包成功。
- 真机安装启动成功，已授予相机、定位和网络权限。
- 在选定 Mega Block 对应环境中真机定位成功。
- PICO 眼镜验收以眼镜内 VST 实景可见、Mega 返回 `Found`、定位到对应 Block 为准；`adb screencap` 可能抓不到 PICO 透视合成层。
- 生成 `RUN_RESULT.md` 和 `COMPLETION_REPORT.md`，并写入安全 release evidence。

## 完成标准

`FOCUSED_SCOPE_STATUS.md` 中 `allFocusedSamplesComplete=true`。新的三样本 release 只能在 Image Tracking、CRS / Cloud Recognition 和 Mega 都具备真机证据，并且 `docs/release-evidence/focused-scope.android.json` 与 release gate 对齐后声明完成。
