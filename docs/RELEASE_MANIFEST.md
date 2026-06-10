# mcp-easyar Release Manifest

Package: `mcp-easyar` 0.1.0  
Bin: `easyar-mcp`  
Node: `>=20`  
Repository: `https://github.com/terri1982/mcp-easyar`

This manifest is safe to commit. It lists install and workflow metadata for registered EasyAR users and AI coding tools; it does not include tokens, license keys, Cloud Recognition credentials, signing keys, or provisioning secrets.

## Focused Scope

Focused samples:

- `image-tracking`
- `cloud-recognition`

Deferred samples:

- `hello-ar`
- `surface-tracking`

## Install Commands

```bash
npm install
npm run build
npm start
```

## MCP Entrypoints

- Built entrypoint: `node /absolute/path/to/mcp-easyar/dist/index.js`
- Package bin: `easyar-mcp`

## Verification Commands

```bash
npm run typecheck
npm test
npm run bin:smoke
npm run pack:check
```

## First MCP Calls

- `easyar_server_status`
- `easyar_release_manifest`
- `easyar_account_onboarding`
- `easyar_check_client_setup`
- `easyar_auth_status`
- `easyar_check_official_access`
- `easyar_next_workflow_step`
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

## Required Release Files

- `README.md`
- `CHANGELOG.md`
- `LICENSE`
- `SECURITY.md`
- `docs/quickstart.md`
- `docs/RELEASE_MANIFEST.md`
- `docs/troubleshooting.md`
- `assets/easyar-icon.png`
- `dist/index.js`
- `dist/easyar-api.js`
- `.github/ISSUE_TEMPLATE/focused-sample-run.yml`
- `.github/workflows/ci.yml`

## Package Files

- `dist`
- `docs`
- `assets/easyar-icon.png`
- `README.md`
- `CHANGELOG.md`
- `LICENSE`
- `SECURITY.md`

## Release Checks

Before publishing or tagging a release:

```bash
npm run typecheck
npm test
npm run bin:smoke
npm run pack:check
```

Then verify GitHub Actions passes on `main`.

## Security

- Use only official EasyAR account, license, downloads, and Cloud Recognition endpoints.
- Do not bypass EasyAR login, license checks, download authorization, enterprise gates, or rate limits.
- Do not commit account tokens, license keys, Cloud Recognition credentials, mobile signing keys, or provisioning secrets.
