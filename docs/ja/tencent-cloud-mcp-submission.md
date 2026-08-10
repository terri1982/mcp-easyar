# Tencent Cloud MCP 提出

このドキュメントは、`mcp-easyar` を Tencent Cloud Developer MCP に送信するための公開された非機密資料を収集します。

## 基本

- 名前: `mcp-easyar`
- 表示名: mcp-easyar
- 中国語の表示名: EasyAR MCP サービス
- カテゴリ: 開発者ツール / 開発者ツール
- タグ: `EasyAR`、`Unity`、`AR`、`Image Tracking`、`Cloud Recognition`、`Mega`、`MCP`、`Codex`、`Claude`
- ライセンス: Apache-2.0
- リポジトリ: https://github.com/terri1982/mcp-easyar
- ホームページ: https://github.com/terri1982/mcp-easyar#readme
- 中国語 README: https://github.com/terri1982/mcp-easyar/blob/main/README.md
- 英語 README: https://github.com/terri1982/mcp-easyar/blob/main/README.en.md
- リリース: https://github.com/terri1982/mcp-easyar/releases/tag/v0.1.0-local-key.41
- tarball のリリース: https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.41/mcp-easyar-0.1.0.tgz
- ロゴ: `assets/easyar-icon.png`

## 簡単な説明

登録済み EasyAR ユーザーが AI コーディング ツールを使用して EasyAR Unity 画像追跡、クラウド認識、メガ サンプルを構築および検証できるようにします。

## 中国語の簡単な説明

登録済み EasyAR ユーザーが、Codex や Claude などの AI ツールを通じて EasyAR Unity の画像追跡、CRS / クラウド認識、メガ サンプルを迅速に構成、構築、検証できるように支援します。

## 長い説明

`mcp-easyar` は、承認された EasyAR Unity ワークフロー用の Model Context Protocol サーバーです。現在のローカル キー MVP は、ユーザーが独自のブラウザで公式 EasyAR Web サイト登録/login/download/key を作成できるようにガイドし、ローカル Unity プロジェクトが構成を検査し、ランブックを生成し、イメージ トラッキング、CRS / クラウド認識、Mega の準備状況を検証し、編集されたサポート アーティファクトを生成するのに役立ちます。 GitHub のデフォルトのドキュメントは中国語ですが、英語 README とミラー化された英語/Chinese ドキュメントがバイリンガル公開用に保持されています。

サーバーは、EasyAR Web サイトのパスワード、確認コード、ライセンス キー、クラウド認識 API シークレット、または `EASYAR_API_TOKEN` をユーザーに要求しません。ユーザーは公式の EasyAR Sense Unity プラグインをインストールし、自分のマシンにローカルの Unity 構成を入力します。

## 中国語の長い説明

`mcp-easyar` は、EasyAR Unity 認定開発プロセス用の MCP サービスです。現在、ローカルキー MVP はイメージ トラッキング、CRS / クラウド認識をカバーし、Mega Sample のローカル構成、ビルド、実デバイス ブート、および検証済みブートを拡張しました。 GitHub のデフォルトのドキュメントは中国語に切り替えられましたが、英語 README と中国語と英語のドキュメントは残りました。ユーザーは、EasyAR 公式 Web サイトの登録、ログイン、プラグインのダウンロード、キーの作成を自分のブラウザーで完了します。 MCP は、Unity のローカル構成のガイド、プロジェクトのステータスの確認、実行リストの生成、ビルドの準備状況の確認、および感度を下げたトラブルシューティング資料の生成を担当します。

このサービスでは、EasyAR 公式 Web サイトのパスワード、確認コード、ライセンス キー、クラウド認識 API シークレット、appSecret または `EASYAR_API_TOKEN` は収集されません。ユーザーは、公式 EasyAR Sense Unity プラグインを自分でインストールし、ローカル Unity プロジェクトでローカル構成を入力する必要があります。

## インストール

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.41/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## MCP コマンド

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

## 最初の通話

```text
easyar_server_status
easyar_check_client_setup client=codex entrypointMode=package-bin includeTokenPlaceholder=false
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_account_onboarding accountStage=not-registered sampleId=cloud-recognition platform=android
```

## セキュリティに関する注意事項

- ユーザーに `EASYAR_API_TOKEN`.
 の提供を求めないでください。- EasyAR Web サイトのパスワードや確認コードを収集しないでください。
- チャットでライセンス キー、クラウド認識 API KEY/API シークレット、`appKey`、または `appSecret` を収集しないでください。
- ローカル Unity 認証情報は `ProjectSettings/EasyAR/easyar.local.json` またはローカル環境変数に残ります。
- 生成されたレポートでは、共通のトークン、キー、パスワード、ライセンス、およびシークレットのフィールドが編集されます。

## 現在のスコープ

- 準備完了: 画像追跡ローカルキー ワークフロー。
- 準備完了: CRS / クラウド認識ローカルキー ワークフロー。
- `v0.1.0-local-key.41` で準備完了: Android APK インストール/startup、新しいプロジェクトの証拠、および物理環境のローカリゼーション証拠を使用したメガ ローカルキー ワークフロー。
- 延期: Hello AR、Surface Tracking、その他の EasyAR 公式サンプル。
- Unity ベースライン: 2022.3.62f3.
