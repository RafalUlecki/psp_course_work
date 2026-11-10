export interface AuthTokenRecord {
  id: string;
  userId: string;
  clientId: string;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface AuthTokenStore {
  insert: (record: AuthTokenRecord) => Promise<AuthTokenRecord>;
  findByTokenHash: (tokenHash: string) => Promise<AuthTokenRecord | null>;
  revokeByTokenHash: (tokenHash: string, revokedAt: Date) => Promise<boolean>;
}
