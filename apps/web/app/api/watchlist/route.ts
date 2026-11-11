import { isRequireAuthOk, requireAuth } from "@/src/lib/auth/requireAuth";
import { handleWatchlistRequest } from "@/src/lib/watchlist/handleWatchlistRequest";

const watchlistCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

const jsonResult = async (request: Request): Promise<Response> => {
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
      headers: watchlistCorsHeaders,
    });
  }

  const result = await handleWatchlistRequest({
    method: request.method,
    headers: request.headers,
    searchParams: url.searchParams,
    bodyText: await request.text(),
    auth,
  });

  return Response.json(result.body, {
    status: result.status,
    headers: watchlistCorsHeaders,
  });
};

export const OPTIONS = async (): Promise<Response> =>
  new Response(null, { status: 204, headers: watchlistCorsHeaders });

export const GET = async (request: Request): Promise<Response> =>
  jsonResult(request);

export const POST = async (request: Request): Promise<Response> =>
  jsonResult(request);

export const DELETE = async (request: Request): Promise<Response> =>
  jsonResult(request);
