export interface WatchlistClientRecord {
  id: string;
  name: string;
}

export interface WatchlistItemRecord {
  id: number;
  userId: string;
  clientId: string;
  playerId: number;
}

export interface WatchlistOwner {
  userId: string;
  clientId: string;
}

export interface WatchlistPlayerCount {
  playerId: number;
  count: number;
}

export interface WatchlistStore {
  findClientById: (clientId: string) => Promise<WatchlistClientRecord | null>;
  playerExists: (playerId: number) => Promise<boolean>;
  listByOwner: (owner: WatchlistOwner) => Promise<WatchlistItemRecord[]>;
  listByClientId: (clientId: string) => Promise<WatchlistItemRecord[]>;
  countPlayersByClientId: (
    clientId: string,
  ) => Promise<WatchlistPlayerCount[]>;
  findItem: (
    owner: WatchlistOwner,
    playerId: number,
  ) => Promise<WatchlistItemRecord | null>;
  findItemById: (id: number) => Promise<WatchlistItemRecord | null>;
  createItem: (
    owner: WatchlistOwner,
    playerId: number,
  ) => Promise<WatchlistItemRecord>;
  deleteItem: (owner: WatchlistOwner, playerId: number) => Promise<boolean>;
  deleteItemById: (id: number, owner: WatchlistOwner) => Promise<boolean>;
}
