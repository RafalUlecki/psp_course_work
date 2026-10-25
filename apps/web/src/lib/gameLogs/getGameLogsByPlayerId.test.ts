import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import type { GameLog } from "@prisma/client";

import { getGameLogsByPlayerId } from "./getGameLogsByPlayerId";
import type { PlayerGame } from "./types/playerGame";
import type { GameLogReader } from "./types/getGameLogsByPlayerId";

const buildGameLog = (
  overrides: Pick<GameLog, "id" | "playerId" | "gameDate">,
): GameLog => ({
  opponent: "SA",
  venue: "home",
  pts: 20,
  reb: 10,
  ast: 8,
  source: "espn",
  sourceGameId: String(overrides.id),
  ...overrides,
});

const toExpectedPlayerGame = (row: GameLog): PlayerGame => ({
  id: row.id,
  gameDate: row.gameDate,
  opponent: row.opponent,
  venue: row.venue,
  pts: row.pts,
  reb: row.reb,
  ast: row.ast,
});

type FindMany = GameLogReader["gameLog"]["findMany"];

const readerWith = (findMany: FindMany): GameLogReader => ({
  gameLog: { findMany },
});

describe("getGameLogsByPlayerId", () => {
  it("should filter by player id when player id is a valid integer", async () => {
    const playerId = 1;
    const findMany = mock.fn<FindMany>(async () => []);

    await getGameLogsByPlayerId(playerId, readerWith(findMany));

    assert.equal(
      findMany.mock.calls[0]?.arguments[0]?.where.playerId,
      playerId,
    );
  });

  it("should order by game date descending when player id is a valid integer", async () => {
    const playerId = 1;
    const findMany = mock.fn<FindMany>(async () => []);

    await getGameLogsByPlayerId(playerId, readerWith(findMany));

    assert.equal(
      findMany.mock.calls[0]?.arguments[0]?.orderBy.gameDate,
      "desc",
    );
  });

  it("should return mapped player games when player id is a valid integer", async () => {
    const playerId = 1;
    const rows: GameLog[] = [
      buildGameLog({
        id: 2,
        playerId,
        gameDate: new Date("2026-04-12T00:00:00.000Z"),
      }),
      buildGameLog({
        id: 1,
        playerId,
        gameDate: new Date("2026-03-18T00:00:00.000Z"),
      }),
    ];
    const findMany = mock.fn<FindMany>(async () => rows);

    const result = await getGameLogsByPlayerId(playerId, readerWith(findMany));

    assert.deepEqual(result, rows.map(toExpectedPlayerGame));
  });

  it("should return an empty array when findMany returns no rows", async () => {
    const findMany = mock.fn<FindMany>(async () => []);

    const result = await getGameLogsByPlayerId(999_999, readerWith(findMany));

    assert.deepEqual(result, []);
  });

  it("should return an empty array when player id is not an integer", async () => {
    const findMany = mock.fn<FindMany>(async () => {
      throw new Error("findMany should not be called");
    });

    const result = await getGameLogsByPlayerId(
      Number.NaN,
      readerWith(findMany),
    );

    assert.deepEqual(result, []);
  });
});
