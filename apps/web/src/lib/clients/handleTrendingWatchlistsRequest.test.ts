import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { FORBIDDEN_ERROR } from "../auth/errors";
import type {
  RequireAuthAuthenticated,
  RequireAuthSkipped,
} from "../auth/types/requireAuth";
import type { UserRole } from "../auth/types/userRole";
import type {
  WatchlistItemRecord,
  WatchlistStore,
} from "../watchlist/types/watchlistStore";
import { TEST_CLIENT_A_ID, TEST_CLIENT_B_ID } from "./constants";
import { INVALID_TRENDING_LIMIT_ERROR } from "./errors";
import { handleTrendingWatchlistsRequest } from "./handleTrendingWatchlistsRequest";

const PLAYER_SHARED = 203999;
const PLAYER_A_ONLY = 1628369;
const PLAYER_B_ONLY = 1629029;

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

const skippedAuth: RequireAuthSkipped = { ok: true, skipped: true };

const createMemoryWatchlistStore = (
  items: WatchlistItemRecord[],
): WatchlistStore => {
  const state = { items: items.map((item) => ({ ...item })) };

  return {
    findClientById: async () => null,
    playerExists: async () => false,
    listByOwner: async () => [],
    listByClientId: async (clientId) =>
      state.items.filter((item) => item.clientId === clientId),
    countPlayersByClientId: async (clientId) => {
      const counts = new Map<number, number>();
      for (const item of state.items) {
        if (item.clientId !== clientId) {
          continue;
        }
        counts.set(item.playerId, (counts.get(item.playerId) ?? 0) + 1);
      }
      return [...counts.entries()].map(([playerId, count]) => ({
        playerId,
        count,
      }));
    },
    findItem: async () => null,
    findItemById: async () => null,
    createItem: async () => {
      throw new Error("unused");
    },
    deleteItem: async () => false,
    deleteItemById: async () => false,
  };
};

const trendingStore = (): WatchlistStore =>
  createMemoryWatchlistStore([
    {
      id: 1,
      userId: "user-A-admin",
      clientId: TEST_CLIENT_A_ID,
      playerId: PLAYER_SHARED,
    },
    {
      id: 2,
      userId: "user-A-member",
      clientId: TEST_CLIENT_A_ID,
      playerId: PLAYER_SHARED,
    },
    {
      id: 3,
      userId: "user-A-member",
      clientId: TEST_CLIENT_A_ID,
      playerId: PLAYER_A_ONLY,
    },
    {
      id: 4,
      userId: "user-B-admin",
      clientId: TEST_CLIENT_B_ID,
      playerId: PLAYER_SHARED,
    },
    {
      id: 5,
      userId: "user-B-admin",
      clientId: TEST_CLIENT_B_ID,
      playerId: PLAYER_B_ONLY,
    },
  ]);

describe("handleTrendingWatchlistsRequest", () => {
  it("should count watchlisted players across users in the caller's client only", async () => {
    const result = await handleTrendingWatchlistsRequest(
      {
        auth: authFor(TEST_CLIENT_A_ID, "admin"),
        searchParams: new URLSearchParams(),
      },
      trendingStore(),
    );

    assert.deepEqual(
      result.status === 200 ? result.body : null,
      {
        clientId: TEST_CLIENT_A_ID,
        players: [
          { playerId: PLAYER_SHARED, count: 2 },
          { playerId: PLAYER_A_ONLY, count: 1 },
        ],
      },
    );
  });

  it("should return 403 when a member requests trending watchlists", async () => {
    const result = await handleTrendingWatchlistsRequest(
      {
        auth: authFor(TEST_CLIENT_A_ID, "member"),
        searchParams: new URLSearchParams(),
      },
      trendingStore(),
    );

    assert.deepEqual(result, {
      status: 403,
      body: { error: FORBIDDEN_ERROR },
    });
  });

  it("should exclude other clients when ranking trending players", async () => {
    const result = await handleTrendingWatchlistsRequest(
      {
        auth: authFor(TEST_CLIENT_A_ID, "admin"),
        searchParams: new URLSearchParams(),
      },
      trendingStore(),
    );
    const playerIds =
      result.status === 200
        ? result.body.players.map((row) => row.playerId)
        : [];

    assert.equal(playerIds.includes(PLAYER_B_ONLY), false);
  });

  it("should return 400 when limit is greater than 50", async () => {
    const result = await handleTrendingWatchlistsRequest(
      {
        auth: authFor(TEST_CLIENT_A_ID, "admin"),
        searchParams: new URLSearchParams({ limit: "51" }),
      },
      trendingStore(),
    );

    assert.deepEqual(result, {
      status: 400,
      body: { error: INVALID_TRENDING_LIMIT_ERROR },
    });
  });

  it("should return 400 when limit is not an integer", async () => {
    const result = await handleTrendingWatchlistsRequest(
      {
        auth: authFor(TEST_CLIENT_A_ID, "admin"),
        searchParams: new URLSearchParams({ limit: "abc" }),
      },
      trendingStore(),
    );

    assert.deepEqual(result, {
      status: 400,
      body: { error: INVALID_TRENDING_LIMIT_ERROR },
    });
  });

  it("should apply the limit when ranking trending players", async () => {
    const result = await handleTrendingWatchlistsRequest(
      {
        auth: authFor(TEST_CLIENT_A_ID, "admin"),
        searchParams: new URLSearchParams({ limit: "1" }),
      },
      trendingStore(),
    );

    assert.deepEqual(
      result.status === 200 ? result.body.players : null,
      [{ playerId: PLAYER_SHARED, count: 2 }],
    );
  });

  it("should return 401 when auth was skipped", async () => {
    const result = await handleTrendingWatchlistsRequest(
      {
        auth: skippedAuth,
        searchParams: new URLSearchParams(),
      },
      trendingStore(),
    );

    assert.equal(result.status, 401);
  });
});
