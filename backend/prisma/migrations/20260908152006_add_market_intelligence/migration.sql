-- CreateTable
CREATE TABLE "market_intelligence" (
    "market_id" TEXT NOT NULL PRIMARY KEY,
    "suburb" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "median_price" REAL NOT NULL,
    "median_price_growth_pct" REAL NOT NULL,
    "monthly_growth_pct" REAL NOT NULL,
    "monthly_growth_trend_pp" REAL NOT NULL,
    "days_on_market" INTEGER NOT NULL,
    "days_on_market_trend_days" INTEGER NOT NULL,
    "rental_yield_pct" REAL NOT NULL,
    "rental_yield_trend_pct" REAL NOT NULL,
    "price_trend_json" TEXT NOT NULL,
    "as_of_month" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "market_intelligence_suburb_state_key" ON "market_intelligence"("suburb", "state");
