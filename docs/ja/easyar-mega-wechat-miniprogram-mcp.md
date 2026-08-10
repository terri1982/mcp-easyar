# EasyAR Mega WeChat Mini プログラム MCP 設計

この文書は、Codex、Claude、または別の MCP クライアントに公式 WeChat Mini プログラム サンプルを準備、検査、実行、検証してもらいたい登録済み EasyAR Mega ユーザー向けの MCP サービス範囲を定義します。

サービスは、EasyAR パスワード、WeChat パスワード、検証コード、生の API チャット内のトークン、ライセンス キー、アプリ キー、アプリ シークレット、またはプライベート証明書。シークレット値は、ローカル環境変数、ローカルの追跡されていない構成ファイル、オペレーティング システムのキーチェーン、または公式プラットフォーム セッションから読み取る必要があります。

## 目標

- 公式 Mega アカウント、ライセンス、SDK、サンプル アクセスを通じて登録済み EasyAR ユーザーをガイドします。
- ローカル WeChat ミニ プログラム サンプル ワークスペースを作成または修復します。
- EasyAR Mega を検証するシークレットを公開せずにローカル構成を作成します。
- Codex と Claude に焦点を当てたサンプル Runbook とハンドオフ アーティファクトを生成します。
- 利用可能な場合、WeChat 開発者ツールと統合しますCLI。
- コンパイル、プレビュー、アップロード、および実際のデバイスの検証のための証拠を作成します。

## 非目標

- EasyAR アカウント チェック、ダウンロード ゲート、ライセンス チェック、またはレート制限をバイパスします。
- ユーザー認証情報を使用して EasyAR または WeChat ログイン フォームを自動化します。
- 生成された Markdown アーティファクトに秘密を保存します。
- デバイスの証拠がなくてもサンプルが完全であると主張します。

## コア ツール インターフェイス

## 現在実装されている MVP ツール

現在のリポジトリは、最初の安全なローカルキー ミニ プログラム スライスを実装しています:

- `easyar_list_miniprogram_samples`
- `easyar_check_wechat_devtools`
- `easyar_inspect_miniprogram_project`
- `easyar_generate_miniprogram_local_config_form`
- `easyar_write_miniprogram_local_config_form`
- `easyar_generate_miniprogram_preflight`
- `easyar_write_miniprogram_preflight`
- `easyar_generate_miniprogram_run_sequence`
- `easyar_write_miniprogram_run_sequence`
- `easyar_import_miniprogram_sample_from_local_package`
- `easyar_analyze_miniprogram_devtools_log`
- `easyar_run_miniprogram_devtools_check`
- `easyar_generate_miniprogram_device_validation_checklist`
- `easyar_write_miniprogram_device_validation_checklist`
- `easyar_generate_miniprogram_run_result_form`
- `easyar_write_miniprogram_run_result_form`
- `easyar_write_miniprogram_run_result`
- `easyar_generate_miniprogram_completion_report`
- `easyar_write_miniprogram_completion_report`
- `easyar_generate_miniprogram_scope_status`
- `easyar_write_miniprogram_scope_status`

サポートされている重点サンプル ID:

- `wechat-mega`
- `wechat-crs`

これらのツールは、ローカル ファイルの検査、ユーザーがダウンロードした公式ローカル パッケージのインポート、CLI が使用可能な場合のローカル DevTools スモーク チェックの実行、実際のデバイス検証フォームの作成、編集されたローカルからの完了レポートの生成を行います。証拠。ドライラン サポートのアップロードと実際のデバイス ミニ プログラムの証拠キャプチャは、公式のローカル サンプル パッケージ、ログイン済みの WeChat 開発者ツール、およびテスト プロジェクトが利用可能になるまで、今後の作業となります。

### サーバーとカタログ

- `easyar_mega_server_status`
- 目的: サーバーのバージョン、サポートされているプラ​​ットフォーム、構成された公式エンドポイント、ローカル ツールの可用性、推奨される最初の呼び出しを返します。
- 入力: なし。
- 出力: 機能の概要、認証状態、プラットフォームの状態、次の呼び出し。

- `easyar_mega_official_info`
- 目的: 公式リンク、キャプチャされた SDK/sample バージョンのメタデータ、およびサポート範囲を返します。
- 入力: オプションの `locale`.
- 出力: リンク、パッケージ名、バージョンノート、鮮度タイムスタンプ。

- `easyar_mega_list_samples`
- 目的: サポートされている WeChat ミニ プログラムのサンプル カテゴリをリストします。
- 入力: オプションの `scope`.
- 出力: サンプル ID、必要な機能、実装ステータス。
- 推奨される重点サンプル ID: `image-tracking`、`cloud-recognition`、`geo-spatial`、`mega-scene`.

