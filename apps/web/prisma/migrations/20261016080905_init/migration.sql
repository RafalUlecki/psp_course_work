-- CreateEnum
CREATE TYPE "Venue" AS ENUM ('home', 'away');

-- CreateTable
CREATE TABLE "players" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "team" TEXT,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_logs" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "game_date" DATE NOT NULL,
    "opponent" TEXT NOT NULL,
    "venue" "Venue" NOT NULL,
    "pts" INTEGER NOT NULL,
    "reb" INTEGER NOT NULL,
    "ast" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "source_game_id" TEXT NOT NULL,

    CONSTRAINT "game_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "game_logs_player_id_game_date_idx" ON "game_logs"("player_id", "game_date");

-- CreateIndex
CREATE UNIQUE INDEX "game_logs_player_id_source_source_game_id_key" ON "game_logs"("player_id", "source", "source_game_id");

-- AddForeignKey
ALTER TABLE "game_logs" ADD CONSTRAINT "game_logs_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
