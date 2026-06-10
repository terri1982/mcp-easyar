# Contributing

Thanks for improving `mcp-easyar`.

## Development

```bash
npm install
npm run build
npm run typecheck
```

Run the MCP server locally:

```bash
npm run dev
```

## Guidelines

- Keep EasyAR account and license workflows official and authorized.
- Prefer small, focused tools with explicit input schemas.
- Keep Unity file writes inside the selected project path.
- Do not add code that bypasses EasyAR authentication, licensing, download authorization, or service limits.
- Add verification steps to the README when introducing a new workflow.

## Pull Requests

Before opening a pull request, use `.github/pull_request_template.md` and run:

```bash
npm run typecheck
npm test
npm run bin:smoke
npm run install:check
npm run package:smoke
npm run pack:check
npm run release:check
```

Do not mark a PR or release as production-ready unless:

```bash
EASYAR_RELEASE_REQUIRE_PRODUCTION_READY=1 npm run release:check
```

passes with real official EasyAR endpoint evidence and real-device Image Tracking / Cloud Recognition evidence.

Use the focused sample issue template for Image Tracking or Cloud Recognition run-through failures, and use the release readiness template before tagging a GitHub release or publishing the npm package.
