import { normalizePlayerName } from "./normalizePlayerName";
import type { NamedPlayer } from "./types/playerNameMap";

export const buildPlayerNameMap = (
  players: readonly NamedPlayer[],
): Map<string, number> => {
  const playersByNormalizedName = new Map<string, number>();

  for (const player of players) {
    playersByNormalizedName.set(normalizePlayerName(player.name), player.id);
  }

  return playersByNormalizedName;
};

export const resolvePlayerId = (props: {
  name: string;
  playersByNormalizedName: Map<string, number>;
}): number | undefined => {
  const { name, playersByNormalizedName } = props;

  return playersByNormalizedName.get(normalizePlayerName(name));
};

export const collectMissingPlayerNames = (props: {
  requestedNames: readonly string[];
  playersByNormalizedName: Map<string, number>;
}): string[] => {
  const { requestedNames, playersByNormalizedName } = props;

  return requestedNames.filter(
    (name) =>
      resolvePlayerId({ name, playersByNormalizedName }) === undefined,
  );
};

export const toPlayersJson = (
  playersByNormalizedName: Map<string, number>,
): string => {
  const sorted = [...playersByNormalizedName.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  );

  return `${JSON.stringify(Object.fromEntries(sorted), null, 2)}\n`;
};
