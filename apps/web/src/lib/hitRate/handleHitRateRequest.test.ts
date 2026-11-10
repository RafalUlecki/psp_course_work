import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { MS_PER_DAY } from "../auth/constants";
import { createToken } from "../auth/createToken";
import { UNAUTHORIZED_ERROR } from "../auth/errors";
import { handleAuthRevokeRequest } from "../auth/handleAuthRevokeRequest";
import { createMemoryAuthTokenStore } from "../auth/memoryAuthTokenStore";
import { TEST_CLIENT_A_ID } from "../clients/constants";
import {
  SAMPLE_HIT_RATE_PLAYER_ID,
  sampleHitRateGames,
} from "./fixtures/sampleGames";
import { getHitRate } from "./getHitRate";
import { handleHitRateRequest } from "./handleHitRateRequest";
import type { GameLogLoader } from "./types/getHitRate";

const CREATED_AT = new Date("2026-01-01T00:00:00.000Z");
const DAY_13 = new Date(CREATED_AT.getTime() + 13 * MS_PER_DAY);
const AFTER_DAY_14 = new Date(CREATED_AT.getTime() + 14 * MS_PER_DAY + 1);

const requiredParams = new URLSearchParams({
  playerId: SAMPLE_HIT_RATE_PLAYER_ID,
  stat: "PTS",
  line: "24.5",
  lastN: "10",
});

const loadFixtureGames: GameLogLoader = async () => sampleHitRateGames;

const bearer = (rawToken: string): string => `Bearer ${rawToken}`;

const createClientToken = async () => {
  const store = createMemoryAuthTokenStore();
  const rawToken = await createToken(
    { clientId: TEST_CLIENT_A_ID, now: CREATED_AT, ttlDays: 14 },
    store,
  );
  return { store, rawToken };
};

const hitRateWithAuth = (props: {
  authorizationHeader: string | null;
  now?: Date;
  authRequired?: boolean;
  store: ReturnType<typeof createMemoryAuthTokenStore>;
}) => {
  const { authorizationHeader, now = CREATED_AT, authRequired, store } = props;
  return handleHitRateRequest(
    {
      authorizationHeader,
      searchParams: requiredParams,
      now,
      authRequired,
    },
    store,
    loadFixtureGames,
  );
};

describe("handleHitRateRequest", () => {
  it("should return 401 when the Authorization header is missing", async () => {
    const { store } = await createClientToken();
    const result = await hitRateWithAuth({
      authorizationHeader: null,
      store,
    });

    assert.deepEqual(result, {
      status: 401,
      body: { error: UNAUTHORIZED_ERROR },
    });
  });

  it("should return 401 when the Authorization header is malformed", async () => {
    const { store } = await createClientToken();
    const result = await hitRateWithAuth({
      authorizationHeader: "Bearer",
      store,
    });

    assert.deepEqual(result, {
      status: 401,
      body: { error: UNAUTHORIZED_ERROR },
    });
  });

  it("should return 401 when the token is expired", async () => {
    const { store, rawToken } = await createClientToken();
    const result = await hitRateWithAuth({
      authorizationHeader: bearer(rawToken),
      now: AFTER_DAY_14,
      store,
    });

    assert.deepEqual(result, {
      status: 401,
      body: { error: UNAUTHORIZED_ERROR },
    });
  });

  it("should return 401 when the token is revoked", async () => {
    const { store, rawToken } = await createClientToken();
    await handleAuthRevokeRequest(
      { authorizationHeader: bearer(rawToken), now: CREATED_AT },
      store,
    );
    const result = await hitRateWithAuth({
      authorizationHeader: bearer(rawToken),
      store,
    });

    assert.deepEqual(result, {
      status: 401,
      body: { error: UNAUTHORIZED_ERROR },
    });
  });

  it("should return the same hit-rate body as getHitRate when the token is valid", async () => {
    const { store, rawToken } = await createClientToken();
    const authed = await hitRateWithAuth({
      authorizationHeader: bearer(rawToken),
      store,
    });
    const unauthed = await getHitRate(
      { searchParams: requiredParams },
      loadFixtureGames,
    );

    assert.deepEqual(authed, unauthed);
  });

  it("should return 200 when now is 13 days after token creation", async () => {
    const { store, rawToken } = await createClientToken();
    const result = await hitRateWithAuth({
      authorizationHeader: bearer(rawToken),
      now: DAY_13,
      store,
    });

    assert.equal(result.status, 200);
  });

  it("should return 401 when now is after day 14", async () => {
    const { store, rawToken } = await createClientToken();
    const result = await hitRateWithAuth({
      authorizationHeader: bearer(rawToken),
      now: AFTER_DAY_14,
      store,
    });

    assert.equal(result.status, 401);
  });

  it("should return 200 without a token when auth is not required", async () => {
    const result = await hitRateWithAuth({
      authorizationHeader: null,
      authRequired: false,
      store: createMemoryAuthTokenStore(),
    });

    assert.equal(result.status, 200);
  });
});
