# mcp-easyar クイックスタート

このワークフローは、Codex、Claude、または別の MCP クライアントをローカル Unity プロジェクト自動化に接続する新規および登録済み EasyAR ユーザーの両方をサポートします。

現在のステータス:

- 公式 EasyAR Sense Unity プラグインがインストールされた後、ローカルキー MVP は集中的な画像追跡、クラウド認識、メガ ワークフロー支援を行う準備ができています。ローカルキーまたはメガマテリアルが設定されています。 Mega は現在のワークツリーに Android デバイスのインストール/startup/localization-trackingの証拠を持っています。
- 公式 EasyAR アカウント API はまだ運用自動化トラックです。これらはサーバー側のアカウント/license/download/cloud資格チェックには必要ですが、承認されたプラグインとキーがローカルになったら、Unity 側のサンプルの実行には必要ありません。

現在のデフォルト パス: ローカル キーを実行しますMVP。ユーザーは、ブラウザの EasyAR 公式 Web サイトで登録/login/download/keyの作成を完了します。 MCP では、これらの手順をガイドし、ローカル フォームとハンドオフ ファイルを作成し、編集されたローカル構成の存在のみを検証してから、Unity のインポート、ビルド、デバイスの検証に進みます。

## 1. サーバーを構築

```bash
npm install
npm run build
npm run install:check
```

パッケージを公開または別のユーザーに渡す前に、`npm run package:smoke` を実行してローカル tarball を一時コンシューマ プロジェクトにインストールし、`easyar-mcp-check` も実行します。

## 2. クライアントを構成する

まだ EasyAR アカウントをお持ちでない場合は、アカウント ガイドから始めてください。

```text
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_authorization_strategy preferredMode=auto sampleId=cloud-recognition platform=android
easyar_write_authorization_strategy projectPath=/path/to/UnityProject preferredMode=auto sampleId=cloud-recognition platform=android
easyar_write_first_run_guide projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_account_onboarding accountStage=not-registered sampleId=cloud-recognition
easyar_account_materials sampleId=cloud-recognition
easyar_write_account_onboarding projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition
easyar_write_account_materials projectPath=/path/to/UnityProject sampleId=cloud-recognition
easyar_write_portal_evidence projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_local_config_handoff projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_write_local_config_form projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_write_focused_handoff_pack projectPath=/path/to/UnityProject sampleId=all platform=android accountStage=not-registered
```

このガイドでは、ユーザーを EasyAR の公式 Web サイトと開発センターに誘導し、すべての必須フィールド、情報の出所、保存場所、共有しても安全かどうかを列挙します。 `AUTHORIZATION_STRATEGY.md` はキーの区別を記録します。公式の EasyAR Sense Unity プラグインがインストールされた後、Unity サンプルの実行ではローカル ライセンス/API キー構成が使用され、実行時に Web サイトへのログインは必要ありません。 Web サイトへのログインは、承認されたパッケージとキーを取得するために行われます。 `FIRST_RUN.md` は、最初の安全な呼び出し、焦点を当てた画像追跡/Cloud 認識/Mega スコープ、およびアーティファクトの読み取り順序を指定します。 `PORTAL_EVIDENCE.md` は、アプリ レコード ID、サービス フラグ、センス ライセンスの存在、クラウド認識ライブラリ/target ステータス、メガ ライブラリ/block 識別子など、機密でない開発センターの観察のみを記録します。 `LOCAL_CONFIG_HANDOFF.md` は、これらのアカウントの手順を正確な `ProjectSettings/EasyAR/easyar.local.json` ファイルに結び付けます。 `LOCAL_CONFIG_FORM.md` は、入力可能な JSON スケルトン、フィールドごとのソース マップ、環境ベースのライター コマンド、および検証チェーンを提供します。 `easyar_write_focused_handoff_pack` は、安全なサンプルごとの診断、フォーム、実行シーケンス、プログラミング コンテキスト、`HANDOFF_PACK.md`、`ARTIFACT_INDEX.md`、プロジェクト ダッシュボードを 1 回の呼び出しで書き込みます。 MCPは、EasyAR Web サイトのパスワードを要求せず、アカウント認証情報も保存しません。

Mega は JSON ルートの例外です。パッケージの License Key と Global Mega Block の各フィールドを `Assets/XR/Settings/EasyAR Settings.asset` で設定し、`sampleId=mega` で検証します。Build Settings に Onsite/Simulator の候補が複数ある場合は、シーン監査が推奨する `scenePath` を使用してください。

まだ登録していないユーザーの場合、MCP フローは次のとおりです。

