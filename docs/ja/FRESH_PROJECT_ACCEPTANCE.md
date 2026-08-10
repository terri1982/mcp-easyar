# mcp-easyar 新しいプロジェクトの承認

このチェックリストは、新しい Unity プロジェクトが現在のローカル キー MVP を使用して焦点を当てた EasyAR サンプル ターゲットに到達できることを証明します。

現在の承認範囲:

- 画像追跡
- CRS/Cloud 認識
- Mega

ユーザーが明示的に続行するまで範囲外:

- Hello AR
- サーフェス トラッキング
- その他の EasyAR Sense Unity プラグイン サンプル
- 自動化された公式 EasyAR アカウントAPI アクセス
- npm パッケージの前に npm または npx をインストール公開されています

## 前提条件

- Unity `2022.3.62f3` または互換性のある Unity 2022.3 LTS エディタがインストールされています。
- Node.js 20 以降が利用可能です。
- MCP パッケージは現在のバージョンからインストールされていますGitHub リリース tarball。
- 公式 EasyAR Sense Unity プラグインは EasyAR Web サイトからダウンロードされ、Unity プロジェクトにインポートされます。
- 最終証拠には Android デバイスの検証が推奨されます。編集者のみのチェックでは AR 認識を証明するには十分ではありません。

現在のプレリリースをインストールしてください:

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.41/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## 安全ルール

ローカルキーMVPはアカウントと機密資料を意図的にチャット外に保持します。

これらの値をコーデックス、クロード、発行コメント、ドキュメント、ログ、またはコミットされたファイルに貼り付けないでください:

- EasyAR Web サイトのパスワード
- 確認コード
- ライセンスキー
- CRS API キーまたは API シークレット
- `appKey`
- `appSecret`

ユーザーは、EasyAR 公式 Web サイトで独自のブラウザで登録、ログイン、パッケージのダウンロード、キーの作成、クラウド ターゲット ライブラリの管理を行います。 MCP はプロセスをガイドし、編集されたローカルの存在を検証するだけです。

Unity プロジェクトのローカル構成パスは次のとおりです:

```text
ProjectSettings/EasyAR/easyar.local.json
```

このファイルはローカルに保持し、git によって無視される必要があります。

## 最初のクライアント呼び出し

Codex、Claude Desktop、または別の MCP クライアントに接続した後、次の呼び出しを行います。

```text
easyar_server_status
easyar_check_client_setup client=codex entrypointMode=package-bin includeTokenPlaceholder=false
```

次に、次のリソースをお読みください:

```text
easyar://client/acceptance
easyar://acceptance/fresh-project
easyar://status/remaining-work
easyar://workflow/focused-scope
easyar://workflow/programming
```

サーバー名が `mcp-easyar` の場合、クライアントの準備は完了しています。注目したサンプルには `image-tracking`、`cloud-recognition`、`mega` が含まれており、`easyar-mcp-check` は必要なリソースをすべて OK として報告します。

## 新しい Unity プロジェクト フロー

最初のローカル ハンドオフ アーティファクトを作成します:

```text
easyar_write_client_setup outputRoot=/path/to/report-folder client=codex entrypointMode=package-bin
easyar_write_first_run_guide projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_write_local_config_handoff projectPath=/path/to/UnityProject accountStage=logged-in sampleId=cloud-recognition platform=android
easyar_write_local_config_form projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
```

`ProjectSettings/EasyAR/easyar.local.json` をローカルに入力するか、次のようにローカル環境変数から書き込みます:

```text
easyar_write_local_config_from_env projectPath=/path/to/UnityProject overwrite=false
easyar_validate_local_config projectPath=/path/to/UnityProject sampleId=cloud-recognition
```

画像追跡の場合は、焦点を絞ったセットアップ シーケンスを実行します。

```text
easyar_write_import_checklist projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_sample_import_guide projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_import_sample_from_package_cache projectPath=/path/to/UnityProject sampleId=image-tracking dryRun=true
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_create_sample_validation_helper projectPath=/path/to/UnityProject overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject methodName=EasyARGenerated.SampleValidationHelper.ValidateFocusedSample sampleId=image-tracking platform=android
easyar_write_run_sequence projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
```

