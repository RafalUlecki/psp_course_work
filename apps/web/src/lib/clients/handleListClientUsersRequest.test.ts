import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { FORBIDDEN_ERROR } from "../auth/errors";
import { createMemoryUserStore } from "../auth/memoryUserStore";
import type {
  RequireAuthAuthenticated,
  RequireAuthSkipped,
} from "../auth/types/requireAuth";
import type { UserRole } from "../auth/types/userRole";
import { TEST_CLIENT_A_ID, TEST_CLIENT_B_ID } from "./constants";
import { handleListClientUsersRequest } from "./handleListClientUsersRequest";

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

const seedUsers = async () => {
  const userStore = createMemoryUserStore();
  await userStore.insert({
    id: "user-a-admin",
    email: "admin-a@prophover.local",
    passwordHash: "salt-a-admin:hash-a-admin",
    clientId: TEST_CLIENT_A_ID,
    role: "admin",
  });
  await userStore.insert({
    id: "user-a-member",
    email: "member-a@prophover.local",
    passwordHash: "salt-a-member:hash-a-member",
    clientId: TEST_CLIENT_A_ID,
    role: "member",
  });
  await userStore.insert({
    id: "user-b-admin",
    email: "admin-b@prophover.local",
    passwordHash: "salt-b-admin:hash-b-admin",
    clientId: TEST_CLIENT_B_ID,
    role: "admin",
  });
  await userStore.insert({
    id: "user-b-member",
    email: "member-b@prophover.local",
    passwordHash: "salt-b-member:hash-b-member",
    clientId: TEST_CLIENT_B_ID,
    role: "member",
  });
  return userStore;
};

describe("handleListClientUsersRequest", () => {
  it("should return only the caller's client users when the caller is admin", async () => {
    const result = await handleListClientUsersRequest(
      { auth: authFor(TEST_CLIENT_A_ID, "admin") },
      await seedUsers(),
    );

    assert.deepEqual(
      result.status === 200
        ? {
            clientId: result.body.clientId,
            users: result.body.users,
          }
        : null,
      {
        clientId: TEST_CLIENT_A_ID,
        users: [
          {
            id: "user-a-admin",
            email: "admin-a@prophover.local",
            role: "admin",
          },
          {
            id: "user-a-member",
            email: "member-a@prophover.local",
            role: "member",
          },
        ],
      },
    );
  });

  it("should return 403 when a member lists client users", async () => {
    const result = await handleListClientUsersRequest(
      { auth: authFor(TEST_CLIENT_A_ID, "member") },
      await seedUsers(),
    );

    assert.deepEqual(result, {
      status: 403,
      body: { error: FORBIDDEN_ERROR },
    });
  });

  it("should omit passwordHash from the admin list response", async () => {
    const result = await handleListClientUsersRequest(
      { auth: authFor(TEST_CLIENT_A_ID, "admin") },
      await seedUsers(),
    );

    assert.equal(
      result.status === 200 &&
        !JSON.stringify(result.body).includes("passwordHash"),
      true,
    );
  });

  it("should return 401 when auth was skipped", async () => {
    const result = await handleListClientUsersRequest(
      { auth: skippedAuth },
      await seedUsers(),
    );

    assert.equal(result.status, 401);
  });
});
