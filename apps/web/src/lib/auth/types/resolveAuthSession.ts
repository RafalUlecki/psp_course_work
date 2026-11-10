import type { AuthSession } from "./authSession";

export interface ResolveAuthSessionProps {
  userId: string;
}

export type ResolveAuthSessionResult = AuthSession | null;
