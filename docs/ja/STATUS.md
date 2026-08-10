# mcp-easyar 現在のステータス

このステータス ページには、証拠に裏付けられた `mcp-easyar` の現在の状態が要約されています。

これは、すべての EasyAR サンプルの完了を主張するものではありません。アクティブな目標は現在、画像追跡、CRS/Cloud 認識、Mega のみを対象としています。

EasyAR Mega と CRS/Cloud 認識用の WeChat ミニ プログラム サンプル トラックが追加されています。現在の実装では、ローカル検査、ユーザーがダウンロードした公式パッケージのインポート、DevTools スモーク チェック、ログ分析、実デバイス検証チェックリスト、実行結果フォーム、完了レポート、ミニ プログラム スコープ ステータス、ハンドオフ アーティファクトが提供されます。これはまだ、プレビュー、アップロード、または実際のデバイス ミニ プログラムの完了を主張するものではありません。

## 現在のリリース

現在の GitHub プレリリース: `v0.1.0-local-key.41`

公式 EasyAR 中国語ドキュメント更新: 2026-07-01。 MCP メタデータは、EasyAR Sense Unity Plugin / for Mega `4003.0.0`、EasyAR Mega サポート パッケージおよび Mega Studio `2.13.0`、XR デバイス拡張パッケージ `4000.0.1`、EasyAR Sense Native `4.9.0`、EasyAR Mega WeChat Mini Program Plugin `2.0.3` を追跡するようになりました。 「`docs/OFFICIAL_DOCS_2026-07-01.md`」を参照してください。

インストール:

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.41/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## 証拠に重み付けされた進捗状況

- 公開された範囲指定された目標: 承認された画像追跡、CRS/Cloud 認識、および Mega ターゲットについて 100%。
- Mega Android の証拠: デバイスのインストール、起動、EasyAR 初期化、Mega Block の読み込み、Mega ローカリゼーション/tracking のログ証拠がキャプチャされました。 2026年6月12日。別の新しい Unity プロジェクト パスにより、選択したマップされた環境における公式パッケージのインポート、APK ビルド、インストール/startup、EasyAR 初期化、`Onsite` 準備完了、および実際のデバイスのローカリゼーション/tracking ログ信号が証明されるようになりました。 2026-07-02 EasyAR Sense `4003.0.0` / Mega `2.13.0` パスにより、Samsung `SM-S9010` 上の ARMall `涂意工位测试专用` に対する現在の MegaBlockController ワークフローが証明されます。これには、パッケージ名が一致した Sense ライセンス、公式 XR 依存関係の修復、ARCore カメラの起動、`CodexTest01` ブロック構成が含まれます。ユーザーがローカライズに成功したことを確認しました。 PICO 4 Ultra Enterprise ヘッドセット パスでは、選択したオフィス ブロックに対する APK ビルド/install/startup、EasyAR Pico フレーム ソース、PICO VST カメラの起動、ヘッドセット可視パススルー、メガ `Found` ローカリゼーションが証明されるようになりました。 Android モーション トラッキング パスは、UI/diagnostics非表示、ARCore カメラ入力、EasyAR MotionTracker、および水平面ヒットでの自動パンダ配置を備えたクリーンなカメラのみのサンプル ビルドであることを証明しています。
- ローカル キー MVP パブリック ユーザビリティ: 約 98%

これらのパーセンテージは、証拠に基づいて加重された推定値です。公開されたプレリリースでは、イメージ トラッキング、CRS/Cloud 認識、Mega の 3 つのサンプル ローカルキー ターゲットがカバーされています。広範な本番環境の公式 API 目標はまだ不完全なままです。

## 準備ができているもの

 - GitHub リリース tarball 配布は機能しています。
 - `easyar-mcp` および `easyar-mcp-check` パッケージ バイナリが利用可能です。
 - Codex、Claude Desktop、および汎用 MCP クライアント構成の生成が実装されています。
- クライアント受け入れガイダンスは、`docs/CLIENT_ACCEPTANCE.md` と `easyar://client/acceptance` を通じて利用できます。
 - 新鮮な Unity プロジェクト受け入れガイダンスは、`docs/FRESH_PROJECT_ACCEPTANCE.md` と `easyar://acceptance/fresh-project` を通じて利用できます。
 - ローカルキー オンボーディングは、EasyAR Web サイトのパスワードや秘密キーを収集せずに実装されます。チャット。
