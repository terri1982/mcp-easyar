# mcp-easyar 路线图

当前路线图分为三层：

## 1. 已发布 local-key MVP

当前版本：`v0.1.0-local-key.32`

已完成：

- Image Tracking
- CRS / Cloud Recognition
- GitHub Release 安装包
- core/full tool profile
- 中文文档入口

## 2. Sample 扩展

下一批候选：

1. Hello AR
2. Surface Tracking

扩展前先调用：

```text
easyar_generate_sample_expansion_plan sampleId=hello-ar platform=android unityVersion=2022.3.62f3
```

## 3. 生产官方 API

生产接入需要 EasyAR 官方 endpoint。当前开源包只提供合同、handoff、stub、canary 和安全边界，不绕过官网权限。

## 4. Unity 编程服务

继续围绕真实 Unity 项目增强 preflight、programming context、code plan、C# review、compile/device evidence。
