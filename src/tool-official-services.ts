import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { access, cp, mkdir, open, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { focusedHandoffSampleIds } from "./focused-scope.js";
import { jsonText, markdownText } from "./mcp-response.js";
import { officialOpenApiPath, packageRoot } from "./paths.js";
import { easyarApi, readAuthConfig } from "./tool-auth.js";
import { deriveAccountOnboardingStage } from "./tool-account-services.js";
import { readLocalConfigForRemoteValidation } from "./tool-local-config-remote.js";
import {
  accountStageValues,
  activeToolCatalog,
  authorizationModeValues,
  buildPlatforms,
  clientEntrypointModes,
  clientKinds,
  coreToolNames,
  currentGitHubReleaseTag,
  deviceBuildPlatforms,
  mobilePlatforms,
  monoBehaviourKinds,
  resourceCatalog,
  runResultStatuses,
  serverName,
  serverVersion,
  toolCatalog,
  toolProfile
} from "./catalog.js";
import type { AccountStage, AuthorizationMode } from "./catalog.js";
import { deferredSamples, findSample, focusedSamples, officialInfo, quickstartWorkflow, samples } from "./samples.js";
import type { SampleInfo } from "./samples.js";
import { buildAndroidDeviceStatusActions, buildUnityArgs, defaultAndroidLogcatFilter, parseAdbDevices, redactSecretText, runProcess, runUnity } from "./runtime.js";
import { buildBuildSettingsHelper, buildDeviceBuildHelper, buildFocusedSampleRunbook, buildLocalConfigBridgeEditor, buildLocalConfigBridgeRuntime, buildLocalConfigExample, buildMobileSettingsHelper, buildMonoBehaviourTemplate, buildSampleRunner, buildSampleValidationHelper, defaultBundleIdentifier } from "./unity-generators.js";
import {
  extractMethodBody,
  findLineNumber,
  firstMatchingLine,
  walk,
  assertInside,
  writeGeneratedFile,
  ensureGitignoreEntries,
  escapeRegExp,
  resolveUnityLogPath,
  defaultUnityBatchLogPath,
  buildUnityRunResultStep,
  buildSuggestedRunResultCall,
  unityMethodStepName,
  unityMethodSuccessNextAction
} from "./tool-file-utils.js";

export {
  DeviceValidationStep,
  FocusedHandoffPackInput,
  androidDeviceInteractionAction,
  artifactPriority,
  buildAndroidDeviceRunbook,
  buildArtifactIndex,
  buildCompletionNextActions,
  buildCompletionReport,
  buildDeviceRunResultForm,
  buildDeviceValidationChecklist,
  buildDeviceValidationSteps,
  buildFocusedHandoffPackPlan,
  buildFocusedPreflight,
  buildFocusedReleaseEvidence,
  buildFocusedRunReport,
  buildFocusedScopeNextActions,
  buildFocusedScopeStatus,
  buildIssueReport,
  buildRunResult,
  buildSupportBundle,
  chooseCompletionStatus,
  countMarkdownStepStatuses,
  countPassedDeviceValidationSteps,
  defaultFocusedOutputPath,
  defaultIssueReproductionSteps,
  devicePortalEvidenceBlockers,
  focusedArtifactDefinitions,
  focusedArtifactReadOrder,
  focusedHandoffPackArtifactSpecs,
  focusedHandoffPackPurpose,
  focusedHandoffPackSamples,
  hasRecordedDevice,
  isPortalEvidenceReadyForSample,
  parseMarkdownField,
  parseNumberField,
  parseRunResultStatus,
  parseYesNoField,
  portalEvidencePreflightDetail,
  readFocusedReleaseEvidence,
  readPortalEvidenceArtifact,
  readRunResultArtifact,
  sampleDeviceEvidencePrompts,
  sampleDevicePassCriteria,
  sampleExpectedIssueBehavior,
  samplePassedEvidencePlaceholder,
  sampleSpecificDeviceValidationSteps,
  writeFocusedHandoffPack,
  writeFocusedHandoffPackForSample,
  writePackFile
} from "./tool-device-evidence.js";

export {
  readCloudRecognitionConfig,
  readLogFile,
  UnityLogCandidate,
  findUnityLogCandidates,
  readLogTail,
  readJsonFile,
  buildLocalConfigValidationReport,
  buildLocalConfigFromEnvReport,
  envFirst,
  envPresenceItem,
  validateLocalConfig,
  localConfigAction,
  isRecord,
  isNonPlaceholderString,
  isOptionalNonPlaceholderString,
  isNonEmptyString,
  sanitizeRunResultNotes,
  sanitizeIssueText,
  hasCloudRecognitionConfig,
  hasCompleteCloudRecognitionConfig,
  cloudRecognitionCredentialMode
} from "./tool-local-config.js";

export {
  UnityLogRule,
  analyzeUnityLog,
  sampleSpecificLogRules,
  findEvidence,
  ScriptReviewIssue,
  reviewCsharpScript,
  buildScriptReviewReport,
  buildScriptReviewActions,
  chooseNextRunPhase
} from "./tool-diagnostics.js";

export {
  resolveProjectPath,
  exists,
  ensureDirectory,
  readUnityVersion,
  findFiles,
  findUnityCandidates,
  collectUnityExecutables,
  buildUnityEnvironmentReport,
  chooseUnityCandidate,
  unityPathMatchesProjectVersion,
  shellSingleQuote
} from "./tool-project.js";

export {
  buildSampleReadinessReport,
  buildImportChecklist,
  buildSampleImportGuide,
  importSampleFromPackageCache,
  readPackageCacheInfo,
  normalizeUnityPackageVersion,
  parsePackageCacheFolderVersion,
  sanitizeAssetFolderName,
  buildSampleSceneAudit,
  uniqueBlockers,
  filterOfficialEasyARSignals,
  matchSampleScenes,
  sceneContentMatchesSample,
  findPackageCacheSamplePaths,
  walkPackageCacheSamples,
  packageCacheSamplePathMatches,
  readinessAction,
  findImageTrackingTargetAssets,
  findImageTargetsStreamingPackageCandidates,
  hasOfficialImageTargetsStreamingAssets,
  findMegaAssetHints,
  readMegaSettingsSummary,
  readMegaLocationInputModeSummary,
  hasPicoHeadsetMegaSignals,
  readMegaBlockRootSummary,
  hasYamlScalar,
  focusedSampleGeneratedDir,
  focusedSampleRunbookPath,
  buildSampleSpecificReadinessChecks,
  readBuildSettingsSceneHints,
  buildSampleSceneAuditSpecifics
} from "./tool-sample-workflow.js";

import {
  buildSampleReadinessReport,
  buildImportChecklist,
  buildSampleImportGuide,
  importSampleFromPackageCache,
  readPackageCacheInfo,
  normalizeUnityPackageVersion,
  parsePackageCacheFolderVersion,
  sanitizeAssetFolderName,
  buildSampleSceneAudit,
  uniqueBlockers,
  filterOfficialEasyARSignals,
  matchSampleScenes,
  sceneContentMatchesSample,
  findPackageCacheSamplePaths,
  walkPackageCacheSamples,
  packageCacheSamplePathMatches,
  readinessAction,
  findImageTrackingTargetAssets,
  findImageTargetsStreamingPackageCandidates,
  hasOfficialImageTargetsStreamingAssets,
  findMegaAssetHints,
  readMegaSettingsSummary,
  readMegaLocationInputModeSummary,
  hasPicoHeadsetMegaSignals,
  readMegaBlockRootSummary,
  hasYamlScalar,
  focusedSampleGeneratedDir,
  focusedSampleRunbookPath,
  buildSampleSpecificReadinessChecks,
  readBuildSettingsSceneHints,
  buildSampleSceneAuditSpecifics
} from "./tool-sample-workflow.js";

import {
  resolveProjectPath,
  exists,
  ensureDirectory,
  readUnityVersion,
  findFiles,
  findUnityCandidates,
  collectUnityExecutables,
  buildUnityEnvironmentReport,
  chooseUnityCandidate,
  unityPathMatchesProjectVersion,
  shellSingleQuote
} from "./tool-project.js";

import {
  UnityLogRule,
  analyzeUnityLog,
  sampleSpecificLogRules,
  findEvidence,
  ScriptReviewIssue,
  reviewCsharpScript,
  buildScriptReviewReport,
  buildScriptReviewActions,
  chooseNextRunPhase
} from "./tool-diagnostics.js";

import {
  readCloudRecognitionConfig,
  readLogFile,
  UnityLogCandidate,
  findUnityLogCandidates,
  readLogTail,
  readJsonFile,
  buildLocalConfigValidationReport,
  buildLocalConfigFromEnvReport,
  envFirst,
  envPresenceItem,
  validateLocalConfig,
  localConfigAction,
  isRecord,
  isNonPlaceholderString,
  isOptionalNonPlaceholderString,
  isNonEmptyString,
  sanitizeRunResultNotes,
  sanitizeIssueText,
  hasCloudRecognitionConfig,
  hasCompleteCloudRecognitionConfig,
  cloudRecognitionCredentialMode
} from "./tool-local-config.js";
import {
  buildArtifactIndex,
  buildCompletionReport,
  buildFocusedScopeStatus,
  buildRunResult,
  buildDeviceValidationChecklist,
  readFocusedReleaseEvidence
} from "./tool-device-evidence.js";
import {
  buildRunReportMarkdown,
  buildFocusedPreflightMarkdown,
  buildImportChecklistMarkdown,
  buildSampleImportGuideMarkdown,
  buildWorkflowStateMarkdown,
  buildArtifactIndexMarkdown,
  buildFocusedHandoffPackMarkdown,
  buildSceneAuditMarkdown,
  buildSupportBundleMarkdown,
  buildRunResultMarkdown,
  buildCompletionReportMarkdown,
  buildFocusedScopeStatusMarkdown,
  buildIssueReportMarkdown,
  buildDeviceValidationChecklistMarkdown,
  buildDeviceRunResultFormMarkdown,
  buildAndroidDeviceRunbookMarkdown,
  buildProgrammingContextMarkdown,
  buildConfigIntegrationAuditMarkdown,
  markdownConfigConsumerCandidates,
  buildCodePlanMarkdown,
  buildCodeChangeSummaryMarkdown,
  markdownRunResultSteps,
  buildRunSequenceMarkdown,
  buildDeploymentReadinessMarkdown,
  buildUnityEnvironmentMarkdown,
  buildProductionValidationMarkdown,
  buildAuthorizationStrategyMarkdown,
  buildAccountOnboardingMarkdown,
  buildAccountMaterialsMarkdown,
  buildPortalEvidenceMarkdown,
  presenceLabel,
  buildLocalConfigFormMarkdown,
  buildLocalConfigHandoffMarkdown,
  buildOfficialAccessMarkdown,
  buildOfficialApiContractMarkdown,
  buildOfficialApiHandoffMarkdown,
  buildClientSetupMarkdown,
  buildReleaseManifestMarkdown,
  buildOnboardingMarkdown,
  buildProjectHandoffMarkdown,
  buildRemainingWorkMarkdown,
  buildFirstRunGuideMarkdown,
  markdownCheckList,
  markdownIssueList,
  markdownNumberedList
} from "./tool-markdown.js";

export {
  extractMethodBody,
  findLineNumber,
  firstMatchingLine,
  walk,
  assertInside,
  writeGeneratedFile,
  ensureGitignoreEntries,
  escapeRegExp,
  resolveUnityLogPath,
  defaultUnityBatchLogPath,
  buildUnityRunResultStep,
  buildSuggestedRunResultCall,
  unityMethodStepName,
  unityMethodSuccessNextAction
} from "./tool-file-utils.js";


export async function readOfficialOpenApiContract(): Promise<{
  openapi?: string;
  info?: { title?: string };
  paths?: Record<string, unknown>;
}> {
  return JSON.parse(await readFile(officialOpenApiPath, "utf8"));
}

export function buildOfficialApiContract(baseUrl: string | undefined, includeExamples: boolean) {
  const auth = readAuthConfig();
  const resolvedBaseUrl = baseUrl ?? auth.apiBaseUrl;
  const endpoints = [
    officialApiEndpointContract({
      baseUrl: resolvedBaseUrl,
      id: "account-status",
      envName: "EASYAR_ACCOUNT_STATUS_ENDPOINT",
      configured: auth.accountStatusEndpointConfigured,
      method: "GET",
      path: "/mcp/account/status",
      purpose: "Confirm the bearer token belongs to a registered EasyAR user and return non-secret account entitlement metadata.",
      requestFields: [],
      requiredResponseFields: ["ok", "account.id", "account.registered", "account.status", "entitlements"],
      optionalResponseFields: ["account.emailMasked", "account.displayName", "plans", "organization", "expiresAt"],
      usedByTools: ["easyar_check_account", "easyar_check_official_access", "easyar_onboarding_report"]
    }),
    officialApiEndpointContract({
      baseUrl: resolvedBaseUrl,
      id: "license-validation",
      envName: "EASYAR_LICENSE_VALIDATE_ENDPOINT",
      configured: auth.licenseValidationEndpointConfigured,
      method: "POST",
      path: "/mcp/license/validate",
      purpose: "Validate that a local EasyAR Sense license key is usable for the requested Unity bundle identifier and platform.",
      requestFields: ["licenseKey", "bundleIdentifier", "platform"],
      requiredResponseFields: ["ok", "license.valid", "license.product", "license.bundleIdentifierMatches", "license.platformAllowed"],
      optionalResponseFields: ["license.expiresAt", "license.edition", "license.features", "license.message"],
      usedByTools: ["easyar_validate_license", "easyar_check_official_access", "easyar_write_focused_preflight"]
    }),
    officialApiEndpointContract({
      baseUrl: resolvedBaseUrl,
      id: "downloads-discovery",
      envName: "EASYAR_DOWNLOADS_ENDPOINT",
      configured: auth.downloadsEndpointConfigured,
      method: "POST",
      path: "/mcp/downloads",
      purpose: "Return account-authorized EasyAR SDK, Unity Plugin, and sample package metadata without bypassing official download permissions.",
      requestFields: ["sampleId", "packageKind", "unityVersion"],
      requiredResponseFields: ["ok", "packages"],
      optionalResponseFields: ["packages[].name", "packages[].version", "packages[].url", "packages[].sha256", "packages[].releaseNotesUrl"],
      usedByTools: ["easyar_discover_downloads", "easyar_check_official_access", "easyar_generate_sample_import_guide"]
    }),
    officialApiEndpointContract({
      baseUrl: resolvedBaseUrl,
      id: "cloud-credentials-discovery",
      envName: "EASYAR_CLOUD_CREDENTIALS_ENDPOINT",
      configured: auth.cloudCredentialsEndpointConfigured,
      method: "POST",
      path: "/mcp/cloud-recognition/credentials",
      purpose: "Return Cloud Recognition app metadata and presence flags for the registered user without returning raw API KEY/API Secret values.",
      requestFields: ["sampleId", "bundleIdentifier", "platform"],
      requiredResponseFields: ["ok", "cloudRecognition.appId", "cloudRecognition.apiKeyPresent"],
      optionalResponseFields: ["cloudRecognition.apiSecretPresent", "cloudRecognition.appKeyPresent", "cloudRecognition.appSecretPresent", "cloudRecognition.serviceRegion", "cloudRecognition.targetLibraryCount", "cloudRecognition.dashboardUrl"],
      usedByTools: ["easyar_discover_cloud_credentials", "easyar_check_official_access", "easyar_account_materials"]
    })
  ];
  const environment = {
    baseUrl: resolvedBaseUrl,
    tokenEnvName: "EASYAR_API_TOKEN",
    tokenConfigured: auth.hasToken,
    required: [
      "EASYAR_API_BASE_URL",
      "EASYAR_API_TOKEN",
      "EASYAR_ACCOUNT_STATUS_ENDPOINT",
      "EASYAR_LICENSE_VALIDATE_ENDPOINT",
      "EASYAR_DOWNLOADS_ENDPOINT",
      "EASYAR_CLOUD_CREDENTIALS_ENDPOINT"
    ],
    configured: {
      EASYAR_API_TOKEN: auth.hasToken,
      EASYAR_ACCOUNT_STATUS_ENDPOINT: auth.accountStatusEndpointConfigured,
      EASYAR_LICENSE_VALIDATE_ENDPOINT: auth.licenseValidationEndpointConfigured,
      EASYAR_DOWNLOADS_ENDPOINT: auth.downloadsEndpointConfigured,
      EASYAR_CLOUD_CREDENTIALS_ENDPOINT: auth.cloudCredentialsEndpointConfigured
    }
  };
  const readyForProductionOfficialAccess = auth.hasToken && endpoints.every((endpoint) => endpoint.configured);
  return {
    generatedAt: new Date().toISOString(),
    server: {
      name: serverName,
      version: serverVersion,
      purpose: "Official EasyAR MCP service for registered users running EasyAR Unity samples and Unity project programming workflows."
    },
    environment,
    authentication: {
      scheme: "Bearer token",
      header: "Authorization: Bearer ${EASYAR_API_TOKEN}",
      tokenSource: "Official EasyAR registered-user account token, stored in MCP client environment or secret storage.",
      tokenPolicy: [
        "Do not paste tokens into chat.",
        "Do not commit tokens to GitHub.",
        "Do not return tokens in API responses, logs, issue reports, or MCP tool output.",
        "Prefer short-lived or revocable tokens for production clients."
      ]
    },
    endpoints,
    authorizationBoundary: {
      localKeyMvp: "Unity sample execution can run after the user installs the official EasyAR Sense Unity Plugin and fills local license/API key material in the Unity project. Website login is not needed at Unity runtime.",
      whyOfficialSupportIsRequired: [
        "Account status is authoritative only inside the EasyAR account system; MCP cannot prove registration, account state, organization membership, or product entitlement from local files.",
        "License validation must be checked against EasyAR server-side license records to prove product, platform, expiration, and Unity bundle/package identifier compatibility.",
        "Download discovery must respect EasyAR login, entitlement, enterprise, and rate-limit gates; MCP must not invent private download URLs or reuse browser sessions.",
        "Cloud Recognition credential discovery belongs to the user's EasyAR cloud project; MCP should receive only metadata and presence flags unless the user stores runtime keys locally."
      ],
      notAccepted: [
        "Scraping EasyAR website pages or browser cookies as a production authorization mechanism.",
        "Asking users to paste EasyAR website passwords, verification codes, account tokens, license keys, API KEY/API Secret, appKey, or appSecret into chat.",
        "Treating local config presence as proof of account entitlement or private download authorization."
      ],
      acceptedFallback: "When official API endpoints are not available, use browser-only handoff plus local-key validation. MCP records account stage and non-secret evidence, while the user obtains plugin/key materials from the official EasyAR website."
    },
    examples: includeExamples ? buildOfficialApiContractExamples(resolvedBaseUrl) : [],
    responsePolicy: [
      "Responses may include account metadata, package metadata, and presence flags.",
      "Responses must not include raw license keys, API tokens, API keys, API secrets, appKey, appSecret, passwords, verification codes, signing keys, or provisioning profiles.",
      "If a backend must report sensitive material existence, return boolean presence flags and dashboard URLs instead of values.",
      "Use non-2xx status codes plus redacted JSON error bodies for unauthorized, expired, unlicensed, and entitlement failures."
    ],
    productionChecklist: [
      "Configure all endpoint env vars to official HTTPS EasyAR APIs.",
      "Validate CORS/network policy for local MCP clients if endpoints are proxied.",
      "Ensure every endpoint authorizes by account token and entitlements.",
      "Run easyar_check_official_access for image-tracking and cloud-recognition.",
      "Run easyar_write_deployment_readiness and keep blockers at zero before release."
    ],
    readyForProductionOfficialAccess,
    security: "This contract is schema and deployment guidance only. It intentionally contains no EasyAR account token, license key, API key, API secret, appKey, appSecret, or user password."
  };
}

export function officialApiEndpointContract(input: {
  baseUrl: string;
  id: string;
  envName: string;
  configured: boolean;
  method: "GET" | "POST";
  path: string;
  purpose: string;
  requestFields: string[];
  requiredResponseFields: string[];
  optionalResponseFields: string[];
  usedByTools: string[];
}) {
  const { baseUrl, ...endpoint } = input;
  return {
    ...endpoint,
    expectedUrl: `${baseUrl}${input.path}`,
    authorization: "Required bearer token from EASYAR_API_TOKEN",
    timeoutMs: 10000,
    secretHandling: "Accept secret request fields only when needed for validation, never echo them back, and return only redacted metadata."
  };
}

export async function buildAuthorizationStrategyReport(
  root: string | null,
  sample: SampleInfo,
  platform: "android" | "ios" | "standalone" | "unknown",
  accountStage: AccountStage,
  preferredMode: AuthorizationMode
) {
  const auth = readAuthConfig();
  const localConfig = root ? await buildLocalConfigValidationReport(root) : null;
  const cloudConfig = root ? await readCloudRecognitionConfig(root) : {};
  const needsCloudRecognition = sample.id === "cloud-recognition";
  const derivedStage = deriveAccountOnboardingStage(accountStage, auth, localConfig, cloudConfig, needsCloudRecognition);
  const localLicenseReady = localConfig?.checks.some((check) => check.id === "license-key" && check.ok) ?? false;
  const localCloudReady = !needsCloudRecognition || hasCompleteCloudRecognitionConfig(cloudConfig);
  const officialApiReady = auth.hasToken
    && auth.accountStatusEndpointConfigured
    && auth.licenseValidationEndpointConfigured
    && auth.downloadsEndpointConfigured
    && auth.cloudCredentialsEndpointConfigured;
  const localKeyReady = localLicenseReady && localCloudReady;
  const portalReadyForKeyCollection = ["logged-in", "has-license", "has-cloud-credentials"].includes(derivedStage) || localLicenseReady;
  const selectedMode = chooseAuthorizationMode(preferredMode, officialApiReady, localKeyReady, portalReadyForKeyCollection);
  const nextActions = authorizationStrategyNextActions(selectedMode, root, sample, platform, needsCloudRecognition, officialApiReady, localKeyReady, portalReadyForKeyCollection);

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      needsCloudRecognition
    },
    platform,
    requestedMode: preferredMode,
    selectedMode,
    accountStage: {
      requested: accountStage,
      derived: derivedStage
    },
    productionReady: officialApiReady,
    focusedUnityRunReadyWithoutOfficialApi: localKeyReady,
    keyModel: {
      statement: "After the official EasyAR Sense Unity Plugin is installed in Unity, focused sample execution is driven by local EasyAR license/API key configuration; users do not need to log in to www.easyar.cn at Unity runtime.",
      accountUse: "The EasyAR website account is still used to obtain authorized plugin packages, license keys, and Cloud Recognition/CRS AppId/API KEY materials.",
      mcpUse: "mcp-easyar guides the user to store those materials locally and validates presence/redacted readiness without collecting passwords or secret values in chat."
    },
    noBypassPolicy: {
      allowed: false,
      statement: "mcp-easyar must not bypass EasyAR login, license, download, Cloud Recognition, enterprise, or rate-limit gates.",
      forbiddenApproaches: [
        "Scraping or reusing browser login sessions/cookies.",
        "Guessing private EasyAR backend endpoints.",
        "Minting or exposing unauthorized SDK/sample download URLs.",
        "Asking users to paste website passwords, verification codes, account tokens, license keys, API KEY/API Secret, appKey, or appSecret into chat.",
        "Embedding EasyAR account materials in source code, GitHub issues, CI logs, Unity logs, APKs, or npm package files."
      ],
      safeAlternatives: [
        "Local key mode for Unity sample execution after authorized plugin/key setup.",
        "Official API mode for future production automation of account status, entitlement, and downloads.",
        "Local authorized package import after the user downloads packages through their EasyAR account.",
        "Local stub mode for backend contract wiring only."
      ]
    },
    modes: {
      localKey: {
        ready: localKeyReady,
        purpose: "Primary MVP/internal path for Unity execution after the user has installed the official plugin and filled local keys.",
        requires: [
          "Official EasyAR Sense Unity Plugin installed in the Unity project.",
          "ProjectSettings/EasyAR/easyar.local.json contains a matching EasyAR license key and bundle/package identifier.",
          ...(needsCloudRecognition ? ["Cloud Recognition appId/serverAddress/apiKey/apiSecret are filled locally from the EasyAR account page."] : [])
        ],
        enables: [
          "MCP can validate local config presence without printing values.",
          "MCP can prepare/import Unity assets.",
          "MCP can build, install, and help verify focused samples on a real device."
        ],
        limitations: [
          "Does not automatically download private packages.",
          "Does not remotely prove account entitlement without official API responses.",
          "Production auto-distribution/release gate still remains blocked on official API readiness."
        ]
      },
      officialApi: {
        ready: officialApiReady,
        purpose: "Future production account-scoped automation for registered EasyAR users.",
        requires: [
          "EASYAR_API_TOKEN issued or validated by official EasyAR account infrastructure.",
          "EASYAR_ACCOUNT_STATUS_ENDPOINT",
          "EASYAR_LICENSE_VALIDATE_ENDPOINT",
          "EASYAR_DOWNLOADS_ENDPOINT",
          "EASYAR_CLOUD_CREDENTIALS_ENDPOINT"
        ],
        enables: [
          "Account status checks.",
          "License validation.",
          "Authorized SDK/sample package discovery.",
          "Cloud Recognition credential presence checks."
        ],
        limitations: officialApiReady
          ? ["Still must not return raw secrets or unauthorized download URLs."]
          : ["Not ready until EasyAR official account API endpoints and token validation are configured."]
      },
      manualBrowser: {
        ready: portalReadyForKeyCollection,
        purpose: "Browser-only handoff for obtaining authorized plugin/key materials when official API endpoints are not available.",
        requires: [
          "User registers/logs in only through https://www.easyar.cn/ in a browser.",
          "User creates/locates license and Cloud Recognition materials in the EasyAR development center.",
          "User stores values locally in ProjectSettings/EasyAR/easyar.local.json or environment/secret storage."
        ],
        enables: [
          "Transitions into local-key mode.",
          "Avoids website password or verification-code handling by MCP."
        ],
        limitations: [
          "MCP cannot prove account entitlement to downloads without official API responses.",
          "MCP cannot distribute private SDK/sample packages automatically."
        ]
      },
      localPackages: {
        ready: localKeyReady,
        purpose: "Use officially downloaded local Unity packages and samples without account API calls.",
        requires: [
          "Official EasyAR Unity Plugin and samples were downloaded/imported by the registered user.",
          "Local config has a matching license key and bundle/package identifier.",
          ...(needsCloudRecognition ? ["Cloud Recognition service config is filled locally."] : [])
        ],
        enables: [
          "Focused preflight.",
          "Unity compile/build automation.",
          "Real-device run result recording."
        ],
        limitations: [
          "Does not replace official download authorization.",
          "Does not validate account entitlement remotely."
        ]
      },
      stub: {
        ready: true,
        purpose: "Backend/gateway contract wiring before real EasyAR services exist.",
        requires: [
          "npm run official-api:stub in a local shell.",
          "Endpoint env vars exported from the stub output.",
          "A fixture token only for local validation."
        ],
        enables: [
          "Canary/client routing tests.",
          "Endpoint schema compatibility checks."
        ],
        limitations: [
          "Not a production account service.",
          "Must not be deployed as a real authorization backend.",
          "Does not prove any real EasyAR user entitlement."
        ]
      }
    },
    recommendedToolSequence: authorizationStrategyToolSequence(selectedMode, root, sample, platform),
    nextActions,
    security: "This strategy contains policy, readiness flags, and tool calls only. It does not include EasyAR passwords, verification codes, account tokens, license keys, Cloud Recognition API KEY/API Secret values, appKey, appSecret, signing keys, provisioning secrets, APKs, Unity packages, or raw logs."
  };
}

