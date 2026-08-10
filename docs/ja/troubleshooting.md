# mcp-easyar 重点的なサンプルのトラブルシューティング

現在の実行作業は、画像追跡、クラウド認識、および Mega に限定されています。他の EasyAR サンプルは後の拡張用にカタログされているため、まだこの MCP サーバーによって検証されたものとして扱わないでください。

## 最初のチェック

Unity シーンを手動でデバッグする前にこれらを実行してください:

```text
easyar_write_onboarding_report projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_import_checklist projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_run_report projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_scene_audit projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_support_bundle projectPath=/path/to/UnityProject sampleId=image-tracking
```

クラウド認識には `sampleId=cloud-recognition` を使用し、メガには `sampleId=mega` を使用します。

## 画像追跡

一般的な阻害要因:

- `easyar-official-import`: 公式 EasyAR Unity プラグインは `Assets` または `Packages` の下に表示されません。
- `sample-scene`: イメージ トラッキング シーンの候補が見つからないか、一致するシーンがビルド設定で有効になっていません。
- `image-target-assets`: ターゲット画像またはターゲットメタデータアセットがありません。
- `image-target-streaming-assets`: 公式の `Samples~/StreamingAssets/ImageTargets/ImageTargets.unitypackage` ターゲット データは `Assets/StreamingAssets/EasyARSamples/ImageTargets` にインポートされていません。
- `image-tracking-target-load`: Unity ログには、ターゲット ファイルをロードできないことが示されています。
- `image-tracking-no-detection`: アプリはカメラを開きますが、ターゲットを検出しません。

カスタム シーンのメモ:

MCP サーバーは、公式サンプルの命名ヒントと、`ImageTarget`、`ImageTracker`、`TargetDataFileSource` などのシーン コンテンツ マーカーによってイメージ トラッキング シーンを認識します。これにより、ファイル名に `ImageTracking`.
 が含まれていない場合でも、RMB 認識シーンなどのカスタム シーンを画像追跡候補として扱うことができます。
公式サンプル ターゲット データのメモ:

デバイス ログで `EasyARSamples/ImageTargets/namecard.jpg`、`namecard.etd`、または `idback.etd` などの欠落ファイルが報告された場合は、EasyAR Sense Unity Plugin パッケージから `Samples~/StreamingAssets/ImageTargets/ImageTargets.unitypackage` をインポートし、Unity を更新し、再構築して再テストします。安定した視覚的検証ループは、コンピュータ画面にターゲット画像を表示し、サンプルが見つかったターゲットを報告するまで、接続されている携帯電話をその画像に向けることです。

推奨フロー:

```text
easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_create_build_settings_helper projectPath=/path/to/UnityProject sampleId=image-tracking platform=android overwrite=true
easyar_create_sample_validation_helper projectPath=/path/to/UnityProject sampleId=image-tracking overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject executeMethod=EasyAR.EditorTools.EasyARSampleValidationHelper.ValidateFocusedSample
easyar_analyze_latest_unity_log projectPath=/path/to/UnityProject sampleId=image-tracking
```

>それでも検証が失敗する場合は、次のように再生成します。

```text
easyar_write_support_bundle projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=image-tracking platform=android overallStatus=blocked
easyar_write_issue_report projectPath=/path/to/UnityProject sampleId=image-tracking platform=android overallStatus=blocked
```

## クラウド認識

一般的な阻害要因:

- `cloud-recognition-credentials`: `ProjectSettings/EasyAR/easyar.local.json` には、プレースホルダ以外の `appId` と Sense 4.1 以降の `apiKey`、または完全な従来の `appId`/`appKey`/`appSecret` セットは含まれません。
- `cloud-target-library-ready`: EasyAR アカウントにクラウド認識画像ライブラリがないか、選択したライブラリにアップロードされたテスト ターゲット画像がありません/enabled。
- `focused-sample-scene-imported`: クラウド認識サンプルは EasyAR パッケージ キャッシュに存在しますが、`Assets/Samples`.
 にはインポートされていません。- `package-cache-sample-available`: MCP サーバーは `Library/PackageCache/**/Samples~` で候補を見つけました。 Unity Package Manager サンプルを通じてインポートします。
- `cloud-recognition-network`: Unity またはデバイスのログは、タイムアウト、到達不能なホスト、TLS、DNS、またはサービス接続の問題を示します。
- `sample-scene`: クラウド認識シーンの候補が見つからないか、一致するシーンがビルド設定で有効になっていません。
- `camera-permission`: アプリはデバイスのカメラ権限にアクセスできません。

