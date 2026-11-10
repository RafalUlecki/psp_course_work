import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { randomUUID } from "node:crypto";

import { TEST_CLIENT_A_ID } from "../clients/constants";
import { createToken } from "./createToken";
import { UNAUTHORIZED_ERROR } from "./errors";
import { handleAuthRevokeRequest } from "./handleAuthRevokeRequest";
import { createMemoryAuthTokenStore } from "./memoryAuthTokenStore";
import { createMemoryUserStore } from "./memoryUserStore";
import { hashPassword } from "./passwordHash";
import { isRequireAuthOk, requireAuth } from "./requireAuth";
import type { RequireAuthSkipped } from "./types/requireAuth";
import { verifyToken } from "./verifyToken";

const NOW = new Date("2026-01-01T00:00:00.000Z");

const bearer = (rawToken: string): string => `Bearer ${rawToken}`;

const skippedAuth: RequireAuthSkipped = { ok: true, skipped: true };

const createAuthenticated = async () => {
  const store = createMemoryAuthTokenStore();
  const userStore = createMemoryUserStore();
  const user = await userStore.insert({
    id: randomUUID(),
    email: "admin-a@test.local",
    passwordHash: await hashPassword({ password: "password" }),
    clientId: TEST_CLIENT_A_ID,
    role: "admin",
  });
  const rawToken = await createToken(
    { userId: user.id, clientId: user.clientId, now: NOW, ttlDays: 14 },
    store,
  );
  const auth = await requireAuth(
    {
      authorizationHeader: bearer(rawToken),
      now: NOW,
      authRequired: true,
    },
    store,
    userStore,
  );
  if (!isRequireAuthOk(auth) || auth.skipped) {
    throw new Error("expected a valid token");
  }
  return { store, userStore, rawToken, auth };
};

describe("handleAuthRevokeRequest", () => {
  it("should return 401 when auth was skipped", async () => {
    const result = await handleAuthRevokeRequest(
      { auth: skippedAuth, now: NOW },
      createMemoryAuthTokenStore(),
    );

    assert.deepEqual(result, {
      status: 401,
      body: { error: UNAUTHORIZED_ERROR },
    });
  });

  it("should return revoked true when the caller token is valid", async () => {
    const { store, auth } = await createAuthenticated();
    const result = await handleAuthRevokeRequest({ auth, now: NOW }, store);

    assert.deepEqual(result, { status: 200, body: { revoked: true } });
  });

  it("should reject the token after it has been revoked", async () => {
    const { store, rawToken, auth } = await createAuthenticated();
    await handleAuthRevokeRequest({ auth, now: NOW }, store);
    const result = await verifyToken(
      { authorizationHeader: bearer(rawToken), now: NOW },
      store,
    );

    assert.equal(result.ok, false);
  });

  it("should return 401 when requireAuth runs again with the revoked token", async () => {
    const { store, userStore, rawToken, auth } = await createAuthenticated();
    await handleAuthRevokeRequest({ auth, now: NOW }, store);
    const result = await requireAuth(
      {
        authorizationHeader: bearer(rawToken),
        now: NOW,
        authRequired: true,
      },
      store,
      userStore,
    );

    assert.deepEqual(result, {
      status: 401,
      body: { error: UNAUTHORIZED_ERROR },
    });
  });
});
