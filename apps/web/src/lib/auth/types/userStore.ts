import type { UserRole } from "./userRole";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  clientId: string;
  role: UserRole;
}

export interface UserStore {
  insert: (record: UserRecord) => Promise<UserRecord>;
  findById: (id: string) => Promise<UserRecord | null>;
  findByEmail: (email: string) => Promise<UserRecord | null>;
}
