import { isRequireAuthOk, requireAuth } from "@/src/lib/auth/requireAuth";
import { handleListClientUsersRequest } from "@/src/lib/clients/handleListClientUsersRequest";

const clientUsersCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization",
};

export const OPTIONS = async (): Promise<Response> =>
  new Response(null, { status: 204, headers: clientUsersCorsHeaders });

export const GET = async (request: Request): Promise<Response> => {
  const auth = await requireAuth({
    authorizationHeader: request.headers.get("authorization"),
    now: new Date(),
    method: request.method,
    pathname: new URL(request.url).pathname,
  });

  if (!isRequireAuthOk(auth)) {
    return Response.json(auth.body, {
      status: auth.status,
      headers: clientUsersCorsHeaders,
    });
  }

  const result = await handleListClientUsersRequest({ auth });

  return Response.json(result.body, {
    status: result.status,
    headers: clientUsersCorsHeaders,
  });
};
