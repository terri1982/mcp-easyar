# mcp-easyar 路线图

当前路线图分为三层：

## 1. 已发布 local-key MVP

当前版本：`v0.1.0-local-key.38`

已完成：

- Image Tracking
- CRS / Cloud Recognition
- GitHub Release 安装包
- core/full tool profile
- 中文文档入口

当前工作树已补齐：

- Mega：MCP 工作流、Android APK 打包、真机安装启动、EasyAR 初始化、Mega Block 加载和一轮定位跟踪日志证据已完成。fresh project 已完成官方 4002 包导入、APK 打包、真机安装启动、Onsite 模式就绪，并已在对应办公室映射场景抓到定位/跟踪日志信号，可进入下一版 local-key GitHub Release 发布前验证。
- 微信小程序：新增 `wechat-mega` 和 `wechat-crs` 两个 focused sample。当前已完成 MCP 层的本地工程检查、微信开发者工具 CLI 检测、本地配置表、用户本地已下载官方包导入、DevTools 检查、日志分析、preflight、run sequence、真机验证清单、run result 和 completion report，不声明已完成小程序预览/上传/真机验收。

## 2. Sample 扩展

下一批候选：

1. Hello AR
2. Surface Tracking

小程序方向的下一步：

1. 用真实官方小程序 SDK/Sample 包和测试小程序工程跑导入、DevTools 检查和预览。
2. 用真实设备补 `wechat-mega` 定位证据和 `wechat-crs` 识别证据，并让 completion report 变为 complete。
3. 需要上传流程时再补明确的 dry-run / safety gate，不默认发布到微信后台。

扩展前先调用：

```text
easyar_generate_sample_plan sampleId=mega platform=android unityVersion=2022.3.62f3
easyar_generate_sample_expansion_plan sampleId=hello-ar platform=android unityVersion=2022.3.62f3
```

## 3. 生产官方 API

生产接入需要 EasyAR 官方 endpoint。当前开源包只提供合同、handoff、stub、canary 和安全边界，不绕过官网权限。

## 4. Unity 编程服务

继续围绕真实 Unity 项目增强 preflight、programming context、code plan、C# review、compile/device evidence。当前优先收口三样本 local-key 发布。
