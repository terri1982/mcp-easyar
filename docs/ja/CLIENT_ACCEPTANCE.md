# mcp-easyar クライアント受け入れチェックリスト

このチェックリストは、GitHub リリース tarball、npm パッケージ、ローカル チェックアウト、または npx プロファイルから `mcp-easyar` をインストールした後に使用します。

目標は、Codex、Claude Desktop、または別の標準入出力 MCP クライアントがサーバーを起動し、ツールをリストし/resources最初の EasyAR に到達できることを証明することです。シークレットを公開せずにワークフローを呼び出します。

## インストール チェック

クライアントが使用するのと同じシェル環境からパッケージ チェックを実行します。MCP

```bash
easyar-mcp-check
```

期待される結果:

- `OK server-name`
- `OK tools`
- `OK prompts`
- `OK resources`
- `OK github-release-install`
- `OK local-key-release-notes`
- `OK roadmap`
- `OK focused-scope-workflow`

このチェックでは、EasyAR Web サイトのパスワード、ライセンス キー、クラウド認識 API シークレット、`appKey`、または `appSecret` を必要とすることはできません。

## Package-Bin Client Config

GitHub Release または npm:

 からインストールした後に package-bin モードを使用します。
```text
easyar_generate_client_config client=codex entrypointMode=package-bin includeTokenPlaceholder=false
easyar_generate_client_config client=claude-desktop entrypointMode=package-bin includeTokenPlaceholder=false
easyar_check_client_setup client=codex entrypointMode=package-bin includeTokenPlaceholder=false
easyar_check_client_setup client=claude-desktop entrypointMode=package-bin includeTokenPlaceholder=false
```

予期される MCP コマンド:

```json
{
  "command": "easyar-mcp",
  "args": []
}
```

## 最初のクライアント呼び出し

生成された構成で MCP クライアントを再起動した後、次のコマンドを実行します。

```text
easyar_server_status
easyar_auth_status
easyar_release_manifest
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
```

期待される結果:

- サーバー レポート名 `mcp-easyar`。
- 重点サンプルには `image-tracking` および `cloud-recognition` が含まれます。
- リソースには `easyar://status/current`、`easyar://acceptance/fresh-project`、`easyar://workflow/focused-scope`、および `easyar://workflow/programming`.
 - `easyar://status/remaining-work` は、現在のスコープ指定されたギャップと完全な実運用ブロッカーをシークレットなしでレポートします。
- `easyar_auth_status` は、シークレットの存在をブール値または編集されたプレビューとしてのみレポートします。

## Unity プロジェクトのハンドオフ

Unity プロジェクトの場合、Unity の前にクライアント セットアップ アーティファクトを作成します。自動化:

```text
easyar_write_client_setup outputRoot=/path/to/report-folder client=codex entrypointMode=package-bin
easyar_write_first_run_guide projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_write_local_config_handoff projectPath=/path/to/UnityProject accountStage=logged-in sampleId=cloud-recognition platform=android
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
```

クライアントに Unity バッチ コマンドの実行を依頼する前に、`CLIENT_SETUP.md`、`FIRST_RUN.md`、`LOCAL_CONFIG_HANDOFF.md`、`PREFLIGHT.md` をお読みください。

## 失敗の切り分け

 - `tools/list` が空の場合は、MCP クライアントを再起動し、JSON がネストされていることを確認します。 `mcpServers.easyar`.
- `easyar-mcp` が見つからない場合は、パッケージを再インストールするか、絶対 `node dist/index.js` local-dist 構成を使用します。
- `package-bin` がターミナルでは動作するがクライアントでは動作しない場合は、クライアント環境を調整します `PATH`。
- 公式アカウント ツールがレポートする場合エンドポイント変数が欠落しているため、本番環境の公式 API が意図的に構成されていない限り、ローカル キー ブラウザのハンドオフを続行します。
- Unity 呼び出しが失敗した場合は、プロジェクト ファイルを変更する前に `easyar_write_unity_environment_report` と `easyar_write_focused_preflight` を実行します。

## セキュリティ

EasyAR Web サイトのパスワード、確認コード、ライセンス キー、クラウド認識を貼り付けたりコミットしたりしないでくださいAPIキー/API シークレット、`appKey`、`appSecret`、署名キー、APK、Unity パッケージ、またはプライベート ログ。
