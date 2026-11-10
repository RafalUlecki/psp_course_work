import { isAuthRequired } from "@/src/lib/auth/parseAuthRequired";
import { handleHitRateRequest } from "@/src/lib/hitRate/handleHitRateRequest";

const hitRateCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization",
};

export const OPTIONS = async (): Promise<Response> =>
  new Response(null, { status: 204, headers: hitRateCorsHeaders });

export const GET = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const result = await handleHitRateRequest({
    authorizationHeader: request.headers.get("authorization"),
    searchParams: url.searchParams,
    now: new Date(),
    authRequired: isAuthRequired(),
  });

  return Response.json(result.body, {
    status: result.status,
    headers: hitRateCorsHeaders,
  });
};