CRS/Cloud 認識の場合は、`sampleId=cloud-recognition` で同じ焦点を当てたセットアップ シーケンスを実行します。ユーザーは、少なくとも 1 つのターゲット イメージがアップロードされ、必要なローカル CRS フィールドが入力された CRS クラウド ターゲット ライブラリをすでに持っている必要があります。

```text
easyar_write_import_checklist projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_sample_import_guide projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_import_sample_from_package_cache projectPath=/path/to/UnityProject sampleId=cloud-recognition dryRun=true
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_run_unity_method projectPath=/path/to/UnityProject methodName=EasyARGenerated.SampleValidationHelper.ValidateFocusedSample sampleId=cloud-recognition platform=android
easyar_write_run_sequence projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
```

Mega の場合は、Mega 用の公式 EasyAR Sense Unity プラグインを使用し、`sampleId=mega` で集中的なセットアップ シーケンスを実行します。ユーザーはすでに EasyAR パッケージ バインド ライセンスを持っている必要があり、ログインした自分の EasyAR Web サイトまたは Mega Studio セッションを使用して、クラウド ローカリゼーション ライブラリ、Mega Block ストレージ、ブロック名、およびブロック ID を見つける必要があります。 Unity をローカルで構成します。ライセンスまたは API シークレットの値をチャットに貼り付けないでください。

```text
easyar_write_import_checklist projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_sample_import_guide projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_import_sample_from_package_cache projectPath=/path/to/UnityProject sampleId=mega dryRun=true
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_check_sample_readiness projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_run_sequence projectPath=/path/to/UnityProject sampleId=mega platform=android
```

Android スマートフォン/tablet、PICO、および XREAL Mega 検証の場合は、Mega サンプル `LocationInputMode` を `Onsite` に設定します。 PICO 4 Ultra Enterprise ヘッドセットの検証の場合は、公式 EasyAR Unity XR デバイス拡張パッケージをインストールし、`PicoFrameSource` のみを保持し、PICO Unity 統合 SDK `3.1.0` 以降を使用します。 Mega の結果が渡されるには、選択したマップされた物理環境でのビルド/install/launch/readinessとローカリゼーション/tracking信号が必要です。

ビルドとデバイスの検証では、焦点を当てた証拠を書き込む必要があります:

```text
easyar_android_device_status
easyar_write_device_validation_checklist projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=image-tracking platform=android status=passed recognitionVerified=true
easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=image-tracking platform=android runThroughComplete=true
easyar_write_device_validation_checklist projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android status=passed recognitionVerified=true
easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android runThroughComplete=true
easyar_write_device_validation_checklist projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=mega platform=android status=passed recognitionVerified=true
easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=mega platform=android runThroughComplete=true
easyar_write_focused_scope_status projectPath=/path/to/UnityProject platform=android
```

## 承認基準

 - `easyar-mcp-check` 新しいプロジェクト承認リソースを渡して報告します。
 - クライアントのセットアップは、Codex または Claude Desktop の `package-bin` を通じて機能します。
 - `ProjectSettings/EasyAR/easyar.local.json` シークレット値を出力せずにローカルで検証します。
 - 画像追跡により実デバイスの認識が完了します。パス。
- CRS/Cloud 認識により、クラウド ターゲットに対する実デバイス認識パスが完了します。
- Mega は、Android スマートフォン/tablet、PICO、または XREAL で `LocationInputMode=Onsite` の実デバイス ローカリゼーション パスを完了します。
- `FOCUSED_SCOPE_STATUS.md` レポート `allFocusedSamplesComplete=true`。
- 生成されたレポートには、生のシークレットではなく、パス、編集されたプレゼンス、次のアクションが含まれます。
- 同じリリース タグの GitHub リリース tarball スモーク パス。

これらのチェックに合格すると、現在フォーカスされているローカル キー MVP が受け入れられます。新しい Unity プロジェクトの場合。
