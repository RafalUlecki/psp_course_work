export interface WatchlistClientRecord {
  id: string;
  name: string;
}

export interface WatchlistItemRecord {
  id: number;
  clientId: string;
  playerId: number;
}

export interface WatchlistStore {
  findClientById: (clientId: string) => Promise<WatchlistClientRecord | null>;
  playerExists: (playerId: number) => Promise<boolean>;
  listByClientId: (clientId: string) => Promise<WatchlistItemRecord[]>;
  findItem: (
    clientId: string,
    playerId: number,
  ) => Promise<WatchlistItemRecord | null>;
  createItem: (
    clientId: string,
    playerId: number,
  ) => Promise<WatchlistItemRecord>;
  deleteItem: (clientId: string, playerId: number) => Promise<boolean>;
}