- 重点的な画像追跡、CRS/Cloud 認識、および Mega ワークフローが実装されているか、活発に開発中です。
- 画像追跡、CRS/Cloud 認識、および Mega ターゲット スコープについては、安全にコミットされた Android の証拠が存在します。
- Mega実際のデバイスの証拠には、APK インストール/startup、EasyAR Sense の初期化、選択されたメガ ブロックのロード、および `[MLOC]` `kMapTracking` / `NCam_Verified results` 信号が含まれます。新しいプロジェクトの Mega 証拠には、`successfully localized against ADF` などのローカリゼーション/tracking シグナルも含まれるようになりました。 4003.0.0 / MegaBlockController Android パスは、`涂意工位测试专用` クラウド ローカリゼーション ライブラリもカバーするようになりました。 PICO 4 Ultra Enterprise の証拠では、`PicoFrameSource` と `LocationInputMode=Onsite` を使用した文書化されたヘッドセット パスが使用されています。 EasyAR シミュレータの診断に関する警告は、シーンをオンサイトに切り替えて再構築する必要があることを示しています。
- Unity プロジェクト プログラミング支援は、プリフライト、シーン監査、実行シーケンス、デバイス検証、ログ分析、C# 計画、スクリプト作成、レビュー、ハンドオフ アーティファクトに重点を置いています。
- WeChat ミニ プログラムのサポートには、`wechat-mega` および `wechat-crs` の重点サンプル メタデータ、プロジェクト検査、WeChat 開発者ツール CLI 検出、ローカル構成フォーム、ユーザーがダウンロードした公式パッケージのインポート、DevTools スモーク チェック、ログ分析、プリフライト レポート、実行シーケンス、実デバイス検証チェックリスト、実行結果、完了レポート、ミニ プログラム スコープ ステータス、リソース `easyar://samples/wechat-miniprogram` が含まれるようになりました。および受け入れリソース `easyar://acceptance/wechat-miniprogram`.
- 日本語版とベトナム語版は、受け入れ、公式 API、計画、トラブルシューティング、WeChat Mini Program、リリースノート、release evidence を含む 24 件すべての公開 Markdown ソース文書を完全にミラーします。ローカルおよびパッケージ検証は、欠落、短縮版、英語文書への回帰リンク、技術内容が変更された翻訳を拒否します。

## アクティブなスコープ

現在のターゲット サンプル:

- 画像追跡
- CRS/Cloud 認識
- メガ

現在の目標の範囲外です:

- こんにちは AR
- 表面追跡
- 追加の公式 EasyAR Sense Unity プラグイン サンプル

`wechat-mega` と `wechat-crs` を超える追加のミニ プログラム サンプルは、リクエストされるまで対象外です。

## 既知の残りの作業

- 画像追跡、CRS/Cloud 認識、メガ証拠、最新のプロジェクト承認ドキュメント、最新の GitHub リリースに合わせたリリース スモーク テストを維持します。
- プレリリースと製品リリースの npm 公開ポリシーを決定します。
- サポートされる Unity バージョンまたはターゲット プラットフォームが拡大した場合でも、イメージ トラッキング、CRS/Cloud 認識、メガ、およびモーション トラッキングの証拠を最新の状態に保ちます。
- より多くの実際のプロジェクト ケースを使用して、Unity プログラミング ワークフローを強化し続けます。
- 公式ローカル サンプル パッケージ、ログインした DevTools、およびテスト ミニ プログラム プロジェクトが利用可能になった後、WeChat 開発者ツールのプレビュー/uploadと、`wechat-mega` および `wechat-crs` の実デバイスの証拠をキャプチャします。
- 公式 Mega パッケージまたは ARMall クラウド ローカリゼーション マテリアルが変更された場合でも、4003.0.0 / MegaBlockController Android の証拠を最新の状態に保ちます。

## 安全境界

現在のリリースでは、ローカルキー MVP パス:
 を使用します。
1. ユーザーは、自分のブラウザの EasyAR 公式 Web サイトで登録、ログイン、公式パッケージのダウンロード、キーの作成を行います。
2. ユーザーは、公式 EasyAR Sense Unity プラグインをインストールします。
3. ユーザーは、Unity プロジェクトでローカルにライセンスとクラウド認識フィールドを入力します。
4. MCP は編集されたプレゼンスのみを検証し、Unity の自動化をガイドします。

MCP ユーザーに、EasyAR Web サイトのパスワード、確認コード、ライセンス キー、クラウド認識 API キー/API シークレット、`appKey`、または `appSecret` をチャットに貼り付けるよう求めてはなりません。

## 次の最適なアクション

1. GitHub リリースの tarball とドキュメントをすべての公開プレリリースに合わせて維持します。
2. `docs/CLIENT_ACCEPTANCE.md` と `docs/FRESH_PROJECT_ACCEPTANCE.md` を使用して、新しい Codex と Claude Desktop のセットアップをテストします。
3. イメージ トラッキング、CRS/Cloud 認識、Unity プロジェクトの変更時の Mega のために別のクリーン インストール/build/device パスを実行します。
4. このスコープ付きローカルキー MVP.
 に npm パブリケーションが必要かどうかを決定します。
