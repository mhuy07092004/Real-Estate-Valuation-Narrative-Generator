/*
  Warnings:

  - You are about to drop the column `address_line` on the `comparable_sales` table. All the data in the column will be lost.
  - You are about to drop the column `area_sqm` on the `comparable_sales` table. All the data in the column will be lost.
  - You are about to drop the column `bathrooms` on the `comparable_sales` table. All the data in the column will be lost.
  - You are about to drop the column `bedrooms` on the `comparable_sales` table. All the data in the column will be lost.
  - You are about to drop the column `parking` on the `comparable_sales` table. All the data in the column will be lost.
  - You are about to drop the column `postcode` on the `comparable_sales` table. All the data in the column will be lost.
  - You are about to drop the column `property_type` on the `comparable_sales` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `comparable_sales` table. All the data in the column will be lost.
  - You are about to drop the column `suburb` on the `comparable_sales` table. All the data in the column will be lost.
  - Added the required column `property_id` to the `comparable_sales` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "properties" (
    "property_id" TEXT NOT NULL PRIMARY KEY,
    "address_line" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "property_type" TEXT NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "parking" INTEGER NOT NULL,
    "area_sqm" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_comparable_sales" (
    "comparable_id" TEXT NOT NULL PRIMARY KEY,
    "property_id" TEXT NOT NULL,
    "sold_price" REAL NOT NULL,
    "sold_date" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "comparable_sales_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties" ("property_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_comparable_sales" ("comparable_id", "created_at", "sold_date", "sold_price") SELECT "comparable_id", "created_at", "sold_date", "sold_price" FROM "comparable_sales";
DROP TABLE "comparable_sales";
ALTER TABLE "new_comparable_sales" RENAME TO "comparable_sales";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
