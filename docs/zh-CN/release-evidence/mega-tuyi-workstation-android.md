# Mega 涂意工位 Android 真机证据

日期：2026-07-02

范围：在 fresh Unity 工程中使用 ARMall `涂意工位测试专用` 云定位库验证 EasyAR Mega Block 云定位，Unity `2022.3.62f3`，Android 真机。

本文只记录安全证据，不包含 EasyAR 官网密码、License Key、Mega API Key/API Secret、签名密钥、APK 二进制、Unity package、含服务标识的截图或原始私有日志。

## 验证环境

- Unity 工程：`/Users/tuyi/UnityProjects/EasyAR-Mega-Tuyi-Workstation-Test`
- APK：`/Users/tuyi/UnityProjects/EasyAR-Mega-Tuyi-Workstation-Test/Builds/Android/EasyAR-Mega-Tuyi-Workstation.apk`
- EasyAR package：
  - `com.easyar.sense` `4003.0.0+5171.3948ae721`
  - `com.easyar.mega` `2.13.0+5171.3948ae721`
  - `com.easyar.mega.studio` `2.13.0+5171.3948ae721`
- 为官方 sample 场景补齐 Unity XR 依赖：
  - `com.unity.xr.arfoundation` `5.1.6`
  - `com.unity.xr.arcore` `5.1.6`
  - `com.unity.xr.management` `4.4.0`
- Android 包名：`com.DefaultCompany.MegaMap`
- 测试设备：Samsung `SM-S9010`，序列号 `R5CTA0ZQ6XJ`

## 选定云定位材料

- Service group：`ARMallMega9.0`
- 云定位库：`涂意工位测试专用`
- 绑定存储：`ARMallBlock9.0`
- 数据格式：`3-a`
- Block：`CodexTest01`
- Block ID：`b75f4d7a-134c-4b6a-90d4-1dea938c2c16`
- 运行模式：`Onsite`

## 已验证信号

- 已为 `com.DefaultCompany.MegaMap` 创建并应用包名匹配的 EasyAR Sense 4.x License。
- 已配置 `MegaBlock_Basic` 使用全局 Mega Block service config 和 `CodexTest01`。
- Android ARM64 IL2CPP APK 打包成功。
- APK 成功安装到 Samsung `SM-S9010`。
- 已通过 ADB 授予相机和定位权限。
- EasyAR Sense 在设备上初始化成功：
  - `EasyAR Sense Unity Plugin Version 4003.0.0+5171.3948ae721`
  - `EasyAR Sense CommunityFull (Android-arm64) Version 4.9.0.11908-e5f122cc4`
- 使用包名匹配 License 后，之前的 `Invalid Key: {No matched Package Name}` 启动阻塞已清除。
- 补齐 Unity XR packages 后，`AR Session`、`XR Origin`、`Main Camera` 缺失脚本警告已清除。
- 运行时使用 ARCore 摄像头输入，并成功打开真机相机流。
- 设备画面诊断显示 Mega Block 云定位链路使用 `CodexTest01` 和选定服务配置。
- 用户确认最终真机运行已定位跑通。

## 已清除阻塞

- 初始复用本地旧 EasyAR License 时出现 `Invalid Key: {No matched Package Name}`。随后在 ARMall 账号下为测试包名创建新的 Sense License 后清除。
- 官方 sample 初始运行时在 `AR Session`、`XR Origin`、`Main Camera` 上出现缺失脚本警告。补齐 AR Foundation、ARCore XR Plugin 和 XR Management 后清除。
- 首次 Android 构建因 ARCore batch build 的 CPU 架构 / scripting backend 设置不完整失败。构建自动化已设置 IL2CPP 和 ARM64，并关闭 EasyAR 32-bit ARCore batchmode 预检弹窗。
- 外置硬盘 Unity 工程曾出现 Unity asset database 错误；最终验收工程已改建在本机 APFS 路径。

## 当前限制

仓库内只提交安全摘要。原始 APK、Unity package、截图、构建日志和服务凭证保留在本机，因为它们可能包含私有账号或环境信息。

## 本地证据文件

- Unity 工程：`/Users/tuyi/UnityProjects/EasyAR-Mega-Tuyi-Workstation-Test`
- APK：`/Users/tuyi/UnityProjects/EasyAR-Mega-Tuyi-Workstation-Test/Builds/Android/EasyAR-Mega-Tuyi-Workstation.apk`
- 构建日志：`/Users/tuyi/UnityProjects/EasyAR-Mega-Tuyi-Workstation-Test/Builds/Logs/build-android.log`
- 运行截图：`/tmp/s22-mega-current.png`
