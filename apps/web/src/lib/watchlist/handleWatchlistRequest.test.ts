import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createToken } from "../auth/createToken";
import { UNAUTHORIZED_ERROR } from "../auth/errors";
import { handleAuthRevokeRequest } from "../auth/handleAuthRevokeRequest";
import { createMemoryAuthTokenStore } from "../auth/memoryAuthTokenStore";
import type { AuthTokenStore } from "../auth/types/authTokenStore";
import {
  CLIENT_ID_HEADER,
  TEST_CLIENT_A_ID,
  TEST_CLIENT_A_NAME,
  TEST_CLIENT_B_ID,
  TEST_CLIENT_B_NAME,
} from "../clients/constants";
import { MISSING_CLIENT_ID_ERROR } from "../clients/errors";
import { handleWatchlistRequest } from "./handleWatchlistRequest";
import {
  MISSING_PLAYER_ID_ERROR,
  PLAYER_NOT_FOUND_ERROR,
} from "./errors";
import type { WatchlistHttpResult } from "./types/api";
import type {
  WatchlistItemRecord,
  WatchlistStore,
} from "./types/watchlistStore";

const CLIENT_A_PLAYER_ID = 203999;
const CLIENT_B_PLAYER_ID = 1629029;
const SHARED_PLAYER_ID = 1630559;
const NOW = new Date("2026-01-01T00:00:00.000Z");

interface MemoryStoreState {
  items: WatchlistItemRecord[];
}

const createMemoryStore = (props: {
  items?: WatchlistItemRecord[];
  players?: number[];
}): WatchlistStore => {
  const { items = [], players = [] } = props;
  const state: MemoryStoreState = {
    items: items.map((item) => ({ ...item })),
  };
  const playerIds = new Set(players);
  let nextId =
    state.items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const clients = [
    { id: TEST_CLIENT_A_ID, name: TEST_CLIENT_A_NAME },
    { id: TEST_CLIENT_B_ID, name: TEST_CLIENT_B_NAME },
  ];

  return {
    findClientById: async (clientId) =>
      clients.find((client) => client.id === clientId) ?? null,
    playerExists: async (playerId) => playerIds.has(playerId),
    listByClientId: async (clientId) =>
      state.items.filter((item) => item.clientId === clientId),
    findItem: async (clientId, playerId) =>
      state.items.find(
        (item) => item.clientId === clientId && item.playerId === playerId,
      ) ?? null,
    createItem: async (clientId, playerId) => {
      const item = { id: nextId, clientId, playerId };
      nextId += 1;
      state.items.push(item);
      return item;
    },
    deleteItem: async (clientId, playerId) => {
      const index = state.items.findIndex(
        (item) => item.clientId === clientId && item.playerId === playerId,
      );
      if (index === -1) {
        return false;
      }
      state.items.splice(index, 1);
      return true;
    },
  };
};

const seededStore = (): WatchlistStore =>
  createMemoryStore({
    items: [
      { id: 1, clientId: TEST_CLIENT_A_ID, playerId: CLIENT_A_PLAYER_ID },
      { id: 2, clientId: TEST_CLIENT_B_ID, playerId: CLIENT_B_PLAYER_ID },
    ],
    players: [CLIENT_A_PLAYER_ID, CLIENT_B_PLAYER_ID, SHARED_PLAYER_ID],
  });

const bearerHeaders = (
  rawToken: string,
  extra?: Record<string, string>,
): Headers => {
  const headers = new Headers(extra);
  headers.set("Authorization", `Bearer ${rawToken}`);
  return headers;
};

const createAuth = async () => {
  const authStore = createMemoryAuthTokenStore();
  const tokenA = await createToken(
    { clientId: TEST_CLIENT_A_ID, now: NOW, ttlDays: 14 },
    authStore,
  );
  const tokenB = await createToken(
    { clientId: TEST_CLIENT_B_ID, now: NOW, ttlDays: 14 },
    authStore,
  );
  return { authStore, tokenA, tokenB };
};

