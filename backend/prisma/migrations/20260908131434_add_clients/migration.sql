-- CreateTable
CREATE TABLE "clients" (
    "client_id" TEXT NOT NULL PRIMARY KEY,
    "owner_user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'prospecting',
    "notes" TEXT,
    "address_line" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "clients_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_owner_user_id_email_key" ON "clients"("owner_user_id", "email");
