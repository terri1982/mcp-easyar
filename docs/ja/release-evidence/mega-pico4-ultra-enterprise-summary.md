# Mega PICO 4 Ultra Enterprise の証拠の概要

日付: 2026-06-12

範囲: PICO 4 Ultra Enterprise、Unity `2022.3.62f3` の `mega` サンプル。

安全な証拠のみ。この概要では、EasyAR Web サイトのパスワード、確認コード、ライセンス キー、API キー/API シークレット値、appKey/appSecret、署名キー、APK バイナリ、Unity パッケージ、生のプライベート ログを意図的に除外しています。

## 検証済みベースライン

- Unity: `2022.3.62f3`
- Android パッケージ名: `com.easyar.mega.xrtest`
- EasyAR Sense Unity プラグイン: `4002.0.0+4956.1ec38c1ad`
- EasyAR Mega: `2.12.6+4956.1ec38c1ad`
- EasyAR Unity XR デバイス拡張パッケージ: `4000.0.0`
- PICO Unity 統合 SDK: `3.4.0`
- 必要な EasyAR ライセンス クラス: `4.x XR正式版`
- デバイス: PICO 4 Ultra Enterprise
- EasyAR フレーム ソース: `PicoFrameSource`
- メガ クラウド ローカリゼーション ライブラリ/material: `视辰信息科技(上海)有限公司`
- ローカライズされたメガ ブロック: `大厅+办公室+阳台+GPS+0716`

## 検証された信号

- 以前の Tiantan または Android フォンを再利用する代わりに、PICO ヘッドセット検証用に新しい Unity プロジェクトが作成されましたプロジェクト。
- APK Unity バッチ モードからビルドに成功しました。
- APK は、ADB を介して接続された PICO デバイスに正常にインストールされました。
- アプリはパッケージとして起動されました `com.easyar.mega.xrtest`。
- EasyAR Sense が初期化されましたヘッドセット。
- EasyAR Pico フレーム ソースの可用性チェックが実行されました。
- PICO VST カメラの起動に成功しました。ログには `startPreview done, RGB=[0]` と表示されました。
- キャプチャ成功ウィンドウ中、ヘッドセットは起動したままで、アプリはフォアグラウンド ウィンドウを保持しました。
- 画面上の EasyAR 診断では次のことが示されました。
 - `Pico (True) received 900+`
 - `Mega Block: min=FiveDof, Simulator`
 - `1222.263, Found`
 - `Block: 大厅+办公室+阳台+GPS+0716 (...)`
 - ユーザーは、PICO ヘッドセット パススルー/real-world 背景がヘッドセットに表示されていることを確認しました。

## 位置入力に関する注記

PICO パスは、Android と一致する Mega `LocationInputMode=Onsite` を使用するようになりました。電話/tabletとXREALの検証。ヘッドセットに次の表示がある場合:

```text
Mega is running in Simulator mode with simulated or no location input.
```

シーンはまだシミュレータ/non-onsite入力モードであるため、APKを再構築する前にオンサイトに切り替える必要があります。

## スクリーンショット 注

ADB `screencap` では、PICO VST パススルー構成レイヤーが欠落している可能性があります。リポジトリの証拠は、現実世界の背景を表示するために `screencap` を要求するのではなく、ヘッドセットに表示されるパススルー、EasyAR/PICO ログ、および Mega `Found` 診断を検証信号として扱う必要があります。

## ローカル証拠ファイル

生のログと Unity プロジェクトはローカルに残り、Unity/EasyARのためコミットすべきではありません。プロジェクトには、プライベート アカウントまたは環境の詳細を含めることができます。

- 新しい Unity プロジェクト: `/Users/tuyi/UnityProjects/xrtest`
- ビルド ログ: `/Users/tuyi/UnityProjects/xrtest/Logs/build-pico-mega-simulator-vst-bootstrap-fixed.log`
- 重点的な PICO 実行ログ: `/Users/tuyi/UnityProjects/xrtest/Logs/pico-mega-simulator-vst-bootstrap-fixed-focused-20260612.log`
- 最新のオンサイト PICO APK: `/Users/tuyi/UnityProjects/xrtest/Builds/xrtest-pico-mega-onsite.apk`
- アクティブなヘッドセットのスクリーンショット: `/Users/tuyi/UnityProjects/xrtest/Logs/pico_easyar_active.png`
- APK パス: `/Users/tuyi/UnityProjects/xrtest/Builds/xrtest-pico-mega.apk`
