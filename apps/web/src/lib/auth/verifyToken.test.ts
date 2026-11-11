import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";

import { TEST_CLIENT_A_ID } from "../clients/constants";
import { MS_PER_DAY } from "./constants";
import { createToken } from "./createToken";
import { createMemoryAuthTokenStore } from "./memoryAuthTokenStore";
import { hashToken } from "./tokenSecret";
import { verifyToken } from "./verifyToken";

const CREATED_AT = new Date("2026-01-01T00:00:00.000Z");
const DAY_13 = new Date(CREATED_AT.getTime() + 13 * MS_PER_DAY);
const AFTER_DAY_14 = new Date(CREATED_AT.getTime() + 14 * MS_PER_DAY + 1);
const TEST_USER_A_ID = "user-a";

const bearer = (rawToken: string): string => `Bearer ${rawToken}`;

const createClientToken = async () => {
  const store = createMemoryAuthTokenStore();
  const rawToken = await createToken(
    {
      userId: TEST_USER_A_ID,
      clientId: TEST_CLIENT_A_ID,
      now: CREATED_AT,
      ttlDays: 14,
    },
    store,
  );
  return { store, rawToken };
};

describe("verifyToken", () => {
  it("should return the token client when the bearer token is valid", async () => {
    const { store, rawToken } = await createClientToken();
    const result = await verifyToken(
      { authorizationHeader: bearer(rawToken), now: CREATED_AT },
      store,
    );

    assert.deepEqual(
      result.ok
        ? { userId: result.userId, clientId: result.clientId }
        : null,
      { userId: TEST_USER_A_ID, clientId: TEST_CLIENT_A_ID },
    );
  });

  it("should fail when the Authorization header is missing", async () => {
    const { store } = await createClientToken();
    const result = await verifyToken(
      { authorizationHeader: null, now: CREATED_AT },
      store,
    );

    assert.equal(result.ok, false);
  });

  it("should fail when the Authorization header is malformed", async () => {
    const { store } = await createClientToken();
    const result = await verifyToken(
      { authorizationHeader: "Basic abc", now: CREATED_AT },
      store,
    );

    assert.equal(result.ok, false);
  });

  it("should fail when the token is expired", async () => {
    const { store, rawToken } = await createClientToken();
    const result = await verifyToken(
      { authorizationHeader: bearer(rawToken), now: AFTER_DAY_14 },
      store,
    );

    assert.equal(result.ok, false);
  });

  it("should fail when the token is revoked", async () => {
    const { store, rawToken } = await createClientToken();
    await store.revokeByTokenHash(hashToken(rawToken), CREATED_AT);
    const result = await verifyToken(
      { authorizationHeader: bearer(rawToken), now: CREATED_AT },
      store,
    );

    assert.equal(result.ok, false);
  });

  it("should accept the token when now is 13 days after creation", async () => {
    const { store, rawToken } = await createClientToken();
    const result = await verifyToken(
      { authorizationHeader: bearer(rawToken), now: DAY_13 },
      store,
    );

    assert.equal(result.ok, true);
  });

  it("should reject the token when now is after day 14", async () => {
    const { store, rawToken } = await createClientToken();
    const result = await verifyToken(
      { authorizationHeader: bearer(rawToken), now: AFTER_DAY_14 },
      store,
    );

    assert.equal(result.ok, false);
  });

  it("should store the sha256 hash of the raw token instead of the raw token", async () => {
    const { store, rawToken } = await createClientToken();
    const record = await store.findByTokenHash(hashToken(rawToken));

    assert.equal(
      record?.tokenHash,
      createHash("sha256").update(rawToken).digest("hex"),
    );
  });
});
