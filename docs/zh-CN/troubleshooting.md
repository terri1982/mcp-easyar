# mcp-easyar 问题排查

## 工具数量过多

默认应为约 57 个工具。如果客户端显示 100+，检查是否设置了：

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
