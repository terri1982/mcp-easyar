# mcp-easyar リリース マニフェスト

生成日: 2026-06-11T04:35:00.000Z
パッケージ: mcp-easyar 0.1.0
ビン: easyar-mcp
ノード: >=20
リポジトリ: https://github.com/terri1982/mcp-easyar.git
ドキュメントのインストール準備完了: はい

## 準備モデル

 - ローカルキーMVP: パッケージ/install ドキュメントが合格し、検証コマンドが合格し、Android に焦点を絞った安全な証拠が `docs/release-evidence/focused-scope.android.json` を通じて提供される場合、集中的な画像追跡、クラウド認識、メガ支援の準備が整います。公開された 2 つのサンプルのプレリリースには、画像追跡とクラウド認識の証拠が含まれています。現在のワークツリーには、安全な Mega Android 実デバイスのインストール/localization の証拠、新しいプロジェクト APK 起動/localization の証拠、EasyAR Sense `4003.0.0` Android サンプル起動の証拠、ARMall に対する `4003.0.0` / Mega `2.13.0` Android パス `涂意工位测试专用`、PICO 4 Ultra が含まれています。エンタープライズ ヘッドセットの検証概要、およびクリーンな Android モーション トラッキング カメラ/PandaAPK検証の概要。
- 製品公式 API: EasyAR アカウント、ライセンス、ダウンロード、クラウド認識エンドポイント変数が承認された EasyAR サービスに接続され、集中的な公式アクセス チェックに合格するまで準備が整っていません。
- Unity ランタイムに関するメモ: 公式リリース後EasyAR Sense Unity プラグインがインストールされており、Unity 側のサンプル実行ではローカル ライセンス/APIキー構成が使用され、実行時に Web サイトへのログインは必要ありません。

## 重点スコープ

重点サンプル: 画像追跡、クラウド認識、メガ
遅延サンプル: hello-ar、surface-tracking

## インストール コマンド

- `npm install`
- `npm run build`
- `npm start`

## プロファイルのインストール

### ローカル Git クローン

エントリポイント モード: `local-dist`
可用性: 開発チェックアウト

- `npm install`
- `npm run build`
- クライアント構成: `easyar_generate_client_config client=claude-desktop entrypointMode=local-dist serverPath=/absolute/path/to/mcp-easyar/dist/index.js`

### GitHub リリース パッケージ

エントリポイント モード: `package-bin`
可用性: 現在のパブリック プレリリース パス

- `npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.41/mcp-easyar-0.1.0.tgz`
- `easyar-mcp-check`
- クライアント構成: `easyar_generate_client_config client=claude-desktop entrypointMode=package-bin`

### npm 公開後のグローバル npm パッケージ

エントリポイントモード: `package-bin`
可用性: npm 公開後のみ

- `npm install -g mcp-easyar`
- クライアント構成: `easyar_generate_client_config client=claude-desktop entrypointMode=package-bin`

### npm 公開後の npx パッケージ

エントリポイント モード: `npx`
可用性:npm 公開後のみ

- `npx -y mcp-easyar`
- クライアント構成: `easyar_generate_client_config client=claude-desktop entrypointMode=npx`

## MCP エントリポイント

- 構築された dist エントリポイント: `node /Users/tuyi/Documents/EasyAR 官方 MCP 服务/dist/index.js`
- パッケージ bin: `easyar-mcp`
- インストール チェック: `easyar-mcp-check`
- npm 公開後の npx パッケージ: `npx -y mcp-easyar`

## 検証コマンド

- `npm run typecheck`
- `npm test`
- `npm run bin:smoke`
- `npm run install:check`
- `npm run package:smoke`
- `npm run pack:check`
- `npm run security:check`
- `npm run release:check`
- `EASYAR_RELEASE_EVIDENCE_PATH=docs/release-evidence/focused-scope.android.json EASYAR_RELEASE_PLATFORM=android npm run release:check`
- `EASYAR_RELEASE_REQUIRE_LOCAL_KEY_MVP=1 EASYAR_RELEASE_EVIDENCE_PATH=docs/release-evidence/focused-scope.android.json EASYAR_RELEASE_PLATFORM=android npm run release:check`
- `EASYAR_RELEASE_REQUIRE_PRODUCTION_READY=1 npm run release:check`

