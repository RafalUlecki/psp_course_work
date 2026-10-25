import { getHitRate } from "@/src/lib/hitRate/getHitRate";

const hitRateCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export const OPTIONS = async (): Promise<Response> =>
  new Response(null, { status: 204, headers: hitRateCorsHeaders });

export const GET = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const result = await getHitRate({ searchParams: url.searchParams });

  return Response.json(result.body, {
    status: result.status,
    headers: hitRateCorsHeaders,
  });
};
