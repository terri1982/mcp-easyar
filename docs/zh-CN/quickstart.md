# mcp-easyar 快速开始

## 1. 安装正版包

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.31/mcp-easyar-0.1.0.tgz
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
