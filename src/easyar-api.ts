export type EasyARAuthStatus = {
  apiBaseUrl: string;
  hasToken: boolean;
  tokenPreview: string | null;
  accountStatusEndpointConfigured: boolean;
  licenseValidationEndpointConfigured: boolean;
  downloadsEndpointConfigured: boolean;
  cloudCredentialsEndpointConfigured: boolean;
};

export type EasyARApiClient = {
  authStatus(): EasyARAuthStatus;
  accountScopedFeatures(): string[];
  checkAccount(): Promise<EasyARRemoteCheckResult>;
  validateLicense(input: EasyARLicenseValidationInput): Promise<EasyARRemoteCheckResult>;
  discoverDownloads(input: EasyARDownloadDiscoveryInput): Promise<EasyARRemoteCheckResult>;
  discoverCloudCredentials(input: EasyARCloudCredentialDiscoveryInput): Promise<EasyARRemoteCheckResult>;
};

export type EasyARLicenseValidationInput = {
  licenseKey?: string;
  bundleIdentifier?: string;
  platform?: string;
};

export type EasyARDownloadDiscoveryInput = {
  sampleId?: string;
  packageKind?: string;
  unityVersion?: string | null;
};

export type EasyARCloudCredentialDiscoveryInput = {
  sampleId?: string;
  bundleIdentifier?: string | null;
  platform?: string;
};

export type EasyARRemoteCheckResult = {
  configured: boolean;
  ok: boolean | null;
  endpoint: string | null;
  statusCode: number | null;
  summary: string;
  details?: unknown;
  nextActions: string[];
};

export function createEasyARApiClient(env: NodeJS.ProcessEnv = process.env): EasyARApiClient {
  const apiBaseUrl = env.EASYAR_API_BASE_URL ?? "https://www.easyar.cn";
  const token = env.EASYAR_API_TOKEN;
  const accountStatusEndpoint = env.EASYAR_ACCOUNT_STATUS_ENDPOINT;
  const licenseValidationEndpoint = env.EASYAR_LICENSE_VALIDATE_ENDPOINT;
  const downloadsEndpoint = env.EASYAR_DOWNLOADS_ENDPOINT;
  const cloudCredentialsEndpoint = env.EASYAR_CLOUD_CREDENTIALS_ENDPOINT;

  return {
    authStatus() {
      return {
        apiBaseUrl,
        hasToken: Boolean(token),
        tokenPreview: token ? `${token.slice(0, 4)}...${token.slice(-4)}` : null,
        accountStatusEndpointConfigured: Boolean(accountStatusEndpoint),
        licenseValidationEndpointConfigured: Boolean(licenseValidationEndpoint),
        downloadsEndpointConfigured: Boolean(downloadsEndpoint),
        cloudCredentialsEndpointConfigured: Boolean(cloudCredentialsEndpoint)
      };
    },
    accountScopedFeatures() {
      return [
        "official account/license validation",
        "account-scoped SDK download discovery",
        "cloud recognition credential discovery",
        "future EasyAR sample package discovery"
      ];
    },
    async checkAccount() {
      return callOfficialEndpoint({
        endpoint: accountStatusEndpoint,
        token,
        method: "GET",
        missingEndpointSummary: "EASYAR_ACCOUNT_STATUS_ENDPOINT is not configured.",
        missingTokenSummary: "EASYAR_API_TOKEN is not configured."
      });
    },
    async validateLicense(input) {
      return callOfficialEndpoint({
        endpoint: licenseValidationEndpoint,
        token,
        method: "POST",
        body: {
          licenseKey: input.licenseKey,
          bundleIdentifier: input.bundleIdentifier,
          platform: input.platform
        },
        missingEndpointSummary: "EASYAR_LICENSE_VALIDATE_ENDPOINT is not configured.",
        missingTokenSummary: "EASYAR_API_TOKEN is not configured."
      });
    },
    async discoverDownloads(input) {
      return callOfficialEndpoint({
        endpoint: downloadsEndpoint,
        token,
        method: "POST",
        body: {
          sampleId: input.sampleId,
          packageKind: input.packageKind,
          unityVersion: input.unityVersion
        },
        missingEndpointSummary: "EASYAR_DOWNLOADS_ENDPOINT is not configured.",
        missingTokenSummary: "EASYAR_API_TOKEN is not configured."
      });
    },
    async discoverCloudCredentials(input) {
      return callOfficialEndpoint({
        endpoint: cloudCredentialsEndpoint,
        token,
        method: "POST",
        body: {
          sampleId: input.sampleId,
          bundleIdentifier: input.bundleIdentifier,
          platform: input.platform
        },
        missingEndpointSummary: "EASYAR_CLOUD_CREDENTIALS_ENDPOINT is not configured.",
        missingTokenSummary: "EASYAR_API_TOKEN is not configured."
      });
    }
  };
}

async function callOfficialEndpoint(options: {
  endpoint?: string;
  token?: string;
  method: "GET" | "POST";
  body?: Record<string, unknown>;
  missingEndpointSummary: string;
  missingTokenSummary: string;
}): Promise<EasyARRemoteCheckResult> {
  if (!options.endpoint) {
    return {
      configured: false,
      ok: null,
      endpoint: null,
      statusCode: null,
      summary: options.missingEndpointSummary,
      nextActions: [
        "Configure the official EasyAR API endpoint in the MCP server environment.",
        "Keep EasyAR account tokens and license keys in local environment variables or secret storage."
      ]
    };
  }

  if (!options.token) {
    return {
      configured: true,
      ok: null,
      endpoint: options.endpoint,
      statusCode: null,
      summary: options.missingTokenSummary,
      nextActions: [
        "Set EASYAR_API_TOKEN to an official registered-user token before calling account-scoped endpoints."
      ]
    };
  }

  try {
    const response = await fetch(options.endpoint, {
      method: options.method,
      headers: {
        "accept": "application/json",
        "authorization": `Bearer ${options.token}`,
        ...(options.method === "POST" ? { "content-type": "application/json" } : {})
      },
      body: options.method === "POST" ? JSON.stringify(options.body ?? {}) : undefined,
      signal: AbortSignal.timeout(10000)
    });
    const details = await readJsonResponse(response);
    return {
      configured: true,
      ok: response.ok,
      endpoint: options.endpoint,
      statusCode: response.status,
      summary: response.ok
        ? "Official EasyAR API endpoint accepted the request."
        : "Official EasyAR API endpoint rejected the request.",
      details: sanitizeRemoteDetails(details),
      nextActions: response.ok
        ? ["Continue with account-scoped EasyAR workflow tools."]
        : ["Check token validity, endpoint configuration, account permissions, and license/bundle binding."]
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      endpoint: options.endpoint,
      statusCode: null,
      summary: `Official EasyAR API request failed: ${error instanceof Error ? error.message : String(error)}`,
      nextActions: [
        "Verify the endpoint is reachable from this machine.",
        "Confirm the endpoint URL and token are configured for the official EasyAR environment."
      ]
    };
  }
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return { text: text.slice(0, 1000) };
  }
}

function sanitizeRemoteDetails(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeRemoteDetails);
  }
  if (typeof value !== "object" || value === null) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      /(token|secret|key|credential|password|license)/i.test(key) ? "[redacted]" : sanitizeRemoteDetails(entry)
    ])
  );
}
