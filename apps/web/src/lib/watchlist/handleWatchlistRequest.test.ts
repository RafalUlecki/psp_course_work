import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { FORBIDDEN_ERROR, UNAUTHORIZED_ERROR } from "../auth/errors";
import type {
  RequireAuthAuthenticated,
  RequireAuthSkipped,
} from "../auth/types/requireAuth";
import type { UserRole } from "../auth/types/userRole";
import {
  CLIENT_ID_HEADER,
  TEST_CLIENT_A_ID,
  TEST_CLIENT_A_NAME,
  TEST_CLIENT_B_ID,
  TEST_CLIENT_B_NAME,
} from "../clients/constants";
import { handleWatchlistRequest } from "./handleWatchlistRequest";
import {
  MISSING_PLAYER_ID_ERROR,
  PLAYER_NOT_FOUND_ERROR,
  WATCHLIST_ITEM_NOT_FOUND_ERROR,
} from "./errors";
import type { WatchlistHttpResult } from "./types/api";
import type {
  WatchlistItemRecord,
  WatchlistOwner,
  WatchlistStore,
} from "./types/watchlistStore";

const CLIENT_A_PLAYER_ID = 203999;
const CLIENT_B_PLAYER_ID = 1629029;
const SHARED_PLAYER_ID = 1630559;
const MEMBER_A_PLAYER_ID = 1628369;

interface MemoryStoreState {
  items: WatchlistItemRecord[];
}

const authFor = (
  clientId: string,
  role: UserRole = "admin",
): RequireAuthAuthenticated => ({
  ok: true,
  skipped: false,
  userId: `user-${clientId}-${role}`,
  clientId,
  role,
  tokenHash: `hash-${clientId}-${role}`,
});

const skippedAuth: RequireAuthSkipped = { ok: true, skipped: true };

const USER_A_ADMIN = authFor(TEST_CLIENT_A_ID, "admin");
const USER_A_MEMBER = authFor(TEST_CLIENT_A_ID, "member");
const USER_B_ADMIN = authFor(TEST_CLIENT_B_ID, "admin");

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
  const belongsToOwner = (
    item: WatchlistItemRecord,
    owner: WatchlistOwner,
  ): boolean =>
    item.userId === owner.userId && item.clientId === owner.clientId;

  return {
    findClientById: async (clientId) =>
      clients.find((client) => client.id === clientId) ?? null,
    playerExists: async (playerId) => playerIds.has(playerId),
    listByOwner: async (owner) =>
      state.items.filter((item) => belongsToOwner(item, owner)),
    findItem: async (owner, playerId) =>
      state.items.find(
        (item) => belongsToOwner(item, owner) && item.playerId === playerId,
      ) ?? null,
    findItemById: async (id) =>
      state.items.find((item) => item.id === id) ?? null,
    createItem: async (owner, playerId) => {
      const item = {
        id: nextId,
        userId: owner.userId,
        clientId: owner.clientId,
        playerId,
      };
      nextId += 1;
      state.items.push(item);
      return item;
    },
    deleteItem: async (owner, playerId) => {
      const index = state.items.findIndex(
        (item) => belongsToOwner(item, owner) && item.playerId === playerId,
      );
      if (index === -1) {
        return false;
      }
      state.items.splice(index, 1);
      return true;
    },
    deleteItemById: async (id, owner) => {
      const index = state.items.findIndex(
        (item) => item.id === id && belongsToOwner(item, owner),
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
      {
        id: 1,
        userId: USER_A_ADMIN.userId,
        clientId: TEST_CLIENT_A_ID,
        playerId: CLIENT_A_PLAYER_ID,
      },
      {
        id: 2,
        userId: USER_B_ADMIN.userId,
        clientId: TEST_CLIENT_B_ID,
        playerId: CLIENT_B_PLAYER_ID,
      },
      {
        id: 3,
        userId: USER_A_MEMBER.userId,
        clientId: TEST_CLIENT_A_ID,
        playerId: MEMBER_A_PLAYER_ID,
      },
    ],
    players: [
      CLIENT_A_PLAYER_ID,
      CLIENT_B_PLAYER_ID,
      SHARED_PLAYER_ID,
      MEMBER_A_PLAYER_ID,
    ],
  });

const listRequest = (
  auth: RequireAuthAuthenticated,
  watchlistStore: WatchlistStore,
  extraHeaders?: Record<string, string>,
) =>
  handleWatchlistRequest(
    {
      method: "GET",
      headers: new Headers(extraHeaders),
      searchParams: new URLSearchParams(),
      bodyText: "",
      auth,
    },
    watchlistStore,
  );

