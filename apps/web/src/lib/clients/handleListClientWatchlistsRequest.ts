import { prismaUserStore } from "../auth/prismaUserStore";
import {
  isRequireAdminSessionOk,
  requireAdminSession,
} from "../auth/requireAdminSession";
import type { UserStore } from "../auth/types/userStore";
import { prismaWatchlistStore } from "../watchlist/prismaWatchlistStore";
import type { WatchlistStore } from "../watchlist/types/watchlistStore";
import type {
  ClientWatchlistItemDto,
  HandleListClientWatchlistsRequestProps,
  ListClientWatchlistsHttpResult,
} from "./types/handleListClientWatchlistsRequest";

export const handleListClientWatchlistsRequest = async (
  props: HandleListClientWatchlistsRequestProps,
  userStore: UserStore = prismaUserStore,
  watchlistStore: WatchlistStore = prismaWatchlistStore,
): Promise<ListClientWatchlistsHttpResult> => {
  const { auth } = props;
  const admin = requireAdminSession(auth);

  if (!isRequireAdminSessionOk(admin)) {
    return admin;
  }

  const users = await userStore.listByClientId(admin.clientId);
  const items = await watchlistStore.listByClientId(admin.clientId);
  const itemsByUserId = new Map<string, ClientWatchlistItemDto[]>();

  for (const item of items) {
    const existing = itemsByUserId.get(item.userId);
    const dto = { id: item.id, playerId: item.playerId };
    if (existing === undefined) {
      itemsByUserId.set(item.userId, [dto]);
    } else {
      existing.push(dto);
    }
  }

  return {
    status: 200,
    body: {
      clientId: admin.clientId,
      watchlists: users.map((user) => ({
        userId: user.id,
        email: user.email,
        role: user.role,
        items: itemsByUserId.get(user.id) ?? [],
      })),
    },
  };
};
