# mcp-easyar 路线图

当前路线图分为三层：

## 1. 已发布 local-key MVP

当前版本：`v0.1.0-local-key.34`

已完成：

- Image Tracking
- CRS / Cloud Recognition
- GitHub Release 安装包
- core/full tool profile
- 中文文档入口

当前工作树已补齐：

- Mega：MCP 工作流、Android APK 打包、真机安装启动、EasyAR 初始化、Mega Block 加载和定位跟踪日志证据已完成，等待下一版 local-key GitHub Release。

## 2. Sample 扩展

下一批候选：

1. Hello AR
2. Surface Tracking

扩展前先调用：

```text
easyar_generate_sample_plan sampleId=mega platform=android unityVersion=2022.3.62f3
easyar_generate_sample_expansion_plan sampleId=hello-ar platform=android unityVersion=2022.3.62f3
```

## 3. 生产官方 API

生产接入需要 EasyAR 官方 endpoint。当前开源包只提供合同、handoff、stub、canary 和安全边界，不绕过官网权限。

## 4. Unity 编程服务

继续围绕真实 Unity 项目增强 preflight、programming context、code plan、C# review、compile/device evidence。当前优先收口三样本 local-key 发布。
