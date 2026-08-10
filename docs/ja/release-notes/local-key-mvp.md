# mcp-easyar local-key MVP リリースノート

現在の版: `v0.1.0-local-key.40`

## ハイライト

- 日本語版とベトナム語版のトップ README を追加。
- 各言語に quickstart、GitHub Release install、status、release notes を追加。
- Unity CLI `1.0.0-beta.3` の限定された preflight、Sample import、prepare、configure、validate、Android build を収録。
- Samsung S22 の会社名刺 Image Tracking と XREAL Air 2 Ultra の Mega `Found` 実機証拠を収録。
- XREAL SDK `3.1.0+`、Enterprise camera license、Native Session Manager、XR Loader、OpenGL ES 3、Android API 29 を build 前に検証。
- default core profile は約 68 ツール。旧 `generate_*` は full profile のみで互換提供。
- license、APK、private map ID、raw private log は release package に含めません。

## インストール

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.40/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## Ready 状態

- Local-key MVP ready: yes
- Production official API ready: no

この release は login、license、download authorization、enterprise gate、rate limit を回避しません。
