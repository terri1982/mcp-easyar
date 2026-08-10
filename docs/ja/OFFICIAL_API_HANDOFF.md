# mcp-easyar 公式APIハンドオフ

生成時刻: 2026-06-10T15:38:16.374Z
デプロイメントターゲット: 指定なし
サーバー: mcp-easyar 0.1.0
リポジトリ: https://github.com/terri1982/mcp-easyar

## 目的

このハンドオフは、mcp-easyar を承認された登録ユーザー アカウント、ライセンス、ダウンロード、およびクラウド認識サービスに接続する EasyAR バックエンドおよび運用チーム向けです。

ゲートウェイのインポート、サーバー スタブ、およびクライアント生成のための機械読み取り可能な契約: `docs/openapi/easyar-mcp-account-api.openapi.json`

## 環境

ベースURL: https://www.easyar.cn
トークン環境: EASYAR_API_TOKEN
現在構成されたトークン: いいえ

必須変数:
- EASYAR_API_BASE_URL
- EASYAR_API_TOKEN
- EASYAR_ACCOUNT_STATUS_ENDPOINT
- EASYAR_LICENSE_VALIDATE_ENDPOINT
- EASYAR_DOWNLOADS_ENDPOINT
- EASYAR_CLOUD_CREDENTIALS_ENDPOINT

現在の構成:
- EASYAR_API_TOKEN: no
- EASYAR_ACCOUNT_STATUS_ENDPOINT: no
- EASYAR_LICENSE_VALIDATE_ENDPOINT: no
- EASYAR_DOWNLOADS_ENDPOINT: no
- EASYAR_CLOUD_CREDENTIALS_ENDPOINT: no

## 認証境界

ローカルキー MVP: Unity サンプルの実行は、ユーザーが公式 EasyAR Sense Unity プラグインをインストールし、Unity プロジェクトにローカル ライセンス/API キー マテリアルを入力した後に実行できます。 Unity の実行時には Web サイトへのログインは必要ありません。

受け入れられるフォールバック: 公式の API エンドポイントが利用できない場合は、ブラウザのみのハンドオフとローカルキー検証を使用します。 MCP はアカウントの段階と非機密証拠を記録し、ユーザーは EasyAR の公式 Web サイトからプラグイン/key 資料を取得します。

本番自動化に公式サポートが必要な理由:
- アカウントのステータスは EasyAR アカウント システム内でのみ権威があります。 MCP 登録、アカウントの状態、組織のメンバーシップ、または製品の使用権をローカル ファイルから証明することはできません。
- 製品、プラットフォーム、有効期限、Unity バンドル/package 識別子の互換性を証明するには、ライセンスの検証を EasyAR サーバー側のライセンス レコードと照合する必要があります。
- ダウンロードの検出では、EasyAR のログイン、使用権、エンタープライズ、およびレート制限ゲートを考慮する必要があります。 MCP プライベート ダウンロード URL を作成したり、ブラウザ セッションを再利用したりしてはなりません。
 - クラウド認識認証情報の検出は、ユーザーの EasyAR クラウド プロジェクトに属します。 MCP は、ユーザーがランタイム キーをローカルに保存しない限り、メタデータとプレゼンス フラグのみを受信する必要があります。

受け入れられません:
- 本番認証メカニズムとして EasyAR Web サイト ページまたはブラウザ Cookie をスクレイピングします。
- EasyAR Web サイトのパスワード、確認コード、アカウント トークン、ライセンス キーを貼り付けるようユーザーに要求します。API KEY/API シークレット、appKey、または appSecret をチャットに送信します。
- ローカル設定の存在をアカウント資格またはプライベート ダウンロード承認の証拠として扱います。

## エンドポイント マッピング

### account-status

環境: EASYAR_ACCOUNT_STATUS_ENDPOINT
メソッド: GET
期待URL: https://www.easyar.cn/mcp/account/status

ベアラー トークンが登録済み EasyAR ユーザーに属していることを確認し、非シークレット アカウント資格メタデータを返します。

バックエンド所有者の Todo: トークン検証を公式 EasyAR 登録ユーザー アカウント システムにバインドし、非秘密アカウント/entitlement メタデータを返します。

リクエスト フィールド:
- リクエスト本文フィールドなし。

必須のレスポンス フィールド:
- ok
- account.id
- account.registered
- account.status
- 資格

MCP ツールで使用:
- easyar_check_account
- easyar_check_official_access
- easyar_onboarding_report

受け入れ:
- 有効な登録ユーザー トークンは ok=true および account.registered=true を返します。
- 未登録または期限切れのトークンは編集されたエラー本文を含む 401/403 を返します。

カナリア コマンド テンプレート:
```bash
curl -fsS -H "Authorization: Bearer ${EASYAR_API_TOKEN}" "${EASYAR_ACCOUNT_STATUS_ENDPOINT}"
```

### ライセンス検証

