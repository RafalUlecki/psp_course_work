import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { TEST_CLIENT_A_ID } from "../clients/constants";
import { createToken } from "./createToken";
import { UNAUTHORIZED_ERROR } from "./errors";
import { handleAuthRevokeRequest } from "./handleAuthRevokeRequest";
import { createMemoryAuthTokenStore } from "./memoryAuthTokenStore";
import { isRequireAuthOk, requireAuth } from "./requireAuth";
import type { RequireAuthSkipped } from "./types/requireAuth";
import { verifyToken } from "./verifyToken";

const NOW = new Date("2026-01-01T00:00:00.000Z");

const bearer = (rawToken: string): string => `Bearer ${rawToken}`;

const skippedAuth: RequireAuthSkipped = { ok: true, skipped: true };

const createAuthenticated = async () => {
  const store = createMemoryAuthTokenStore();
  const rawToken = await createToken(
    { clientId: TEST_CLIENT_A_ID, now: NOW, ttlDays: 14 },
    store,
  );
  const auth = await requireAuth(
    {
      authorizationHeader: bearer(rawToken),
      now: NOW,
      authRequired: true,
    },
    store,
  );
  if (!isRequireAuthOk(auth) || auth.skipped) {
    throw new Error("expected a valid token");
  }
  return { store, rawToken, auth };
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
    const { store, rawToken, auth } = await createAuthenticated();
    await handleAuthRevokeRequest({ auth, now: NOW }, store);
    const result = await requireAuth(
      {
        authorizationHeader: bearer(rawToken),
        now: NOW,
        authRequired: true,
      },
      store,
    );

    assert.deepEqual(result, {
      status: 401,
      body: { error: UNAUTHORIZED_ERROR },
    });
  });
});