export function chooseAuthorizationMode(
  preferredMode: AuthorizationMode,
  officialApiReady: boolean,
  localKeyReady: boolean,
  portalReadyForKeyCollection: boolean
): Exclude<AuthorizationMode, "auto"> {
  if (preferredMode !== "auto") {
    return preferredMode;
  }
  if (officialApiReady) {
    return "official-api";
  }
  if (localKeyReady) {
    return "local-key";
  }
  if (portalReadyForKeyCollection) {
    return "manual-browser";
  }
  return "manual-browser";
}

export function authorizationStrategyToolSequence(
  selectedMode: Exclude<AuthorizationMode, "auto">,
  root: string | null,
  sample: SampleInfo,
  platform: "android" | "ios" | "standalone" | "unknown"
) {
  const projectPath = root ?? "/path/to/UnityProject";
  if (selectedMode === "official-api") {
    return [
      { tool: "easyar_auth_status", arguments: {} },
      { tool: "easyar_check_official_access", arguments: { projectPath, sampleId: sample.id, platform } },
      { tool: "easyar_write_official_access_report", arguments: { projectPath, sampleId: sample.id, platform } },
      { tool: "easyar_next_workflow_step", arguments: { projectPath, sampleId: sample.id, platform } }
    ];
  }
  if (selectedMode === "stub") {
    return [
      { command: "npm run official-api:stub" },
      { command: "npm run official-api:canary" },
      { tool: "easyar_write_official_api_handoff", arguments: { workspacePath: "/path/to/mcp-easyar", deploymentTarget: "staging" } }
    ];
  }
  return [
    { tool: "easyar_account_onboarding", arguments: { projectPath, sampleId: sample.id, platform, accountStage: "not-registered" } },
    { tool: "easyar_write_local_config_handoff", arguments: { projectPath, sampleId: sample.id, platform, accountStage: "logged-in" } },
    { tool: "easyar_validate_local_config", arguments: { projectPath } },
    { tool: "easyar_write_import_checklist", arguments: { projectPath, sampleId: sample.id, platform } },
    { tool: "easyar_next_workflow_step", arguments: { projectPath, sampleId: sample.id, platform } }
  ];
}

