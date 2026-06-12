# mcp-easyar 剩余工作

## 当前已完成

- 当前公开版本：`v0.1.0-local-key.34`
- Image Tracking 已真机跑通。
- CRS / Cloud Recognition 已真机跑通。
- Mega MCP 工作流、Android APK 打包、真机安装启动和 Mega 定位跟踪证据已完成。
- GitHub Release tarball 安装验证通过。
- 默认工具数已缩减到约 57。
- 中文 README 和中文文档入口已加入。

## 当前范围内剩余

- 每次新发布保持 release link、安装文档、smoke test 同步。
- 跑严格三样本 local-key release gate，并在通过后发布新的 GitHub Release。
- Unity、插件版本或目标平台变化时，重新跑 Image Tracking / CRS / Mega 真机证据。
- 继续用真实项目硬化 Unity 编程工具链。

## 不属于当前 local-key MVP 的内容

- 跑通所有 EasyAR Sample。
- 收集官网密码、验证码、license key 或 CRS secret。
- 用网页抓取绕过官方 API。
- 生产 npm publish。

## 完整生产目标剩余

- EasyAR 官方 account/license/download/CRS endpoint。
- 生产 token 策略。
- Hello AR、Surface Tracking 和其他 Sample 的真机验收证据。
- 严格 production release gate。
