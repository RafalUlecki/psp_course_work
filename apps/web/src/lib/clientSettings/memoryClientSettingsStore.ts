import type {
  ClientSettingsRecord,
  ClientSettingsStore,
} from "./types/clientSettingsStore";

export const createMemoryClientSettingsStore = (
  initial: readonly ClientSettingsRecord[] = [],
): ClientSettingsStore => {
  const byClientId = new Map<string, ClientSettingsRecord>(
    initial.map((row) => [row.clientId, { ...row }]),
  );

  return {
    getByClientId: async (clientId) => {
      const row = byClientId.get(clientId);
      if (row === undefined) {
        return null;
      }
      return { ...row };
    },
    upsertByClientId: async (clientId, defaultLastN) => {
      const row: ClientSettingsRecord = { clientId, defaultLastN };
      byClientId.set(clientId, row);
      return { ...row };
    },
  };
};