export function authorizationStrategyNextActions(
  selectedMode: Exclude<AuthorizationMode, "auto">,
  root: string | null,
  sample: SampleInfo,
  platform: "android" | "ios" | "standalone" | "unknown",
  needsCloudRecognition: boolean,
  officialApiReady: boolean,
  localKeyReady: boolean,
  portalReadyForKeyCollection: boolean
) {
  const projectPath = root ?? "/path/to/UnityProject";
  const actions: string[] = [];
  if (!officialApiReady) {
    actions.push("Treat official API work as future production automation; do not bypass EasyAR account/download gates.");
  }
  if (selectedMode === "official-api") {
    actions.push(`Run easyar_check_official_access projectPath=${projectPath} sampleId=${sample.id} platform=${platform}.`);
    actions.push("Run npm run official-api:canary with a registered EasyAR test account before enabling strict production release.");
  } else if (selectedMode === "stub") {
    actions.push("Run npm run official-api:stub only for local contract wiring; never deploy it as production authorization.");
    actions.push("Replace stub routes with official EasyAR account/license/download/cloud services before release.");
  } else {
    if (!portalReadyForKeyCollection) {
      actions.push("Start with easyar_account_onboarding accountStage=not-registered and guide the user through browser-only registration/login to obtain plugin/key materials.");
    }
    actions.push(`Write local handoff: easyar_write_local_config_handoff projectPath=${projectPath} sampleId=${sample.id} platform=${platform}.`);
    actions.push("Have the user fill ProjectSettings/EasyAR/easyar.local.json locally, then run easyar_validate_local_config.");
    actions.push("Install/import only packages obtained through the user's authorized EasyAR account or official public download page.");
    if (needsCloudRecognition && !localKeyReady) {
      actions.push("For Cloud Recognition, fill the official CRS/Cloud Recognition AppId, serverAddress, API KEY, and API Secret locally.");
    }
    actions.push(`Continue with easyar_next_workflow_step projectPath=${projectPath} sampleId=${sample.id} platform=${platform}.`);
  }
  return Array.from(new Set(actions));
}

