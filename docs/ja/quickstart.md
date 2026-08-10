# mcp-easyar クイックスタート

## 1. 公式 GitHub Release package をインストール

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.40/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## 2. MCP client を設定

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

## 3. 初回呼び出し

```text
easyar_server_status
easyar_write_client_setup outputRoot=/path/to/workspace client=codex entrypointMode=package-bin output=inline
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_account_onboarding accountStage=not-registered sampleId=cloud-recognition platform=android
```

Mega を使う場合は `sampleId=mega` を指定します。ユーザー自身が EasyAR 公式サイトまたは Mega Studio で license、Mega Block、マップを選択し、機密値をローカルに保存します。

## 4. Unity プロジェクトを準備

```text
easyar_write_project_handoff projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=cloud-recognition
easyar_write_local_config_form projectPath=/path/to/UnityProject sampleId=cloud-recognition
```

ローカル設定ファイル:

```text
ProjectSettings/EasyAR/easyar.local.json
```

license、API Secret、appSecret、EasyAR パスワードをチャットへ貼り付けないでください。

## 5. Unity CLI で Sample を準備・ビルド

```text
easyar_unity_cli_status
easyar_unity_cli action=preflight projectPath=/path/to/UnityProject sampleId=image-tracking deviceProfile=android-phone
easyar_unity_cli action=prepare projectPath=/path/to/UnityProject sampleId=image-tracking deviceProfile=android-phone
easyar_unity_cli action=configure projectPath=/path/to/UnityProject sampleId=image-tracking deviceProfile=android-phone
easyar_unity_cli action=validate projectPath=/path/to/UnityProject sampleId=image-tracking deviceProfile=android-phone
easyar_unity_cli action=build-android projectPath=/path/to/UnityProject sampleId=image-tracking deviceProfile=android-phone
```

XREAL では `deviceProfile=xreal` を使用し、公式 `com.xreal.xr` `3.1.0+` と Enterprise camera license file をローカルで指定します。

## 6. 実機で検証

```text
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_run_sequence projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_android_device_runbook projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_device_validation_checklist projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=mega platform=android overallStatus=passed
easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=mega platform=android
```

Mega は APK build だけでは完了ではありません。対象の現地マップで実機 localization が成功し、`Found` などの信号が必要です。

## 7. WeChat Mini Program

```text
easyar_list_miniprogram_samples
easyar_find_miniprogram_official_package sampleId=wechat-mega searchRoots='["/Users/you/Downloads"]'
easyar_create_miniprogram_sample_workspace projectPath=/path/to/miniprogram sampleId=wechat-mega appId=wx-your-appid
easyar_import_miniprogram_sample_from_local_package projectPath=/path/to/miniprogram sampleId=wechat-mega packagePath=/path/to/package.zip dryRun=true
easyar_write_miniprogram_run_through_status projectPath=/path/to/miniprogram sampleId=wechat-mega
```

実際の preview、upload、実機検証は WeChat Developer Tools とユーザーのログイン済みアカウントで行います。

## 8. Unity プログラミング支援

```text
easyar_write_programming_context projectPath=/path/to/UnityProject sampleId=image-tracking goal="..."
easyar_write_code_plan projectPath=/path/to/UnityProject sampleId=image-tracking goal="..."
easyar_review_csharp_scripts projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_run_unity_compile_check projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
```
