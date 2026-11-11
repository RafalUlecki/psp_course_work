import { isRequireAuthOk, requireAuth } from "@/src/lib/auth/requireAuth";
import { handleClientSettingsRequest } from "@/src/lib/clientSettings/handleClientSettingsRequest";

const clientSettingsCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
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
      headers: clientSettingsCorsHeaders,
    });
  }

  const result = await handleClientSettingsRequest({
    method: request.method,
    searchParams: url.searchParams,
    bodyText: await request.text(),
    auth,
  });

  return Response.json(result.body, {
    status: result.status,
    headers: clientSettingsCorsHeaders,
  });
};

export const OPTIONS = async (): Promise<Response> =>
  new Response(null, { status: 204, headers: clientSettingsCorsHeaders });

export const GET = async (request: Request): Promise<Response> =>
  jsonResult(request);

export const PATCH = async (request: Request): Promise<Response> =>
  jsonResult(request);
