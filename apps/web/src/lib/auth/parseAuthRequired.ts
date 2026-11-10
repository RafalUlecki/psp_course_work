import { AUTH_REQUIRED_ENV } from "./constants";
import type { ParseAuthRequiredProps } from "./types/parseAuthRequired";

export const parseAuthRequired = (props: ParseAuthRequiredProps): boolean => {
  const { raw } = props;

  if (raw === undefined) {
    return true;
  }

  const trimmed = raw.trim().toLowerCase();
  if (trimmed === "false" || trimmed === "0") {
    return false;
  }

  return true;
};

export const isAuthRequired = (): boolean =>
  parseAuthRequired({ raw: process.env[AUTH_REQUIRED_ENV] });
