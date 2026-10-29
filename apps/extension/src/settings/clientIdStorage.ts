import { CLIENT_ID_STORAGE_KEY, type TestClientId } from "./constants";
import { parseStoredClientId } from "./parseStoredClientId";

export const readStoredClientId = async (): Promise<TestClientId> => {
  const result = await chrome.storage.local.get(CLIENT_ID_STORAGE_KEY);
  const value = result[CLIENT_ID_STORAGE_KEY];

  return parseStoredClientId(typeof value === "string" ? value : undefined);
};

export const writeStoredClientId = async (
  clientId: TestClientId,
): Promise<void> => {
  await chrome.storage.local.set({ [CLIENT_ID_STORAGE_KEY]: clientId });
};
