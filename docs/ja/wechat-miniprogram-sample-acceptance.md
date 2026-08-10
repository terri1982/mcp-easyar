# EasyAR WeChat ミニ プログラム サンプルの受け入れ

このチェックリストは、焦点を当てた `wechat-mega` および `wechat-crs` サンプルの証拠ゲートです。これは意図的にローカル キーと公式ツール ベースになっています。ユーザーは公式 Web サイトまたは WeChat 開発者ツールで EasyAR と WeChat にサインインし、公式パッケージをダウンロードし、自分のマシンでローカル設定を入力し、MCPローカル ファイルと編集された証拠のみを検査できるようにします。

EasyAR パスワード、WeChat パスワード、確認コード、ライセンス キー、CRS API は貼り付けないでください。キー/secrets、アプリのシークレット、キーのアップロード、QR コードのプレビュー、チャットへの生のプライベート ログ。

## サポートされているサンプル

- `wechat-mega`: EasyAR Mega WeChat Mini プログラムのサンプル。
- `wechat-crs`: EasyAR CRS / クラウド認識 WeChat Mini プログラムサンプル。

その他の WeChat ミニ プログラム サンプルは、明示的に要求されるまで対象外です。

## 必要なローカル入力

ユーザーはこれらを MCP の外部で準備する必要があります:

- `project.config.json` と `app.json` を含む WeChat ミニ プログラム プロジェクト ディレクトリ。
- WeChat 開発者ツールがローカルにインストールされ、ログインしています。
- ユーザーが EasyAR Web サイトからダウンロードした公式 EasyAR ミニ プログラム SDK/sample パッケージ。
- ミニ プログラム アプリ ID にバインドされた EasyAR ライセンス。
- `wechat-mega` の場合: メガ アプリ/server 情報と選択したクラウド ローカリゼーション ライブラリ/block メタデータ。
 - `wechat-crs` の場合: CRS アプリ ID、サーバー アドレス、API キー、API シークレット、および少なくとも 1 つのアップロードされたクラウド ターゲット イメージ。

`wechat-mega` 特に EasyAR Mega WeChat Mini プログラム SDK/sample パッケージまたは既存の WeChat ミニ プログラム メガ プロジェクト。 Unity Mega プロジェクト、Android APK、PICO ビルド、または XREAL ビルドは参考証拠として役立ちますが、これは Mini Program Mega サンプルではないため、単独でこのターゲットを完了することはできません。

## 公式ダウンロード ハンドオフ

MCP では、ユーザーは EasyAR Web サイトにサインインせず、ダウンロード資格をバイパスしません。ユーザーは、自分のブラウザで公式 EasyAR ダウンロード ページを開く必要があります:

```text
https://www.easyar.cn/view/download.html
```

推奨検索語:

- `wechat-mega`: 微信小程序、Mega、EasyAR Mega、ミニ プログラム
- `wechat-crs`: 微信小程序、CRS、クラウド認識、ミニ プログラム

現在の公式ダウンロード エントリ:

- `wechat-mega`: `EasyAR Mega 微信小程序示例`、バージョン `2.0.3`、ファイル名 `easyar-mega-wechat-miniprogram-plugin-2.0.3-1077.647aaae_samples.zip`、ドキュメント `https://www.easyar.cn/doc/zh-cn/develop/wechat/mega/quickstart.html`
- `wechat-crs`: `EasyAR CRS 微信小程序示例`、バージョン `2.0.0`、ファイル名 `EasyAR-miniprogram-WebAR-Demo-tracking.zip`、ドキュメント `https://www.easyar.cn/doc/zh-cn/develop/wechat/cloud-recognition/quickstart.html`

これらのファイルは EasyAR Web サイトのログインによって保護されています/entitlement.MCP は、ユーザーのアカウントのパスワードを使用してファイルをダウンロードしたり、認証をバイパスしたりしません。ユーザーは、独自の公式ブラウザ セッションでファイルをダウンロードする必要があります。

