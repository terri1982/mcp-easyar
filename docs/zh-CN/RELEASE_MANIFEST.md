# mcp-easyar 发布清单

当前发布：`v0.1.0-local-key.31`

## 安装

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.31/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## 验证命令

```bash
npm run typecheck
npm test
npm run bin:smoke
npm run install:check
npm run package:smoke
npm run pack:check
npm run security:check
EASYAR_RELEASE_REQUIRE_LOCAL_KEY_MVP=1 EASYAR_RELEASE_EVIDENCE_PATH=docs/release-evidence/focused-scope.android.json EASYAR_RELEASE_PLATFORM=android npm run release:check
```

## 发布模型

- `local-key-mvp`：当前 GitHub prerelease gate。
- `production`：未来官方 API 接入后使用。

## 包内容

包内包含英文 README、中文 README、核心 docs、release evidence、official API contract、安装 smoke 脚本和 MCP binary。
