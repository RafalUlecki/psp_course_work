import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
  RequireAuthAuthenticated,
  RequireAuthSkipped,
} from "../auth/types/requireAuth";
import type { UserRole } from "../auth/types/userRole";
import { createMemoryClientSettingsStore } from "../clientSettings/memoryClientSettingsStore";
import type { ClientSettingsStore } from "../clientSettings/types/clientSettingsStore";
import { TEST_CLIENT_A_ID, TEST_CLIENT_B_ID } from "../clients/constants";
import {
  SAMPLE_HIT_RATE_PLAYER_ID,
  sampleHitRateGames,
} from "./fixtures/sampleGames";
import { getHitRate } from "./getHitRate";
import { handleHitRateRequest } from "./handleHitRateRequest";
import type { GameLogLoader } from "./types/getHitRate";

const requiredParams = new URLSearchParams({
  playerId: SAMPLE_HIT_RATE_PLAYER_ID,
  stat: "PTS",
  line: "24.5",
  lastN: "10",
});

const hitRateParamsWithoutLastN = new URLSearchParams({
  playerId: SAMPLE_HIT_RATE_PLAYER_ID,
  stat: "PTS",
  line: "24.5",
});

const loadFixtureGames: GameLogLoader = async () => sampleHitRateGames;

const skippedAuth: RequireAuthSkipped = { ok: true, skipped: true };

const authFor = (
  clientId: string,
  role: UserRole,
): RequireAuthAuthenticated => ({
  ok: true,
  skipped: false,
  userId: `user-${clientId}-${role}`,
  clientId,
  role,
  tokenHash: `hash-${clientId}-${role}`,
});

const seededSettings = (): ClientSettingsStore =>
  createMemoryClientSettingsStore([
    { clientId: TEST_CLIENT_A_ID, defaultLastN: 10 },
    { clientId: TEST_CLIENT_B_ID, defaultLastN: 10 },
  ]);

const hitRateN = async (
  clientId: string,
  store: ClientSettingsStore,
  searchParams: URLSearchParams = hitRateParamsWithoutLastN,
): Promise<number | null> => {
  const result = await handleHitRateRequest(
    { searchParams, auth: authFor(clientId, "admin") },
    loadFixtureGames,
    store,
  );

  return result.status === 200 ? result.body.n : null;
};

describe("handleHitRateRequest", () => {
  it("should return the same body as getHitRate", async () => {
    const handled = await handleHitRateRequest(
      { searchParams: requiredParams, auth: skippedAuth },
      loadFixtureGames,
    );
    const direct = await getHitRate(
      { searchParams: requiredParams },
      loadFixtureGames,
    );

    assert.deepEqual(handled, direct);
  });

  it("should use query lastN when the request includes lastN", async () => {
    const store = createMemoryClientSettingsStore([
      { clientId: TEST_CLIENT_A_ID, defaultLastN: 5 },
    ]);
    const n = await hitRateN(TEST_CLIENT_A_ID, store, requiredParams);

    assert.equal(n, 10);
  });

  it("should apply the client defaultLastN when lastN is omitted", async () => {
    const store = createMemoryClientSettingsStore([
      { clientId: TEST_CLIENT_A_ID, defaultLastN: 5 },
    ]);
    const n = await hitRateN(TEST_CLIENT_A_ID, store);

    assert.equal(n, 5);
  });

  it("should return a different hit-rate n for client A after A's defaultLastN changes", async () => {
    const store = seededSettings();
    const before = await hitRateN(TEST_CLIENT_A_ID, store);
    await store.upsertByClientId(TEST_CLIENT_A_ID, 5);
    const after = await hitRateN(TEST_CLIENT_A_ID, store);

    assert.deepEqual({ before, after }, { before: 10, after: 5 });
  });

  it("should return the same hit-rate n for client B after A's defaultLastN changes", async () => {
    const store = seededSettings();
    const before = await hitRateN(TEST_CLIENT_B_ID, store);
    await store.upsertByClientId(TEST_CLIENT_A_ID, 5);
    const after = await hitRateN(TEST_CLIENT_B_ID, store);

    assert.deepEqual({ before, after }, { before: 10, after: 10 });
  });
});