export function buildOfficialApiHandoff(baseUrl: string | undefined, includeCurl: boolean, deploymentTarget: string | undefined) {
  const contract = buildOfficialApiContract(baseUrl, true);
  const endpointMapping = contract.endpoints.map((endpoint) => ({
    id: endpoint.id,
    envName: endpoint.envName,
    method: endpoint.method,
    expectedUrl: endpoint.expectedUrl,
    purpose: endpoint.purpose,
    backendOwnerTodo: officialApiBackendTodo(endpoint.id),
    requestFields: endpoint.requestFields,
    requiredResponseFields: endpoint.requiredResponseFields,
    usedByTools: endpoint.usedByTools,
    canaryCommand: includeCurl ? officialApiCanaryCommand(endpoint) : null,
    acceptance: officialApiEndpointAcceptance(endpoint.id)
  }));
  const acceptanceGates = [
    "All required endpoint environment variables are set in the MCP runtime environment.",
    "Every endpoint requires Authorization: Bearer ${EASYAR_API_TOKEN} and rejects missing, expired, or unauthorized tokens.",
    "easyar_check_account returns configured=true and ok=true for a registered EasyAR test account.",
    "easyar_validate_license validates the local EasyAR Sense license for the Unity bundle/package identifier without echoing the license key.",
    "easyar_discover_downloads returns only account-authorized package metadata and never bypasses EasyAR download gates.",
    "easyar_discover_cloud_credentials returns appId and presence flags, never raw API KEY/API Secret, appKey, or appSecret values.",
    "easyar_check_official_access passes for image-tracking and cloud-recognition using the same deployment environment.",
    "easyar_write_deployment_readiness has no official endpoint blockers.",
    "Fixture smoke remains green, then a real staging/prod canary run is recorded in OFFICIAL_ACCESS.md."
  ];
  return {
    generatedAt: new Date().toISOString(),
    deploymentTarget: deploymentTarget ?? "unspecified",
    server: {
      name: serverName,
      version: serverVersion,
      repository: "https://github.com/terri1982/mcp-easyar"
    },
    environment: contract.environment,
    whyOfficialSupportIsRequired: contract.authorizationBoundary,
    endpointMapping,
    rollout: [
      "Confirm the EasyAR account system can issue or validate a registered-user bearer token for MCP clients.",
      "Map existing EasyAR account/license/download/cloud services to the four MCP endpoint contracts.",
      "Deploy endpoints first to staging or an internal environment and set the matching MCP env vars there.",
      "Run canary commands with a registered test account, a valid EasyAR Sense license, and a Cloud Recognition test app.",
      "Run easyar_check_official_access for image-tracking and cloud-recognition.",
      "Only after staging passes, configure production env vars for the published MCP deployment."
    ],
    acceptanceGates,
    failurePolicy: [
      "Return 401/403 for invalid, expired, unregistered, unlicensed, or entitlement-missing accounts.",
      "Return redacted JSON errors with stable error codes; do not return raw secrets or private account data.",
      "Rate-limit repeated failed validation attempts by account/token and endpoint.",
      "If an endpoint is unavailable, MCP must report configured=false or ok=false and stop before private downloads or Cloud Recognition setup.",
      "Do not fall back to scraping EasyAR website sessions or bypassing login/download gates."
    ],
    artifactsToRegenerate: [
      "docs/OFFICIAL_API_CONTRACT.md",
      "docs/OFFICIAL_API_HANDOFF.md",
      "Assets/EasyARGenerated/<sampleId>/OFFICIAL_ACCESS.md",
      "Assets/EasyARGenerated/DEPLOYMENT_READINESS.md",
      "Assets/EasyARGenerated/PRODUCTION_VALIDATION.md",
      "Assets/EasyARGenerated/REMAINING_WORK.md"
    ],
    nextActions: [
      "Assign backend owners for account-status, license-validation, downloads-discovery, and cloud-credentials-discovery.",
      "Populate EASYAR_ACCOUNT_STATUS_ENDPOINT, EASYAR_LICENSE_VALIDATE_ENDPOINT, EASYAR_DOWNLOADS_ENDPOINT, and EASYAR_CLOUD_CREDENTIALS_ENDPOINT in a staging MCP environment.",
      "Run node scripts/official-api-fixture-smoke.mjs, then run real endpoint canaries with a registered EasyAR test account.",
      "Run easyar_write_official_access_report for image-tracking and cloud-recognition after endpoints are configured."
    ],
    security: "This handoff contains endpoint names, request/response schemas, and non-secret canary templates only. It must not contain EasyAR passwords, verification codes, account tokens, license keys, API keys, API secrets, appKey, appSecret, signing keys, or private user data."
  };
}

