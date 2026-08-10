<p align="center">
  <img src="assets/easyar-icon.png" alt="EasyAR logo" width="96" height="96">
</p>

# mcp-easyar

[简体中文](README.md) | [English](README.en.md) | 日本語 | [Tiếng Việt](README.vi.md)

`mcp-easyar` は、EasyAR の登録ユーザーが Codex、Claude などの AI ツールから、EasyAR Unity Sample の設定、ビルド、実機検証、Unity 開発支援を安全に進めるための MCP サーバーです。

現在の公開版は local-key MVP です。ユーザー自身が EasyAR 公式サイトで登録、ログイン、公式プラグインのダウンロード、license / CRS key の作成を行います。MCP は案内、ローカル検査、Unity 自動化のみを担当し、パスワード、確認コード、license key、API Secret、appSecret をチャットへ送信しません。

## 現在のリリース

- GitHub prerelease: `v0.1.0-local-key.41`
- 検証済み Sample:
  - Image Tracking
  - CRS / Cloud Recognition
  - Mega
- 実機ベースライン:
  - Samsung S22 で会社名刺の Image Tracking と Panda 表示
  - Android / fresh Unity project / PICO 4 Ultra Enterprise の Mega 検証
  - XREAL Air 2 Ultra で Native Session Manager と Enterprise camera license を使用し、Mega `Found` を確認
- Unity CLI: `1.0.0-beta.3`
- Unity: `2022.3.62f3`
- WeChat Mini Program は `wechat-mega` と `wechat-crs` のローカル検査、公式パッケージ導入、DevTools handoff、検証チェックリストを提供します。プレビュー、アップロード、実機完了を自動的に主張しません。

## インストール

Node.js 20 以降が必要です。

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.41/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

MCP client では package binary を指定します。

```json
{
  "mcpServers": {
    "easyar": {
      "command": "easyar-mcp",
      "args": []
    }
  }
}
```

## ツールプロファイル

通常利用では、80 ツール警告を避けるため約 68 ツールの `core` profile が有効です。

保守や互換用の全ツールが必要な場合のみ `full` profile を使用します。

```bash
MCP_EASYAR_TOOL_PROFILE=full easyar-mcp
```

`generate_*` ツールは full profile に互換用として残っています。core profile では対応する `write_*` ツールを `output="inline"` または `output="file"` で使用します。

## 最初の呼び出し

```text
easyar_server_status
easyar_list_samples
easyar_write_client_setup outputRoot=/path/to/workspace client=codex entrypointMode=package-bin output=inline
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_account_onboarding accountStage=not-registered sampleId=cloud-recognition platform=android
```

対応 MCP resource:

```text
easyar://acceptance/fresh-project
easyar://acceptance/wechat-miniprogram
easyar://samples/wechat-miniprogram
easyar://roadmap/full-goal
easyar://workflow/programming
```

## local-key の流れ

1. ユーザーがブラウザーで EasyAR 公式サイトへ登録、ログインします。
2. 公式 EasyAR Sense Unity Plugin をダウンロードします。
3. 公式開発センターで対象 package name に対応する license を作成または確認します。
4. CRS ユーザーは AppId、service URL、API KEY、API Secret をローカルで設定します。Mega ユーザーは Mega Block と対応するマップを選択します。
5. 機密値は Unity プロジェクト内の `ProjectSettings/EasyAR/easyar.local.json` など、ローカルの安全な場所へ保存します。
6. MCP は値そのものではなく、存在、形式、プレースホルダー状態だけを検査します。
7. ビルド後は実機で Sample 本来の AR 動作を確認します。APK の生成だけでは完了ではありません。

## Unity CLI ワークフロー

`easyar_unity_cli_status` は Unity CLI のインストール状態、beta channel の最新版、Pipeline 状態を確認します。

`easyar_unity_cli` は次の限定操作を提供します。

- `preflight`
- `import-sample`
- `prepare`
- `configure`
- `validate`
- `build-android`

Android phone では `deviceProfile=android-phone`、XREAL では `deviceProfile=xreal` を指定します。XREAL profile は `com.xreal.xr` `3.1.0+`、Enterprise camera license、Native Session Manager、XREAL XR Loader、OpenGL ES 3、Android API 29 をビルド前に検証します。EasyAR のドキュメントは別個の `com.xreal.xr.enterprise` Unity package を要求していません。

## Sample の完了条件

- Image Tracking: 対象画像を検出し、対象に紐づく AR コンテンツが実機カメラ上に表示されること。
- CRS / Cloud Recognition: 正しいサービス設定でクラウド認識結果が返ること。
- Mega: 対応する現地マップで実機が localization に成功し、`Found` などの成功信号が確認できること。
- XREAL / PICO: 眼鏡内で実景入力が見え、正しい frame source と `LocationInputMode=Onsite` を使用して localization できること。

## WeChat Mini Program

現在は `wechat-mega` と `wechat-crs` を対象に、以下を提供します。

- プロジェクト構造の検査
- WeChat Developer Tools CLI の検出
- ローカル設定フォーム
- ユーザーが公式サイトから取得した package / zip の安全な導入
- DevTools log の解析
- preflight、run sequence、device validation、run result、completion report

MCP は WeChat または EasyAR へ自動ログインせず、ダウンロード権限を回避せず、秘密情報をチャットで収集しません。

## セキュリティ境界

次の情報をチャット、GitHub、公開ログへ送信しないでください。

- EasyAR 公式サイトのパスワード、確認コード
- license key
- CRS API KEY / API Secret
- appKey / appSecret
- signing key
- 秘密情報を含む APK、Unity package、ログ

`mcp-easyar` はログイン、license、download authorization、enterprise gate、rate limit を回避しません。

## 日本語ドキュメント

- [ドキュメント索引](docs/ja/README.md)
- [クイックスタート](docs/ja/quickstart.md)
- [GitHub Release からインストール](docs/ja/install-from-github-release.md)
- [現在の状態](docs/ja/STATUS.md)
- [local-key MVP リリースノート](docs/ja/release-notes/local-key-mvp.md)

## 関連言語

- [簡体中文](README.md)
- [English](README.en.md)
- [Tiếng Việt](README.vi.md)

## 現在の境界

local-key MVP は Image Tracking、CRS / Cloud Recognition、Mega の GitHub Release 配布まで完了しています。公式 account/license/download/CRS API を用いる production automation と npm production publish は、production gate が完了するまで対象外です。
