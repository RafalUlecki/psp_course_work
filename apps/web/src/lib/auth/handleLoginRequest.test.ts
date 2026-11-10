import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import { TEST_CLIENT_A_ID, TEST_CLIENT_B_ID } from "../clients/constants";
import { INVALID_CREDENTIALS_ERROR } from "./errors";
import { handleLoginRequest } from "./handleLoginRequest";
import { createMemoryAuthTokenStore } from "./memoryAuthTokenStore";
import { createMemoryUserStore } from "./memoryUserStore";
import { hashPassword } from "./passwordHash";
import { isRequireAuthOk, requireAuth } from "./requireAuth";
import type { UserRecord } from "./types/userStore";

const NOW = new Date("2026-01-01T00:00:00.000Z");
const ADMIN_A_EMAIL = "admin-a@prophover.local";
const ADMIN_A_PASSWORD = "password-admin-a";

const seedUser = async (props: {
  email: string;
  password: string;
  clientId: string;
  role: UserRecord["role"];
}) => {
  const { email, password, clientId, role } = props;
  const userStore = createMemoryUserStore();
  const tokenStore = createMemoryAuthTokenStore();
  const user = await userStore.insert({
    id: randomUUID(),
    email,
    passwordHash: await hashPassword({ password }),
    clientId,
    role,
  });
  return { userStore, tokenStore, user };
};

describe("handleLoginRequest", () => {
  it("should return a token when email and password are valid", async () => {
    const { userStore, tokenStore } = await seedUser({
      email: ADMIN_A_EMAIL,
      password: ADMIN_A_PASSWORD,
      clientId: TEST_CLIENT_A_ID,
      role: "admin",
    });
    const result = await handleLoginRequest(
      {
        bodyText: JSON.stringify({
          email: ADMIN_A_EMAIL,
          password: ADMIN_A_PASSWORD,
        }),
        now: NOW,
      },
      userStore,
      tokenStore,
    );

    const token = result.status === 200 ? result.body.token : null;

    assert.equal(typeof token, "string");
  });

  it("should return 401 when the password is wrong", async () => {
    const { userStore, tokenStore } = await seedUser({
      email: ADMIN_A_EMAIL,
      password: ADMIN_A_PASSWORD,
      clientId: TEST_CLIENT_A_ID,
      role: "admin",
    });
    const result = await handleLoginRequest(
      {
        bodyText: JSON.stringify({
          email: ADMIN_A_EMAIL,
          password: "wrong-password",
        }),
        now: NOW,
      },
      userStore,
      tokenStore,
    );

    assert.deepEqual(result, {
      status: 401,
      body: { error: INVALID_CREDENTIALS_ERROR },
    });
  });

  it("should return the same 401 body when the email is unknown", async () => {
    const { userStore, tokenStore } = await seedUser({
      email: ADMIN_A_EMAIL,
      password: ADMIN_A_PASSWORD,
      clientId: TEST_CLIENT_A_ID,
      role: "admin",
    });
    const result = await handleLoginRequest(
      {
        bodyText: JSON.stringify({
          email: "nobody@prophover.local",
          password: ADMIN_A_PASSWORD,
        }),
        now: NOW,
      },
      userStore,
      tokenStore,
    );

    assert.deepEqual(result, {
      status: 401,
      body: { error: INVALID_CREDENTIALS_ERROR },
    });
  });

  it("should resolve the issued token to the user's client and role", async () => {
    const { userStore, tokenStore, user } = await seedUser({
      email: "member-b@prophover.local",
      password: "password-member-b",
      clientId: TEST_CLIENT_B_ID,
      role: "member",
    });
    const login = await handleLoginRequest(
      {
        bodyText: JSON.stringify({
          email: "member-b@prophover.local",
          password: "password-member-b",
        }),
        now: NOW,
      },
      userStore,
      tokenStore,
    );
    const token = login.status === 200 ? login.body.token : "";
    const auth = await requireAuth(
      {
        authorizationHeader: `Bearer ${token}`,
        now: NOW,
        authRequired: true,
      },
      tokenStore,
      userStore,
    );

    assert.deepEqual(
      isRequireAuthOk(auth) && !auth.skipped
        ? {
            userId: auth.userId,
            clientId: auth.clientId,
            role: auth.role,
          }
        : null,
      {
        userId: user.id,
        clientId: TEST_CLIENT_B_ID,
        role: "member",
      },
    );
  });
});
