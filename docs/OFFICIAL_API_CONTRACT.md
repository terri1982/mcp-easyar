# mcp-easyar Official API Contract

Generated at: 2026-06-10T15:38:16.371Z
Server: mcp-easyar 0.1.0
Ready for production official access: no

## Purpose

Official EasyAR MCP service for registered users running EasyAR Unity samples and Unity project programming workflows.

Machine-readable contract: `docs/openapi/easyar-mcp-account-api.openapi.json`

## Environment

Base URL: https://www.easyar.cn
Token env: EASYAR_API_TOKEN
Token configured now: no

### Required Variables

- EASYAR_API_BASE_URL
- EASYAR_API_TOKEN
- EASYAR_ACCOUNT_STATUS_ENDPOINT
- EASYAR_LICENSE_VALIDATE_ENDPOINT
- EASYAR_DOWNLOADS_ENDPOINT
- EASYAR_CLOUD_CREDENTIALS_ENDPOINT

### Current Configuration

- EASYAR_API_TOKEN: no
- EASYAR_ACCOUNT_STATUS_ENDPOINT: no
- EASYAR_LICENSE_VALIDATE_ENDPOINT: no
- EASYAR_DOWNLOADS_ENDPOINT: no
- EASYAR_CLOUD_CREDENTIALS_ENDPOINT: no

## Authentication

Scheme: Bearer token
Header: `Authorization: Bearer ${EASYAR_API_TOKEN}`
Token source: Official EasyAR registered-user account token, stored in MCP client environment or secret storage.

- Do not paste tokens into chat.
- Do not commit tokens to GitHub.
- Do not return tokens in API responses, logs, issue reports, or MCP tool output.
- Prefer short-lived or revocable tokens for production clients.

## Endpoints

### account-status

Env: EASYAR_ACCOUNT_STATUS_ENDPOINT
Configured now: no
Method: GET
Path: /mcp/account/status
Expected URL: https://www.easyar.cn/mcp/account/status
Timeout ms: 10000
Authorization: Required bearer token from EASYAR_API_TOKEN

Confirm the bearer token belongs to a registered EasyAR user and return non-secret account entitlement metadata.

Request fields:
- No request body fields.

Required response fields:
- ok
- account.id
- account.registered
- account.status
- entitlements

Optional response fields:
- account.emailMasked
- account.displayName
- plans
- organization
- expiresAt

Used by MCP tools:
- easyar_check_account
- easyar_check_official_access
- easyar_onboarding_report

Secret handling: Accept secret request fields only when needed for validation, never echo them back, and return only redacted metadata.

### license-validation

Env: EASYAR_LICENSE_VALIDATE_ENDPOINT
Configured now: no
Method: POST
Path: /mcp/license/validate
Expected URL: https://www.easyar.cn/mcp/license/validate
Timeout ms: 10000
Authorization: Required bearer token from EASYAR_API_TOKEN

Validate that a local EasyAR Sense license key is usable for the requested Unity bundle identifier and platform.

Request fields:
- licenseKey
- bundleIdentifier
- platform

Required response fields:
- ok
- license.valid
- license.product
- license.bundleIdentifierMatches
- license.platformAllowed

Optional response fields:
- license.expiresAt
- license.edition
- license.features
- license.message

Used by MCP tools:
- easyar_validate_license
- easyar_check_official_access
- easyar_write_focused_preflight

Secret handling: Accept secret request fields only when needed for validation, never echo them back, and return only redacted metadata.

### downloads-discovery

Env: EASYAR_DOWNLOADS_ENDPOINT
Configured now: no
Method: POST
Path: /mcp/downloads
Expected URL: https://www.easyar.cn/mcp/downloads
Timeout ms: 10000
Authorization: Required bearer token from EASYAR_API_TOKEN

Return account-authorized EasyAR SDK, Unity Plugin, and sample package metadata without bypassing official download permissions.

