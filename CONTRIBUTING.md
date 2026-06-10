# Contributing

Thanks for improving the EasyAR Official MCP Server.

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

Before opening a pull request, run:

```bash
npm run build
npm run typecheck
```
