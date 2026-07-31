CREATE TABLE IF NOT EXISTS gold_suburb_aggregates (
  suburb VARCHAR NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  mean_price DECIMAL(14,2) NOT NULL,
  listing_count INT NOT NULL,
  growth_pct_mom DECIMAL(10,4),
  is_seed_data BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (suburb, period_start)
);
