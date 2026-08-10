# Mega Tuyi Workstation Android の証拠

日付: 2026-07-02

範囲: 新しい Unity プロジェクト、Unity `2022.3.62f3`、Android 実デバイスの ARMall `涂意工位测试专用` ライブラリに対する EasyAR Mega クラウド ローカリゼーション。

安全な証拠のみ。この概要では、EasyAR Web サイトのパスワード、ライセンス キー、Mega API キー/API シークレット値、署名キー、APK バイナリ、Unity パッケージ、サービス ID を含むスクリーンショット、および生のプライベート ログは意図的に除外されています。

## 検証済み環境

- Unity プロジェクト: `/Users/tuyi/UnityProjects/EasyAR-Mega-Tuyi-Workstation-Test`
- APK: `/Users/tuyi/UnityProjects/EasyAR-Mega-Tuyi-Workstation-Test/Builds/Android/EasyAR-Mega-Tuyi-Workstation.apk`
- EasyAR パッケージ セット:
 - `com.easyar.sense` `4003.0.0+5171.3948ae721`
 - `com.easyar.mega` `2.13.0+5171.3948ae721`
 - `com.easyar.mega.studio` `2.13.0+5171.3948ae721`
- 公式サンプル シーンに Unity XR の依存関係が追加されました:
 - `com.unity.xr.arfoundation` `5.1.6`
 - `com.unity.xr.arcore` `5.1.6`
 - `com.unity.xr.management` `4.4.0`
- Android パッケージ識別子: `com.DefaultCompany.MegaMap`
- テスト デバイス: Samsung `SM-S9010`、シリアル `R5CTA0ZQ6XJ`

## 選択されたクラウド ローカリゼーション マテリアル

- サービス グループ: `ARMallMega9.0`
- クラウド ローカリゼーション ライブラリ: `涂意工位测试专用`
- バインドストレージ: `ARMallBlock9.0`
- データ形式: `3-a`
- ブロック: `CodexTest01`
- ブロック ID: `b75f4d7a-134c-4b6a-90d4-1dea938c2c16`
- ランタイムモード: `Onsite`

## シグナルを確認しました

 - `com.DefaultCompany.MegaMap` のパッケージ名と一致する EasyAR Sense 4.x ライセンスを作成して適用しました。
 - グローバル Mega Block サービス構成と `CodexTest01` を使用するように `MegaBlock_Basic` を構成しました。
- Android ARM64 IL2CPP APK を正常に構築しました。
- APK を Samsung `SM-S9010` に正常にインストールしました。
- ADB を通じてカメラ/location 権限を付与しました。
- EasyARデバイス上で Sense が初期化されました:
 - `EasyAR Sense Unity Plugin Version 4003.0.0+5171.3948ae721`
 - `EasyAR Sense CommunityFull (Android-arm64) Version 4.9.0.11908-e5f122cc4`
- 以前の `Invalid Key: {No matched Package Name}` 起動ブロッカーは、パッケージ名が一致したライセンスを使用した後にクリアされました。
- AR Foundation が欠落しています/XR シーン スクリプトの警告は、Unity XR を追加することでクリアされました
- ランタイムは ARCore カメラ入力を使用し、実際のカメラ ストリームを開きました。
- オンデバイス診断では、`CodexTest01` と選択したサーバー構成を使用した Mega Block クラウド ローカリゼーション パスが示されました。
- ユーザーは、最終的な実デバイスの実行が正常にローカライズされたことを確認しました。

## ブロッカーがクリアされました

- 初期無関係なローカル EasyAR ライセンスの再利用が `Invalid Key: {No matched Package Name}` で失敗しました。新しい ARMall アカウントの Sense ライセンスが、テスト パッケージ名に対して作成されました。
- 公式サンプルでは、​​最初に、`AR Session`、`XR Origin`、および `Main Camera` に不足しているスクリプトが記録されました。 AR Foundation、ARCore XR Plugin、XR Management を追加すると、これらの警告が解決されました。
- ARCore バッチ ビルドの CPU アーキテクチャ/スクリプティング バックエンド設定が不完全だったため、最初の Android ビルドは失敗しました。ビルド オートメーションでは、IL2CPP と ARM64 が設定され、バッチ モードで EasyAR 32 ビット ARCore プリフライト ダイアログが無効になりました。
 - 以前の外部ディスク Unity プロジェクトで、Unity アセット データベース エラーが繰り返し発生しました。最終的に検証されたプロジェクトはローカル APFS ストレージに再作成されました。

## 現在の制限

コミットされたレコードは安全な概要です。未加工の APK、Unity パッケージ、スクリーンショット、ビルド ログ、サービス認証情報は、プライベート アカウントや環境の詳細が含まれている可能性があるため、ローカルのままです。

## ローカル証拠ファイル

- Unity プロジェクト: `/Users/tuyi/UnityProjects/EasyAR-Mega-Tuyi-Workstation-Test`
- APK: `/Users/tuyi/UnityProjects/EasyAR-Mega-Tuyi-Workstation-Test/Builds/Android/EasyAR-Mega-Tuyi-Workstation.apk`
- ビルド ログ: `/Users/tuyi/UnityProjects/EasyAR-Mega-Tuyi-Workstation-Test/Builds/Logs/build-android.log`
- 実行時のスクリーンショット: `/tmp/s22-mega-current.png`
