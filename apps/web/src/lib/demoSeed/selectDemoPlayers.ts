import { normalizePlayerName } from "../players/normalizePlayerName";
import {
  buildPlayerNameMap,
  collectMissingPlayerNames,
  resolvePlayerId,
} from "../players/playerNameMap";
import type { DemoPlayer } from "./types/demoPlayer";
import type { PlayerStatisticsRow } from "./types/playerStatisticsRow";

export const parsePlayerNameList = (raw: string): string[] => {
  const names: string[] = [];
  const seen = new Set<string>();

  for (const part of raw.split(",")) {
    const name = part.trim();
    if (name === "") {
      continue;
    }

    const key = normalizePlayerName(name);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    names.push(name);
  }

  return names;
};

export const latestPlayersFromRows = (
  rows: readonly PlayerStatisticsRow[],
): DemoPlayer[] => {
  const byId = new Map<number, DemoPlayer>();
  const latestDate = new Map<number, number>();

  for (const row of rows) {
    const time = row.gameDate.getTime();
    const previous = latestDate.get(row.personId);
    if (previous !== undefined && time < previous) {
      continue;
    }

    latestDate.set(row.personId, time);
    byId.set(row.personId, {
      id: row.personId,
      name: row.playerName,
      team: row.team,
    });
  }

  return [...byId.values()];
};

export const resolveRequestedPlayers = (props: {
  requestedNames: readonly string[];
  catalog: readonly DemoPlayer[];
}): { players: DemoPlayer[]; missing: string[] } => {
  const { requestedNames, catalog } = props;
  const playersByNormalizedName = buildPlayerNameMap(catalog);
  const missing = collectMissingPlayerNames({
    requestedNames,
    playersByNormalizedName,
  });

  if (missing.length > 0) {
    return { players: [], missing };
  }

  const players = requestedNames.map((name) => {
    const id = resolvePlayerId({ name, playersByNormalizedName });
    const player = catalog.find((entry) => entry.id === id);
    if (id === undefined || player === undefined) {
      throw new Error(`Missing catalog entry for ${name}`);
    }
    return player;
  });

  return { players, missing };
};

export const rowsForPlayerIds = (props: {
  rows: readonly PlayerStatisticsRow[];
  playerIds: readonly number[];
}): PlayerStatisticsRow[] => {
  const { rows, playerIds } = props;
  const idSet = new Set(playerIds);

  return rows.filter((row) => idSet.has(row.personId));
};
