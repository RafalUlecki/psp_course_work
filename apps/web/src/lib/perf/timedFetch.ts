import { bearerHeader } from "./authorizationHeader";
import type { TimedFetchProps, TimedFetchResult } from "./types/timedFetch";

export const timedFetch = async (
  props: TimedFetchProps,
): Promise<TimedFetchResult> => {
  const { url, token, fetchImpl, nowMs } = props;
  const startedMs = nowMs();
  const response = await fetchImpl(url, { headers: bearerHeader(token) });
  const bodyText = await response.text();
  const elapsedMs = nowMs() - startedMs;

  return {
    ok: true,
    elapsedMs,
    status: response.status,
    bodyText,
  };
};