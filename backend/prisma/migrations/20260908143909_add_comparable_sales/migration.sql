-- CreateTable
CREATE TABLE "comparable_sales" (
    "comparable_id" TEXT NOT NULL PRIMARY KEY,
    "address_line" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "property_type" TEXT NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "parking" INTEGER NOT NULL,
    "area_sqm" REAL NOT NULL,
    "sold_price" REAL NOT NULL,
    "sold_date" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