環境: EASYAR_LICENSE_VALIDATE_ENDPOINT
メソッド: POST
予期される URL: https://www.easyar.cn/mcp/license/validate

ローカル EasyAR Sense ライセンス キーが、要求された Unity バンドル ID とプラットフォームで使用できることを検証します。

バックエンド所有者のやるべきこと: 提供されたローカル EasyAR Sense ライセンスを、アカウント資格、製品、プラットフォーム、Unity バンドル/package識別子と照合して検証します。

リクエストフィールド:
- licenseKey
- bundleIdentifier
- プラットフォーム

必須の応答フィールド:
- わかりました
- license.valid
- license.product
- license.bundleIdentifierMatches
- license.platformAllowed

MCP ツールで使用:
- easyar_validate_license
- easyar_check_official_access
- easyar_write_focused_preflight

承認:
- 有効なライセンス/bundle/platformは、license.valid=true および bundleIdentifierMatches=true を返します。
- 無効なライセンス、間違ったバンドル ID、または許可されていないプラットフォームは、ライセンス キーをエコーせずに ok=false または 403 を返します。

Canary コマンド テンプレート:
```bash
curl -fsS -X POST -H "Authorization: Bearer ${EASYAR_API_TOKEN}" -H "Content-Type: application/json" -d '{"licenseKey":"${EASYAR_TEST_LICENSE_KEY}","bundleIdentifier":"com.easyar.testsample","platform":"android"}' "${EASYAR_LICENSE_VALIDATE_ENDPOINT}"
```

### downloads-discovery

環境: EASYAR_DOWNLOADS_ENDPOINT
メソッド: POST
期待URL: https://www.easyar.cn/mcp/downloads

アカウント承認済み EasyAR SDK、Unity プラグイン、サンプル パッケージ メタデータを返します。公式のダウンロード権限をバイパスします。

バックエンド所有者のやるべきこと: 不正なダウンロードを許可せず、登録済みアカウントの承認された SDK/plugin/sample パッケージ メタデータのみを返します。

リクエスト フィールド:
- sampleId
- packageKind
- unityVersion

必須応答フィールド:
- ok
- パッケージ

MCP ツールで使用:
- easyar_discover_downloads
- easyar_check_official_access
- easyar_generate_sample_import_guide

承認:
- 承認されたアカウントは、重点的なワークフローに必要な EasyAR Unity Plugin/sample メタデータを返します。
- 未承認のパッケージ リクエストは 403 を返し、プライベート ダウンロードは行われませんURL。

Canary コマンド テンプレート:
```bash
curl -fsS -X POST -H "Authorization: Bearer ${EASYAR_API_TOKEN}" -H "Content-Type: application/json" -d '{"sampleId":"image-tracking","packageKind":"unity-samples","unityVersion":"6000.4.7f1"}' "${EASYAR_DOWNLOADS_ENDPOINT}"
```

### cloud-credentials-discovery

環境: EASYAR_CLOUD_CREDENTIALS_ENDPOINT
メソッド: POST
期待URL: https://www.easyar.cn/mcp/cloud-recognition/credentials

生のデータを返さずに、登録ユーザーの Cloud Recognition アプリのメタデータとプレゼンス フラグを返します API KEY/API シークレット値。

バックエンド所有者の Todo: 生の API KEY/API シークレット値を返さずに、クラウド認識アプリのメタデータと API KEY プレゼンス フラグを返します。

リクエストフィールド:
- sampleId
- bundleIdentifier
- プラットフォーム

必須応答フィールド:
- ok
- cloudRecognition.appId
- cloudRecognition.apiKeyPresent

MCP ツールで使用:
- easyar_discover_cloud_credentials
- easyar_check_official_access
- easyar_account_materials

承認:
- 設定されたクラウド認識アプリは、appId に加えて serverAddress および apiKeyPresent/apiSecretPresent フラグを返します。
 - 応答には生の API KEY/API Secret、appKey、または appSecret が含まれることはありません。値。

カナリア コマンド テンプレート:
```bash
curl -fsS -X POST -H "Authorization: Bearer ${EASYAR_API_TOKEN}" -H "Content-Type: application/json" -d '{"sampleId":"cloud-recognition","bundleIdentifier":"com.easyar.testsample","platform":"android"}' "${EASYAR_CLOUD_CREDENTIALS_ENDPOINT}"
```

## ロールアウト

1. EasyAR アカウント システムが MCP クライアントの登録ユーザーベアラー トークンを発行または検証できることを確認します。
2.既存の EasyAR アカウント/license/download/cloud サービスを 4 つの MCP エンドポイント コントラクトにマッピングします。
3.まずエンドポイントをステージング環境または内部環境にデプロイし、そこに一致する MCP 環境変数を設定します。
4.登録済みのテスト アカウント、有効な EasyAR Sense ライセンス、およびクラウド認識テスト アプリを使用して、カナリア コマンドを実行します。
5.画像追跡とクラウド認識のために easyar_check_official_access を実行します。
6.ステージングが完了した後でのみ、公開された MCP デプロイメント用の実稼働環境変数を構成します。

