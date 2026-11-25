import type { PerfFetch } from "./fetchLike";

export interface LoginDemoUserProps {
  baseUrl: string;
  fetchImpl: PerfFetch;
}

export interface LoginDemoUserSuccess {
  ok: true;
  token: string;
}

export interface LoginDemoUserFailure {
  ok: false;
  error: string;
}

export type LoginDemoUserResult = LoginDemoUserSuccess | LoginDemoUserFailure;