import { getHitRate } from "../../../src/lib/hitRate/getHitRate";

/**
 * GET /api/hit-rate
 *
 * Read-only stub: validates query params, filters fixture games, returns hit rate.
 * DB wiring is out of scope (later ticket).
 */
export const GET = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const result = getHitRate({ searchParams: url.searchParams });

  return Response.json(result.body, { status: result.status });
};
