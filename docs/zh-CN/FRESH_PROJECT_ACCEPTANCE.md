# 新 Unity 项目验收

当前已验证目标：

- Image Tracking
- CRS / Cloud Recognition

其他 Sample 需要用户明确要求继续后，再按扩展计划纳入。

## 安装 MCP

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.33/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## Unity 前置条件

- Unity `2022.3.62f3`
- 已安装官方 EasyAR Sense Unity Plugin
- Android 真机或 iOS 真机
- 本地 `ProjectSettings/EasyAR/easyar.local.json`

## Image Tracking 验收

- 官方 sample 已导入。
- 本地 license 已配置。
- Build Settings 指向正确 scene。
- 真机安装启动成功。
- 摄像头对准目标图后识别成功。
- 生成 `RUN_RESULT.md` 和 `COMPLETION_REPORT.md`。

## CRS / Cloud Recognition 验收

- 官方 Cloud Recognition sample 已导入。
- 本地 license、CRS AppId、serverAddress、apiKey、apiSecret 已配置。
- 云端目标库至少有一个可识别目标。
- 真机网络可访问 CRS 服务。
- 摄像头对准云端目标后出现识别结果或 AR 内容。

## 完成标准

`FOCUSED_SCOPE_STATUS.md` 中 `allFocusedSamplesComplete=true`。
