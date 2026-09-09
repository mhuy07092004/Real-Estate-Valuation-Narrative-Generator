-- CreateTable
CREATE TABLE "saved_properties" (
    "saved_property_id" TEXT NOT NULL PRIMARY KEY,
    "owner_user_id" TEXT NOT NULL,
    "address_line" TEXT NOT NULL,
    "property_type" TEXT NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "area_sqm" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "saved_properties_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "saved_properties_owner_user_id_address_line_key" ON "saved_properties"("owner_user_id", "address_line");
