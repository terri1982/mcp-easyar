# mcp-easyar 現在の状態

現在の GitHub prerelease: `v0.1.0-local-key.40`

## 検証済み

- GitHub Release tarball のインストールと `easyar-mcp-check`
- default core profile 約 68 ツール
- full profile の後方互換ツール
- Image Tracking: Samsung S22 で会社名刺を認識し Panda を表示
- CRS / Cloud Recognition: Android 実機の認識証拠
- Mega: Android phone、fresh project、PICO 4 Ultra Enterprise、XREAL Air 2 Ultra の build/install/runtime 証拠
- XREAL: Unity CLI `1.0.0-beta.3`、Native Session Manager、Enterprise camera license、XREAL XR Loader、OpenGL ES 3、Mega `Found`
- Motion Tracking: debug UI を非表示にした camera-only release APK と Panda placement
- WeChat Mini Program: `wechat-mega` / `wechat-crs` のローカル検査、公式 package import、DevTools handoff、validation report
- 日本語とベトナム語の README、quickstart、install、status、release notes

## 未完了

- Hello AR、Surface Tracking など追加 Sample の実機受け入れ
- `wechat-mega` / `wechat-crs` の preview、upload、実機完了証拠
- EasyAR-owned account/license/download/CRS production API
- production gate を満たした npm publish

## インストール

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.40/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

この版は local-key MVP prerelease です。production API ready を意味しません。
