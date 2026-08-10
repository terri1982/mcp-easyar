# mcp-easyar local-key MVP 发布说明

当前版本：`v0.1.0-local-key.41`

## 重点

- GitHub Release 正版 tarball 发布。
- 日文和越南语已完整对应 24 篇公开 Markdown 源文档，覆盖验收、官方 API、计划、排错、微信小程序、发布说明和 release evidence，并纳入本地与发布包双重完整性校验。
- 默认 core profile 工具数约 70。
- full profile 保留全部维护工具。
- 新增中文 README 和中文文档目录。
- Image Tracking、CRS / Cloud Recognition 与 Mega 已完成 Android 真机验证。
- 增加 Mega BlockRoot 配置检查，并记录已定位到 `大厅+办公室+阳台+GPS+0716`。
- 增加微信小程序 Mega/CRS prompt 与 run-through status 工具，用于在官方包导入、DevTools 检查和真机证据变化后生成下一步建议。
- 增加微信小程序 workspace scaffold 工具，可在导入用户官网下载的官方 EasyAR 包之前创建安全的小程序工程壳。
- 微信小程序官方包导入支持已解压目录和下载到本机的 `.zip`，解压前会校验 zip 条目路径，并继续跳过私密配置和疑似密钥文件。
- 新增 Unity CLI `1.0.0-beta.3` 的受限 preflight、官方 Sample 导入、准备、配置、校验和 Android 构建流程。
- 新增 Android 手机与 XREAL profile；XREAL 构建前会校验 XREAL SDK `3.1.0+`、Enterprise 相机授权文件、Native Session Manager、XR Loader、OpenGL ES 3 和 Android API 29。
- 已完成三星 S22 公司名片 Image Tracking 与 XREAL Air 2 Ultra Mega 地图定位真机验收，眼镜端连续返回 `Found`。
- License、APK、私有地图标识和原始私密日志不会进入发布包。

## 安装

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.41/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## 生产 API 状态

Production official API ready: no

仍需 EasyAR 官方 account/license/download/CRS endpoint。
