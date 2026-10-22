import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GameLog, Venue } from "@prisma/client";
import { filterGames } from "./filterGames";

interface GameLogFixtureInput {
  id: number;
  gameDate: Date;
  opponent?: string;
  venue?: Venue;
}

const buildGameLog = (input: GameLogFixtureInput): GameLog => ({
  playerId: 1,
  opponent: input.opponent ?? "SA",
  venue: input.venue ?? "home",
  pts: 20,
  reb: 10,
  ast: 8,
  source: "espn",
  sourceGameId: String(input.id),
  id: input.id,
  gameDate: input.gameDate,
});

const date = (isoDate: string): Date => new Date(`${isoDate}T00:00:00.000Z`);

const idsOf = (games: GameLog[]): number[] => games.map((game) => game.id);

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

  it("should keep the 5 newest games when lastN is 5", () => {
    const games = unsortedGames();

    const result = filterGames(games, { lastN: 5 });

    assert.deepEqual(idsOf(result), [7, 6, 5, 4, 3]);
  });

  it("should keep only matching opponents when opponent is SA", () => {
    const games = unsortedGames();

    const result = filterGames(games, { opponent: "SA" });

    assert.deepEqual(idsOf(result), [7, 5, 3, 1]);
  });

  it("should keep only home games when venue is home", () => {
    const games = unsortedGames();

    const result = filterGames(games, { venue: "home" });

    assert.deepEqual(idsOf(result), [5, 4, 1]);
  });

  it("should apply lastN after opponent and venue filters", () => {
    const games = unsortedGames();

    const result = filterGames(games, {
      opponent: "SA",
      venue: "home",
      lastN: 2,
    });

    assert.deepEqual(idsOf(result), [5, 1]);
  });

  it("should return all filtered games when lastN is larger than the filtered list", () => {
    const games = unsortedGames();

    const result = filterGames(games, { lastN: 50, opponent: "MEM" });

    assert.deepEqual(idsOf(result), [6, 4, 2]);
  });
});
