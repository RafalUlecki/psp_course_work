import type { GameLog } from "@prisma/client";

import { computeHitRate } from "./computeHitRate";
import { filterGames } from "./filterGames";
import {
  SAMPLE_HIT_RATE_PLAYER_ID,
  sampleHitRateGames,
} from "./fixtures/sampleGames";
import { parseHitRateQuery } from "./query/parseHitRateQuery";
import type { StatKey } from "./types/computeHitRate";
import type {
  HitRateFilters,
  HitRateGame,
  HitRateHttpResult,
  HitRateRequest,
} from "./types/api";

interface GetHitRateProps {
  searchParams: URLSearchParams;
}

interface ToHitRateGamesProps {
  games: GameLog[];
  stat: StatKey;
}

const gamesForPlayer = (playerId: string): GameLog[] =>
  playerId === SAMPLE_HIT_RATE_PLAYER_ID ? sampleHitRateGames : [];

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

export const getHitRate = (props: GetHitRateProps): HitRateHttpResult => {
  const { searchParams } = props;
  const parsed = parseHitRateQuery({ searchParams });

  if (!parsed.ok) {
    return { status: 400, body: { error: parsed.error } };
  }

  const { request } = parsed;
  const games = filterGames(gamesForPlayer(request.playerId), {
    lastN: request.lastN,
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
