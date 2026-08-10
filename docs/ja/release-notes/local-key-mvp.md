# mcp-easyar ローカルキー MVP

このプレリリースは、`mcp-easyar`.
 の現在の GitHub 配布パスです。
リリース: `v0.1.0-local-key.41`

## リリースのハイライト

- 24 件すべての公開 Markdown ソース文書について、日本語版とベトナム語版の完全なミラー、ローカライズされた索引、トップレベル README を追加します。
- 文書一覧の一致、完全な長さの翻訳、コードブロックの不変性、ローカライズされたリンクの有効性、リリースパッケージ内の言語別文書の一致を公開前に検証します。
- 制限された Unity CLI `1.0.0-beta.3` プリフライト、公式サンプルのインポート、準備、構成、検証、Android ビルド ワークフローを追加します。
- Android スマートフォンと XREAL 重点シーン ビルドを含むデバイス プロファイルを追加し、APK 出力をリリースします。
- ビルド前に XREAL SDK `3.1.0+`、エンタープライズ カメラ ライセンスの存在、ネイティブ セッション マネージャー、XREAL XR ローダー、OpenGL ES 3、Android API を検証します。
- 会社名カードに対する Samsung S22 イメージ トラッキング パスと `Found` コールバックを繰り返した XREAL Air 2 Ultra Mega ローカリゼーション パスを記録します。
- シークレット ライセンス ファイル、APK、プライベート マップ ID、生のプライベート ログを公開パッケージの外に保持します。

## 現在機能しているもの

- `npm install -g`.
 を使用して GitHub リリース tarball からインストールします。- `easyar-mcp` および `easyar-mcp-check` パッケージ バイナリを公開します。
- Codex、Claude、その他の標準入出力 MCP クライアントを EasyAR Unity ワークフロー ツールに接続します。
- ブラウザのみの登録/login/download/keyセットアップを通じて、初めてまたは登録済みの EasyAR ユーザーをガイドします。
- EasyAR Web サイトのパスワード、確認コード、アカウント トークン、ライセンス キー、API KEY/API シークレット、appKey、appSecret をチャットから除外します。
- 範囲指定された Unity サンプル ランスルー ターゲットをサポートします:
- 画像追跡
- CRS/Cloud 認識
- メガ
- メガ APK インストール/startup やローカリゼーション追跡の証拠など、焦点を絞った範囲のコミットされた安全な Android リリースの証拠が含まれます。
- 公式サンプル シーンに Mega BlockRoot の準備状況検証を追加し、成功したローカライズされたブロック `大厅+办公室+阳台+GPS+0716`.
 を記録します。- 画像追跡、CRS/Cloud 認識、および集中クローズアウトのプロンプトは、クライアントに最初に `easyar://acceptance/fresh-project` を読むように指示するようになりました。
- `easyar-run-wechat-miniprogram` を追加すると、MCP クライアントはチャットでユーザー シークレットを収集せずに、集中した `wechat-mega` および `wechat-crs` ハンドオフを実行できます。
- ミニ プログラムの実行ステータス ツールを追加します。これにより、ユーザーは、公式パッケージのインポート、DevTools チェック、または実際のデバイスの証拠の変更後に単一の次回呼び出しレポートを再生成できます。
- ユーザーがダウンロードした公式 EasyAR パッケージをインポートする前に、安全なプロジェクト シェルを作成するためのミニ プログラム ワークスペース スキャフォールド ツールを追加します。
- ミニ プログラムの公式パッケージのインポートは、抽出されたディレクトリまたはダウンロードされた `.zip` を受け入れ、抽出前に zip エントリ パスを検証し、プライベート設定や秘密のようなファイルをスキップします。
- サーバー ステータス、クイックスタート、インストール ガイド、生成されたクライアント セットアップは、Unity 自動化の前に、新しいユーザーに同じ新しいプロジェクト受け入れリソースを示すようになりました。
- ローカル構成、プリフライト、インポート ガイダンス、ビルド/run シーケンス、ログ診断、C# 計画、スクリプト作成、サポート バンドルのための Unity プロジェクト支援ツールを提供します。

## インストール

Node.js 20 以降を使用します:

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.41/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

次に、次のコマンドを使用して MCP クライアントを構成します。

```bash
easyar-mcp
```

詳細: `docs/install-from-github-release.md`.

## 最初の MCP 通話

```text
easyar_server_status
easyar_authorization_strategy preferredMode=auto sampleId=cloud-recognition platform=android
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_write_local_config_handoff projectPath=/path/to/UnityProject accountStage=logged-in sampleId=cloud-recognition platform=android
easyar_validate_local_config projectPath=/path/to/UnityProject sampleId=cloud-recognition
easyar_next_workflow_step projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
```

画像追跡の場合は、`sampleId` を `image-tracking` に切り替えます。 Mega の場合は、`sampleId` を `mega` に切り替え、EasyAR ポータル パッケージ名、ローカル ライセンス、およびユーザー自身のログイン EasyAR/Mega Studio セッションから選択した Mega ブロックを使用します。

## ローカル キー境界

このリリースでは、ローカル キー MVP パス:

1 を意図的に使用します。ユーザーは、ブラウザで EasyAR 公式 Web サイトの/downloads/createsキーに/logsを登録します。
2.ユーザーは、公式 EasyAR Sense Unity プラグインをインストールします。
3.ユーザーは、Unity プロジェクトのローカルで EasyAR ライセンスとクラウド認識フィールドに入力します。
4. MCP は編集されたローカル プレゼンスのみを検証し、Unity の自動化をガイドします。

公式プラグインとローカル キーが設定された後は、Unity ランタイムでウェブサイトにログインする必要はありません。

## まだ含まれていません

- 公式 EasyAR アカウント/license/download/cloud 資格 API はまだ接続されていません。
- npmレジストリ公開はまだ有効になっていません。
- Hello AR、Surface Tracking、およびその他のサンプルは、このリリース ターゲットの範囲外です。
- このリリースでは、EasyAR ログイン、ライセンス チェック、ダウンロード認証、エンタープライズ ゲート、またはレート制限はバイパスされません。

## 検証

リリース ゲートには次のものが必要です。

- TypeScript typecheck
- MCP スモーク テスト
- パッケージ bin インストール チェック
- パッケージ インストール スモーク テスト
- npm パックのドライ ラン
- リポジトリ セキュリティ チェック
- ローカル キー MVP 画像追跡の証拠、CRS/Cloud 認識とメガ

追加の公開アセット チェック:

```bash
npm run github-release:smoke
```

現在の準備モデル:

- ローカルキー MVP 準備完了: はい
- 製品公式 API 準備完了: いいえ
