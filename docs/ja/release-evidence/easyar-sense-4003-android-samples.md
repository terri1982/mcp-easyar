# EasyAR Sense 4003 Android サンプルの証拠

日付: 2026-07-02

範囲: EasyAR Sense Unity プラグイン `4003.0.0+5171.3948ae721` 新しい Unity プロジェクト Unity `2022.3.62f3` での Android サンプルのビルドと起動の検証

安全な証拠のみ。この概要では、EasyAR Web サイトのパスワード、ライセンス キー、クラウド認識 API キー/API シークレット値、appKey/appSecret、署名キー、APK バイナリ、Unity パッケージ、生のプライベート ログを意図的に除外しています。

## 検証済み環境

- 分離サンプル検証のために `/Volumes/UnityAPFS` で Unity プロジェクトが作成されました。
- 公式アカウントが承認した Mega Unity パッケージは、ログインした EasyAR Web サイトからダウンロードされました。
- インポートされたパッケージ セット:
- `com.easyar.sense` `4003.0.0+5171.3948ae721`
- `com.easyar.mega` `2.13.0+5171.3948ae721`
- `com.easyar.mega.studio` `2.13.0+5171.3948ae721`
- Android テスト デバイス: Samsung `SM-S9010`、シリアル `R5CTA0ZQ6XJ`.
- ローカル検証ビルドに使用された Android パッケージ識別子が、既存の EasyAR ライセンス レコードと一致しました。
- クラウド認識とメガ サービス構成は、生の認証情報をコミットせずに、ログインした EasyAR/ARMall アカウントからローカルに適用されました。

## サンプル結果

4 つの APK はすべて正常にビルドされ、Android デバイスにインストールされました/launched。各アプリは検証期間中、プロセスがアクティブな状態でフォアグラウンドに留まりました。

|サンプル |ビルド |デバイスの起動 |主要なランタイム シグナル |
| --- | --- | --- | --- |
|画像追跡_ターゲット |合格 |合格 | EasyAR が初期化され、カメラが `ACTIVE` に到達し、公式 `.meta` ファイルを保存した後、ターゲット テクスチャ/reference の問題が解決されました。 |
|画像追跡_クラウド認識 |合格 |合格 | EasyAR が初期化され、カメラが `ACTIVE` に到達しました。クラウド認識サービス構成欠落エラーはありません。 |
| MotionTracking_DeviceMotionAndPlaneDetection |合格 |合格 | EasyAR が初期化され、ARCore がロードされ、カメラが `ACTIVE` に到達しました。予想される XRorigin 警告のみが観察されました。 |
|メガブロック_ベーシック |合格 |合格 | EasyAR が初期化され、カメラが `ACTIVE` に到達し、ロケーション パスが `Onsite` モードになり、シミュレータ モードの警告はありません。 |

## ブロッカーをクリアしました

- 古いローカル `4002` パッケージから、現在ダウンロードされている `4003` Sense + Mega パッケージ セットにアップグレードされました。
- 公式サンプル シーンを PackageCache から `Assets/Samples/EasyAR Sense Unity Plugin/4003.0.0`.
 にインポートしました。- サンプル ディレクトリ用に保存された公式 Unity `.meta` ファイル。これにより、GUID 不一致によって発生した欠落しているシーン スクリプトと破損したテクスチャ/prefab 参照が修正されました。
- 画像追跡ターゲットの読み込み用に ImageTargets StreamingAssets を追加しました。
- クラウド認識サービス構成をクラウド サンプルの EasyAR 設定に適用しました。
- Mega Block ローカリゼーション サービス構成を Mega サンプルの EasyAR 設定に適用しました。
- 実デバイス検証のために `MegaBlock_Basic` `locationInputMode` を `Simulator` から `Onsite` に切り替えました。

## 否定的なチェック

成功した検証ログには次の情報が表示されませんでした:

- Android `FATAL EXCEPTION`
- `The referenced script on this Behaviour is missing`
- `Texture is null`
- `Service config ... NOT set`
- `License Key is empty`
- 無効な EasyAR ライセンス/key 起動失敗
- `Session Broken`
- `Onsite`
 に切り替えた後のメガ `Simulator mode` 警告
システムレベルの Samsung カメラ/VPN/location の警告が logcat で観察されましたが、サンプル ブロッカーではありませんでした。アプリはフォアグラウンドのままで、カメラ ストリームはアクティブ状態になりました。

## MCP フォローアップ

この実行により、自動化要件が MCP の動作に反映されるようになりました。Unity の公式サンプル インポートでは、`PackageCache/Samples~` からのすべての `.meta` ファイルを保存する必要があります。 `.meta` ファイルが存在しないと、Unity GUID 参照が壊れ、APK が正常にビルドされた場合でも、ランタイム `missing script` または null アセット エラーが発生する可能性があります。

## ローカル証拠ファイル

未加工のビルド ログ、ランタイム ログ、APK、Unity パッケージ、および一時的な Unity プロジェクトはローカルに残り、プライベート パスやアカウント固有の構成が含まれる可能性があるため、コミットしないでください。

- ローカル Unity プロジェクト: `/Volumes/UnityAPFS/EasyAR-Sample-Run-20260701/EasyARSamples`
- ローカル APK ディレクトリ: `/Volumes/UnityAPFS/EasyAR-Sample-Run-20260701/Builds`
- ローカル ログ ディレクトリ: `/Volumes/UnityAPFS/EasyAR-Sample-Run-20260701/Logs`
