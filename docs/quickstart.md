# mcp-easyar Quickstart

This workflow is for registered EasyAR users connecting Codex, Claude, or another MCP client to local Unity project automation.

## 1. Build The Server

```bash
npm install
npm run build
```

## 2. Configure A Client

Ask the MCP server for a client snippet:

```text
easyar_server_status
easyar_generate_client_config client=claude-desktop
```

Set these environment variables locally:

```bash
EASYAR_API_BASE_URL=https://www.easyar.cn
EASYAR_API_TOKEN=your_registered_user_token
EASYAR_UNITY_PATH=/Applications/Unity/Hub/Editor/2022.3.62f1/Unity.app/Contents/MacOS/Unity
```

You can inspect local Unity path discovery with:

```text
easyar_unity_environment
```

Never commit account tokens, license keys, cloud recognition credentials, or mobile signing secrets.

## 3. Choose A Sample

Call:

```text
easyar_list_samples
easyar_generate_sample_plan sampleId=image-tracking platform=android
```

Import the official EasyAR Unity Plugin and sample scenes from the EasyAR download page before expecting a real device run to succeed.

## 4. Prepare The Unity Project

Call:

```text
easyar_inspect_unity_project projectPath=/path/to/UnityProject
easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_check_sample_readiness projectPath=/path/to/UnityProject sampleId=image-tracking
```

Copy `ProjectSettings/EasyAR/easyar.local.json.example` to `ProjectSettings/EasyAR/easyar.local.json` and fill it with official local credentials.

Then validate without exposing secrets:

```text
easyar_validate_local_config projectPath=/path/to/UnityProject
```

## 5. Configure Build Settings

After importing the official sample scene, call:

```text
easyar_create_build_settings_helper projectPath=/path/to/UnityProject sampleId=image-tracking platform=android overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject executeMethod=EasyAR.EditorTools.EasyARBuildSettingsHelper.ConfigureBuildSettings
```

## 6. Add Project Code

For common sample logic, call:

```text
easyar_create_mono_behaviour projectPath=/path/to/UnityProject relativePath=Assets/Scripts/ImageTargetContentController.cs className=ImageTargetContentController kind=image-tracking
```

For custom code, use:

```text
easyar_write_csharp_file
```

## 7. Final Readiness Check

Call:

```text
easyar_check_sample_readiness projectPath=/path/to/UnityProject sampleId=image-tracking
```

When `ready` is `true`, open Unity or use batch mode to run the generated editor helpers, then build to a real Android or iOS device for camera/tracking validation.

## 8. Generate A Device Build Helper

After Build Settings are configured, generate a static build method:

```text
easyar_create_device_build_helper projectPath=/path/to/UnityProject platform=android outputPath=Builds/EasyARSample.apk overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject executeMethod=EasyAR.EditorTools.EasyARDeviceBuildHelper.Build
```

For iOS, use an output folder such as `Builds/iOS` and complete signing in Xcode or Unity Player Settings.

## 9. Debug Logs

If Unity compilation, Editor automation, or device builds fail, pass the relevant log excerpt back to the MCP server:

```text
easyar_analyze_unity_log logText="..."
```

For local log files:

```text
easyar_analyze_unity_log logPath=/path/to/Editor.log
```

The tool classifies common EasyAR license, plugin import, camera permission, C# compile, Android/Gradle, iOS signing, and sample scene issues.