1. MCP リソース `easyar://acceptance/fresh-project` を読み取り、現在の画像追跡、CRS/Cloud 認識、メガ受け入れ範囲を固定します。
2.アカウントの状態のみを尋ねます (例: `accountStage=not-registered`)。新しいユーザーが有効な開始点です。
3. `easyar_authorization_strategy preferredMode=auto sampleId=cloud-recognition platform=android` を実行します。通常の MVP パスは `local-key`.
4.公式プラグイン、ライセンス、またはクラウド認識キーがまだ必要な場合は、ユーザーをブラウザで `https://www.easyar.cn/` に送信します。公式ログイン/registerエントリを使用し、必要に応じてアカウントをアクティブ化し、そこから開発センターに入ります。
5.ユーザーが戻ってきたら、`registered-not-logged-in`、`logged-in`、`has-license`、または `has-cloud-credentials` のどの段階が現在 true であるかだけを尋ねます。
6. `FIRST_RUN.md` を書き込みます。最初の安全な MCP 呼び出し、フォーカスされたスコープ、ブロッカー、アーティファクトの順序、Unity オートメーションがまだ許可されているかどうかを記録します。
7. `ACCOUNT_ONBOARDING.md` と書き込みます。ブラウザのハンドオフ、ステージ モデル、リターン プロンプト、次のオペレータまたは AI ツールのシークレット処理ルールが記録されます。
8.ユーザーがログインしたポータルから戻ったら、秘密ではない観察のみを含む `PORTAL_EVIDENCE.md` を書き込みます。 API KEY/API Secret/license 値に存在フラグを使用します。
9. `LOCAL_CONFIG_HANDOFF.md` と書き込みます。これにより、ユーザーはチャットにシークレットを貼り付けることなく、手動ファイルと環境バックアップの両方の方法でローカル設定を入力できるようになります。
10. Unity バンドル/package識別子
の EasyAR Sense ライセンスを作成または検索するよう指導します。
11. クラウド認識の場合は、CRS/Cloud 認識 AppId と API KEY を作成または検索するようにガイドします。 Sense 4.1 以降では、`appId` + `apiKey` を使用します。従来の `appKey`/`appSecret` フィールドは、互換性のために引き続き受け入れられます。
12.クラウド認識の実デバイス検証については、クラウド認識画像ライブラリを作成し、少なくとも 1 つのテスト ターゲット画像をアップロードし、秘密ではないライブラリ名、ターゲット数、ダッシュボードのみを証拠として保持するように指導しますURL。
13. Mega の場合は、すでにログインしている EasyAR Web サイトまたは Mega Studio セッションでクラウド ローカリゼーション ライブラリ、Mega ブロック ストレージ、ブロック名、ブロック ID を見つけるようにガイドします。ローカル プロジェクトの情報として、機密ではない名前と ID のみを保存します。
14.秘密をチャットに入れないようにします。`ProjectSettings/EasyAR/easyar.local.json` にローカルで入力するか、`easyar_write_local_config_from_env` でローカル環境変数を使用して、`easyar_validate_local_config` にプレゼンスとプレースホルダーの問題のみを報告させます。
15. `easyar_write_focused_preflight` を使用して `PREFLIGHT.md` を作成します。ファイルがアカウント、ローカル構成、インポート、Unity パス、シーン、およびスクリプト ゲートを報告するまで、Unity バッチ オートメーションを実行しないでください。
16.コンパイル、ビルド、および実際のデバイスの検証を試行した後、`RUN_RESULT.md` を書き込み、次に `COMPLETION_REPORT.md` を書き込みます。 `runThroughComplete=true` の場合にのみ、フォーカスされたサンプルを実際に実行されるものとして扱います。コンパイル/buildが成功するだけでは十分ではありません。

MCP によって登録がチャット フォームに変わってはいけません。ログイン、電子メールのアクティベーション、パスワードのリセット、および確認コードは、公式のブラウザー セッションに残ります。 MCP は、アカウントの段階とローカル証拠のみを記録します。

`easyar_write_artifact_index` には、ハンドオフの読み取り順序に `ACCOUNT_ONBOARDING.md`、`ACCOUNT_MATERIALS.md`、`PORTAL_EVIDENCE.md` が含まれるため、別の AI ツールは Unity 検証を試行する前にアカウントの前提条件とログインポータルの証拠を確認できます。

MCP クライアント用サーバー スニペット:

```text
easyar_server_status
Read MCP resource easyar://acceptance/fresh-project
easyar_release_manifest
easyar_generate_client_config client=claude-desktop
easyar_generate_client_config client=codex entrypointMode=package-bin includeTokenPlaceholder=false
easyar_generate_client_config client=generic-json entrypointMode=package-bin
easyar_check_client_setup client=claude-desktop serverPath=/absolute/path/to/mcp-easyar/dist/index.js
easyar_write_client_setup outputRoot=/path/to/report-folder client=claude-desktop serverPath=/absolute/path/to/mcp-easyar/dist/index.js
easyar_onboarding_report projectPath=/path/to/UnityProject sampleId=image-tracking client=claude-desktop platform=android
```

コピー可能な Codex、Claude Desktop、local-dist、現在の GitHub リリース package-bin、および将来の npm/npx セットアップ プロファイルについては、`docs/client-setup.md` を参照してください。

`CLIENT_SETUP.md` には、構成宛先、受け入れチェックリスト、`easyar_server_status` などの最初のスモーク コール、およびクライアント固有のトラブルシューティング手順が含まれています。 Codex または Claude のセットアップを別のユーザーに渡す前に使用してください。

`easyar_server_status` は、`preflightFirst` オンボーディング ブロックも返します。推奨される最初の呼び出し順序は、アカウント ガイド、アカウント資料、Unity 環境レポート、プロジェクトの準備、重点的なプリフライト、そして `PREFLIGHT.md` の読み取りです。

