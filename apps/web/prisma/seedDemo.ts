import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient, Venue } from "@prisma/client";

import {
  DEMO_CSV_RELATIVE_PATH,
  DEMO_CSV_SOURCE,
  FIXTURE_PLAYER_NAME,
} from "../src/lib/demoSeed/constants/demoSeedConstants";
import { parsePlayerStatisticsCsv } from "../src/lib/demoSeed/parsePlayerStatistics";
import {
  defaultDemoPlayerNames,
  latestPlayersFromRows,
  parsePlayerNameList,
  resolveRequestedPlayers,
  rowsForPlayerIds,
  withFixturePlayer,
} from "../src/lib/demoSeed/selectDemoPlayers";
import type { DemoPlayer } from "../src/lib/demoSeed/types/demoPlayer";
import type { PlayerStatisticsRow } from "../src/lib/demoSeed/types/playerStatisticsRow";
import { normalizePlayerName } from "../src/lib/players/normalizePlayerName";
import {
  buildPlayerNameMap,
  toPlayersJson,
} from "../src/lib/players/playerNameMap";

const SEED_DIR = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(SEED_DIR, "..");
const DEMO_CSV_PATH = path.resolve(APP_ROOT, DEMO_CSV_RELATIVE_PATH);
const PLAYERS_JSON_PATH = path.resolve(APP_ROOT, "../extension/players.json");
const FIXTURE_HTML_PATH = path.resolve(APP_ROOT, "public/fixture/props.html");
const BATCH_SIZE = 100;

interface SeedDemoCliOptions {
  playerNames: string[];
}

interface UpsertGameLogsResult {
  inserted: number;
  updated: number;
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

  const parsedNames =
    playersRaw === undefined
      ? defaultDemoPlayerNames()
      : withFixturePlayer(parsePlayerNameList(playersRaw));

  if (parsedNames.length === 0) {
    throw new Error(
      `No player names given. Always include the fixture player (${FIXTURE_PLAYER_NAME}).`,
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

const upsertGameLogBatch = async (
  batch: PlayerStatisticsRow[],
): Promise<UpsertGameLogsResult> => {
  return prisma.$transaction(async (tx) => {
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

    let inserted = 0;
    let updated = 0;

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

    return { inserted, updated };
  });
};

const upsertGameLogs = async (
  rows: PlayerStatisticsRow[],
): Promise<UpsertGameLogsResult> => {
  let inserted = 0;
  let updated = 0;

  for (const batch of chunk(rows, BATCH_SIZE)) {
    const counts = await upsertGameLogBatch(batch);
    inserted += counts.inserted;
    updated += counts.updated;
  }

  return { inserted, updated };
};

const writePlayersJson = (players: DemoPlayer[]): void => {
  writeFileSync(PLAYERS_JSON_PATH, toPlayersJson(buildPlayerNameMap(players)));
};

const writeFixturePlayerId = (playerId: number): void => {
  if (!existsSync(FIXTURE_HTML_PATH)) {
    throw new Error(`Fixture page not found: ${FIXTURE_HTML_PATH}`);
  }

  const html = readFileSync(FIXTURE_HTML_PATH, "utf8");
  const updated = html.replace(
    /data-prophover-player-id="[^"]*"/,
    `data-prophover-player-id="${playerId}"`,
  );

  const alreadySet = html.includes(`data-prophover-player-id="${playerId}"`);
  if (updated === html && !alreadySet) {
    throw new Error(
      `Could not update data-prophover-player-id in ${FIXTURE_HTML_PATH}`,
    );
  }

  writeFileSync(FIXTURE_HTML_PATH, updated);
};

const loadCsvRows = (): PlayerStatisticsRow[] => {
  if (!existsSync(DEMO_CSV_PATH)) {
    throw new Error(`CSV file not found: ${DEMO_CSV_PATH}`);
  }

  return parsePlayerStatisticsCsv(readFileSync(DEMO_CSV_PATH, "utf8"));
};

const fixturePlayerId = (players: DemoPlayer[]): number => {
  const fixture = players.find(
    (player) =>
      normalizePlayerName(player.name) ===
      normalizePlayerName(FIXTURE_PLAYER_NAME),
  );

  if (fixture === undefined) {
    throw new Error(
      `Fixture player ${FIXTURE_PLAYER_NAME} was not in the seed set`,
    );
  }

  return fixture.id;
};

const printSummary = (props: {
  playerNames: string[];
  players: DemoPlayer[];
  inserted: number;
  updated: number;
  jokicId: number;
}): void => {
  const { playerNames, players, inserted, updated, jokicId } = props;
  console.log(`CSV: ${DEMO_CSV_PATH}`);
  console.log(`Players: ${playerNames.join(", ")}`);
  for (const player of players) {
    console.log(`  ${player.name} id=${player.id} team=${player.team}`);
  }
  console.log(`Game logs inserted: ${inserted}`);
  console.log(`Game logs updated: ${updated}`);
  console.log(`Wrote ${PLAYERS_JSON_PATH}`);
  console.log(
    `Fixture ${FIXTURE_PLAYER_NAME} data-prophover-player-id=${jokicId}`,
  );
};

const main = async (): Promise<void> => {
  const options = parseArgs(process.argv.slice(2));
  const rows = loadCsvRows();
  const catalog = latestPlayersFromRows(rows);
  const resolved = resolveRequestedPlayers({
    requestedNames: options.playerNames,
    catalog,
  });

  if (resolved.missing.length > 0) {
    throw missingPlayersError(resolved.missing);
  }

  const playerIds = resolved.players.map((player) => player.id);
  const selectedRows = rowsForPlayerIds({ rows, playerIds });

  await upsertPlayers(resolved.players);
  const { inserted, updated } = await upsertGameLogs(selectedRows);
  writePlayersJson(resolved.players);
  const jokicId = fixturePlayerId(resolved.players);
  writeFixturePlayerId(jokicId);

  printSummary({
    playerNames: options.playerNames,
    players: resolved.players,
    inserted,
    updated,
    jokicId,
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
