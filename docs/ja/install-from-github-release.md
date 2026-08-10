# GitHub リリースから mcp-easyar をインストール

このガイドは、現在のローカルキー MVP リリース パス用です。これは、登録済みまたは初めての EasyAR ユーザーが、EasyAR Web サイトのパスワードを MCP 与えることなく、Codex、Claude、または別の MCP クライアントをローカルの Unity ワークフローに接続するのに役立ちます。

現在の対象範囲:

- 画像追跡
- CRS/Cloud 認識

範囲外このリリース ターゲットの場合:

- Hello AR
- Surface Tracking
- その他の EasyAR サンプル

## 1. リリース Tarball をインストールします

Node.js 20 以降を使用します。

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.41/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

`easyar-mcp-check` は、`server-name`、フォーカスされたスコープ、ツール、プロンプト、およびリソースを OK として報告する必要があります。 EasyAR シークレットは必要ありません。

## 2. MCP クライアントを構成します

パッケージ ビン モードの場合、MCP サーバー コマンドは次のとおりです。

```bash
easyar-mcp
```

クロード デスクトップの場合:

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

コーデックスの場合:

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

他の stdio MCP クライアントは、同じコマンド、引数、および環境形式を使用する必要があります。

パッケージが npm にも公開されていない限り、この GitHub プレリリース パスに `npx -y mcp-easyar` を使用しないでください。現在のパブリック インストール ルートは、GitHub リリース tarball に `entrypointMode=package-bin` を加えたものです。

## 3. ローカル キーで開始しますMVP

最初に次の MCP ツールを呼び出します:

```text
easyar_server_status
easyar_authorization_strategy preferredMode=auto sampleId=cloud-recognition platform=android
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
```

Unity セットアップを実行する前に、MCP リソース `easyar://acceptance/fresh-project` もお読みください。

通常の MVP モードは `local-key` です。

ユーザーはブラウザで次のアクションを実行します。

1. EasyAR の公式 Web サイトに登録またはログインします。
2.公式 EasyAR Sense Unity プラグインをダウンロード/installします。
3. Unity パッケージ/bundle識別子の EasyAR Sense ライセンスを作成または検索します。
4.クラウド認識の場合、AppId、クライアントエンド ターゲット認識 URL、API KEY、および API シークレットを作成または検索します。
5. `logged-in` や `has-cloud-credentials` などのアカウント段階のみを指定して MCP クライアントに戻ります。

MCP は EasyAR Web サイトのパスワード、確認コード、生のアカウント トークン、ライセンス キー、API KEY/API シークレット、appKey、またはチャットで appSecret。

## 4. Unity プロジェクトを準備します

ハンドオフ ライターを実行します:

```text
easyar_write_first_run_guide projectPath=/path/to/UnityProject accountStage=logged-in sampleId=cloud-recognition platform=android
easyar_write_local_config_handoff projectPath=/path/to/UnityProject accountStage=logged-in sampleId=cloud-recognition platform=android
easyar_write_local_config_form projectPath=/path/to/UnityProject accountStage=logged-in sampleId=cloud-recognition platform=android
easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
```

ローカルで `ProjectSettings/EasyAR/easyar.local.json` を入力するか、環境に基づいた書き込みを使用します:

```text
easyar_write_local_config_from_env projectPath=/path/to/UnityProject sampleId=cloud-recognition
easyar_validate_local_config projectPath=/path/to/UnityProject sampleId=cloud-recognition
```

検証では、存在とプレースホルダの問題のみが報告されます。シークレット値は出力されません。

## 5. 画像追跡のための集中ワークフローを実行します

:

```text
easyar_next_workflow_step projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_run_sequence projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
```

クラウド認識の場合:

```text
easyar_next_workflow_step projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_run_sequence projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
```

選択したサンプルの準備ができていることが `PREFLIGHT.md` で示された場合にのみ続行します。実際のデバイスを実行した後、次のコマンドを使用して証拠を記録します:

```text
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=image-tracking platform=android overallStatus=passed
easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
```

クラウド認識の実行には `sampleId=cloud-recognition` を使用します。

## 6. トラブルシューティング

MCP クライアントがサーバーを起動できない場合:

```bash
which easyar-mcp
easyar-mcp-check
```

Unity オートメーションがブロックされている場合:

```text
easyar_unity_environment projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_analyze_latest_unity_log projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_support_bundle projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
```

クラウド認識の場合は、`sampleId` を `cloud-recognition` に切り替えます。

## セキュリティ境界

ローカルキー MVP は、リモート アカウントの資格を証明しません。ユーザーが EasyAR の公式 Web サイトを通じてプラグインとキーマテリアルを入手したことを前提としています。実稼働アカウント/license/download/cloud資格の自動化は、別の公式なAPIトラックのままです。

EasyARログイン、ライセンスチェック、ダウンロード認証、エンタープライズゲート、またはレート制限をバイパスしないでください。
