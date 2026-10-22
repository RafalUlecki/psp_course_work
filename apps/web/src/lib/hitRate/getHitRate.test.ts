import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GET } from "../../../app/api/hit-rate/route";
import { MISSING_LINE_ERROR, MISSING_PLAYER_ID_ERROR } from "./getHitRate";
import type {
  HitRateErrorResponse,
  HitRateSuccessResponse,
} from "./types/api";
import { validateStat } from "./validateStat";

interface HitRateQuery {
  playerId?: string;
  stat?: string;
  line?: string;
  lastN?: string;
  opponent?: string;
  venue?: string;
}

interface ResponseSnapshot<T> {
  status: number;
  body: T;
}

const callGet = async (query: HitRateQuery): Promise<Response> => {
  const params = new URLSearchParams();

  if (query.playerId !== undefined) {
    params.set("playerId", query.playerId);
  }
  if (query.stat !== undefined) {
    params.set("stat", query.stat);
  }
  if (query.line !== undefined) {
    params.set("line", query.line);
  }
  if (query.lastN !== undefined) {
    params.set("lastN", query.lastN);
  }
  if (query.opponent !== undefined) {
    params.set("opponent", query.opponent);
  }
  if (query.venue !== undefined) {
    params.set("venue", query.venue);
  }

  const search = params.toString();
  const url = search
    ? `http://localhost/api/hit-rate?${search}`
    : "http://localhost/api/hit-rate";

  return GET(new Request(url));
};

const snapshot = async <T>(
  response: Response,
): Promise<ResponseSnapshot<T>> => ({
  status: response.status,
  body: (await response.json()) as T,
});

const requiredQuery: HitRateQuery = {
  playerId: "1",
  stat: "PTS",
  line: "24.5",
};

const expectedGamesNewestFirst: HitRateSuccessResponse["games"] = [
  {
    gameDate: "2026-04-06T00:00:00.000Z",
    opponent: "SA",
    venue: "away",
    value: 30,
  },
  {
    gameDate: "2026-04-04T00:00:00.000Z",
    opponent: "SA",
    venue: "home",
    value: 28,
  },
  {
    gameDate: "2026-04-01T00:00:00.000Z",
    opponent: "UTAH",
    venue: "away",
    value: 27,
  },
  {
    gameDate: "2026-03-29T00:00:00.000Z",
    opponent: "GS",
    venue: "home",
    value: 26,
  },
  {
    gameDate: "2026-03-27T00:00:00.000Z",
    opponent: "UTAH",
    venue: "home",
    value: 25,
  },
  {
    gameDate: "2026-03-25T00:00:00.000Z",
    opponent: "DAL",
    venue: "home",
    value: 25,
  },
  {
    gameDate: "2026-03-24T00:00:00.000Z",
    opponent: "PHX",
    venue: "away",
    value: 25,
  },
  {
    gameDate: "2026-03-22T00:00:00.000Z",
    opponent: "POR",
    venue: "home",
    value: 24,
  },
  {
    gameDate: "2026-03-20T00:00:00.000Z",
    opponent: "TOR",
    venue: "home",
    value: 20,
  },
  {
    gameDate: "2026-03-18T00:00:00.000Z",
    opponent: "MEM",
    venue: "away",
    value: 10,
  },
];

describe("GET /api/hit-rate", () => {
  it("should return the computed fixture hit-rate payload when required query params are valid", async () => {
    const response = await callGet(requiredQuery);

    assert.deepEqual(await snapshot<HitRateSuccessResponse>(response), {
      status: 200,
      body: {
        playerId: "1",
        stat: "pts",
        line: 24.5,
        filters: {},
        hitRate: 0.7,
        hits: 7,
        n: 10,
        games: expectedGamesNewestFirst,
      },
    });
  });

  it("should return the normalized pts stat when the query stat is mixed case", async () => {
    const response = await callGet({
      playerId: "1",
      stat: "PtS",
      line: "24.5",
    });
    const body = (await response.json()) as HitRateSuccessResponse;

    assert.deepEqual(
      { status: response.status, stat: body.stat, hitRate: body.hitRate },
      { status: 200, stat: "pts", hitRate: 0.7 },
    );
  });

  it("should return the last-N subset when lastN is 5", async () => {
    const response = await callGet({ ...requiredQuery, lastN: "5" });

    assert.deepEqual(await snapshot<HitRateSuccessResponse>(response), {
      status: 200,
      body: {
        playerId: "1",
        stat: "pts",
        line: 24.5,
        filters: { lastN: 5 },
        hitRate: 1,
        hits: 5,
        n: 5,
        games: expectedGamesNewestFirst.slice(0, 5),
      },
    });
  });

  it("should return a null hitRate and empty games when filters match no fixture games", async () => {
    const response = await callGet({ ...requiredQuery, opponent: "ZZZ" });

    assert.deepEqual(await snapshot<HitRateSuccessResponse>(response), {
      status: 200,
      body: {
        playerId: "1",
        stat: "pts",
        line: 24.5,
        filters: { opponent: "ZZZ" },
        hitRate: null,
        hits: 0,
        n: 0,
        games: [],
      },
    });
  });

  it("should return 400 with Missing playerId when playerId is omitted", async () => {
    const response = await callGet({ stat: "PTS", line: "24.5" });

    assert.deepEqual(await snapshot<HitRateErrorResponse>(response), {
      status: 400,
      body: { error: MISSING_PLAYER_ID_ERROR },
    });
  });

  it("should return 400 with validateStat's error when stat is invalid", async () => {
    const invalid = validateStat("STL");

    if (invalid.ok) {
      throw new Error("STL should be rejected by validateStat");
    }

    const response = await callGet({
      playerId: "1",
      stat: "STL",
      line: "24.5",
    });

    assert.deepEqual(await snapshot<HitRateErrorResponse>(response), {
      status: 400,
      body: { error: invalid.error },
    });
  });

  it("should return 400 when line is omitted", async () => {
    const response = await callGet({ playerId: "1", stat: "PTS" });

    assert.deepEqual(await snapshot<HitRateErrorResponse>(response), {
      status: 400,
      body: { error: MISSING_LINE_ERROR },
    });
  });
});
