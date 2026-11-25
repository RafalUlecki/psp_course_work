import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { runHitRatePerf } from "./runHitRatePerf";
import type { MachineConditions } from "./types/collectConditions";
import type { PerfFetch, PerfHttpResponse } from "./types/fetchLike";
import type { RunHitRatePerfProps } from "./types/runHitRatePerf";

const machine: MachineConditions = {
  hostname: "cursor",
  platform: "linux",
  release: "6.12",
  arch: "x64",
  cpuModel: "Test CPU",
  cpuCount: 4,
  totalMemoryBytes: 1,
};

const jsonResponse = (status: number, body: object): PerfHttpResponse => ({
  status,
  text: async () => JSON.stringify(body),
});

const baseProps = (fetchImpl: PerfFetch): RunHitRatePerfProps => ({
  baseUrl: "http://localhost:3000",
  measuredCount: 2,
  warmupCount: 1,
  csvText: "personId\n203999\n",
  fetchImpl,
  nowMs: (() => {
    let now = 0;
    return () => {
      now += 3;
      return now;
    };
  })(),
  measuredAt: new Date("2026-11-22T20:00:00.000Z"),
  machine,
  command: "cd apps/web && npm run perf",
});

describe("runHitRatePerf", () => {
  it("should log in when the unauthenticated probe returns 401", async () => {
    const methods: string[] = [];
    const fetchImpl: PerfFetch = async (url, init) => {
      if (url.includes("/api/auth/login")) {
        methods.push("login");
        return jsonResponse(200, { token: "t" });
      }
      if (init?.headers?.Authorization === undefined) {
        return jsonResponse(401, { error: "unauthorized" });
      }
      return jsonResponse(200, { playerId: 203999, n: 10 });
    };
    await runHitRatePerf(baseProps(fetchImpl));
    assert.deepEqual(methods, ["login"]);
  });

  it("should skip login when the unauthenticated probe returns 200", async () => {
    let loggedIn = false;
    const fetchImpl: PerfFetch = async (url) => {
      if (url.includes("/api/auth/login")) {
        loggedIn = true;
        return jsonResponse(200, { token: "t" });
      }
      return jsonResponse(200, { playerId: 203999, n: 10 });
    };
    await runHitRatePerf(baseProps(fetchImpl));
    assert.equal(loggedIn, false);
  });

  it("should mark typicalPassed when p50 is under 300 ms", async () => {
    const fetchImpl: PerfFetch = async () =>
      jsonResponse(200, { playerId: 203999, n: 10 });
    const result = await runHitRatePerf(baseProps(fetchImpl));
    assert.equal(result.ok ? result.typicalPassed : null, true);
  });
});
