import { isRequireAuthOk, requireAuth } from "@/src/lib/auth/requireAuth";
import { handleTrendingWatchlistsRequest } from "@/src/lib/clients/handleTrendingWatchlistsRequest";

const trendingCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization",
};

export const OPTIONS = async (): Promise<Response> =>
  new Response(null, { status: 204, headers: trendingCorsHeaders });

export const GET = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const auth = await requireAuth({
    authorizationHeader: request.headers.get("authorization"),
    now: new Date(),
    method: request.method,
    pathname: url.pathname,
  });

  if (!isRequireAuthOk(auth)) {
    return Response.json(auth.body, {
      status: auth.status,
      headers: trendingCorsHeaders,
    });
  }

  const result = await handleTrendingWatchlistsRequest({
    auth,
    searchParams: url.searchParams,
  });

  return Response.json(result.body, {
    status: result.status,
    headers: trendingCorsHeaders,
  });
};
