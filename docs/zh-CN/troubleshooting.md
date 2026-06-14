# mcp-easyar 问题排查

## 工具数量过多

默认应为约 77 个工具。如果客户端显示 100+，检查是否设置了：

```bash
MCP_EASYAR_TOOL_PROFILE=full
```

日常使用请取消该环境变量。

## 安装失败

- 检查 Node.js 是否 >= 20。
- 检查 GitHub Release URL 是否为当前版本。
- 运行 `easyar-mcp-check`。

## Unity 编译失败

调用：

```text
easyar_analyze_latest_unity_log projectPath=/path/to/UnityProject sampleId=image-tracking
```

或指定日志：

```text
easyar_analyze_unity_log projectPath=/path/to/UnityProject sampleId=cloud-recognition logPath=Logs/mcp-easyar-CompileCheck.log
```

## Image Tracking 识别失败

- 检查目标图是否导入。
- 检查 Build Settings scene。
- 检查摄像头权限。
- 用真机对准目标图，不要只看 Editor。

## CRS 识别失败

- 检查 Cloud Recognition AppId/serverAddress/apiKey/apiSecret。
- 检查目标库是否有已启用目标图。
- 检查手机网络。
- 检查截图是否显示 `Cloud Recognizer: True`。

## Mega APK 或定位失败

- `mega-assets`：检查官方 EasyAR Sense Unity Plugin for Mega 是否已安装，Unity 工程里是否能找到 Mega、MegaBlock、CloudLocalizer 或项目 Mega scene 资源。
- `mega-block-config`：检查已登录 EasyAR 网页端或 Mega Studio 中的云定位库、Mega Block storage、Block 名称和 Block ID 是否和 Unity 工程绑定一致。
- `mega-hybridclr`：如果项目使用 HybridCLR，先运行 installer，再针对 Android 目标执行 `HybridCLR/Generate/All`。
- `mega-arcore-manifest`：检查 AndroidManifest、ARCore metadata、`minSdkVersion`、ONNX Runtime 依赖是否冲突。
- `mega-localization-runtime`：APK 能启动但定位不成功时，确认手机在选定 Mega Block 对应环境中，且相机、定位、网络权限都已开启。

常用诊断调用：

```text
easyar_analyze_latest_unity_log projectPath=/path/to/UnityProject sampleId=mega
easyar_write_android_device_runbook projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_device_run_result_form projectPath=/path/to/UnityProject sampleId=mega platform=android
```