現在のローカルキー MVP については、ローカル Unity/project 変数のみから始めます:

```bash
EASYAR_API_BASE_URL=https://www.easyar.cn
EASYAR_UNITY_PATH=/Applications/Unity/Hub/Editor/2022.3.62f3/Unity.app/Contents/MacOS/Unity
EASYAR_UNITY_CANDIDATE_DIRS=/Applications/Unity/Hub/Editor
EASYAR_RELEASE_PROJECT_PATH=/path/to/UnityProject
EASYAR_RELEASE_EVIDENCE_PATH=docs/release-evidence/focused-scope.android.json
EASYAR_RELEASE_PLATFORM=android
EASYAR_UNITY_VERSION=2022.3.62f3
EASYAR_LICENSE_KEY=<set locally if using easyar_write_local_config_from_env>
EASYAR_CLOUD_APP_ID=<set locally for Cloud Recognition>
EASYAR_CLOUD_SERVER_ADDRESS=<set locally for Cloud Recognition>
EASYAR_CLOUD_API_KEY=<set locally for Cloud Recognition>
EASYAR_CLOUD_API_SECRET=<set locally for Cloud Recognition>
```

公式アカウント API 変数は、現在のローカルキー サンプルの実行ではなく、運用自動化トラック用です。ローカルキー MVP ユーザーには `EASYAR_API_TOKEN` は必要ありません。ユーザーに提供を求めないでください。

```bash
EASYAR_ACCOUNT_STATUS_ENDPOINT=https://www.easyar.cn/path/to/official/account/status
EASYAR_LICENSE_VALIDATE_ENDPOINT=https://www.easyar.cn/path/to/official/license/validate
EASYAR_DOWNLOADS_ENDPOINT=https://www.easyar.cn/path/to/official/downloads
EASYAR_CLOUD_CREDENTIALS_ENDPOINT=https://www.easyar.cn/path/to/official/cloud-recognition/credentials
EASYAR_CANARY_PROJECT_PATH=/path/to/UnityProject
EASYAR_CANARY_PLATFORM=android
EASYAR_STUB_HOST=127.0.0.1
EASYAR_STUB_PORT=8787
EASYAR_STUB_TOKEN=your_local_stub_token
```

リポジトリには、非シークレット テンプレートとして `.env.example` が含まれています。 MCP クライアント環境、OS キーチェーン、CI シークレット、またはローカルの追跡されていない `.env` に値をコピーします。実際の EasyAR ライセンス キー、API KEY/API シークレット、`appKey`、または `appSecret` を決してコミットしないでください。

公式バックエンド/API 契約は `docs/OFFICIAL_API_CONTRACT.md` で公開されています。ゲートウェイのインポート、バックエンド スタブ、およびクライアント生成のための機械可読な OpenAPI コントラクトは `docs/openapi/easyar-mcp-account-api.openapi.json` です。 Markdown コントラクトは、

 で再生成できます。
```text
easyar_generate_official_api_contract
easyar_write_official_api_contract workspacePath=/path/to/workspace
easyar_generate_official_openapi_contract
easyar_write_official_openapi_contract workspacePath=/path/to/workspace
easyar_official_api_handoff deploymentTarget=staging
easyar_write_official_api_handoff workspacePath=/path/to/workspace deploymentTarget=staging
```

MCP クライアントは、登録ユーザーのエンドポイント アクセスを検証する前に、Markdown の `easyar://official/api-contract` または機械読み取り可能な OpenAPI の `easyar://official/openapi` を読み取ることもできます JSON か、または `easyar-validate-official-endpoints` プロンプトを使用することもできます。 `OFFICIAL_API_HANDOFF.md` は、コントラクトを実際の EasyAR アカウント サービスにマッピングし、エンドポイント環境変数を設定し、カナリアを実行し、公式アクセス証拠を記録するためのバックエンド/operationsロールアウト チェックリストです。

次の方法でローカル Unity パス検出を検査できます。

```text
easyar_unity_environment
```

アカウント トークン、ライセンス キー、クラウド認識資格情報、またはモバイル署名シークレットは絶対にコミットしないでください。

初めて EasyAR ユーザーの場合、意図されている順序は次のとおりです。

1. EasyAR の公式 Web サイト/developmentセンターに登録またはログインします。
2.アプリ バンドル/package識別子の EasyAR Sense ライセンス キーを作成または検索します。
3.クラウド認識の場合、公式アカウントで CRS AppId と API KEY を作成または検索します。
4.ライセンスとクラウド認識の値は、`ProjectSettings/EasyAR/easyar.local.json` または `easyar_write_local_config_from_env` によって使用されるローカル環境変数にのみ配置します。
5. `easyar_validate_local_config` と `easyar_write_focused_preflight` を実行します。
6. `easyar_check_official_access`公式 EasyAR アカウント API エンドポイントが設定されている場合にのみ使用します。

公式 EasyAR アカウント エンドポイントが設定されている場合は、次の方法でアカウントとライセンスへのアクセスを確認します。

```text
easyar_check_account
easyar_validate_license projectPath=/path/to/UnityProject platform=android
easyar_discover_downloads projectPath=/path/to/UnityProject sampleId=image-tracking packageKind=unity-samples
easyar_discover_cloud_credentials projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_check_official_access projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_official_access_report projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
```

