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
  const { method, searchParams, bodyText } = props;
  const resolved = await resolveWatchlistClientId(props, store);

  if (!resolved.ok) {
    return resolved.result;
  }

  const { clientId } = resolved;

  if (method === "GET") {
    return listForClient(clientId, store);
  }

  if (method === "POST") {
    return addForClient({ clientId, bodyText }, store);
  }

  if (method === "DELETE") {
    return removeForClient({ clientId, searchParams }, store);
  }

  return { status: 405, body: { error: METHOD_NOT_ALLOWED_ERROR } };
};
