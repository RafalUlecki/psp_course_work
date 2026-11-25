import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loginDemoUser } from "./loginDemoUser";
import type { PerfFetch } from "./types/fetchLike";

describe("loginDemoUser", () => {
  it("should return the token when login succeeds", async () => {
    const fetchImpl: PerfFetch = async () => ({
      status: 200,
      text: async () => JSON.stringify({ token: "demo-token" }),
    });
    const result = await loginDemoUser({
      baseUrl: "http://localhost:3000",
      fetchImpl,
    });
    assert.equal(result.ok ? result.token : null, "demo-token");
  });
});
