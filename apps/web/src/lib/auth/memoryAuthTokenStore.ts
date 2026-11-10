import type {
  AuthTokenRecord,
  AuthTokenStore,
} from "./types/authTokenStore";

export const createMemoryAuthTokenStore = (): AuthTokenStore => {
  const tokens: AuthTokenRecord[] = [];

  return {
    insert: async (record) => {
      const stored: AuthTokenRecord = { ...record };
      tokens.push(stored);
      return stored;
    },
    findByTokenHash: async (tokenHash) =>
      tokens.find((token) => token.tokenHash === tokenHash) ?? null,
    revokeByTokenHash: async (tokenHash, revokedAt) => {
      const token = tokens.find((row) => row.tokenHash === tokenHash);
      if (token === undefined || token.revokedAt !== null) {
        return false;
      }
      token.revokedAt = revokedAt;
      return true;
    },
  };
};
