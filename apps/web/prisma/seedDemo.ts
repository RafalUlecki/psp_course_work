import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient, Venue } from "@prisma/client";

import {
  DEMO_CSV_RELATIVE_PATH,
  DEMO_CSV_SOURCE,
} from "../src/lib/demoSeed/constants/demoSeedConstants";
import { parsePlayerStatisticsCsv } from "../src/lib/demoSeed/parsePlayerStatistics";
import {
  latestPlayersFromRows,
  parsePlayerNameList,
  resolveRequestedPlayers,
  rowsForPlayerIds,
} from "../src/lib/demoSeed/selectDemoPlayers";
import type { DemoPlayer } from "../src/lib/demoSeed/types/demoPlayer";
import type { PlayerStatisticsRow } from "../src/lib/demoSeed/types/playerStatisticsRow";
import {
  buildPlayerNameMap,
  toPlayersJson,
} from "../src/lib/players/playerNameMap";

const SEED_DIR = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(SEED_DIR, "..");
const DEMO_CSV_PATH = path.resolve(APP_ROOT, DEMO_CSV_RELATIVE_PATH);
const PLAYERS_JSON_PATH = path.resolve(APP_ROOT, "../extension/players.json");
const BATCH_SIZE = 100;

interface SeedDemoCliOptions {
  playerNames: string[] | null;
}

interface UpsertGameLogsResult {
  inserted: number;
  updated: number;
  removedNonKaggle: number;
}

interface UpsertPlayerGameLogsProps {
  playerId: number;
  rows: PlayerStatisticsRow[];
}

interface WrappedThrown {
  value: object;
}

const formatThrownMessage = (
  thrown: Error | string | WrappedThrown,
): string => {
  if (thrown instanceof Error) {
    return thrown.message;
  }
  if (typeof thrown === "string") {
    return thrown;
  }
  return String(thrown.value);
};

const wrapThrown = (
  thrown: Error | string | object,
): Error | string | WrappedThrown => {
  if (thrown instanceof Error || typeof thrown === "string") {
    return thrown;
  }
  return { value: thrown };
};

const messageFromCaught = (thrown: Error | string | object): string =>
  formatThrownMessage(wrapThrown(thrown));

const loadDotEnv = (): void => {
  const envPath = path.resolve(APP_ROOT, ".env");
  if (existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
};

loadDotEnv();

const prisma = new PrismaClient();

const parseArgs = (argv: string[]): SeedDemoCliOptions => {
  let playersRaw: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--players") {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith("--")) {
        throw new Error(
          'Missing value for --players. Example: --players "Luka Doncic,Austin Reaves"',
        );
      }
      playersRaw = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--players=")) {
      playersRaw = arg.slice("--players=".length);
      continue;
    }
    if (arg.startsWith("--")) {
      throw new Error(`Unsupported flag: ${arg}. Supported: --players`);
    }
    throw new Error(
      `Unexpected argument: ${arg}. Supported: --players "Luka Doncic,Austin Reaves"`,
    );
  }

  if (playersRaw === undefined) {
    return { playerNames: null };
  }

  const parsedNames = parsePlayerNameList(playersRaw);

  if (parsedNames.length === 0) {
    throw new Error(
      `No player names given. Example: --players "Luka Doncic,Austin Reaves"`,
    );
  }

  return { playerNames: parsedNames };
};

const missingPlayersError = (missing: string[]): Error => {
  if (missing.length === 1) {
    return new Error(
      `Player not found in PlayerStatistics.csv: ${missing[0]}`,
    );
  }

  return new Error(
    `Players not found in PlayerStatistics.csv: ${missing.join(", ")}`,
  );
};

const chunk = <TItem>(items: TItem[], size: number): TItem[][] => {
  const batches: TItem[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
};

const gameLogCompositeKey = (
  playerId: number,
  source: string,
  sourceGameId: string,
): string => `${playerId}\0${source}\0${sourceGameId}`;

const upsertPlayer = async (player: DemoPlayer): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    const existingByName = await tx.player.findUnique({
      where: { name: player.name },
    });

    if (existingByName !== null && existingByName.id !== player.id) {
      await tx.player.delete({ where: { id: existingByName.id } });
    }

    await tx.player.upsert({
      where: { id: player.id },
      create: {
        id: player.id,
        name: player.name,
        team: player.team,
      },
      update: {
        name: player.name,
        team: player.team,
      },
    });
  });
};

const upsertPlayers = async (players: DemoPlayer[]): Promise<void> => {
  for (const player of players) {
    await upsertPlayer(player);
  }
};

