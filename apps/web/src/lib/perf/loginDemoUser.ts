import {
  PERF_LOGIN_EMAIL,
  PERF_LOGIN_PASSWORD,
  PERF_LOGIN_PATH,
} from "./constants";
import { LOGIN_BODY_INVALID_ERROR, LOGIN_FAILED_ERROR } from "./errors";
import { parseJsonObject } from "./parseJsonObject";
import type { LoginDemoUserProps, LoginDemoUserResult } from "./types/loginDemoUser";

interface LoginJson {
  token?: string;
  error?: string;
}

export const loginDemoUser = async (
  props: LoginDemoUserProps,
): Promise<LoginDemoUserResult> => {
  const { baseUrl, fetchImpl } = props;
  const url = new URL(PERF_LOGIN_PATH, baseUrl).toString();
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: PERF_LOGIN_EMAIL,
      password: PERF_LOGIN_PASSWORD,
    }),
  });
  const bodyText = await response.text();
  const parsed = parseJsonObject<LoginJson>(bodyText);

  if (response.status !== 200 || parsed === null || typeof parsed.token !== "string") {
    return {
      ok: false,
      error: `${LOGIN_FAILED_ERROR} ${parsed?.error ?? LOGIN_BODY_INVALID_ERROR} (HTTP ${response.status})`,
    };
  }

  return { ok: true, token: parsed.token };
};