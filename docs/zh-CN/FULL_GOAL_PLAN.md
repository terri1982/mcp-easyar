# mcp-easyar 完整目标计划

完整目标是帮助 EasyAR 注册用户通过 Codex、Claude 等 AI 工具完成：

- MCP 安装与客户端配置
- EasyAR 官网账号/插件/key 的安全引导
- Unity Sample 构建与真机验证
- EasyAR Unity 项目编程辅助

## 已完成阶段

local-key MVP 已完成：

- Image Tracking
- CRS / Cloud Recognition
- GitHub Release 正版包
- 默认 core profile 工具数约 66
- 中文 README 和中文文档入口

## 当前扩展阶段

当前正在扩展：

- Mega

已完成 MCP catalog、runbook、readiness check、device validation、MonoBehaviour 模板、日志诊断、Android APK 打包、真机安装启动、一轮 Mega 定位跟踪日志和安全发布证据。fresh project 已完成官方 4002 包导入、APK 打包、真机安装启动、Onsite 模式就绪，并已在对应办公室映射场景抓到定位/跟踪日志信号；接下来跑严格 local-key release gate 并发布新的 GitHub Release，就能把三样本能力正式对外发布。

## 扩展轨道 1：更多 Sample

每个新 Sample 进入已验证范围前，需要：

- 用户明确要求继续该 Sample。
- 明确 Unity 版本、插件版本、平台、配置需求。
- 生成 import checklist、preflight、run sequence、device validation、run result、completion report。
- 真机验证证明 Sample 的核心 AR 行为。

后续建议顺序：

1. Hello AR
2. Surface Tracking
3. 其他 EasyAR Sense Unity Plugin Sample

## 扩展轨道 2：官方 API 生产接入

生产自动化需要 EasyAR 官方服务支持：

- account status endpoint
- license validation endpoint
- downloads entitlement endpoint
- CRS credential metadata endpoint
- MCP token 签发、轮换、验证、吊销机制

没有这些 endpoint 时，使用浏览器 handoff + 本地 key 是安全路线。

## 扩展轨道 3：Unity 编程服务

继续加强：

- 更多真实 Image Tracking / CRS / Mega 项目案例
- 更多 sample-specific 编程 playbook
- 代码改动前生成 programming context 和 code plan
- 代码改动后跑 C# review、compile check、device evidence

## 发布策略

GitHub prerelease 可继续使用 `gate=local-key-mvp`。生产 npm publish 应等待 official API gate 或明确 prerelease policy。