const upsertPlayerGameLogs = async (
  props: UpsertPlayerGameLogsProps,
): Promise<UpsertGameLogsResult> => {
  const { playerId, rows } = props;

  return prisma.$transaction(async (tx) => {
    const deleted = await tx.gameLog.deleteMany({
      where: {
        playerId,
        source: { not: DEMO_CSV_SOURCE },
      },
    });

    let inserted = 0;
    let updated = 0;

    for (const batch of chunk(rows, BATCH_SIZE)) {
      const existing = await tx.gameLog.findMany({
        where: {
          OR: batch.map((row) => ({
            playerId: row.personId,
            source: DEMO_CSV_SOURCE,
            sourceGameId: row.gameId,
          })),
        },
        select: {
          playerId: true,
          source: true,
          sourceGameId: true,
        },
      });

      const existingKeys = new Set(
        existing.map((row) =>
          gameLogCompositeKey(row.playerId, row.source, row.sourceGameId),
        ),
      );

      for (const row of batch) {
        const key = gameLogCompositeKey(
          row.personId,
          DEMO_CSV_SOURCE,
          row.gameId,
        );
        if (existingKeys.has(key)) {
          updated += 1;
        } else {
          inserted += 1;
        }

        const venue: Venue = row.venue === Venue.home ? Venue.home : Venue.away;

        await tx.gameLog.upsert({
          where: {
            playerId_source_sourceGameId: {
              playerId: row.personId,
              source: DEMO_CSV_SOURCE,
              sourceGameId: row.gameId,
            },
          },
          create: {
            playerId: row.personId,
            source: DEMO_CSV_SOURCE,
            sourceGameId: row.gameId,
            gameDate: row.gameDate,
            opponent: row.opponent,
            venue,
            pts: row.points,
            reb: row.reboundsTotal,
            ast: row.assists,
          },
          update: {
            gameDate: row.gameDate,
            opponent: row.opponent,
            venue,
            pts: row.points,
            reb: row.reboundsTotal,
            ast: row.assists,
          },
        });
      }
    }

    return { inserted, updated, removedNonKaggle: deleted.count };
  });
};

const upsertGameLogs = async (props: {
  rows: PlayerStatisticsRow[];
  playerIds: number[];
}): Promise<UpsertGameLogsResult> => {
  const { rows, playerIds } = props;
  let inserted = 0;
  let updated = 0;
  let removedNonKaggle = 0;

  for (const playerId of playerIds) {
    const counts = await upsertPlayerGameLogs({
      playerId,
      rows: rows.filter((row) => row.personId === playerId),
    });
    inserted += counts.inserted;
    updated += counts.updated;
    removedNonKaggle += counts.removedNonKaggle;
  }

  return { inserted, updated, removedNonKaggle };
};

const writePlayersJson = (players: DemoPlayer[]): void => {
  writeFileSync(PLAYERS_JSON_PATH, toPlayersJson(buildPlayerNameMap(players)));
};

const loadCsvRows = (): PlayerStatisticsRow[] => {
  if (!existsSync(DEMO_CSV_PATH)) {
    throw new Error(`CSV file not found: ${DEMO_CSV_PATH}`);
  }

  return parsePlayerStatisticsCsv(readFileSync(DEMO_CSV_PATH, "utf8"));
};

const printSummary = (props: {
  seededAll: boolean;
  players: DemoPlayer[];
  inserted: number;
  updated: number;
  removedNonKaggle: number;
}): void => {
  const { seededAll, players, inserted, updated, removedNonKaggle } = props;
  console.log(`CSV: ${DEMO_CSV_PATH}`);
  if (seededAll) {
    console.log(`Players: all (${players.length})`);
  } else {
    console.log(`Players: ${players.map((player) => player.name).join(", ")}`);
    for (const player of players) {
      console.log(`  ${player.name} id=${player.id} team=${player.team}`);
    }
  }
  console.log(`Non-kaggle game logs removed: ${removedNonKaggle}`);
  console.log(`Game logs inserted: ${inserted}`);
  console.log(`Game logs updated: ${updated}`);
  console.log(`Wrote ${PLAYERS_JSON_PATH} (${players.length} names)`);
};

const main = async (): Promise<void> => {
  const options = parseArgs(process.argv.slice(2));
  const rows = loadCsvRows();
  const catalog = latestPlayersFromRows(rows);
  const seededAll = options.playerNames === null;
  let players: DemoPlayer[];

  if (options.playerNames === null) {
    players = catalog;
  } else {
    const resolved = resolveRequestedPlayers({
      requestedNames: options.playerNames,
      catalog,
    });

    if (resolved.missing.length > 0) {
      throw missingPlayersError(resolved.missing);
    }

    players = resolved.players;
  }

  const playerIds = players.map((player) => player.id);
  const selectedRows = rowsForPlayerIds({ rows, playerIds });

  await upsertPlayers(players);
  const { inserted, updated, removedNonKaggle } = await upsertGameLogs({
    rows: selectedRows,
    playerIds,
  });
  writePlayersJson(players);

  printSummary({
    seededAll,
    players,
    inserted,
    updated,
    removedNonKaggle,
  });
};

const runSeed = async (): Promise<void> => {
  try {
    await main();
  } catch (thrown) {
    if (
      thrown instanceof Error ||
      typeof thrown === "string" ||
      (thrown !== null && typeof thrown === "object")
    ) {
      console.error(`Seed failed: ${messageFromCaught(thrown)}`);
    } else {
      console.error(`Seed failed: ${String(thrown)}`);
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

runSeed();
