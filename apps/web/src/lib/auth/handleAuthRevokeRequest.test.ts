import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { TEST_CLIENT_A_ID } from "../clients/constants";
import { createToken } from "./createToken";
import { UNAUTHORIZED_ERROR } from "./errors";
import { handleAuthRevokeRequest } from "./handleAuthRevokeRequest";
import { createMemoryAuthTokenStore } from "./memoryAuthTokenStore";
import { verifyToken } from "./verifyToken";

const NOW = new Date("2026-01-01T00:00:00.000Z");

const bearer = (rawToken: string): string => `Bearer ${rawToken}`;

const createClientToken = async () => {
  const store = createMemoryAuthTokenStore();
  const rawToken = await createToken(
    { clientId: TEST_CLIENT_A_ID, now: NOW, ttlDays: 14 },
    store,
  );
  return { store, rawToken };
};

describe("handleAuthRevokeRequest", () => {
  it("should return 401 when the Authorization header is missing", async () => {
    const result = await handleAuthRevokeRequest(
      { authorizationHeader: null, now: NOW },
      createMemoryAuthTokenStore(),
    );

    assert.deepEqual(result, {
      status: 401,
      body: { error: UNAUTHORIZED_ERROR },
    });
  });

  it("should return revoked true when the caller token is valid", async () => {
    const { store, rawToken } = await createClientToken();
    const result = await handleAuthRevokeRequest(
      { authorizationHeader: bearer(rawToken), now: NOW },
      store,
    );

    assert.deepEqual(result, { status: 200, body: { revoked: true } });
  });

  it("should reject the token after it has been revoked", async () => {
    const { store, rawToken } = await createClientToken();
    await handleAuthRevokeRequest(
      { authorizationHeader: bearer(rawToken), now: NOW },
      store,
    );
    const result = await verifyToken(
      { authorizationHeader: bearer(rawToken), now: NOW },
      store,
    );

    assert.equal(result.ok, false);
  });

  it("should return 401 when revoke is called again with the same token", async () => {
    const { store, rawToken } = await createClientToken();
    await handleAuthRevokeRequest(
      { authorizationHeader: bearer(rawToken), now: NOW },
      store,
    );
    const result = await handleAuthRevokeRequest(
      { authorizationHeader: bearer(rawToken), now: NOW },
      store,
    );

    assert.deepEqual(result, {
      status: 401,
      body: { error: UNAUTHORIZED_ERROR },
    });
  });
});
