import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CLIENT_ID_HEADER,
  TEST_CLIENT_A_ID,
  TEST_CLIENT_A_NAME,
  TEST_CLIENT_B_ID,
  TEST_CLIENT_B_NAME,
} from "../clients/constants";
import { MISSING_CLIENT_ID_ERROR, UNKNOWN_CLIENT_ID_ERROR } from "../clients/errors";
import { handleWatchlistRequest } from "./handleWatchlistRequest";
import type { WatchlistHttpResult } from "./types/api";
import type {
  WatchlistItemRecord,
  WatchlistStore,
} from "./types/watchlistStore";

const CLIENT_A_FIRST_PLAYER_ID = 203999;
const CLIENT_A_PLAYER_IDS = [CLIENT_A_FIRST_PLAYER_ID, 1630559, 1628369];

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
  clientId?: string;
  playerId?: number;
  store: WatchlistStore;
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
  const { method, clientId, playerId, store } = props;
  const headers = new Headers();
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
    { method, headers, searchParams, bodyText },
    store,
  );
};

const starPlayersAsA = async (store: WatchlistStore): Promise<void> => {
  for (const playerId of CLIENT_A_PLAYER_IDS) {
    await callWatchlist({
      method: "POST",
      clientId: TEST_CLIENT_A_ID,
      playerId,
      store,
    });
  }
};

const storeWithClientAStarred = async (): Promise<WatchlistStore> => {
  const store = isolationStore();
  await starPlayersAsA(store);
  return store;
};

const deleteAPlayersAsB = (
  store: WatchlistStore,
): Promise<WatchlistHttpResult[]> =>
  Promise.all(
    CLIENT_A_PLAYER_IDS.map((playerId) =>
      callWatchlist({
        method: "DELETE",
        clientId: TEST_CLIENT_B_ID,
        playerId,
        store,
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
    const store = await storeWithClientAStarred();
    const result = await callWatchlist({
      method: "GET",
      clientId: TEST_CLIENT_A_ID,
      store,
    });

    assert.deepEqual(listSnapshot(result), {
      status: 200,
      clientId: TEST_CLIENT_A_ID,
      playerIds: CLIENT_A_PLAYER_IDS,
    });
  });

  it("should return an empty watchlist when listing as B after A stars players", async () => {
    const store = await storeWithClientAStarred();
    const result = await callWatchlist({
      method: "GET",
      clientId: TEST_CLIENT_B_ID,
      store,
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
    const store = await storeWithClientAStarred();
    await deleteAPlayersAsB(store);
    const result = await callWatchlist({
      method: "GET",
      clientId: TEST_CLIENT_A_ID,
      store,
    });

    assert.deepEqual(listSnapshot(result), {
      status: 200,
      clientId: TEST_CLIENT_A_ID,
      playerIds: CLIENT_A_PLAYER_IDS,
    });
  });

  it("should omit A's payload when B deletes A's players", async () => {
    const store = await storeWithClientAStarred();
    const deleteResults = await deleteAPlayersAsB(store);
    const listResult = await callWatchlist({
      method: "GET",
      clientId: TEST_CLIENT_B_ID,
      store,
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
    const store = await storeWithClientAStarred();
    await callWatchlist({
      method: "POST",
      clientId: TEST_CLIENT_B_ID,
      playerId: CLIENT_A_FIRST_PLAYER_ID,
      store,
    });
    const result = await callWatchlist({
      method: "GET",
      clientId: TEST_CLIENT_A_ID,
      store,
    });

    assert.deepEqual(listSnapshot(result), {
      status: 200,
      clientId: TEST_CLIENT_A_ID,
      playerIds: CLIENT_A_PLAYER_IDS,
    });
  });

  it("should not return A's watchlist when B posts one of A's players", async () => {
    const store = await storeWithClientAStarred();
    await callWatchlist({
      method: "POST",
      clientId: TEST_CLIENT_B_ID,
      playerId: CLIENT_A_FIRST_PLAYER_ID,
      store,
    });
    const result = await callWatchlist({
      method: "GET",
      clientId: TEST_CLIENT_B_ID,
      store,
    });
    assert.deepEqual(listSnapshot(result), {
      status: 200,
      clientId: TEST_CLIENT_B_ID,
      playerIds: [CLIENT_A_FIRST_PLAYER_ID],
    });
  });

  it("should return 400 when X-Client-Id is missing", async () => {
    const store = await storeWithClientAStarred();
    const result = await callWatchlist({ method: "GET", store });

    assert.deepEqual(result, {
      status: 400,
      body: { error: MISSING_CLIENT_ID_ERROR },
    });
  });

  it("should return 401 when X-Client-Id is unknown", async () => {
    const store = await storeWithClientAStarred();
    const result = await callWatchlist({
      method: "GET",
      clientId: "Z",
      store,
    });

    assert.deepEqual(result, {
      status: 401,
      body: { error: UNKNOWN_CLIENT_ID_ERROR },
    });
  });
});
