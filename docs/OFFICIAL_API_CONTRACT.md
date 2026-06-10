# mcp-easyar Official API Contract

This contract describes the official EasyAR account APIs needed for production `mcp-easyar` deployments. The open-source MCP server does not guess private EasyAR endpoints and does not bypass account authorization.

## Environment

- `EASYAR_API_BASE_URL`: official EasyAR API base URL, defaulting to `https://www.easyar.cn`.
- `EASYAR_API_TOKEN`: registered-user bearer token stored in the MCP client environment or secret storage.
- `EASYAR_ACCOUNT_STATUS_ENDPOINT`: account status endpoint.
- `EASYAR_LICENSE_VALIDATE_ENDPOINT`: EasyAR Sense license validation endpoint.
- `EASYAR_DOWNLOADS_ENDPOINT`: account-scoped SDK/sample package discovery endpoint.
- `EASYAR_CLOUD_CREDENTIALS_ENDPOINT`: Cloud Recognition credential metadata endpoint.

## Authentication

All account-scoped endpoints use:

```text
Authorization: Bearer ${EASYAR_API_TOKEN}
```

Tokens must not be pasted into chat, committed to GitHub, written to generated artifacts, or returned by official API responses.

## Endpoints

### account-status

- Env: `EASYAR_ACCOUNT_STATUS_ENDPOINT`
- Method: `GET`
- Purpose: confirm the bearer token belongs to a registered EasyAR user and return non-secret entitlement metadata.
- Required response fields: `ok`, `account.id`, `account.registered`, `account.status`, `entitlements`
- Used by: `easyar_check_account`, `easyar_check_official_access`, `easyar_onboarding_report`

### license-validation

- Env: `EASYAR_LICENSE_VALIDATE_ENDPOINT`
- Method: `POST`
- Request fields: `licenseKey`, `bundleIdentifier`, `platform`
- Purpose: validate that a local EasyAR Sense license key matches the requested Unity bundle identifier and platform.
- Required response fields: `ok`, `license.valid`, `license.product`, `license.bundleIdentifierMatches`, `license.platformAllowed`
- Used by: `easyar_validate_license`, `easyar_check_official_access`, `easyar_write_focused_preflight`

### downloads-discovery

- Env: `EASYAR_DOWNLOADS_ENDPOINT`
- Method: `POST`
- Request fields: `sampleId`, `packageKind`, `unityVersion`
- Purpose: return account-authorized SDK, Unity Plugin, and sample package metadata.
- Required response fields: `ok`, `packages`
- Used by: `easyar_discover_downloads`, `easyar_check_official_access`, `easyar_generate_sample_import_guide`

### cloud-credentials-discovery

- Env: `EASYAR_CLOUD_CREDENTIALS_ENDPOINT`
- Method: `POST`
- Request fields: `sampleId`, `bundleIdentifier`, `platform`
- Purpose: return Cloud Recognition app metadata and presence flags for the registered user.
- Required response fields: `ok`, `cloudRecognition.appId`, `cloudRecognition.appKeyPresent`, `cloudRecognition.appSecretPresent`
- Used by: `easyar_discover_cloud_credentials`, `easyar_check_official_access`, `easyar_account_materials`

## Response Policy

- Responses may include account metadata, package metadata, dashboard URLs, and boolean presence flags.
- Responses must not include raw license keys, API tokens, `appKey`, `appSecret`, passwords, verification codes, signing keys, or provisioning profiles.
- If a backend needs to report sensitive material existence, return boolean presence flags instead of values.
- Use non-2xx status codes plus redacted JSON error bodies for unauthorized, expired, unlicensed, and entitlement failures.

## MCP Tools

Generate or refresh this contract from the MCP server:

```text
easyar_generate_official_api_contract
easyar_write_official_api_contract workspacePath=/path/to/workspace
```

Verify a configured production environment:

```text
easyar_auth_status
easyar_check_official_access projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_check_official_access projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_deployment_readiness
```

## Security

This contract is schema and deployment guidance only. It intentionally contains no EasyAR account token, license key, `appKey`, `appSecret`, or user password.