## 3. サンプルを選択します

MCP クライアントがプロンプトをサポートしている場合は、`easyar-run-image-tracking`、`easyar-run-cloud-recognition`、`easyar-run-wechat-miniprogram`、または `sampleId=mega` を備えた汎用プログラミング アシスタントから開始します。

ここでは、重点的なサンプル ワークフローの 1 つを使用します。

- `image-tracking`
- `cloud-recognition`
- `mega`

他の EasyAR サンプルは、現在の画像追跡、CRS/Cloud 認識、メガ ターゲットの範囲外です。

WeChat ミニ プログラムのサンプルについては、`easyar-run-wechat-miniprogram` と `sampleId=wechat-mega` または `sampleId=wechat-crs`。プロンプトは、公式 EasyAR/WeChat ブラウザと DevTools ハンドオフでフローを維持し、`easyar_create_miniprogram_sample_workspace` で最小限のミニ プログラム ワークスペース シェルを作成でき、`easyar_find_miniprogram_official_package` と `easyar_write_miniprogram_official_package_search` で公式パッケージ検索の証拠を見つけ/write、ローカル プリフライト/evidence アーティファクトを書き込み、完了前に実デバイスのプレビュー証拠を必要とします。

ミニ プログラムの作業中、プロジェクト、公式パッケージ検索/import、DevTools ログ、または実際のデバイスの証拠が変更されるたびに、`easyar_write_miniprogram_run_through_status`再実行します。次に推奨される MCP 呼び出しで 1 つのローカル ステータス ファイルを書き込みます。

呼び出し:

```text
easyar_list_samples
easyar_generate_sample_plan sampleId=image-tracking platform=android
easyar_next_workflow_step projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_generate_focused_preflight projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_generate_sample_import_guide projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_sample_import_guide projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_import_sample_from_package_cache projectPath=/path/to/UnityProject sampleId=cloud-recognition dryRun=true
easyar_write_workflow_state projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_generate_run_sequence projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_run_sequence projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_artifact_index projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_generate_run_report projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_run_report projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_audit_sample_scene projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_scene_audit projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_generate_support_bundle projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_support_bundle projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=image-tracking overallStatus=blocked
easyar_write_issue_report projectPath=/path/to/UnityProject sampleId=image-tracking overallStatus=blocked
easyar_write_first_run_guide projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_write_project_handoff projectPath=/path/to/UnityProject platform=android
easyar_write_remaining_work_report projectPath=/path/to/UnityProject platform=android verificationEvidence=passed
```

アーティファクトを作成した後、最初に新規ユーザーまたは新規 MCP クライアントに対して `FIRST_RUN.md` を読み取り、次に Unity プロジェクト全体を再開するときに `PROJECT_HANDOFF.md` を読み取り、次に証拠加重ギャップ推定に対して `REMAINING_WORK.md` を読み取り、次にアクティブなサンプルに対して `PREFLIGHT.md` を読み取ります。プロジェクトのハンドオフでは、単一のトップ ネクスト コールとサンプルごとのワークフロー状態が提供されます。 `PREFLIGHT.md` は、Codex、Claude、または人間のオペレーターに、Unity のバッチ オートメーションまたはデバイスのビルド前にどのブロッカーをクリアする必要があるかを伝えるフォーカス ゲートです。

クラウド認識の場合は、`sampleId=cloud-recognition` を使用し、`ProjectSettings/EasyAR/easyar.local.json` に `easyar.cloudRecognition.appId` と `apiKey` を入力します。従来の `appKey`/`appSecret` フィールドは、互換性を確保するために引き続き受け入れられます。合格したデバイス結果には、少なくとも 1 つのテスト ターゲット イメージがアップロードされた EasyAR クラウド認識ターゲット ライブラリも必要です。

Mega の場合は、`sampleId=mega` を使用し、Mega 用の公式 EasyAR Sense Unity プラグインをインストールし、すでにログインしている EasyAR Web サイトまたは Mega Studio セッションを使用して、クラウド ローカリゼーション ライブラリ、Mega Block ストレージ、ブロック名、およびブロック ID を見つけます。合格したデバイスの結果には、APKインストール/launchの証拠と、選択したメガ ブロックに対して観察された実際のデバイスのローカリゼーションが必要です。

実際のデバイスの実行が成功することを期待する前に、公式 EasyAR Unity プラグインとサンプル シーンを EasyAR ダウンロード ページまたは Unity パッケージ マネージャー サンプルからインポートしてください。 `easyar_generate_import_checklist` が PackageCache `Samples~` 候補を報告するがインポートされたシーンが報告されない場合は、`easyar_generate_sample_import_guide` を実行します。画像追跡に関して、このガイドでは公式の `Samples~/StreamingAssets/ImageTargets/ImageTargets.unitypackage` インポートもチェックして、デバイス ビルドが `Assets/StreamingAssets/EasyARSamples/ImageTargets/namecard.jpg`、`namecard.etd`、および `idback.etd` をロードできるようにします。クラウド認識については、このガイドではユーザーが `ImageTracking_CloudRecognition` をパッケージ マネージャーから `Assets/Samples` にインポートするように指示しています。

