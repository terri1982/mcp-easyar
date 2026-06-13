import { clientEntrypointModes, clientKinds, mobilePlatforms, runResultStatuses } from "./catalog.js";
import type { AccountStage } from "./catalog.js";
import type { SampleInfo } from "./samples.js";
import { buildLatestLogDiagnostic } from "./tool-services.js";
declare const focusedHandoffSampleIds: readonly ["image-tracking", "cloud-recognition", "mega", "all"];
export declare function buildFocusedRunReport(root: string, sample: SampleInfo, maxScriptIssues: number): Promise<{
    generatedAt: string;
    projectPath: string;
    sample: {
        id: string;
        name: string;
        implementationStatus: "focused" | "deferred";
    };
    overallReady: boolean;
    readiness: {
        projectPath: string;
        sample: string;
        unityVersion: string | null;
        ready: boolean;
        checks: {
            id: string;
            ok: boolean;
            detail: string;
        }[];
        matchingScenes: string[];
        packageCacheSamples: string[];
        nextActions: string[];
    };
    configValidation: {
        configPath: string;
        valid: boolean;
        checks: {
            id: string;
            ok: boolean;
            detail: string;
        }[];
        security: string;
        nextActions: string[];
    };
    scriptReview: {
        projectPath: string;
        reviewedFiles: string[];
        reviewedFileCount: number;
        issueCount: number;
        issues: import("./tool-diagnostics.js").ScriptReviewIssue[];
        nextActions: string[];
        note: string;
    };
    nextRecommendedPhase: string;
    runSequenceSummary: {
        name: string;
        stepCount: number;
    }[];
    security: string;
}>;
export declare function buildFocusedPreflight(root: string, sample: SampleInfo, platform: typeof mobilePlatforms[number], outputPath: string, maxScriptIssues: number): Promise<{
    generatedAt: string;
    projectPath: string;
    sample: {
        id: string;
        name: string;
        implementationStatus: "focused" | "deferred";
    };
    platform: "android" | "ios";
    outputPath: string;
    readyForUnityBatch: boolean;
    readyForDeviceBuild: boolean;
    checks: {
        id: string;
        ok: boolean;
        area: string;
        detail: string;
        action: string;
    }[];
    blockers: {
        id: string;
        ok: boolean;
        area: string;
        detail: string;
        action: string;
    }[];
    nextCall: {
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
    } | {
        tool: string;
        arguments: {
            projectPath: string;
            sampleId: string;
            logPath: string;
        };
    };
    nextActions: string[];
    summaries: {
        missingAccountMaterials: string[];
        unityRecommendedPath: string | null;
        importReady: boolean;
        packageCacheSamples: string[];
        localConfigValid: boolean;
        portalEvidenceExists: boolean;
        portalSenseLicenseStatus: string | null;
        portalCloudLibraryStatus: string | null;
        portalCloudTargetCount: number | null;
        readinessReady: boolean;
        sceneReady: boolean;
        scriptIssueCount: number;
        workflowPhase: string;
        workflowBlocked: boolean;
    };
    references: {
        accountMaterials: string;
        portalEvidence: string;
        unityEnvironment: string;
        importChecklist: string;
        sampleImportGuide: string;
        workflowState: string;
        runReport: string;
        sceneAudit: string;
    };
    security: string;
}>;
export declare function buildArtifactIndex(root: string, sample: SampleInfo): Promise<{
    generatedAt: string;
    projectPath: string;
    sample: {
        id: string;
        name: string;
        implementationStatus: "focused" | "deferred";
    };
    artifacts: {
        exists: boolean;
        sizeBytes: number | null;
        modifiedAt: string | null;
        name: string;
        relativePath: string;
        purpose: string;
        generateWith: string;
        order: number;
    }[];
    readOrder: string[];
    missingArtifacts: string[];
    nextActions: string[];
    security: string;
}>;
export type FocusedHandoffPackInput = {
    root: string;
    sampleId: typeof focusedHandoffSampleIds[number];
    platform: typeof mobilePlatforms[number];
    accountStage: AccountStage;
    client: typeof clientKinds[number];
    entrypointMode: typeof clientEntrypointModes[number];
    serverPath?: string;
    outputPath?: string;
    developmentBuild: boolean;
    programmingGoal: string;
    codeGoal: string;
    maxScriptIssues: number;
    maxCandidates: number;
    maxLogBytes: number;
    maxLogIssues: number;
};
export declare function focusedHandoffPackSamples(sampleId: typeof focusedHandoffSampleIds[number]): SampleInfo[];
export declare function buildFocusedHandoffPackPlan(input: FocusedHandoffPackInput): Promise<{
    generatedAt: string;
    projectPath: string;
    platform: "android" | "ios";
    requestedSampleId: "image-tracking" | "cloud-recognition" | "mega" | "all";
    samples: {
        sample: {
            id: string;
            name: string;
            implementationStatus: "focused" | "deferred";
        };
        outputPath: string;
        artifactCount: number;
        missingCount: number;
        plannedArtifacts: {
            exists: boolean;
            sizeBytes: number | null;
            name: string;
            relativePath: string;
            purpose: string;
        }[];
    }[];
    projectArtifacts: string[];
    nextActions: string[];
    security: string;
}>;
export declare function writeFocusedHandoffPack(input: FocusedHandoffPackInput & {
    overwrite: boolean;
}): Promise<{
    generatedAt: string;
    projectPath: string;
    platform: "android" | "ios";
    requestedSampleId: "image-tracking" | "cloud-recognition" | "mega" | "all";
    sampleCount: number;
    samples: {
        sampleId: string;
        sampleName: string;
        outputPath: string;
        artifactCount: number;
        missingArtifactsAfterWrite: string[];
        workflowPhase: string;
        workflowBlocked: boolean;
        readyForUnityBatch: boolean;
        readyForDeviceBuild: boolean;
        localConfigMissingFields: string[];
        nextActions: string[];
    }[];
    written: string[];
    skipped: string[];
    writtenCount: number;
    skippedCount: number;
    focusedSamplesComplete: boolean;
    remainingPercent: number;
    topNextCall: {
        tool: string;
        arguments: Record<string, unknown>;
    };
    nextActions: string[];
    planned: {
        generatedAt: string;
        projectPath: string;
        platform: "android" | "ios";
        requestedSampleId: "image-tracking" | "cloud-recognition" | "mega" | "all";
        samples: {
            sample: {
                id: string;
                name: string;
                implementationStatus: "focused" | "deferred";
            };
            outputPath: string;
            artifactCount: number;
            missingCount: number;
            plannedArtifacts: {
                exists: boolean;
                sizeBytes: number | null;
                name: string;
                relativePath: string;
                purpose: string;
            }[];
        }[];
        projectArtifacts: string[];
        nextActions: string[];
        security: string;
    };
    security: string;
}>;
export declare function writeFocusedHandoffPackForSample(input: FocusedHandoffPackInput & {
    overwrite: boolean;
}, sample: SampleInfo, outputPath: string, written: string[], skipped: string[]): Promise<{
    sampleId: string;
    sampleName: string;
    outputPath: string;
    artifactCount: number;
    missingArtifactsAfterWrite: string[];
    workflowPhase: string;
    workflowBlocked: boolean;
    readyForUnityBatch: boolean;
    readyForDeviceBuild: boolean;
    localConfigMissingFields: string[];
    nextActions: string[];
}>;
export declare function focusedHandoffPackArtifactSpecs(root: string, sample: SampleInfo): {
    name: string;
    relativePath: string;
    purpose: string;
}[];
export declare function focusedHandoffPackPurpose(name: string): string;
export declare function writePackFile(root: string, relativePath: string, markdown: string, overwrite: boolean, written: string[], skipped: string[]): Promise<void>;
export declare function defaultFocusedOutputPath(sample: SampleInfo, platform: typeof mobilePlatforms[number]): string;
export declare function focusedArtifactReadOrder(artifacts: Array<{
    relativePath: string;
}>): string[];
export declare function artifactPriority(relativePath: string, priority: string[]): number;
export declare function focusedArtifactDefinitions(root: string, sample: SampleInfo): {
    name: string;
    relativePath: string;
    purpose: string;
    generateWith: string;
}[];
export declare function buildSupportBundle(input: {
    root: string;
    sample: SampleInfo;
    platform: typeof mobilePlatforms[number];
    outputPath?: string;
    developmentBuild: boolean;
    maxScriptIssues: number;
    maxCandidates: number;
    maxLogBytes: number;
    maxLogIssues: number;
}): Promise<{
    generatedAt: string;
    projectPath: string;
    sample: {
        id: string;
        name: string;
        implementationStatus: "focused" | "deferred";
    };
    platform: "android" | "ios";
    outputPath: string;
    developmentBuild: boolean;
    generatedArtifacts: {
        runbook: string;
        runSequence: string;
        runReport: string;
        sceneAudit: string;
        supportBundle: string;
        runResult: string;
        codePlan: string;
        artifactIndex: string;
    };
    runSequenceSummary: {
        name: string;
        stepCount: number;
    }[];
    runReport: {
        generatedAt: string;
        projectPath: string;
        sample: {
            id: string;
            name: string;
            implementationStatus: "focused" | "deferred";
        };
        overallReady: boolean;
        readiness: {
            projectPath: string;
            sample: string;
            unityVersion: string | null;
            ready: boolean;
            checks: {
                id: string;
                ok: boolean;
                detail: string;
            }[];
            matchingScenes: string[];
            packageCacheSamples: string[];
            nextActions: string[];
        };
        configValidation: {
            configPath: string;
            valid: boolean;
            checks: {
                id: string;
                ok: boolean;
                detail: string;
            }[];
            security: string;
            nextActions: string[];
        };
        scriptReview: {
            projectPath: string;
            reviewedFiles: string[];
            reviewedFileCount: number;
            issueCount: number;
            issues: import("./tool-diagnostics.js").ScriptReviewIssue[];
            nextActions: string[];
            note: string;
        };
        nextRecommendedPhase: string;
        runSequenceSummary: {
            name: string;
            stepCount: number;
        }[];
        security: string;
    };
    sceneAudit: {
        projectPath: string;
        sample: {
            id: string;
            name: string;
            implementationStatus: "focused" | "deferred";
            sceneHints: string[];
        };
        unityVersion: string | null;
        readyForUnityValidation: boolean;
        easyarSignals: string[];
        ignoredGeneratedSignals: string[];
        sceneCandidates: string[];
        matchingScenes: string[];
        buildSettingsHints: {
            fileExists: boolean;
            scenes: never[];
            enabledScenes: never[];
            matchingEnabledScenes: never[];
            firstEnabledScene: null;
            firstEnabledSceneMatches: boolean;
        } | {
            fileExists: boolean;
            scenes: {
                path: string;
                enabled: boolean;
            }[];
            enabledScenes: string[];
            matchingEnabledScenes: string[];
            firstEnabledScene: string;
            firstEnabledSceneMatches: boolean;
        };
        sampleSpecific: {
            kind: string;
            targetAssets: string[];
            cloudConfig: null;
            blockers: {
                id: string;
                detail: string;
                action: string;
            }[];
        } | {
            kind: string;
            targetAssets: never[];
            cloudConfig: {
                valid: boolean;
                presence: {
                    appId: boolean;
                    apiKey: boolean;
                    apiSecret: boolean;
                    appKey: boolean;
                    appSecret: boolean;
                };
                detail: string;
            };
            blockers: {
                id: string;
                detail: string;
                action: string;
            }[];
        };
        blockers: {
            id: string;
            detail: string;
            action: string;
        }[];
        nextActions: string[];
        security: string;
    };
    latestLog: {
        analyzed: boolean;
        logPath: null;
        logSizeBytes: null;
        logModifiedAt: null;
        summary: null;
        issueCount: number;
        issues: never[];
        candidates: import("./tool-local-config.js").UnityLogCandidate[];
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
        candidates: import("./tool-local-config.js").UnityLogCandidate[];
        nextActions: string[];
    };
    nextActions: string[];
    security: string;
}>;
export declare function buildDeviceRunResultForm(root: string, sample: SampleInfo, platform: typeof mobilePlatforms[number], device?: string, buildOutputPath?: string, notes?: string): Promise<{
    generatedAt: string;
    projectPath: string;
    sample: {
        id: string;
        name: string;
        implementationStatus: "focused" | "deferred";
    };
    platform: "android" | "ios";
    device: string | null;
    buildOutputPath: string | null;
    readyForDeviceValidation: boolean;
    blockerCount: number;
    blockers: {
        id: string;
        detail: string;
        action: string;
    }[];
    formSteps: {
        name: string;
        status: "not-run";
        evidencePrompt: string;
        nextActionPrompt: string;
        requiredForCompletion: boolean;
    }[];
    passCriteria: string[];
    evidencePrompts: string[];
    completionAcceptanceRules: string[];
    safeDraftRunResultArguments: {
        projectPath: string;
        sampleId: string;
        platform: "android" | "ios";
        overallStatus: string;
        device: string;
        buildOutputPath: string | undefined;
        notes: string;
        steps: {
            name: string;
            status: "not-run";
            evidence: string;
            nextAction: string;
        }[];
    };
    passedRunResultTemplate: {
        overallStatus: string;
        notes: string;
        steps: {
            name: string;
            status: string;
            evidence: string;
        }[];
        projectPath: string;
        sampleId: string;
        platform: "android" | "ios";
        device: string;
        buildOutputPath: string | undefined;
    };
    nextActions: string[];
    security: string;
}>;
export declare function samplePassedEvidencePlaceholder(sample: SampleInfo, recordedDevice: string): string;
export declare function buildAndroidDeviceRunbook(input: {
    root: string;
    sample: SampleInfo;
    apkPath?: string;
    bundleIdentifier?: string;
    adbPath?: string;
    deviceSerial?: string;
    device?: string;
    logRelativePath?: string;
    timeoutSeconds: number;
}): Promise<{
    generatedAt: string;
    projectPath: string;
    sample: {
        id: string;
        name: string;
        implementationStatus: "focused" | "deferred";
    };
    platform: "android";
    adb: string;
    packageName: string;
    deviceSerial: string | null;
    apk: {
        path: string;
        relativePath: string;
        exists: boolean;
    };
    log: {
        path: string;
        relativePath: string;
    };
    deviceStatus: {
        command: string;
        exitCode: number | null;
        adbAvailable: boolean;
        readyForInstall: boolean;
        devices: import("./runtime.js").AdbDevice[];
        stderr: string;
    };
    commands: ({
        id: string;
        tool: string;
        arguments: {
            adbPath: string;
        };
        shell: string;
        purpose: string;
    } | {
        id: string;
        tool: string;
        arguments: {
            deviceSerial?: string | undefined;
            projectPath: string;
            sampleId: string;
            apkPath: string;
            adbPath: string;
        };
        shell: string;
        purpose: string;
    } | {
        id: string;
        tool: string;
        arguments: {
            deviceSerial?: string | undefined;
            projectPath: string;
            sampleId: string;
            adbPath: string;
            relativePath: string;
            clearFirst: boolean;
        };
        shell: string;
        purpose: string;
    } | {
        id: string;
        tool: string;
        arguments: {
            deviceSerial?: string | undefined;
            projectPath: string;
            sampleId: string;
            bundleIdentifier: string;
            adbPath: string;
        };
        shell: string;
        purpose: string;
    } | {
        id: string;
        tool: string;
        arguments: {
            deviceSerial?: string | undefined;
            projectPath: string;
            sampleId: string;
            adbPath: string;
            relativePath: string;
        };
        shell: string;
        purpose: string;
    })[];
    completionAcceptanceRules: string[];
    passCriteria: string[];
    evidencePrompts: string[];
    safeDraftRunResultArguments: {
        projectPath: string;
        sampleId: string;
        platform: "android" | "ios";
        overallStatus: string;
        device: string;
        buildOutputPath: string | undefined;
        notes: string;
        steps: {
            name: string;
            status: "not-run";
            evidence: string;
            nextAction: string;
        }[];
    };
    passedRunResultTemplate: {
        overallStatus: string;
        notes: string;
        steps: {
            name: string;
            status: string;
            evidence: string;
        }[];
        projectPath: string;
        sampleId: string;
        platform: "android" | "ios";
        device: string;
        buildOutputPath: string | undefined;
    };
    nextActions: string[];
    security: string;
}>;
export declare function androidDeviceInteractionAction(sample: SampleInfo): string;
export declare function buildRunResult(input: {
    root: string;
    sample: SampleInfo;
    platform: typeof mobilePlatforms[number];
    overallStatus: typeof runResultStatuses[number];
    device?: string;
    buildOutputPath?: string;
    notes?: string;
    steps: Array<{
        name: string;
        status: typeof runResultStatuses[number];
        evidence?: string;
        nextAction?: string;
    }>;
    maxScriptIssues: number;
    maxCandidates: number;
    maxLogBytes: number;
    maxLogIssues: number;
}): Promise<{
    generatedAt: string;
    projectPath: string;
    sample: {
        id: string;
        name: string;
        implementationStatus: "focused" | "deferred";
    };
    platform: "android" | "ios";
    overallStatus: "passed" | "failed" | "blocked" | "not-run";
    device: string | null;
    buildOutputPath: string | null;
    notes: string | null;
    steps: {
        name: string;
        status: (typeof runResultStatuses)[number];
        evidence?: string;
        nextAction?: string;
    }[];
    failedStepCount: number;
    notRunStepCount: number;
    supportBundleSummary: {
        overallReady: boolean;
        readyForUnityValidation: boolean;
        logIssueCount: number;
        supportBundlePath: string;
    };
    nextActions: string[];
    security: string;
}>;
export declare function buildCompletionReport(root: string, sample: SampleInfo, platform: typeof mobilePlatforms[number], outputPath: string, maxScriptIssues: number, maxLogBytes: number, maxLogIssues: number): Promise<{
    generatedAt: string;
    projectPath: string;
    sample: {
        id: string;
        name: string;
        implementationStatus: "focused" | "deferred";
    };
    platform: "android" | "ios";
    outputPath: string;
    completionStatus: "passed" | "failed" | "blocked" | "not-run";
    runThroughComplete: boolean;
    requiredEvidence: {
        id: string;
        required: boolean;
        passed: boolean;
        detail: string;
    }[];
    evidence: {
        id: string;
        path: string;
        status: string;
        detail: string;
    }[];
    parsedRunResult: {
        exists: boolean;
        relativePath: string;
        overallStatus: "passed" | "failed" | "blocked" | "not-run" | null;
        device: string | null;
        buildOutputPath: string | null;
        passedStepCount: number;
        passedDeviceValidationStepCount: number;
        hasPassedDeviceValidationEvidence: boolean;
        failedStepCount: number;
        blockedStepCount: number;
        notRunStepCount: number;
    };
    summary: {
        readyForUnityBatch: boolean;
        readyForDeviceBuild: boolean;
        readyForDeviceValidation: boolean;
        latestLogAnalyzed: boolean;
        latestLogIssueCount: number;
        latestRunResultStatus: "passed" | "failed" | "blocked" | "not-run" | null;
    };
    blockers: {
        id: string;
        detail: string;
        action: string;
    }[];
    nextActions: string[];
    security: string;
}>;
export declare function chooseCompletionStatus(hasRunResult: boolean, runResultStatus: string | null, preflightPassed: boolean, deviceReady: boolean, realDeviceRunPassed: boolean, hasBlockingLogIssues: boolean): typeof runResultStatuses[number];
export declare function readRunResultArtifact(root: string, sample: SampleInfo): Promise<{
    exists: boolean;
    relativePath: string;
    overallStatus: "passed" | "failed" | "blocked" | "not-run" | null;
    device: string | null;
    buildOutputPath: string | null;
    passedStepCount: number;
    passedDeviceValidationStepCount: number;
    hasPassedDeviceValidationEvidence: boolean;
    failedStepCount: number;
    blockedStepCount: number;
    notRunStepCount: number;
}>;
export declare function readPortalEvidenceArtifact(root: string, sample: SampleInfo): Promise<{
    exists: boolean;
    relativePath: string;
    sampleId: string;
    apiKeyPresent: boolean | null;
    apiSecretPresent: boolean | null;
    senseLicenseStatus: string | null;
    cloudLibraryStatus: string | null;
    cloudTargetCount: number | null;
}>;
export declare function devicePortalEvidenceBlockers(root: string, sample: SampleInfo, platform: typeof mobilePlatforms[number], portalEvidence: Awaited<ReturnType<typeof readPortalEvidenceArtifact>>): {
    id: string;
    detail: string;
    action: string;
}[];
export declare function isPortalEvidenceReadyForSample(portalEvidence: Awaited<ReturnType<typeof readPortalEvidenceArtifact>>, sample: SampleInfo): boolean;
export declare function portalEvidencePreflightDetail(portalEvidence: Awaited<ReturnType<typeof readPortalEvidenceArtifact>>, sample: SampleInfo): string;
export declare function parseRunResultStatus(markdown: string): typeof runResultStatuses[number] | null;
export declare function parseYesNoField(markdown: string, field: string): boolean | null;
export declare function parseNumberField(markdown: string, field: string): number | null;
export declare function parseMarkdownField(markdown: string, field: string): string | null;
export declare function countMarkdownStepStatuses(markdown: string, status: typeof runResultStatuses[number]): number;
export declare function countPassedDeviceValidationSteps(markdown: string): number;
export declare function hasRecordedDevice(device: string | null): boolean;
export declare function buildCompletionNextActions(completionStatus: typeof runResultStatuses[number], preflight: Awaited<ReturnType<typeof buildFocusedPreflight>>, deviceValidation: Awaited<ReturnType<typeof buildDeviceValidationChecklist>>, runResultArtifact: Awaited<ReturnType<typeof readRunResultArtifact>>, latestLog: Awaited<ReturnType<typeof buildLatestLogDiagnostic>>, root: string, sample: SampleInfo, platform: typeof mobilePlatforms[number]): string[];
export declare function buildFocusedScopeStatus(root: string, platform: typeof mobilePlatforms[number], maxScriptIssues: number, maxLogBytes: number, maxLogIssues: number): Promise<{
    generatedAt: string;
    projectPath: string;
    platform: "android" | "ios";
    scope: string;
    focusedSampleIds: string[];
    deferredSampleIds: string[];
    focusedSampleCount: number;
    completedCount: number;
    blockedCount: number;
    failedCount: number;
    notRunCount: number;
    allFocusedSamplesComplete: boolean;
    items: {
        sampleId: string;
        sampleName: string;
        completionStatus: "passed" | "failed" | "blocked" | "not-run";
        runThroughComplete: boolean;
        blockerCount: number;
        latestRunResultStatus: "passed" | "failed" | "blocked" | "not-run" | null;
        completionReportPath: string;
        runResultPath: string;
        nextActions: string[];
    }[];
    nextActions: string[];
    security: string;
}>;
export declare function buildFocusedReleaseEvidence(status: Awaited<ReturnType<typeof buildFocusedScopeStatus>>): {
    schemaVersion: number;
    generatedAt: string;
    evidenceKind: string;
    source: string;
    platform: "android" | "ios";
    scope: string;
    focusedSampleIds: string[];
    deferredSampleIds: string[];
    focusedSampleCount: number;
    completedCount: number;
    blockedCount: number;
    failedCount: number;
    notRunCount: number;
    allFocusedSamplesComplete: boolean;
    items: {
        sampleId: string;
        sampleName: string;
        completionStatus: "passed" | "failed" | "blocked" | "not-run";
        runThroughComplete: boolean;
        blockerCount: number;
        latestRunResultStatus: "passed" | "failed" | "blocked" | "not-run" | null;
        completionReportPath: string;
        runResultPath: string;
    }[];
    security: string;
};
export declare function readFocusedReleaseEvidence(evidencePath: string, platform: typeof mobilePlatforms[number]): Promise<Awaited<ReturnType<typeof buildFocusedScopeStatus>>>;
export declare function buildFocusedScopeNextActions(root: string, platform: typeof mobilePlatforms[number], items: Array<{
    sampleId: string;
    completionStatus: typeof runResultStatuses[number];
    runThroughComplete: boolean;
    nextActions: string[];
}>): string[];
export declare function buildIssueReport(input: {
    root: string;
    sample: SampleInfo;
    platform: typeof mobilePlatforms[number];
    overallStatus: typeof runResultStatuses[number];
    device?: string;
    buildOutputPath?: string;
    observedBehavior?: string;
    expectedBehavior?: string;
    reproductionSteps: string[];
    steps: Array<{
        name: string;
        status: typeof runResultStatuses[number];
        evidence?: string;
        nextAction?: string;
    }>;
    maxScriptIssues: number;
    maxCandidates: number;
    maxLogBytes: number;
    maxLogIssues: number;
}): Promise<{
    generatedAt: string;
    title: string;
    labels: string[];
    body: string;
    projectPath: string;
    sample: {
        id: string;
        name: string;
        implementationStatus: "focused" | "deferred";
    };
    platform: "android" | "ios";
    overallStatus: "passed" | "failed" | "blocked" | "not-run";
    artifactPaths: {
        onboarding: string;
        workflowState: string;
        officialAccess: string;
        importChecklist: string;
        runSequence: string;
        runReport: string;
        sceneAudit: string;
        supportBundle: string;
        runResult: string;
        deviceValidation: string;
        latestLog: string;
    };
    nextActions: string[];
    security: string;
}>;
export declare function buildDeviceValidationChecklist(root: string, sample: SampleInfo, platform: typeof mobilePlatforms[number], device?: string, buildOutputPath?: string): Promise<{
    generatedAt: string;
    projectPath: string;
    sample: {
        id: string;
        name: string;
        implementationStatus: "focused" | "deferred";
    };
    platform: "android" | "ios";
    device: string | null;
    buildOutputPath: string | null;
    readyForDeviceValidation: boolean;
    blockers: {
        id: string;
        detail: string;
        action: string;
    }[];
    preflightSummary: {
        readinessReady: boolean;
        importReady: boolean;
        sceneReady: boolean;
        portalEvidenceExists: boolean;
        portalSenseLicenseStatus: string | null;
        portalCloudLibraryStatus: string | null;
        portalCloudTargetCount: number | null;
        unityVersion: string | null;
    };
    steps: DeviceValidationStep[];
    passCriteria: string[];
    evidencePrompts: string[];
    nextActions: string[];
    security: string;
}>;
export type DeviceValidationStep = {
    id: string;
    title: string;
    action: string;
    expected: string;
};
export declare function buildDeviceValidationSteps(sample: SampleInfo, platform: typeof mobilePlatforms[number]): DeviceValidationStep[];
export declare function sampleSpecificDeviceValidationSteps(sample: SampleInfo): DeviceValidationStep[];
export declare function sampleDevicePassCriteria(sample: SampleInfo): string[];
export declare function sampleDeviceEvidencePrompts(sample: SampleInfo): string[];
export declare function defaultIssueReproductionSteps(sample: SampleInfo, platform: typeof mobilePlatforms[number]): string[];
export declare function sampleExpectedIssueBehavior(sample: SampleInfo): string;
export {};
