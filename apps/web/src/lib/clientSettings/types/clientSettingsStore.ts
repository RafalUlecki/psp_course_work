import type { DefaultLastN } from "./defaultLastN";

export interface ClientSettingsRecord {
  clientId: string;
  defaultLastN: DefaultLastN;
}

export interface ClientSettingsStore {
  getByClientId: (clientId: string) => Promise<ClientSettingsRecord | null>;
  upsertByClientId: (
    clientId: string,
    defaultLastN: DefaultLastN,
  ) => Promise<ClientSettingsRecord>;
}
