import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { OPTIONS as revokeOptions } from "../../../app/api/auth/revoke/route";
import { OPTIONS as hitRateOptions } from "../../../app/api/hit-rate/route";
import { OPTIONS as watchlistOptions } from "../../../app/api/watchlist/route";
import { TEST_CLIENT_A_ID } from "../clients/constants";
import { MS_PER_DAY } from "./constants";
import { createToken } from "./createToken";
import { UNAUTHORIZED_ERROR } from "./errors";
import { handleAuthRevokeRequest } from "./handleAuthRevokeRequest";
import { createMemoryAuthTokenStore } from "./memoryAuthTokenStore";
import { addPublicApiRoute } from "./publicApiRoutes";
import { isRequireAuthOk, requireAuth } from "./requireAuth";
import type { RequireAuthAuthenticated } from "./types/requireAuth";

const CREATED_AT = new Date("2026-01-01T00:00:00.000Z");
const AFTER_DAY_14 = new Date(CREATED_AT.getTime() + 14 * MS_PER_DAY + 1);
const PRIVATE_PATH = "/api/hit-rate";
const TEST_PUBLIC_PATH = "/api/test-public";

const bearer = (rawToken: string): string => `Bearer ${rawToken}`;

const unauthorized = {
  status: 401 as const,
  body: { error: UNAUTHORIZED_ERROR },
};

const createClientToken = async () => {
  const store = createMemoryAuthTokenStore();
  const rawToken = await createToken(
    { clientId: TEST_CLIENT_A_ID, now: CREATED_AT, ttlDays: 14 },
    store,
  );
  return { store, rawToken };
};

const requirePrivate = (props: {
  authorizationHeader: string | null;
  now?: Date;
  authRequired?: boolean;
  store: ReturnType<typeof createMemoryAuthTokenStore>;
  method?: string;
  pathname?: string;
}) => {
  const {
    authorizationHeader,
    now = CREATED_AT,
    authRequired = true,
    store,
    method = "GET",
    pathname = PRIVATE_PATH,
  } = props;
  return requireAuth(
    {
      authorizationHeader,
      now,
      authRequired,
      method,
      pathname,
    },
    store,
  );
};

const authenticatedFrom = async (): Promise<{
  store: ReturnType<typeof createMemoryAuthTokenStore>;
  rawToken: string;
  auth: RequireAuthAuthenticated;
}> => {
  const { store, rawToken } = await createClientToken();
  const auth = await requirePrivate({
    authorizationHeader: bearer(rawToken),
    store,
  });
  if (!isRequireAuthOk(auth) || auth.skipped) {
    throw new Error("expected a valid token");
  }
  return { store, rawToken, auth };
};

describe("requireAuth", () => {
  it("should return 401 when a private route has no token", async () => {
    const result = await requirePrivate({
      authorizationHeader: null,
      store: createMemoryAuthTokenStore(),
    });

    assert.deepEqual(result, unauthorized);
  });

  it("should skip the check when the path is in a test-only public allowlist", async () => {
    const publicRoutes = addPublicApiRoute({ pathname: TEST_PUBLIC_PATH });
    const result = await requireAuth(
      {
        authorizationHeader: null,
        now: CREATED_AT,
        authRequired: true,
        method: "GET",
        pathname: TEST_PUBLIC_PATH,
        publicRoutes,
      },
      createMemoryAuthTokenStore(),
    );

    assert.deepEqual(result, { ok: true, skipped: true });
  });

  it("should return 401 when the token is revoked", async () => {
    const { store, rawToken, auth } = await authenticatedFrom();
    await handleAuthRevokeRequest({ auth, now: CREATED_AT }, store);
    const result = await requirePrivate({
      authorizationHeader: bearer(rawToken),
      store,
    });

    assert.deepEqual(result, unauthorized);
  });

  it("should skip the check when the method is OPTIONS", async () => {
    const result = await requirePrivate({
      authorizationHeader: null,
      method: "OPTIONS",
      store: createMemoryAuthTokenStore(),
    });

    assert.deepEqual(result, { ok: true, skipped: true });
  });

  it("should skip the check when auth is not required", async () => {
    const result = await requirePrivate({
      authorizationHeader: null,
      authRequired: false,
      store: createMemoryAuthTokenStore(),
    });

    assert.deepEqual(result, { ok: true, skipped: true });
  });

  it("should return the token client when a private route has a valid token", async () => {
    const { store, rawToken } = await createClientToken();
    const result = await requirePrivate({
      authorizationHeader: bearer(rawToken),
      store,
    });

    assert.equal(
      isRequireAuthOk(result) && !result.skipped ? result.clientId : null,
      TEST_CLIENT_A_ID,
    );
  });

  it("should return 401 when now is after day 14", async () => {
    const { store, rawToken } = await createClientToken();
    const result = await requirePrivate({
      authorizationHeader: bearer(rawToken),
      now: AFTER_DAY_14,
      store,
    });

    assert.deepEqual(result, unauthorized);
  });
});

describe("API OPTIONS handlers", () => {
  it("should return 204 from hit-rate OPTIONS without a token", async () => {
    const response = await hitRateOptions();

    assert.equal(response.status, 204);
  });

  it("should return 204 from watchlist OPTIONS without a token", async () => {
    const response = await watchlistOptions();

    assert.equal(response.status, 204);
  });

  it("should return 204 from revoke OPTIONS without a token", async () => {
    const response = await revokeOptions();

    assert.equal(response.status, 204);
  });
});
