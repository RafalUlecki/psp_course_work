import type { StatKey } from "./computeHitRate";

export type ValidateStatInput = string | number | boolean | null | undefined;

export interface ValidateStatSuccess {
  ok: true;
  stat: StatKey;
}

export interface ValidateStatFailure {
  ok: false;
  error: string;
}

export type ValidateStatResult = ValidateStatSuccess | ValidateStatFailure;
