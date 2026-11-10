import type { PrismaClient } from "@prisma/client";

import { DEV_USERS } from "../src/lib/auth/devUsers";
import { hashPassword } from "../src/lib/auth/passwordHash";

interface SeedDevUsersProps {
  db: PrismaClient;
}

export const seedDevUsers = async (
  props: SeedDevUsersProps,
): Promise<void> => {
  const { db } = props;

  for (const devUser of DEV_USERS) {
    const passwordHash = await hashPassword({ password: devUser.password });

    await db.user.upsert({
      where: { email: devUser.email },
      create: {
        id: devUser.id,
        email: devUser.email,
        passwordHash,
        clientId: devUser.clientId,
        role: devUser.role,
      },
      update: {
        passwordHash,
        clientId: devUser.clientId,
        role: devUser.role,
      },
    });
  }
};