### アカウントと公式アクセス

- `easyar_mega_auth_status`
- 目的: ローカルの公式 API 環境変数が設定されているかどうかを報告します。
- 入力: なし。
- 出力: ブール値のみ。トークンのプレビューは編集する必要があります。

- `easyar_mega_account_onboarding`
- 目的: ブラウザのハンドオフとしてガイド登録/loginします。
- 入力: `accountStage`、オプションの `sampleId`.
- 出力: 公式ブラウザーアクション、プロンプトに戻る、次の MCP 呼び出し。

- `easyar_mega_account_materials`
- 目的: 必要なアカウント マテリアルと各値が存在する場所をリストします。
- 入力: `sampleId`、`platform=wechat-miniprogram`.
- 出力: フィールド ソース、ストレージ パス、共有ポリシー。

- `easyar_mega_check_account`
- 目的: 構成された公式アカウント ステータス エンドポイントを呼び出します。
- 入力: なし。
- 出力: 構成済み/ok/statusCode/summary、サニタイズされた詳細

- `easyar_mega_validate_license`
- 目的: EasyAR Mega ライセンスがミニ プログラム アプリ ID に対して有効であることを確認します。
- 入力: `projectPath`、オプションの `appId`、オプションの `licenseKey`.
- 出力: OK、バインディングの概要、編集された詳細、次のアクション。

- `easyar_mega_discover_downloads`
- 目的: アカウント認証された Mega SDK および公式サンプル パッケージを発見します。
- 入力: `sampleId`、オプションの `sdkVersion`、オプションの `miniprogramBaseLibVersion`.
- 出力: パッケージのメタデータと公式のダウンロード手順。未承認の直接ダウンロードではありません。

- `easyar_mega_check_official_access`
- 目的: アカウント、ライセンス、ダウンロード、サンプル固有の公式アクセス チェックをまとめて実行します。
- 入力: `projectPath`、`sampleId`.
- 出力: pass/blocker 行列.

### WeChat ミニ プログラム プロジェクトの検査

- `easyar_mega_inspect_miniprogram_project`
- 目的: ローカルのミニ プログラム構造を検査します。
- 入力: `projectPath`.
- 出力: `project.config.json`、`app.json`、`miniprogram/`、ページ、コンポーネント、npm ステータス、EasyAR ファイル、SDK ファイルの存在。

- `easyar_mega_check_wechat_devtools`
- 目的: WeChat 開発者ツール CLI.
 を検索して検証します。- 入力: オプションの `cliPath`、オプションの `candidateDirs`.
- 出力: 検出されたパス、バージョン コマンドの結果、ログイン要件のヒント。

- `easyar_mega_check_sample_readiness`
- 目的: 選択したサンプルを実行する前に、ローカル ブロッカーをレポートします。
- 入力: `projectPath`、`sampleId`.
- 出力: アプリ ID、構成、SDK インポート、ページ、権限、ドメイン/network ホワイトリスト、アセット、パッケージ マネージャーをチェックします。

- `easyar_mega_generate_focused_preflight`
- 目的: 実行またはアップロードする前に単一ゲートを生成します。
- 入力: `projectPath`、`sampleId`、オプションの `target=devtools|device`.
- 出力: アカウント、構成、プロジェクト、SDK、DevTools、サンプル準備マトリックス

- `easyar_mega_write_focused_preflight`
- 目的: `easyar-generated/<sampleId>/PREFLIGHT.md`.
 と書き込みます。- 入力: プリフライトと同じに `overwrite`.
 を加えたもの- 出力: パスと概要が書き込まれます。

### ローカル構成とシークレットの処理

- `easyar_mega_prepare_miniprogram_project`
- 目的: 生成されたディレクトリ、構成テンプレート、`.gitignore` ルール、およびサンプル Runbook を作成します。
- 入力: `projectPath`、`sampleId`.
- 出力: 書き込まれたファイルと次のアクション。

- `easyar_mega_generate_local_config_form`
- 目的: `easyar.mega.local.json`.
 の入力可能な非秘密フォームを表示します。- 入力: `projectPath`、`sampleId`.
- 出力: フィールド リスト、プレースホルダー、公式ソース、代替環境

- `easyar_mega_write_local_config_form`
- 目的: `easyar-generated/<sampleId>/LOCAL_CONFIG_FORM.md`.
 と書き込みます。- 入力: `projectPath`、`sampleId`.
- 出力: 書き込まれたパス。

