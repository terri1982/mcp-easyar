# mcp-easyar 快速开始

## 1. 安装正版包

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.41/mcp-easyar-0.1.0.tgz
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

如果 MCP 客户端支持 prompts：Unity Mega 使用 `easyar-run-mega`；微信小程序 Mega/CRS 使用 `easyar-run-wechat-miniprogram`；不要把这两个入口混用。

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

Mega 不使用上面的 JSON。Mega 用户在 `Assets/XR/Settings/EasyAR Settings.asset` 中填写 package License Key 和 Global Mega Block 的 AppID、ServerAddress、APIKey、APISecret，并在本机 Unity/Mega Studio 中加载或绑定选定 Mega Block；不要在聊天里粘贴这些值或官网密码。

运行 Unity batch 前先调用 `easyar_write_unity_environment_report`。`EASYAR_UNITY_PATH` 必须指向真实 Editor，例如 macOS 的 `Unity.app/Contents/MacOS/Unity`，不能指向 `~/.unity/bin/Unity` 之类的 Unity CLI。如果报告显示 Unity Hub 版本目录是断链软链接，先挂载或恢复对应外置盘。

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
easyar_validate_local_config projectPath=/path/to/UnityProject sampleId=mega
easyar_write_scene_audit projectPath=/path/to/UnityProject sampleId=mega
easyar_create_build_settings_helper projectPath=/path/to/UnityProject sampleId=mega platform=android scenePath=Assets/.../MegaOnsite.unity overwrite=true
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_run_sequence projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_android_device_runbook projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_device_validation_checklist projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=mega platform=android overallStatus=blocked
easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=mega platform=android
```

Mega 只有 APK 打包成功还不算完成；必须有真机安装、启动和定位成功证据。`v0.1.0-local-key.41` 已有 Android 手机与 XREAL 真机 Mega 定位证据，新 Unity 项目仍需按自己的官网 package name、license 和 Mega Block 重新验证。

先读 `SCENE_AUDIT.md`：它会列出 Onsite 与 Simulator 场景、Build Settings 首场景和推荐场景。存在多个 Onsite 候选或首场景为 Simulator 时，必须把推荐的完整 `Assets/.../*.unity` 路径传给 `scenePath`，不能让工具任取第一个匹配场景。

在选定的 Mega Block 已加载，并且真实设备在对应映射环境中产生脱敏的定位/跟踪成功证据前，Mega 的运行结果必须保持 `blocked`。APK 安装成功、应用进入前台、日志干净或 Onsite 配置完成都只是中间步骤；只有完成报告显示 `runThroughComplete=true` 后，才允许使用 `overallStatus=passed`。

Mega 这里指 Unity Mega Sample。Mega 只有 APK 打包成功还不算完成；必须有 `LocationInputMode=Onsite`、真实设备安装、启动和所选 Mega Block 定位/跟踪成功证据。`COMPLETION_REPORT.md` 必须显示 `runThroughComplete=true`。如果目标是微信小程序 Mega，请停止使用上述调用，改用 `easyar-run-wechat-miniprogram sampleId=wechat-mega`；Unity APK 或 PICO/XREAL 证据不能替代微信真机预览证据。

微信小程序 Sample 使用 `easyar-run-wechat-miniprogram`，并传入 `sampleId=wechat-mega` 或 `sampleId=wechat-crs`。这个 prompt 会引导读取 `easyar://acceptance/wechat-miniprogram` 和 `easyar://samples/wechat-miniprogram`，必要时用 `easyar_create_miniprogram_sample_workspace` 创建最小小程序工程壳，用 `easyar_find_miniprogram_official_package` 和 `easyar_write_miniprogram_official_package_search` 查找并记录官方包搜索证据，走 EasyAR 官网和微信开发者工具的官方 handoff，不在聊天里收集密钥，并要求真机预览证据后才生成完成报告。

小程序工程、官方包查找/导入、DevTools 日志或真机证据有变化时，可以反复调用 `easyar_write_miniprogram_run_through_status`。它会写一个本地状态文件，并给出下一次最应该调用的 MCP 工具。

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
