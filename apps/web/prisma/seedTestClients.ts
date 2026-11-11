import type { PrismaClient } from "@prisma/client";

import { DEFAULT_CLIENT_LAST_N } from "../src/lib/clientSettings/constants";
import {
  TEST_CLIENT_A_ID,
  TEST_CLIENT_A_NAME,
  TEST_CLIENT_B_ID,
  TEST_CLIENT_B_NAME,
} from "../src/lib/clients/constants";

interface SeedTestClientsProps {
  db: PrismaClient;
}

interface UpsertClientSettingsProps {
  db: PrismaClient;
  clientId: string;
}

const upsertClientSettings = async (
  props: UpsertClientSettingsProps,
): Promise<void> => {
  const { db, clientId } = props;

  await db.clientSettings.upsert({
    where: { clientId },
    create: { clientId, defaultLastN: DEFAULT_CLIENT_LAST_N },
    update: { defaultLastN: DEFAULT_CLIENT_LAST_N },
  });
};

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

  await upsertClientSettings({ db, clientId: TEST_CLIENT_A_ID });
  await upsertClientSettings({ db, clientId: TEST_CLIENT_B_ID });
};
