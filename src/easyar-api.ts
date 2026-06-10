export type EasyARAuthStatus = {
  apiBaseUrl: string;
  hasToken: boolean;
  tokenPreview: string | null;
};

export type EasyARApiClient = {
  authStatus(): EasyARAuthStatus;
  accountScopedFeatures(): string[];
};

export function createEasyARApiClient(env: NodeJS.ProcessEnv = process.env): EasyARApiClient {
  const apiBaseUrl = env.EASYAR_API_BASE_URL ?? "https://www.easyar.cn";
  const token = env.EASYAR_API_TOKEN;

  return {
    authStatus() {
      return {
        apiBaseUrl,
        hasToken: Boolean(token),
        tokenPreview: token ? `${token.slice(0, 4)}...${token.slice(-4)}` : null
      };
    },
    accountScopedFeatures() {
      return [
        "official account/license validation",
        "account-scoped SDK download discovery",
        "cloud recognition credential discovery",
        "future EasyAR sample package discovery"
      ];
    }
  };
}
