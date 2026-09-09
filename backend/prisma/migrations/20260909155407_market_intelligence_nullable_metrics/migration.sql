-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_market_intelligence" (
    "market_id" TEXT NOT NULL PRIMARY KEY,
    "suburb" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "median_price" REAL NOT NULL,
    "median_price_growth_pct" REAL NOT NULL,
    "monthly_growth_pct" REAL NOT NULL,
    "monthly_growth_trend_pp" REAL NOT NULL,
    "days_on_market" INTEGER,
    "days_on_market_trend_days" INTEGER,
    "rental_yield_pct" REAL,
    "rental_yield_trend_pct" REAL,
    "price_trend_json" TEXT NOT NULL,
    "as_of_month" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_market_intelligence" ("as_of_month", "created_at", "days_on_market", "days_on_market_trend_days", "market_id", "median_price", "median_price_growth_pct", "monthly_growth_pct", "monthly_growth_trend_pp", "price_trend_json", "rental_yield_pct", "rental_yield_trend_pct", "state", "suburb") SELECT "as_of_month", "created_at", "days_on_market", "days_on_market_trend_days", "market_id", "median_price", "median_price_growth_pct", "monthly_growth_pct", "monthly_growth_trend_pp", "price_trend_json", "rental_yield_pct", "rental_yield_trend_pct", "state", "suburb" FROM "market_intelligence";
DROP TABLE "market_intelligence";
ALTER TABLE "new_market_intelligence" RENAME TO "market_intelligence";
CREATE UNIQUE INDEX "market_intelligence_suburb_state_key" ON "market_intelligence"("suburb", "state");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