const listRequest = (
  rawToken: string,
  watchlistStore: WatchlistStore,
  authStore: AuthTokenStore,
) =>
  handleWatchlistRequest(
    {
      method: "GET",
      headers: bearerHeaders(rawToken),
      searchParams: new URLSearchParams(),
      bodyText: "",
      now: NOW,
    },
    watchlistStore,
    authStore,
  );

const listPlayerIds = (result: WatchlistHttpResult): number[] | null => {
  if (result.status !== 200 || !("items" in result.body)) {
    return null;
  }
  return result.body.items.map((item) => item.playerId);
};

const errorMessage = (result: WatchlistHttpResult): string | null =>
  result.status === 400 || result.status === 401 || result.status === 405
    ? result.body.error
    : null;

describe("handleWatchlistRequest", () => {
  it("should return 401 when the Authorization header is missing", async () => {
    const { authStore } = await createAuth();
    const result = await handleWatchlistRequest(
      {
        method: "GET",
        headers: new Headers(),
        searchParams: new URLSearchParams(),
        bodyText: "",
        now: NOW,
      },
      seededStore(),
      authStore,
    );

    assert.equal(result.status, 401);
  });

  it("should return unauthorized when the Authorization header is missing", async () => {
    const { authStore } = await createAuth();
    const result = await handleWatchlistRequest(
      {
        method: "GET",
        headers: new Headers(),
        searchParams: new URLSearchParams(),
        bodyText: "",
        now: NOW,
      },
      seededStore(),
      authStore,
    );

    assert.equal(errorMessage(result), UNAUTHORIZED_ERROR);
  });

  it("should return 401 when the bearer token is unknown", async () => {
    const { authStore } = await createAuth();
    const result = await listRequest(
      "unknown-token",
      seededStore(),
      authStore,
    );

    assert.equal(result.status, 401);
  });

  it("should return unauthorized when the bearer token is unknown", async () => {
    const { authStore } = await createAuth();
    const result = await listRequest(
      "unknown-token",
      seededStore(),
      authStore,
    );

    assert.equal(errorMessage(result), UNAUTHORIZED_ERROR);
  });

  it("should return only client A player ids when listing with A's token", async () => {
    const { authStore, tokenA } = await createAuth();
    const result = await listRequest(tokenA, seededStore(), authStore);

    assert.deepEqual(listPlayerIds(result), [CLIENT_A_PLAYER_ID]);
  });

  it("should return only client B player ids when listing with B's token", async () => {
    const { authStore, tokenB } = await createAuth();
    const result = await listRequest(tokenB, seededStore(), authStore);

    assert.deepEqual(listPlayerIds(result), [CLIENT_B_PLAYER_ID]);
  });

  it("should ignore X-Client-Id when a token is present", async () => {
    const { authStore, tokenA } = await createAuth();
    const result = await handleWatchlistRequest(
      {
        method: "GET",
        headers: bearerHeaders(tokenA, { [CLIENT_ID_HEADER]: TEST_CLIENT_B_ID }),
        searchParams: new URLSearchParams(),
        bodyText: "",
        now: NOW,
      },
      seededStore(),
      authStore,
    );

    assert.deepEqual(listPlayerIds(result), [CLIENT_A_PLAYER_ID]);
  });

  it("should create a watchlist row for client A when A posts a player id", async () => {
    const store = seededStore();
    const { authStore, tokenA } = await createAuth();
    const result = await handleWatchlistRequest(
      {
        method: "POST",
        headers: bearerHeaders(tokenA),
        searchParams: new URLSearchParams(),
        bodyText: JSON.stringify({ playerId: SHARED_PLAYER_ID }),
        now: NOW,
      },
      store,
      authStore,
    );

    assert.deepEqual(result, {
      status: 201,
      body: { clientId: TEST_CLIENT_A_ID, playerId: SHARED_PLAYER_ID },
    });
  });

  it("should keep client B player ids when client A adds a player", async () => {
    const store = seededStore();
    const { authStore, tokenA, tokenB } = await createAuth();
    await handleWatchlistRequest(
      {
        method: "POST",
        headers: bearerHeaders(tokenA),
        searchParams: new URLSearchParams(),
        bodyText: JSON.stringify({ playerId: SHARED_PLAYER_ID }),
        now: NOW,
      },
      store,
      authStore,
    );
    const result = await handleWatchlistRequest(
      {
        method: "GET",
        headers: bearerHeaders(tokenB),
        searchParams: new URLSearchParams(),
        bodyText: "",
        now: NOW,
      },
      store,
      authStore,
    );

    assert.deepEqual(listPlayerIds(result), [CLIENT_B_PLAYER_ID]);
  });

  it("should return 400 when POST has no playerId", async () => {
    const { authStore, tokenA } = await createAuth();
    const result = await handleWatchlistRequest(
      {
        method: "POST",
        headers: bearerHeaders(tokenA),
        searchParams: new URLSearchParams(),
        bodyText: "{}",
        now: NOW,
      },
      seededStore(),
      authStore,
    );

    assert.equal(errorMessage(result), MISSING_PLAYER_ID_ERROR);
  });

  it("should return a player-not-found error when POST playerId is unknown", async () => {
    const { authStore, tokenA } = await createAuth();
    const result = await handleWatchlistRequest(
      {
        method: "POST",
        headers: bearerHeaders(tokenA),
        searchParams: new URLSearchParams(),
        bodyText: JSON.stringify({ playerId: 1 }),
        now: NOW,
      },
      seededStore(),
      authStore,
    );

    assert.equal(errorMessage(result), PLAYER_NOT_FOUND_ERROR);
  });

  it("should keep client B items when client A deletes a watchlist player", async () => {
    const store = seededStore();
    const { authStore, tokenA, tokenB } = await createAuth();
    await handleWatchlistRequest(
      {
        method: "DELETE",
        headers: bearerHeaders(tokenA),
        searchParams: new URLSearchParams({
          playerId: String(CLIENT_A_PLAYER_ID),
        }),
        bodyText: "",
        now: NOW,
      },
      store,
      authStore,
    );
    const result = await handleWatchlistRequest(
      {
        method: "GET",
        headers: bearerHeaders(tokenB),
        searchParams: new URLSearchParams(),
        bodyText: "",
        now: NOW,
      },
      store,
      authStore,
    );

    assert.deepEqual(listPlayerIds(result), [CLIENT_B_PLAYER_ID]);
  });

  it("should return 401 on a repeat request after the token is revoked", async () => {
    const { authStore, tokenA } = await createAuth();
    await handleAuthRevokeRequest(
      { authorizationHeader: `Bearer ${tokenA}`, now: NOW },
      authStore,
    );
    const result = await listRequest(tokenA, seededStore(), authStore);

    assert.deepEqual(result, {
      status: 401,
      body: { error: UNAUTHORIZED_ERROR },
    });
  });

  it("should return 400 when auth is not required and X-Client-Id is missing", async () => {
    const result = await handleWatchlistRequest(
      {
        method: "GET",
        headers: new Headers(),
        searchParams: new URLSearchParams(),
        bodyText: "",
        now: NOW,
        authRequired: false,
      },
      seededStore(),
      createMemoryAuthTokenStore(),
    );

    assert.deepEqual(result, {
      status: 400,
      body: { error: MISSING_CLIENT_ID_ERROR },
    });
  });

  it("should list by X-Client-Id when auth is not required", async () => {
    const result = await handleWatchlistRequest(
      {
        method: "GET",
        headers: new Headers({ [CLIENT_ID_HEADER]: TEST_CLIENT_A_ID }),
        searchParams: new URLSearchParams(),
        bodyText: "",
        now: NOW,
        authRequired: false,
      },
      seededStore(),
      createMemoryAuthTokenStore(),
    );

    assert.deepEqual(listPlayerIds(result), [CLIENT_A_PLAYER_ID]);
  });
});
