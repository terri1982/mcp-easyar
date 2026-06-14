# EasyAR 微信小程序 Sample 验收

本文是 `wechat-mega` 和 `wechat-crs` 两个 focused sample 的证据 gate。流程采用 local-key 和官方工具路线：用户在 EasyAR 官网和微信开发者工具中自行登录、下载官方包、在本机填写本地配置；MCP 只检查本地文件和脱敏证据。

不要把 EasyAR 密码、微信密码、验证码、license key、CRS API KEY/API Secret、appSecret、上传密钥、预览二维码或原始私有日志发到聊天里。

## 支持的 Sample

- `wechat-mega`：EasyAR Mega 微信小程序 Sample。
- `wechat-crs`：EasyAR CRS / Cloud Recognition 微信小程序 Sample。

其他微信小程序 Sample 暂不在当前目标内，除非后续明确要求继续扩展。

## 必备本地材料

用户需要在 MCP 之外先准备：

- 一个包含 `project.config.json` 和 `app.json` 的微信小程序工程目录。
- 已安装并已登录的微信开发者工具。
- 用户自己从 EasyAR 官网下载的官方 EasyAR 小程序 SDK/Sample 包。
- 绑定到该小程序 app id 的 EasyAR license。
- `wechat-mega`：Mega app/server 信息，以及选定云定位库/block 元数据。
- `wechat-crs`：CRS app id、服务地址、API KEY、API Secret，以及至少一张已上传的云识别目标图。

## 推荐 MCP 顺序

把 `/path/to/miniprogram` 和 `/path/to/official/package` 替换成本机路径。

```text
easyar_list_miniprogram_samples
easyar_check_wechat_devtools
easyar_write_miniprogram_local_config_form projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_import_miniprogram_sample_from_local_package projectPath=/path/to/miniprogram sampleId=wechat-mega packagePath=/path/to/official/package dryRun=true
easyar_import_miniprogram_sample_from_local_package projectPath=/path/to/miniprogram sampleId=wechat-mega packagePath=/path/to/official/package dryRun=false
easyar_inspect_miniprogram_project projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_preflight projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_run_sequence projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_run_miniprogram_devtools_check projectPath=/path/to/miniprogram sampleId=wechat-mega dryRun=true
easyar_run_miniprogram_devtools_check projectPath=/path/to/miniprogram sampleId=wechat-mega dryRun=false
easyar_analyze_miniprogram_devtools_log projectPath=/path/to/miniprogram sampleId=wechat-mega logPath=easyar-generated/wechat-mega/DEVTOOLS_CHECK.log
easyar_write_miniprogram_device_validation_checklist projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_run_result_form projectPath=/path/to/miniprogram sampleId=wechat-mega
```

CRS 路径把 `sampleId` 改成 `wechat-crs`。

## 真机验收

必须通过微信开发者工具预览到真实手机上，才能声明 Sample 完成。

两个 sample 都要记录：

- 测试手机型号
- 微信版本，如已知
- 是否授权摄像头
- DevTools 预览/打开结果
- 脱敏日志路径或脱敏截图路径
- 简短的观察结果

`wechat-mega` 的必要证明是在选定映射环境中完成真机定位/跟踪。合格证据可以是脱敏日志或截图说明，内容应能证明定位成功、找到 block、开始 tracking，或出现官方 Sample 等价成功信号。

`wechat-crs` 的必要证明是识别到指定云端目标。合格证据可以是脱敏日志或截图说明，内容应能证明目标名称/id 或官方 Sample 识别成功信号。目标图必须已由用户上传到 EasyAR Cloud Recognition 识别库。

## 记录结果

真机预览之后写入 run result。`passedStepIds` 应来自 `DEVICE_VALIDATION.md`。

Mega 示例：

```text
easyar_write_miniprogram_run_result projectPath=/path/to/miniprogram sampleId=wechat-mega overallStatus=passed devtoolsStatus=passed devicePreviewStatus=passed passedStepIds='["official-login","project-preflight","devtools-check","real-device-preview","mega-service-ready","mega-localized-on-device"]' evidenceSummary="Real-device WeChat preview localized in the mapped Mega environment; redacted log/screenshot evidence recorded locally."
easyar_write_miniprogram_completion_report projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_scope_status projectPath=/path/to/miniprogram
```

CRS 示例：

```text
easyar_write_miniprogram_run_result projectPath=/path/to/miniprogram sampleId=wechat-crs overallStatus=passed devtoolsStatus=passed devicePreviewStatus=passed passedStepIds='["official-login","project-preflight","devtools-check","real-device-preview","crs-service-ready","crs-recognized-on-device"]' evidenceSummary="Real-device WeChat preview recognized the intended CRS cloud target; redacted log/screenshot evidence recorded locally."
easyar_write_miniprogram_completion_report projectPath=/path/to/miniprogram sampleId=wechat-crs
easyar_write_miniprogram_scope_status projectPath=/path/to/miniprogram
```

`COMPLETION_REPORT.md` 只有在以下条件都满足时才算 complete：

- `PREFLIGHT.md` 存在，并且没有 blocked check。
- `DEVICE_VALIDATION.md` 存在。
- `DEVTOOLS_CHECK.log` 存在，并且没有已知 blocker finding。
- `RUN_RESULT.md` 显示 `Run-through complete: yes`。
- run result 记录了真实手机预览证据。
- `MINIPROGRAM_SCOPE_STATUS.md` 只有在 `wechat-mega` 和 `wechat-crs` 两个 completion report 都通过后，才会显示 `All Mini Program samples complete: yes`。

## 发布声明原则

不要只凭生成出来的文档就声称 `wechat-mega` 或 `wechat-crs` 已跑通。有效公开声明必须同时具备本地工程 artifacts 和脱敏真机证据。编译/打开成功是有效进展，但不是 Sample 完成。
