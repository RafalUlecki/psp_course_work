import { prismaUserStore } from "./prismaUserStore";
import type {
  ResolveAuthSessionProps,
  ResolveAuthSessionResult,
} from "./types/resolveAuthSession";
import type { UserStore } from "./types/userStore";

export const resolveAuthSession = async (
  props: ResolveAuthSessionProps,
  userStore: UserStore = prismaUserStore,
): Promise<ResolveAuthSessionResult> => {
  const { userId } = props;
  const user = await userStore.findById(userId);

  if (user === null) {
    return null;
  }

  return {
    userId: user.id,
    clientId: user.clientId,
    role: user.role,
  };
};
