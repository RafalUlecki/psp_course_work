-- Existing watchlist rows cannot be mapped to a user; drop them so user_id can be required.
DELETE FROM "watchlist_items";

-- DropIndex
DROP INDEX "watchlist_items_client_id_player_id_key";

-- AlterTable
ALTER TABLE "watchlist_items" ADD COLUMN "user_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "watchlist_items_user_id_player_id_key" ON "watchlist_items"("user_id", "player_id");

-- CreateIndex
CREATE INDEX "watchlist_items_user_id_idx" ON "watchlist_items"("user_id");

-- AddForeignKey
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
