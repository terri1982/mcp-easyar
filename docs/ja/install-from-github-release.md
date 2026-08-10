# GitHub Release から mcp-easyar をインストール

推奨インストール方法は GitHub Release tarball です。

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.40/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## 必要条件

- Node.js 20 以降
- Codex、Claude Desktop、または stdio 対応 MCP client

## MCP client 設定

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

core profile では次のように inline 設定レポートを取得できます。

```text
easyar_write_client_setup outputRoot=/path/to/workspace client=codex entrypointMode=package-bin output=inline
```

全保守ツールが必要な場合:

```bash
MCP_EASYAR_TOOL_PROFILE=full easyar-mcp
```

インストール検査は EasyAR パスワード、license key、API KEY、API Secret、appKey、appSecret を必要としません。