Request fields:
- sampleId
- packageKind
- unityVersion

Required response fields:
- ok
- packages

Optional response fields:
- packages[].name
- packages[].version
- packages[].url
- packages[].sha256
- packages[].releaseNotesUrl

Used by MCP tools:
- easyar_discover_downloads
- easyar_check_official_access
- easyar_generate_sample_import_guide

Secret handling: Accept secret request fields only when needed for validation, never echo them back, and return only redacted metadata.

### cloud-credentials-discovery

Env: EASYAR_CLOUD_CREDENTIALS_ENDPOINT
Configured now: no
Method: POST
Path: /mcp/cloud-recognition/credentials
Expected URL: https://www.easyar.cn/mcp/cloud-recognition/credentials
Timeout ms: 10000
Authorization: Required bearer token from EASYAR_API_TOKEN

Return Cloud Recognition app metadata and presence flags for the registered user without returning raw API KEY/API Secret values.

Request fields:
- sampleId
- bundleIdentifier
- platform

Required response fields:
- ok
- cloudRecognition.appId
- cloudRecognition.apiKeyPresent

Optional response fields:
- cloudRecognition.apiSecretPresent
- cloudRecognition.appKeyPresent
- cloudRecognition.appSecretPresent
- cloudRecognition.serviceRegion
- cloudRecognition.targetLibraryCount
- cloudRecognition.dashboardUrl

Used by MCP tools:
- easyar_discover_cloud_credentials
- easyar_check_official_access
- easyar_account_materials

Secret handling: Accept secret request fields only when needed for validation, never echo them back, and return only redacted metadata.

## Examples

### license-validation

```json
{
  "endpoint": "license-validation",
  "request": {
    "method": "POST",
    "url": "https://www.easyar.cn/mcp/license/validate",
    "body": {
      "licenseKey": "<local EasyAR license key>",
      "bundleIdentifier": "com.example.easyar.sample",
      "platform": "android"
    }
  },
  "response": {
    "ok": true,
    "license": {
      "valid": true,
      "product": "EasyAR Sense Unity Plugin",
      "bundleIdentifierMatches": true,
      "platformAllowed": true,
      "features": [
        "image-tracking",
        "cloud-recognition"
      ]
    }
  }
}
```

### cloud-credentials-discovery

```json
{
  "endpoint": "cloud-credentials-discovery",
  "request": {
    "method": "POST",
    "url": "https://www.easyar.cn/mcp/cloud-recognition/credentials",
    "body": {
      "sampleId": "cloud-recognition",
      "bundleIdentifier": "com.example.easyar.sample",
      "platform": "android"
    }
  },
  "response": {
    "ok": true,
    "cloudRecognition": {
      "appId": "<app id or masked app id>",
      "apiKeyPresent": true,
      "apiSecretPresent": true,
      "appKeyPresent": true,
      "appSecretPresent": true,
      "serviceRegion": "configured"
    }
  }
}
```

## Response Policy

- Responses may include account metadata, package metadata, and presence flags.
- Responses must not include raw license keys, API tokens, API keys, API secrets, appKey, appSecret, passwords, verification codes, signing keys, or provisioning profiles.
- If a backend must report sensitive material existence, return boolean presence flags and dashboard URLs instead of values.
- Use non-2xx status codes plus redacted JSON error bodies for unauthorized, expired, unlicensed, and entitlement failures.

## Production Checklist

- Configure all endpoint env vars to official HTTPS EasyAR APIs.
- Validate CORS/network policy for local MCP clients if endpoints are proxied.
- Ensure every endpoint authorizes by account token and entitlements.
- Run easyar_check_official_access for image-tracking and cloud-recognition.
- Run easyar_write_deployment_readiness and keep blockers at zero before release.

## Security

This contract is schema and deployment guidance only. It intentionally contains no EasyAR account token, license key, API key, API secret, appKey, appSecret, or user password.
