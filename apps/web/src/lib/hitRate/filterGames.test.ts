import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { GameVenue, PlayerGame } from "../gameLogs/types/playerGame";
import { sampleHitRateGames } from "./fixtures/sampleGames";
import { filterGames } from "./filterGames";

interface PlayerGameFixtureInput {
  id: number;
  gameDate: Date;
  opponent?: string;
  venue?: GameVenue;
}

const buildPlayerGame = (input: PlayerGameFixtureInput): PlayerGame => ({
  id: input.id,
  gameDate: input.gameDate,
  opponent: input.opponent ?? "SA",
  venue: input.venue ?? "home",
  pts: 20,
  reb: 10,
  ast: 8,
});

const date = (isoDate: string): Date => new Date(`${isoDate}T00:00:00.000Z`);

const idsOf = (games: PlayerGame[]): number[] => games.map((game) => game.id);

const unsortedGames = (): PlayerGame[] => [
  buildPlayerGame({
    id: 3,
    gameDate: date("2026-04-05"),
    opponent: "SA",
    venue: "away",
  }),
  buildPlayerGame({
    id: 1,
    gameDate: date("2026-04-01"),
    opponent: "SA",
    venue: "home",
  }),
  buildPlayerGame({
    id: 7,
    gameDate: date("2026-04-13"),
    opponent: "SA",
    venue: "away",
  }),
  buildPlayerGame({
    id: 2,
    gameDate: date("2026-04-03"),
    opponent: "MEM",
    venue: "away",
  }),
  buildPlayerGame({
    id: 5,
    gameDate: date("2026-04-09"),
    opponent: "SA",
    venue: "home",
  }),
  buildPlayerGame({
    id: 4,
    gameDate: date("2026-04-07"),
    opponent: "MEM",
    venue: "home",
  }),
  buildPlayerGame({
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

  it("should keep the UTAH home game when lastN is 3 opponent is UTAH and venue is home", () => {
    const result = filterGames(sampleHitRateGames, {
      lastN: 3,
      opponent: "UTAH",
      venue: "home",
    });

    assert.deepEqual(idsOf(result), [6]);
  });

  it("should return an empty array when lastN opponent and venue match no games", () => {
    const result = filterGames(sampleHitRateGames, {
      lastN: 5,
      opponent: "MEM",
      venue: "home",
    });

    assert.deepEqual(idsOf(result), []);
  });

  it("should return all filtered games when lastN is larger than the filtered list", () => {
    const games = unsortedGames();

    const result = filterGames(games, { lastN: 50, opponent: "MEM" });

    assert.deepEqual(idsOf(result), [6, 4, 2]);
  });
});
