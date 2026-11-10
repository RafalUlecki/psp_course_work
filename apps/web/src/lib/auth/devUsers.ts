import { TEST_CLIENT_A_ID, TEST_CLIENT_B_ID } from "../clients/constants";
import type { UserRole } from "./types/userRole";

export interface DevUserSeed {
  email: string;
  password: string;
  clientId: string;
  role: UserRole;
}

export const DEV_USERS: readonly DevUserSeed[] = [
  {
    email: "admin-a@prophover.local",
    password: "password-admin-a",
    clientId: TEST_CLIENT_A_ID,
    role: "admin",
  },
  {
    email: "member-a@prophover.local",
    password: "password-member-a",
    clientId: TEST_CLIENT_A_ID,
    role: "member",
  },
  {
    email: "admin-b@prophover.local",
    password: "password-admin-b",
    clientId: TEST_CLIENT_B_ID,
    role: "admin",
  },
  {
    email: "member-b@prophover.local",
    password: "password-member-b",
    clientId: TEST_CLIENT_B_ID,
    role: "member",
  },
];
