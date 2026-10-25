/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HIT_RATE_API_BASE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
