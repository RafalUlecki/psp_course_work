/// <reference types="vite/client" />
/// <reference types="chrome" />

interface ImportMetaEnv {
  readonly VITE_HIT_RATE_API_BASE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
