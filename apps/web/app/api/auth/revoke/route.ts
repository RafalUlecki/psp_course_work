import { handleAuthRevokeRequest } from "@/src/lib/auth/handleAuthRevokeRequest";

const revokeCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export const OPTIONS = async (): Promise<Response> =>
  new Response(null, { status: 204, headers: revokeCorsHeaders });

export const POST = async (request: Request): Promise<Response> => {
  const result = await handleAuthRevokeRequest({
    authorizationHeader: request.headers.get("authorization"),
    now: new Date(),
  });

  return Response.json(result.body, {
    status: result.status,
    headers: revokeCorsHeaders,
  });
};
