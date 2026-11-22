import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { FORBIDDEN_ERROR } from "../auth/errors";
import type {
  RequireAuthAuthenticated,
  RequireAuthSkipped,
} from "../auth/types/requireAuth";
import type { UserRole } from "../auth/types/userRole";
import { TEST_CLIENT_A_ID, TEST_CLIENT_B_ID } from "../clients/constants";
import { DEFAULT_CLIENT_LAST_N } from "./constants";
import { handleClientSettingsRequest } from "./handleClientSettingsRequest";
import { createMemoryClientSettingsStore } from "./memoryClientSettingsStore";
import type { ClientSettingsHttpResult } from "./types/api";
import type { ClientSettingsStore } from "./types/clientSettingsStore";

const skippedAuth: RequireAuthSkipped = { ok: true, skipped: true };

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

const seededStore = (): ClientSettingsStore =>
  createMemoryClientSettingsStore([
    { clientId: TEST_CLIENT_A_ID, defaultLastN: DEFAULT_CLIENT_LAST_N },
    { clientId: TEST_CLIENT_B_ID, defaultLastN: DEFAULT_CLIENT_LAST_N },
  ]);

const handleGet = (
  auth: RequireAuthAuthenticated | RequireAuthSkipped,
  store: ClientSettingsStore,
  searchParams = new URLSearchParams(),
): Promise<ClientSettingsHttpResult> =>
  handleClientSettingsRequest(
    {
      method: "GET",
      searchParams,
      bodyText: "",
      auth,
    },
    store,
  );

interface PatchBody {
  clientId?: string;
  defaultLastN?: number;
}

const handlePatch = (
  auth: RequireAuthAuthenticated | RequireAuthSkipped,
  store: ClientSettingsStore,
  body: PatchBody,
): Promise<ClientSettingsHttpResult> =>
  handleClientSettingsRequest(
    {
      method: "PATCH",
      searchParams: new URLSearchParams(),
      bodyText: JSON.stringify(body),
      auth,
    },
    store,
  );

describe("handleClientSettingsRequest", () => {
  it("should return defaultLastN 10 when an admin reads their client settings", async () => {
    const result = await handleGet(
      authFor(TEST_CLIENT_A_ID, "admin"),
      seededStore(),
    );

    assert.deepEqual(result.status === 200 ? result.body : null, {
      clientId: TEST_CLIENT_A_ID,
      defaultLastN: 10,
    });
  });

  it("should return the client settings when a member reads them", async () => {
    const result = await handleGet(
      authFor(TEST_CLIENT_A_ID, "member"),
      seededStore(),
    );

    assert.deepEqual(result.status === 200 ? result.body : null, {
      clientId: TEST_CLIENT_A_ID,
      defaultLastN: 10,
    });
  });

  it("should return defaultLastN 5 when an admin patches their client setting to 5", async () => {
    const result = await handlePatch(
      authFor(TEST_CLIENT_A_ID, "admin"),
      seededStore(),
      { defaultLastN: 5 },
    );

    assert.deepEqual(result.status === 200 ? result.body : null, {
      clientId: TEST_CLIENT_A_ID,
      defaultLastN: 5,
    });
  });

  it("should return 403 when a member patches client settings", async () => {
    const result = await handlePatch(
      authFor(TEST_CLIENT_A_ID, "member"),
      seededStore(),
      { defaultLastN: 5 },
    );

    assert.deepEqual(result, {
      status: 403,
      body: { error: FORBIDDEN_ERROR },
    });
  });

  it("should keep defaultLastN 10 when a member patches client settings", async () => {
    const store = seededStore();
    await handlePatch(authFor(TEST_CLIENT_A_ID, "member"), store, {
      defaultLastN: 5,
    });
    const row = await store.getByClientId(TEST_CLIENT_A_ID);

    assert.equal(row?.defaultLastN, 10);
  });

  it("should return the token client's settings when GET query includes another client id", async () => {
    const store = createMemoryClientSettingsStore([
      { clientId: TEST_CLIENT_A_ID, defaultLastN: 10 },
      { clientId: TEST_CLIENT_B_ID, defaultLastN: 5 },
    ]);
    const result = await handleGet(
      authFor(TEST_CLIENT_A_ID, "member"),
      store,
      new URLSearchParams({ clientId: TEST_CLIENT_B_ID }),
    );

    assert.deepEqual(result.status === 200 ? result.body : null, {
      clientId: TEST_CLIENT_A_ID,
      defaultLastN: 10,
    });
  });

  it("should update the token client's setting when PATCH body includes another client id", async () => {
    const result = await handlePatch(
      authFor(TEST_CLIENT_A_ID, "admin"),
      seededStore(),
      { clientId: TEST_CLIENT_B_ID, defaultLastN: 5 },
    );

    assert.deepEqual(result.status === 200 ? result.body : null, {
      clientId: TEST_CLIENT_A_ID,
      defaultLastN: 5,
    });
  });

  it("should leave the other client's setting unchanged when PATCH body includes that client id", async () => {
    const store = seededStore();
    await handlePatch(authFor(TEST_CLIENT_A_ID, "admin"), store, {
      clientId: TEST_CLIENT_B_ID,
      defaultLastN: 5,
    });
    const row = await store.getByClientId(TEST_CLIENT_B_ID);

    assert.equal(row?.defaultLastN, 10);
  });

  it("should return 401 when GET auth was skipped", async () => {
    const result = await handleGet(skippedAuth, seededStore());

    assert.equal(result.status, 401);
  });

  it("should return 401 when PATCH auth was skipped", async () => {
    const result = await handlePatch(skippedAuth, seededStore(), {
      defaultLastN: 5,
    });

    assert.equal(result.status, 401);
  });
});
