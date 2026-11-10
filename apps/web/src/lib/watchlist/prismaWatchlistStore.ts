import { prisma } from "../prisma";
import type { WatchlistStore } from "./types/watchlistStore";

const itemSelect = {
  id: true,
  userId: true,
  clientId: true,
  playerId: true,
} as const;

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
  listByOwner: (owner) =>
    prisma.watchlistItem.findMany({
      where: { userId: owner.userId, clientId: owner.clientId },
      select: itemSelect,
      orderBy: { id: "asc" },
    }),
  listByClientId: (clientId) =>
    prisma.watchlistItem.findMany({
      where: { clientId },
      select: itemSelect,
      orderBy: { id: "asc" },
    }),
  countPlayersByClientId: async (clientId) => {
    const rows = await prisma.watchlistItem.groupBy({
      by: ["playerId"],
      where: { clientId },
      _count: { playerId: true },
    });

    return rows.map((row) => ({
      playerId: row.playerId,
      count: row._count.playerId,
    }));
  },
  findItem: (owner, playerId) =>
    prisma.watchlistItem.findFirst({
      where: {
        userId: owner.userId,
        clientId: owner.clientId,
        playerId,
      },
      select: itemSelect,
    }),
  findItemById: (id) =>
    prisma.watchlistItem.findUnique({
      where: { id },
      select: itemSelect,
    }),
  createItem: (owner, playerId) =>
    prisma.watchlistItem.create({
      data: {
        userId: owner.userId,
        clientId: owner.clientId,
        playerId,
      },
      select: itemSelect,
    }),
  deleteItem: async (owner, playerId) => {
    const result = await prisma.watchlistItem.deleteMany({
      where: {
        userId: owner.userId,
        clientId: owner.clientId,
        playerId,
      },
    });
    return result.count > 0;
  },
  deleteItemById: async (id, owner) => {
    const result = await prisma.watchlistItem.deleteMany({
      where: {
        id,
        userId: owner.userId,
        clientId: owner.clientId,
      },
    });
    return result.count > 0;
  },
};
