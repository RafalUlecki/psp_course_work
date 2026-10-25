import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient, Venue } from "@prisma/client";
import { parse } from "csv-parse/sync";

const SEED_DIR = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(SEED_DIR, "..");
const DEFAULT_CSV_PATH = path.resolve(
  APP_ROOT,
  "data/fixtures/game_logs_sample.csv",
);
const BATCH_SIZE = 100;
const REQUIRED_COLUMNS = [
  "player_id",
  "player_name",
  "team",
  "game_date",
  "opponent",
  "venue",
  "pts",
  "reb",
  "ast",
  "source",
  "source_game_id",
] as const;

type CsvColumn = (typeof REQUIRED_COLUMNS)[number];
type CsvRecord = Record<string, string | undefined>;

interface ParsedGameLog {
  playerId: number;
  playerName: string;
  team: string | null;
  gameDate: Date;
  opponent: string;
  venue: Venue;
  pts: number;
  reb: number;
  ast: number;
  source: string;
  sourceGameId: string;
}

interface SeedCliOptions {
  reset: boolean;
  csvPath: string;
}

interface UpsertGameLogsResult {
  inserted: number;
  updated: number;
}

interface BatchUpsertCounts {
  batchInserted: number;
  batchUpdated: number;
}

type GameLogMutableFields = Pick<
  ParsedGameLog,
  "gameDate" | "opponent" | "venue" | "pts" | "reb" | "ast"
>;

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

const rowError = (rowNumber: number, detail: string): Error =>
  new Error(`Row ${rowNumber}: ${detail}`);

const parseArgs = (argv: string[]): SeedCliOptions => {
  const flags = new Set<string>();
  const positional: string[] = [];

  for (const arg of argv) {
    if (arg.startsWith("--")) {
      flags.add(arg);
    } else {
      positional.push(arg);
    }
  }

  const unsupportedFlags = [...flags].filter((flag) => flag !== "--reset");
  if (unsupportedFlags.length > 0) {
    throw new Error(
      `Unsupported flag(s): ${unsupportedFlags.join(", ")}. Supported: --reset`,
    );
  }

  return {
    reset: flags.has("--reset"),
    csvPath: path.resolve(
      positional[0] ?? process.env.SEED_CSV_PATH ?? DEFAULT_CSV_PATH,
    ),
  };
};

const requireString = (
  record: CsvRecord,
  column: CsvColumn,
  rowNumber: number,
): string => {
  const value = record[column];
  if (value === undefined || value.trim() === "") {
    throw rowError(rowNumber, `missing required field "${column}"`);
  }
  return value.trim();
};

const parseNonNegativeInt = (
  raw: string,
  column: string,
  rowNumber: number,
): number => {
  if (!/^\d+$/.test(raw)) {
    throw rowError(
      rowNumber,
      `"${column}" must be a non-negative integer, got ${JSON.stringify(raw)}`,
    );
  }
  return Number(raw);
};

const parsePositiveInt = (
  raw: string,
  column: string,
  rowNumber: number,
): number => {
  if (!/^\d+$/.test(raw) || Number(raw) <= 0) {
    throw rowError(
      rowNumber,
      `"${column}" must be a positive integer, got ${JSON.stringify(raw)}`,
    );
  }
  return Number(raw);
};

const parseRequiredIntColumn = (
  record: CsvRecord,
  column: Extract<CsvColumn, "pts" | "reb" | "ast">,
  rowNumber: number,
): number =>
  parseNonNegativeInt(
    requireString(record, column, rowNumber),
    column,
    rowNumber,
  );

const parseIsoDate = (raw: string, rowNumber: number): Date => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) {
    throw rowError(
      rowNumber,
      `"game_date" must be an ISO date (YYYY-MM-DD), got ${JSON.stringify(raw)}`,
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw rowError(
      rowNumber,
      `"game_date" is not a valid calendar date, got ${JSON.stringify(raw)}`,
    );
  }

  return date;
};

const parseVenue = (raw: string, rowNumber: number): Venue => {
  if (raw === Venue.home || raw === Venue.away) {
    return raw;
  }
  throw rowError(
    rowNumber,
    `"venue" must be "home" or "away", got ${JSON.stringify(raw)}`,
  );
};

const validateHeader = (record: CsvRecord): void => {
  const missing = REQUIRED_COLUMNS.filter((column) => !(column in record));
  if (missing.length > 0) {
    throw new Error(
      `CSV header is missing required column(s): ${missing.join(", ")}. Expected: ${REQUIRED_COLUMNS.join(",")}`,
    );
  }
};

const parseGameLogRow = (
  record: CsvRecord,
  rowNumber: number,
): ParsedGameLog => ({
  playerId: parsePositiveInt(
    requireString(record, "player_id", rowNumber),
    "player_id",
    rowNumber,
  ),
  playerName: requireString(record, "player_name", rowNumber),
  team: requireString(record, "team", rowNumber),
  gameDate: parseIsoDate(
    requireString(record, "game_date", rowNumber),
    rowNumber,
  ),
  opponent: requireString(record, "opponent", rowNumber),
  venue: parseVenue(requireString(record, "venue", rowNumber), rowNumber),
  pts: parseRequiredIntColumn(record, "pts", rowNumber),
  reb: parseRequiredIntColumn(record, "reb", rowNumber),
  ast: parseRequiredIntColumn(record, "ast", rowNumber),
  source: requireString(record, "source", rowNumber),
  sourceGameId: requireString(record, "source_game_id", rowNumber),
});