`SAMPLE_IMPORT_GUIDE.md` には、予想される `Assets/Samples/...` インポート場所とインポート後の検証呼び出しがリストされています。一致するサンプルがローカル `Library/PackageCache/**/Samples~` にすでに存在する場合、`easyar_import_sample_from_package_cache` はそれをフォーカスされたサンプルの `Assets/Samples` にコピーできます。インポート後、Unity のバッチ オートメーションに進む前に、リストされたインポート チェックリスト、準備状況、および重点的なプリフライト呼び出しを実行します。

次に何をすればよいかわからない場合は、`easyar_next_workflow_step` を再度呼び出します。インポート ステータス、準備状況、ローカル構成、シーン/Build設定状態、スクリプト レビュー、デバイス検証ブロッカー、およびハンドオフ アーティファクトを検査し、次に推奨される MCP 呼び出しを返します。

焦点を当てたスコープの安全なハンドオフ パック全体を作成するには:

```text
easyar_write_focused_handoff_pack projectPath=/path/to/UnityProject sampleId=all platform=android accountStage=logged-in
```

パックは、渡された `RUN_RESULT.md` または `CODE_CHANGE.md` を意図的に書き込みません。これらは、実際のデバイスの実行または実際のスクリプトの編集後も証拠に基づいた成果物として残ります。

## 4. Unity プロジェクトを準備します

電話:

```text
easyar_inspect_unity_project projectPath=/path/to/UnityProject
easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_check_sample_readiness projectPath=/path/to/UnityProject sampleId=image-tracking
```

`easyar_prepare_unity_project` も、`Assets/EasyARGenerated/<sampleId>/RUNBOOK.md` の下に重点を置いた Runbook を作成します。イメージ トラッキングの場合、ターゲット アセットのステージング ディレクトリが作成されます。クラウド認識の場合、クラウド認証情報メモ ディレクトリが作成されます。 Mega の場合、Mega ローカル マテリアル メモを作成し、ローカル EasyAR 設定認証情報の存在に関する検証チェックを生成し、実デバイス検証のために `LocationInputMode` を `Onsite` に設定するようユーザーに通知します。

`ProjectSettings/EasyAR/easyar.local.json.example` を `ProjectSettings/EasyAR/easyar.local.json` にコピーして、公式のローカル認証情報を入力するか、環境に裏付けられたシークレットからローカル ファイルを書き込みます:

生成された例は、`_instructions` ブロックを含む有効な JSON です。どの値が EasyAR 登録から取得されるのか/login、クラウド認識/CRS には AppId が必要であること、クライアントエンドのターゲット認識URL、API KEY、API Unity CloudRecognizer の秘密 API キーアクセス、どの値が必要であるかを初めてユーザーに伝えます。チャットに貼り付けることはできません。また、`easyar_write_local_config_from_env` で使用できる環境変数。

別の AI ツールまたはチームメイトが再開できる引き継ぎドキュメントの場合:

```text
easyar_write_local_config_handoff projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android accountStage=not-registered
easyar_write_local_config_form projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android accountStage=not-registered
```

`LOCAL_CONFIG_FORM.md` は、登録後に初めてのユーザーに渡すのが最も安全です/login。各 JSON パス、選択したサンプルに必要なステータス、プレースホルダ、公式ソース、env-var の代替、およびシークレット値を含まない検証コマンドが表示されます。

```bash
export EASYAR_ACCOUNT_TOKEN=your_local_easyar_account_token_if_required
export EASYAR_LICENSE_KEY=your_easyar_sense_license_key
export EASYAR_BUNDLE_IDENTIFIER=com.company.easyarsample
export EASYAR_CLOUD_APP_ID=your_cloud_recognition_app_id
export EASYAR_CLOUD_SERVER_ADDRESS=https://your_crs_client_target_recognition_url
export EASYAR_CLOUD_API_KEY=your_cloud_recognition_api_key
export EASYAR_CLOUD_API_SECRET=your_cloud_recognition_api_secret
```

ここで `EASYAR_ACCOUNT_TOKEN` は、選択した EasyAR ワークフローに独自のローカル アカウント トークン コンシューマがある場合、オプションのローカル Unity 構成マテリアルとしてのみ使用します。現在のイメージ トラッキングと CRS ローカル キー MVP の実行には必要ありません。

```text
easyar_write_local_config_from_env projectPath=/path/to/UnityProject sampleId=cloud-recognition targetPlatform=android
```

書き込みツールは、ローカル環境からのみシークレット値を読み取り、`ProjectSettings/EasyAR/easyar.local.json` を書き込み、フィールドの存在、欠落している環境名、検証ステータス、および次のアクションのみを返します。トークン、ライセンス キー、API、KEY、`appKey`、または `appSecret` は返されません。

その後、シークレットを公開せずに検証します:

```text
easyar_validate_local_config projectPath=/path/to/UnityProject
```

モバイル デバイスにビルドする前に、アプリが `StreamingAssets` から読み取ることができる無視されたランタイム コピーをエクスポートします:

