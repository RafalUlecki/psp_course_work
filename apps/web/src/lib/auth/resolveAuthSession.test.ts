import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { TEST_CLIENT_A_ID, TEST_CLIENT_B_ID } from "../clients/constants";
import { createMemoryUserStore } from "./memoryUserStore";
import { resolveAuthSession } from "./resolveAuthSession";

describe("resolveAuthSession", () => {
  it("should return the user, client and role when the user exists", async () => {
    const userStore = createMemoryUserStore();
    await userStore.insert({
      id: "user-a-admin",
      email: "admin-a@prophover.local",
      passwordHash: "salt:hash",
      clientId: TEST_CLIENT_A_ID,
      role: "admin",
    });
    const session = await resolveAuthSession(
      { userId: "user-a-admin" },
      userStore,
    );

    assert.deepEqual(session, {
      userId: "user-a-admin",
      clientId: TEST_CLIENT_A_ID,
      role: "admin",
    });
  });

  it("should return the member role for a member of client B", async () => {
    const userStore = createMemoryUserStore();
    await userStore.insert({
      id: "user-b-member",
      email: "member-b@prophover.local",
      passwordHash: "salt:hash",
      clientId: TEST_CLIENT_B_ID,
      role: "member",
    });
    const session = await resolveAuthSession(
      { userId: "user-b-member" },
      userStore,
    );

    assert.equal(session?.role, "member");
  });

  it("should return null when the user is missing", async () => {
    const session = await resolveAuthSession(
      { userId: "missing" },
      createMemoryUserStore(),
    );

    assert.equal(session, null);
  });
});
