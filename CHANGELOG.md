# Changelog

## 0.1.0 - 2026-06-10

Initial public MVP for `mcp-easyar`.

### Added

- MCP stdio server for authorized EasyAR Unity workflows.
- Official EasyAR links, package-version notes, sample catalog, checklist, and quickstart resources.
- Focused sample run-through scope for Image Tracking and Cloud Recognition, with other samples marked deferred.
- Focused sample runbooks and support directories generated under `Assets/EasyARGenerated/<sampleId>/`.
- Client configuration helpers for Codex, Claude Desktop, and generic stdio MCP clients.
- Authorization status checks that do not expose secret values.
- Configurable official EasyAR account-status and license-validation endpoint calls.
- Unity project inspection and sample readiness diagnostics.
- Sample-specific readiness checks for Image Tracking target assets and Cloud Recognition credentials.
- EasyAR local config template generation and validation without returning secrets.
- Unity Editor helper generation for sample scene opening, mobile player settings, Build Settings configuration, and device/player builds.
- Unity C# MonoBehaviour templates for image tracking, surface placement, cloud recognition, and lifecycle workflows.
- Safe C# file writing constrained to the selected Unity project.
- Static Unity C# script review for common EasyAR secret, lifecycle, input, and performance risks.
- Unity batch method execution helper.
- Unity Editor/build log analysis for EasyAR license, plugin import, camera permission, compile, Android/Gradle, iOS signing, and scene setup issues.
- GitHub Actions CI with build, typecheck, MCP smoke test, executable bin smoke test, and package dry run.
- Package publishing whitelist for runtime artifacts, docs, license, security policy, and logo.

### Security

- The server is designed for official authorized EasyAR account workflows.
- The server does not bypass EasyAR login, license checks, download authorization, enterprise gates, rate limits, or other access controls.
- Tools avoid returning account tokens, license keys, cloud credentials, signing keys, or provisioning secrets.
