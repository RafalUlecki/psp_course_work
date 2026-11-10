import { forbiddenResult } from "../auth/forbiddenResult";
import { isAdminAuth } from "../auth/isAdminAuth";
import { parseClientIdHeader } from "../clients/parseClientIdHeader";
import { UNKNOWN_CLIENT_ID_ERROR } from "../clients/errors";
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
import type { WatchlistStore } from "./types/watchlistStore";

const listForClient = async (
  clientId: string,
  store: WatchlistStore,
): Promise<WatchlistHttpResult> => {
  const rows = await store.listByClientId(clientId);

  return {
    status: 200,
    body: {
      clientId,
      items: rows.map((row) => ({ id: row.id, playerId: row.playerId })),
    },
  };
};

const getItemForClient = async (
  props: { clientId: string; searchParams: URLSearchParams },
  store: WatchlistStore,
): Promise<WatchlistHttpResult> => {
  const { clientId, searchParams } = props;
  const parsed = parseWatchlistItemIdQuery({ searchParams });

  if (!parsed.ok) {
    return { status: 400, body: { error: parsed.error } };
  }

  const item = await store.findItemById(parsed.id);
  if (item === null) {
    return { status: 404, body: { error: WATCHLIST_ITEM_NOT_FOUND_ERROR } };
  }

  if (item.clientId !== clientId) {
    return forbiddenResult();
  }

  return {
    status: 200,
    body: {
      clientId: item.clientId,
      id: item.id,
      playerId: item.playerId,
    },
  };
};

const addForClient = async (
  props: { clientId: string; bodyText: string },
  store: WatchlistStore,
): Promise<WatchlistHttpResult> => {
  const { clientId, bodyText } = props;
  const parsed = parseWatchlistPlayerIdBody({ bodyText });

  if (!parsed.ok) {
    return { status: 400, body: { error: parsed.error } };
  }

  const playerExists = await store.playerExists(parsed.playerId);
  if (!playerExists) {
    return { status: 400, body: { error: PLAYER_NOT_FOUND_ERROR } };
  }

  const existing = await store.findItem(clientId, parsed.playerId);
  if (existing !== null) {
    return {
      status: 200,
      body: { clientId, playerId: parsed.playerId, id: existing.id },
    };
  }

  const created = await store.createItem(clientId, parsed.playerId);

  return {
    status: 201,
    body: { clientId, playerId: parsed.playerId, id: created.id },
  };
};

const removeByPlayerId = async (
  props: { clientId: string; searchParams: URLSearchParams },
  store: WatchlistStore,
): Promise<WatchlistHttpResult> => {
  const { clientId, searchParams } = props;
  const parsed = parseWatchlistPlayerIdQuery({ searchParams });

  if (!parsed.ok) {
    return { status: 400, body: { error: parsed.error } };
  }

  await store.deleteItem(clientId, parsed.playerId);

  return {
    status: 200,
    body: { clientId, playerId: parsed.playerId },
  };
};

const removeByItemId = async (
  props: { clientId: string; searchParams: URLSearchParams },
  store: WatchlistStore,
): Promise<WatchlistHttpResult> => {
  const { clientId, searchParams } = props;
  const parsed = parseWatchlistItemIdQuery({ searchParams });

  if (!parsed.ok) {
    return { status: 400, body: { error: parsed.error } };
  }

  const item = await store.findItemById(parsed.id);
  if (item === null) {
    return { status: 404, body: { error: WATCHLIST_ITEM_NOT_FOUND_ERROR } };
  }

  if (item.clientId !== clientId) {
    return forbiddenResult();
  }

  await store.deleteItemById(item.id, clientId);

  return {
    status: 200,
    body: { clientId, id: item.id, playerId: item.playerId },
  };
};

interface ResolvedWatchlistClient {
  ok: true;
  clientId: string;
}

interface UnresolvedWatchlistClient {
  ok: false;
  result: WatchlistHttpResult;
}

type ResolveWatchlistClientIdResult =
  | ResolvedWatchlistClient
  | UnresolvedWatchlistClient;

const resolveWatchlistClientId = async (
  props: HandleWatchlistRequestProps,
  store: WatchlistStore,
): Promise<ResolveWatchlistClientIdResult> => {
  const { headers, auth } = props;

  if (!auth.skipped) {
    return { ok: true, clientId: auth.clientId };
  }

  const parsedClient = parseClientIdHeader({ headers });

  if (!parsedClient.ok) {
    return {
      ok: false,
      result: { status: 400, body: { error: parsedClient.error } },
    };
  }

  const client = await store.findClientById(parsedClient.clientId);
  if (client === null) {
    return {
      ok: false,
      result: { status: 401, body: { error: UNKNOWN_CLIENT_ID_ERROR } },
    };
  }

  return { ok: true, clientId: client.id };
};

export const handleWatchlistRequest = async (
  props: HandleWatchlistRequestProps,
  store: WatchlistStore = prismaWatchlistStore,
): Promise<WatchlistHttpResult> => {
  const { method, searchParams, bodyText, auth } = props;
  const resolved = await resolveWatchlistClientId(props, store);

  if (!resolved.ok) {
    return resolved.result;
  }

  const { clientId } = resolved;

  if (method === "GET") {
    if (searchParams.get("id") !== null) {
      return getItemForClient({ clientId, searchParams }, store);
    }
    return listForClient(clientId, store);
  }

  if (method === "POST") {
    if (!isAdminAuth(auth)) {
      return forbiddenResult();
    }
    return addForClient({ clientId, bodyText }, store);
  }

  if (method === "DELETE") {
    if (!isAdminAuth(auth)) {
      return forbiddenResult();
    }
    if (searchParams.get("id") !== null) {
      return removeByItemId({ clientId, searchParams }, store);
    }
    return removeByPlayerId({ clientId, searchParams }, store);
  }

  return { status: 405, body: { error: METHOD_NOT_ALLOWED_ERROR } };
};
