import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GameLog } from "@prisma/client";
import { computeHitRate } from "./computeHitRate";
import { validateStat } from "./validateStat";

const invalidResult = {
  ok: false,
  error: "Invalid stat. Allowed values: PTS, REB, AST.",
} as const;

const buildGameLog = (pts: number): GameLog => ({
  playerId: 1,
  opponent: "SA",
  venue: "home",
  pts,
  reb: 10,
  ast: 8,
  source: "espn",
  sourceGameId: "1",
  id: 1,
  gameDate: new Date("2026-04-01T00:00:00.000Z"),
});

describe("validateStat", () => {
  it("should return pts when the input is lowercase pts", () => {
    const result = validateStat("pts");

    assert.deepEqual(result, { ok: true, stat: "pts" });
  });

  it("should return reb when the input is lowercase reb", () => {
    const result = validateStat("reb");

    assert.deepEqual(result, { ok: true, stat: "reb" });
  });

  it("should return ast when the input is lowercase ast", () => {
    const result = validateStat("ast");

    assert.deepEqual(result, { ok: true, stat: "ast" });
  });

  it("should return pts when the input is mixed-case Pts", () => {
    const result = validateStat("Pts");

    assert.deepEqual(result, { ok: true, stat: "pts" });
  });

  it("should return reb when the input is mixed-case ReB", () => {
    const result = validateStat("ReB");

    assert.deepEqual(result, { ok: true, stat: "reb" });
  });

  it("should return ast when the input is mixed-case AsT", () => {
    const result = validateStat("AsT");

    assert.deepEqual(result, { ok: true, stat: "ast" });
  });

  it("should return pts when the input is Pts with surrounding whitespace", () => {
    const result = validateStat(" Pts ");

    assert.deepEqual(result, { ok: true, stat: "pts" });
  });

  it("should return reb when the input is REB with surrounding whitespace", () => {
    const result = validateStat(" REB ");

    assert.deepEqual(result, { ok: true, stat: "reb" });
  });

  it("should return ast when the input is ast with surrounding whitespace", () => {
    const result = validateStat(" ast ");

    assert.deepEqual(result, { ok: true, stat: "ast" });
  });

  it("should reject when the stat is STL", () => {
    const result = validateStat("STL");

    assert.deepEqual(result, invalidResult);
  });

  it("should reject when the stat is 3PM", () => {
    const result = validateStat("3PM");

    assert.deepEqual(result, invalidResult);
  });

  it("should reject when the input is an empty string", () => {
    const result = validateStat("");

    assert.deepEqual(result, invalidResult);
  });

  it("should reject when the input is undefined", () => {
    const result = validateStat(undefined);

    assert.deepEqual(result, invalidResult);
  });

  it("should reject when the input is null", () => {
    const result = validateStat(null);

    assert.deepEqual(result, invalidResult);
  });

  it("should reject when the input is a number", () => {
    const result = validateStat(3);

    assert.deepEqual(result, invalidResult);
  });

  it("should pass a validated stat into computeHitRate without remapping", () => {
    const games = [buildGameLog(30)];
    const validated = validateStat("PTS");

    if (!validated.ok) {
      throw new Error(validated.error);
    }

    const result = computeHitRate(games, 24.5, validated.stat);

    assert.deepEqual(result, { hitRate: 1, hits: 1, n: 1 });
  });
});
