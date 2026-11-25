import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { probeHitRateAuth } from "./probeHitRateAuth";
import type { PerfFetch } from "./types/fetchLike";

const fetchWithStatus = (status: number): PerfFetch => async () => ({
  status,
  text: async () => "",
});

describe("probeHitRateAuth", () => {
  it("should report auth required when the probe returns 401", async () => {
    const result = await probeHitRateAuth({
      baseUrl: "http://localhost:3000",
      fetchImpl: fetchWithStatus(401),
    });
    assert.equal(result.ok ? result.authRequired : null, true);
  });

  it("should report auth off when the probe returns 200", async () => {
    const result = await probeHitRateAuth({
      baseUrl: "http://localhost:3000",
      fetchImpl: fetchWithStatus(200),
    });
    assert.equal(result.ok ? result.authRequired : null, false);
  });
});
