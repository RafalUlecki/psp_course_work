import type { DefaultLastN } from "./types/defaultLastN";

export const DEFAULT_CLIENT_LAST_N: DefaultLastN = 10;

export const isDefaultLastN = (value: number): value is DefaultLastN =>
  value === 5 || value === 10;

export const toDefaultLastN = (value: number): DefaultLastN =>
  isDefaultLastN(value) ? value : DEFAULT_CLIENT_LAST_N;
