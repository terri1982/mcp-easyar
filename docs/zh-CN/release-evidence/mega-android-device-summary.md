# Mega Android 真机证据摘要

日期：2026-06-12

范围：Android 上的 `mega` sample，Unity `2022.3.62f3`。

本文只记录安全证据，不包含 EasyAR 官网密码、验证码、license key、Cloud Recognition API KEY/API Secret 明文、appKey/appSecret、签名密钥、APK 二进制、Unity package 或原始私有日志。

## 已验证信号

- Android 包名来自已登录 EasyAR 开发中心记录：`com.myarcommon.myar`。
- APK metadata 已验证包名为 `com.myarcommon.myar`。
- ADB 检测到测试设备：Samsung `SM_S9210`。
- APK 已成功安装到 Android 真机。
- 已按需授予相机、定位、网络和音频运行时权限。
- 设备端 EasyAR Settings 加载成功。
- EasyAR Sense 初始化成功；之前的 `Invalid Key: {No matched Package Name}` 阻塞已清除。
- Mega Block 已从 `ARMallBlock9.0` 加载：`大厅+办公室+阳台+GPS+0716`。
- 通过把 `EasyAR/CameraImage_*` shader 加入 Unity `Always Included Shaders`，清除了 EasyAR camera overlay shader 阻塞。
- 长时间设备日志显示 Mega 定位/跟踪活动，包括 `[MLOC]`、`kLocalizationFullMap`、`kMapTracking` 和重复的 `NCam_Verified results`。

## Fresh Project 后续

用户要求不要继续使用天坛工程后，又记录了一轮新 Unity 工程验证。参见 `docs/zh-CN/release-evidence/mega-fresh-project-android-startup.md`。

该 fresh project 验证已证明：官方包导入、APK 打包、真机安装/启动、EasyAR Sense 初始化、`Onsite` 模式就绪、`BlockHolder.BlockRootSource=Internal` 运行稳定，以及选定映射环境中的 Mega 定位/跟踪日志信号。画面诊断中定位到的 block 为 `大厅+办公室+阳台+GPS+0716`。

## 本地证据文件

原始日志保持本地，不提交到仓库，因为 Unity/EasyAR 工程可能包含私有账号或环境信息。

- 构建日志：`/Users/tuyi/UnityProjects/TiantanARSpatial/Logs/mega-android-build-shader-fix-2.log`
- 设备日志：`/Users/tuyi/UnityProjects/TiantanARSpatial/Logs/mega-device-logcat-20260612-shader-fix-long.log`
