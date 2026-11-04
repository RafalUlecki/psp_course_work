import type { PrismaClient } from "@prisma/client";

import {
  TEST_CLIENT_A_ID,
  TEST_CLIENT_A_NAME,
  TEST_CLIENT_B_ID,
  TEST_CLIENT_B_NAME,
} from "../src/lib/clients/constants";

interface SeedTestClientsProps {
  db: PrismaClient;
}

export const seedTestClients = async (
  props: SeedTestClientsProps,
): Promise<void> => {
  const { db } = props;

  await db.client.upsert({
    where: { id: TEST_CLIENT_A_ID },
    create: { id: TEST_CLIENT_A_ID, name: TEST_CLIENT_A_NAME },
    update: { name: TEST_CLIENT_A_NAME },
  });

  await db.client.upsert({
    where: { id: TEST_CLIENT_B_ID },
    create: { id: TEST_CLIENT_B_ID, name: TEST_CLIENT_B_NAME },
    update: { name: TEST_CLIENT_B_NAME },
  });
};