export function officialApiBackendTodo(endpointId: string): string {
  if (endpointId === "account-status") {
    return "Bind token validation to the official EasyAR registered-user account system and return non-secret account/entitlement metadata.";
  }
  if (endpointId === "license-validation") {
    return "Validate a supplied local EasyAR Sense license against account entitlement, product, platform, and Unity bundle/package identifier.";
  }
  if (endpointId === "downloads-discovery") {
    return "Return only authorized SDK/plugin/sample package metadata for the registered account without granting unauthorized downloads.";
  }
  if (endpointId === "cloud-credentials-discovery") {
    return "Return Cloud Recognition app metadata and API KEY presence flags without returning raw API KEY/API Secret values.";
  }
  return "Map this endpoint to an authorized official EasyAR backend service.";
}

export function officialApiEndpointAcceptance(endpointId: string): string[] {
  if (endpointId === "account-status") {
    return [
      "Valid registered-user token returns ok=true and account.registered=true.",
      "Unregistered or expired token returns 401/403 with a redacted error body."
    ];
  }
  if (endpointId === "license-validation") {
    return [
      "Valid license/bundle/platform returns license.valid=true and bundleIdentifierMatches=true.",
      "Invalid license, wrong bundle id, or disallowed platform returns ok=false or 403 without echoing the license key."
    ];
  }
  if (endpointId === "downloads-discovery") {
    return [
      "Authorized account returns EasyAR Unity Plugin/sample metadata needed by focused workflows.",
      "Unauthorized package requests return 403 and no private download URL."
    ];
  }
  if (endpointId === "cloud-credentials-discovery") {
    return [
      "Configured Cloud Recognition app returns appId plus serverAddress and apiKeyPresent/apiSecretPresent flags.",
      "Response never includes raw API KEY/API Secret, appKey, or appSecret values."
    ];
  }
  return ["Endpoint passes its required response fields and redaction policy."];
}

