import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createToken } from "../auth/createToken";
import { UNAUTHORIZED_ERROR } from "../auth/errors";
import { createMemoryAuthTokenStore } from "../auth/memoryAuthTokenStore";
import type { AuthTokenStore } from "../auth/types/authTokenStore";
import {
  CLIENT_ID_HEADER,
  TEST_CLIENT_A_ID,
  TEST_CLIENT_A_NAME,
  TEST_CLIENT_B_ID,
  TEST_CLIENT_B_NAME,
} from "../clients/constants";
import { handleWatchlistRequest } from "./handleWatchlistRequest";
import type { WatchlistHttpResult } from "./types/api";
import type {
  WatchlistItemRecord,
  WatchlistStore,
} from "./types/watchlistStore";

const CLIENT_A_FIRST_PLAYER_ID = 203999;
const CLIENT_A_PLAYER_IDS = [CLIENT_A_FIRST_PLAYER_ID, 1630559, 1628369];
const NOW = new Date("2026-01-01T00:00:00.000Z");

interface MemoryStoreState {
  items: WatchlistItemRecord[];
}

interface WatchlistListSnapshot {
  status: number;
  clientId: string | null;
  playerIds: number[] | null;
}

interface CallWatchlistProps {
  method: string;
  token?: string;
  clientId?: string;
  playerId?: number;
  store: WatchlistStore;
  authStore: AuthTokenStore;
  authRequired?: boolean;
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

const isolationStore = (): WatchlistStore =>
  createMemoryStore({
    items: [],
    players: CLIENT_A_PLAYER_IDS,
  });

const callWatchlist = (
  props: CallWatchlistProps,
): Promise<WatchlistHttpResult> => {
  const {
    method,
    token,
    clientId,
    playerId,
    store,
    authStore,
    authRequired,
  } = props;
  const headers = new Headers();
  if (token !== undefined) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (clientId !== undefined) {
    headers.set(CLIENT_ID_HEADER, clientId);
  }

  const searchParams = new URLSearchParams();
  const isDelete = method === "DELETE" && playerId !== undefined;
  if (isDelete) {
    searchParams.set("playerId", String(playerId));
  }

  const bodyText =
    method === "POST" && playerId !== undefined
      ? JSON.stringify({ playerId })
      : "";

  return handleWatchlistRequest(
    { method, headers, searchParams, bodyText, now: NOW, authRequired },
    store,
    authStore,
  );
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

const starPlayersAsA = async (
  store: WatchlistStore,
  authStore: AuthTokenStore,
  tokenA: string,
): Promise<void> => {
  for (const playerId of CLIENT_A_PLAYER_IDS) {
    await callWatchlist({
      method: "POST",
      token: tokenA,
      playerId,
      store,
      authStore,
    });
  }
};

const storeWithClientAStarred = async () => {
  const store = isolationStore();
  const auth = await createAuth();
  await starPlayersAsA(store, auth.authStore, auth.tokenA);
  return { store, ...auth };
};

const deleteAPlayersAsB = (
  store: WatchlistStore,
  authStore: AuthTokenStore,
  tokenB: string,
): Promise<WatchlistHttpResult[]> =>
  Promise.all(
    CLIENT_A_PLAYER_IDS.map((playerId) =>
      callWatchlist({
        method: "DELETE",
        token: tokenB,
        playerId,
        store,
        authStore,
      }),
    ),
  );

const listSnapshot = (result: WatchlistHttpResult): WatchlistListSnapshot => {
  if (result.status !== 200 || !("items" in result.body)) {
    return { status: result.status, clientId: null, playerIds: null };
  }

  return {
    status: result.status,
    clientId: result.body.clientId,
    playerIds: result.body.items.map((item) => item.playerId),
  };
};

const aPlayerIdsIn = (playerIds: number[] | null): number[] =>
  (playerIds ?? []).filter((playerId) =>
    CLIENT_A_PLAYER_IDS.includes(playerId),
  );

describe("watchlist client isolation", () => {
  it("should return exactly A's items when listing as A after starring players", async () => {
    const { store, authStore, tokenA } = await storeWithClientAStarred();
    const result = await callWatchlist({
      method: "GET",
      token: tokenA,
      store,
      authStore,
    });

    assert.deepEqual(listSnapshot(result), {
      status: 200,
      clientId: TEST_CLIENT_A_ID,
      playerIds: CLIENT_A_PLAYER_IDS,
    });
  });

  it("should return an empty watchlist when listing as B after A stars players", async () => {
    const { store, authStore, tokenB } = await storeWithClientAStarred();
    const result = await callWatchlist({
      method: "GET",
      token: tokenB,
      store,
      authStore,
    });
    const snapshot = listSnapshot(result);

    assert.deepEqual(
      {
        status: snapshot.status,
        clientId: snapshot.clientId,
        playerIds: snapshot.playerIds,
        leakedAIds: aPlayerIdsIn(snapshot.playerIds),
      },
      {
        status: 200,
        clientId: TEST_CLIENT_B_ID,
        playerIds: [],
        leakedAIds: [],
      },
    );
  });

  it("should keep A's items when B deletes A's players", async () => {
    const { store, authStore, tokenA, tokenB } = await storeWithClientAStarred();
    await deleteAPlayersAsB(store, authStore, tokenB);
    const result = await callWatchlist({
      method: "GET",
      token: tokenA,
      store,
      authStore,
    });

    assert.deepEqual(listSnapshot(result), {
      status: 200,
      clientId: TEST_CLIENT_A_ID,
      playerIds: CLIENT_A_PLAYER_IDS,
    });
  });

  it("should omit A's payload when B deletes A's players", async () => {
    const { store, authStore, tokenB } = await storeWithClientAStarred();
    const deleteResults = await deleteAPlayersAsB(store, authStore, tokenB);
    const listResult = await callWatchlist({
      method: "GET",
      token: tokenB,
      store,
      authStore,
    });
    const list = listSnapshot(listResult);

    assert.deepEqual(
      {
        list,
        leakedAIds: aPlayerIdsIn(list.playerIds),
        deleteClientIds: deleteResults.map((result) =>
          "clientId" in result.body ? result.body.clientId : null,
        ),
        deleteHasItems: deleteResults.some((result) => "items" in result.body),
      },
      {
        list: {
          status: 200,
          clientId: TEST_CLIENT_B_ID,
          playerIds: [],
        },
        leakedAIds: [],
        deleteClientIds: CLIENT_A_PLAYER_IDS.map(() => TEST_CLIENT_B_ID),
        deleteHasItems: false,
      },
    );
  });

  it("should keep A's items when B posts one of A's players", async () => {
    const { store, authStore, tokenA, tokenB } = await storeWithClientAStarred();
    await callWatchlist({
      method: "POST",
      token: tokenB,
      playerId: CLIENT_A_FIRST_PLAYER_ID,
      store,
      authStore,
    });
    const result = await callWatchlist({
      method: "GET",
      token: tokenA,
      store,
      authStore,
    });

    assert.deepEqual(listSnapshot(result), {
      status: 200,
      clientId: TEST_CLIENT_A_ID,
      playerIds: CLIENT_A_PLAYER_IDS,
    });
  });

  it("should not return A's watchlist when B posts one of A's players", async () => {
    const { store, authStore, tokenB } = await storeWithClientAStarred();
    await callWatchlist({
      method: "POST",
      token: tokenB,
      playerId: CLIENT_A_FIRST_PLAYER_ID,
      store,
      authStore,
    });
    const result = await callWatchlist({
      method: "GET",
      token: tokenB,
      store,
      authStore,
    });
    assert.deepEqual(listSnapshot(result), {
      status: 200,
      clientId: TEST_CLIENT_B_ID,
      playerIds: [CLIENT_A_FIRST_PLAYER_ID],
    });
  });

  it("should return 401 when the Authorization header is missing", async () => {
    const { store, authStore } = await storeWithClientAStarred();
    const result = await callWatchlist({ method: "GET", store, authStore });

    assert.deepEqual(result, {
      status: 401,
      body: { error: UNAUTHORIZED_ERROR },
    });
  });

  it("should return 401 when the bearer token is unknown", async () => {
    const { store, authStore } = await storeWithClientAStarred();
    const result = await callWatchlist({
      method: "GET",
      token: "unknown-token",
      store,
      authStore,
    });

    assert.deepEqual(result, {
      status: 401,
      body: { error: UNAUTHORIZED_ERROR },
    });
  });
});