```text
easyar_create_local_config_bridge projectPath=/path/to/UnityProject sampleId=cloud-recognition overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject executeMethod=EasyAR.EditorTools.EasyARLocalConfigBridge.ExportRuntimeConfig
```

ブリッジは、必須フィールドを検証した後、最小化されたランタイム コピーを `Assets/StreamingAssets/EasyAR/easyar.runtime.json` に書き込み、GlobalConfig を使用する公式サンプルに EasyAR グローバル Cloud Recognizer サービス構成を適用します。ランタイム ファイルは git によって無視され、ローカル デバイスのビルドのみを目的としています。これには、EasyAR ライセンス キー、Cloud Recognition `appId`/`serverAddress`/`apiKey`/`apiSecret`、Unity 識別子など、モバイル サンプルが実行時に必要とするフィールドのみが含まれています。 EasyAR アカウント トークン、ウェブサイトのパスワード、または従来の `appSecret` 値はエクスポートされません。

Unity バッチ コマンドの前に、Unity 実行可能セットアップ レポートを作成します。

```text
easyar_unity_environment
easyar_write_unity_environment_report projectPath=/path/to/UnityProject sampleId=image-tracking
```

`UNITY_ENVIRONMENT.md` は、検出された Unity 実行可能ファイル候補、推奨される `EASYAR_UNITY_PATH` 値、および予行演習 `easyar_run_unity_compile_check` を記録します。 Unity は起動せず、EasyAR アカウントや Cloud Recognition シークレットは含まれません。

## 5. ビルド設定を構成します

まず、カメラ対応サンプルのモバイル プレーヤー設定を適用します。

```text
easyar_create_mobile_settings_helper projectPath=/path/to/UnityProject sampleId=image-tracking platform=android bundleIdentifier=com.company.easyarsample overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject executeMethod=EasyAR.EditorTools.EasyARMobileSettingsHelper.ConfigureMobileSettings
```

公式サンプルシーンをインポートした後、次を呼び出します:

```text
easyar_create_build_settings_helper projectPath=/path/to/UnityProject sampleId=image-tracking platform=android overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject executeMethod=EasyAR.EditorTools.EasyARBuildSettingsHelper.ConfigureBuildSettings
```

反復可能な診断の場合は、`logPath=Logs/mcp-easyar-ConfigureBuildSettings.log` を渡すか、Unity バッチ呼び出しのプロジェクト ローカル ログ パスを含む `easyar_generate_run_sequence` 出力に従います。

`sampleId` が指定されている場合、`easyar_run_unity_compile_check` と `easyar_run_unity_method` は焦点を絞ったログ診断と `suggestedRunResultCall` を返します。 `easyar_generate_run_sequence` には、Unity バッチ ステップの `sampleId`、`platform`、およびプロジェクト ローカルの `logPath` 引数が含まれているため、提案された `easyar_write_run_result` 呼び出しは、コンパイル、ビルド設定、サンプル検証、ビルド、またはデバイスの試行後に `Assets/EasyARGenerated/<sampleId>/RUN_RESULT.md` を更新できます。

実際のデバイスを実行する前に、入力可能な結果フォームを生成します。

```text
easyar_write_device_run_result_form projectPath=/path/to/UnityProject sampleId=image-tracking platform=android device="Pixel 8 Android 15" buildOutputPath=Builds/image-tracking.apk
easyar_write_device_run_result_form projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android device="Pixel 8 Android 15" buildOutputPath=Builds/cloud-recognition.apk
```

`DEVICE_RUN_RESULT_FORM.md` には、必要な証拠プロンプトと 2 つの `easyar_write_run_result` 引数テンプレートが含まれています。ブロックされた試行または失敗した試行には、安全なドラフト テンプレートを使用してください。渡されたテンプレートは、必要な物理デバイスのステップがすべて通過した後でのみ使用し、プレースホルダーを観察された証拠に置き換えます。

Android デバイスの検証の場合は、APK が存在する後に adb ヘルパーを使用します。

```text
easyar_android_device_status
easyar_android_install_apk projectPath=/path/to/UnityProject sampleId=image-tracking apkPath=Builds/image-tracking.apk
easyar_android_start_app projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_android_collect_logcat projectPath=/path/to/UnityProject sampleId=image-tracking relativePath=Logs/mcp-easyar-DeviceLog-image-tracking.log
```

`sampleId=cloud-recognition` と `apkPath=Builds/cloud-recognition.apk` で同じシーケンスを繰り返します。これらのヘルパーは、インストール、起動、およびログ キャプチャを証明するだけです。最後の `RUN_RESULT.md` は、物理デバイスが `DEVICE_VALIDATION.md` の視覚サンプル基準も満たした場合にのみ、`passed` とマークされる必要があります。画像追跡の場合、実際的な反復可能なチェックは、コンピュータ画面に既知のターゲット画像を表示し、サンプルが予想されるターゲットを報告するまで、接続されている電話をそれに向けることです。クラウド認識の場合、認識されたターゲットはすでに EasyAR クラウド認識ライブラリにアップロードされている必要があります。

`RUN_RESULT.md` が記録された後、最終的な焦点を絞った完了レポートを生成します:

```text
easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
```

