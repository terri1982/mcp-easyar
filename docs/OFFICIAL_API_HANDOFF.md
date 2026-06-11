# mcp-easyar Official API Handoff

Generated at: 2026-06-10T15:38:16.374Z
Deployment target: unspecified
Server: mcp-easyar 0.1.0
Repository: https://github.com/terri1982/mcp-easyar

## Purpose

This handoff is for EasyAR backend and operations teams connecting mcp-easyar to authorized registered-user account, license, downloads, and Cloud Recognition services.

Machine-readable contract for gateway import, server stubs, and client generation: `docs/openapi/easyar-mcp-account-api.openapi.json`

## Environment

Base URL: https://www.easyar.cn
Token env: EASYAR_API_TOKEN
Token configured now: no

Required variables:
- EASYAR_API_BASE_URL
- EASYAR_API_TOKEN
- EASYAR_ACCOUNT_STATUS_ENDPOINT
- EASYAR_LICENSE_VALIDATE_ENDPOINT
- EASYAR_DOWNLOADS_ENDPOINT
- EASYAR_CLOUD_CREDENTIALS_ENDPOINT

Current configuration:
- EASYAR_API_TOKEN: no
- EASYAR_ACCOUNT_STATUS_ENDPOINT: no
- EASYAR_LICENSE_VALIDATE_ENDPOINT: no
- EASYAR_DOWNLOADS_ENDPOINT: no
- EASYAR_CLOUD_CREDENTIALS_ENDPOINT: no

## Authorization Boundary

Local-key MVP: Unity sample execution can run after the user installs the official EasyAR Sense Unity Plugin and fills local license/API key material in the Unity project. Website login is not needed at Unity runtime.

Accepted fallback: When official API endpoints are not available, use browser-only handoff plus local-key validation. MCP records account stage and non-secret evidence, while the user obtains plugin/key materials from the official EasyAR website.

Why official support is required for production automation:
- Account status is authoritative only inside the EasyAR account system; MCP cannot prove registration, account state, organization membership, or product entitlement from local files.
- License validation must be checked against EasyAR server-side license records to prove product, platform, expiration, and Unity bundle/package identifier compatibility.
- Download discovery must respect EasyAR login, entitlement, enterprise, and rate-limit gates; MCP must not invent private download URLs or reuse browser sessions.
- Cloud Recognition credential discovery belongs to the user's EasyAR cloud project; MCP should receive only metadata and presence flags unless the user stores runtime keys locally.

Not accepted:
- Scraping EasyAR website pages or browser cookies as a production authorization mechanism.
- Asking users to paste EasyAR website passwords, verification codes, account tokens, license keys, API KEY/API Secret, appKey, or appSecret into chat.
- Treating local config presence as proof of account entitlement or private download authorization.

## Endpoint Mapping

### account-status

Env: EASYAR_ACCOUNT_STATUS_ENDPOINT
Method: GET
Expected URL: https://www.easyar.cn/mcp/account/status

Confirm the bearer token belongs to a registered EasyAR user and return non-secret account entitlement metadata.

Backend owner todo: Bind token validation to the official EasyAR registered-user account system and return non-secret account/entitlement metadata.

Request fields:
- No request body fields.

Required response fields:
- ok
- account.id
- account.registered
- account.status
- entitlements

Used by MCP tools:
- easyar_check_account
- easyar_check_official_access
- easyar_onboarding_report

Acceptance:
- Valid registered-user token returns ok=true and account.registered=true.
- Unregistered or expired token returns 401/403 with a redacted error body.

Canary command template:
```bash
curl -fsS -H "Authorization: Bearer ${EASYAR_API_TOKEN}" "${EASYAR_ACCOUNT_STATUS_ENDPOINT}"
```

### license-validation

Env: EASYAR_LICENSE_VALIDATE_ENDPOINT
Method: POST
Expected URL: https://www.easyar.cn/mcp/license/validate

Validate that a local EasyAR Sense license key is usable for the requested Unity bundle identifier and platform.

Backend owner todo: Validate a supplied local EasyAR Sense license against account entitlement, product, platform, and Unity bundle/package identifier.

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

Used by MCP tools:
- easyar_validate_license
- easyar_check_official_access
- easyar_write_focused_preflight

Acceptance:
- Valid license/bundle/platform returns license.valid=true and bundleIdentifierMatches=true.
- Invalid license, wrong bundle id, or disallowed platform returns ok=false or 403 without echoing the license key.

Canary command template:
```bash
curl -fsS -X POST -H "Authorization: Bearer ${EASYAR_API_TOKEN}" -H "Content-Type: application/json" -d '{"licenseKey":"${EASYAR_TEST_LICENSE_KEY}","bundleIdentifier":"com.easyar.testsample","platform":"android"}' "${EASYAR_LICENSE_VALIDATE_ENDPOINT}"
```

### downloads-discovery

Env: EASYAR_DOWNLOADS_ENDPOINT
Method: POST
Expected URL: https://www.easyar.cn/mcp/downloads

Return account-authorized EasyAR SDK, Unity Plugin, and sample package metadata without bypassing official download permissions.

Backend owner todo: Return only authorized SDK/plugin/sample package metadata for the registered account without granting unauthorized downloads.

Request fields:
- sampleId
- packageKind
- unityVersion

Required response fields:
- ok
- packages

Used by MCP tools:
- easyar_discover_downloads
- easyar_check_official_access
- easyar_generate_sample_import_guide

Acceptance:
- Authorized account returns EasyAR Unity Plugin/sample metadata needed by focused workflows.
- Unauthorized package requests return 403 and no private download URL.

