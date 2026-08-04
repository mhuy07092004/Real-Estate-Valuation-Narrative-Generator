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
    "property_type" TEXT NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "parking" INTEGER NOT NULL,
    "land_size_sqm" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "clients_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "land_size_sqm" REAL NOT NULL,
    "sold_price" REAL NOT NULL,
    "sold_date" DATETIME NOT NULL,
    "data_source" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "market_intelligence" (
    "market_id" TEXT NOT NULL PRIMARY KEY,
    "suburb" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "mean_house_price" REAL NOT NULL,
    "month_growth_pct" REAL NOT NULL,
    "rental_yield_pct" REAL NOT NULL,
    "buyer_interest_level" TEXT NOT NULL,
    "supply_level" TEXT NOT NULL,
    "price_growth_level" TEXT NOT NULL,
    "as_of_month" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "reports" (
    "report_id" TEXT NOT NULL PRIMARY KEY,
    "owner_user_id" TEXT NOT NULL,
    "client_id" TEXT,
    "property_address_line" TEXT NOT NULL,
    "property_suburb" TEXT NOT NULL,
    "property_state" TEXT NOT NULL,
    "property_postcode" TEXT NOT NULL,
    "property_type" TEXT NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "parking" INTEGER NOT NULL,
    "land_size_sqm" REAL NOT NULL,
    "estimated_value" REAL NOT NULL,
    "selected_comparable_id" TEXT,
    "selected_comparable_address" TEXT,
    "selected_comparable_sold_price" REAL,
    "selected_comparable_sold_date" DATETIME,
    "market_suburb" TEXT,
    "market_mean_house_price" REAL,
    "market_month_growth_pct" REAL,
    "market_rental_yield_pct" REAL,
    "market_buyer_interest_level" TEXT,
    "market_supply_level" TEXT,
    "market_price_growth_level" TEXT,
    "narrative_text" TEXT NOT NULL,
    "pdf_storage_path" TEXT,
    "pdf_generated_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "reports_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reports_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("client_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "reports_selected_comparable_id_fkey" FOREIGN KEY ("selected_comparable_id") REFERENCES "comparable_sales" ("comparable_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "saved_property_searches" (
    "saved_property_id" TEXT NOT NULL PRIMARY KEY,
    "owner_user_id" TEXT NOT NULL,
    "label" TEXT,
    "address_line" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "property_type" TEXT NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "parking" INTEGER NOT NULL,
    "land_size_sqm" REAL NOT NULL,
    "sold_date_from" DATETIME,
    "sold_date_to" DATETIME,
    "filter_property_type" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "saved_property_searches_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_email_key" ON "clients"("email");
