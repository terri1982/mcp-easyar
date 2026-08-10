# Mega Android デバイスの証拠の概要

日付: 2026-06-12

範囲: Android、Unity 上の `mega` サンプル `2022.3.62f3`.

安全な証拠のみ。この概要では、EasyAR Web サイトのパスワード、確認コード、ライセンス キー、クラウド認識 API KEY/API シークレット値、appKey/appSecret、署名キー、APK バイナリ、Unity パッケージ、生のプライベート ログを意図的に除外しています。

## 検証されたシグナル

- Android パッケージ名は、ログインした EasyAR 開発センターのレコードから取得されました: `com.myarcommon.myar`.
- APK メタデータが検証されました `package: name='com.myarcommon.myar'`.
- ADB 経由で検出されたテスト デバイス: Samsung `SM_S9210`、シリアル `RFCY4161BTX`.
- APK は実際の Android デバイスに正常にインストールされました。
- 該当する場合、カメラ、位置情報、ネットワーク、およびオーディオのランタイム権限が付与されています。
- EasyAR 設定がデバイスにロードされました。
- EasyAR Sense が正常に初期化されました。以前の `Invalid Key: {No matched Package Name}` ブロッカーはクリアされました。
- `ARMallBlock9.0` からロードされたメガ ブロック: `大厅+办公室+阳台+GPS+0716`.
- EasyAR カメラ オーバーレイ シェーダー ブロッカーは、Unity `Always Included Shaders` に `EasyAR/CameraImage_*` シェーダーを含めることでクリアされました。
- 長いデバイス ログに、`[MLOC]`、`kLocalizationFullMap`、`kMapTracking` の Mega ローカリゼーション/tracking アクティビティが示され、`NCam_Verified results` が繰り返されました。

## 新しいプロジェクトのフォローアップ

ユーザーが Tiantan プロジェクトを続行しないように求めた後、別の新しい Unity プロジェクト パスも記録されました。 `docs/release-evidence/mega-fresh-project-android-startup.md`を参照してください。

このフレッシュ プロジェクト パスは、選択したマップされた環境からの公式パッケージのインポート、APK ビルド、実デバイスのインストール/startup、EasyAR Sense の初期化、`Onsite` モードの準備状況、`BlockHolder.BlockRootSource=Internal` ランタイムの安定性、および実デバイスのメガ ローカリゼーション/tracking ログ信号を証明します。画面上の診断で表示されたローカライズされたブロックは `大厅+办公室+阳台+GPS+0716`、ブロック ID `a21e8f20-e1b9-4ac1-a5ed-335e74697e6a` でした。

## ローカル証拠ファイル

Unity/EasyAR プロジェクトにはプライベート アカウントや環境の詳細が含まれる可能性があるため、生のログはローカルに残り、コミットしないでください。

- ビルド ログ: `/Users/tuyi/UnityProjects/TiantanARSpatial/Logs/mega-android-build-shader-fix-2.log`
- デバイスログ: `/Users/tuyi/UnityProjects/TiantanARSpatial/Logs/mega-device-logcat-20260612-shader-fix-long.log`

## 以前のブロッカーをクリアしました

- Unity のデフォルトの Android パッケージ名は EasyAR ポータル パッケージ名に置き換えられました。
- EasyAR ライセンスの不一致は、ローカル Unity プロジェクトでそのパッケージ名のポータル ライセンスを使用することで修正されました。
- `EasyARSettings is not found` は、`Assets/XR/Settings/EasyAR Settings.asset`.
 をプリロードすることで修正されました。- `Could not find EasyAR shader for video overlay` は、ビルド前に必要なすべての EasyAR カメラ画像シェーダーを常に含まれるシェーダーに追加することで修正されました。
