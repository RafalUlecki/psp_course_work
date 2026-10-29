import { parseClientIdHeader } from "../clients/parseClientIdHeader";
import { UNKNOWN_CLIENT_ID_ERROR } from "../clients/errors";
import {
  METHOD_NOT_ALLOWED_ERROR,
  PLAYER_NOT_FOUND_ERROR,
} from "./errors";
import { prismaWatchlistStore } from "./prismaWatchlistStore";
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
      items: rows.map((row) => ({ playerId: row.playerId })),
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
      body: { clientId, playerId: parsed.playerId },
    };
  }

  await store.createItem(clientId, parsed.playerId);

  return {
    status: 201,
    body: { clientId, playerId: parsed.playerId },
  };
};

const removeForClient = async (
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

export const handleWatchlistRequest = async (
  props: HandleWatchlistRequestProps,
  store: WatchlistStore = prismaWatchlistStore,
): Promise<WatchlistHttpResult> => {
  const { method, headers, searchParams, bodyText } = props;
  const parsedClient = parseClientIdHeader({ headers });

  if (!parsedClient.ok) {
    return { status: 400, body: { error: parsedClient.error } };
  }

  const client = await store.findClientById(parsedClient.clientId);
  if (client === null) {
    return { status: 401, body: { error: UNKNOWN_CLIENT_ID_ERROR } };
  }

  if (method === "GET") {
    return listForClient(client.id, store);
  }

  if (method === "POST") {
    return addForClient({ clientId: client.id, bodyText }, store);
  }

  if (method === "DELETE") {
    return removeForClient({ clientId: client.id, searchParams }, store);
  }

  return { status: 405, body: { error: METHOD_NOT_ALLOWED_ERROR } };
};