export function officialApiCanaryCommand(endpoint: ReturnType<typeof officialApiEndpointContract>): string {
  const url = `\${${endpoint.envName}}`;
  const tokenRef = "$" + "{EASYAR_API_TOKEN}";
  if (endpoint.method === "GET") {
    return `curl -fsS -H "Authorization: Bearer ${tokenRef}" "${url}"`;
  }
  const body = endpoint.id === "license-validation"
    ? "{\"licenseKey\":\"${EASYAR_TEST_LICENSE_KEY}\",\"bundleIdentifier\":\"com.easyar.testsample\",\"platform\":\"android\"}"
    : endpoint.id === "downloads-discovery"
      ? "{\"sampleId\":\"image-tracking\",\"packageKind\":\"unity-samples\",\"unityVersion\":\"6000.4.7f1\"}"
      : endpoint.id === "cloud-credentials-discovery"
        ? "{\"sampleId\":\"cloud-recognition\",\"bundleIdentifier\":\"com.easyar.testsample\",\"platform\":\"android\"}"
        : "{}";
  return `curl -fsS -X POST -H "Authorization: Bearer ${tokenRef}" -H "Content-Type: application/json" -d '${body}' "${url}"`;
}

export function buildOfficialApiContractExamples(baseUrl: string) {
  return [
    {
      endpoint: "license-validation",
      request: {
        method: "POST",
        url: `${baseUrl}/mcp/license/validate`,
        body: {
          licenseKey: "<local EasyAR license key>",
          bundleIdentifier: "com.example.easyar.sample",
          platform: "android"
        }
      },
      response: {
        ok: true,
        license: {
          valid: true,
          product: "EasyAR Sense Unity Plugin",
          bundleIdentifierMatches: true,
          platformAllowed: true,
          features: ["image-tracking", "cloud-recognition"]
        }
      }
    },
    {
      endpoint: "cloud-credentials-discovery",
      request: {
        method: "POST",
        url: `${baseUrl}/mcp/cloud-recognition/credentials`,
        body: {
          sampleId: "cloud-recognition",
          bundleIdentifier: "com.example.easyar.sample",
          platform: "android"
        }
      },
      response: {
        ok: true,
        cloudRecognition: {
          appId: "<app id or masked app id>",
          apiKeyPresent: true,
          apiSecretPresent: true,
          appKeyPresent: true,
          appSecretPresent: true,
          serviceRegion: "configured"
        }
      }
    }
  ];
}

