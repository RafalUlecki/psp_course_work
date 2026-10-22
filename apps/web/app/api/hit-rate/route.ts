import { getGameLogsByPlayerId } from "@/src/lib/gameLogs/getGameLogsByPlayerId";
import { getHitRate } from "@/src/lib/hitRate/getHitRate";

export const GET = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const result = await getHitRate(
    { searchParams: url.searchParams },
    getGameLogsByPlayerId,
  );

  return Response.json(result.body, { status: result.status });
};
