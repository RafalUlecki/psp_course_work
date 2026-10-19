import assert from "node:assert/strict";
import { after, describe, it, mock } from "node:test";
import type { GameLog, Venue } from "@prisma/client";
import { prisma } from "./prisma";
import {
  getGameLogsByPlayerId,
  type GameLogReader,
} from "./getGameLogsByPlayerId";

const gameLog = (
  overrides: Pick<GameLog, "id" | "playerId" | "gameDate">,
): GameLog => ({
  opponent: "SA",
  venue: "home" satisfies Venue,
  pts: 20,
  reb: 10,
  ast: 8,
  source: "espn",
  sourceGameId: String(overrides.id),
  ...overrides,
});

type FindMany = GameLogReader["gameLog"]["findMany"];

const readerWith = (findMany: FindMany): GameLogReader => ({
  gameLog: { findMany },
});

describe("getGameLogsByPlayerId", () => {
  it("queries by playerId ordered by gameDate descending", async () => {
    const playerId = 1;
    const rows: GameLog[] = [
      gameLog({
        id: 2,
        playerId,
        gameDate: new Date("2026-04-12T00:00:00.000Z"),
      }),
      gameLog({
        id: 1,
        playerId,
        gameDate: new Date("2026-03-18T00:00:00.000Z"),
      }),
    ];
    const findMany = mock.fn<FindMany>(async () => rows);

    const result = await getGameLogsByPlayerId(playerId, readerWith(findMany));

    assert.equal(findMany.mock.callCount(), 1);
    assert.deepEqual(findMany.mock.calls[0]?.arguments, [
      {
        where: { playerId },
        orderBy: { gameDate: "desc" },
      },
    ]);
    assert.equal(result, rows);
    assert.ok(
      result[0]!.gameDate.getTime() > result[1]!.gameDate.getTime(),
      "fixture rows are newest-first",
    );
  });

  it("returns an empty array for an unknown player id without throwing", async () => {
    const findMany = mock.fn<FindMany>(async () => []);

    const result = await getGameLogsByPlayerId(999_999, readerWith(findMany));

    assert.equal(findMany.mock.callCount(), 1);
    assert.deepEqual(findMany.mock.calls[0]?.arguments, [
      {
        where: { playerId: 999_999 },
        orderBy: { gameDate: "desc" },
      },
    ]);
    assert.deepEqual(result, []);
  });

  it("returns an empty array for a non-integer player id without querying", async () => {
    const findMany = mock.fn<FindMany>(async () => {
      throw new Error("findMany should not be called");
    });

    const result = await getGameLogsByPlayerId(Number.NaN, readerWith(findMany));

    assert.equal(findMany.mock.callCount(), 0);
    assert.deepEqual(result, []);
  });
});

const runSeededDbTests = process.env.RUN_DB_TESTS === "1";

describe(
  "getGameLogsByPlayerId against seeded Postgres",
  { skip: !runSeededDbTests },
  () => {
    after(async () => {
      await prisma.$disconnect();
    });

    it("returns the seeded player's logs newest game_date first", async () => {
      const player = await prisma.player.findUnique({
        where: { name: "Nikola Jokic" },
      });
      assert.ok(player, "expected PH-8 seed to include Nikola Jokic");

      const logs = await getGameLogsByPlayerId(player.id);

      assert.equal(logs.length, 12);
      assert.ok(
        logs.every((log) => log.playerId === player.id),
        "all rows belong to the seeded player",
      );

      const dates = logs.map((log) => log.gameDate.getTime());
      const sorted = [...dates].sort((a, b) => b - a);
      assert.deepEqual(dates, sorted);

      const newest = logs[0];
      assert.ok(newest);
      assert.equal(newest.gameDate.toISOString().slice(0, 10), "2026-04-12");
      assert.equal(newest.opponent, "SA");
      assert.equal(newest.venue, "away");
      assert.equal(newest.pts, 23);
      assert.equal(newest.reb, 8);
      assert.equal(newest.ast, 1);
    });

    it("returns [] for an unknown player id and does not throw", async () => {
      const logs = await getGameLogsByPlayerId(999_999);
      assert.deepEqual(logs, []);
    });
  },
);