export async function buildOfficialAccessReport(
  root: string | null,
  sample: SampleInfo,
  platform: "android" | "ios" | "standalone" | "unknown",
  packageKind: "unity-plugin" | "unity-samples" | "native-sdk" | "xr-extension" | "unknown"
) {
  const auth = readAuthConfig();
  const unityVersion = root
    ? await readUnityVersion(root)
    : envFirst(["EASYAR_UNITY_VERSION", "UNITY_VERSION"]) ?? "2022.3.62f3";
  const localConfig = root
    ? await readLocalConfigForRemoteValidation(root)
    : readRemoteValidationConfigFromEnv(sample);
  const [account, license, downloads, cloudCredentials] = await Promise.all([
    easyarApi.checkAccount(),
    easyarApi.validateLicense({
      licenseKey: localConfig.licenseKey,
      bundleIdentifier: localConfig.bundleIdentifier,
      platform
    }),
    easyarApi.discoverDownloads({
      sampleId: sample.id,
      packageKind,
      unityVersion
    }),
    sample.id === "cloud-recognition"
      ? easyarApi.discoverCloudCredentials({
          sampleId: sample.id,
          bundleIdentifier: localConfig.bundleIdentifier,
          platform
        })
      : Promise.resolve(null)
  ]);
  const checks = [
    officialAccessCheck("api-token", auth.hasToken, true, "Official production authentication is configured for account-scoped requests.", auth.hasToken ? "Authentication material is present and redacted." : "Official production authentication is not configured; local-key MVP can proceed without it."),
    officialAccessRemoteCheck("account-status", true, account),
    officialAccessRemoteCheck("license-validation", true, license),
    officialAccessRemoteCheck("downloads-discovery", true, downloads),
    ...(cloudCredentials
      ? [officialAccessRemoteCheck("cloud-credentials-discovery", true, cloudCredentials)]
      : [officialAccessCheck("cloud-credentials-discovery", true, false, "Cloud Recognition credential discovery is not required for Image Tracking.", "Skipped for this sample.")])
  ];
  const blockers = checks.filter((check) => check.required && !check.ok);

  return {
    generatedAt: new Date().toISOString(),
    projectPath: root,
    sample: {
      id: sample.id,
      name: sample.name,
      implementationStatus: sample.implementationStatus
    },
    platform,
    packageKind,
    unityVersion,
    input: {
      hasLicenseKey: Boolean(localConfig.licenseKey),
      bundleIdentifier: localConfig.bundleIdentifier ?? null,
      source: root ? "project-local-config" : "environment"
    },
    auth: {
      apiBaseUrl: auth.apiBaseUrl,
      hasToken: auth.hasToken,
      accountStatusEndpointConfigured: auth.accountStatusEndpointConfigured,
      licenseValidationEndpointConfigured: auth.licenseValidationEndpointConfigured,
      downloadsEndpointConfigured: auth.downloadsEndpointConfigured,
      cloudCredentialsEndpointConfigured: auth.cloudCredentialsEndpointConfigured
    },
    readyForOfficialContent: blockers.length === 0,
    checks,
    blockers,
    remoteResults: {
      account,
      license,
      downloads,
      cloudCredentials
    },
    nextActions: blockers.length > 0
      ? Array.from(new Set(blockers.flatMap((blocker) => blocker.nextActions)))
      : [
          "Official account, license, downloads, and sample-specific official access checks passed.",
          "Continue with easyar_generate_import_checklist after importing official packages into Unity."
        ],
    security: "EASYAR_API_TOKEN, licenseKey, appKey, appSecret, and credential values are never returned. This report only calls configured official EasyAR endpoints and does not bypass authorization."
  };
}

export function readRemoteValidationConfigFromEnv(sample: SampleInfo): {
  licenseKey?: string;
  bundleIdentifier?: string;
} {
  return {
    licenseKey: envFirst(["EASYAR_LICENSE_KEY", "EASYAR_SENSE_LICENSE_KEY"]),
    bundleIdentifier: envFirst(["EASYAR_BUNDLE_IDENTIFIER", "EASYAR_UNITY_BUNDLE_IDENTIFIER"]) ?? defaultBundleIdentifier(sample)
  };
}

export function officialAccessCheck(id: string, ok: boolean, required: boolean, summary: string, detail: string) {
  return {
    id,
    ok,
    required,
    configured: ok,
    statusCode: null as number | null,
    summary,
    detail,
    nextActions: ok
      ? ["Continue with focused EasyAR workflow checks."]
      : ["Configure the official EasyAR endpoint/token environment for this MCP server."]
  };
}

export function officialAccessRemoteCheck(id: string, required: boolean, result: Awaited<ReturnType<typeof easyarApi.checkAccount>>) {
  const ok = result.configured && result.ok === true;
  return {
    id,
    ok,
    required,
    configured: result.configured,
    statusCode: result.statusCode,
    summary: result.summary,
    detail: result.endpoint ? `Endpoint: ${result.endpoint}` : "Endpoint is not configured.",
    nextActions: result.nextActions
  };
}