- `easyar_mega_write_local_config_from_env`
- 目的: 環境に裏付けられたシークレットからローカル構成を書き込みます。
- 入力: `projectPath`、`sampleId`.
- 環境の読み取り: `EASYAR_MEGA_LICENSE_KEY`、`EASYAR_MEGA_APP_KEY`、`EASYAR_MEGA_APP_SECRET`、`WECHAT_MINIPROGRAM_APP_ID`.
- 出力: 存在と検証結果のみ。

- `easyar_mega_validate_local_config`
- 目的: シークレットを返さずに、必要なローカル構成フィールドを検証します。
- 入力: `projectPath`、`sampleId`.
- 出力:/placeholder フィールドと次のアクションが欠落しています。

### サンプルのインポートとコード生成

- `easyar_mega_generate_import_checklist`
- 目的: 公式の SDK/sample インポート チェックリストを生成します。
- 入力: `projectPath`、`sampleId`.
- 出力: 順序付けされたステップと検証呼び出し。

- `easyar_mega_import_sample_from_local_package`
- 目的: ローカルにダウンロードした公式サンプルをプロジェクトにコピーします。
- 入力: `projectPath`、`packagePath`、`sampleId`、オプションの `dryRun`.
- 出力: ファイル プランまたはコピーされたファイル。

- `easyar_mega_generate_run_sequence`
- 目的: サンプルの順序付けされた Codex/Claude ワークフローを生成します。
- 入力: `projectPath`、`sampleId`、`target=devtools|device`.
- 出力: ステップ、コマンド、証拠フィールド。

- `easyar_mega_write_run_sequence`
- 目的: `RUN_SEQUENCE.md`.
 と書き込みます。- 入力: `projectPath`、`sampleId`、ターゲット
- 出力: 書き込まれたパス。

- `easyar_mega_generate_code_plan`
- 目的: コードを記述する前に、ミニ プログラム JS/TS/WXML/WXSS の編集を計画します。
- 入力: `projectPath`、`sampleId`、`changeGoal`.
- 出力: スコープ指定されたファイル計画とテスト計画。

- `easyar_mega_write_miniprogram_file`
- 目的: JS/TS/WXML/WXSS/JSON ファイルをミニ プログラム ルートに安全に書き込みます。
- 入力: `projectPath`、`relativePath`、`content`、オプションの `overwrite`.
 - 出力: 書き込まれたパスと安全性チェック。

- `easyar_mega_create_sample_page`
 - 目的: 必要なページ登録を含む焦点を絞ったサンプル ページを作成します。
 - 入力: `projectPath`、`sampleId`、`pagePath`.
 - 出力: 生成されたファイルとアプリ/page 構成の変更。

- `easyar_mega_review_miniprogram_code`
 - 目的: EasyAR メガおよびミニ プログラムのリスクの静的レビュー。
 - 入力: `projectPath`、オプション `paths`.
 - 出力: シークレット、権限、ライフサイクル、SDK 初期化、キャンバス/camera 使用、非同期クリーンアップの結果。

### WeChat DevTools Automation

- `easyar_mega_run_miniprogram_compile_check`
 - 目的: WeChat 開発者ツールを呼び出します CLI コンパイル/open 利用可能な場合チェックします。
 - 入力: `projectPath`、オプション `cliPath`、オプション `logPath`。
 - 出力: 終了ステータス、サニタイズされたログ分析、次のアクション。

- `easyar_mega_run_devtools_preview`
 - 目的: DevTools を通じてプレビュー QR コードを作成します CLI.
 - 入力: `projectPath`、オプションの `cliPath`、オプションの `qrOutputPath`.
 - 出力: QR パス、ログ概要、既知ブロッカー。

- `easyar_mega_run_devtools_upload_dry_run`
 - 目的: ローカル ワークフローでサポートされている場合、公開せずにアップロード設定を検証します。
 - 入力: `projectPath`、バージョン、説明。
 - 出力: コマンド プラン、セーフティ ゲート、ローカル検証結果。

- `easyar_mega_analyze_devtools_log`
 - 目的: 一般的なプロジェクト、アプリ ID、ドメイン、パッケージ、EasyAR の問題について WeChat DevTools ログを分析します。
 - 入力: `logPath` または `logText`、オプション `sampleId`。
 - 出力: 分類された問題と次のアクション。

### デバイス検証とハンドオフ

- `easyar_mega_generate_device_validation_checklist`
 - 目的: 実デバイス検証チェックリストを作成します。
 - 入力: `projectPath`、`sampleId`、`devicePlatform=ios|android`。
 - 出力: 予期されるカメラ、ネットワーク、許可、認識、追跡証拠。

