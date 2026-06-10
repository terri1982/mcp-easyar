# Changelog

## 0.1.0 - 2026-06-10

Initial public MVP for `mcp-easyar`.

### Added

- MCP stdio server for authorized EasyAR Unity workflows.
- MCP prompts for focused Image Tracking, Cloud Recognition, and Unity programming assistant workflows.
- Official EasyAR links, package-version notes, sample catalog, checklist, and quickstart resources.
- Official API contract resource at `easyar://official/api-contract` and `docs/OFFICIAL_API_CONTRACT.md` for account, license, downloads, and Cloud Recognition endpoint integration.
- Focused scope workflow resource at `easyar://workflow/focused-scope` and prompts for official endpoint validation and focused scope close-out.
- MCP prompts and quickstart resource now start focused sample runs from account materials, Unity environment, and `PREFLIGHT.md`; programming prompt starts from `PROGRAMMING_CONTEXT.md`.
- Server status now exposes a `preflightFirst` onboarding route so unregistered users can start from official EasyAR registration before local config and Unity validation.
- Generated `easyar.local.json.example` now includes registration/login instructions, never-share guidance, and environment variable names for license and Cloud Recognition local secrets.
- Unity batch compile and method tools now return focused log diagnostics plus a suggested `easyar_write_run_result` handoff when `sampleId` is provided.
- Focused run sequences now pass `sampleId` and `platform` to Unity batch steps so generated commands produce `RUN_RESULT.md` handoff suggestions.
- Client config and setup reports now support `local-dist`, `package-bin`, and `npx` entrypoint modes for Codex, Claude Desktop, and generic stdio clients.
- Release manifest now lists local clone, global npm package, and npx install profiles with matching client config calls.
- Deployment readiness now checks npm package files, bin target, public package status, and install-profile documentation.
- Sample import guides now include expected `Assets/Samples` locations and post-import verification calls through import checklist, readiness, and focused preflight.
- Focused sample run-through scope for Image Tracking and Cloud Recognition, with other samples marked deferred.
- Focused workflow state navigator and `WORKFLOW_STATE.md` artifact generation for next MCP/Unity action selection.
- Ordered focused sample run sequence generation for Codex/Claude MCP calls and Unity batch methods.
- Focused artifact index and `ARTIFACT_INDEX.md` generation for handoff artifact reading order.
- Focused artifact index includes root account onboarding and account material artifacts before sample-specific handoff work.
- Focused artifact reading order now prioritizes account onboarding, account materials, Unity environment, and `PREFLIGHT.md` before run reports and support bundles.
- Focused run sequence Markdown artifact generation inside Unity projects.
- Focused preflight gate and `PREFLIGHT.md` artifact generation across account, local config, Unity executable, import, scene, and script readiness.
- Focused sample run report generation across readiness, local config, script review, and next phase.
- Focused run report Markdown artifact generation inside Unity projects.
- Focused sample scene audit and `SCENE_AUDIT.md` artifact generation for scene candidates, Build Settings hints, and sample blockers.
- Focused support bundle and `SUPPORT_BUNDLE.md` artifact generation across run sequence, run report, scene audit, and latest Unity log diagnostics.
- Focused real-device validation checklist and `DEVICE_VALIDATION.md` artifact generation for Image Tracking and Cloud Recognition pass criteria.
- Focused run result and `RUN_RESULT.md` artifact generation for compile, build, and device validation handoff.
- Focused completion report and `COMPLETION_REPORT.md` artifact generation to classify each focused sample as `passed`, `blocked`, `failed`, or `not-run`.
- Focused scope status and `FOCUSED_SCOPE_STATUS.md` artifact generation to aggregate Image Tracking and Cloud Recognition completion state without expanding deferred samples.
- Redacted GitHub issue report and `ISSUE_REPORT.md` artifact generation for focused sample failures.
- GitHub issue template and focused Image Tracking / Cloud Recognition troubleshooting guide.
- Focused Unity programming context and `PROGRAMMING_CONTEXT.md` artifact generation before C# planning or edits.
- Focused Unity C# code planning and `CODE_PLAN.md` artifact generation before sample script edits, including structured verification calls for review, compile, support bundle, and run result handoff.
- Focused Unity C# change summary and `CODE_CHANGE.md` artifact generation after sample script edits.
- Focused sample runbooks and support directories generated under `Assets/EasyARGenerated/<sampleId>/`.
- Unity-side focused sample validation filters generated MCP helper files and verifies the matching sample scene is first in Build Settings.
- Client configuration helpers for Codex, Claude Desktop, and generic stdio MCP clients.
- Client setup validation and `CLIENT_SETUP.md` report generation for Codex, Claude Desktop, and generic stdio MCP clients.
- Account onboarding guide and `ACCOUNT_ONBOARDING.md` artifact generation for users who have not registered or logged in to EasyAR yet.
- First-run account route guidance for unregistered, registered-but-not-logged-in, and logged-in EasyAR users, including browser handoff and safe return-to-MCP calls.
- Account material checklist and `ACCOUNT_MATERIALS.md` artifact generation for license, token, bundle identifier, and Cloud Recognition field storage/share policy.
- Consumer-facing release/install manifest generation and `docs/RELEASE_MANIFEST.md` artifact writing.
- First-run onboarding report and `ONBOARDING.md` artifact generation across client setup, official access, release manifest, and focused workflow state.
- Authorization status checks that do not expose secret values.
- Configurable official EasyAR account-status and license-validation endpoint calls.
- Configurable official EasyAR downloads endpoint calls for account-scoped SDK/sample package discovery.
- Configurable official EasyAR Cloud Recognition credential metadata endpoint calls without returning secrets.
- Focused official access aggregation and `OFFICIAL_ACCESS.md` artifact generation across account, license, downloads, and Cloud Recognition endpoints.
- Local official API fixture smoke test covering configured endpoint success paths, bearer-token forwarding, response handling, and remote secret redaction.
- Deployment readiness report generation and `DEPLOYMENT_READINESS.md` artifact writing for release files, official endpoints, Unity path, focused scope, and security checks.
- Official EasyAR Unity Plugin and focused sample import checklist generation with `IMPORT_CHECKLIST.md` artifacts.
- Unity Package Manager focused sample import guide generation with `SAMPLE_IMPORT_GUIDE.md` artifacts.
- Unity project inspection and sample readiness diagnostics.
- Sample-specific readiness checks for Image Tracking target assets and Cloud Recognition credentials.
- Image Tracking scene detection by Unity scene content markers such as `ImageTarget`, `ImageTracker`, and `TargetDataFileSource`, so custom scene names can still be validated.
- EasyAR PackageCache `Samples~` discovery for focused samples, including Cloud Recognition import candidates that still need to be imported into `Assets/Samples`.
- Focused Unity log diagnostics for Image Tracking target loading/detection and Cloud Recognition credential/network failures.
- Latest Unity log discovery and tail analysis for failed Editor/batch runs.
- Project-local Unity batch log path support for `easyar_run_unity_method` and focused run sequences.
- Unity executable environment report and `UNITY_ENVIRONMENT.md` artifact generation for `EASYAR_UNITY_PATH` setup and compile dry-run guidance.
- EasyAR local config template generation and validation without returning secrets.
- Environment-backed `easyar.local.json` writing for local Unity projects without returning EasyAR token, license, or Cloud Recognition secret values.
- Unity Editor helper generation for sample scene opening, mobile player settings, Build Settings configuration, and device/player builds.
- Unity-side focused sample validation helper for Image Tracking and Cloud Recognition.
- Unity C# MonoBehaviour templates for image tracking, surface placement, cloud recognition, and lifecycle workflows.
- Safe C# file writing constrained to the selected Unity project.
- Static Unity C# script review for common EasyAR secret, lifecycle, input, and performance risks.
- Unity batch compile/import check for validating C# changes before focused sample build steps.
- Unity batch method execution helper.
- Unity Editor/build log analysis for EasyAR license, plugin import, camera permission, compile, Android/Gradle, iOS signing, and scene setup issues.
- GitHub Actions CI with build, typecheck, MCP smoke test, executable bin smoke test, and package dry run.
- User-facing `easyar-mcp-check` install verification bin plus `npm run install:check` for non-secret MCP capability checks after installation.
- Local tarball package install smoke test via `npm run package:smoke`, validating installed `easyar-mcp` and `easyar-mcp-check` bins from the packed package.
- Expanded `.env.example` template and `.gitignore` rules for official endpoint, Unity path, license, and Cloud Recognition environment variables without committing real secrets.
- Package publishing whitelist for runtime artifacts, docs, license, security policy, and logo.

### Security

- The server is designed for official authorized EasyAR account workflows.
- The server does not bypass EasyAR login, license checks, download authorization, enterprise gates, rate limits, or other access controls.
- Tools avoid returning account tokens, license keys, cloud credentials, signing keys, or provisioning secrets.
- GitHub issue reports redact common token, key, license, credential, password, and secret fields before users paste diagnostics publicly.
