import type { GameLog, Venue } from "@prisma/client";
import { computeHitRate } from "./computeHitRate";
import { filterGames } from "./filterGames";
import { sampleHitRateGames } from "./fixtures/sampleGames";
import type { StatKey } from "./types/computeHitRate";
import type {
  HitRateFilters,
  HitRateGame,
  HitRateHttpResult,
  HitRateRequest,
} from "./types/api";
import { validateStat } from "./validateStat";

export const MISSING_PLAYER_ID_ERROR = "Missing playerId.";
export const MISSING_LINE_ERROR = "Missing line.";
export const INVALID_LINE_ERROR = "Invalid line. Must be a finite number.";
export const INVALID_LAST_N_ERROR = "Invalid lastN. Must be a positive integer.";
export const INVALID_VENUE_ERROR = "Invalid venue. Allowed values: home, away.";

interface GetHitRateProps {
  searchParams: URLSearchParams;
}

interface ParseHitRateRequestProps {
  searchParams: URLSearchParams;
}

type ParseHitRateRequestResult =
  | { ok: true; request: HitRateRequest }
  | { ok: false; error: string };

interface ParseLineProps {
  rawLine: string | null;
}

type ParseLineResult =
  | { ok: true; line: number }
  | { ok: false; error: string };

interface ParseLastNProps {
  rawLastN: string | null;
}

type ParseLastNResult =
  | { ok: true; lastN: number | undefined }
  | { ok: false; error: string };

interface ParseVenueProps {
  rawVenue: string | null;
}

type ParseVenueResult =
  | { ok: true; venue: Venue | undefined }
  | { ok: false; error: string };

interface ParseOpponentProps {
  rawOpponent: string | null;
}

interface ToHitRateGamesProps {
  games: GameLog[];
  stat: StatKey;
}

const parseLine = (props: ParseLineProps): ParseLineResult => {
  const { rawLine } = props;

  if (rawLine === null || rawLine.trim() === "") {
    return { ok: false, error: MISSING_LINE_ERROR };
  }

  const line = Number(rawLine);

  if (!Number.isFinite(line)) {
    return { ok: false, error: INVALID_LINE_ERROR };
  }

  return { ok: true, line };
};

const parseLastN = (props: ParseLastNProps): ParseLastNResult => {
  const { rawLastN } = props;

  if (rawLastN === null) {
    return { ok: true, lastN: undefined };
  }

  const lastN = Number(rawLastN);

  if (!Number.isInteger(lastN) || lastN <= 0) {
    return { ok: false, error: INVALID_LAST_N_ERROR };
  }

  return { ok: true, lastN };
};

const parseVenue = (props: ParseVenueProps): ParseVenueResult => {
  const { rawVenue } = props;

  if (rawVenue === null) {
    return { ok: true, venue: undefined };
  }

  if (rawVenue !== "home" && rawVenue !== "away") {
    return { ok: false, error: INVALID_VENUE_ERROR };
  }

  return { ok: true, venue: rawVenue };
};

const parseOptionalOpponent = (props: ParseOpponentProps): string | undefined => {
  const { rawOpponent } = props;

  if (rawOpponent === null) {
    return undefined;
  }

  const opponent = rawOpponent.trim();

  if (opponent === "") {
    return undefined;
  }

  return opponent;
};

const parseHitRateRequest = (
  props: ParseHitRateRequestProps,
): ParseHitRateRequestResult => {
  const { searchParams } = props;
  const rawPlayerId = searchParams.get("playerId");

  if (rawPlayerId === null || rawPlayerId.trim() === "") {
    return { ok: false, error: MISSING_PLAYER_ID_ERROR };
  }

  const statResult = validateStat(searchParams.get("stat"));

  if (!statResult.ok) {
    return { ok: false, error: statResult.error };
  }

  const lineResult = parseLine({ rawLine: searchParams.get("line") });

  if (!lineResult.ok) {
    return { ok: false, error: lineResult.error };
  }

  const lastNResult = parseLastN({ rawLastN: searchParams.get("lastN") });

  if (!lastNResult.ok) {
    return { ok: false, error: lastNResult.error };
  }

  const venueResult = parseVenue({ rawVenue: searchParams.get("venue") });

  if (!venueResult.ok) {
    return { ok: false, error: venueResult.error };
  }

  const opponent = parseOptionalOpponent({
    rawOpponent: searchParams.get("opponent"),
  });
  const request: HitRateRequest = {
    playerId: rawPlayerId.trim(),
    stat: statResult.stat,
    line: lineResult.line,
    ...(lastNResult.lastN === undefined ? {} : { lastN: lastNResult.lastN }),
    ...(opponent === undefined ? {} : { opponent }),
    ...(venueResult.venue === undefined ? {} : { venue: venueResult.venue }),
  };

  return { ok: true, request };
};

const buildFilters = (request: HitRateRequest): HitRateFilters => {
  const filters: HitRateFilters = {};

  if (request.lastN !== undefined) {
    filters.lastN = request.lastN;
  }
  if (request.opponent !== undefined) {
    filters.opponent = request.opponent;
  }
  if (request.venue !== undefined) {
    filters.venue = request.venue;
  }

  return filters;
};

const toHitRateGames = (props: ToHitRateGamesProps): HitRateGame[] => {
  const { games, stat } = props;

  return games.map((game): HitRateGame => ({
    gameDate: game.gameDate.toISOString(),
    opponent: game.opponent,
    venue: game.venue,
    value: game[stat],
  }));
};

export const getHitRate = (props: GetHitRateProps): HitRateHttpResult => {
  const { searchParams } = props;
  const parsed = parseHitRateRequest({ searchParams });

  if (!parsed.ok) {
    return { status: 400, body: { error: parsed.error } };
  }

  const { request } = parsed;
  const games = filterGames(sampleHitRateGames, {
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
      filters: buildFilters(request),
      hitRate: computed === null ? null : computed.hitRate,
      hits: computed === null ? 0 : computed.hits,
      n: computed === null ? 0 : computed.n,
      games: toHitRateGames({ games, stat: request.stat }),
    },
  };
};
