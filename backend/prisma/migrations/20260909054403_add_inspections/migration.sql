-- CreateTable
CREATE TABLE "inspections" (
    "inspection_id" TEXT NOT NULL PRIMARY KEY,
    "owner_user_id" TEXT NOT NULL,
    "address_line" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "inspection_date" DATETIME NOT NULL,
    "agents_json" TEXT NOT NULL,
    "overall_notes" TEXT NOT NULL DEFAULT '',
    "checklist_json" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "inspections_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);
