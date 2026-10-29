import { normalizePlayerName } from "../players/normalizePlayerName";
import {
  PREFERRED_CLIENT_A_PLAYER_NAME,
  PREFERRED_CLIENT_B_PLAYER_NAME,
} from "./constants";

export interface WatchlistSeedPlayer {
  id: number;
  name: string;
}

export interface WatchlistPlayerIds {
  clientAPlayerId: number;
  clientBPlayerId: number;
}

export const NEED_TWO_PLAYERS_ERROR =
  "Need at least two players so Client A and Client B can each get a watchlist row.";

export const pickWatchlistPlayers = (props: {
  players: readonly WatchlistSeedPlayer[];
}): WatchlistPlayerIds => {
  const { players } = props;

  if (players.length < 2) {
    throw new Error(NEED_TWO_PLAYERS_ERROR);
  }

  const idsByName = new Map<string, number>();
  for (const player of players) {
    idsByName.set(normalizePlayerName(player.name), player.id);
  }

  const preferredA = idsByName.get(
    normalizePlayerName(PREFERRED_CLIENT_A_PLAYER_NAME),
  );
  const preferredB = idsByName.get(
    normalizePlayerName(PREFERRED_CLIENT_B_PLAYER_NAME),
  );

  if (
    preferredA !== undefined &&
    preferredB !== undefined &&
    preferredA !== preferredB
  ) {
    return { clientAPlayerId: preferredA, clientBPlayerId: preferredB };
  }

  return {
    clientAPlayerId: players[0].id,
    clientBPlayerId: players[1].id,
  };
};
