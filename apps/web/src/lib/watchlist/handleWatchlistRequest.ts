import { forbiddenResult } from "../auth/forbiddenResult";
import { unauthorizedResult } from "../auth/unauthorizedResult";
import {
  METHOD_NOT_ALLOWED_ERROR,
  PLAYER_NOT_FOUND_ERROR,
  WATCHLIST_ITEM_NOT_FOUND_ERROR,
} from "./errors";
import { prismaWatchlistStore } from "./prismaWatchlistStore";
import { parseWatchlistItemIdQuery } from "./query/parseWatchlistItemId";
import {
  parseWatchlistPlayerIdBody,
  parseWatchlistPlayerIdQuery,
} from "./query/parseWatchlistPlayerId";
import type { WatchlistHttpResult } from "./types/api";
import type { HandleWatchlistRequestProps } from "./types/handleWatchlistRequest";
import type { WatchlistOwner, WatchlistStore } from "./types/watchlistStore";

const listForOwner = async (
  owner: WatchlistOwner,
  store: WatchlistStore,
): Promise<WatchlistHttpResult> => {
  const rows = await store.listByOwner(owner);

  return {
    status: 200,
    body: {
      userId: owner.userId,
      clientId: owner.clientId,
      items: rows.map((row) => ({ id: row.id, playerId: row.playerId })),
    },
  };
};

const itemBelongsToOwner = (
  item: { userId: string; clientId: string },
  owner: WatchlistOwner,
): boolean => item.userId === owner.userId && item.clientId === owner.clientId;

const getItemForOwner = async (
  props: { owner: WatchlistOwner; searchParams: URLSearchParams },
  store: WatchlistStore,
): Promise<WatchlistHttpResult> => {
  const { owner, searchParams } = props;
  const parsed = parseWatchlistItemIdQuery({ searchParams });

  if (!parsed.ok) {
    return { status: 400, body: { error: parsed.error } };
  }

  const item = await store.findItemById(parsed.id);
  if (item === null) {
    return { status: 404, body: { error: WATCHLIST_ITEM_NOT_FOUND_ERROR } };
  }

  if (!itemBelongsToOwner(item, owner)) {
    return forbiddenResult();
  }

  return {
    status: 200,
    body: {
      userId: item.userId,
      clientId: item.clientId,
      id: item.id,
      playerId: item.playerId,
    },
  };
};

const addForOwner = async (
  props: { owner: WatchlistOwner; bodyText: string },
  store: WatchlistStore,
): Promise<WatchlistHttpResult> => {
  const { owner, bodyText } = props;
  const parsed = parseWatchlistPlayerIdBody({ bodyText });

  if (!parsed.ok) {
    return { status: 400, body: { error: parsed.error } };
  }

  const playerExists = await store.playerExists(parsed.playerId);
  if (!playerExists) {
    return { status: 400, body: { error: PLAYER_NOT_FOUND_ERROR } };
  }

  const existing = await store.findItem(owner, parsed.playerId);
  if (existing !== null) {
    return {
      status: 200,
      body: {
        userId: owner.userId,
        clientId: owner.clientId,
        playerId: parsed.playerId,
        id: existing.id,
      },
    };
  }

  const created = await store.createItem(owner, parsed.playerId);

  return {
    status: 201,
    body: {
      userId: owner.userId,
      clientId: owner.clientId,
      playerId: parsed.playerId,
      id: created.id,
    },
  };
};

const removeByPlayerId = async (
  props: { owner: WatchlistOwner; searchParams: URLSearchParams },
  store: WatchlistStore,
): Promise<WatchlistHttpResult> => {
  const { owner, searchParams } = props;
  const parsed = parseWatchlistPlayerIdQuery({ searchParams });

  if (!parsed.ok) {
    return { status: 400, body: { error: parsed.error } };
  }

  await store.deleteItem(owner, parsed.playerId);

  return {
    status: 200,
    body: {
      userId: owner.userId,
      clientId: owner.clientId,
      playerId: parsed.playerId,
    },
  };
};

const removeByItemId = async (
  props: { owner: WatchlistOwner; searchParams: URLSearchParams },
  store: WatchlistStore,
): Promise<WatchlistHttpResult> => {
  const { owner, searchParams } = props;
  const parsed = parseWatchlistItemIdQuery({ searchParams });

  if (!parsed.ok) {
    return { status: 400, body: { error: parsed.error } };
  }

  const item = await store.findItemById(parsed.id);
  if (item === null) {
    return { status: 404, body: { error: WATCHLIST_ITEM_NOT_FOUND_ERROR } };
  }

  if (!itemBelongsToOwner(item, owner)) {
    return forbiddenResult();
  }

  await store.deleteItemById(item.id, owner);

  return {
    status: 200,
    body: {
      userId: owner.userId,
      clientId: owner.clientId,
      id: item.id,
      playerId: item.playerId,
    },
  };
};

interface ResolvedWatchlistOwner {
  ok: true;
  owner: WatchlistOwner;
}

interface UnresolvedWatchlistOwner {
  ok: false;
  result: WatchlistHttpResult;
}

type ResolveWatchlistOwnerResult =
  | ResolvedWatchlistOwner
  | UnresolvedWatchlistOwner;

const resolveWatchlistOwner = (
  props: HandleWatchlistRequestProps,
): ResolveWatchlistOwnerResult => {
  const { auth } = props;

  if (auth.skipped) {
    return { ok: false, result: unauthorizedResult() };
  }

  return {
    ok: true,
    owner: { userId: auth.userId, clientId: auth.clientId },
  };
};

export const handleWatchlistRequest = async (
  props: HandleWatchlistRequestProps,
  store: WatchlistStore = prismaWatchlistStore,
): Promise<WatchlistHttpResult> => {
  const { method, searchParams, bodyText } = props;
  const resolved = resolveWatchlistOwner(props);

  if (!resolved.ok) {
    return resolved.result;
  }

  const { owner } = resolved;

  if (method === "GET") {
    if (searchParams.get("id") !== null) {
      return getItemForOwner({ owner, searchParams }, store);
    }
    return listForOwner(owner, store);
  }

  if (method === "POST") {
    return addForOwner({ owner, bodyText }, store);
  }

  if (method === "DELETE") {
    if (searchParams.get("id") !== null) {
      return removeByItemId({ owner, searchParams }, store);
    }
    return removeByPlayerId({ owner, searchParams }, store);
  }

  return { status: 405, body: { error: METHOD_NOT_ALLOWED_ERROR } };
};
