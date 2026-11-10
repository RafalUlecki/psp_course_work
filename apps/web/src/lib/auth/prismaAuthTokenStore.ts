import { prisma } from "../prisma";
import type { AuthTokenStore } from "./types/authTokenStore";

export const prismaAuthTokenStore: AuthTokenStore = {
  insert: (record) =>
    prisma.authToken.create({
      data: {
        id: record.id,
        clientId: record.clientId,
        tokenHash: record.tokenHash,
        createdAt: record.createdAt,
        expiresAt: record.expiresAt,
        revokedAt: record.revokedAt,
      },
    }),
  findByTokenHash: (tokenHash) =>
    prisma.authToken.findUnique({
      where: { tokenHash },
    }),
  revokeByTokenHash: async (tokenHash, revokedAt) => {
    const result = await prisma.authToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt },
    });
    return result.count > 0;
  },
};
