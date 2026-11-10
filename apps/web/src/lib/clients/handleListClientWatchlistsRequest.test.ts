import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { FORBIDDEN_ERROR } from "../auth/errors";
import { createMemoryUserStore } from "../auth/memoryUserStore";
import type {
  RequireAuthAuthenticated,
  RequireAuthSkipped,
} from "../auth/types/requireAuth";
import type { UserRole } from "../auth/types/userRole";
import type { UserStore } from "../auth/types/userStore";
import type {
  WatchlistItemRecord,
  WatchlistStore,
} from "../watchlist/types/watchlistStore";
import { TEST_CLIENT_A_ID, TEST_CLIENT_B_ID } from "./constants";
import { handleListClientWatchlistsRequest } from "./handleListClientWatchlistsRequest";

const PLAYER_SHARED = 203999;
const PLAYER_A_MEMBER = 1628369;
const PLAYER_B = 1629029;

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
    countPlayersByClientId: async () => [],
    findItem: async () => null,
    findItemById: async () => null,
    createItem: async () => {
      throw new Error("unused");
    },
    deleteItem: async () => false,
    deleteItemById: async () => false,
  };
};

const seedStores = async (): Promise<{
  userStore: UserStore;
  watchlistStore: WatchlistStore;
}> => {
  const userStore = createMemoryUserStore();
  await userStore.insert({
    id: "user-A-admin",
    email: "admin-a@prophover.local",
    passwordHash: "salt-a-admin:hash-a-admin",
    clientId: TEST_CLIENT_A_ID,
    role: "admin",
  });
  await userStore.insert({
    id: "user-A-member",
    email: "member-a@prophover.local",
    passwordHash: "salt-a-member:hash-a-member",
    clientId: TEST_CLIENT_A_ID,
    role: "member",
  });
  await userStore.insert({
    id: "user-B-admin",
    email: "admin-b@prophover.local",
    passwordHash: "salt-b-admin:hash-b-admin",
    clientId: TEST_CLIENT_B_ID,
    role: "admin",
  });

  const watchlistStore = createMemoryWatchlistStore([
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
      playerId: PLAYER_A_MEMBER,
    },
    {
      id: 4,
      userId: "user-B-admin",
      clientId: TEST_CLIENT_B_ID,
      playerId: PLAYER_B,
    },
  ]);

  return { userStore, watchlistStore };
};

describe("handleListClientWatchlistsRequest", () => {
  it("should return only the caller's client watchlists when the caller is admin", async () => {
    const { userStore, watchlistStore } = await seedStores();
    const result = await handleListClientWatchlistsRequest(
      { auth: authFor(TEST_CLIENT_A_ID, "admin") },
      userStore,
      watchlistStore,
    );

    assert.deepEqual(
      result.status === 200 ? result.body : null,
      {
        clientId: TEST_CLIENT_A_ID,
        watchlists: [
          {
            userId: "user-A-admin",
            email: "admin-a@prophover.local",
            role: "admin",
            items: [{ id: 1, playerId: PLAYER_SHARED }],
          },
          {
            userId: "user-A-member",
            email: "member-a@prophover.local",
            role: "member",
            items: [
              { id: 2, playerId: PLAYER_SHARED },
              { id: 3, playerId: PLAYER_A_MEMBER },
            ],
          },
        ],
      },
    );
  });

  it("should return 403 when a member lists client watchlists", async () => {
    const { userStore, watchlistStore } = await seedStores();
    const result = await handleListClientWatchlistsRequest(
      { auth: authFor(TEST_CLIENT_A_ID, "member") },
      userStore,
      watchlistStore,
    );

    assert.deepEqual(result, {
      status: 403,
      body: { error: FORBIDDEN_ERROR },
    });
  });

  it("should omit passwordHash from the admin watchlists response", async () => {
    const { userStore, watchlistStore } = await seedStores();
    const result = await handleListClientWatchlistsRequest(
      { auth: authFor(TEST_CLIENT_A_ID, "admin") },
      userStore,
      watchlistStore,
    );

    assert.equal(
      result.status === 200 &&
        !JSON.stringify(result.body).includes("passwordHash"),
      true,
    );
  });

  it("should return 401 when auth was skipped", async () => {
    const { userStore, watchlistStore } = await seedStores();
    const result = await handleListClientWatchlistsRequest(
      { auth: skippedAuth },
      userStore,
      watchlistStore,
    );

    assert.equal(result.status, 401);
  });
});
