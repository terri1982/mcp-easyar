# Mega Fresh プロジェクト Android の起動とローカリゼーションの証拠

日付: 2026-06-12

範囲: 新しい Unity プロジェクト Mega サンプルの Android、Unity `2022.3.62f3`.
 での起動とローカリゼーションの検証
安全な証拠のみ。この概要では、EasyAR Web サイトのパスワード、確認コード、ライセンス キー、API キー/API シークレット値、appKey/appSecret、署名キー、APK バイナリ、Unity パッケージ、生のプライベート ログを意図的に除外しています。

## 新しいプロジェクトのセットアップ

- 以前の Tiantan プロジェクトを再利用するのではなく、検証のために新しい Unity プロジェクトが作成されました。
- 公式にダウンロードされたパッケージが使用されました:
- `com.easyar.sense` `4002.0.0+4956.1ec38c1ad`
- `com.easyar.mega` `2.12.6+4956.1ec38c1ad`
- 公式 `MegaBlock_Basic` サンプルは EasyAR パッケージ キャッシュからプロジェクトにコピーされました。
- Android パッケージ名は、ログインした EasyAR 開発センターのレコードから取得されました: `com.myarcommon.myar`.
- 選択したライブラリに使用されるメガ クラウド ローカリゼーション AppID: `ab70931ebdd2488c9b7883bab473ca50`.
- 選択したライブラリ/materialsは次のように識別されました:
- クラウド ローカリゼーション ライブラリ: `视辰信息科技(上海)有限公司`
- メガブロックストレージ: `ARMallBlock9.0`
- メガブロック名: `大厅+办公室+阳台+GPS+0716`
- サンプル シーンは、実デバイス検証のために `Simulator` モードから `Onsite` モードに切り替えられました。
- 公式 `MegaBlock_Basic` シーンは新しいプロジェクト用に調整されているため、`BlockHolder.BlockRootSource` は `Internal` を使用します。これにより、メガ ブロックがローカライズされていてもエディターで外部 BlockRoot が割り当てられていない場合に発生する実行時致命的エラー `Block root not exist ... (BlockRootSource = External)` が防止されます。

## 検証されたシグナル

- Android APK ビルドは成功しました。
- APK は接続された Android デバイスに正常にインストールされました。
- ADB 経由で検出されたテスト デバイス: Samsung `SM_S9210`、シリアル `RFCY4161BTX`.
- アプリは正常に起動し、起動後もプロセスは生きています。
- カメラと位置情報の権限は、起動前に ADB を通じて付与されました。
- EasyAR Sense がデバイスで正常に初期化されました:
- `EasyAR Sense Unity Plugin Version 4002.0.0+4956.1ec38c1ad`
- `EasyAR Sense CommunityFull (Android-arm64) Version 4.9.0.11908-e5f122cc4`
- 以前の起動ブロッカーは存在しませんでした:
- いいえ `License Key is empty`
- いいえ `Invalid Key`
- 起動ウィンドウ中に `401` または `400` サービス エラーは観察されません
- Android ランタイムのクラッシュなし
- いいえ `Block root not exist`
- いいえ `Session Broken: RunningFailed`
- `locationInputMode` を `Onsite` に切り替えた後、実際のデバイスのビルドで `Mega is running in Simulator mode` 警告が表示されなくなりました。
- ARCore/camera 起動ログにライブ カメラ フレーム アクティビティが表示されました。

## ローカリゼーションの証拠

次に、選択したマップされたオフィス シーンに携帯電話のカメラを向けながら、新しいプロジェクトを同じ Android デバイスでテストしました。パッケージ `com.myarcommon.myar` のデバイス ログと画面上の診断は、繰り返される位置特定と追跡信号をキャプチャしました:

- `[VioEstimator] Vio start up successful initialization`
- `[MLOC] NCam_Verified results of kLocalizationFullMap`
- `World pose node changing to MapId:315886d2-3094-27d0-8dbf-1686cdc2c8f9`
- `[MLOC] NCam_Verified results of kMapTracking`
- `[M] [Localizer] - loaded map 315886d1-3094-27d0-8c86-ec6f18cb4d51`
- `[M] ADF 315886d2-3094-27d0-8dbf-1686cdc2c8f9 successfully localized against ADF 315886d1-3094-27d0-8c86-ec6f18cb4d51`
- 画面上のサンプル診断では、`Block: 大厅+办公室+阳台+GPS+0716 (a21e8f20-e1b9-4ac1-a5ed-335e74697e6a)` と、ローカライズされたブロックに対するデバイスの姿勢が示されました。

無効なライセンス、無効な AppID、ローカリゼーション成功ウィンドウで、未承認、禁止、`Block root not exist`、`Session Broken`、または Android ランタイム クラッシュ ブロッカーが検出されました。

## 現在の制限

この証拠は、新しいプロジェクト APK のビルド、インストール、起動、EasyAR 初期化、オンサイト モードの準備、実デバイスのメガ ローカリゼーション/trackingを証明します。ログ信号、および選択されたマップされた環境の画面上のローカライズされたブロック識別。これは依然としてローカル証拠の概要です。生のログ、スクリーンショット、APK、Unity パッケージ ファイル、および秘密を含む Unity 設定はリポジトリの外に残ります。

## ローカル証拠ファイル

生のログと Unity プロジェクトはローカルに残り、Unity/EasyAR プロジェクトにはプライベート アカウントや環境の詳細が含まれる可能性があるため、コミットしないでください。

- 新しい Unity プロジェクト: `/Users/tuyi/UnityProjects/EasyARMegaVerification`
- ビルド ログ: `/Users/tuyi/UnityProjects/EasyARMegaVerification/Logs/build-android-mega-onsite.log`
- 最終的な BlockRoot 修正ビルド ログ: `/Users/tuyi/UnityProjects/EasyARMegaVerification/Logs/build-android-mega-blockroot-internal.log`
- 最終的なデバイス ローカリゼーション ログ: `/Users/tuyi/UnityProjects/EasyARMegaVerification/Logs/mega-current-block-debug-20260612-123117.log`
- 最終的なデバイスのスクリーンショット: `/Users/tuyi/UnityProjects/EasyARMegaVerification/Logs/mega-current-block-debug-20260612-123120.png`
- APK パス: `/Users/tuyi/UnityProjects/EasyARMegaVerification/Builds/EasyARMegaVerification.apk`
