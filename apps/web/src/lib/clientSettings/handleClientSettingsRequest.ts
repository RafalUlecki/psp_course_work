import {
  isRequireAdminSessionOk,
  requireAdminSession,
} from "../auth/requireAdminSession";
import { unauthorizedResult } from "../auth/unauthorizedResult";
import { DEFAULT_CLIENT_LAST_N } from "./constants";
import { METHOD_NOT_ALLOWED_ERROR } from "./errors";
import { parseClientSettingsBody } from "./parseClientSettingsBody";
import { prismaClientSettingsStore } from "./prismaClientSettingsStore";
import type { ClientSettingsHttpResult } from "./types/api";
import type { ClientSettingsStore } from "./types/clientSettingsStore";
import type { HandleClientSettingsRequestProps } from "./types/handleClientSettingsRequest";

const GET_METHOD = "GET";
const PATCH_METHOD = "PATCH";

const readSettingsForClient = async (
  clientId: string,
  store: ClientSettingsStore,
): Promise<ClientSettingsHttpResult> => {
  const row = await store.getByClientId(clientId);

  return {
    status: 200,
    body: {
      clientId,
      defaultLastN: row?.defaultLastN ?? DEFAULT_CLIENT_LAST_N,
    },
  };
};

const getForSession = async (
  props: HandleClientSettingsRequestProps,
  store: ClientSettingsStore,
): Promise<ClientSettingsHttpResult> => {
  const { auth } = props;

  if (auth.skipped) {
    return unauthorizedResult();
  }

  return readSettingsForClient(auth.clientId, store);
};

const patchForAdmin = async (
  props: HandleClientSettingsRequestProps,
  store: ClientSettingsStore,
): Promise<ClientSettingsHttpResult> => {
  const { auth, bodyText } = props;
  const admin = requireAdminSession(auth);

  if (!isRequireAdminSessionOk(admin)) {
    return admin;
  }

  const parsed = parseClientSettingsBody({ bodyText });

  if (!parsed.ok) {
    return { status: 400, body: { error: parsed.error } };
  }

  const row = await store.upsertByClientId(admin.clientId, parsed.defaultLastN);

  return {
    status: 200,
    body: {
      clientId: row.clientId,
      defaultLastN: row.defaultLastN,
    },
  };
};

export const handleClientSettingsRequest = async (
  props: HandleClientSettingsRequestProps,
  store: ClientSettingsStore = prismaClientSettingsStore,
): Promise<ClientSettingsHttpResult> => {
  const { method } = props;

  if (method === GET_METHOD) {
    return getForSession(props, store);
  }

  if (method === PATCH_METHOD) {
    return patchForAdmin(props, store);
  }

  return { status: 405, body: { error: METHOD_NOT_ALLOWED_ERROR } };
};
