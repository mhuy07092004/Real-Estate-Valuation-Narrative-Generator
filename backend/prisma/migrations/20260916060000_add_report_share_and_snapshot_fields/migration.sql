-- AlterTable
ALTER TABLE "reports" ADD COLUMN "price_range_low" REAL;
ALTER TABLE "reports" ADD COLUMN "price_range_high" REAL;
ALTER TABLE "reports" ADD COLUMN "sections_json" TEXT;
ALTER TABLE "reports" ADD COLUMN "comparables_json" TEXT;
ALTER TABLE "reports" ADD COLUMN "strategy_cards_json" TEXT;
ALTER TABLE "reports" ADD COLUMN "share_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "reports_share_token_key" ON "reports"("share_token");
