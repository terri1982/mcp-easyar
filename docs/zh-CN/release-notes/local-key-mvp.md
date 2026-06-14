# mcp-easyar local-key MVP 发布说明

当前版本：`v0.1.0-local-key.38`

## 重点

- GitHub Release 正版 tarball 发布。
- 默认 core profile 工具数约 79。
- full profile 保留全部维护工具。
- 新增中文 README 和中文文档目录。
- Image Tracking、CRS / Cloud Recognition 与 Mega 已完成 Android 真机验证。
- 增加 Mega BlockRoot 配置检查，并记录已定位到 `大厅+办公室+阳台+GPS+0716`。
- 增加微信小程序 Mega/CRS prompt 与 run-through status 工具，用于在官方包导入、DevTools 检查和真机证据变化后生成下一步建议。
- 增加微信小程序 workspace scaffold 工具，可在导入用户官网下载的官方 EasyAR 包之前创建安全的小程序工程壳。

## 安装

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.38/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## 生产 API 状态

Production official API ready: no

仍需 EasyAR 官方 account/license/download/CRS endpoint。
