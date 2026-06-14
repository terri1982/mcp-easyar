# mcp-easyar 快速开始

## 1. 安装正版包

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.38/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## 2. 配置 MCP Client

使用 package binary：

```json
{
  "mcpServers": {
    "easyar": {
      "command": "easyar-mcp",
      "args": []
    }
  }
}
```

## 3. 新用户首次调用

```text
easyar_server_status
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_account_onboarding accountStage=not-registered sampleId=cloud-recognition platform=android
```

如果目标是 Mega，可把后续 `sampleId` 改为 `mega`。用户仍然在浏览器里自行登录 EasyAR 官网或 Mega Studio，MCP 只引导查找云定位库、Mega Block storage、Block 名称和 Block ID，不收集官网密码或密钥。

## 4. Unity 工程准备

```text
easyar_write_project_handoff projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=cloud-recognition
easyar_write_local_config_form projectPath=/path/to/UnityProject sampleId=cloud-recognition
```

用户在本地填写：

```text
ProjectSettings/EasyAR/easyar.local.json
```

Mega 用户需要在本机 Unity/Mega Studio 中加载或绑定选定 Mega Block；不要在聊天里粘贴 license、API Secret、appSecret 或官网密码。

## 5. 跑通 Sample

```text
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_run_sequence projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_device_validation_checklist projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
```

真机跑通后记录：

```text
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android overallStatus=passed
easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
```

Mega 的对应调用：

```text
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_run_sequence projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_android_device_runbook projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_device_validation_checklist projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=mega platform=android overallStatus=passed
easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=mega platform=android
```

Mega 只有 APK 打包成功还不算完成；必须有真机安装、启动和定位成功证据。当前工作树已有一轮 Android 真机 Mega 定位跟踪证据，新 Unity 项目仍需按自己的官网 package name、license 和 Mega Block 重新验证。

## 6. 编程服务

改 Unity C# 前：

```text
easyar_write_programming_context projectPath=/path/to/UnityProject sampleId=image-tracking goal="..."
easyar_write_code_plan projectPath=/path/to/UnityProject sampleId=image-tracking goal="..."
```

改完后：

```text
easyar_review_csharp_scripts projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_run_unity_compile_check projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
```
