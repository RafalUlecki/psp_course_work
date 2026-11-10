import { handleAuthRevokeRequest } from "@/src/lib/auth/handleAuthRevokeRequest";
import { isRequireAuthOk, requireAuth } from "@/src/lib/auth/requireAuth";

const revokeCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export const OPTIONS = async (): Promise<Response> =>
  new Response(null, { status: 204, headers: revokeCorsHeaders });

export const POST = async (request: Request): Promise<Response> => {
  const auth = await requireAuth({
    authorizationHeader: request.headers.get("authorization"),
    now: new Date(),
    method: request.method,
    pathname: new URL(request.url).pathname,
  });

  if (!isRequireAuthOk(auth)) {
    return Response.json(auth.body, {
      status: auth.status,
      headers: revokeCorsHeaders,
    });
  }

  const result = await handleAuthRevokeRequest({
    auth,
    now: new Date(),
  });

  return Response.json(result.body, {
    status: result.status,
    headers: revokeCorsHeaders,
  });
};