リポジトリ カナリア:

```bash
EASYAR_CANARY_PROJECT_PATH=/path/to/UnityProject EASYAR_CANARY_PLATFORM=android npm run official-api:canary
```

カナリアは MCP サーバーをローカルで起動し、構成されたベアラー トークンとエンドポイント環境変数を使用し、アカウントのステータスを確認し、イメージ トラッキング、クラウド認識、Mega 公式アクセスを検証してから、運用検証を実行します。パス/blocker ステータスのみを出力し、トークン、ライセンス キー、API KEY/API シークレット、appKey、または appSecret の値は出力しないでください。

ローカル契約スタブ:

```bash
npm run official-api:stub
```

スタブは、デフォルトで `127.0.0.1:8787` 上の 4 つの公式エンドポイント ルートを提供し、MCP コントラクトと互換性のある非シークレット フィクスチャ メタデータを返します。これは、実際の EasyAR バックエンド サービスに接続する前に、ゲートウェイ ルーティング、環境変数の配線、およびカナリアの動作を検証するのに役立ちます。これは運用アカウント サービスではないため、運用アカウント サービスとして展開しないでください。

## 受け入れゲート

- 必要なエンドポイント環境変数はすべて、MCP ランタイム環境で設定されます。
- すべてのエンドポイントには認証: Bearer ${EASYAR_API_TOKEN} が必要で、不足しているトークン、期限切れのトークン、または未承認のトークンは拒否されます。
- easyar_check_account は、登録された EasyAR テスト アカウントに対してconfigured=true および ok=true を返します。
- easyar_validate_license は、ライセンス キーをエコーせずに、Unity バンドル/package 識別子のローカル EasyAR Sense ライセンスを検証します。
- easyar_discover_downloads はアカウントで承認されたパッケージ メタデータのみを返し、EasyAR ダウンロード ゲートをバイパスすることはありません。
- easyar_discover_cloud_credentials は appId とプレゼンス フラグを返します。生の API KEY/API シークレット、appKey、または appSecret の値は返しません。
- easyar_check_official_access は、同じ展開環境を使用して画像追跡とクラウド認識にパスします。
- easyar_write_deployment_readiness には公式のエンドポイント ブロッカーはありません。
- フィクスチャの煙は緑色のままで、実際のステージング/prodカナリアの実行は OFFICIAL_ACCESS.md.
 に記録されます。
## 障害ポリシー

- 無効なアカウント、期限切れのアカウント、未登録のアカウント、ライセンスのないアカウント、または資格がないアカウントの場合は、401/403 を返します。
- 編集された JSON エラーを安定したエラー コードで返します。未加工のシークレットやプライベート アカウント データは返さないでください。
- アカウント/tokenとエンドポイント
ごとに、繰り返し失敗した検証試行のレート制限を行います。- エンドポイントが使用できない場合、MCP はconfigured=false または ok=false を報告し、プライベート ダウンロードまたはクラウド認識セットアップの前に停止する必要があります。
- EasyAR Web サイト セッションのスクレイピングやログイン/downloadゲートのバイパスにフォールバックしないでください。

## 再生成するアーティファクト

- ドキュメント/OFFICIAL_API_CONTRACT.md
- ドキュメント/OFFICIAL_API_HANDOFF.md
- ドキュメント/openapi/easyar-mcp-account-api.openapi.json
- 資産/EasyARGenerated/<sampleId>/OFFICIAL_ACCESS.md
- 資産/EasyARGenerated/DEPLOYMENT_READINESS.md
- 資産/EasyARGenerated/PRODUCTION_VALIDATION.md
- 資産/EasyARGenerated/REMAINING_WORK.md

## 次のアクション

- アカウントのステータス、ライセンスの検証、ダウンロードの検出、およびクラウド認証情報の検出にバックエンド所有者を割り当てます。
- ステージング MCP 環境に EASYAR_ACCOUNT_STATUS_ENDPOINT、EASYAR_LICENSE_VALIDATE_ENDPOINT、EASYAR_DOWNLOADS_ENDPOINT、EASYAR_CLOUD_CREDENTIALS_ENDPOINT を設定します。
- ノード スクリプトを実行します/official-api-fixture-smoke.mjs。必要に応じて、ローカル コントラクトの接続のために npm run official-api:stub を実行します。次に、登録された EasyAR テスト アカウントで npm run official-api:canary を実行します。
- エンドポイントの構成後、画像追跡とクラウド認識のために easyar_write_official_access_report を実行します。

## セキュリティ

このハンドオフには、エンドポイント名、request/response スキーマ、および非秘密のカナリア テンプレートのみが含まれます。 EasyAR パスワード、確認コード、アカウント トークン、ライセンス キー、API キー、API シークレット、appKey、appSecret、署名キー、またはプライベート ユーザー データを含めることはできません。