## 公開アセットの検証

- `npm run github-release:smoke`

## リリースワークフロー

- GitHub 専用ローカルキー MVP: `gate=local-key-mvp` で手動 `GitHub Release` ワークフローを実行します。焦点を絞った証拠を検証し、npm 互換の tarball を GitHub リリースにアップロードします。
- 運用 npm 公開: 公式 EasyAR アカウント、ライセンス、ダウンロード、クラウド認識エンドポイント変数が構成された後にのみ、手動 `Release` ワークフローを実行します。 `npm publish --provenance` の前にプロダクション ゲートを強制します。

## 最初の MCP 呼び出し

- `easyar_server_status`
- `easyar_release_manifest`
- `easyar_authorization_strategy`
- `easyar_account_onboarding`
- `easyar_account_materials`
- `easyar_check_client_setup`
- `easyar_auth_status`
- `easyar_check_official_access`
- `easyar_next_workflow_step`
- `easyar_write_production_validation`
- `easyar_write_issue_report`

## クライアント セットアップ ツール

- `easyar_generate_client_config`
- `easyar_check_client_setup`
- `easyar_write_client_setup`

## 必要なローカル キー環境

- `EASYAR_UNITY_PATH`
- `EASYAR_RELEASE_PROJECT_PATH`
- `EASYAR_RELEASE_EVIDENCE_PATH`
- `EASYAR_RELEASE_PLATFORM`

ローカルキー MVP ユーザーは `EASYAR_API_TOKEN` を提供する必要はありません。 EasyAR Web サイトの登録、ログイン、ダウンロード、ライセンスの作成、CRS キーの作成、Mega マテリアルのルックアップを独自のブラウザで完了し、ローカルの Unity プロジェクト設定を入力します。

## 高度な公式 API 環境

これらの変数は、将来の EasyAR 所有の実稼働 API 統合専用であり、通常のローカルキー ユーザーには必要ありません。

- `EASYAR_API_BASE_URL`
- `EASYAR_API_TOKEN`
- `EASYAR_ACCOUNT_STATUS_ENDPOINT`
- `EASYAR_LICENSE_VALIDATE_ENDPOINT`
- `EASYAR_DOWNLOADS_ENDPOINT`
- `EASYAR_CLOUD_CREDENTIALS_ENDPOINT`

## 検証環境

- `EASYAR_RELEASE_REQUIRE_LOCAL_KEY_MVP`
- `EASYAR_RELEASE_REQUIRE_PRODUCTION_READY`
- `EASYAR_UNITY_VERSION`
- `EASYAR_BUNDLE_IDENTIFIER`
- `EASYAR_LICENSE_KEY`
- `EASYAR_CANARY_PROJECT_PATH`
- `EASYAR_CANARY_PLATFORM`
- `EASYAR_STUB_HOST`
- `EASYAR_STUB_PORT`
- `EASYAR_STUB_TOKEN`

## 必要なファイル

- OK README.md
- OK README.en.md
- OK README.ja.md
- OK README.vi.md
- OK README.zh-CN.md
- OK .env.example
- OK CHANGELOG.md
- OK LICENSE
- OK SECURITY.md
- OK ドキュメント/quickstart.md
- OK ドキュメント/OFFICIAL_API_CONTRACT.md
- OK ドキュメント/OFFICIAL_API_HANDOFF.md
- OK ドキュメント/openapi/easyar-mcp-account-api.openapi.json
- OK ドキュメント/release-evidence/focused-scope.android.json
- OK ドキュメント/release-evidence/motion-tracking-camera-panda-android.md
- OK ドキュメント/release-evidence/easyar-sense-4003-android-samples.md
- OK ドキュメント/release-evidence/mega-tuyi-workstation-android.md
- OK ドキュメント/release-evidence/mega-pico4-ultra-enterprise-summary.md
- OK ドキュメント/zh-CN/release-evidence/motion-tracking-camera-panda-android.md
- OK ドキュメント/zh-CN/release-evidence/mega-tuyi-workstation-android.md
- OK ドキュメント/zh-CN/release-evidence/mega-pico4-ultra-enterprise-summary.md
- OK ドキュメント/release-notes/local-key-mvp.md
- OK ドキュメント/CLIENT_ACCEPTANCE.md
- OK ドキュメント/FRESH_PROJECT_ACCEPTANCE.md
- OK ドキュメント/client-setup.md
- OK ドキュメント/install-from-github-release.md
- OK ドキュメント/ROADMAP.md
- OK ドキュメント/STATUS.md
- OK ドキュメント/RELEASE_MANIFEST.md
- OK ドキュメント/troubleshooting.md
- OK ドキュメント/zh-CN/README.md
- OK docs/ja/README.md および 24 件すべてのローカライズ済みソース文書
- OK docs/vi/README.md および 24 件すべてのローカライズ済みソース文書
- OK アセット/easyar-icon.png
- OK dist/index.js
- OK dist/easyar-api.js
- OK .github/ISSUE_TEMPLATE/focused-sample-run.yml
- OK .github/workflows/ci.yml
- OK .github/workflows/github-release.yml
- OK .github/workflows/release.yml

