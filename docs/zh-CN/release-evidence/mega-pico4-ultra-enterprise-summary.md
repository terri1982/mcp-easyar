# Mega PICO 4 Ultra Enterprise 证据摘要

日期：2026-06-12

范围：PICO 4 Ultra Enterprise 上的 `mega` sample，Unity `2022.3.62f3`。

本文只记录安全证据，不包含 EasyAR 官网密码、验证码、license key、API Key/API Secret 明文、appKey/appSecret、签名密钥、APK 二进制、Unity package 或原始私有日志。

## 已验证基线

- Unity：`2022.3.62f3`
- Android 包名：`com.easyar.mega.xrtest`
- EasyAR Sense Unity Plugin：`4002.0.0+4956.1ec38c1ad`
- EasyAR Mega：`2.12.6+4956.1ec38c1ad`
- EasyAR Unity XR 设备扩展包：`4000.0.0`
- PICO Unity Integration SDK：`3.4.0`
- EasyAR 官网 license 类型：`4.x XR正式版`
- 设备：PICO 4 Ultra Enterprise
- EasyAR FrameSource：`PicoFrameSource`
- Mega 云定位库/材料：`视辰信息科技(上海)有限公司`
- 定位到的 Mega Block：`大厅+办公室+阳台+GPS+0716`

## 已验证信号

- 按用户要求新建 Unity 工程验证 PICO 眼镜，没有复用天坛工程或 Android 手机工程。
- Unity batch mode APK 打包成功。
- APK 通过 ADB 成功安装到 PICO 设备。
- App 以 `com.easyar.mega.xrtest` 包名启动。
- EasyAR Sense 在眼镜上初始化成功。
- EasyAR Pico frame source availability check 已执行。
- PICO VST 相机启动成功；日志包含 `startPreview done, RGB=[0]`。
- 成功截图窗口中，PICO 处于 `Awake`，EasyAR app 为前台窗口。
- 眼镜画面中的 EasyAR diagnostics 显示：
  - `Pico (True) received 900+`
  - `Mega Block: min=FiveDof, Simulator`
  - `1222.263, Found`
  - `Block: 大厅+办公室+阳台+GPS+0716 (...)`
- 用户确认眼镜内能看到 PICO 实景透视背景。

## 位置输入说明

PICO 路径有意使用 Mega `LocationInputMode=Simulator`。同一场景切到 `Onsite` 后，Unity/EasyAR 会启动 Android 位置服务，PICO 返回：

```text
provider "gps" does not exist
```

这是预期现象，因为 PICO 头显不提供 Android GPS provider。因此，眼镜路径中 EasyAR diagnostics 的提示：

```text
Mega is running in Simulator mode with simulated or no location input.
```

是预期开发提示，不代表定位失败。Android 手机/平板的 Mega 验证仍应使用 `Onsite`。

## 截图说明

ADB `screencap` 可能抓不到 PICO VST 透视合成层。仓库证据不应要求 PNG 截图必须显示真实世界背景；PICO 验收以眼镜内实景可见、EasyAR/PICO 日志、以及 Mega `Found` 和 Block 诊断信息为准。

## 本地证据文件

原始日志和 Unity 工程保持本地，不提交到仓库，因为 Unity/EasyAR 工程可能包含账号或环境隐私。

- 新建 Unity 工程：`/Users/tuyi/UnityProjects/xrtest`
- 构建日志：`/Users/tuyi/UnityProjects/xrtest/Logs/build-pico-mega-simulator-vst-bootstrap-fixed.log`
- PICO 聚焦运行日志：`/Users/tuyi/UnityProjects/xrtest/Logs/pico-mega-simulator-vst-bootstrap-fixed-focused-20260612.log`
- 激活状态下的眼镜截图：`/Users/tuyi/UnityProjects/xrtest/Logs/pico_easyar_active.png`
- APK 路径：`/Users/tuyi/UnityProjects/xrtest/Builds/xrtest-pico-mega.apk`
