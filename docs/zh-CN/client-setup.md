# mcp-easyar 客户端配置

推荐使用 GitHub Release package-bin 模式。

## 安装

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.37/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## Codex 配置示例

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

## Claude Desktop 配置示例

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

## 首次检查

```text
easyar_server_status
easyar_check_client_setup client=codex entrypointMode=package-bin includeTokenPlaceholder=false
```

## 常见问题

- 如果看不到工具，重启 MCP client。
- 如果工具数仍显示过多，确认没有用 `MCP_EASYAR_TOOL_PROFILE=full` 启动。
- 如果安装失败，检查 Node.js 版本和 GitHub Release URL。