const listPlayerIds = (result: WatchlistHttpResult): number[] | null => {
  if (result.status !== 200 || !("items" in result.body)) {
    return null;
  }
  return result.body.items.map((item) => item.playerId);
};

const errorMessage = (result: WatchlistHttpResult): string | null =>
  result.status === 400 ||
  result.status === 401 ||
  result.status === 403 ||
  result.status === 404 ||
  result.status === 405
    ? result.body.error
    : null;

describe("handleWatchlistRequest", () => {
  it("should return only client A admin player ids when listing with that token", async () => {
    const result = await listRequest(USER_A_ADMIN, seededStore());

    assert.deepEqual(listPlayerIds(result), [CLIENT_A_PLAYER_ID]);
  });

  it("should return only client B admin player ids when listing with that token", async () => {
    const result = await listRequest(USER_B_ADMIN, seededStore());

    assert.deepEqual(listPlayerIds(result), [CLIENT_B_PLAYER_ID]);
  });

  it("should ignore X-Client-Id when a token is present", async () => {
    const result = await listRequest(USER_A_ADMIN, seededStore(), {
      [CLIENT_ID_HEADER]: TEST_CLIENT_B_ID,
    });

    assert.deepEqual(listPlayerIds(result), [CLIENT_A_PLAYER_ID]);
  });

  it("should create a watchlist row for the session user when posting a player id", async () => {
    const result = await handleWatchlistRequest(
      {
        method: "POST",
        headers: new Headers(),
        searchParams: new URLSearchParams(),
        bodyText: JSON.stringify({ playerId: SHARED_PLAYER_ID }),
        auth: USER_A_ADMIN,
      },
      seededStore(),
    );

    assert.deepEqual(result, {
      status: 201,
      body: {
        userId: USER_A_ADMIN.userId,
        clientId: TEST_CLIENT_A_ID,
        playerId: SHARED_PLAYER_ID,
        id: 4,
      },
    });
  });

  it("should keep client B player ids when client A adds a player", async () => {
    const store = seededStore();
    await handleWatchlistRequest(
      {
        method: "POST",
        headers: new Headers(),
        searchParams: new URLSearchParams(),
        bodyText: JSON.stringify({ playerId: SHARED_PLAYER_ID }),
        auth: USER_A_ADMIN,
      },
      store,
    );
    const result = await handleWatchlistRequest(
      {
        method: "GET",
        headers: new Headers(),
        searchParams: new URLSearchParams(),
        bodyText: "",
        auth: USER_B_ADMIN,
      },
      store,
    );

    assert.deepEqual(listPlayerIds(result), [CLIENT_B_PLAYER_ID]);
  });

  it("should return 400 when POST has no playerId", async () => {
    const result = await handleWatchlistRequest(
      {
        method: "POST",
        headers: new Headers(),
        searchParams: new URLSearchParams(),
        bodyText: "{}",
        auth: USER_A_ADMIN,
      },
      seededStore(),
    );

    assert.equal(errorMessage(result), MISSING_PLAYER_ID_ERROR);
  });

  it("should return a player-not-found error when POST playerId is unknown", async () => {
    const result = await handleWatchlistRequest(
      {
        method: "POST",
        headers: new Headers(),
        searchParams: new URLSearchParams(),
        bodyText: JSON.stringify({ playerId: 1 }),
        auth: USER_A_ADMIN,
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
        headers: new Headers(),
        searchParams: new URLSearchParams({
          playerId: String(CLIENT_A_PLAYER_ID),
        }),
        bodyText: "",
        auth: USER_A_ADMIN,
      },
      store,
    );
    const result = await handleWatchlistRequest(
      {
        method: "GET",
        headers: new Headers(),
        searchParams: new URLSearchParams(),
        bodyText: "",
        auth: USER_B_ADMIN,
      },
      store,
    );

    assert.deepEqual(listPlayerIds(result), [CLIENT_B_PLAYER_ID]);
  });

  it("should return 401 when auth is skipped", async () => {
    const result = await handleWatchlistRequest(
      {
        method: "GET",
        headers: new Headers(),
        searchParams: new URLSearchParams(),
        bodyText: "",
        auth: skippedAuth,
      },
      seededStore(),
    );

    assert.deepEqual(result, {
      status: 401,
      body: { error: UNAUTHORIZED_ERROR },
    });
  });

  it("should return 401 when auth is skipped even with X-Client-Id", async () => {
    const result = await handleWatchlistRequest(
      {
        method: "GET",
        headers: new Headers({ [CLIENT_ID_HEADER]: TEST_CLIENT_A_ID }),
        searchParams: new URLSearchParams(),
        bodyText: "",
        auth: skippedAuth,
      },
      seededStore(),
    );

    assert.deepEqual(result, {
      status: 401,
      body: { error: UNAUTHORIZED_ERROR },
    });
  });

  it("should return 403 when client A reads client B's watchlist item id", async () => {
    const result = await handleWatchlistRequest(
      {
        method: "GET",
        headers: new Headers(),
        searchParams: new URLSearchParams({ id: "2" }),
        bodyText: "",
        auth: USER_A_ADMIN,
      },
      seededStore(),
    );

    assert.deepEqual(result, {
      status: 403,
      body: { error: FORBIDDEN_ERROR },
    });
  });

  it("should keep client B's item when client A reads B's watchlist item id", async () => {
    const store = seededStore();
    await handleWatchlistRequest(
      {
        method: "GET",
        headers: new Headers(),
        searchParams: new URLSearchParams({ id: "2" }),
        bodyText: "",
        auth: USER_A_ADMIN,
      },
      store,
    );
    const result = await listRequest(USER_B_ADMIN, store);

    assert.deepEqual(listPlayerIds(result), [CLIENT_B_PLAYER_ID]);
  });

  it("should return 403 when client A deletes client B's watchlist item id", async () => {
    const result = await handleWatchlistRequest(
      {
        method: "DELETE",
        headers: new Headers(),
        searchParams: new URLSearchParams({ id: "2" }),
        bodyText: "",
        auth: USER_A_ADMIN,
      },
      seededStore(),
    );

    assert.deepEqual(result, {
      status: 403,
      body: { error: FORBIDDEN_ERROR },
    });
  });

  it("should keep client B's item when client A deletes B's watchlist item id", async () => {
    const store = seededStore();
    await handleWatchlistRequest(
      {
        method: "DELETE",
        headers: new Headers(),
        searchParams: new URLSearchParams({ id: "2" }),
        bodyText: "",
        auth: USER_A_ADMIN,
      },
      store,
    );
    const result = await listRequest(USER_B_ADMIN, store);

    assert.deepEqual(listPlayerIds(result), [CLIENT_B_PLAYER_ID]);
  });

  it("should return 404 when the watchlist item id does not exist", async () => {
    const result = await handleWatchlistRequest(
      {
        method: "GET",
        headers: new Headers(),
        searchParams: new URLSearchParams({ id: "99" }),
        bodyText: "",
        auth: USER_A_ADMIN,
      },
      seededStore(),
    );

    assert.equal(errorMessage(result), WATCHLIST_ITEM_NOT_FOUND_ERROR);
  });

  it("should return the item when a member reads their own watchlist item id", async () => {
    const result = await handleWatchlistRequest(
      {
        method: "GET",
        headers: new Headers(),
        searchParams: new URLSearchParams({ id: "3" }),
        bodyText: "",
        auth: USER_A_MEMBER,
      },
      seededStore(),
    );

    assert.deepEqual(result, {
      status: 200,
      body: {
        userId: USER_A_MEMBER.userId,
        clientId: TEST_CLIENT_A_ID,
        id: 3,
        playerId: MEMBER_A_PLAYER_ID,
      },
    });
  });

  it("should create a watchlist row when a member posts a player id", async () => {
    const result = await handleWatchlistRequest(
      {
        method: "POST",
        headers: new Headers(),
        searchParams: new URLSearchParams(),
        bodyText: JSON.stringify({ playerId: SHARED_PLAYER_ID }),
        auth: USER_A_MEMBER,
      },
      seededStore(),
    );

    assert.deepEqual(result, {
      status: 201,
      body: {
        userId: USER_A_MEMBER.userId,
        clientId: TEST_CLIENT_A_ID,
        playerId: SHARED_PLAYER_ID,
        id: 4,
      },
    });
  });

  it("should include the player on the member list when a member posts", async () => {
    const store = seededStore();
    await handleWatchlistRequest(
      {
        method: "POST",
        headers: new Headers(),
        searchParams: new URLSearchParams(),
        bodyText: JSON.stringify({ playerId: SHARED_PLAYER_ID }),
        auth: USER_A_MEMBER,
      },
      store,
    );
    const result = await listRequest(USER_A_MEMBER, store);

    assert.deepEqual(listPlayerIds(result), [
      MEMBER_A_PLAYER_ID,
      SHARED_PLAYER_ID,
    ]);
  });

  it("should delete the item when a member deletes their own watchlist item id", async () => {
    const result = await handleWatchlistRequest(
      {
        method: "DELETE",
        headers: new Headers(),
        searchParams: new URLSearchParams({ id: "3" }),
        bodyText: "",
        auth: USER_A_MEMBER,
      },
      seededStore(),
    );

    assert.deepEqual(result, {
      status: 200,
      body: {
        userId: USER_A_MEMBER.userId,
        clientId: TEST_CLIENT_A_ID,
        id: 3,
        playerId: MEMBER_A_PLAYER_ID,
      },
    });
  });

  it("should omit the item from the member list after the member deletes it", async () => {
    const store = seededStore();
    await handleWatchlistRequest(
      {
        method: "DELETE",
        headers: new Headers(),
        searchParams: new URLSearchParams({ id: "3" }),
        bodyText: "",
        auth: USER_A_MEMBER,
      },
      store,
    );
    const result = await listRequest(USER_A_MEMBER, store);

    assert.deepEqual(listPlayerIds(result), []);
  });

  it("should delete the item when an admin deletes their own watchlist item id", async () => {
    const result = await handleWatchlistRequest(
      {
        method: "DELETE",
        headers: new Headers(),
        searchParams: new URLSearchParams({ id: "1" }),
        bodyText: "",
        auth: USER_A_ADMIN,
      },
      seededStore(),
    );

    assert.deepEqual(result, {
      status: 200,
      body: {
        userId: USER_A_ADMIN.userId,
        clientId: TEST_CLIENT_A_ID,
        id: 1,
        playerId: CLIENT_A_PLAYER_ID,
      },
    });
  });
});

