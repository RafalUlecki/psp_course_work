import { prisma } from "../prisma";
import type { UserStore } from "./types/userStore";

export const prismaUserStore: UserStore = {
  insert: (record) =>
    prisma.user.create({
      data: {
        id: record.id,
        email: record.email,
        passwordHash: record.passwordHash,
        clientId: record.clientId,
        role: record.role,
      },
    }),
  findById: (id) => prisma.user.findUnique({ where: { id } }),
  findByEmail: (email) => prisma.user.findUnique({ where: { email } }),
};
