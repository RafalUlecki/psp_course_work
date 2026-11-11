import type { UserRole } from "./userRole";

export interface AuthSession {
  userId: string;
  clientId: string;
  role: UserRole;
}
