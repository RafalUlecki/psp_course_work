import { parse } from "csv-parse/sync";

import type { GameVenue } from "../gameLogs/types/playerGame";
import type { PlayerStatisticsRow } from "./types/playerStatisticsRow";

const REQUIRED_COLUMNS = [
  "personId",
  "playerName",
  "team",
  "opponent",
  "home",
  "gameDate",
  "gameId",
  "points",
  "reboundsTotal",
  "assists",
] as const;

type CsvColumn = (typeof REQUIRED_COLUMNS)[number];
type CsvRecord = Record<string, string | undefined>;

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

const rowError = (rowNumber: number, detail: string): Error =>
  new Error(`Row ${rowNumber}: ${detail}`);

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

const parseIsoDate = (raw: string, rowNumber: number): Date => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) {
    throw rowError(
      rowNumber,
      `"gameDate" must be an ISO date (YYYY-MM-DD), got ${JSON.stringify(raw)}`,
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
      `"gameDate" is not a valid calendar date, got ${JSON.stringify(raw)}`,
    );
  }

  return date;
};

const parseHomeVenue = (raw: string, rowNumber: number): GameVenue => {
  if (raw === "1") {
    return "home";
  }
  if (raw === "0") {
    return "away";
  }
  throw rowError(
    rowNumber,
    `"home" must be 1 or 0, got ${JSON.stringify(raw)}`,
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

const parseRow = (
  record: CsvRecord,
  rowNumber: number,
): PlayerStatisticsRow => ({
  personId: parsePositiveInt(
    requireString(record, "personId", rowNumber),
    "personId",
    rowNumber,
  ),
  playerName: requireString(record, "playerName", rowNumber),
  team: requireString(record, "team", rowNumber),
  opponent: requireString(record, "opponent", rowNumber),
  venue: parseHomeVenue(requireString(record, "home", rowNumber), rowNumber),
  gameDate: parseIsoDate(
    requireString(record, "gameDate", rowNumber),
    rowNumber,
  ),
  gameId: requireString(record, "gameId", rowNumber),
  points: parseNonNegativeInt(
    requireString(record, "points", rowNumber),
    "points",
    rowNumber,
  ),
  reboundsTotal: parseNonNegativeInt(
    requireString(record, "reboundsTotal", rowNumber),
    "reboundsTotal",
    rowNumber,
  ),
  assists: parseNonNegativeInt(
    requireString(record, "assists", rowNumber),
    "assists",
    rowNumber,
  ),
});

export const parsePlayerStatisticsCsv = (
  csvText: string,
): PlayerStatisticsRow[] => {
  let records: CsvRecord[];
  try {
    records = parse(csvText, {
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
        `Failed to parse PlayerStatistics.csv: ${messageFromCaught(thrown)}`,
      );
    }
    throw new Error(`Failed to parse PlayerStatistics.csv: ${String(thrown)}`);
  }

  if (records.length === 0) {
    throw new Error("PlayerStatistics.csv has a header but no data rows");
  }

  validateHeader(records[0]);

  return records.map((record, index) => parseRow(record, index + 2));
};
