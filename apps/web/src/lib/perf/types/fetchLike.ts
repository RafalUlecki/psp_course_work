export interface PerfHttpInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface PerfHttpResponse {
  status: number;
  text: () => Promise<string>;
}

export type PerfFetch = (
  url: string,
  init?: PerfHttpInit,
) => Promise<PerfHttpResponse>;