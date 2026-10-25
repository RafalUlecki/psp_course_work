-- Player primary keys are NBA personIds from the dataset (not SERIAL).
ALTER TABLE "players" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE IF EXISTS "players_id_seq";