Canary command template:
```bash
curl -fsS -X POST -H "Authorization: Bearer ${EASYAR_API_TOKEN}" -H "Content-Type: application/json" -d '{"sampleId":"image-tracking","packageKind":"unity-samples","unityVersion":"6000.4.7f1"}' "${EASYAR_DOWNLOADS_ENDPOINT}"
```

### cloud-credentials-discovery

Env: EASYAR_CLOUD_CREDENTIALS_ENDPOINT
Method: POST
Expected URL: https://www.easyar.cn/mcp/cloud-recognition/credentials

Return Cloud Recognition app metadata and presence flags for the registered user without returning raw API KEY/API Secret values.

Backend owner todo: Return Cloud Recognition app metadata and API KEY presence flags without returning raw API KEY/API Secret values.

Request fields:
- sampleId
- bundleIdentifier
- platform

Required response fields:
- ok
- cloudRecognition.appId
- cloudRecognition.apiKeyPresent

Used by MCP tools:
- easyar_discover_cloud_credentials
- easyar_check_official_access
- easyar_account_materials

Acceptance:
- Configured Cloud Recognition app returns appId plus serverAddress and apiKeyPresent/apiSecretPresent flags.
- Response never includes raw API KEY/API Secret, appKey, or appSecret values.

Canary command template:
```bash
curl -fsS -X POST -H "Authorization: Bearer ${EASYAR_API_TOKEN}" -H "Content-Type: application/json" -d '{"sampleId":"cloud-recognition","bundleIdentifier":"com.easyar.testsample","platform":"android"}' "${EASYAR_CLOUD_CREDENTIALS_ENDPOINT}"
```

## Rollout

1. Confirm the EasyAR account system can issue or validate a registered-user bearer token for MCP clients.
2. Map existing EasyAR account/license/download/cloud services to the four MCP endpoint contracts.
3. Deploy endpoints first to staging or an internal environment and set the matching MCP env vars there.
4. Run canary commands with a registered test account, a valid EasyAR Sense license, and a Cloud Recognition test app.
5. Run easyar_check_official_access for image-tracking and cloud-recognition.
6. Only after staging passes, configure production env vars for the published MCP deployment.

Repository canary:

```bash
EASYAR_CANARY_PROJECT_PATH=/path/to/UnityProject EASYAR_CANARY_PLATFORM=android npm run official-api:canary
```

The canary starts the MCP server locally, uses the configured bearer token and endpoint env vars, checks account status, verifies Image Tracking and Cloud Recognition official access, then runs production validation. It prints pass/blocker status only and must not print tokens, license keys, API KEY/API Secret, appKey, or appSecret values.

Local contract stub:

```bash
npm run official-api:stub
```

The stub serves the four official endpoint routes on `127.0.0.1:8787` by default and returns non-secret fixture metadata compatible with the MCP contract. It is useful for validating gateway routing, environment variable wiring, and canary behavior before connecting real EasyAR backend services. It is not a production account service and must not be deployed as one.

## Acceptance Gates

- All required endpoint environment variables are set in the MCP runtime environment.
- Every endpoint requires Authorization: Bearer ${EASYAR_API_TOKEN} and rejects missing, expired, or unauthorized tokens.
- easyar_check_account returns configured=true and ok=true for a registered EasyAR test account.
- easyar_validate_license validates the local EasyAR Sense license for the Unity bundle/package identifier without echoing the license key.
- easyar_discover_downloads returns only account-authorized package metadata and never bypasses EasyAR download gates.
- easyar_discover_cloud_credentials returns appId and presence flags, never raw API KEY/API Secret, appKey, or appSecret values.
- easyar_check_official_access passes for image-tracking and cloud-recognition using the same deployment environment.
- easyar_write_deployment_readiness has no official endpoint blockers.
- Fixture smoke remains green, then a real staging/prod canary run is recorded in OFFICIAL_ACCESS.md.

## Failure Policy

- Return 401/403 for invalid, expired, unregistered, unlicensed, or entitlement-missing accounts.
- Return redacted JSON errors with stable error codes; do not return raw secrets or private account data.
- Rate-limit repeated failed validation attempts by account/token and endpoint.
- If an endpoint is unavailable, MCP must report configured=false or ok=false and stop before private downloads or Cloud Recognition setup.
- Do not fall back to scraping EasyAR website sessions or bypassing login/download gates.

## Artifacts To Regenerate

- docs/OFFICIAL_API_CONTRACT.md
- docs/OFFICIAL_API_HANDOFF.md
- docs/openapi/easyar-mcp-account-api.openapi.json
- Assets/EasyARGenerated/<sampleId>/OFFICIAL_ACCESS.md
- Assets/EasyARGenerated/DEPLOYMENT_READINESS.md
- Assets/EasyARGenerated/PRODUCTION_VALIDATION.md
- Assets/EasyARGenerated/REMAINING_WORK.md

## Next Actions

- Assign backend owners for account-status, license-validation, downloads-discovery, and cloud-credentials-discovery.
- Populate EASYAR_ACCOUNT_STATUS_ENDPOINT, EASYAR_LICENSE_VALIDATE_ENDPOINT, EASYAR_DOWNLOADS_ENDPOINT, and EASYAR_CLOUD_CREDENTIALS_ENDPOINT in a staging MCP environment.
- Run node scripts/official-api-fixture-smoke.mjs, optionally run npm run official-api:stub for local contract wiring, then run npm run official-api:canary with a registered EasyAR test account.
- Run easyar_write_official_access_report for image-tracking and cloud-recognition after endpoints are configured.

## Security

This handoff contains endpoint names, request/response schemas, and non-secret canary templates only. It must not contain EasyAR passwords, verification codes, account tokens, license keys, API keys, API secrets, appKey, appSecret, signing keys, or private user data.