export async function buildPortalEvidenceReport(input: {
  root: string | null;
  sample: SampleInfo;
  platform: "android" | "ios" | "standalone" | "unknown";
  accountName?: string;
  apiKeyRecordId?: string;
  apiKeyAppName?: string;
  apiKeyCreatedAt?: string;
  cloudServicesEnabled: Array<"cloud-recognition" | "spatialmap" | "mega-landmark" | "ar-operations" | "mega-block" | "other">;
  apiKeyPresent?: boolean;
  apiSecretPresent?: boolean;
  tokenStatus: "not-checked" | "not-needed" | "present" | "missing" | "expired" | "unknown";
  senseLicenseStatus: "not-checked" | "present" | "missing" | "unknown";
  senseLicenseRecordId?: string;
  cloudLibraryStatus: "not-checked" | "present" | "missing" | "unknown";
  cloudLibraryName?: string;
  cloudLibraryRecordId?: string;
  cloudTargetCount?: number;
  portalUrl?: string;
  notes: string[];
}) {
  const needsCloudRecognition = input.sample.id === "cloud-recognition";
  const localConfig = input.root ? await buildLocalConfigValidationReport(input.root) : null;
  const cloudConfig = input.root ? await readCloudRecognitionConfig(input.root) : {};
  const localConfigForRemote = input.root ? await readLocalConfigForRemoteValidation(input.root) : {};
  const hasCloudLibrary = input.cloudLibraryStatus === "present";
  const hasCloudTargets = typeof input.cloudTargetCount === "number" && input.cloudTargetCount > 0;
  const cloudServiceEnabled = input.cloudServicesEnabled.includes("cloud-recognition");
  const localCloudReady = !needsCloudRecognition || (
    isNonPlaceholderString(cloudConfig.appId)
    && (
      isNonPlaceholderString(cloudConfig.apiKey)
      || (isNonPlaceholderString(cloudConfig.appKey) && isNonPlaceholderString(cloudConfig.appSecret))
    )
  );
  const localLicenseReady = localConfig
    ? localConfig.checks.some((check) => check.id === "license-key" && check.ok)
    : false;
  const blockers = [
    portalEvidenceBlocker(
      "sense-license",
      input.senseLicenseStatus !== "missing",
      "Sense License record is missing in the observed portal page.",
      "Create or locate the EasyAR Sense license bound to the Unity bundle/package identifier."
    ),
    portalEvidenceBlocker(
      "local-license-config",
      !input.root || localLicenseReady,
      "Local easyar.local.json does not have a valid EasyAR license presence check.",
      "Fill easyar.licenseKey locally, then run easyar_validate_local_config."
    ),
    portalEvidenceBlocker(
      "cloud-service-enabled",
      !needsCloudRecognition || cloudServiceEnabled,
      "Cloud Recognition is not listed as enabled for the observed API KEY app.",
      "Enable Cloud Recognition for the API KEY app in the EasyAR development center."
    ),
    portalEvidenceBlocker(
      "cloud-api-key-presence",
      !needsCloudRecognition || input.apiKeyPresent === true,
      "Portal API KEY presence was not confirmed.",
      "Confirm the API KEY field exists in the portal, but do not paste the value into MCP chat."
    ),
    portalEvidenceBlocker(
      "cloud-api-secret-presence",
      !needsCloudRecognition || input.apiSecretPresent === true,
      "Portal API Secret presence was not confirmed.",
      "Confirm the API Secret field exists in the portal, but do not paste the value into MCP chat."
    ),
    portalEvidenceBlocker(
      "local-cloud-config",
      !input.root || localCloudReady,
      "Local Cloud Recognition credentials are not complete for the focused sample.",
      "Fill easyar.cloudRecognition.appId, serverAddress, apiKey, and apiSecret locally, then validate local config."
    ),
    portalEvidenceBlocker(
      "cloud-library",
      !needsCloudRecognition || hasCloudLibrary,
      "No Cloud Recognition image library was observed.",
      "Create a Cloud Recognition image library in the EasyAR development center."
    ),
    portalEvidenceBlocker(
      "cloud-target-image",
      !needsCloudRecognition || hasCloudTargets,
      "No uploaded Cloud Recognition target image count was observed.",
      "Upload at least one test target image to the Cloud Recognition library before device validation."
    )
  ].filter((blocker) => !blocker.ok);
  const readyForLocalConfig = input.root ? Boolean(localConfig?.valid) : false;
  const readyForCloudDeviceValidation = !needsCloudRecognition || (readyForLocalConfig && cloudServiceEnabled && hasCloudLibrary && hasCloudTargets);

  return {
    generatedAt: new Date().toISOString(),
    projectPath: input.root,
    sample: {
      id: input.sample.id,
      name: input.sample.name
    },
    platform: input.platform,
    portal: {
      accountName: sanitizePortalText(input.accountName),
      portalUrl: sanitizePortalUrl(input.portalUrl),
      apiKeyRecordId: sanitizePortalId(input.apiKeyRecordId),
      apiKeyAppName: sanitizePortalText(input.apiKeyAppName),
      apiKeyCreatedAt: sanitizePortalText(input.apiKeyCreatedAt),
      cloudServicesEnabled: input.cloudServicesEnabled,
      apiKeyPresent: input.apiKeyPresent ?? null,
      apiSecretPresent: input.apiSecretPresent ?? null,
      tokenStatus: input.tokenStatus,
      senseLicenseStatus: input.senseLicenseStatus,
      senseLicenseRecordId: sanitizePortalId(input.senseLicenseRecordId),
      cloudLibraryStatus: input.cloudLibraryStatus,
      cloudLibraryName: sanitizePortalText(input.cloudLibraryName),
      cloudLibraryRecordId: sanitizePortalId(input.cloudLibraryRecordId),
      cloudTargetCount: input.cloudTargetCount ?? null
    },
    localConfig: input.root
      ? {
          path: path.join(input.root, "ProjectSettings", "EasyAR", "easyar.local.json"),
          valid: localConfig?.valid ?? false,
          licenseKeyPresent: localLicenseReady,
          bundleIdentifier: localConfigForRemote.bundleIdentifier ?? null,
          cloudRecognition: {
            appIdPresent: isNonPlaceholderString(cloudConfig.appId),
            apiKeyPresent: isNonPlaceholderString(cloudConfig.apiKey),
            apiSecretPresent: isNonPlaceholderString(cloudConfig.apiSecret),
            appKeyPresent: isNonPlaceholderString(cloudConfig.appKey),
            appSecretPresent: isNonPlaceholderString(cloudConfig.appSecret)
          }
        }
      : null,
    readyForLocalConfig,
    readyForCloudDeviceValidation,
    blockers,
    notes: input.notes.map((note) => sanitizePortalText(note)).filter((note): note is string => Boolean(note)),
    nextActions: blockers.length > 0
      ? Array.from(new Set(blockers.map((blocker) => blocker.action)))
      : [
          "Portal evidence and local config presence are sufficient for the focused account-material handoff.",
          "Continue with easyar_write_focused_preflight and the Unity compile/build/device validation sequence."
        ],
    security: "Portal evidence stores only non-secret ids, names, service flags, presence booleans, counts, and redacted notes. It must not include EasyAR passwords, verification codes, API KEY values, API Secret values, license keys, appKey, appSecret, tokens, signing keys, or private account data."
  };
}

export function portalEvidenceBlocker(id: string, ok: boolean, detail: string, action: string) {
  return {
    id,
    ok,
    detail,
    action
  };
}

export function sanitizePortalText(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const redacted = redactSecretText(value.trim())
    .replace(/\b[A-Fa-f0-9]{24,}\b/g, "<redacted>")
    .replace(/\b[A-Za-z0-9+/=_-]{40,}\b/g, "<redacted>");
  if (looksLikeStandaloneSecret(redacted)) {
    return "<redacted>";
  }
  return redacted;
}

export function sanitizePortalId(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!/^[A-Za-z0-9._:-]{1,64}$/.test(trimmed) || looksLikeStandaloneSecret(trimmed)) {
    return "<redacted>";
  }
  return trimmed;
}

export function sanitizePortalUrl(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  try {
    const parsed = new URL(value);
    parsed.search = "";
    parsed.hash = "";
    return redactSecretText(parsed.toString());
  } catch {
    return sanitizePortalText(value);
  }
}

export function looksLikeStandaloneSecret(value: string): boolean {
  if (value === "<redacted>") {
    return false;
  }
  return /^(?:[A-Fa-f0-9]{24,}|[A-Za-z0-9+/=_-]{40,})$/.test(value);
}
