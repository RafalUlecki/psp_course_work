import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import { OPTIONS as loginOptions } from "../../../app/api/auth/login/route";
import { OPTIONS as revokeOptions } from "../../../app/api/auth/revoke/route";
import { OPTIONS as clientWatchlistsOptions } from "../../../app/api/client/watchlists/route";
import { OPTIONS as trendingWatchlistsOptions } from "../../../app/api/client/watchlists/trending/route";
import { OPTIONS as hitRateOptions } from "../../../app/api/hit-rate/route";
import { OPTIONS as watchlistOptions } from "../../../app/api/watchlist/route";
import { TEST_CLIENT_A_ID } from "../clients/constants";
import { MS_PER_DAY } from "./constants";
import { createToken } from "./createToken";
import { UNAUTHORIZED_ERROR } from "./errors";
import { handleAuthRevokeRequest } from "./handleAuthRevokeRequest";
import { createMemoryAuthTokenStore } from "./memoryAuthTokenStore";
import { createMemoryUserStore } from "./memoryUserStore";
import { hashPassword } from "./passwordHash";
import { addPublicApiRoute, LOGIN_API_PATH } from "./publicApiRoutes";
import { isRequireAuthOk, requireAuth } from "./requireAuth";
import type { RequireAuthAuthenticated } from "./types/requireAuth";
import type { UserRole } from "./types/userRole";
import type { UserStore } from "./types/userStore";

const CREATED_AT = new Date("2026-01-01T00:00:00.000Z");
const AFTER_DAY_14 = new Date(CREATED_AT.getTime() + 14 * MS_PER_DAY + 1);
const PRIVATE_PATH = "/api/hit-rate";
const TEST_PUBLIC_PATH = "/api/test-public";

const bearer = (rawToken: string): string => `Bearer ${rawToken}`;

const unauthorized = {
  status: 401 as const,
  body: { error: UNAUTHORIZED_ERROR },
};

interface SeedAuthProps {
  clientId?: string;
  role?: UserRole;
  email?: string;
}

const seedAuth = async (props: SeedAuthProps = {}) => {
  const {
    clientId = TEST_CLIENT_A_ID,
    role = "admin",
    email = `user-${clientId}@test.local`,
  } = props;
  const tokenStore = createMemoryAuthTokenStore();
  const userStore = createMemoryUserStore();
  const user = await userStore.insert({
    id: randomUUID(),
    email,
    passwordHash: await hashPassword({ password: "password" }),
    clientId,
    role,
  });
  const rawToken = await createToken(
    {
      userId: user.id,
      clientId: user.clientId,
      now: CREATED_AT,
      ttlDays: 14,
    },
    tokenStore,
  );
  return { tokenStore, userStore, user, rawToken };
};

const requirePrivate = (props: {
  authorizationHeader: string | null;
  now?: Date;
  authRequired?: boolean;
  tokenStore: ReturnType<typeof createMemoryAuthTokenStore>;
  userStore: UserStore;
  method?: string;
  pathname?: string;
}) => {
  const {
    authorizationHeader,
    now = CREATED_AT,
    authRequired = true,
    tokenStore,
    userStore,
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
    tokenStore,
    userStore,
  );
};

const authenticatedFrom = async (): Promise<{
  tokenStore: ReturnType<typeof createMemoryAuthTokenStore>;
  userStore: UserStore;
  rawToken: string;
  auth: RequireAuthAuthenticated;
}> => {
  const seeded = await seedAuth();
  const auth = await requirePrivate({
    authorizationHeader: bearer(seeded.rawToken),
    tokenStore: seeded.tokenStore,
    userStore: seeded.userStore,
  });
  if (!isRequireAuthOk(auth) || auth.skipped) {
    throw new Error("expected a valid token");
  }
  return {
    tokenStore: seeded.tokenStore,
    userStore: seeded.userStore,
    rawToken: seeded.rawToken,
    auth,
  };
};

describe("requireAuth", () => {
  it("should return 401 when a private route has no token", async () => {
    const result = await requirePrivate({
      authorizationHeader: null,
      tokenStore: createMemoryAuthTokenStore(),
      userStore: createMemoryUserStore(),
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
      createMemoryUserStore(),
    );

    assert.deepEqual(result, { ok: true, skipped: true });
  });

  it("should skip the check when the path is the login route", async () => {
    const result = await requireAuth(
      {
        authorizationHeader: null,
        now: CREATED_AT,
        authRequired: true,
        method: "POST",
        pathname: LOGIN_API_PATH,
      },
      createMemoryAuthTokenStore(),
      createMemoryUserStore(),
    );

    assert.deepEqual(result, { ok: true, skipped: true });
  });

  it("should return 401 when the token is revoked", async () => {
    const { tokenStore, userStore, rawToken, auth } = await authenticatedFrom();
    await handleAuthRevokeRequest({ auth, now: CREATED_AT }, tokenStore);
    const result = await requirePrivate({
      authorizationHeader: bearer(rawToken),
      tokenStore,
      userStore,
    });

    assert.deepEqual(result, unauthorized);
  });

  it("should skip the check when the method is OPTIONS", async () => {
    const result = await requirePrivate({
      authorizationHeader: null,
      method: "OPTIONS",
      tokenStore: createMemoryAuthTokenStore(),
      userStore: createMemoryUserStore(),
    });

    assert.deepEqual(result, { ok: true, skipped: true });
  });

  it("should skip the check when auth is not required", async () => {
    const result = await requirePrivate({
      authorizationHeader: null,
      authRequired: false,
      tokenStore: createMemoryAuthTokenStore(),
      userStore: createMemoryUserStore(),
    });

    assert.deepEqual(result, { ok: true, skipped: true });
  });

  it("should return the session user, client and role when a private route has a valid token", async () => {
    const seeded = await seedAuth({ role: "member" });
    const result = await requirePrivate({
      authorizationHeader: bearer(seeded.rawToken),
      tokenStore: seeded.tokenStore,
      userStore: seeded.userStore,
    });

    assert.deepEqual(
      isRequireAuthOk(result) && !result.skipped
        ? {
            userId: result.userId,
            clientId: result.clientId,
            role: result.role,
          }
        : null,
      {
        userId: seeded.user.id,
        clientId: TEST_CLIENT_A_ID,
        role: "member",
      },
    );
  });

  it("should return 401 when the token user no longer exists", async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const rawToken = await createToken(
      {
        userId: randomUUID(),
        clientId: TEST_CLIENT_A_ID,
        now: CREATED_AT,
        ttlDays: 14,
      },
      tokenStore,
    );
    const result = await requirePrivate({
      authorizationHeader: bearer(rawToken),
      tokenStore,
      userStore: createMemoryUserStore(),
    });

    assert.deepEqual(result, unauthorized);
  });

  it("should return 401 when now is after day 14", async () => {
    const seeded = await seedAuth();
    const result = await requirePrivate({
      authorizationHeader: bearer(seeded.rawToken),
      now: AFTER_DAY_14,
      tokenStore: seeded.tokenStore,
      userStore: seeded.userStore,
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

  it("should return 204 from login OPTIONS without a token", async () => {
    const response = await loginOptions();

    assert.equal(response.status, 204);
  });

  it("should return 204 from client-watchlists OPTIONS without a token", async () => {
    const response = await clientWatchlistsOptions();

    assert.equal(response.status, 204);
  });

  it("should return 204 from trending-watchlists OPTIONS without a token", async () => {
    const response = await trendingWatchlistsOptions();

    assert.equal(response.status, 204);
  });
});
