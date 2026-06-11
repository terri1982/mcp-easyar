# mcp-easyar Release Manifest

Generated at: 2026-06-11T02:32:42.568Z
Package: mcp-easyar 0.1.0
Bin: easyar-mcp
Node: >=20
Repository: https://github.com/terri1982/mcp-easyar.git
Ready for install docs: yes

## Focused Scope

Focused samples: image-tracking, cloud-recognition
Deferred samples: hello-ar, surface-tracking

## Install Commands

- `npm install`
- `npm run build`
- `npm start`

## Install Profiles

### Local Git clone

Entrypoint mode: `local-dist`

- `npm install`
- `npm run build`
- Client config: `easyar_generate_client_config client=claude-desktop entrypointMode=local-dist serverPath=/absolute/path/to/mcp-easyar/dist/index.js`

### Global npm package

Entrypoint mode: `package-bin`

- `npm install -g mcp-easyar`
- Client config: `easyar_generate_client_config client=claude-desktop entrypointMode=package-bin`

### npx package

Entrypoint mode: `npx`

- `npx -y mcp-easyar`
- Client config: `easyar_generate_client_config client=claude-desktop entrypointMode=npx`

## MCP Entrypoints

- Built dist entrypoint: `node /Users/tuyi/Documents/EasyAR 官方 MCP 服务/dist/index.js`
- Package bin: `easyar-mcp`
- Install check: `easyar-mcp-check`
- npx package: `npx -y mcp-easyar`

## Verification Commands

- `npm run typecheck`
- `npm test`
- `npm run bin:smoke`
- `npm run install:check`
- `npm run package:smoke`
- `npm run pack:check`
- `npm run security:check`
- `npm run release:check`
- `EASYAR_RELEASE_REQUIRE_PRODUCTION_READY=1 npm run release:check`

## First MCP Calls

- `easyar_server_status`
- `easyar_release_manifest`
- `easyar_account_onboarding`
- `easyar_account_materials`
- `easyar_check_client_setup`
- `easyar_auth_status`
- `easyar_check_official_access`
- `easyar_next_workflow_step`
- `easyar_write_production_validation`
- `easyar_write_issue_report`

## Client Setup Tools

- `easyar_generate_client_config`
- `easyar_check_client_setup`
- `easyar_write_client_setup`

## Required Environment

- `EASYAR_API_BASE_URL`
- `EASYAR_API_TOKEN`
- `EASYAR_ACCOUNT_STATUS_ENDPOINT`
- `EASYAR_LICENSE_VALIDATE_ENDPOINT`
- `EASYAR_DOWNLOADS_ENDPOINT`
- `EASYAR_CLOUD_CREDENTIALS_ENDPOINT`
- `EASYAR_UNITY_PATH`
- `EASYAR_RELEASE_PROJECT_PATH`
- `EASYAR_RELEASE_PLATFORM`

## Required Files

- OK README.md
- OK .env.example
- OK CHANGELOG.md
- OK LICENSE
- OK SECURITY.md
- OK docs/quickstart.md
- OK docs/OFFICIAL_API_CONTRACT.md
- OK docs/OFFICIAL_API_HANDOFF.md
- OK docs/openapi/easyar-mcp-account-api.openapi.json
- OK docs/client-setup.md
- OK docs/RELEASE_MANIFEST.md
- OK docs/troubleshooting.md
- OK assets/easyar-icon.png
- OK dist/index.js
- OK dist/easyar-api.js
- OK .github/ISSUE_TEMPLATE/focused-sample-run.yml
- OK .github/workflows/ci.yml
- OK .github/workflows/release.yml

## Package Files

- dist
- docs/OFFICIAL_API_CONTRACT.md
- docs/OFFICIAL_API_HANDOFF.md
- docs/openapi/easyar-mcp-account-api.openapi.json
- docs/client-setup.md
- docs/quickstart.md
- docs/RELEASE_MANIFEST.md
- docs/troubleshooting.md
- assets/easyar-icon.png
- .env.example
- README.md
- CHANGELOG.md
- LICENSE
- SECURITY.md

## Scripts

- `bin:smoke`: `npm run build && MCP_EASYAR_SMOKE_COMMAND=./dist/index.js node scripts/smoke-test.mjs`
- `build`: `tsc`
- `dev`: `tsx src/index.ts`
- `install:check`: `npm run build && node dist/install-check.js`
- `package:smoke`: `npm run build && node scripts/package-install-smoke.mjs`
- `pack:check`: `npm run build && npm pack --dry-run`
- `postbuild`: `chmod +x dist/index.js dist/install-check.js`
- `release:check`: `node scripts/release-check.mjs`
- `security:check`: `node scripts/security-check.mjs`
- `start`: `node dist/index.js`
- `test`: `npm run build && node scripts/smoke-test.mjs && node scripts/official-api-fixture-smoke.mjs && node scripts/openapi-contract-smoke.mjs`
- `typecheck`: `tsc --noEmit`

## Next Actions

- Run verification commands before publishing or tagging a release.
- Use the manual GitHub Actions Release workflow for npm publishing after configuring the protected npm-publish environment.
- Use easyar_check_client_setup to validate the MCP client config path or selected package/npx entrypoint before giving it to Codex or Claude.
- Keep official EasyAR account tokens and Cloud Recognition credentials out of committed config files.

## Security

The release manifest is safe to commit. It lists required environment variable names and placeholder commands, not secret values.
