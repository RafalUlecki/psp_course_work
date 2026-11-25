import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatPerfReport } from "./formatPerfReport";
import type { FormatPerfReportProps } from "./types/formatPerfReport";

const baseProps = (): FormatPerfReportProps => ({
  measuredAt: new Date("2026-11-22T20:00:00.000Z"),
  command: "cd apps/web && npm run perf",
  baseUrl: "http://localhost:3000",
  measuredCount: 200,
  warmupCount: 10,
  authRequired: true,
  loginEmail: "admin-a@prophover.local",
  playerId: 203999,
  playerGameCount: 65,
  csvSize: { csvRowCount: 1000, csvPlayerCount: 50 },
  machine: {
    hostname: "cursor",
    platform: "linux",
    release: "6.12",
    arch: "x64",
    cpuModel: "Test CPU",
    cpuCount: 4,
    totalMemoryBytes: 16 * 1024 * 1024 * 1024,
  },
  summary: { p50Ms: 12.3, p95Ms: 40.1, maxMs: 80.4 },
  targetMs: 300,
});

describe("formatPerfReport", () => {
  it("should include PASS when p50 is under 300 ms", () => {
    assert.match(formatPerfReport(baseProps()), /\*\*Verdict: PASS\*\*/);
  });

  it("should include FAIL when p50 is 300 ms or more", () => {
    const props = baseProps();
    props.summary = { p50Ms: 301, p95Ms: 400, maxMs: 500 };
    assert.match(formatPerfReport(props), /\*\*Verdict: FAIL\*\*/);
  });

  it("should mention the GameLog player_id game_date index", () => {
    assert.match(formatPerfReport(baseProps()), /@@index\(\[playerId, gameDate\]\)/);
  });

  it("should record that auth was on", () => {
    assert.match(formatPerfReport(baseProps()), /Auth \| on /);
  });
});
