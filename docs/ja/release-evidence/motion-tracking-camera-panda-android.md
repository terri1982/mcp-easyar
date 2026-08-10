# モーション トラッキング カメラ パンダ Android の証拠

日付: 2026-06-19

範囲: Android 上の EasyAR Sense Unity モーション トラッキング サンプル、Unity `2022.3.62f3`.

安全な証拠のみ。この概要では、EasyAR ライセンス キー、署名キー、APK バイナリ、プライベート スペースのスクリーンショット、Unity パッケージ ペイロード、生のプライベート ログを意図的に除外しています。

## 検証結果

- EasyAR Sense Unity Plugin モーション トラッキング サンプルから Android APK を構築しました。
- APK を実際の Samsung `SM-S9210` Android デバイスにインストールし、コールドスタートしました。
- カメラ画像がアプリで正しくレンダリングされました。
- すべてのサンプル UI、ボタン、フレーム ソース ドロップダウン、EasyAR の黄色の診断ダンプ、Unity の `Development Build` ウォーターマークが非表示になりました。
- ランタイムは ARCore カメラ入力による EasyAR モーション トラッキングを使用しました。
- 水平面ヒットが見つかった後、サンプル `EasyARPanda` オブジェクトを自動的に配置するようにシーンが変更されました。
- APK は、`Invalid Key`、`license invalid`、`EasyARSettings is not found`、`Could not find EasyAR shader`、`FATAL EXCEPTION`、または `Unable to start AR Session` なしで開始されました。

## 実装メモ

- Android パッケージ名: `com.easyar.mega.xrtest`.
- EasyAR 設定アセットは `EditorBuildSettings.AddConfigObject("EasyAR.Settings", ...)` を通じて登録され、Unity のプリロードされたアセットに追加されました。
- EasyAR カメラ画像シェーダーは、ビルド前に Unity `Always Included Shaders` に強制的に組み込まれました:
- `EasyAR/CameraImage_RGB`
- `EasyAR/CameraImage_BGR`
- `EasyAR/CameraImage_Gray`
- `EasyAR/CameraImage_YUV_I420_YV12`
- `EasyAR/CameraImage_YUV_NV12`
- `EasyAR/CameraImage_YUV_NV21`
- サンプル ランタイムは、起動時にすべての `Canvas` オブジェクトを非表示にします。
- `DiagnosticsController.MessageOutput.SessionDump` は、黄色の EasyAR セッション ダンプ オーバーレイを抑制するために `None` に設定されます。
- ビルド オプションが開発/debuggingから`BuildOptions.None`に変更されました。
- フレーム ソースの順序付けでは EasyAR `MotionTrackerFrameSource` が優先されるため、水平面ヒット テストをパンダの自動配置に利用できます。

## ローカル証拠ファイル

未加工のビルド出力 APK とスクリーンショットはローカルに残るため、コミットしないでください。

- Unity プロジェクト: `/private/tmp/easyar-motion-minimal-20260619`
- APK: `/private/tmp/easyar-motion-minimal-20260619/Builds/easyar-motion-tracking.apk`
- 最終的なビルド ログ: `/private/tmp/easyar-motion-minimal-20260619/build-no-debug-overlay.log`
- 最後のスクリーンショット: `/private/tmp/easyar-no-debug-overlay.png`

## 最終ビルドシグナル

- `Build Finished, Result: Success.`
- APK サイズ: `668044287` バイト、Finder/ls では約 `45M`.
 として表示されます。- ADB インストール結果: `Success`.
- ランタイム ネガティブ チェックでは、致命的な起動、ライセンス、設定、シェーダー エラーは見つかりませんでした。

## 以前のブロッカーをクリアしました

- EasyAR パッケージ/license の不一致は、`com.easyar.mega.xrtest`.
 を使用することで修正されました。- `EasyARSettings is not found` は、設定アセットをプリロードして登録することで修正されました。
- `Could not find EasyAR shader for video overlay` は、すべての EasyAR カメラ画像シェーダーをビルドに含めることで修正されました。
- サンプル キャンバスと EasyAR セッション ダンプ出力を無効にすることで、表示されるデバッグ UI が修正されました。
- Unity `Development Build` のウォーターマークは、非開発 APK をビルドすることで削除されました。