const parseCsvRows = (csvPath: string): ParsedGameLog[] => {
  if (!existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }

  let records: CsvRecord[];
  try {
    records = parse(readFileSync(csvPath, "utf8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: false,
    }) as CsvRecord[];
  } catch (thrown) {
    if (
      thrown instanceof Error ||
      typeof thrown === "string" ||
      (thrown !== null && typeof thrown === "object")
    ) {
      throw new Error(
        `Failed to parse CSV ${csvPath}: ${messageFromCaught(thrown)}`,
      );
    }
    throw new Error(`Failed to parse CSV ${csvPath}: ${String(thrown)}`);
  }

  if (records.length === 0) {
    throw new Error(`CSV has a header but no data rows: ${csvPath}`);
  }

  validateHeader(records[0]);

  return records.map((record, index) => parseGameLogRow(record, index + 2));
};

const chunk = <TItem>(items: TItem[], size: number): TItem[][] => {
  const batches: TItem[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
};

interface SeedPlayer {
  id: number;
  name: string;
  team: string | null;
}

const latestPlayers = (rows: ParsedGameLog[]): SeedPlayer[] => {
  const byId = new Map<number, SeedPlayer>();
  for (const row of rows) {
    byId.set(row.playerId, {
      id: row.playerId,
      name: row.playerName,
      team: row.team,
    });
  }
  return [...byId.values()];
};

const gameLogCompositeKey = (
  playerId: number,
  source: string,
  sourceGameId: string,
): string => `${playerId}\0${source}\0${sourceGameId}`;

const gameLogMutableFields = (row: ParsedGameLog): GameLogMutableFields => ({
  gameDate: row.gameDate,
  opponent: row.opponent,
  venue: row.venue,
  pts: row.pts,
  reb: row.reb,
  ast: row.ast,
});

const upsertPlayer = async (player: SeedPlayer): Promise<void> => {
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

const upsertPlayers = async (
  players: SeedPlayer[],
): Promise<Map<string, number>> => {
  const idsByName = new Map<string, number>();

  for (const player of players) {
    await upsertPlayer(player);
    idsByName.set(player.name, player.id);
  }

  return idsByName;
};

const countBatchUpserts = (
  batch: ParsedGameLog[],
  playerIdsByName: Map<string, number>,
  existingKeys: Set<string>,
): BatchUpsertCounts => {
  let batchInserted = 0;
  let batchUpdated = 0;

  for (const row of batch) {
    const playerId = playerIdsByName.get(row.playerName);
    if (playerId === undefined) {
      throw new Error(`Missing player id for ${row.playerName}`);
    }

    const key = gameLogCompositeKey(playerId, row.source, row.sourceGameId);
    if (existingKeys.has(key)) {
      batchUpdated += 1;
    } else {
      batchInserted += 1;
    }
  }

  return { batchInserted, batchUpdated };
};

const upsertGameLogBatch = async (
  batch: ParsedGameLog[],
  playerIdsByName: Map<string, number>,
): Promise<BatchUpsertCounts> => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.gameLog.findMany({
      where: {
        OR: batch.map((row) => ({
          playerId: playerIdsByName.get(row.playerName)!,
          source: row.source,
          sourceGameId: row.sourceGameId,
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

    const counts = countBatchUpserts(batch, playerIdsByName, existingKeys);

    for (const row of batch) {
      const playerId = playerIdsByName.get(row.playerName);
      if (playerId === undefined) {
        throw new Error(`Missing player id for ${row.playerName}`);
      }

      const fields = gameLogMutableFields(row);

      await tx.gameLog.upsert({
        where: {
          playerId_source_sourceGameId: {
            playerId,
            source: row.source,
            sourceGameId: row.sourceGameId,
          },
        },
        create: {
          playerId,
          source: row.source,
          sourceGameId: row.sourceGameId,
          ...fields,
        },
        update: fields,
      });
    }

    return counts;
  });
};

const upsertGameLogs = async (
  rows: ParsedGameLog[],
  playerIdsByName: Map<string, number>,
): Promise<UpsertGameLogsResult> => {
  let inserted = 0;
  let updated = 0;

  for (const batch of chunk(rows, BATCH_SIZE)) {
    const counts = await upsertGameLogBatch(batch, playerIdsByName);
    inserted += counts.batchInserted;
    updated += counts.batchUpdated;
  }

  return { inserted, updated };
};

const resetDatabase = async (): Promise<void> => {
  await prisma.$transaction([
    prisma.gameLog.deleteMany(),
    prisma.player.deleteMany(),
  ]);
  console.log("Reset: deleted game_logs then players");
};

const printSeedSummary = (props: {
  csvPath: string;
  playerCount: number;
  inserted: number;
  updated: number;
}): void => {
  const { csvPath, playerCount, inserted, updated } = props;
  console.log(`CSV: ${csvPath}`);
  console.log(`Players upserted: ${playerCount}`);
  console.log(`Game logs inserted: ${inserted}`);
  console.log(`Game logs updated: ${updated}`);
};

const main = async (): Promise<void> => {
  const options = parseArgs(process.argv.slice(2));
  const rows = parseCsvRows(options.csvPath);

  if (options.reset) {
    await resetDatabase();
  }

  const playerIdsByName = await upsertPlayers(latestPlayers(rows));
  const { inserted, updated } = await upsertGameLogs(rows, playerIdsByName);

  printSeedSummary({
    csvPath: options.csvPath,
    playerCount: playerIdsByName.size,
    inserted,
    updated,
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
