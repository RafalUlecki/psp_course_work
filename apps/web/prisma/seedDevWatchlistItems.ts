import type { PrismaClient } from "@prisma/client";

import { DEV_USERS } from "../src/lib/auth/devUsers";

export const DEMO_WATCHLIST_PLAYER_ID = 203999;

interface SeedDevWatchlistItemsProps {
  db: PrismaClient;
  playerIds: number[];
}

const ownerEmails: readonly string[] = [
  "admin-a@prophover.local",
  "admin-b@prophover.local",
];

export const seedDevWatchlistItems = async (
  props: SeedDevWatchlistItemsProps,
): Promise<number> => {
  const { db, playerIds } = props;
  const playerId = playerIds.includes(DEMO_WATCHLIST_PLAYER_ID)
    ? DEMO_WATCHLIST_PLAYER_ID
    : playerIds[0];

  if (playerId === undefined) {
    return 0;
  }

  const player = await db.player.findUnique({
    where: { id: playerId },
    select: { id: true },
  });

  if (player === null) {
    return 0;
  }

  let seeded = 0;

  for (const email of ownerEmails) {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, clientId: true },
    });

    if (user === null) {
      continue;
    }

    await db.watchlistItem.upsert({
      where: {
        userId_playerId: { userId: user.id, playerId },
      },
      create: {
        userId: user.id,
        clientId: user.clientId,
        playerId,
      },
      update: {},
    });
    seeded += 1;
  }

  const unusedEmails = DEV_USERS.filter(
    (devUser) => !ownerEmails.includes(devUser.email),
  );
  for (const unused of unusedEmails) {
    await db.watchlistItem.deleteMany({
      where: { user: { email: unused.email } },
    });
  }

  return seeded;
};
