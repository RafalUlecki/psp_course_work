import { assertAuthEnv } from "./src/lib/auth/parseAuthTokenTtlDays";

export const register = (): void => {
  assertAuthEnv();
};
