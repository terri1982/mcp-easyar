# Cài mcp-easyar từ GitHub Release

Cách cài đặt được khuyến nghị là dùng GitHub Release tarball.

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.40/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## Yêu cầu

- Node.js 20 trở lên
- Codex, Claude Desktop hoặc MCP client hỗ trợ stdio

## Cấu hình MCP client

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

Trong core profile, tạo báo cáo cấu hình inline bằng:

```text
easyar_write_client_setup outputRoot=/path/to/workspace client=codex entrypointMode=package-bin output=inline
```

Khi cần toàn bộ công cụ bảo trì:

```bash
MCP_EASYAR_TOOL_PROFILE=full easyar-mcp
```

Kiểm tra cài đặt không yêu cầu mật khẩu EasyAR, license key, API KEY, API Secret, appKey hoặc appSecret.
