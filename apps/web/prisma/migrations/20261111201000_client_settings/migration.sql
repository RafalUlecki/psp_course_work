-- CreateTable
CREATE TABLE "client_settings" (
    "client_id" TEXT NOT NULL,
    "default_last_n" INTEGER NOT NULL,

    CONSTRAINT "client_settings_pkey" PRIMARY KEY ("client_id")
);

-- AddForeignKey
ALTER TABLE "client_settings" ADD CONSTRAINT "client_settings_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
