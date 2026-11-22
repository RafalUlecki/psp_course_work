import type { ForbiddenHttpResult } from "../../auth/types/forbiddenResult";
import type { UnauthorizedHttpResult } from "../../auth/types/unauthorizedResult";
import type { DefaultLastN } from "./defaultLastN";

export interface ClientSettingsResponse {
  clientId: string;
  defaultLastN: DefaultLastN;
}

export interface ClientSettingsErrorResponse {
  error: string;
}

export interface ClientSettingsSuccessHttpResult {
  status: 200;
  body: ClientSettingsResponse;
}

export interface ClientSettingsErrorHttpResult {
  status: 400 | 405;
  body: ClientSettingsErrorResponse;
}

export type ClientSettingsHttpResult =
  | ClientSettingsSuccessHttpResult
  | ClientSettingsErrorHttpResult
  | ForbiddenHttpResult
  | UnauthorizedHttpResult;
