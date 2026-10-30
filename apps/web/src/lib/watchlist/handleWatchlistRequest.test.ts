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

const listRequest = (clientId: string) =>
  handleWatchlistRequest(
    {
      method: "GET",
      headers: new Headers({ [CLIENT_ID_HEADER]: clientId }),
      searchParams: new URLSearchParams(),
      bodyText: "",
    },
    seededStore(),
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
  it("should return 400 when X-Client-Id is missing", async () => {
    const result = await handleWatchlistRequest(
      {
        method: "GET",
        headers: new Headers(),
        searchParams: new URLSearchParams(),
        bodyText: "",
      },
      seededStore(),
    );

    assert.equal(result.status, 400);
  });

  it("should return a missing-header error when X-Client-Id is missing", async () => {
    const result = await handleWatchlistRequest(
      {
        method: "GET",
        headers: new Headers(),
        searchParams: new URLSearchParams(),
        bodyText: "",
      },
      seededStore(),
    );

    assert.equal(errorMessage(result), MISSING_CLIENT_ID_ERROR);
  });

  it("should return 401 when X-Client-Id is unknown", async () => {
    const result = await listRequest("Z");

    assert.equal(result.status, 401);
  });

  it("should return an unknown-client error when X-Client-Id is unknown", async () => {
    const result = await listRequest("Z");

    assert.equal(errorMessage(result), UNKNOWN_CLIENT_ID_ERROR);
  });

  it("should return only client A player ids when listing as A", async () => {
    const result = await listRequest(TEST_CLIENT_A_ID);

    assert.deepEqual(listPlayerIds(result), [CLIENT_A_PLAYER_ID]);
  });

  it("should return only client B player ids when listing as B", async () => {
    const result = await listRequest(TEST_CLIENT_B_ID);

    assert.deepEqual(listPlayerIds(result), [CLIENT_B_PLAYER_ID]);
  });

  it("should create a watchlist row for client A when A posts a player id", async () => {
    const store = seededStore();
    const result = await handleWatchlistRequest(
      {
        method: "POST",
        headers: new Headers({ [CLIENT_ID_HEADER]: TEST_CLIENT_A_ID }),
        searchParams: new URLSearchParams(),
        bodyText: JSON.stringify({ playerId: SHARED_PLAYER_ID }),
      },
      store,
    );

    assert.deepEqual(result, {
      status: 201,
      body: { clientId: TEST_CLIENT_A_ID, playerId: SHARED_PLAYER_ID },
    });
  });

  it("should keep client B player ids when client A adds a player", async () => {
    const store = seededStore();
    await handleWatchlistRequest(
      {
        method: "POST",
        headers: new Headers({ [CLIENT_ID_HEADER]: TEST_CLIENT_A_ID }),
        searchParams: new URLSearchParams(),
        bodyText: JSON.stringify({ playerId: SHARED_PLAYER_ID }),
      },
      store,
    );
    const result = await handleWatchlistRequest(
      {
        method: "GET",
        headers: new Headers({ [CLIENT_ID_HEADER]: TEST_CLIENT_B_ID }),
        searchParams: new URLSearchParams(),
        bodyText: "",
      },
      store,
    );

    assert.deepEqual(listPlayerIds(result), [CLIENT_B_PLAYER_ID]);
  });

  it("should return 400 when POST has no playerId", async () => {
    const result = await handleWatchlistRequest(
      {
        method: "POST",
        headers: new Headers({ [CLIENT_ID_HEADER]: TEST_CLIENT_A_ID }),
        searchParams: new URLSearchParams(),
        bodyText: "{}",
      },
      seededStore(),
    );

    assert.equal(errorMessage(result), MISSING_PLAYER_ID_ERROR);
  });

  it("should return a player-not-found error when POST playerId is unknown", async () => {
    const result = await handleWatchlistRequest(
      {
        method: "POST",
        headers: new Headers({ [CLIENT_ID_HEADER]: TEST_CLIENT_A_ID }),
        searchParams: new URLSearchParams(),
        bodyText: JSON.stringify({ playerId: 1 }),
      },
      seededStore(),
    );

    assert.equal(errorMessage(result), PLAYER_NOT_FOUND_ERROR);
  });

  it("should keep client B items when client A deletes a watchlist player", async () => {
    const store = seededStore();
    await handleWatchlistRequest(
      {
        method: "DELETE",
        headers: new Headers({ [CLIENT_ID_HEADER]: TEST_CLIENT_A_ID }),
        searchParams: new URLSearchParams({
          playerId: String(CLIENT_A_PLAYER_ID),
        }),
        bodyText: "",
      },
      store,
    );
    const result = await handleWatchlistRequest(
      {
        method: "GET",
        headers: new Headers({ [CLIENT_ID_HEADER]: TEST_CLIENT_B_ID }),
        searchParams: new URLSearchParams(),
        bodyText: "",
      },
      store,
    );

    assert.deepEqual(listPlayerIds(result), [CLIENT_B_PLAYER_ID]);
  });
});
