# Changelog

## 0.1.0 - 2026-06-10

Initial public MVP for `mcp-easyar`.

### Added

- MCP stdio server for authorized EasyAR Unity workflows.
- MCP prompts for focused Image Tracking, Cloud Recognition, and Unity programming assistant workflows.
- Official EasyAR links, package-version notes, sample catalog, checklist, and quickstart resources.
- Focused sample run-through scope for Image Tracking and Cloud Recognition, with other samples marked deferred.
- Focused workflow state navigator and `WORKFLOW_STATE.md` artifact generation for next MCP/Unity action selection.
- Ordered focused sample run sequence generation for Codex/Claude MCP calls and Unity batch methods.
- Focused artifact index and `ARTIFACT_INDEX.md` generation for handoff artifact reading order.
- Focused run sequence Markdown artifact generation inside Unity projects.
- Focused sample run report generation across readiness, local config, script review, and next phase.
- Focused run report Markdown artifact generation inside Unity projects.
- Focused sample scene audit and `SCENE_AUDIT.md` artifact generation for scene candidates, Build Settings hints, and sample blockers.
- Focused support bundle and `SUPPORT_BUNDLE.md` artifact generation across run sequence, run report, scene audit, and latest Unity log diagnostics.
- Focused real-device validation checklist and `DEVICE_VALIDATION.md` artifact generation for Image Tracking and Cloud Recognition pass criteria.
- Focused run result and `RUN_RESULT.md` artifact generation for compile, build, and device validation handoff.
- Focused Unity C# code planning and `CODE_PLAN.md` artifact generation before sample script edits.
- Focused Unity C# change summary and `CODE_CHANGE.md` artifact generation after sample script edits.
- Focused sample runbooks and support directories generated under `Assets/EasyARGenerated/<sampleId>/`.
- Unity-side focused sample validation filters generated MCP helper files and verifies the matching sample scene is first in Build Settings.
- Client configuration helpers for Codex, Claude Desktop, and generic stdio MCP clients.
- Authorization status checks that do not expose secret values.
- Configurable official EasyAR account-status and license-validation endpoint calls.
- Configurable official EasyAR downloads endpoint calls for account-scoped SDK/sample package discovery.
- Configurable official EasyAR Cloud Recognition credential metadata endpoint calls without returning secrets.
- Deployment readiness report generation and `DEPLOYMENT_READINESS.md` artifact writing for release files, official endpoints, Unity path, focused scope, and security checks.
- Official EasyAR Unity Plugin and focused sample import checklist generation with `IMPORT_CHECKLIST.md` artifacts.
- Unity project inspection and sample readiness diagnostics.
- Sample-specific readiness checks for Image Tracking target assets and Cloud Recognition credentials.
- Focused Unity log diagnostics for Image Tracking target loading/detection and Cloud Recognition credential/network failures.
- Latest Unity log discovery and tail analysis for failed Editor/batch runs.
- Project-local Unity batch log path support for `easyar_run_unity_method` and focused run sequences.
- EasyAR local config template generation and validation without returning secrets.
- Unity Editor helper generation for sample scene opening, mobile player settings, Build Settings configuration, and device/player builds.
- Unity-side focused sample validation helper for Image Tracking and Cloud Recognition.
- Unity C# MonoBehaviour templates for image tracking, surface placement, cloud recognition, and lifecycle workflows.
- Safe C# file writing constrained to the selected Unity project.
- Static Unity C# script review for common EasyAR secret, lifecycle, input, and performance risks.
- Unity batch compile/import check for validating C# changes before focused sample build steps.
- Unity batch method execution helper.
- Unity Editor/build log analysis for EasyAR license, plugin import, camera permission, compile, Android/Gradle, iOS signing, and scene setup issues.
- GitHub Actions CI with build, typecheck, MCP smoke test, executable bin smoke test, and package dry run.
- Package publishing whitelist for runtime artifacts, docs, license, security policy, and logo.

### Security

- The server is designed for official authorized EasyAR account workflows.
- The server does not bypass EasyAR login, license checks, download authorization, enterprise gates, rate limits, or other access controls.
- Tools avoid returning account tokens, license keys, cloud credentials, signing keys, or provisioning secrets.