- `easyar_mega_write_device_validation_checklist`
 - 目的: 書き込み `DEVICE_VALIDATION.md`.
 - 入力: プロジェクト パス、サンプル ID、デバイス プラットフォーム。
 - 出力: 書き込まれたパス。

- `easyar_mega_generate_run_result`
 - 目的: コンパイル、プレビュー、アップロード、およびデバイスの試行。
 - 入力: `projectPath`、`sampleId`、`overallStatus`、証拠フィールド。
 - 出力: 編集された結果の概要。

- `easyar_mega_write_run_result`
 - 目的: `RUN_RESULT.md` を書き込みます。
 - 入力: 実行結果と同じ。
 - 出力: 書かれたパス。

- `easyar_mega_generate_completion_report`
 - 目的: サンプルが本当に実行されたかどうかを判断する。
 - 入力: `projectPath`、`sampleId`。
 - 出力: `runThroughComplete`、ブロッカー リスト、証拠リスト。

- `easyar_mega_write_completion_report`
 - 目的: `COMPLETION_REPORT.md` を書き込みます。
 - 入力: プロジェクト パスとサンプル ID。
 - 出力: 書き込まれたパス。

- `easyar_mega_generate_issue_report`
 - 目的: 失敗したサンプルの編集されたサポート問題を生成します。
 - 入力: `projectPath`、`sampleId`、ステータス、症状。
 - 出力: シークレットなしのマークダウン レポート。

## リソース インターフェイス

- `easyar-mega://samples/catalog`
- `easyar-mega://official/info`
- `easyar-mega://official/api-contract`
- `easyar-mega://wechat/checklist`
- `easyar-mega://workflow/quickstart`
- `easyar-mega://security/secrets`

## プロンプト インターフェイス

- `easyar-mega-run-image-tracking`
- `easyar-mega-run-cloud-recognition`
- `easyar-mega-miniprogram-code-review`
- `easyar-mega-validate-official-access`
- `easyar-mega-device-validation`

## ツールごとのテスト戦略

各ツールに 3 つのレイヤーを使用します。

1. スキーマテスト
- 有効な最小限の入力を使用して MCP ツールを呼び出します。
- 無効な enum/path/missing 必須入力を使用して呼び出します。
- Zod/MCP エラーは明確であり、シークレットは含まれていないことをアサートします。

2. 治具テスト
- `project.config.json`、`app.json`、ページ、偽の EasyAR SDK ファイル、および偽のログを含む一時的な偽のミニ プログラム プロジェクトを使用します。
- 返された準備チェック、ブロッカー、書き込まれたパス、およびマークダウン コンテンツをアサートします。

3. 統合スモークテスト
- MCP サーバーを stdio 経由で起動します。
- `initialize`、`tools/list`、選択された `tools/call`、`resources/list`、および選択された `resources/read` を実行します。
- JSON-RPC 応答が有効であることをアサートし、サーバーは正常に終了します。

推奨されるインターフェイスごとのテスト:

- サーバー/catalog ツール: ツール/resources/promptsがリストされ、焦点を絞ったサンプルが存在することを確認します。
- アカウント ツール: 欠落しているエンドポイント、欠落しているトークン、偽 200、偽 401、シークレット編集をテストします。
- プロジェクトの検査: 空のフォルダー、部分的なミニ プログラム、有効なミニ プログラム、およびサブパッケージを含むワークスペースをテストします。
- 構成ツール: 欠落している構成、プレースホルダー構成、有効な構成、クラウド認識構成、env-backed Writer をテストします。
- インポート ツール: ドライ ランのテスト、パッケージの欠落、許可されたルート外のパッケージ、false の上書き、true の上書き。
- コード ツール: 安全な相対パス、パス トラバーサルの拒否、JSON 登録更新、シークレット スキャンをテストします。
- DevTools ツール: テスト CLI の欠落、偽の CLI 成功、偽の CLI 失敗、ログ分類。
- デバイス/report ツール: テストがブロックされた、失敗した、デバイス証拠なしで合格、デバイス証拠ありで合格。

## プラットフォームのサポートとプラットフォームのテスト

### コーデックス

サポートされているエントリポイント:

- ローカル距離: `node /absolute/path/to/dist/index.js`
- パッケージ bin: `easyar-mcp`
- npx: `npx -y mcp-easyar`

テスト:

- `easyar_mega_generate_client_config client=codex`.
 を使用して Codex 構成を生成します。- `easyar_mega_server_status`.
 を実行します。- フィクスチャ プロジェクトで `easyar_mega_inspect_miniprogram_project` を実行します。