パッケージキャッシュに関する注記:

EasyAR パッケージのサンプルは、プロジェクトにインポートされる前に `Library/PackageCache/.../Samples~/ImageTracking/ImageTracking_CloudRecognition` の下に表示されます。 MCP サーバーはこれらのパスをインポート候補として報告しますが、ビルド設定とシーンの検証が成功する前に、Unity はサンプルを `Assets/Samples` にインポートする必要があります。

クラウド認識デバイスパスメモ:

`easyar_android_install_apk`、`easyar_android_start_app`、および `easyar_android_collect_logcat` は、インストール、起動、およびログ キャプチャのみを証明します。合格したクラウド認識 `RUN_RESULT.md` には、構成された EasyAR クラウド認識ターゲット ライブラリ、少なくとも 1 つのアップロードされたテスト ターゲット イメージ、サービスへの実デバイス ネットワーク パス、およびそのターゲットの観察された認識も必要です。

推奨フロー:

```text
easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=cloud-recognition
easyar_validate_local_config projectPath=/path/to/UnityProject
easyar_check_official_access projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_create_build_settings_helper projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android overwrite=true
easyar_create_sample_validation_helper projectPath=/path/to/UnityProject sampleId=cloud-recognition overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject executeMethod=EasyAR.EditorTools.EasyARSampleValidationHelper.ValidateFocusedSample
easyar_analyze_latest_unity_log projectPath=/path/to/UnityProject sampleId=cloud-recognition
```

検証または実際のデバイスの実行がまだ失敗する場合は、次を再生成します。

```text
easyar_write_support_bundle projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android overallStatus=blocked
easyar_write_issue_report projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android overallStatus=blocked
```

`ISSUE_REPORT.md` を GitHub の問題に貼り付け、そこにリストされている `SUPPORT_BUNDLE.md`、`RUN_RESULT.md`、`SCENE_AUDIT.md`、および Unity ログ パスを参照します。公開する前にすべてのアーティファクトを確認してください。

## Mega

一般的なブロッカー:

- `mega-assets`: Mega、Mega Block、CloudLocalizer、またはプロジェクト固有の Mega シーン アセットのヒントが `Assets` または `Packages` で見つかりませんでした。
- `mega-block-config`: Unity またはデバイスログには、選択したメガ ブロックまたはクラウド ローカリゼーション ライブラリを読み込めないことが示されています。
- `mega-hybridclr`: HybridCLR で生成されたファイルが現在の Android ビルド ターゲットに対して見つからないか、古いです。
- `mega-arcore-manifest`: Android マニフェスト、ARCore メタデータ、または `minSdkVersion` 競合により APK パッケージがブロックされます。
- `mega-localization-runtime`: アプリは起動しますが、実際のデバイスの Mega ローカリゼーションは成功しません。

Mega デバイスのパスに関する注意:

コンパイルまたは APK ビルドが成功するだけでは、Mega には十分ではありません。合格した Mega `RUN_RESULT.md` には、APK インストール/launch の証拠に加え、選択したクラウド ローカリゼーション ライブラリと Mega ブロックの実デバイス ローカリゼーションの証拠が必要です。ユーザーは、すでにログインしている EasyAR Web サイトまたは Mega Studio セッションでライブラリとブロックの識別子を見つける必要があります。 MCPチャットでウェブサイトの認証情報や秘密キーを収集しないでください。

推奨フロー:

```text
easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=mega
easyar_write_local_config_form projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_check_sample_readiness projectPath=/path/to/UnityProject sampleId=mega
easyar_create_build_settings_helper projectPath=/path/to/UnityProject sampleId=mega platform=android overwrite=true
easyar_create_sample_validation_helper projectPath=/path/to/UnityProject sampleId=mega overwrite=true
easyar_analyze_latest_unity_log projectPath=/path/to/UnityProject sampleId=mega
```

APK が構築され、電話が接続されたら、Android デバイス Runbook を使用して結果を記録します。

```text
easyar_write_android_device_runbook projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_device_run_result_form projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=mega platform=android overallStatus=passed
easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=mega platform=android
```

## セキュリティ

EasyAR ライセンス キー、アカウント トークン、クラウド認識API KEY/API シークレット、`appKey` または `appSecret`、署名キー、プロビジョニング プロファイル、デバイス プライベート ID、または完全なプライベート ログを投稿しないでください。 MCP レポートでは一般的なキー名が編集されていますが、ユーザーは GitHub で公開する前に問題の内容を確認する必要があります。
