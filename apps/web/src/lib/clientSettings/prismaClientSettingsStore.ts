import { prisma } from "../prisma";
import { toDefaultLastN } from "./constants";
import type { ClientSettingsStore } from "./types/clientSettingsStore";

export const prismaClientSettingsStore: ClientSettingsStore = {
  getByClientId: async (clientId) => {
    const row = await prisma.clientSettings.findUnique({
      where: { clientId },
      select: { clientId: true, defaultLastN: true },
    });

    if (row === null) {
      return null;
    }

    return {
      clientId: row.clientId,
      defaultLastN: toDefaultLastN(row.defaultLastN),
    };
  },
  upsertByClientId: async (clientId, defaultLastN) => {
    const row = await prisma.clientSettings.upsert({
      where: { clientId },
      create: { clientId, defaultLastN },
      update: { defaultLastN },
      select: { clientId: true, defaultLastN: true },
    });

    return {
      clientId: row.clientId,
      defaultLastN: toDefaultLastN(row.defaultLastN),
    };
  },
};
