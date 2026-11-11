import type { DefaultLastN } from "./defaultLastN";

export interface ParseClientSettingsBodyProps {
  bodyText: string;
}

export interface ParseClientSettingsBodySuccess {
  ok: true;
  defaultLastN: DefaultLastN;
}

export interface ParseClientSettingsBodyFailure {
  ok: false;
  error: string;
}

export type ParseClientSettingsBodyResult =
  | ParseClientSettingsBodySuccess
  | ParseClientSettingsBodyFailure;
