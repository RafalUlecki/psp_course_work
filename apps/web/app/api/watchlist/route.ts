import { CLIENT_ID_HEADER } from "@/src/lib/clients/constants";
import { handleWatchlistRequest } from "@/src/lib/watchlist/handleWatchlistRequest";

const watchlistCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": `${CLIENT_ID_HEADER}, Content-Type`,
};

const jsonResult = async (request: Request): Promise<Response> => {
  const result = await handleWatchlistRequest({
    method: request.method,
    headers: request.headers,
    searchParams: new URL(request.url).searchParams,
    bodyText: await request.text(),
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