- `easyar_mega_write_focused_preflight` を実行し、生成された Markdown を確認します。
- コントロールされたサンプル編集後に `easyar_mega_review_miniprogram_code` を実行します。

### クロード デスクトップ

サポートされているエントリポイント:

- クロード デスクトップ JSON.
 で構成された stdio MCP サーバー
テスト:

- `easyar_mega_generate_client_config client=claude-desktop`.
 を使用してクロード構成を生成します。- `tools/list` にすべての EasyAR Mega ツールが表示されていることを確認します。
- クロードに `easyar_mega_server_status` に電話するよう依頼してください。
- クロードに、フィクスチャ プロジェクトに `LOCAL_CONFIG_FORM.md` と `PREFLIGHT.md` を作成するよう依頼します。
- 生成されたアーティファクトにシークレット値が含まれていないことを確認します。

### 汎用 MCP クライアント

サポートされるエントリポイント:

- 標準入出力および MCP ツールをサポートする任意の MCP クライアント/resources/prompts.

テスト:

- JSON-RPC `initialize`、`tools/list`、`resources/list`、および 3 つの代表的な `tools/call` リクエストを使用した stdio スモーク テスト。
- 宣言された MCP プロトコル バージョンとの互換性を検証します。

### WeChat 開発者ツール

サポート対象面:

- インストールおよびログイン時のコンパイル検証用のローカル DevTools CLI/open/preview/upload。

テスト:

- CLI が存在しない場合は、明確なブロッカーが返されます。
- 偽の CLIフィクスチャは、成功したコンパイルとプレビューのログを返します。
- 開発者マシンでの実際の CLI テスト:
 - `easyar_mega_check_wechat_devtools`
 - `easyar_mega_run_miniprogram_compile_check`
 - `easyar_mega_run_devtools_preview`
- プレビューが成功したときに QR 出力パスが存在することを検証します。
- ログが編集され分類されていることを検証します。

### EasyAR 公式バックエンド

サポート対象面:

- アカウント、ライセンス、ダウンロード、サンプル メタデータの構成可能な公式エンドポイント。

テスト:

- エンドポイントが存在しない場合は、configured=false が返されます。
- トークンが存在しない場合、configured=true と ok=null が返されます。
- モック 200 は、ok=true を返します。
- モック 401/403 は、ok=false と account/license の次のアクションを返します。
- トークンに一致する応答フィールド/key/secret/license/passwordは編集されます再帰的に。

### GitHub アクションまたはその他の CI

サポート対象面:

- 非シークレット パッケージ、タイプチェック、スモーク、フィクスチャ テスト。

テスト:

- `npm run typecheck`
- `npm test`
- `npm run package:smoke`
- 実際の EasyAR または WeChat シークレットは必要ありません。
- オプションの夜間ジョブでは、CI シークレット ストレージからの公式テスト アカウント シークレットを使用できます。

### macOS、Windows、Linux

サポート予定:

- MCP サーバー自体は、Node.js 20 回以上実行できる場所で実行する必要があります。
- WeChat 開発者ツールの自動化は、DevTools CLI がインストールされている開発者マシンで主に検証されます。

テスト:

- 絶対パスとスペースのパス処理。
- 実行可能ファイルの検出プラットフォーム。
- すべての OS ターゲットでのフィクスチャ プロジェクト テスト。
- macOS および Windows 開発者マシンで実際の DevTools CLI が実行されます。

## 推奨される最初のユーザー フロー

1. `easyar_mega_server_status`
2. `easyar_mega_account_onboarding accountStage=logged-in sampleId=image-tracking`
3. `easyar_mega_account_materials sampleId=image-tracking`
4. `easyar_mega_prepare_miniprogram_project projectPath=/path/to/miniprogram sampleId=image-tracking`
5. `easyar_mega_write_local_config_form projectPath=/path/to/miniprogram sampleId=image-tracking`
6.ユーザーはチャット外でローカル構成を入力するか、環境変数を設定します。
7. `easyar_mega_validate_local_config projectPath=/path/to/miniprogram sampleId=image-tracking`
8. `easyar_mega_check_wechat_devtools`
9. `easyar_mega_write_focused_preflight projectPath=/path/to/miniprogram sampleId=image-tracking`
10. `easyar_mega_run_miniprogram_compile_check projectPath=/path/to/miniprogram`
11. `easyar_mega_run_devtools_preview projectPath=/path/to/miniprogram`
12.実デバイスのスキャンと検証。
13. `easyar_mega_write_run_result`
14. `easyar_mega_write_completion_report`
