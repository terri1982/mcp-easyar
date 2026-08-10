# mcp-easyar 公式API契約

生成日: 2026-06-10T15:38:16.371Z
サーバー: mcp-easyar 0.1.0
実稼働準備完了 公式アクセス: いいえ

## 目的

公式 EasyAR MCP EasyAR Unity サンプルと Unity プロジェクト プログラミング ワークフローを実行する登録ユーザー向けのサービス。

機械可読契約: `docs/openapi/easyar-mcp-account-api.openapi.json`

## 環境

ベースURL: https://www.easyar.cn
トークン環境: EASYAR_API_TOKEN
現在構成されているトークン: no

### 必須変数

- EASYAR_API_BASE_URL
- EASYAR_API_TOKEN
- EASYAR_ACCOUNT_STATUS_ENDPOINT
- EASYAR_LICENSE_VALIDATE_ENDPOINT
- EASYAR_DOWNLOADS_ENDPOINT
- EASYAR_CLOUD_CREDENTIALS_ENDPOINT

### 現在の構成

- EASYAR_API_TOKEN: no
- EASYAR_ACCOUNT_STATUS_ENDPOINT: no
- EASYAR_LICENSE_VALIDATE_ENDPOINT: no
- EASYAR_DOWNLOADS_ENDPOINT: いいえ
- EASYAR_CLOUD_CREDENTIALS_ENDPOINT: いいえ

## 認証

スキーム: ベアラートークン
ヘッダー: `Authorization: Bearer ${EASYAR_API_TOKEN}`
トークンソース: 公式 EasyAR 登録ユーザーアカウントトークン、MCP クライアント環境またはシークレットに保存ストレージ。

- トークンをチャットに貼り付けないでください。
- トークンを GitHub にコミットしないでください。
- API 応答、ログ、問題レポート、または MCP ツールの出力でトークンを返さないでください。
- 運用クライアントには有効期間が短いトークンまたは取り消し可能なトークンを優先します。

## 認証境界

ローカルキーMVP: ユーザーが公式 EasyAR Sense Unity プラグインをインストールし、ローカル ライセンス/API キーマテリアルを Unity プロジェクトに入力した後に、Unity サンプルの実行を実行できます。 Unity の実行時にはウェブサイトへのログインは必要ありません。

受け入れられたフォールバック: 公式 API エンドポイントが利用できない場合は、ブラウザーのみのハンドオフとローカルキー検証を使用します。 MCP はアカウントの段階と非機密証拠を記録し、ユーザーは EasyAR 公式 Web サイトからプラグイン/key 資料を取得します。

本番自動化に公式サポートが必要な理由:
- アカウントのステータスは EasyAR アカウント システム内でのみ権威があります。 MCP ローカル ファイルから登録、アカウントの状態、組織のメンバーシップ、または製品の権利を証明することはできません。
- 製品、プラットフォーム、有効期限、および Unity バンドルの互換性を証明するには、ライセンスの検証を EasyAR サーバー側のライセンス レコードと照合する必要があります/package。
- ダウンロードの検出では、EasyAR ログイン、資格、エンタープライズ、およびレート制限ゲートを尊重する必要があります。 MCP は、プライベート ダウンロード URL を作成したり、ブラウザ セッションを再利用したりしてはなりません。
- クラウド認識資格情報の検出は、ユーザーの EasyAR クラウド プロジェクトに属します。 MCP は、ユーザーがランタイム キーをローカルに保存しない限り、メタデータとプレゼンス フラグのみを受信する必要があります。

受け入れられません:
- 制作認証メカニズムとして EasyAR Web サイト ページまたはブラウザ Cookie をスクレイピングします。
- EasyAR Web サイトのパスワード、確認コード、アカウント トークン、ライセンス キー、API KEY/API シークレット、appKey、または appSecret をチャットに貼り付けるようユーザーに求めます。
- ローカル構成の存在をアカウント資格またはプライベート ダウンロード承認の証明として扱います。

## エンドポイント

### アカウントのステータス

環境: EASYAR_ACCOUNT_STATUS_ENDPOINT
現在構成されています: no
メソッド: GET
パス: /mcp/account/status
期待されるURL: https://www.easyar.cn/mcp/account/status
タイムアウトミリ秒: 10000
認証: EASYAR_API_TOKEN の必須ベアラートークン

ベアラートークンが登録済み EasyAR ユーザーに属していることを確認し、非機密のアカウント権限メタデータを返します。

リクエスト フィールド:
- リクエスト本文フィールドなし。

必須の応答フィールド:
- ok
- account.id
- account.registered
- account.status
- 権利

オプションの応答フィールド:
- account.emailMasked
- account.displayName
- 計画
- 組織
- expiresAt

MCP ツールで使用:
- easyar_check_account
- easyar_check_official_access
- easyar_onboarding_report

シークレット処理: 検証に必要な場合にのみシークレット リクエスト フィールドを受け入れ、決してエコー バックせず、編集されたもののみを返します。メタデータ。

### ライセンス検証

環境: EASYAR_LICENSE_VALIDATE_ENDPOINT
現在構成: いいえ
メソッド: POST
パス: /mcp/license/validate
予想URL: https://www.easyar.cn/mcp/license/validate
タイムアウトミリ秒: 10000
認証:EASYAR_API_TOKEN

からの必要なベアラー トークン。ローカル EasyAR Sense ライセンス キーが要求された Unity バンドル識別子とプラットフォームで使用できることを検証します。

リクエスト フィールド:
- licenseKey
- bundleIdentifier
- プラットフォーム

