# mcp-easyar 当前状态

当前 GitHub 预发布版：`v0.1.0-local-key.33`

安装：

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.33/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## 已完成

- GitHub Release tarball 可安装。
- 默认 core profile 启用约 57 个工具，低于常见 MCP 客户端 80 个工具警告线。
- full profile 仍可通过 `MCP_EASYAR_TOOL_PROFILE=full easyar-mcp` 启用全部维护工具。
- 已跑通并发布验证：
  - Image Tracking
  - CRS / Cloud Recognition
- Codex、Claude Desktop、通用 JSON MCP client 配置生成可用。
- 新用户注册/登录/下载/key 创建采用浏览器引导，不收集官网密码或密钥。
- Unity 项目编程辅助可生成 preflight、scene audit、run sequence、device validation、programming context、code plan、C# review、handoff artifact。

## 未完成

- 其他 EasyAR 官方 Sample 尚未纳入已验证范围。
- 生产官方 API 自动化仍需 EasyAR-owned account/license/download/CRS endpoint。
- npm production publish 仍应等待生产 gate 或明确 prerelease 策略。

## 当前建议

日常使用请安装 GitHub Release 正版包，并保持默认 core profile。
