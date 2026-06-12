## Summary

- 

## Scope

- [ ] MCP server/tooling
- [ ] Unity focused sample workflow
- [ ] Official EasyAR account/API integration
- [ ] Documentation or release surface

## Verification

- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run bin:smoke`
- [ ] `npm run install:check`
- [ ] `npm run package:smoke`
- [ ] `npm run pack:check`
- [ ] `npm run release:check`

## Focused Sample Evidence

- Image Tracking status:
- Cloud Recognition status:
- Mega status:
- Real-device evidence paths, if changed:

## Security

- [ ] I did not commit EasyAR license keys, account tokens, website passwords, Cloud Recognition API keys/secrets, signing keys, provisioning profiles, or private logs.
- [ ] Any logs or issue text are redacted.
- [ ] `ProjectSettings/EasyAR/easyar.local.json` and generated runtime secret files remain ignored.

## Production Gate

- [ ] This PR does not claim production readiness unless `EASYAR_RELEASE_REQUIRE_PRODUCTION_READY=1 npm run release:check` passes.