必須応答フィールド:
- ok
- license.valid
- license.product
- license.bundleIdentifierMatches
- license.platformAllowed

オプションの応答フィールド:
- license.expiresAt
- license.edition
- license.features
- license.message

MCP ツールで使用:
- easyar_validate_license
- easyar_check_official_access
- easyar_write_focused_preflight

シークレットの処理: 検証に必要な場合にのみシークレット リクエスト フィールドを受け入れ、決してエコー バックせず、編集されたメタデータのみを返します。

### downloads-discovery

環境: EASYAR_DOWNLOADS_ENDPOINT
現在構成: いいえ
メソッド: POST
パス: /mcp/downloads
期待される URL: https://www.easyar.cn/mcp/downloads
タイムアウト ミリ秒: 10000
認証: EASYAR_API_TOKEN

からの必要なベアラー トークン。公式ダウンロードをバイパスせずに、アカウント認証された EasyAR SDK、Unity プラグイン、およびサンプル パッケージ メタデータを返します。

リクエストフィールド:
- sampleId
- packageKind
- unityVersion

必須応答フィールド:
- ok
- パッケージ

オプション応答フィールド:
- packages[].name
- packages[].version
- packages[].url
- packages[].sha256
- packages[].releaseNotesUrl

MCP ツールで使用:
- easyar_discover_downloads
- easyar_check_official_access
- easyar_generate_sample_import_guide

シークレットの処理: 検証に必要な場合にのみシークレット リクエスト フィールドを受け入れ、決してエコー バックせず、編集されたメタデータのみを返します。

### クラウド認証情報の検出

環境: EASYAR_CLOUD_CREDENTIALS_ENDPOINT
現在構成されています: no
メソッド: POST
パス: /mcp/cloud-recognition/credentials
予期される URL: https://www.easyar.cn/mcp/cloud-recognition/credentials
タイムアウトミリ秒: 10000
認可: EASYAR_API_TOKEN
 からのベアラー トークンが必要です
生の API KEY/API シークレット値を返さずに、登録ユーザーの Cloud Recognition アプリのメタデータとプレゼンス フラグを返します。

リクエストフィールド:
- sampleId
- bundleIdentifier
- platform

必須の応答フィールド:
- ok
- cloudRecognition.appId
- cloudRecognition.apiKeyPresent

オプションの応答フィールド:
- cloudRecognition.apiSecretPresent
- cloudRecognition.appKeyPresent
- cloudRecognition.appSecretPresent
- cloudRecognition.serviceRegion
- cloudRecognition.targetLibraryCount
- cloudRecognition.dashboardUrl

MCP ツールで使用:
- easyar_discover_cloud_credentials
- easyar_check_official_access
- easyar_account_materials

シークレットの処理: 検証に必要な場合にのみシークレット リクエスト フィールドを受け入れ、決してエコー バックせず、編集されたメタデータのみを返します。

## 例

### ライセンス検証

```json
{
  "endpoint": "license-validation",
  "request": {
    "method": "POST",
    "url": "https://www.easyar.cn/mcp/license/validate",
    "body": {
      "licenseKey": "<local EasyAR license key>",
      "bundleIdentifier": "com.example.easyar.sample",
      "platform": "android"
    }
  },
  "response": {
    "ok": true,
    "license": {
      "valid": true,
      "product": "EasyAR Sense Unity Plugin",
      "bundleIdentifierMatches": true,
      "platformAllowed": true,
      "features": [
        "image-tracking",
        "cloud-recognition"
      ]
    }
  }
}
```

### クラウド認証情報の検出

```json
{
  "endpoint": "cloud-credentials-discovery",
  "request": {
    "method": "POST",
    "url": "https://www.easyar.cn/mcp/cloud-recognition/credentials",
    "body": {
      "sampleId": "cloud-recognition",
      "bundleIdentifier": "com.example.easyar.sample",
      "platform": "android"
    }
  },
  "response": {
    "ok": true,
    "cloudRecognition": {
      "appId": "<app id or masked app id>",
      "apiKeyPresent": true,
      "apiSecretPresent": true,
      "appKeyPresent": true,
      "appSecretPresent": true,
      "serviceRegion": "configured"
    }
  }
}
```

## 応答ポリシー

 - 応答には、アカウント メタデータ、パッケージ メタデータ、プレゼンス フラグが含まれる場合があります。
- 応答には、生のライセンス キー、API トークン、API キー、API シークレット、appKey、appSecret、パスワード、確認コード、署名キーまたはプロビジョニング プロファイル。
- バックエンドが機密マテリアルの存在を報告する必要がある場合は、値の代わりにブール値の存在フラグとダッシュボード URL を返します。
- 非 2xx ステータス コードと編集された JSON エラー本体を、未承認、期限切れ、ライセンスなし、および資格のエラーに使用します。

## 運用チェックリスト

- すべてのエンドポイント環境変数を公式の HTTPS EasyAR API に構成します。
- エンドポイントがプロキシされている場合、ローカル MCP クライアントの CORS/network ポリシーを検証します。
- すべてのエンドポイントがアカウント トークンと資格によって承認されていることを確認します。
- 画像追跡とクラウド認識のために easyar_check_official_access を実行します。
 - easyar_write_deployment_readiness を実行し、リリース前にブロッカーをゼロに保ちます。

## セキュリティ

この契約はスキーマと導入に関するガイダンスのみです。これには、EasyAR アカウント トークン、ライセンス キー、API キー、API シークレット、appKey、appSecret、またはユーザー パスワードは意図的に含まれていません。
