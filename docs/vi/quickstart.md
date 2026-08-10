# Bắt đầu nhanh với mcp-easyar

## 1. Cài package chính thức từ GitHub Release

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.40/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## 2. Cấu hình MCP client

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

## 3. Các lệnh đầu tiên

```text
easyar_server_status
easyar_write_client_setup outputRoot=/path/to/workspace client=codex entrypointMode=package-bin output=inline
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_account_onboarding accountStage=not-registered sampleId=cloud-recognition platform=android
```

Với Mega, dùng `sampleId=mega`. Người dùng tự chọn license, Mega Block và bản đồ trong EasyAR hoặc Mega Studio, sau đó lưu secret cục bộ.

## 4. Chuẩn bị dự án Unity

```text
easyar_write_project_handoff projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=cloud-recognition
easyar_write_local_config_form projectPath=/path/to/UnityProject sampleId=cloud-recognition
```

Tệp cấu hình cục bộ:

```text
ProjectSettings/EasyAR/easyar.local.json
```

Không dán license, API Secret, appSecret hoặc mật khẩu EasyAR vào chat.

## 5. Chuẩn bị và build Sample bằng Unity CLI

```text
easyar_unity_cli_status
easyar_unity_cli action=preflight projectPath=/path/to/UnityProject sampleId=image-tracking deviceProfile=android-phone
easyar_unity_cli action=prepare projectPath=/path/to/UnityProject sampleId=image-tracking deviceProfile=android-phone
easyar_unity_cli action=configure projectPath=/path/to/UnityProject sampleId=image-tracking deviceProfile=android-phone
easyar_unity_cli action=validate projectPath=/path/to/UnityProject sampleId=image-tracking deviceProfile=android-phone
easyar_unity_cli action=build-android projectPath=/path/to/UnityProject sampleId=image-tracking deviceProfile=android-phone
```

Với XREAL, dùng `deviceProfile=xreal`, package chính thức `com.xreal.xr` `3.1.0+` và tệp Enterprise camera license được lưu cục bộ.

## 6. Kiểm thử trên thiết bị thật

```text
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_run_sequence projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_android_device_runbook projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_device_validation_checklist projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=mega platform=android overallStatus=passed
easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=mega platform=android
```

Chỉ build được APK chưa đủ để hoàn thành Mega. Thiết bị phải localization thành công trong không gian đã lập bản đồ và có tín hiệu như `Found`.

## 7. WeChat Mini Program

```text
easyar_list_miniprogram_samples
easyar_find_miniprogram_official_package sampleId=wechat-mega searchRoots='["/Users/you/Downloads"]'
easyar_create_miniprogram_sample_workspace projectPath=/path/to/miniprogram sampleId=wechat-mega appId=wx-your-appid
easyar_import_miniprogram_sample_from_local_package projectPath=/path/to/miniprogram sampleId=wechat-mega packagePath=/path/to/package.zip dryRun=true
easyar_write_miniprogram_run_through_status projectPath=/path/to/miniprogram sampleId=wechat-mega
```

Preview, upload và kiểm thử thật phải được thực hiện trong WeChat Developer Tools với tài khoản của người dùng.

## 8. Hỗ trợ lập trình Unity

```text
easyar_write_programming_context projectPath=/path/to/UnityProject sampleId=image-tracking goal="..."
easyar_write_code_plan projectPath=/path/to/UnityProject sampleId=image-tracking goal="..."
easyar_review_csharp_scripts projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_run_unity_compile_check projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
```
