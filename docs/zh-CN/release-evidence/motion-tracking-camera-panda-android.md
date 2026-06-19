# 运动跟踪相机熊猫 Android 验证记录

日期：2026-06-19

范围：EasyAR Sense Unity 运动跟踪 sample，Android，Unity `2022.3.62f3`。

只记录安全证据。本记录不提交 EasyAR license、签名密钥、APK 二进制、私人空间截图、Unity package 内容或原始私有日志。

## 验证结果

- 已基于 EasyAR Sense Unity Plugin 的运动跟踪 sample 构建 Android APK。
- 已在真实 Samsung `SM-S9210` Android 手机上安装并冷启动 APK。
- App 内摄像头画面正常显示。
- 已隐藏 sample UI、按钮、帧源下拉框、EasyAR 左上角黄色诊断 dump、Unity 右下角 `Development Build` 水印。
- 运行时使用 EasyAR 运动跟踪与 ARCore 摄像头输入。
- 场景已改为检测到水平面命中后自动放置 sample 的 `EasyARPanda` 对象。
- 启动日志未出现 `Invalid Key`、`license invalid`、`EasyARSettings is not found`、`Could not find EasyAR shader`、`FATAL EXCEPTION` 或 `Unable to start AR Session`。

## 实现要点

- Android 包名：`com.easyar.mega.xrtest`。
- 通过 `EditorBuildSettings.AddConfigObject("EasyAR.Settings", ...)` 注册 EasyAR settings asset，并加入 Unity preloaded assets。
- 构建前强制把 EasyAR 摄像头画面 shader 加入 Unity `Always Included Shaders`：
  - `EasyAR/CameraImage_RGB`
  - `EasyAR/CameraImage_BGR`
  - `EasyAR/CameraImage_Gray`
  - `EasyAR/CameraImage_YUV_I420_YV12`
  - `EasyAR/CameraImage_YUV_NV12`
  - `EasyAR/CameraImage_YUV_NV21`
- sample 运行时启动后隐藏所有 `Canvas`。
- 设置 `DiagnosticsController.MessageOutput.SessionDump = None`，关闭左上角黄色 EasyAR session dump。
- 构建选项从 development/debugging 改为 `BuildOptions.None`。
- 帧源排序优先 EasyAR `MotionTrackerFrameSource`，用于水平面 hit test 后自动放置 Panda。

## 本地证据文件

原始构建输出、APK 和截图保留在本机，不提交到仓库。

- Unity 工程：`/private/tmp/easyar-motion-minimal-20260619`
- APK：`/private/tmp/easyar-motion-minimal-20260619/Builds/easyar-motion-tracking.apk`
- 最终构建日志：`/private/tmp/easyar-motion-minimal-20260619/build-no-debug-overlay.log`
- 最终截图：`/private/tmp/easyar-no-debug-overlay.png`

## 最终构建信号

- `Build Finished, Result: Success.`
- APK 大小：`668044287` bytes，`ls` 显示约 `45M`。
- ADB 安装结果：`Success`。
- 运行时关键错误筛查未发现 fatal 启动错误、license 错误、settings 错误或 shader 错误。

## 已清除阻塞

- 通过使用 `com.easyar.mega.xrtest` 解决 EasyAR package/license 不匹配。
- 通过预加载并注册 settings asset 解决 `EasyARSettings is not found`。
- 通过加入所有 EasyAR camera image shader 解决 `Could not find EasyAR shader for video overlay`。
- 通过禁用 sample canvases 与 EasyAR session dump 输出清除可见调试 UI。
- 通过非 development APK 构建移除 Unity `Development Build` 水印。