`COMPLETION_REPORT.md` は最新の `RUN_RESULT.md` を解析し、重点的なプリフライトの準備状況を再度チェックし、デバイス検証のブロッカーを検証し、最新の Unity ログ診断を要約します。実行結果が存在しない場合は `not-run`、最新の証拠が渡されていない場合は `blocked` または `failed`、およびフォーカスされたサンプルに記録されたデバイスと合格した実デバイス/device-validation ステップがある場合にのみ `passed` がレポートされます。コンパイルのみまたはビルドのみの成功はブロックされたままです。

現在焦点を当てているスコープについては、画像追跡、クラウド認識、メガを集約します:

```text
easyar_write_focused_scope_status projectPath=/path/to/UnityProject platform=android
```

`FOCUSED_SCOPE_STATUS.md` は、注目しているサンプルがすべて完了しているかどうかを報告し、不完全なサンプルごとに次のアクションをリストします。ユーザーが続行を要求するまで、遅延サンプルはこのステータスになりません。

MCP クライアントは、焦点を絞ったランスルーを別の AI ツールに渡すときに、`easyar://workflow/focused-scope` を読み取るか、`easyar-close-focused-scope` プロンプトを使用できます。

導入完了のタグ付け、公開、または呼び出しの前に、運用証拠マトリックスを生成します。

```text
easyar_write_deployment_readiness projectPath=/path/to/UnityProject
easyar_write_production_validation projectPath=/path/to/UnityProject platform=android verificationEvidence=not-provided
```

`PRODUCTION_VALIDATION.md` は意図的に厳密です。リリース ファイル、公式 EasyAR アカウント エンドポイント、記録された検証コマンド、公式アクセス レポート、およびすべての焦点を当てたサンプル完了レポートが実際の証拠を提供するまで、それは不完全なままです。検証コマンドがリリース コミットに合格したら、`verificationEvidence=passed` を使用してコマンドを再生成します。

リポジトリ/packageを検証するには、次のコマンドを実行します。

```bash
npm run security:check
npm run release:check
```

実際の npm パブリッシュまたはタグをリリースする前に、最終本番ゲートを強制します:

```bash
EASYAR_RELEASE_REQUIRE_PRODUCTION_READY=1 npm run release:check
```

npm パッケージの場合は、保護された `npm-publish` 環境を構成した後、手動の GitHub Actions `Release` ワークフローを使用します。ワークフローは `npm publish --provenance` の前に厳密なゲートを実行するため、パッケージの公開では公式のエンドポイントと実際のデバイスの証拠を回避できません。ローカル リリース チェックの場合は、渡されたフォーカスされたサンプル アーティファクトを含む Unity プロジェクトに `EASYAR_RELEASE_PROJECT_PATH` を設定します。 GitHub リリース ランナーの場合、`easyar_write_release_evidence` で安全な証拠ファイルを生成した後に `EASYAR_RELEASE_EVIDENCE_PATH=docs/release-evidence/focused-scope.android.json` を設定します。

`npm run release:check` では 2 つの準備行が報告されます。現在の 3 サンプルのローカルキー リリース候補の場合、`Local-key MVP ready: yes` はパッケージ/install のドキュメントに合格し、検証に合格し、画像追跡、クラウド認識、Mega が Android 上で実行されたことを証明するコミットされた安全な証拠を意味します。 `Production ready: yes` はより厳格で、EasyAR 公式アカウント/license/download/cloud エンドポイント変数と公式アクセス チェックが接続されるまでブロックされたままになります。

npm 公開前の GitHub のみの配布の場合は、`gate=local-key-mvp` で手動の GitHub アクション `GitHub Release` ワークフローを実行します。 `EASYAR_RELEASE_REQUIRE_LOCAL_KEY_MVP=1` を強制し、プロジェクトを `npm pack` でパックし、tarball を GitHub リリース アセットとしてアップロードします。 npm の既存の `Release` ワークフローは、本番環境の公式 API ゲートの準備ができた後にのみ使用してください。

公式 EasyAR ステージングまたは本番エンドポイントが構成されたら、公式 API Canary:

 を実行します。
```bash
EASYAR_CANARY_PROJECT_PATH=/path/to/UnityProject EASYAR_CANARY_PLATFORM=android npm run official-api:canary
```

カナリアは MCP サーバーと同じエンドポイント環境変数を使用し、両方の焦点を当てたサンプルをチェックし、安全なブロッカー ID のみを出力します。

実際のバックエンド サービスが存在する前にローカルのエンドポイントとコントラクトの接続を行う場合は、1 つのシェルで `npm run official-api:stub` を実行し、別のシェルで出力するエンドポイント変数をエクスポートしてから、`npm run official-api:canary` を実行します。スタブはフィクスチャ メタデータのみを返します。実稼働アカウント サービスとして使用しないでください。

完全な非シークレット変数チェックリストとして `.env.example` を使用してください。 `EASYAR_RELEASE_REQUIRE_PRODUCTION_READY=1` は、最終リリース タグ、npm 公開、または保護された CI 環境用に保持します。設定を解除したままにするか、ローカルで反復するときに`0`ください。

公式 EasyAR アセットをインポートし、ビルド設定を構成した後、生成された Unity 側に焦点を当てたサンプル バリデータを実行します。

