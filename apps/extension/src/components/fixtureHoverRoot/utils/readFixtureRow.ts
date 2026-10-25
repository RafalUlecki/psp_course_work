import type { FixtureRowProps } from "../types/fixtureRow";

const parseOpponentCodes = (raw: string | null): string[] =>
  (raw ?? "")
    .split(",")
    .map((code) => code.trim())
    .filter((code) => code.length > 0);

export const readFixtureRow = (row: HTMLElement): FixtureRowProps | null => {
  const player = row.getAttribute("data-prophover-player");
  const playerId = row.getAttribute("data-prophover-player-id");
  const stat = row.getAttribute("data-prophover-stat");
  const lineRaw = row.getAttribute("data-prophover-line");

  if (
    player === null ||
    playerId === null ||
    stat === null ||
    lineRaw === null
  ) {
    return null;
  }

  const fixtureLine = Number(lineRaw);

  if (!Number.isFinite(fixtureLine)) {
    return null;
  }

  return {
    player,
    playerId,
    stat,
    fixtureLine,
    opponentCodes: parseOpponentCodes(
      row.getAttribute("data-prophover-opponents"),
    ),
  };
};