## パッケージ ファイル

- dist
- ドキュメント/OFFICIAL_API_CONTRACT.md
- ドキュメント/OFFICIAL_API_HANDOFF.md
- ドキュメント/openapi/easyar-mcp-account-api.openapi.json
- ドキュメント/release-evidence
- ドキュメント/release-notes
- ドキュメント/CLIENT_ACCEPTANCE.md
- ドキュメント/FRESH_PROJECT_ACCEPTANCE.md
- ドキュメント/tencent-cloud-mcp-submission.md
- ドキュメント/client-setup.md
- ドキュメント/install-from-github-release.md
- ドキュメント/ROADMAP.md
- ドキュメント/STATUS.md
- ドキュメント/quickstart.md
- ドキュメント/RELEASE_MANIFEST.md
- ドキュメント/troubleshooting.md
- ドキュメント/zh-CN/README.md
- ドキュメント/zh-CN コアドキュメントとリリース証拠。パッケージ化された tarball からの WeChat ミニ プログラムの内部設計資料は除きます。
- アセット/easyar-icon.png
- スクリプト/github-release-install-smoke.mjs
- スクリプト/official-api-canary.mjs
- スクリプト/official-api-stub.mjs
- .env.example
- README.md
- README.en.md
- README.ja.md
- README.vi.md
- README.zh-CN.md
- CHANGELOG.md
- LICENSE
- SECURITY.md

## スクリプト

- `bin:smoke`: `npm run build && MCP_EASYAR_SMOKE_COMMAND=./dist/index.js node scripts/smoke-test.mjs`
- `build`: `tsc`
- `dev`: `tsx src/index.ts`
- `github-release:smoke`: `node scripts/github-release-install-smoke.mjs`
- `install:check`: `npm run build && node dist/install-check.js`
- `official-api:canary`: `npm run build && node scripts/official-api-canary.mjs`
- `official-api:stub`: `node scripts/official-api-stub.mjs`
- `official-api:stub-smoke`: `node scripts/official-api-stub-smoke.mjs`
- `package:smoke`: `npm run build && node scripts/package-install-smoke.mjs`
- `pack:check`: `npm run build && npm pack --dry-run`
- `postbuild`: `chmod +x dist/index.js dist/install-check.js`
- `release:check`: `node scripts/release-check.mjs`
- `security:check`: `node scripts/security-check.mjs`
- `start`: `node dist/index.js`
- `test`: `npm run build && node scripts/smoke-test.mjs && node scripts/official-api-fixture-smoke.mjs && node scripts/official-api-stub-smoke.mjs && node scripts/openapi-contract-smoke.mjs`
- `typecheck`: `tsc --noEmit`

## 次のアクション

- リリースを公開またはタグ付けする前に検証コマンドを実行します。
- 保護された npm-publish 環境を構成した後、npm 公開用の手動の GitHub Actions Release ワークフローを使用します。
- Codex または Claude に渡す前に、easyar_check_client_setup を使用して MCP クライアント構成パスまたは選択したパッケージ エントリポイントを検証します。 npx は、npm 公開が完了した後にのみ使用してください。
- 公式 EasyAR アカウント トークンとクラウド認識認証情報は、コミットされた構成ファイルから外してください。

## セキュリティ

リリース マニフェストは安全にコミットできます。ここには、シークレット値ではなく、必要な環境変数名とプレースホルダー コマンドがリストされています。
