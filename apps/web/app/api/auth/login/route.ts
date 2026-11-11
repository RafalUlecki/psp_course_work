import { handleLoginRequest } from "@/src/lib/auth/handleLoginRequest";

const loginCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const OPTIONS = async (): Promise<Response> =>
  new Response(null, { status: 204, headers: loginCorsHeaders });

export const POST = async (request: Request): Promise<Response> => {
  const result = await handleLoginRequest({
    bodyText: await request.text(),
    now: new Date(),
  });

  return Response.json(result.body, {
    status: result.status,
    headers: loginCorsHeaders,
  });
};
