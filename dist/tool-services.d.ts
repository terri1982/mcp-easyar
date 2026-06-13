import { clientEntrypointModes, clientKinds, mobilePlatforms, monoBehaviourKinds } from "./catalog.js";
import type { AccountStage, AuthorizationMode } from "./catalog.js";
import type { SampleInfo } from "./samples.js";
export { DeviceValidationStep, FocusedHandoffPackInput, androidDeviceInteractionAction, artifactPriority, buildAndroidDeviceRunbook, buildArtifactIndex, buildCompletionNextActions, buildCompletionReport, buildDeviceRunResultForm, buildDeviceValidationChecklist, buildDeviceValidationSteps, buildFocusedHandoffPackPlan, buildFocusedPreflight, buildFocusedReleaseEvidence, buildFocusedRunReport, buildFocusedScopeNextActions, buildFocusedScopeStatus, buildIssueReport, buildRunResult, buildSupportBundle, chooseCompletionStatus, countMarkdownStepStatuses, countPassedDeviceValidationSteps, defaultFocusedOutputPath, defaultIssueReproductionSteps, devicePortalEvidenceBlockers, focusedArtifactDefinitions, focusedArtifactReadOrder, focusedHandoffPackArtifactSpecs, focusedHandoffPackPurpose, focusedHandoffPackSamples, hasRecordedDevice, isPortalEvidenceReadyForSample, parseMarkdownField, parseNumberField, parseRunResultStatus, parseYesNoField, portalEvidencePreflightDetail, readFocusedReleaseEvidence, readPortalEvidenceArtifact, readRunResultArtifact, sampleDeviceEvidencePrompts, sampleDevicePassCriteria, sampleExpectedIssueBehavior, samplePassedEvidencePlaceholder, sampleSpecificDeviceValidationSteps, writeFocusedHandoffPack, writeFocusedHandoffPackForSample, writePackFile } from "./tool-device-evidence.js";
export { readCloudRecognitionConfig, readLogFile, UnityLogCandidate, findUnityLogCandidates, readLogTail, readJsonFile, buildLocalConfigValidationReport, buildLocalConfigFromEnvReport, envFirst, envPresenceItem, validateLocalConfig, localConfigAction, isRecord, isNonPlaceholderString, isOptionalNonPlaceholderString, isNonEmptyString, sanitizeRunResultNotes, sanitizeIssueText, hasCloudRecognitionConfig, hasCompleteCloudRecognitionConfig, cloudRecognitionCredentialMode } from "./tool-local-config.js";
export { UnityLogRule, analyzeUnityLog, sampleSpecificLogRules, findEvidence, ScriptReviewIssue, reviewCsharpScript, buildScriptReviewReport, buildScriptReviewActions, chooseNextRunPhase } from "./tool-diagnostics.js";
export { resolveProjectPath, exists, ensureDirectory, readUnityVersion, findFiles, findUnityCandidates, collectUnityExecutables, buildUnityEnvironmentReport, chooseUnityCandidate, unityPathMatchesProjectVersion, shellSingleQuote } from "./tool-project.js";
export { buildSampleReadinessReport, buildImportChecklist, buildSampleImportGuide, importSampleFromPackageCache, readPackageCacheInfo, normalizeUnityPackageVersion, parsePackageCacheFolderVersion, sanitizeAssetFolderName, buildSampleSceneAudit, uniqueBlockers, filterOfficialEasyARSignals, matchSampleScenes, sceneContentMatchesSample, findPackageCacheSamplePaths, walkPackageCacheSamples, packageCacheSamplePathMatches, readinessAction, findImageTrackingTargetAssets, findImageTargetsStreamingPackageCandidates, hasOfficialImageTargetsStreamingAssets, findMegaAssetHints, readMegaSettingsSummary, readMegaLocationInputModeSummary, hasPicoHeadsetMegaSignals, readMegaBlockRootSummary, hasYamlScalar, focusedSampleGeneratedDir, focusedSampleRunbookPath, buildSampleSpecificReadinessChecks, readBuildSettingsSceneHints, buildSampleSceneAuditSpecifics } from "./tool-sample-workflow.js";
import { buildImportChecklist } from "./tool-sample-workflow.js";
import { ScriptReviewIssue } from "./tool-diagnostics.js";
import { UnityLogCandidate, buildLocalConfigValidationReport } from "./tool-local-config.js";
export { extractMethodBody, findLineNumber, firstMatchingLine, walk, assertInside, writeGeneratedFile, ensureGitignoreEntries, escapeRegExp, resolveUnityLogPath, defaultUnityBatchLogPath, buildUnityRunResultStep, buildSuggestedRunResultCall, unityMethodStepName, unityMethodSuccessNextAction } from "./tool-file-utils.js";
export type ReadinessCheck = {
    id: string;
    ok: boolean;
    severity: "blocker" | "warning" | "info";
    detail: string;
};
export type DeploymentReadinessReport = {
    generatedAt: string;
    server: {
        name: string;
        version: string;
        packageName: string | null;
        repository: string | null;
        binName: string | null;
        binPath: string | null;
        packageFiles: string[];
    };
    ready: boolean;
    blockers: ReadinessCheck[];
    warnings: ReadinessCheck[];
    groups: Record<string, ReadinessCheck[]>;
    focusedScope: {
        focusedSamples: string[];
        deferredSamples: string[];
    };
    project: {
        path: string | null;
        hasAssets: boolean | null;
        hasPackagesManifest: boolean | null;
        hasProjectSettings: boolean | null;
        unityVersion: string | null;
    };
    auth: ReturnType<typeof readAuthConfig>;
    unity: {
        requestedPath: string | null;
        pathCommand: string;
        pathConfigured: boolean;
        executableExists: boolean | null;
    };
    nextActions: string[];
    security: string[];
};
declare const easyarApi: import("./easyar-api.js").EasyARApiClient;
export declare function chooseSampleExpansionOrder(targetSamples: SampleInfo[]): {
    sampleId: string;
    sampleName: string;
    reason: string;
}[];
export declare function buildSampleExpansionPlan(sample: SampleInfo, platform: typeof mobilePlatforms[number], unityVersion: string, includeOfficialApiTrack: boolean): {
    sampleId: string;
    sampleName: string;
    currentStatus: "focused" | "deferred";
    targetStatus: string;
    unityVersion: string;
    platform: "android" | "ios";
    purpose: string;
    entryCriteria: string[];
    requiredArtifacts: string[];
    validationSequence: string[];
    passCriteria: string[];
    officialApiTrack: string[];
    risks: string[];
    security: string;
};
export declare function sampleExpansionPassCriteria(sample: SampleInfo): string[];
export declare function sampleExpansionRisks(sample: SampleInfo): string[];
export declare function readAuthConfig(): import("./easyar-api.js").EasyARAuthStatus;
export declare function buildDeploymentReadiness(projectPath: string | null, unityPath?: string): Promise<DeploymentReadinessReport>;
export declare function readPackageMetadata(): Promise<{
    name: string | null;
    version: string | null;
    repository: string | null;
    binName: string | null;
    binPath: string | null;
    files: string[];
    private: boolean | null;
}>;
export declare function readFirstExistingFile(candidates: string[]): Promise<string>;
export declare function check(id: string, ok: boolean, severity: ReadinessCheck["severity"], detail: string): ReadinessCheck;
export declare function fileContains(filePath: string, needle: string): Promise<boolean>;
export declare function deploymentNextActions(blockers: ReadinessCheck[], warnings: ReadinessCheck[], auth: ReturnType<typeof readAuthConfig>, requestedUnityPath: string | null): string[];
export declare function buildProductionValidationReport(root: string | null, focusedEvidencePath: string | undefined, platform: typeof mobilePlatforms[number], unityPath: string | undefined, verificationEvidence: "not-provided" | "passed", maxScriptIssues: number, maxLogBytes: number, maxLogIssues: number): Promise<{
    generatedAt: string;
    productionReady: boolean;
    localKeyMvpReady: boolean;
    readinessModel: {
        localKeyMvp: string;
        productionOfficialApi: string;
    };
    projectPath: string | null;
    focusedEvidencePath: string | null;
    focusedEvidenceSource: string;
    platform: "android" | "ios";
    server: {
        name: string;
        version: string;
        packageName: string | null;
        repository: string | null;
    };
    scope: {
        focusedSamples: string[];
        deferredSamples: string[];
        note: string;
    };
    verificationEvidence: "passed" | "not-provided";
    gates: {
        id: string;
        title: string;
        ok: boolean;
        required: boolean;
        status: string;
        requiredEvidence: string;
        currentEvidence: string;
        nextAction: string;
    }[];
    blockers: {
        id: string;
        title: string;
        ok: boolean;
        required: boolean;
        status: string;
        requiredEvidence: string;
        currentEvidence: string;
        nextAction: string;
    }[];
    summaries: {
        deploymentReady: boolean;
        deploymentBlockerCount: number;
        releaseManifestReady: boolean;
        officialContractReady: boolean;
        officialAccess: {
            sampleId: string;
            readyForOfficialContent: boolean;
            blockerCount: number;
        }[];
        focusedScope: {
            allFocusedSamplesComplete: boolean;
            completedCount: number;
            blockedCount: number;
            failedCount: number;
            notRunCount: number;
        } | null;
    };
    requiredArtifacts: string[];
    nextActions: string[];
    security: string;
}>;
export declare function productionGate(id: string, title: string, ok: boolean, requiredEvidence: string, currentEvidence: string, nextAction: string): {
    id: string;
    title: string;
    ok: boolean;
    required: boolean;
    status: string;
    requiredEvidence: string;
    currentEvidence: string;
    nextAction: string;
};
export declare function buildAccountOnboardingReport(root: string | null, sample: SampleInfo, platform: "android" | "ios" | "standalone" | "unknown", accountStage: "unknown" | "not-registered" | "registered-not-logged-in" | "logged-in" | "has-license" | "has-cloud-credentials"): Promise<{
    generatedAt: string;
    stage: "not-registered" | "registered-not-logged-in" | "logged-in" | "has-license" | "has-cloud-credentials";
    requestedStage: "unknown" | "not-registered" | "registered-not-logged-in" | "logged-in" | "has-license" | "has-cloud-credentials";
    projectPath: string | null;
    sample: {
        id: string;
        name: string;
        implementationStatus: "focused" | "deferred";
    };
    platform: "android" | "ios" | "standalone" | "unknown";
    needsCloudRecognition: boolean;
    officialLinks: {
        website: string;
        registerAndLogin: string;
        developCenter: string;
        docsGettingStarted: string;
        apiKeyDocs: string;
        downloadsPage: string;
        downloads: string;
        samples: string;
    };
    localFiles: {
        localConfig: string | null;
        localConfigExists: boolean | null;
        localConfigValid: boolean | null;
        bundleIdentifier: string;
        cloudCredentialPresence: {
            appId: boolean;
            appKey: boolean;
            appSecret: boolean;
        } | null;
    };
    environment: {
        apiBaseUrl: string;
        apiTokenConfigured: boolean;
        accountStatusEndpointConfigured: boolean;
        licenseValidationEndpointConfigured: boolean;
        downloadsEndpointConfigured: boolean;
        cloudCredentialsEndpointConfigured: boolean;
    };
    firstRunGuide: {
        entryQuestion: string;
        designPrinciple: string;
        stageModel: {
            stage: string;
            userSituation: string;
            mcpBehavior: string;
        }[];
        routes: {
            id: string;
            active: boolean;
            answer: string;
            guide: string;
            mcpAfterUserReturns: string[];
            browserActions: string[];
            returnPrompt: string;
        }[];
        mcpConversationRules: string[];
        userProvidesToMcp: string[];
        userNeverProvidesToMcp: string[];
        localSecretHandoff: string[];
        sampleSpecific: string[];
    };
    humanSteps: {
        active: boolean;
        id: string;
        requiredWhen: string[];
        title: string;
        action: string;
        doneWhen: string;
    }[];
    mcpSteps: ({
        tool: string;
        arguments: {
            projectPath?: undefined;
            sampleId?: undefined;
            platform?: undefined;
        };
        purpose: string;
    } | {
        tool: string;
        arguments: {
            projectPath: string;
            sampleId: string;
            platform?: undefined;
        };
        purpose: string;
    } | {
        tool: string;
        arguments: {
            projectPath: string;
            sampleId?: undefined;
            platform?: undefined;
        };
        purpose: string;
    } | {
        tool: string;
        arguments: {
            projectPath: string;
            sampleId: string;
            platform: "android" | "ios" | "standalone" | "unknown";
        };
        purpose: string;
    })[];
    blockers: {
        id: string;
        detail: string;
        action: string;
    }[];
    nextActions: string[];
    security: string[];
}>;
export declare function buildFirstRunAccountGuide(stage: string, root: string | null, sample: SampleInfo, platform: "android" | "ios" | "standalone" | "unknown", needsCloudRecognition: boolean, bundleIdentifier: string): {
    entryQuestion: string;
    designPrinciple: string;
    stageModel: {
        stage: string;
        userSituation: string;
        mcpBehavior: string;
    }[];
    routes: {
        id: string;
        active: boolean;
        answer: string;
        guide: string;
        mcpAfterUserReturns: string[];
        browserActions: string[];
        returnPrompt: string;
    }[];
    mcpConversationRules: string[];
    userProvidesToMcp: string[];
    userNeverProvidesToMcp: string[];
    localSecretHandoff: string[];
    sampleSpecific: string[];
};
export declare function deriveAccountOnboardingStage(accountStage: "unknown" | "not-registered" | "registered-not-logged-in" | "logged-in" | "has-license" | "has-cloud-credentials", auth: ReturnType<typeof readAuthConfig>, localConfig: Awaited<ReturnType<typeof buildLocalConfigValidationReport>> | null, cloudConfig: Record<string, unknown>, needsCloudRecognition: boolean): "not-registered" | "registered-not-logged-in" | "logged-in" | "has-license" | "has-cloud-credentials";
export declare function buildAccountHumanSteps(stage: string, needsCloudRecognition: boolean, bundleIdentifier: string, platform: string): {
    active: boolean;
    id: string;
    requiredWhen: string[];
    title: string;
    action: string;
    doneWhen: string;
}[];
export declare function buildAccountMcpSteps(root: string | null, sample: SampleInfo, platform: "android" | "ios" | "standalone" | "unknown", needsCloudRecognition: boolean): ({
    tool: string;
    arguments: {
        projectPath?: undefined;
        sampleId?: undefined;
        platform?: undefined;
    };
    purpose: string;
} | {
    tool: string;
    arguments: {
        projectPath: string;
        sampleId: string;
        platform?: undefined;
    };
    purpose: string;
} | {
    tool: string;
    arguments: {
        projectPath: string;
        sampleId?: undefined;
        platform?: undefined;
    };
    purpose: string;
} | {
    tool: string;
    arguments: {
        projectPath: string;
        sampleId: string;
        platform: "android" | "ios" | "standalone" | "unknown";
    };
    purpose: string;
})[];
export declare function buildAccountOnboardingBlockers(stage: string, auth: ReturnType<typeof readAuthConfig>, localConfig: Awaited<ReturnType<typeof buildLocalConfigValidationReport>> | null, cloudConfig: Record<string, unknown>, needsCloudRecognition: boolean, root: string | null): {
    id: string;
    detail: string;
    action: string;
}[];
export declare function buildAccountOnboardingNextActions(stage: string, blockers: Array<{
    id: string;
    detail: string;
    action: string;
}>, root: string | null, sample: SampleInfo, platform: "android" | "ios" | "standalone" | "unknown", needsCloudRecognition: boolean): string[];
export declare function buildAccountMaterialsReport(root: string | null, sample: SampleInfo, platform: "android" | "ios" | "standalone" | "unknown"): Promise<{
    generatedAt: string;
    projectPath: string | null;
    sample: {
        id: string;
        name: string;
        implementationStatus: "focused" | "deferred";
    };
    platform: "android" | "ios" | "standalone" | "unknown";
    localConfigPath: string;
    needsCloudRecognition: boolean;
    readyForLocalConfigValidation: boolean;
    materials: ({
        id: string;
        label: string;
        required: boolean;
        present: boolean;
        source: string;
        storeIn: string;
        sharePolicy: string;
        mcpCheck: string;
        requiredForDeviceRun?: undefined;
    } | {
        id: string;
        label: string;
        required: boolean;
        requiredForDeviceRun: boolean;
        present: boolean;
        source: string;
        storeIn: string;
        sharePolicy: string;
        mcpCheck: string;
    })[];
    missingRequired: string[];
    nextActions: string[];
    security: string;
}>;
export declare function accountMaterialNextAction(item: {
    id: string;
    label: string;
    storeIn: string;
}, localConfigPath: string): string;
export declare function readOfficialOpenApiContract(): Promise<{
    openapi?: string;
    info?: {
        title?: string;
    };
    paths?: Record<string, unknown>;
}>;
export declare function buildOfficialApiContract(baseUrl: string | undefined, includeExamples: boolean): {
    generatedAt: string;
    server: {
        name: string;
        version: string;
        purpose: string;
    };
    environment: {
        baseUrl: string;
        tokenEnvName: string;
        tokenConfigured: boolean;
        required: string[];
        configured: {
            EASYAR_API_TOKEN: boolean;
            EASYAR_ACCOUNT_STATUS_ENDPOINT: boolean;
            EASYAR_LICENSE_VALIDATE_ENDPOINT: boolean;
            EASYAR_DOWNLOADS_ENDPOINT: boolean;
            EASYAR_CLOUD_CREDENTIALS_ENDPOINT: boolean;
        };
    };
    authentication: {
        scheme: string;
        header: string;
        tokenSource: string;
        tokenPolicy: string[];
    };
    endpoints: {
        expectedUrl: string;
        authorization: string;
        timeoutMs: number;
        secretHandling: string;
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
    }[];
    authorizationBoundary: {
        localKeyMvp: string;
        whyOfficialSupportIsRequired: string[];
        notAccepted: string[];
        acceptedFallback: string;
    };
    examples: ({
        endpoint: string;
        request: {
            method: string;
            url: string;
            body: {
                licenseKey: string;
                bundleIdentifier: string;
                platform: string;
                sampleId?: undefined;
            };
        };
        response: {
            ok: boolean;
            license: {
                valid: boolean;
                product: string;
                bundleIdentifierMatches: boolean;
                platformAllowed: boolean;
                features: string[];
            };
            cloudRecognition?: undefined;
        };
    } | {
        endpoint: string;
        request: {
            method: string;
            url: string;
            body: {
                sampleId: string;
                bundleIdentifier: string;
                platform: string;
                licenseKey?: undefined;
            };
        };
        response: {
            ok: boolean;
            cloudRecognition: {
                appId: string;
                apiKeyPresent: boolean;
                apiSecretPresent: boolean;
                appKeyPresent: boolean;
                appSecretPresent: boolean;
                serviceRegion: string;
            };
            license?: undefined;
        };
    })[];
    responsePolicy: string[];
    productionChecklist: string[];
    readyForProductionOfficialAccess: boolean;
    security: string;
};
export declare function officialApiEndpointContract(input: {
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
}): {
    expectedUrl: string;
    authorization: string;
    timeoutMs: number;
    secretHandling: string;
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
};
export declare function buildAuthorizationStrategyReport(root: string | null, sample: SampleInfo, platform: "android" | "ios" | "standalone" | "unknown", accountStage: AccountStage, preferredMode: AuthorizationMode): Promise<{
    generatedAt: string;
    projectPath: string | null;
    sample: {
        id: string;
        name: string;
        needsCloudRecognition: boolean;
    };
    platform: "android" | "ios" | "standalone" | "unknown";
    requestedMode: "auto" | "official-api" | "local-key" | "manual-browser" | "local-packages" | "stub";
    selectedMode: "official-api" | "local-key" | "manual-browser" | "local-packages" | "stub";
    accountStage: {
        requested: "unknown" | "not-registered" | "registered-not-logged-in" | "logged-in" | "has-license" | "has-cloud-credentials";
        derived: "not-registered" | "registered-not-logged-in" | "logged-in" | "has-license" | "has-cloud-credentials";
    };
    productionReady: boolean;
    focusedUnityRunReadyWithoutOfficialApi: boolean;
    keyModel: {
        statement: string;
        accountUse: string;
        mcpUse: string;
    };
    noBypassPolicy: {
        allowed: boolean;
        statement: string;
        forbiddenApproaches: string[];
        safeAlternatives: string[];
    };
    modes: {
        localKey: {
            ready: boolean;
            purpose: string;
            requires: string[];
            enables: string[];
            limitations: string[];
        };
        officialApi: {
            ready: boolean;
            purpose: string;
            requires: string[];
            enables: string[];
            limitations: string[];
        };
        manualBrowser: {
            ready: boolean;
            purpose: string;
            requires: string[];
            enables: string[];
            limitations: string[];
        };
        localPackages: {
            ready: boolean;
            purpose: string;
            requires: string[];
            enables: string[];
            limitations: string[];
        };
        stub: {
            ready: boolean;
            purpose: string;
            requires: string[];
            enables: string[];
            limitations: string[];
        };
    };
    recommendedToolSequence: ({
        tool: string;
        arguments: {
            projectPath?: undefined;
            sampleId?: undefined;
            platform?: undefined;
        };
    } | {
        tool: string;
        arguments: {
            projectPath: string;
            sampleId: string;
            platform: "android" | "ios" | "standalone" | "unknown";
        };
    })[] | ({
        command: string;
        tool?: undefined;
        arguments?: undefined;
    } | {
        tool: string;
        arguments: {
            workspacePath: string;
            deploymentTarget: string;
        };
        command?: undefined;
    })[] | ({
        tool: string;
        arguments: {
            projectPath: string;
            sampleId: string;
            platform: "android" | "ios" | "standalone" | "unknown";
            accountStage: string;
        };
    } | {
        tool: string;
        arguments: {
            projectPath: string;
            sampleId?: undefined;
            platform?: undefined;
            accountStage?: undefined;
        };
    } | {
        tool: string;
        arguments: {
            projectPath: string;
            sampleId: string;
            platform: "android" | "ios" | "standalone" | "unknown";
            accountStage?: undefined;
        };
    })[];
    nextActions: string[];
    security: string;
}>;
export declare function chooseAuthorizationMode(preferredMode: AuthorizationMode, officialApiReady: boolean, localKeyReady: boolean, portalReadyForKeyCollection: boolean): Exclude<AuthorizationMode, "auto">;
export declare function authorizationStrategyToolSequence(selectedMode: Exclude<AuthorizationMode, "auto">, root: string | null, sample: SampleInfo, platform: "android" | "ios" | "standalone" | "unknown"): ({
    tool: string;
    arguments: {
        projectPath?: undefined;
        sampleId?: undefined;
        platform?: undefined;
    };
} | {
    tool: string;
    arguments: {
        projectPath: string;
        sampleId: string;
        platform: "android" | "ios" | "standalone" | "unknown";
    };
})[] | ({
    command: string;
    tool?: undefined;
    arguments?: undefined;
} | {
    tool: string;
    arguments: {
        workspacePath: string;
        deploymentTarget: string;
    };
    command?: undefined;
})[] | ({
    tool: string;
    arguments: {
        projectPath: string;
        sampleId: string;
        platform: "android" | "ios" | "standalone" | "unknown";
        accountStage: string;
    };
} | {
    tool: string;
    arguments: {
        projectPath: string;
        sampleId?: undefined;
        platform?: undefined;
        accountStage?: undefined;
    };
} | {
    tool: string;
    arguments: {
        projectPath: string;
        sampleId: string;
        platform: "android" | "ios" | "standalone" | "unknown";
        accountStage?: undefined;
    };
})[];
export declare function authorizationStrategyNextActions(selectedMode: Exclude<AuthorizationMode, "auto">, root: string | null, sample: SampleInfo, platform: "android" | "ios" | "standalone" | "unknown", needsCloudRecognition: boolean, officialApiReady: boolean, localKeyReady: boolean, portalReadyForKeyCollection: boolean): string[];
export declare function buildOfficialApiHandoff(baseUrl: string | undefined, includeCurl: boolean, deploymentTarget: string | undefined): {
    generatedAt: string;
    deploymentTarget: string;
    server: {
        name: string;
        version: string;
        repository: string;
    };
    environment: {
        baseUrl: string;
        tokenEnvName: string;
        tokenConfigured: boolean;
        required: string[];
        configured: {
            EASYAR_API_TOKEN: boolean;
            EASYAR_ACCOUNT_STATUS_ENDPOINT: boolean;
            EASYAR_LICENSE_VALIDATE_ENDPOINT: boolean;
            EASYAR_DOWNLOADS_ENDPOINT: boolean;
            EASYAR_CLOUD_CREDENTIALS_ENDPOINT: boolean;
        };
    };
    whyOfficialSupportIsRequired: {
        localKeyMvp: string;
        whyOfficialSupportIsRequired: string[];
        notAccepted: string[];
        acceptedFallback: string;
    };
    endpointMapping: {
        id: string;
        envName: string;
        method: "GET" | "POST";
        expectedUrl: string;
        purpose: string;
        backendOwnerTodo: string;
        requestFields: string[];
        requiredResponseFields: string[];
        usedByTools: string[];
        canaryCommand: string | null;
        acceptance: string[];
    }[];
    rollout: string[];
    acceptanceGates: string[];
    failurePolicy: string[];
    artifactsToRegenerate: string[];
    nextActions: string[];
    security: string;
};
export declare function officialApiBackendTodo(endpointId: string): string;
export declare function officialApiEndpointAcceptance(endpointId: string): string[];
export declare function officialApiCanaryCommand(endpoint: ReturnType<typeof officialApiEndpointContract>): string;
export declare function buildOfficialApiContractExamples(baseUrl: string): ({
    endpoint: string;
    request: {
        method: string;
        url: string;
        body: {
            licenseKey: string;
            bundleIdentifier: string;
            platform: string;
            sampleId?: undefined;
        };
    };
    response: {
        ok: boolean;
        license: {
            valid: boolean;
            product: string;
            bundleIdentifierMatches: boolean;
            platformAllowed: boolean;
            features: string[];
        };
        cloudRecognition?: undefined;
    };
} | {
    endpoint: string;
    request: {
        method: string;
        url: string;
        body: {
            sampleId: string;
            bundleIdentifier: string;
            platform: string;
            licenseKey?: undefined;
        };
    };
    response: {
        ok: boolean;
        cloudRecognition: {
            appId: string;
            apiKeyPresent: boolean;
            apiSecretPresent: boolean;
            appKeyPresent: boolean;
            appSecretPresent: boolean;
            serviceRegion: string;
        };
        license?: undefined;
    };
})[];
export declare function buildOfficialAccessReport(root: string | null, sample: SampleInfo, platform: "android" | "ios" | "standalone" | "unknown", packageKind: "unity-plugin" | "unity-samples" | "native-sdk" | "xr-extension" | "unknown"): Promise<{
    generatedAt: string;
    projectPath: string | null;
    sample: {
        id: string;
        name: string;
        implementationStatus: "focused" | "deferred";
    };
    platform: "android" | "ios" | "standalone" | "unknown";
    packageKind: "unknown" | "unity-samples" | "unity-plugin" | "native-sdk" | "xr-extension";
    unityVersion: string | null;
    input: {
        hasLicenseKey: boolean;
        bundleIdentifier: string | null;
        source: string;
    };
    auth: {
        apiBaseUrl: string;
        hasToken: boolean;
        accountStatusEndpointConfigured: boolean;
        licenseValidationEndpointConfigured: boolean;
        downloadsEndpointConfigured: boolean;
        cloudCredentialsEndpointConfigured: boolean;
    };
    readyForOfficialContent: boolean;
    checks: {
        id: string;
        ok: boolean;
        required: boolean;
        configured: boolean;
        statusCode: number | null;
        summary: string;
        detail: string;
        nextActions: string[];
    }[];
    blockers: {
        id: string;
        ok: boolean;
        required: boolean;
        configured: boolean;
        statusCode: number | null;
        summary: string;
        detail: string;
        nextActions: string[];
    }[];
    remoteResults: {
        account: import("./easyar-api.js").EasyARRemoteCheckResult;
        license: import("./easyar-api.js").EasyARRemoteCheckResult;
        downloads: import("./easyar-api.js").EasyARRemoteCheckResult;
        cloudCredentials: import("./easyar-api.js").EasyARRemoteCheckResult | null;
    };
    nextActions: string[];
    security: string;
}>;
export declare function readRemoteValidationConfigFromEnv(sample: SampleInfo): {
    licenseKey?: string;
    bundleIdentifier?: string;
};
export declare function officialAccessCheck(id: string, ok: boolean, required: boolean, summary: string, detail: string): {
    id: string;
    ok: boolean;
    required: boolean;
    configured: boolean;
    statusCode: number | null;
    summary: string;
    detail: string;
    nextActions: string[];
};
export declare function officialAccessRemoteCheck(id: string, required: boolean, result: Awaited<ReturnType<typeof easyarApi.checkAccount>>): {
    id: string;
    ok: boolean;
    required: boolean;
    configured: boolean;
    statusCode: number | null;
    summary: string;
    detail: string;
    nextActions: string[];
};
export declare function buildPortalEvidenceReport(input: {
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
}): Promise<{
    generatedAt: string;
    projectPath: string | null;
    sample: {
        id: string;
        name: string;
    };
    platform: "android" | "ios" | "standalone" | "unknown";
    portal: {
        accountName: string | null;
        portalUrl: string | null;
        apiKeyRecordId: string | null;
        apiKeyAppName: string | null;
        apiKeyCreatedAt: string | null;
        cloudServicesEnabled: ("cloud-recognition" | "spatialmap" | "mega-landmark" | "ar-operations" | "mega-block" | "other")[];
        apiKeyPresent: boolean | null;
        apiSecretPresent: boolean | null;
        tokenStatus: "unknown" | "missing" | "not-checked" | "not-needed" | "present" | "expired";
        senseLicenseStatus: "unknown" | "missing" | "not-checked" | "present";
        senseLicenseRecordId: string | null;
        cloudLibraryStatus: "unknown" | "missing" | "not-checked" | "present";
        cloudLibraryName: string | null;
        cloudLibraryRecordId: string | null;
        cloudTargetCount: number | null;
    };
    localConfig: {
        path: string;
        valid: boolean;
        licenseKeyPresent: boolean;
        bundleIdentifier: string | null;
        cloudRecognition: {
            appIdPresent: boolean;
            apiKeyPresent: boolean;
            apiSecretPresent: boolean;
            appKeyPresent: boolean;
            appSecretPresent: boolean;
        };
    } | null;
    readyForLocalConfig: boolean;
    readyForCloudDeviceValidation: boolean;
    blockers: {
        id: string;
        ok: boolean;
        detail: string;
        action: string;
    }[];
    notes: string[];
    nextActions: string[];
    security: string;
}>;
export declare function portalEvidenceBlocker(id: string, ok: boolean, detail: string, action: string): {
    id: string;
    ok: boolean;
    detail: string;
    action: string;
};
export declare function sanitizePortalText(value: string | undefined): string | null;
export declare function sanitizePortalId(value: string | undefined): string | null;
export declare function sanitizePortalUrl(value: string | undefined): string | null;
export declare function looksLikeStandaloneSecret(value: string): boolean;
export declare function buildClientSetupReport(client: typeof clientKinds[number], entrypointMode: typeof clientEntrypointModes[number], serverPath: string | undefined, includeTokenPlaceholder: boolean): Promise<{
    generatedAt: string;
    client: "claude-desktop" | "codex" | "generic-json";
    entrypointMode: "local-dist" | "package-bin" | "npx";
    command: string;
    args: string[];
    serverPath: string | null;
    package: {
        name: string | null;
        version: string | null;
        binName: string | null;
        repository: string | null;
    };
    node: {
        version: string;
        required: string;
    };
    readyForClientConnection: boolean;
    checks: {
        id: string;
        ok: boolean;
        required: boolean;
        detail: string;
    }[];
    blockers: {
        id: string;
        ok: boolean;
        required: boolean;
        detail: string;
    }[];
    warnings: {
        id: string;
        ok: boolean;
        required: boolean;
        detail: string;
    }[];
    env: {
        apiBaseUrl: string;
        hasTokenPlaceholder: boolean;
        accountStatusEndpointConfigured: boolean;
        licenseValidationEndpointConfigured: boolean;
        downloadsEndpointConfigured: boolean;
        cloudCredentialsEndpointConfigured: boolean;
    };
    config: {
        mcpServers: {
            easyar: {
                command: string;
                args: string[];
                env: Record<string, string>;
            };
        };
        name?: undefined;
        transport?: undefined;
        command?: undefined;
        args?: undefined;
        env?: undefined;
    } | {
        name: string;
        transport: string;
        command: string;
        args: string[];
        env: Record<string, string>;
        mcpServers?: undefined;
    };
    configDestination: string;
    acceptanceChecklist: string[];
    firstSmokeCalls: string[];
    troubleshooting: string[];
    nextActions: string[];
    security: string;
}>;
export declare function clientConfigDestination(client: typeof clientKinds[number]): string;
export declare function buildClientAcceptanceChecklist(client: typeof clientKinds[number], entrypointMode: typeof clientEntrypointModes[number]): string[];
export declare function buildClientFirstSmokeCalls(): string[];
export declare function buildClientTroubleshooting(client: typeof clientKinds[number], entrypointMode: typeof clientEntrypointModes[number]): string[];
export declare function clientSetupCheck(id: string, ok: boolean, required: boolean, detail: string): {
    id: string;
    ok: boolean;
    required: boolean;
    detail: string;
};
export declare function clientSetupAction(id: string): string;
export declare function buildReleaseManifest(): Promise<{
    generatedAt: string;
    package: {
        name: string | null;
        version: string | null;
        description: string | null;
        binName: string;
        repository: string | null;
        homepage: string;
        node: string;
        keywords: string[];
    };
    focusedScope: {
        focusedSamples: string[];
        deferredSamples: string[];
    };
    readinessModel: {
        localKeyMvp: string;
        productionOfficialApi: string;
        unityRuntime: string;
    };
    releaseWorkflows: {
        id: string;
        workflow: string;
        gate: string;
        purpose: string;
    }[];
    installCommands: string[];
    installProfiles: {
        id: string;
        label: string;
        commands: string[];
        entrypointMode: string;
        availability: string;
        clientConfigCall: string;
    }[];
    verificationCommands: string[];
    publishedAssetVerification: string[];
    mcpEntrypoints: {
        label: string;
        command: string;
        args: string[];
    }[];
    clientSetupTools: string[];
    requiredEnvironment: string[];
    validationEnvironment: string[];
    firstCalls: string[];
    files: {
        path: string;
        exists: boolean;
    }[];
    packageFiles: string[];
    scripts: Record<string, string>;
    readyForInstallDocs: boolean;
    missingRequiredFiles: string[];
    nextActions: string[];
    security: string;
}>;
export declare function buildOnboardingReport(input: {
    root: string;
    sample: SampleInfo;
    client: typeof clientKinds[number];
    entrypointMode: typeof clientEntrypointModes[number];
    platform: typeof mobilePlatforms[number];
    serverPath?: string;
    outputPath: string;
    maxScriptIssues: number;
}): Promise<{
    generatedAt: string;
    projectPath: string;
    sample: {
        id: string;
        name: string;
        implementationStatus: "focused" | "deferred";
    };
    client: "claude-desktop" | "codex" | "generic-json";
    platform: "android" | "ios";
    outputPath: string;
    readyForFirstRun: boolean;
    blockers: {
        area: string;
        id: string;
        detail: string;
    }[];
    nextCall: {
        tool: string;
        arguments: Record<string, unknown>;
    };
    summary: {
        releaseReady: boolean;
        clientReady: boolean;
        officialAccessReady: boolean;
        workflowPhase: string;
        workflowBlocked: boolean;
        focusedSamples: string[];
    };
    firstCalls: string[];
    clientSetup: {
        entrypointMode: "local-dist" | "package-bin" | "npx";
        serverPath: string | null;
        command: string;
        args: string[];
        warnings: string[];
    };
    officialAccess: {
        checks: {
            id: string;
            ok: boolean;
            configured: boolean;
            statusCode: number | null;
        }[];
    };
    workflow: {
        phase: string;
        blocked: boolean;
        reason: string;
        nextActions: string[];
        missingArtifacts: string[];
    };
    nextActions: string[];
    security: string;
}>;
export declare function buildFirstRunGuide(input: {
    root: string | null;
    sample: SampleInfo;
    platform: typeof mobilePlatforms[number];
    accountStage: AccountStage;
    client: typeof clientKinds[number];
}): Promise<{
    generatedAt: string;
    projectPath: string | null;
    client: "claude-desktop" | "codex" | "generic-json";
    platform: "android" | "ios";
    firstQuestion: string;
    readyForUnityAutomation: boolean;
    topNextCall: {
        tool: string;
        arguments: {
            projectPath: string;
            accountStage: "unknown" | "not-registered" | "registered-not-logged-in" | "logged-in" | "has-license" | "has-cloud-credentials";
            sampleId: string;
            platform: "android" | "ios";
        };
    } | {
        tool: string;
        arguments: {
            projectPath: string;
            platform: "android" | "ios";
            accountStage?: undefined;
            sampleId?: undefined;
        };
    };
    focusedScope: {
        activeSamples: string[];
        deferredSamples: string[];
        note: string;
    };
    sample: {
        id: string;
        name: string;
        needsCloudRecognition: boolean;
    };
    account: {
        requestedStage: "unknown" | "not-registered" | "registered-not-logged-in" | "logged-in" | "has-license" | "has-cloud-credentials";
        stage: "not-registered" | "registered-not-logged-in" | "logged-in" | "has-license" | "has-cloud-credentials";
        browserRoute: {
            id: string;
            active: boolean;
            answer: string;
            guide: string;
            mcpAfterUserReturns: string[];
            browserActions: string[];
            returnPrompt: string;
        };
        officialLinks: {
            website: string;
            registerAndLogin: string;
            developCenter: string;
            docsGettingStarted: string;
            apiKeyDocs: string;
            downloadsPage: string;
            downloads: string;
            samples: string;
        };
    };
    accountMaterials: {
        readyForLocalConfigValidation: boolean;
        missingRequired: string[];
        materials: {
            label: string;
            required: boolean;
            present: boolean;
            source: string;
            storeIn: string;
            sharePolicy: string;
        }[];
    };
    localConfig: {
        valid: boolean;
        configPath: string;
        failedChecks: string[];
    };
    firstCalls: string[];
    artifactOrder: string[];
    blockers: {
        id: string;
        detail: string;
        action: string;
    }[];
    nextActions: string[];
    security: string[];
}>;
export declare function firstRunTopNextCall(root: string | null, sample: SampleInfo, platform: typeof mobilePlatforms[number], accountStage: AccountStage, localConfigValid: boolean, missingMaterials: string[]): {
    tool: string;
    arguments: {
        projectPath: string;
        accountStage: "unknown" | "not-registered" | "registered-not-logged-in" | "logged-in" | "has-license" | "has-cloud-credentials";
        sampleId: string;
        platform: "android" | "ios";
    };
} | {
    tool: string;
    arguments: {
        projectPath: string;
        platform: "android" | "ios";
        accountStage?: undefined;
        sampleId?: undefined;
    };
};
export declare function buildProjectHandoff(input: {
    root: string;
    platform: typeof mobilePlatforms[number];
    client: typeof clientKinds[number];
    entrypointMode: typeof clientEntrypointModes[number];
    serverPath?: string;
    maxScriptIssues: number;
    maxLogBytes: number;
    maxLogIssues: number;
}): Promise<{
    generatedAt: string;
    projectPath: string;
    platform: "android" | "ios";
    client: "claude-desktop" | "codex" | "generic-json";
    entrypointMode: "local-dist" | "package-bin" | "npx";
    readyForContinuation: boolean;
    topNextCall: {
        tool: string;
        arguments: Record<string, unknown>;
    };
    clientSetup: {
        readyForClientConnection: boolean;
        command: string;
        args: string[];
        configDestination: string;
        warningCount: number;
    };
    account: {
        readyForLocalConfigValidation: boolean;
        missingRequired: string[];
    };
    localConfig: {
        valid: boolean;
        configPath: string;
        failedChecks: string[];
    };
    unity: {
        readyForUnityBatch: boolean;
        recommendedUnityPath: string | null;
        unityVersion: string | null;
    };
    focusedScope: {
        allFocusedSamplesComplete: boolean;
        completedCount: number;
        blockedCount: number;
        failedCount: number;
        notRunCount: number;
    };
    workflows: {
        sampleId: string;
        sampleName: string;
        phase: string;
        blocked: boolean;
        reason: string;
        nextCall: {
            tool: string;
            arguments: Record<string, unknown>;
        };
        missingArtifacts: string[];
        nextActions: string[];
    }[];
    artifacts: {
        projectHandoff: string;
        accountOnboarding: string;
        localConfigHandoff: string;
        unityEnvironment: string;
        focusedScopeStatus: string;
    };
    blockers: {
        id: string;
        detail: string;
        action: string;
    }[];
    nextActions: string[];
    security: string;
}>;
export declare function buildRemainingWorkReport(input: {
    root: string | null;
    platform: typeof mobilePlatforms[number];
    verificationEvidence: "not-provided" | "passed";
    maxScriptIssues: number;
    maxLogBytes: number;
    maxLogIssues: number;
}): Promise<{
    generatedAt: string;
    projectPath: string | null;
    platform: "android" | "ios";
    productionReady: boolean;
    localKeyMvpReady: boolean;
    verificationEvidence: "passed" | "not-provided";
    overall: {
        percent: number;
        remainingPercent: number;
        earnedWeight: number;
        totalWeight: number;
        note: string;
    };
    localKeyMvp: {
        percent: number;
        remainingPercent: number;
        earnedWeight: number;
        totalWeight: number;
        ready: boolean;
        note: string;
    };
    focusedScope: {
        allFocusedSamplesComplete: boolean;
        completedCount: number;
        blockedCount: number;
        failedCount: number;
        notRunCount: number;
    };
    categories: {
        id: string;
        title: string;
        weight: number;
        earnedWeight: number;
        remainingWeight: number;
        percent: number;
        done: boolean;
        passedCount: number;
        checkCount: number;
        checks: {
            id: string;
            ok: boolean;
            evidence: string;
            nextAction: string;
        }[];
        nextActions: string[];
    }[];
    productionBlockers: {
        id: string;
        title: string;
        currentEvidence: string;
        nextAction: string;
    }[];
    topRemainingAreas: {
        id: string;
        title: string;
        remainingWeight: number;
        firstNextAction: string;
    }[];
    nextActions: string[];
    security: string;
}>;
export declare function remainingCheck(id: string, ok: boolean, evidence: string, nextAction: string): {
    id: string;
    ok: boolean;
    evidence: string;
    nextAction: string;
};
export declare function remainingCategory(input: {
    id: string;
    title: string;
    weight: number;
    checks: ReturnType<typeof remainingCheck>[];
}): {
    id: string;
    title: string;
    weight: number;
    earnedWeight: number;
    remainingWeight: number;
    percent: number;
    done: boolean;
    passedCount: number;
    checkCount: number;
    checks: {
        id: string;
        ok: boolean;
        evidence: string;
        nextAction: string;
    }[];
    nextActions: string[];
};
export declare function buildClientLaunch(entrypointMode: typeof clientEntrypointModes[number], serverPath: string | undefined): {
    mode: "package-bin";
    command: string;
    args: string[];
    entrypoint: string | null;
} | {
    mode: "npx";
    command: string;
    args: string[];
    entrypoint: string | null;
} | {
    mode: "local-dist";
    command: string;
    args: string[];
    entrypoint: string;
};
export declare function buildClientConfig(client: typeof clientKinds[number], launch: ReturnType<typeof buildClientLaunch>, env: Record<string, string>): {
    mcpServers: {
        easyar: {
            command: string;
            args: string[];
            env: Record<string, string>;
        };
    };
    name?: undefined;
    transport?: undefined;
    command?: undefined;
    args?: undefined;
    env?: undefined;
} | {
    name: string;
    transport: string;
    command: string;
    args: string[];
    env: Record<string, string>;
    mcpServers?: undefined;
};
export declare function buildFocusedRunSequence(input: {
    projectPath: string;
    sample: SampleInfo;
    platform: typeof mobilePlatforms[number];
    outputPath: string;
    developmentBuild: boolean;
}): {
    sample: {
        id: string;
        name: string;
        implementationStatus: "focused" | "deferred";
    };
    supportedNow: boolean;
    projectPath: string;
    platform: "android" | "ios";
    outputPath: string;
    developmentBuild: boolean;
    phases: ({
        name: string;
        steps: ({
            step: string;
            tool: string;
            arguments: {
                projectPath: string;
                sampleId?: undefined;
            };
            expected: string;
        } | {
            step: string;
            tool: string;
            arguments: {
                projectPath: string;
                sampleId: string;
            };
            expected: string;
        })[];
    } | {
        name: string;
        steps: ({
            step: string;
            tool: string;
            arguments: {
                projectPath: string;
                sampleId?: undefined;
            };
            expected: string;
            requiredBeforeDeviceRun: boolean;
        } | {
            step: string;
            tool: string;
            arguments: {
                projectPath: string;
                sampleId: string;
            };
            expected: string;
            requiredBeforeDeviceRun: boolean;
        } | {
            step: string;
            tool: string;
            arguments: {
                projectPath: string;
                sampleId: string;
                overwrite: boolean;
            };
            expected: string;
        } | {
            step: string;
            tool: string;
            arguments: {
                projectPath: string;
                sampleId?: undefined;
                overwrite?: undefined;
            };
            expected: string;
        })[];
    } | {
        name: string;
        steps: ({
            step: string;
            tool: string;
            arguments: {
                projectPath: string;
                sampleId: string;
                platform: "android" | "ios";
                logPath: string;
                overwrite?: undefined;
                executeMethod?: undefined;
            };
            expected: string;
        } | {
            step: string;
            tool: string;
            arguments: {
                projectPath: string;
                sampleId: string;
                platform: "android" | "ios";
                overwrite: boolean;
                logPath?: undefined;
                executeMethod?: undefined;
            };
            expected: string;
        } | {
            step: string;
            tool: string;
            arguments: {
                projectPath: string;
                executeMethod: string;
                sampleId: string;
                platform: "android" | "ios";
                logPath: string;
                overwrite?: undefined;
            };
            expected: string;
        })[];
    } | {
        name: string;
        steps: ({
            step: string;
            tool: string;
            arguments: {
                projectPath: string;
                platform: "android" | "ios";
                outputPath: string;
                developmentBuild: boolean;
                overwrite: boolean;
                sampleId?: undefined;
                buildOutputPath?: undefined;
                executeMethod?: undefined;
                logPath?: undefined;
                timeoutSeconds?: undefined;
            };
            expected: string;
        } | {
            step: string;
            tool: string;
            arguments: {
                projectPath: string;
                sampleId: string;
                platform: "android" | "ios";
                buildOutputPath: string;
                overwrite: boolean;
                outputPath?: undefined;
                developmentBuild?: undefined;
                executeMethod?: undefined;
                logPath?: undefined;
                timeoutSeconds?: undefined;
            };
            expected: string;
        } | {
            step: string;
            tool: string;
            arguments: {
                projectPath: string;
                executeMethod: string;
                sampleId: string;
                platform: "android" | "ios";
                logPath: string;
                timeoutSeconds: number;
                outputPath?: undefined;
                developmentBuild?: undefined;
                overwrite?: undefined;
                buildOutputPath?: undefined;
            };
            expected: string;
        } | {
            step: string;
            tool: string;
            arguments: {
                projectPath: string;
                sampleId: string;
                platform?: undefined;
                outputPath?: undefined;
                developmentBuild?: undefined;
                overwrite?: undefined;
                buildOutputPath?: undefined;
                executeMethod?: undefined;
                logPath?: undefined;
                timeoutSeconds?: undefined;
            };
            expected: string;
        })[];
    })[];
    stopConditions: string[];
    security: string;
};
export declare function buildWorkflowState(root: string, sample: SampleInfo, platform: typeof mobilePlatforms[number], outputPath: string, maxScriptIssues: number): Promise<{
    generatedAt: string;
    projectPath: string;
    sample: {
        id: string;
        name: string;
        implementationStatus: "focused" | "deferred";
    };
    platform: "android" | "ios";
    outputPath: string;
    generatedDir: string;
    phase: string;
    blocked: boolean;
    reason: string;
    nextCall: {
        tool: string;
        arguments: Record<string, unknown>;
    };
    summary: {
        importReady: boolean;
        officialAccessReady: boolean;
        officialAccessBlockers: string[];
        missingRequiredImportItems: string[];
        readinessReady: boolean;
        failingReadinessChecks: string[];
        configValid: boolean;
        failingConfigChecks: string[];
        sceneReady: boolean;
        sceneBlockers: string[];
        scriptIssueCount: number;
        deviceReady: boolean;
        deviceBlockers: string[];
        missingArtifacts: string[];
    };
    recommendedSequence: {
        tool: string;
        arguments: Record<string, unknown>;
    }[];
    nextActions: string[];
    security: string;
}>;
export declare function chooseWorkflowNextState(input: {
    root: string;
    sample: SampleInfo;
    platform: typeof mobilePlatforms[number];
    outputPath: string;
    importReady: boolean;
    officialAccessReady: boolean;
    officialAccessBlockers: string[];
    missingRequiredImportItems: string[];
    readinessReady: boolean;
    failingReadinessChecks: string[];
    configValid: boolean;
    failingConfigChecks: string[];
    sceneReady: boolean;
    sceneBlockers: string[];
    scriptIssueCount: number;
    deviceReady: boolean;
    deviceBlockers: string[];
    missingArtifacts: string[];
    generatedHelpersMissing: boolean;
}): {
    phase: string;
    blocked: boolean;
    reason: string;
    nextCall: {
        tool: string;
        arguments: Record<string, unknown>;
    };
    nextActions: string[];
    recommendedSequence: {
        tool: string;
        arguments: Record<string, unknown>;
    }[];
};
export declare function workflowDecision(phase: string, blocked: boolean, reason: string, nextCall: {
    tool: string;
    arguments: Record<string, unknown>;
}, nextActions: string[], recommendedSequence?: Array<{
    tool: string;
    arguments: Record<string, unknown>;
}>): {
    phase: string;
    blocked: boolean;
    reason: string;
    nextCall: {
        tool: string;
        arguments: Record<string, unknown>;
    };
    nextActions: string[];
    recommendedSequence: {
        tool: string;
        arguments: Record<string, unknown>;
    }[];
};
export declare function buildImportChecklistAction(importChecklist: Awaited<ReturnType<typeof buildImportChecklist>>): string;
export declare function preflightCheck(id: string, ok: boolean, area: string, detail: string, action: string): {
    id: string;
    ok: boolean;
    area: string;
    detail: string;
    action: string;
};
export declare function preflightNextCall(blocker: ReturnType<typeof preflightCheck>, root: string, sample: SampleInfo, platform: typeof mobilePlatforms[number]): {
    tool: string;
    arguments: {
        projectPath: string;
        sampleId: string;
        platform: "android" | "ios";
    };
} | {
    tool: string;
    arguments: {
        projectPath: string;
        sampleId?: undefined;
        platform?: undefined;
    };
} | {
    tool: string;
    arguments: {
        projectPath: string;
        sampleId: string;
        platform?: undefined;
    };
};
export declare function buildCodePlan(root: string, sample: SampleInfo, goal: string, targetFiles: string[], maxScriptIssues: number): Promise<{
    generatedAt: string;
    projectPath: string;
    sample: {
        id: string;
        name: string;
        implementationStatus: "focused" | "deferred";
    };
    goal: string;
    targetFiles: string[];
    suggestedTemplate: {
        tool: string;
        arguments: {
            projectPath: string;
            relativePath: string;
            className: string;
            kind: string;
        };
    };
    readinessSummary: {
        ready: boolean;
        failingChecks: string[];
    };
    scriptReviewSummary: {
        reviewedFileCount: number;
        issueCount: number;
        issues: ScriptReviewIssue[];
    };
    implementationSteps: string[];
    riskChecks: string[];
    verificationCalls: ({
        tool: string;
        arguments: {
            projectPath: string;
            sampleId?: undefined;
            platform?: undefined;
            logPath?: undefined;
            overallStatus?: undefined;
            steps?: undefined;
        };
        purpose: string;
    } | {
        tool: string;
        arguments: {
            projectPath: string;
            sampleId: string;
            platform: string;
            logPath: string;
            overallStatus?: undefined;
            steps?: undefined;
        };
        purpose: string;
    } | {
        tool: string;
        arguments: {
            projectPath: string;
            sampleId: string;
            platform: string;
            logPath?: undefined;
            overallStatus?: undefined;
            steps?: undefined;
        };
        purpose: string;
    } | {
        tool: string;
        arguments: {
            projectPath: string;
            sampleId: string;
            platform: string;
            overallStatus: string;
            steps: never[];
            logPath?: undefined;
        };
        purpose: string;
    })[];
    verificationSteps: string[];
    nextActions: string[];
    security: string;
}>;
export declare function buildCodeChangeSummary(root: string, sample: SampleInfo, goal: string, targetFiles: string[], notes: string | undefined, maxIssues: number): Promise<{
    generatedAt: string;
    projectPath: string;
    sample: {
        id: string;
        name: string;
        implementationStatus: "focused" | "deferred";
    };
    goal: string;
    notes: string | null;
    targetFiles: string[];
    fileSummaries: ({
        path: string;
        exists: boolean;
        sizeBytes: null;
        lineCount: null;
        mentionsEasyAR: boolean;
        mentionsMonoBehaviour: boolean;
    } | {
        path: string;
        exists: boolean;
        sizeBytes: number;
        lineCount: number;
        mentionsEasyAR: boolean;
        mentionsMonoBehaviour: boolean;
    })[];
    scriptReview: {
        projectPath: string;
        reviewedFiles: string[];
        reviewedFileCount: number;
        issueCount: number;
        issues: ScriptReviewIssue[];
        nextActions: string[];
        note: string;
    };
    missingFiles: string[];
    nextActions: string[];
    security: string;
}>;
export declare function buildProgrammingContext(root: string, sample: SampleInfo, goal: string | undefined, maxFiles: number, maxIssues: number): Promise<{
    generatedAt: string;
    projectPath: string;
    sample: {
        id: string;
        name: string;
        implementationStatus: "focused" | "deferred";
    };
    goal: string | null;
    scriptInventory: {
        totalScripts: number;
        easyarScripts: {
            path: string;
            generated: boolean;
            mentionsEasyAR: boolean;
            mentionsMonoBehaviour: boolean;
            lineCount: number;
            sizeBytes: number;
        }[];
        monoBehaviours: {
            path: string;
            generated: boolean;
            mentionsEasyAR: boolean;
            mentionsMonoBehaviour: boolean;
            lineCount: number;
            sizeBytes: number;
        }[];
        generatedHelpers: {
            path: string;
            generated: boolean;
            mentionsEasyAR: boolean;
            mentionsMonoBehaviour: boolean;
            lineCount: number;
            sizeBytes: number;
        }[];
        scripts: {
            path: string;
            generated: boolean;
            mentionsEasyAR: boolean;
            mentionsMonoBehaviour: boolean;
            lineCount: number;
            sizeBytes: number;
        }[];
    };
    readinessSummary: {
        ready: boolean;
        failingChecks: string[];
    };
    scriptReview: {
        reviewedFileCount: number;
        issueCount: number;
        issues: ScriptReviewIssue[];
    };
    recommendedWorkflow: string[];
    suggestedTemplate: {
        tool: string;
        arguments: {
            projectPath: string;
            relativePath: string;
            className: string;
            kind: string;
        };
    };
    relatedArtifacts: {
        preflight: string;
        configIntegration: string;
        codePlan: string;
        codeChange: string;
        programmingContext: string;
    };
    nextActions: string[];
    security: string;
}>;
export declare function buildConfigIntegrationAudit(root: string, sample: SampleInfo, maxFiles: number, maxCandidates: number): Promise<{
    generatedAt: string;
    projectPath: string;
    sample: {
        id: string;
        name: string;
        implementationStatus: "focused" | "deferred";
    };
    readyForConfigIntegration: boolean;
    localConfig: {
        valid: boolean;
        configPath: string;
        failedChecks: string[];
    };
    readinessSummary: {
        ready: boolean;
        failingChecks: string[];
    };
    scanSummary: {
        scriptFilesScanned: number;
        assetFilesScanned: number;
        consumerCandidateCount: number;
        generatedHelperCount: number;
    };
    detectedCapabilities: {
        hasLocalConfigReader: boolean;
        hasLicenseConsumer: boolean;
        hasCloudConsumer: boolean;
        needsCloudRecognition: boolean;
    };
    consumerCandidates: {
        path: string;
        kind: "script" | "asset";
        generated: boolean;
        signals: string[];
        redactedSnippets: string[];
    }[];
    blockers: {
        id: string;
        detail: string;
        action: string;
    }[];
    nextActions: string[];
    security: string;
}>;
export declare function scanConfigIntegrationFiles(root: string, relativePaths: string[], kind: "script" | "asset", maxCandidates: number): Promise<{
    path: string;
    kind: "script" | "asset";
    generated: boolean;
    signals: string[];
    redactedSnippets: string[];
}[]>;
export declare function configIntegrationSignals(text: string): string[];
export declare function redactedConfigSnippets(text: string): string[];
export declare function scoreConfigCandidate(candidate: {
    generated: boolean;
    signals: string[];
}, sample: SampleInfo): number;
export declare function buildCodeChangeNextActions(sample: SampleInfo, issueCount: number, missingFiles: string[]): string[];
export declare function normalizeProjectRelativePath(root: string, relativePath: string): string;
export declare function buildCodePlanImplementationSteps(sample: SampleInfo, primaryFile: string, className: string, kind: typeof monoBehaviourKinds[number]): string[];
export declare function buildCodePlanVerificationCalls(root: string, sample: SampleInfo): ({
    tool: string;
    arguments: {
        projectPath: string;
        sampleId?: undefined;
        platform?: undefined;
        logPath?: undefined;
        overallStatus?: undefined;
        steps?: undefined;
    };
    purpose: string;
} | {
    tool: string;
    arguments: {
        projectPath: string;
        sampleId: string;
        platform: string;
        logPath: string;
        overallStatus?: undefined;
        steps?: undefined;
    };
    purpose: string;
} | {
    tool: string;
    arguments: {
        projectPath: string;
        sampleId: string;
        platform: string;
        logPath?: undefined;
        overallStatus?: undefined;
        steps?: undefined;
    };
    purpose: string;
} | {
    tool: string;
    arguments: {
        projectPath: string;
        sampleId: string;
        platform: string;
        overallStatus: string;
        steps: never[];
        logPath?: undefined;
    };
    purpose: string;
})[];
export declare function buildLatestLogDiagnostic(root: string, sample: SampleInfo, maxLogBytes: number, maxLogIssues: number): Promise<{
    analyzed: boolean;
    logPath: null;
    logSizeBytes: null;
    logModifiedAt: null;
    summary: null;
    issueCount: number;
    issues: never[];
    candidates: UnityLogCandidate[];
    nextActions: string[];
    bytesRead?: undefined;
} | {
    analyzed: boolean;
    logPath: string;
    logSizeBytes: number | null;
    logModifiedAt: string | null;
    bytesRead: number;
    summary: {
        totalLines: number;
        errorLines: number;
        warningLines: number;
        mentionsEasyAR: boolean;
        mentionsAndroid: boolean;
        mentionsIOS: boolean;
    };
    issueCount: number;
    issues: {
        id: string;
        severity: "high" | "medium" | "low";
        title: string;
        evidence: string[];
        actions: string[];
    }[];
    candidates: UnityLogCandidate[];
    nextActions: string[];
}>;
export declare function buildLocalConfigForm(root: string, sample: SampleInfo, platform: "android" | "ios" | "standalone", accountStage: AccountStage, bundleIdentifierInput?: string): Promise<{
    generatedAt: string;
    projectPath: string;
    sample: {
        id: string;
        name: string;
        implementationStatus: "focused" | "deferred";
    };
    platform: "android" | "ios" | "standalone";
    accountStage: "not-registered" | "registered-not-logged-in" | "logged-in" | "has-license" | "has-cloud-credentials";
    configPath: string;
    examplePath: string;
    localConfig: {
        exists: boolean;
        valid: boolean;
        failedChecks: string[];
    };
    readyToValidate: boolean;
    fields: {
        id: string;
        jsonPath: string;
        label: string;
        required: boolean;
        present: boolean;
        source: string;
        envNames: string[];
        placeholder: string;
        sharePolicy: string;
        userAction: string;
    }[];
    missingRequiredFields: string[];
    jsonSkeleton: {
        sampleId: string;
        sampleName: string;
        easyar: {
            apiBaseUrl: string;
            accountToken: string;
            licenseKey: string;
            cloudRecognition: {
                appId: string;
                serverAddress: string;
                apiKey: string;
                apiSecret: string;
                appKey: string;
                appSecret: string;
            };
        };
        unity: {
            targetPlatform: "android" | "ios" | "standalone";
            bundleIdentifier: string;
            notes: string[];
        };
    };
    envBackedWrite: {
        tool: string;
        arguments: {
            projectPath: string;
            sampleId: string;
            targetPlatform: "android" | "ios" | "standalone";
            bundleIdentifier: string;
        };
        requiredEnvNames: string[];
    };
    validationChain: string[];
    nextActions: string[];
    security: string;
}>;
export declare function localConfigFormField(input: {
    id: string;
    jsonPath: string;
    label: string;
    required: boolean;
    present: boolean;
    source: string;
    envNames: string[];
    placeholder: string;
    sharePolicy: string;
    userAction: string;
}): {
    id: string;
    jsonPath: string;
    label: string;
    required: boolean;
    present: boolean;
    source: string;
    envNames: string[];
    placeholder: string;
    sharePolicy: string;
    userAction: string;
};
export declare function buildLocalConfigHandoffReport(root: string, sample: SampleInfo, platform: "android" | "ios" | "standalone", accountStage: AccountStage): Promise<{
    generatedAt: string;
    projectPath: string;
    sample: {
        id: string;
        name: string;
    };
    platform: "android" | "ios" | "standalone";
    account: {
        requestedStage: "unknown" | "not-registered" | "registered-not-logged-in" | "logged-in" | "has-license" | "has-cloud-credentials";
        stage: "not-registered" | "registered-not-logged-in" | "logged-in" | "has-license" | "has-cloud-credentials";
        officialLinks: {
            website: string;
            registerAndLogin: string;
            developCenter: string;
            docsGettingStarted: string;
            apiKeyDocs: string;
            downloadsPage: string;
            downloads: string;
            samples: string;
        };
        firstRunGuide: {
            entryQuestion: string;
            designPrinciple: string;
            stageModel: {
                stage: string;
                userSituation: string;
                mcpBehavior: string;
            }[];
            routes: {
                id: string;
                active: boolean;
                answer: string;
                guide: string;
                mcpAfterUserReturns: string[];
                browserActions: string[];
                returnPrompt: string;
            }[];
            mcpConversationRules: string[];
            userProvidesToMcp: string[];
            userNeverProvidesToMcp: string[];
            localSecretHandoff: string[];
            sampleSpecific: string[];
        };
    };
    accountMaterials: {
        readyForLocalConfigValidation: boolean;
        missingRequired: string[];
        materials: ({
            id: string;
            label: string;
            required: boolean;
            present: boolean;
            source: string;
            storeIn: string;
            sharePolicy: string;
            mcpCheck: string;
            requiredForDeviceRun?: undefined;
        } | {
            id: string;
            label: string;
            required: boolean;
            requiredForDeviceRun: boolean;
            present: boolean;
            source: string;
            storeIn: string;
            sharePolicy: string;
            mcpCheck: string;
        })[];
    };
    localConfig: {
        path: string;
        examplePath: string;
        exists: boolean;
        valid: boolean;
        failedChecks: string[];
        nextActions: string[];
    };
    envBackedWrite: {
        command: string;
        arguments: {
            projectPath: string;
            sampleId: string;
            targetPlatform: "android" | "ios" | "standalone";
        };
        requiredEnv: string[];
    };
    envPresence: {
        field: string;
        envNames: string[];
        present: boolean;
        note: string;
    }[];
    manualFileSteps: string[];
    validationChain: string[];
    sampleSpecific: string[];
    nextActions: string[];
    security: string;
}>;
export declare function readLocalConfigForRemoteValidation(projectPath: string): Promise<{
    licenseKey?: string;
    bundleIdentifier?: string;
}>;
export declare function summarizeLog(logText: string): {
    totalLines: number;
    errorLines: number;
    warningLines: number;
    mentionsEasyAR: boolean;
    mentionsAndroid: boolean;
    mentionsIOS: boolean;
};
export { buildRunReportMarkdown, buildFocusedPreflightMarkdown, buildImportChecklistMarkdown, buildSampleImportGuideMarkdown, buildWorkflowStateMarkdown, buildArtifactIndexMarkdown, buildFocusedHandoffPackMarkdown, buildSceneAuditMarkdown, buildSupportBundleMarkdown, buildRunResultMarkdown, buildCompletionReportMarkdown, buildFocusedScopeStatusMarkdown, buildIssueReportMarkdown, buildDeviceValidationChecklistMarkdown, buildDeviceRunResultFormMarkdown, buildAndroidDeviceRunbookMarkdown, buildProgrammingContextMarkdown, buildConfigIntegrationAuditMarkdown, markdownConfigConsumerCandidates, buildCodePlanMarkdown, buildCodeChangeSummaryMarkdown, markdownRunResultSteps, buildRunSequenceMarkdown, buildDeploymentReadinessMarkdown, buildUnityEnvironmentMarkdown, buildProductionValidationMarkdown, buildAuthorizationStrategyMarkdown, buildAccountOnboardingMarkdown, buildAccountMaterialsMarkdown, buildPortalEvidenceMarkdown, presenceLabel, buildLocalConfigFormMarkdown, buildLocalConfigHandoffMarkdown, buildOfficialAccessMarkdown, buildOfficialApiContractMarkdown, buildOfficialApiHandoffMarkdown, buildClientSetupMarkdown, buildReleaseManifestMarkdown, buildOnboardingMarkdown, buildProjectHandoffMarkdown, buildRemainingWorkMarkdown, buildFirstRunGuideMarkdown, markdownCheckList, markdownIssueList, markdownNumberedList } from "./tool-markdown.js";
export declare function writeFocusedSampleSupportFiles(root: string, sample: SampleInfo, overwrite: boolean, written: string[]): Promise<void>;
