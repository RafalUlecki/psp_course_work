import { forbiddenResult } from "../auth/forbiddenResult";
import { isAdminAuth } from "../auth/isAdminAuth";
import { prismaUserStore } from "../auth/prismaUserStore";
import type { UserStore } from "../auth/types/userStore";
import { unauthorizedResult } from "../auth/unauthorizedResult";
import type {
  HandleListClientUsersRequestProps,
  ListClientUsersHttpResult,
} from "./types/handleListClientUsersRequest";

export const handleListClientUsersRequest = async (
  props: HandleListClientUsersRequestProps,
  userStore: UserStore = prismaUserStore,
): Promise<ListClientUsersHttpResult> => {
  const { auth } = props;

  if (auth.skipped) {
    return unauthorizedResult();
  }

  if (!isAdminAuth(auth)) {
    return forbiddenResult();
  }

  const rows = await userStore.listByClientId(auth.clientId);

  return {
    status: 200,
    body: {
      clientId: auth.clientId,
      users: rows.map((row) => ({
        id: row.id,
        email: row.email,
        role: row.role,
      })),
    },
  };
};
