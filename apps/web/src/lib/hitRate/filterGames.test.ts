import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GameLog, Venue } from "@prisma/client";
import { filterGames } from "./filterGames";

const buildGameLog = (
  overrides: Partial<GameLog> & Pick<GameLog, "id" | "gameDate">,
): GameLog => ({
  playerId: 1,
  opponent: "SA",
  venue: "home" satisfies Venue,
  pts: 20,
  reb: 10,
  ast: 8,
  source: "espn",
  sourceGameId: String(overrides.id),
  ...overrides,
});

const date = (isoDate: string): Date => new Date(`${isoDate}T00:00:00.000Z`);

const idsOf = (games: GameLog[]): number[] => games.map((game) => game.id);

/**
 * Unsorted mix of opponents and venues. Newest → oldest by gameDate:
 * 7 Apr 13 SA away, 6 Apr 11 MEM away, 5 Apr 09 SA home,
 * 4 Apr 07 MEM home, 3 Apr 05 SA away, 2 Apr 03 MEM away, 1 Apr 01 SA home.
 */
const unsortedGames = (): GameLog[] => [
  buildGameLog({
    id: 3,
    gameDate: date("2026-04-05"),
    opponent: "SA",
    venue: "away",
  }),
  buildGameLog({
    id: 1,
    gameDate: date("2026-04-01"),
    opponent: "SA",
    venue: "home",
  }),
  buildGameLog({
    id: 7,
    gameDate: date("2026-04-13"),
    opponent: "SA",
    venue: "away",
  }),
  buildGameLog({
    id: 2,
    gameDate: date("2026-04-03"),
    opponent: "MEM",
    venue: "away",
  }),
  buildGameLog({
    id: 5,
    gameDate: date("2026-04-09"),
    opponent: "SA",
    venue: "home",
  }),
  buildGameLog({
    id: 4,
    gameDate: date("2026-04-07"),
    opponent: "MEM",
    venue: "home",
  }),
  buildGameLog({
    id: 6,
    gameDate: date("2026-04-11"),
    opponent: "MEM",
    venue: "away",
  }),
];

describe("filterGames", () => {
  it("should return an empty array when games is empty", () => {
    const result = filterGames([]);

    assert.deepEqual(result, []);
  });

  it("should not mutate the input array", () => {
    const games = unsortedGames();
    const originalIds = idsOf(games);
    const originalSnapshot = games.map((game) => ({ ...game }));

    const result = filterGames(games, { lastN: 3, opponent: "SA" });

    assert.notEqual(result, games);
    assert.deepEqual(idsOf(games), originalIds);
    assert.deepEqual(
      games.map((game) => ({ ...game })),
      originalSnapshot,
    );
  });

  it("should keep the 5 newest games when lastN is 5", () => {
    const games = unsortedGames();

    const result = filterGames(games, { lastN: 5 });

    assert.deepEqual(idsOf(result), [7, 6, 5, 4, 3]);
  });

  it("should filter by opponent using GameLog.opponent", () => {
    const games = unsortedGames();

    const result = filterGames(games, { opponent: "SA" });

    assert.deepEqual(idsOf(result), [7, 5, 3, 1]);
    assert.ok(result.every((game) => game.opponent === "SA"));
  });

  it("should filter by venue using GameLog.venue home/away", () => {
    const games = unsortedGames();

    const result = filterGames(games, { venue: "home" });

    assert.deepEqual(idsOf(result), [5, 4, 1]);
    assert.ok(result.every((game) => game.venue === "home"));
  });

  it("should apply opponent, venue, and lastN together", () => {
    const games = unsortedGames();

    const result = filterGames(games, {
      opponent: "SA",
      venue: "home",
      lastN: 1,
    });

    assert.deepEqual(idsOf(result), [5]);
    assert.equal(result[0]?.opponent, "SA");
    assert.equal(result[0]?.venue, "home");
  });

  it("should take lastN from filtered games not from the unfiltered newest slice", () => {
    const games = unsortedGames();

    const result = filterGames(games, {
      opponent: "SA",
      venue: "home",
      lastN: 2,
    });

    // Filter-then-lastN: SA home = Apr 09 (id 5), Apr 01 (id 1).
    // lastN-then-filter would take Apr 13 / Apr 11 and then drop both.
    assert.deepEqual(idsOf(result), [5, 1]);
  });

  it("should return all remaining games when lastN is larger than the list", () => {
    const games = unsortedGames();

    const result = filterGames(games, { lastN: 50, opponent: "MEM" });

    assert.deepEqual(idsOf(result), [6, 4, 2]);
  });

  it("should return all games newest-first when lastN is undefined", () => {
    const games = unsortedGames();

    const result = filterGames(games, { opponent: "MEM" });

    assert.deepEqual(idsOf(result), [6, 4, 2]);
    assert.equal(result.length, 3);
  });
});