describe("watchlist same-client user isolation", () => {
  it("should omit A1 items when A2 lists in the same client", async () => {
    const result = await listRequest(USER_A_MEMBER, seededStore());

    assert.deepEqual(listPlayerIds(result), [MEMBER_A_PLAYER_ID]);
  });

  it("should return 403 when A2 reads A1's watchlist item id", async () => {
    const result = await handleWatchlistRequest(
      {
        method: "GET",
        headers: new Headers(),
        searchParams: new URLSearchParams({ id: "1" }),
        bodyText: "",
        auth: USER_A_MEMBER,
      },
      seededStore(),
    );

    assert.deepEqual(result, {
      status: 403,
      body: { error: FORBIDDEN_ERROR },
    });
  });

  it("should return 403 when A2 deletes A1's watchlist item id", async () => {
    const result = await handleWatchlistRequest(
      {
        method: "DELETE",
        headers: new Headers(),
        searchParams: new URLSearchParams({ id: "1" }),
        bodyText: "",
        auth: USER_A_MEMBER,
      },
      seededStore(),
    );

    assert.deepEqual(result, {
      status: 403,
      body: { error: FORBIDDEN_ERROR },
    });
  });

  it("should keep A1's items when A2 deletes A1's watchlist item id", async () => {
    const store = seededStore();
    await handleWatchlistRequest(
      {
        method: "DELETE",
        headers: new Headers(),
        searchParams: new URLSearchParams({ id: "1" }),
        bodyText: "",
        auth: USER_A_MEMBER,
      },
      store,
    );
    const result = await listRequest(USER_A_ADMIN, store);

    assert.deepEqual(listPlayerIds(result), [CLIENT_A_PLAYER_ID]);
  });

  it("should omit A1's added player from A2's list", async () => {
    const store = seededStore();
    await handleWatchlistRequest(
      {
        method: "POST",
        headers: new Headers(),
        searchParams: new URLSearchParams(),
        bodyText: JSON.stringify({ playerId: SHARED_PLAYER_ID }),
        auth: USER_A_ADMIN,
      },
      store,
    );
    const result = await listRequest(USER_A_MEMBER, store);

    assert.deepEqual(listPlayerIds(result), [MEMBER_A_PLAYER_ID]);
  });

  it("should let both users in the same client add the same player independently", async () => {
    const store = seededStore();
    await handleWatchlistRequest(
      {
        method: "POST",
        headers: new Headers(),
        searchParams: new URLSearchParams(),
        bodyText: JSON.stringify({ playerId: SHARED_PLAYER_ID }),
        auth: USER_A_ADMIN,
      },
      store,
    );
    await handleWatchlistRequest(
      {
        method: "POST",
        headers: new Headers(),
        searchParams: new URLSearchParams(),
        bodyText: JSON.stringify({ playerId: SHARED_PLAYER_ID }),
        auth: USER_A_MEMBER,
      },
      store,
    );
    const adminList = await listRequest(USER_A_ADMIN, store);
    const memberList = await listRequest(USER_A_MEMBER, store);

    assert.deepEqual(
      {
        admin: listPlayerIds(adminList),
        member: listPlayerIds(memberList),
      },
      {
        admin: [CLIENT_A_PLAYER_ID, SHARED_PLAYER_ID],
        member: [MEMBER_A_PLAYER_ID, SHARED_PLAYER_ID],
      },
    );
  });
});
