import { createEasyARApiClient } from "./easyar-api.js";

export const easyarApi = createEasyARApiClient();

export function readAuthConfig() {
  return easyarApi.authStatus();
}
