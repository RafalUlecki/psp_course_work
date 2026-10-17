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

type CsvRecord = Record<string, string | undefined>;

interface ParsedGameLog {
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

function loadDotEnv() {
  const envPath = path.resolve(APP_ROOT, ".env");
  if (existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
}

loadDotEnv();

const prisma = new PrismaClient();

function parseArgs(argv: string[]) {
  const flags = new Set<string>();
  const positional: string[] = [];

  for (const arg of argv) {
    if (arg.startsWith("--")) {
      flags.add(arg);
    } else {
      positional.push(arg);
    }
  }

  const unknownFlags = [...flags].filter((flag) => flag !== "--reset");
  if (unknownFlags.length > 0) {
    throw new Error(
      `Unknown flag(s): ${unknownFlags.join(", ")}. Supported: --reset`,
    );
  }

  return {
    reset: flags.has("--reset"),
    csvPath: path.resolve(
      positional[0] ?? process.env.SEED_CSV_PATH ?? DEFAULT_CSV_PATH,
    ),
  };
}

function requireString(
  record: CsvRecord,
  column: (typeof REQUIRED_COLUMNS)[number],
  rowNumber: number,
): string {
  const value = record[column];
  if (value === undefined || value.trim() === "") {
    throw new Error(`Row ${rowNumber}: missing required field "${column}"`);
  }
  return value.trim();
}

function parseNonNegativeInt(
  raw: string,
  column: string,
  rowNumber: number,
): number {
  if (!/^\d+$/.test(raw)) {
    throw new Error(
      `Row ${rowNumber}: "${column}" must be a non-negative integer, got ${JSON.stringify(raw)}`,
    );
  }
  return Number(raw);
}

function parseIsoDate(raw: string, rowNumber: number): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) {
    throw new Error(
      `Row ${rowNumber}: "game_date" must be an ISO date (YYYY-MM-DD), got ${JSON.stringify(raw)}`,
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
    throw new Error(
      `Row ${rowNumber}: "game_date" is not a valid calendar date, got ${JSON.stringify(raw)}`,
    );
  }

  return date;
}

function parseVenue(raw: string, rowNumber: number): Venue {
  if (raw === Venue.home || raw === Venue.away) {
    return raw;
  }
  throw new Error(
    `Row ${rowNumber}: "venue" must be "home" or "away", got ${JSON.stringify(raw)}`,
  );
}

function validateHeader(record: CsvRecord) {
  const missing = REQUIRED_COLUMNS.filter((column) => !(column in record));
  if (missing.length > 0) {
    throw new Error(
      `CSV header is missing required column(s): ${missing.join(", ")}. Expected: ${REQUIRED_COLUMNS.join(",")}`,
    );
  }
}

function parseCsvRows(csvPath: string): ParsedGameLog[] {
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse CSV ${csvPath}: ${message}`);
  }

  if (records.length === 0) {
    throw new Error(`CSV has a header but no data rows: ${csvPath}`);
  }

  validateHeader(records[0]);

  return records.map((record, index) => {
    const rowNumber = index + 2;
    const team = requireString(record, "team", rowNumber);
    return {
      playerName: requireString(record, "player_name", rowNumber),
      team,
      gameDate: parseIsoDate(
        requireString(record, "game_date", rowNumber),
        rowNumber,
      ),
      opponent: requireString(record, "opponent", rowNumber),
      venue: parseVenue(requireString(record, "venue", rowNumber), rowNumber),
      pts: parseNonNegativeInt(
        requireString(record, "pts", rowNumber),
        "pts",
        rowNumber,
      ),
      reb: parseNonNegativeInt(
        requireString(record, "reb", rowNumber),
        "reb",
        rowNumber,
      ),
      ast: parseNonNegativeInt(
        requireString(record, "ast", rowNumber),
        "ast",
        rowNumber,
      ),
      source: requireString(record, "source", rowNumber),
      sourceGameId: requireString(record, "source_game_id", rowNumber),
    };
  });
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

function latestTeamByPlayer(rows: ParsedGameLog[]): Map<string, string | null> {
  const teams = new Map<string, string | null>();
  for (const row of rows) {
    teams.set(row.playerName, row.team);
  }
  return teams;
}

async function upsertPlayers(
  teamsByName: Map<string, string | null>,
): Promise<Map<string, number>> {
  const names = [...teamsByName.keys()];
  const idsByName = new Map<string, number>();

  for (const batch of chunk(names, BATCH_SIZE)) {
    const players = await prisma.$transaction(
      batch.map((name) =>
        prisma.player.upsert({
          where: { name },
          create: { name, team: teamsByName.get(name) },
          update: { team: teamsByName.get(name) },
        }),
      ),
    );

    for (const player of players) {
      idsByName.set(player.name, player.id);
    }
  }

  return idsByName;
}

async function upsertGameLogs(
  rows: ParsedGameLog[],
  playerIdsByName: Map<string, number>,
): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;

  for (const batch of chunk(rows, BATCH_SIZE)) {
    const counts = await prisma.$transaction(async (tx) => {
      let batchInserted = 0;
      let batchUpdated = 0;

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
        existing.map(
          (row) => `${row.playerId}\0${row.source}\0${row.sourceGameId}`,
        ),
      );

      for (const row of batch) {
        const playerId = playerIdsByName.get(row.playerName);
        if (playerId === undefined) {
          throw new Error(`Missing player id for ${row.playerName}`);
        }

        const key = `${playerId}\0${row.source}\0${row.sourceGameId}`;
        if (existingKeys.has(key)) {
          batchUpdated += 1;
        } else {
          batchInserted += 1;
        }

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
            gameDate: row.gameDate,
            opponent: row.opponent,
            venue: row.venue,
            pts: row.pts,
            reb: row.reb,
            ast: row.ast,
            source: row.source,
            sourceGameId: row.sourceGameId,
          },
          update: {
            gameDate: row.gameDate,
            opponent: row.opponent,
            venue: row.venue,
            pts: row.pts,
            reb: row.reb,
            ast: row.ast,
          },
        });
      }

      return { batchInserted, batchUpdated };
    });

    inserted += counts.batchInserted;
    updated += counts.batchUpdated;
  }

  return { inserted, updated };
}

async function main() {
  const { reset, csvPath } = parseArgs(process.argv.slice(2));
  const rows = parseCsvRows(csvPath);

  if (reset) {
    await prisma.$transaction([
      prisma.gameLog.deleteMany(),
      prisma.player.deleteMany(),
    ]);
    console.log("Reset: deleted game_logs then players");
  }

  const teamsByName = latestTeamByPlayer(rows);
  const playerIdsByName = await upsertPlayers(teamsByName);
  const { inserted, updated } = await upsertGameLogs(rows, playerIdsByName);

  console.log(`CSV: ${csvPath}`);
  console.log(`Players upserted: ${playerIdsByName.size}`);
  console.log(`Game logs inserted: ${inserted}`);
  console.log(`Game logs updated: ${updated}`);
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Seed failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