```text
easyar_create_sample_validation_helper projectPath=/path/to/UnityProject sampleId=image-tracking overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject executeMethod=EasyAR.EditorTools.EasyARSampleValidationHelper.ValidateFocusedSample
```

バリデータは、公式 EasyAR インポート信号をチェックするときに、生成された MCP ヘルパー ファイルを無視し、一致するフォーカスされたサンプル シーンが最初に有効になっているビルド設定シーンであることを必要とします。

## 6. プロジェクト コードを追加します

共通のサンプル ロジックについては、次の呼び出しを行います。

```text
easyar_write_config_integration_audit projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_programming_context projectPath=/path/to/UnityProject sampleId=image-tracking goal="Show content when an image target is found"
easyar_write_code_plan projectPath=/path/to/UnityProject sampleId=image-tracking goal="Show content when an image target is found"
easyar_create_mono_behaviour projectPath=/path/to/UnityProject relativePath=Assets/Scripts/ImageTargetContentController.cs className=ImageTargetContentController kind=image-tracking
```

別の AI ツールまたは人間の開発者がスクリプト作業を引き継ぐ場合は、`CODE_PLAN.md` の前に `CONFIG_INTEGRATION.md` と `PROGRAMMING_CONTEXT.md` を読み取ります。構成監査は、パスとシグナルのみによって、おそらくライセンス/cloud 資格情報コンシューマーを示します。ローカル シークレット値は出力されません。

MCP クライアントは、Unity C# スクリプトを編集する前に `easyar://workflow/programming` を読み取ることもできます。これには、必要な編集前アーティファクト、範囲指定された編集ルール、編集後のチェック、Codex、Claude、または人間の開発者への引き継ぎ順序がまとめられています。

`CODE_PLAN.md` には構造化検証呼び出しが含まれます。スクリプトを編集した後、リストされた `easyar_review_csharp_scripts` および `easyar_run_unity_compile_check` 呼び出しを実行し、コンパイル ツールの `suggestedRunResultCall` を使用して `RUN_RESULT.md` を更新します。

カスタム コードの場合は、次を使用します。

```text
easyar_write_csharp_file
```

コンパイル前に生成または編集したスクリプトを確認します:

```text
easyar_review_csharp_scripts projectPath=/path/to/UnityProject
easyar_write_code_change_summary projectPath=/path/to/UnityProject sampleId=image-tracking goal="Summarize script changes" targetFiles='["Assets/Scripts/ImageTargetContentController.cs"]'
easyar_run_unity_compile_check projectPath=/path/to/UnityProject sampleId=image-tracking platform=android logPath=Logs/mcp-easyar-CodeCompileCheck.log
```

## 7. 最終準備チェック

電話:

```text
easyar_check_sample_readiness projectPath=/path/to/UnityProject sampleId=image-tracking
```

`ready` が `true` の場合、Unity を開くかバッチ モードを使用して生成されたエディタ ヘルパーを実行し、実際の Android または iOS デバイスにビルドしてカメラ/tracking 検証を行います。

## 8. デバイス ビルド ヘルパーの生成

ビルド設定を構成した後、静的ビルド メソッドを生成します。

```text
easyar_create_device_build_helper projectPath=/path/to/UnityProject platform=android outputPath=Builds/EasyARSample.apk overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject executeMethod=EasyAR.EditorTools.EasyARDeviceBuildHelper.Build
```

iOS の場合は、`Builds/iOS` などの出力フォルダを使用し、Xcode または Unity Player 設定でのサインインを完了します。

## 9. デバッグ ログ

Unity のコンパイル、エディタの自動化、またはデバイスのビルドが失敗した場合は、関連するログの抜粋を MCP サーバーに返します。

```text
easyar_analyze_unity_log sampleId=image-tracking logText="..."
```

ローカル ログ ファイルの場合:

```text
easyar_analyze_unity_log sampleId=cloud-recognition logPath=/path/to/Editor.log
```

MCP サーバーが最新の Unity ログを自動的に検索できるようにするには:

```text
easyar_analyze_latest_unity_log projectPath=/path/to/UnityProject sampleId=cloud-recognition
```

このツールは、一般的な EasyAR ライセンス、プラグインのインポート、カメラの許可、C# コンパイル、Android/Gradle、iOS 署名、サンプル シーンの問題を分類します。 `sampleId=image-tracking` または `sampleId=cloud-recognition` を使用すると、焦点を絞ったターゲット アセット、クラウド認証情報、ネットワーク診断が追加されます。

## 9. GitHub の問題を報告する

生成されたチェックの後も焦点を当てたサンプルが失敗する場合は、編集されたレポートを作成します。

```text
easyar_write_support_bundle projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android overallStatus=blocked
easyar_write_issue_report projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android overallStatus=blocked
```

`Assets/EasyARGenerated/<sampleId>/ISSUE_REPORT.md` の内容を GitHub の問題に貼り付け、そこにリストされている `SUPPORT_BUNDLE.md`、`RUN_RESULT.md`、`SCENE_AUDIT.md`、および Unity ログ パスを添付または参照します。投稿する前にレポートを確認し、プライベート ライセンス、トークン、appKey、appSecret、署名、プロビジョニング、またはアカウント データを削除してください。
