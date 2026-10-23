import type { GameLog } from "@prisma/client";

import { getGameLogsByPlayerId } from "../gameLogs/getGameLogsByPlayerId";
import { computeHitRate } from "./computeHitRate";
import { filterGames } from "./filterGames";
import { parseHitRateQuery } from "./query/parseHitRateQuery";
import type { StatKey } from "./types/computeHitRate";
import type {
  HitRateFilters,
  HitRateGame,
  HitRateHttpResult,
  HitRateRequest,
} from "./types/api";
import type { GameLogLoader, GetHitRateProps } from "./types/getHitRate";

interface ToHitRateGamesProps {
  games: GameLog[];
  stat: StatKey;
}

const toHitRateGames = (props: ToHitRateGamesProps): HitRateGame[] => {
  const { games, stat } = props;

  return games.map(
    (game): HitRateGame => ({
      gameDate: game.gameDate.toISOString(),
      opponent: game.opponent,
      venue: game.venue,
      value: game[stat],
    }),
  );
};

const echoFilters = (request: HitRateRequest): HitRateFilters => ({
  ...(request.lastN !== undefined ? { lastN: request.lastN } : {}),
  ...(request.opponent !== undefined ? { opponent: request.opponent } : {}),
  ...(request.venue !== undefined ? { venue: request.venue } : {}),
});

export const getHitRate = async (
  props: GetHitRateProps,
  loadGameLogs: GameLogLoader = getGameLogsByPlayerId,
): Promise<HitRateHttpResult> => {
  const { searchParams } = props;
  const parsed = parseHitRateQuery({ searchParams });

  if (!parsed.ok) {
    return { status: 400, body: { error: parsed.error } };
  }

  const { request } = parsed;
  const games = filterGames(await loadGameLogs(Number(request.playerId)), {
    lastN: request.lastN ?? 10,
    opponent: request.opponent,
    venue: request.venue,
  });
  const computed = computeHitRate(games, request.line, request.stat);

  return {
    status: 200,
    body: {
      playerId: request.playerId,
      stat: request.stat,
      line: request.line,
      filters: echoFilters(request),
      hitRate: computed === null ? null : computed.hitRate,
      hits: computed === null ? 0 : computed.hits,
      n: computed === null ? 0 : computed.n,
      games: toHitRateGames({ games, stat: request.stat }),
    },
  };
};
