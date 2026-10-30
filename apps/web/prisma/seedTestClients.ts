import type { PrismaClient } from "@prisma/client";

import {
  TEST_CLIENT_A_ID,
  TEST_CLIENT_A_NAME,
  TEST_CLIENT_B_ID,
  TEST_CLIENT_B_NAME,
} from "../src/lib/clients/constants";
import type { WatchlistPlayerIds } from "../src/lib/clients/pickWatchlistPlayers";

interface SeedTestClientsProps {
  db: PrismaClient;
  playerIds: WatchlistPlayerIds;
}

export const seedTestClients = async (
  props: SeedTestClientsProps,
): Promise<void> => {
  const { db, playerIds } = props;
  const { clientAPlayerId, clientBPlayerId } = playerIds;

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

  await db.watchlistItem.upsert({
    where: {
      clientId_playerId: {
        clientId: TEST_CLIENT_A_ID,
        playerId: clientAPlayerId,
      },
    },
    create: { clientId: TEST_CLIENT_A_ID, playerId: clientAPlayerId },
    update: {},
  });

  await db.watchlistItem.upsert({
    where: {
      clientId_playerId: {
        clientId: TEST_CLIENT_B_ID,
        playerId: clientBPlayerId,
      },
    },
    create: { clientId: TEST_CLIENT_B_ID, playerId: clientBPlayerId },
    update: {},
  });
};
