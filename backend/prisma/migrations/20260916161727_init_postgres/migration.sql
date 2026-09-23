-- CreateTable
CREATE TABLE "roles" (
    "role_id" SERIAL NOT NULL,
    "role_name" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "password_hash" TEXT,
    "auth_provider" TEXT NOT NULL DEFAULT 'local',
    "role_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "clients" (
    "client_id" TEXT NOT NULL,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("client_id")
);

-- CreateTable
CREATE TABLE "properties" (
    "property_id" TEXT NOT NULL,
    "address_line" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "property_type" TEXT NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "parking" INTEGER NOT NULL,
    "area_sqm" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("property_id")
);

-- CreateTable
CREATE TABLE "comparable_sales" (
    "comparable_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "sold_price" DOUBLE PRECISION NOT NULL,
    "sold_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comparable_sales_pkey" PRIMARY KEY ("comparable_id")
);

-- CreateTable
CREATE TABLE "saved_properties" (
    "saved_property_id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "address_line" TEXT NOT NULL,
    "property_type" TEXT NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "area_sqm" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_properties_pkey" PRIMARY KEY ("saved_property_id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "inspection_id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "address_line" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "inspection_date" TIMESTAMP(3) NOT NULL,
    "agents_json" TEXT NOT NULL,
    "overall_notes" TEXT NOT NULL DEFAULT '',
    "checklist_json" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("inspection_id")
);

-- CreateTable
CREATE TABLE "market_intelligence" (
    "market_id" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "median_price" DOUBLE PRECISION NOT NULL,
    "median_price_growth_pct" DOUBLE PRECISION NOT NULL,
    "monthly_growth_pct" DOUBLE PRECISION NOT NULL,
    "monthly_growth_trend_pp" DOUBLE PRECISION NOT NULL,
    "days_on_market" INTEGER,
    "days_on_market_trend_days" INTEGER,
    "rental_yield_pct" DOUBLE PRECISION,
    "rental_yield_trend_pct" DOUBLE PRECISION,
    "auction_clearance_rate_pct" DOUBLE PRECISION,
    "vacancy_rate_pct" DOUBLE PRECISION,
    "population_growth_pct" DOUBLE PRECISION,
    "supply_constraint_dwelling_approvals_per_1000" DOUBLE PRECISION,
    "median_house_price" DOUBLE PRECISION,
    "median_unit_price" DOUBLE PRECISION,
    "price_trend_json" TEXT NOT NULL,
    "as_of_month" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_intelligence_pkey" PRIMARY KEY ("market_id")
);

-- CreateTable
CREATE TABLE "reports" (
    "report_id" TEXT NOT NULL,
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
    "land_size_sqm" DOUBLE PRECISION NOT NULL,
    "report_template_id" TEXT NOT NULL,
    "estimated_value" DOUBLE PRECISION NOT NULL,
    "narrative_text" TEXT NOT NULL,
    "pdf_storage_path" TEXT,
    "case_status" TEXT,
    "confidence" DOUBLE PRECISION,
    "roi_gross_yield_pct" DOUBLE PRECISION,
    "roi_net_yield_pct" DOUBLE PRECISION,
    "roi_monthly_cash_flow" DOUBLE PRECISION,
    "roi_cash_on_cash_return_pct" DOUBLE PRECISION,
    "affordability_estimated_borrowing_capacity" DOUBLE PRECISION,
    "affordability_max_loan_amount" DOUBLE PRECISION,
    "affordability_repayment_to_income_pct" DOUBLE PRECISION,
    "price_range_low" DOUBLE PRECISION,
    "price_range_high" DOUBLE PRECISION,
    "sections_json" TEXT,
    "comparables_json" TEXT,
    "strategy_cards_json" TEXT,
    "share_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("report_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clients_owner_user_id_email_key" ON "clients"("owner_user_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "saved_properties_owner_user_id_address_line_key" ON "saved_properties"("owner_user_id", "address_line");

-- CreateIndex
CREATE UNIQUE INDEX "market_intelligence_suburb_state_key" ON "market_intelligence"("suburb", "state");

-- CreateIndex
CREATE UNIQUE INDEX "reports_share_token_key" ON "reports"("share_token");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparable_sales" ADD CONSTRAINT "comparable_sales_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("property_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_properties" ADD CONSTRAINT "saved_properties_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE SET NULL ON UPDATE CASCADE;