ダウンロード後、ローカルに抽出したディレクトリまたは `.zip` パスを `easyar_import_miniprogram_sample_from_local_package` に渡します。 MCP が Unity プロジェクトを検出すると、それを WeChat ミニ プログラムのサンプル ソースとして拒否します。

## 推奨される MCP シーケンス

`/path/to/miniprogram` と `/path/to/official/package-or.zip` をローカル パスに置き換えます。公式パッケージ パスは、抽出されたディレクトリまたはダウンロードされた `.zip`.

 です。
```text
easyar_list_miniprogram_samples
easyar_check_wechat_devtools
easyar_find_miniprogram_official_package sampleId=wechat-mega searchRoots='["/Users/you/Downloads","/Users/you/Documents"]'
easyar_write_miniprogram_official_package_search projectPath=/path/to/miniprogram sampleId=wechat-mega searchRoots='["/Users/you/Downloads","/Users/you/Documents"]'
easyar_create_miniprogram_sample_workspace projectPath=/path/to/miniprogram sampleId=wechat-mega appId=wx-your-appid
easyar_write_miniprogram_local_config_form projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_import_miniprogram_sample_from_local_package projectPath=/path/to/miniprogram sampleId=wechat-mega packagePath=/path/to/official/package-or.zip dryRun=true
easyar_import_miniprogram_sample_from_local_package projectPath=/path/to/miniprogram sampleId=wechat-mega packagePath=/path/to/official/package-or.zip dryRun=false
easyar_inspect_miniprogram_project projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_run_through_status projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_preflight projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_run_sequence projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_run_miniprogram_devtools_check projectPath=/path/to/miniprogram sampleId=wechat-mega mode=open dryRun=true
easyar_run_miniprogram_devtools_check projectPath=/path/to/miniprogram sampleId=wechat-mega mode=open dryRun=false
easyar_run_miniprogram_devtools_check projectPath=/path/to/miniprogram sampleId=wechat-mega mode=preview dryRun=true
easyar_run_miniprogram_devtools_check projectPath=/path/to/miniprogram sampleId=wechat-mega mode=preview dryRun=false
easyar_analyze_miniprogram_devtools_log projectPath=/path/to/miniprogram sampleId=wechat-mega logPath=easyar-generated/wechat-mega/DEVTOOLS_CHECK.log
easyar_write_miniprogram_device_validation_checklist projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_run_result_form projectPath=/path/to/miniprogram sampleId=wechat-mega
```

CRS パスには `sampleId=wechat-crs` を使用します。

## 実機検証

サンプルは、WeChat 開発者ツールを使用して実際の携帯電話でプレビューするまで完成しません。

プロジェクトが正常に開いたら、`easyar_run_miniprogram_devtools_check mode=preview` を使用してください。デフォルトでは、`easyar-generated/<sampleId>/WECHAT_PREVIEW_QR.png` と `easyar-generated/<sampleId>/WECHAT_PREVIEW_INFO.json` がローカル プレビュー アーティファクトとして準備されます。 QR コードはプライベートなローカル証拠です。貼り付けたりコミットしたりしないでください。インストールされている WeChat 開発者ツールのバージョンが別のプレビュー引数を使用している場合は、正確な `devtoolsArgs` を渡します。MCP によって作成されたワークスペース

は、これらのプレビュー アーティファクトを `.gitignore` に追加します。既存のプロジェクトの場合は、プレビューを実行する前に同等の無視ルールを追加します。

両方のサンプルについて、次のことを記録します。

- テストされたデバイス モデル
- WeChat バージョン（既知の場合）
- カメラの権限が付与されたかどうか
- DevTools プレビュー/open 結果
- 編集されたログ パスまたは編集されたスクリーンショットパス
 - 観察された動作の短い概要

