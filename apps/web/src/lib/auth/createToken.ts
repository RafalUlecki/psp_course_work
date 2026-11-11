import { randomUUID } from "node:crypto";

import { MS_PER_DAY } from "./constants";
import { getAuthTokenTtlDays } from "./parseAuthTokenTtlDays";
import { generateRawToken, hashToken } from "./tokenSecret";
import type { AuthTokenStore } from "./types/authTokenStore";
import type { CreateTokenProps } from "./types/createToken";

export const createToken = async (
  props: CreateTokenProps,
  store: AuthTokenStore,
): Promise<string> => {
  const {
    userId,
    clientId,
    now = new Date(),
    ttlDays = getAuthTokenTtlDays(),
  } = props;
  const rawToken = generateRawToken();
  const createdAt = now;
  const expiresAt = new Date(createdAt.getTime() + ttlDays * MS_PER_DAY);

  await store.insert({
    id: randomUUID(),
    userId,
    clientId,
    tokenHash: hashToken(rawToken),
    createdAt,
    expiresAt,
    revokedAt: null,
  });

  return rawToken;
};
