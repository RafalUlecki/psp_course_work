import { createHash, randomBytes } from "node:crypto";

import { AUTH_TOKEN_BYTES } from "./constants";

export const generateRawToken = (): string =>
  randomBytes(AUTH_TOKEN_BYTES).toString("base64url");

export const hashToken = (rawToken: string): string =>
  createHash("sha256").update(rawToken).digest("hex");