`wechat-mega`の場合、必要な証明は、選択されたマッピングされた環境における実際のデバイスのローカリゼーション/trackingです。適切な証拠には、ローカリゼーションの成功、ブロックの検出、追跡の開始を示す編集されたログまたはスクリーンショットのメモ、または同等の公式サンプル成功信号が含まれます。

`wechat-crs`の場合、必要な証拠は、意図されたクラウド ターゲットを認識することです。適切な証拠には、ターゲット名/idまたは公式のサンプル認識成功信号を示す編集されたログまたはスクリーンショットのメモが含まれます。ターゲット イメージは、ユーザーによって EasyAR クラウド認識ライブラリにアップロードされている必要があります。

`easyar_analyze_miniprogram_devtools_log` では、ブロッカーの検出結果と `successSignals` の両方が報告されます。証拠を渡すには、`camera-ready`、`devtools-preview-ready`、`mega-localized`、`crs-recognized` などの成功シグナルを優先し、編集された証拠の行を実行結果の概要にコピーします。

## 結果の記録

実際のデバイスのプレビュー後、実行結果を書き込みます。 `passedStepIds` は `DEVICE_VALIDATION.md` から取得する必要があります。

プロジェクトに `docs/crs-real-evidence.json` などの編集されたローカル証拠ファイルがすでにある場合は、それを `redactedEvidencePath` として渡します。パスはミニ プログラム プロジェクト内に存在する必要があります。 QR コード、生のプライベート ログ、ライセンス キー、API シークレット、またはトークンを概要に貼り付けないでください。

Mega の例:

```text
easyar_write_miniprogram_run_result projectPath=/path/to/miniprogram sampleId=wechat-mega overallStatus=passed devtoolsStatus=passed devicePreviewStatus=passed passedStepIds='["official-login","project-preflight","devtools-check","real-device-preview","mega-service-ready","mega-localized-on-device"]' evidenceSummary="Real-device WeChat preview localized in the mapped Mega environment; redacted log/screenshot evidence recorded locally."
easyar_write_miniprogram_completion_report projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_scope_status projectPath=/path/to/miniprogram
```

CRSの例:

```text
easyar_write_miniprogram_run_result projectPath=/path/to/miniprogram sampleId=wechat-crs overallStatus=passed devtoolsStatus=passed devicePreviewStatus=passed passedStepIds='["official-login","project-preflight","devtools-check","real-device-preview","crs-service-ready","crs-recognized-on-device"]' evidenceSummary="Real-device WeChat preview recognized the intended CRS cloud target; redacted log/screenshot evidence recorded locally."
easyar_write_miniprogram_completion_report projectPath=/path/to/miniprogram sampleId=wechat-crs
easyar_write_miniprogram_scope_status projectPath=/path/to/miniprogram
```

`COMPLETION_REPORT.md` は次の場合にのみ完了します:

- `PREFLIGHT.md` は存在しますが、ブロックされたチェックはありません。
- `DEVICE_VALIDATION.md` が存在します。
- `DEVTOOLS_CHECK.log` は存在しますが、既知のブロッカー検出結果はなく、`devtools-preview-ready`、`camera-ready`、`mega-localized`、`crs-recognized` などの認識された成功シグナルが少なくとも 1 つ含まれています。
- `RUN_RESULT.md` には `Run-through complete: yes` と記載されており、プレースホルダー テキストではなく、使用可能な編集された証拠の概要が含まれています。
- 実行結果は、実際のデバイスのプレビュー証拠を参照します。
- `MINIPROGRAM_SCOPE_STATUS.md` は、`wechat-mega` と `wechat-crs` の両方の完了レポートが通過した後にのみ `All Mini Program samples complete: yes` をレポートします。

## リリース請求ポリシー

`wechat-mega` または `wechat-crs` が生成されたアーティファクトのみから実行されるとは主張しないでください。有効な公開主張には、ローカル プロジェクトの成果物と編集された実際のデバイスの証拠が必要です。コンパイル/openが成功するだけでも有益な進捗状況ですが、サンプルが完了したわけではありません。
