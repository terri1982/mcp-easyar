# Mega Fresh Project Android 启动与定位证据

日期：2026-06-12

范围：新 Unity 工程中的 Mega sample Android 启动与定位验证，Unity `2022.3.62f3`。

本文只记录安全证据，不包含 EasyAR 官网密码、验证码、license key、API Key/API Secret 明文、appKey/appSecret、签名密钥、APK 二进制、Unity package 或原始私有日志。

## Fresh Project 设置

- 按用户要求新建 Unity 工程验证，没有复用之前的天坛工程。
- 使用官方下载包：
  - `com.easyar.sense` `4002.0.0+4956.1ec38c1ad`
  - `com.easyar.mega` `2.12.6+4956.1ec38c1ad`
- 官方 `MegaBlock_Basic` sample 已从 EasyAR package cache 复制到工程。
- Android 包名来自已登录 EasyAR 开发中心记录：`com.myarcommon.myar`。
- 选定云定位库/材料：
  - 云定位库：`视辰信息科技(上海)有限公司`
  - Mega Block storage：`ARMallBlock9.0`
  - Mega Block 名称：`大厅+办公室+阳台+GPS+0716`
- sample 场景从 `Simulator` 切到 `Onsite`，用于 Android 手机真机验证。
- fresh project 中将 `BlockHolder.BlockRootSource` 调整为 `Internal`，避免定位成功后因未分配外部 BlockRoot 触发 `Block root not exist` 运行时错误。

## 已验证信号

- Android APK 打包成功。
- APK 成功安装到连接的 Android 真机。
- 测试设备通过 ADB 检测：Samsung `SM_S9210`。
- App 成功启动，启动后进程存活。
- 启动前已通过 ADB 授予相机和定位权限。
- EasyAR Sense 在设备上初始化成功：
  - `EasyAR Sense Unity Plugin Version 4002.0.0+4956.1ec38c1ad`
  - `EasyAR Sense CommunityFull (Android-arm64) Version 4.9.0.11908-e5f122cc4`
- 之前的启动阻塞未出现：
  - 无 `License Key is empty`
  - 无 `Invalid Key`
  - 启动窗口内未观察到 `401` 或 `400` 服务错误
  - 无 Android runtime crash
  - 无 `Block root not exist`
  - 无 `Session Broken: RunningFailed`
- 切换到 `Onsite` 后，真机版本不再出现 `Mega is running in Simulator mode` 警告。
- ARCore/camera 启动日志显示实时相机帧活动。

## 定位证据

fresh project 随后在同一 Android 设备上测试，手机摄像头对准选定的办公室映射场景。设备日志和画面诊断捕获到重复定位/跟踪信号：

- `[VioEstimator] Vio start up successful initialization`
- `[MLOC] NCam_Verified results of kLocalizationFullMap`
- `World pose node changing to MapId:315886d2-3094-27d0-8dbf-1686cdc2c8f9`
- `[MLOC] NCam_Verified results of kMapTracking`
- `[M] [Localizer] - loaded map 315886d1-3094-27d0-8c86-ec6f18cb4d51`
- `[M] ADF 315886d2-3094-27d0-8dbf-1686cdc2c8f9 successfully localized against ADF 315886d1-3094-27d0-8c86-ec6f18cb4d51`
- 画面诊断显示 `Block: 大厅+办公室+阳台+GPS+0716 (...)` 以及相对已定位 block 的设备位姿。

成功定位窗口内未观察到 license invalid、AppID invalid、unauthorized、forbidden、`Block root not exist`、`Session Broken` 或 Android runtime crash 阻塞。

## 当前限制

这份证据证明 fresh project APK 打包、安装、启动、EasyAR 初始化、Onsite 模式就绪、真实设备 Mega 定位/跟踪日志信号，以及选定映射环境中画面显示已定位 Block。它仍是本地证据摘要：原始日志、截图、APK、Unity package 和含密钥的 Unity 设置不进入仓库。

## 本地证据文件

原始日志和 Unity 工程保持本地，不提交到仓库，因为 Unity/EasyAR 工程可能包含私有账号或环境信息。

- Fresh Unity project：`/Users/tuyi/UnityProjects/EasyARMegaVerification`
- 构建日志：`/Users/tuyi/UnityProjects/EasyARMegaVerification/Logs/build-android-mega-onsite.log`
- 最终 BlockRoot fix 构建日志：`/Users/tuyi/UnityProjects/EasyARMegaVerification/Logs/build-android-mega-blockroot-internal.log`
- 最终设备定位日志：`/Users/tuyi/UnityProjects/EasyARMegaVerification/Logs/mega-current-block-debug-20260612-123117.log`
- 最终设备截图：`/Users/tuyi/UnityProjects/EasyARMegaVerification/Logs/mega-current-block-debug-20260612-123120.png`
- APK 路径：`/Users/tuyi/UnityProjects/EasyARMegaVerification/Builds/EasyARMegaVerification.apk`
