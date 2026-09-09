/*
  Warnings:

  - Added the required column `role` to the `reports` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_reports" (
    "report_id" TEXT NOT NULL PRIMARY KEY,
    "owner_user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "client_id" TEXT,
    "client_name" TEXT,
    "client_email" TEXT,
    "property_address_line" TEXT NOT NULL,
    "property_suburb" TEXT NOT NULL,
    "property_state" TEXT NOT NULL,
    "property_postcode" TEXT NOT NULL,
    "property_type" TEXT NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "parking" INTEGER NOT NULL,
    "land_size_sqm" REAL NOT NULL,
    "report_template_id" TEXT NOT NULL,
    "estimated_value" REAL NOT NULL,
    "narrative_text" TEXT NOT NULL,
    "pdf_storage_path" TEXT,
    "case_status" TEXT,
    "confidence" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "reports_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reports_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("client_id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_reports" ("bathrooms", "bedrooms", "case_status", "client_email", "client_id", "client_name", "confidence", "created_at", "estimated_value", "land_size_sqm", "narrative_text", "owner_user_id", "parking", "pdf_storage_path", "property_address_line", "property_postcode", "property_state", "property_suburb", "property_type", "report_id", "report_template_id", "updated_at") SELECT "bathrooms", "bedrooms", "case_status", "client_email", "client_id", "client_name", "confidence", "created_at", "estimated_value", "land_size_sqm", "narrative_text", "owner_user_id", "parking", "pdf_storage_path", "property_address_line", "property_postcode", "property_state", "property_suburb", "property_type", "report_id", "report_template_id", "updated_at" FROM "reports";
DROP TABLE "reports";
ALTER TABLE "new_reports" RENAME TO "reports";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
