import { prisma } from "../prisma";
import type { WatchlistStore } from "./types/watchlistStore";

export const prismaWatchlistStore: WatchlistStore = {
  findClientById: (clientId) =>
    prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, name: true },
    }),
  playerExists: async (playerId) => {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true },
    });
    return player !== null;
  },
  listByClientId: (clientId) =>
    prisma.watchlistItem.findMany({
      where: { clientId },
      select: { id: true, clientId: true, playerId: true },
      orderBy: { id: "asc" },
    }),
  findItem: (clientId, playerId) =>
    prisma.watchlistItem.findUnique({
      where: { clientId_playerId: { clientId, playerId } },
      select: { id: true, clientId: true, playerId: true },
    }),
  createItem: (clientId, playerId) =>
    prisma.watchlistItem.create({
      data: { clientId, playerId },
      select: { id: true, clientId: true, playerId: true },
    }),
  deleteItem: async (clientId, playerId) => {
    const result = await prisma.watchlistItem.deleteMany({
      where: { clientId, playerId },
    });
    return result.count > 0;
  },
};
