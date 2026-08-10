# mcp-easyar 残りの作業

このページは、Codex、Claude Desktop、およびその他の MCP クライアントに、現在重点を置いているリリース ターゲットに残っているものの安定した非秘密ビューを提供します。

## 現在の範囲

現在のユーザー承認済みのターゲットは以下に制限されています。

- 画像追跡
- CRS/Cloud 認識
- Mega

Hello AR、Surface Tracking、およびその他の EasyAR Sense Unity Plugin サンプルは、ユーザーが明示的に続行を要求するまで、現在のリリース ターゲットの範囲外です。

## 現在の証拠

- 現在の公開プレリリース: `v0.1.0-local-key.41`
- 公開された範囲指定された目標: 承認された画像追跡、CRS/Cloud 認識、および Mega ターゲットについて 100%。
- Android フォン、新しいプロジェクト、PICO 4 Ultra Enterprise、および XREAL Air 2 Ultra ビルド/install/runtime パスを含む大きな証拠が含まれます。実デバイスのローカリゼーション信号。
- ローカルキー MVP パブリック ユーザビリティ: 約 98%
- 画像追跡と CRS/Cloud 認識に関する Android 実デバイスの証拠が存在します。これには、更新された CRS 認識スクリーンショットと 2026 年 6 月 11 日のデバイス ログが含まれます。
- GitHub リリース tarball インストール スモーク パス (Codex および Claude Desktop `package-bin` クライアント セットアップ チェックを含む)。
- 新しい Unity プロジェクト受け入れガイダンスが `docs/FRESH_PROJECT_ACCEPTANCE.md` と `easyar://acceptance/fresh-project` にあります。
- `npx -y mcp-easyar` は将来の npm パブリッシュ用に予約されています。現在の公開プレリリース インストール パスは GitHub リリース tarball です。
- コミットされたローカル構成シークレット、ランタイム シークレット、APK、Unity パッケージ、または明らかなシークレットのような値なしでセキュリティ チェックに合格します。

## 現在の対象範囲のターゲットに残ります

- リリース リンク、ステータス ドキュメント、最新のプロジェクト受け入れガイダンス、インストール チェック、および GitHub リリース スモーク テストを保持します。新しいプレリリースごとに調整されています。
- Unity プロジェクト、EasyAR Sense Unity プラグインのバージョン、サポートされている Unity バージョン、またはターゲット プラットフォームが変更されたときに、イメージ トラッキング、CRS/Cloud 認識、およびメガ デバイスの証拠を再実行します。
- 実際のイメージ トラッキングと CRS プロジェクトで Unity プログラミング ワークフローの強化を継続します。

## 現在の対象範囲のターゲットには必要ありません

- Hello AR、Surface Tracking、またはその他の EasyAR サンプルの実行。
- EasyAR Web サイトのパスワード、確認コード、ライセンス キー、CRS API KEY/API シークレット、`appKey` を収集します。またはチャットで`appSecret`。
- 自動ライセンス/download/cloud認証情報検出のために実際の EasyAR 公式アカウント API を呼び出します。
- 製品リリースとして npm に公開します。
- npm パッケージが存在する前に `npx -y mcp-easyar` を使用します。

## 完全な製品目標の残り

- EasyAR 所有のアカウント ステータス エンドポイント。
- EasyAR 所有のライセンス検証エンドポイント。
- EasyAR 所有のダウンロード資格エンドポイント。
- EasyAR 所有の CRS/Cloud 未処理のプレゼンス フラグとメタデータを返す認識認証情報メタデータ エンドポイントシークレット。
- 登録済み EasyAR ユーザーに対する本番トークンの発行と検証ポリシー。
- 実際の公式 API 証拠を使用した厳格な本番リリース ゲート。

## 最適な次の MCP コール

新規ユーザーまたは新規クライアント設定の場合:

```text
easyar_server_status
easyar_check_client_setup client=codex entrypointMode=package-bin includeTokenPlaceholder=false
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_account_onboarding accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_generate_sample_plan sampleId=mega platform=android unityVersion=2022.3.62f3
```

MCP リソース `easyar://acceptance/fresh-project` もお読みください。

Unity プロジェクトの場合:

```text
easyar_write_project_handoff projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_remaining_work_report projectPath=/path/to/UnityProject platform=android verificationEvidence=passed
easyar_write_focused_scope_status projectPath=/path/to/UnityProject platform=android
```

## 安全境界

現在のリリースは、ローカルキー MVP ルートに従います。ユーザーは登録、ログイン、公式パッケージのダウンロード、license/CRS キーの作成、そして自分のブラウザとファイルシステムでローカルの Unity プロジェクト設定を入力します。 MCP は、編集されたプレゼンス、ステータス、アーティファクト パス、および次のアクションのみをレポートします。
