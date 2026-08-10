# mcp-easyar クライアントのセットアップ

このガイドは、Codex、Claude Desktop、または別の標準入出力 MCP クライアントを `mcp-easyar` に接続するときに使用します。

## プロファイルのインストール

### ローカル リポジトリ

リポジトリを直接開発またはテストするときにこれを使用します。

```bash
npm install
npm run build
npm run install:check
```

MCP 起動:

```json
{
  "mcpServers": {
    "easyar": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-easyar/dist/index.js"],
      "env": {
        "EASYAR_API_BASE_URL": "https://www.easyar.cn"
      }
    }
  }
}
```

ローカル構成スニペットを生成します:

```text
easyar_generate_client_config client=claude-desktop entrypointMode=local-dist serverPath=/absolute/path/to/mcp-easyar/dist/index.js
easyar_check_client_setup client=claude-desktop entrypointMode=local-dist serverPath=/absolute/path/to/mcp-easyar/dist/index.js
```

### GitHub リリース パッケージ

これを現在のローカルキー MVP GitHub リリースに使用します。これにより、npm レジストリの公開を待たずにパッケージ バイナリがインストールされます。

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.41/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

クロード デスクトップMCP 起動:

```json
{
  "mcpServers": {
    "easyar": {
      "command": "easyar-mcp",
      "args": [],
      "env": {
        "EASYAR_API_BASE_URL": "https://www.easyar.cn"
      }
    }
  }
}
```

Codex MCP の起動では同じ stdio 形状が使用されます:

```json
{
  "mcpServers": {
    "easyar": {
      "command": "easyar-mcp",
      "args": [],
      "env": {
        "EASYAR_API_BASE_URL": "https://www.easyar.cn"
      }
    }
  }
}
```

package-bin 構成スニペットを生成します:

```text
easyar_generate_client_config client=claude-desktop entrypointMode=package-bin
easyar_generate_client_config client=codex entrypointMode=package-bin includeTokenPlaceholder=false
easyar_check_client_setup client=claude-desktop entrypointMode=package-bin
```

### npm 公開後のグローバル npm パッケージ

パッケージが npm に公開された後にこれを使用します。

```bash
npm install -g mcp-easyar
easyar-mcp-check
```

インストール後、上記と同じ `package-bin` MCP 起動設定を使用します。

### npm 公開後の npx パッケージ

クライアント マシンが npm レジストリに到達でき、グローバル インストールを望まない場合は、`mcp-easyar` が npm に公開された後にこれを使用します。現在の GitHub プレリリースの場合は、上記の GitHub リリース パッケージ プロファイルを使用してください。

```bash
npx -y mcp-easyar
```

MCP 起動:

```json
{
  "mcpServers": {
    "easyar": {
      "command": "npx",
      "args": ["-y", "mcp-easyar"],
      "env": {
        "EASYAR_API_BASE_URL": "https://www.easyar.cn"
      }
    }
  }
}
```

npx 構成スニペットを生成します:

```text
easyar_generate_client_config client=codex entrypointMode=npx includeTokenPlaceholder=false
easyar_check_client_setup client=codex entrypointMode=npx includeTokenPlaceholder=false
```

## シークレットの処理

実際の EasyAR 値は、MCP クライアント環境、OS キーチェーン、展開シークレット ストア、またはローカルで無視されるプロジェクト構成に保持してください。

これらの値をチャット、GitHub の問題、コミットされたファイル、または生成されたサポート アーティファクトに貼り付けないでください:

- EasyAR Web サイトのパスワード
- 確認コード
- EasyAR ライセンス キー
- クラウド認識 API キー/API シークレット
- 従来の `appKey`/`appSecret`
- モバイル署名キーまたはプロビジョニング ファイル

インストール チェック ツールとクライアント セットアップ ツールは、存在、エントリポイントの形状、リソースのみを報告します読みやすさと次のアクション。

## 最初の Smoke 呼び出し

クライアントがサーバーを起動した後、次の呼び出しを行います。

```text
easyar_server_status
easyar_auth_status
easyar_release_manifest
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_write_client_setup outputRoot=/path/to/report-folder client=claude-desktop entrypointMode=package-bin
```

MCP リソース `easyar://acceptance/fresh-project` も読み取ります。次に、クライアントに Unity オートメーションの実行を要求する前に、生成された `CLIENT_SETUP.md`、`FIRST_RUN.md`、および `PREFLIGHT.md` アーティファクトに従います。

## トラブルシューティング

- `tools/list` が空の場合は、MCP クライアントを再起動し、JSON が `mcpServers.easyar` の下にネストされていることを確認します。
- `local-dist` が失敗した場合は、`npm install && npm run build` を再実行し、絶対 `dist/index.js` パスを使用します。
- `package-bin` が失敗した場合は、MCP クライアントが使用するのと同じシェル環境で `easyar-mcp-check` を実行します。
- npm 公開後に `npx` が失敗した場合は、npm レジストリ/network へのアクセスを確認し、ターミナルで `npx -y mcp-easyar` を実行します。 npm 公開する前に、代わりに GitHub リリース パッケージ プロファイルを使用してください。
- 公式アカウント ツールが `configured=false` を返した場合、ローカルキー MVP のユーザーはそのステータスを無視できます。将来の公式 API 導入では、ユーザー チャットの外側でサービス管理の認証を構成する必要があります。
