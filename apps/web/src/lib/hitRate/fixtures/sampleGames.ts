import type { GameVenue, PlayerGame } from "../../gameLogs/types/playerGame";

export const SAMPLE_HIT_RATE_PLAYER_ID = "1";

interface SampleGameInput {
  id: number;
  gameDate: string;
  opponent: string;
  venue: GameVenue;
  pts: number;
  reb: number;
  ast: number;
}

const buildSampleGame = (input: SampleGameInput): PlayerGame => {
  const { id, gameDate, opponent, venue, pts, reb, ast } = input;

  return {
    id,
    gameDate: new Date(`${gameDate}T00:00:00.000Z`),
    opponent,
    venue,
    pts,
    reb,
    ast,
  };
};

export const sampleHitRateGames: PlayerGame[] = [
  buildSampleGame({
    id: 1,
    gameDate: "2026-03-18",
    opponent: "MEM",
    venue: "away",
    pts: 10,
    reb: 8,
    ast: 4,
  }),
  buildSampleGame({
    id: 2,
    gameDate: "2026-03-20",
    opponent: "TOR",
    venue: "home",
    pts: 20,
    reb: 10,
    ast: 6,
  }),
  buildSampleGame({
    id: 3,
    gameDate: "2026-03-22",
    opponent: "POR",
    venue: "home",
    pts: 24,
    reb: 12,
    ast: 8,
  }),
  buildSampleGame({
    id: 4,
    gameDate: "2026-03-24",
    opponent: "PHX",
    venue: "away",
    pts: 25,
    reb: 7,
    ast: 5,
  }),
  buildSampleGame({
    id: 5,
    gameDate: "2026-03-25",
    opponent: "DAL",
    venue: "home",
    pts: 25,
    reb: 21,
    ast: 9,
  }),
  buildSampleGame({
    id: 6,
    gameDate: "2026-03-27",
    opponent: "UTAH",
    venue: "home",
    pts: 25,
    reb: 15,
    ast: 12,
  }),
  buildSampleGame({
    id: 7,
    gameDate: "2026-03-29",
    opponent: "GS",
    venue: "home",
    pts: 26,
    reb: 15,
    ast: 8,
  }),
  buildSampleGame({
    id: 8,
    gameDate: "2026-04-01",
    opponent: "UTAH",
    venue: "away",
    pts: 27,
    reb: 17,
    ast: 12,
  }),
  buildSampleGame({
    id: 9,
    gameDate: "2026-04-04",
    opponent: "SA",
    venue: "home",
    pts: 28,
    reb: 8,
    ast: 13,
  }),
  buildSampleGame({
    id: 10,
    gameDate: "2026-04-06",
    opponent: "SA",
    venue: "away",
    pts: 30,
    reb: 14,
    ast: 13,
  }),
];
