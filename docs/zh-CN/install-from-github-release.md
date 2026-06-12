# 从 GitHub Release 安装 mcp-easyar

当前推荐安装方式是 GitHub Release tarball：

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.34/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## Node.js

需要 Node.js 20 或更新版本。

## Codex / Claude 配置

安装后 MCP client 使用 package binary：

```json
{
  "mcpServers": {
    "easyar": {
      "command": "easyar-mcp",
      "args": []
    }
  }
}
```

也可以让 MCP 生成配置：

```text
easyar_generate_client_config client=codex entrypointMode=package-bin includeTokenPlaceholder=false
easyar_check_client_setup client=codex entrypointMode=package-bin includeTokenPlaceholder=false
```

## 工具数量

默认 core profile 约 57 个工具；需要全量维护工具时：

```bash
MCP_EASYAR_TOOL_PROFILE=full easyar-mcp
```

## 安全

安装检查不需要 EasyAR 官网密码、license key、API KEY、API Secret、appKey 或 appSecret。
