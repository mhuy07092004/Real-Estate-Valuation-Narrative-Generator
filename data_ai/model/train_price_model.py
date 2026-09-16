"""Trains the property price prediction RandomForest model and saves the two
artifacts the FastAPI serving layer needs: the fitted model, and the fitted
preprocessing state (postcode lookup, suburb market-stat aggregates, parking
medians, suburb-stat fallback medians, and the property-type one-hot encoder).

Reproduces the pipeline validated in notebooks/price_prediction_model.ipynb —
same cleaning rules, same postcode lookup, same time-based train/test split
(so imputation statistics are fit on train only, matching the notebook's
leakage-avoidance discipline), same feature set. Final hyperparameters
(n_estimators=200, max_depth=10) were chosen there by comparing against a
naive-median baseline, Linear Regression, and GradientBoosting, then a 3x2
grid search over n_estimators x max_depth.

Usage: python train_price_model.py
Output: data_ai/model/price_model.joblib, data_ai/model/preprocessing.joblib
"""

from __future__ import annotations

import re
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import OneHotEncoder

DATA_AI_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = Path(__file__).resolve().parent
POSTCODE_LOOKUP_URL = "https://raw.githubusercontent.com/Elkfox/Australian-Postcode-Data/master/au_postcodes.csv"

N_ESTIMATORS = 200
MAX_DEPTH = 10
RANDOM_STATE = 42

PROPERTY_TYPE_MAP = [
    (re.compile("townhouse", re.I), "Townhouse"),
    (re.compile("villa", re.I), "Villa"),
    (re.compile("apartment", re.I), "Apartment"),
    (re.compile("unit|flat", re.I), "Unit"),
    (re.compile("house", re.I), "House"),
]

MONTH_NUMBERS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}

SOLD_DATE_RE = re.compile(
    r"(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})", re.I
)

# bronze's 5-way property_type_clean doesn't match domain's 2-category
# vocabulary (House / Unit only) — map onto the closest equivalent for the join.
CATEGORY_MAP = {
    "House": "House",
    "Townhouse": "House",
    "Villa": "House",
    "Apartment": "Unit",
    "Unit": "Unit",
}

MARKET_COLS = [
    "suburb_median_price",
    "suburb_days_on_market",
    "suburb_auction_clearance_pct",
    "suburb_rental_yield_pct",
]
NUMERIC_FEATURES = ["bedrooms", "bathrooms", "parking", "land_size_sqm", "sold_year", "sold_month"] + MARKET_COLS


def normalize_property_type(raw: object) -> str | None:
    if not isinstance(raw, str) or not raw.strip():
        return None
    for pattern, label in PROPERTY_TYPE_MAP:
        if pattern.search(raw):
            return label
    return None


def parse_price(raw: object) -> float | None:
    if not isinstance(raw, str):
        return None
    cleaned = re.sub(r"[^0-9.]", "", raw)
    if not cleaned:
        return None
    value = float(cleaned)
    return value if value > 0 else None


def parse_sold_year(raw: object) -> int | None:
    if not isinstance(raw, str):
        return None
    match = SOLD_DATE_RE.search(raw)
    return int(match.group(3)) if match else None


def parse_sold_month(raw: object) -> int | None:
    if not isinstance(raw, str):
        return None
    match = SOLD_DATE_RE.search(raw)
    return MONTH_NUMBERS[match.group(2)[:3].lower()] if match else None


def load_and_clean_listings() -> pd.DataFrame:
    listings = pd.read_csv(DATA_AI_DIR / "bronze_listings.csv", dtype=str)

    listings["property_type_clean"] = listings["property_type"].apply(normalize_property_type)
    listings["price_clean"] = listings["price"].apply(parse_price)
    listings["sold_year"] = listings["listing_date"].apply(parse_sold_year)
    listings["sold_month"] = listings["listing_date"].apply(parse_sold_month)
    for col in ["bedrooms", "bathrooms", "parking", "land_size_sqm"]:
        listings[col] = pd.to_numeric(listings[col], errors="coerce")

    return listings


def build_postcode_lookup() -> pd.Series:
    raw = pd.read_csv(POSTCODE_LOOKUP_URL, dtype=str)
    raw["place_name"] = raw["place_name"].str.strip().str.lower()
    raw["state_code"] = raw["state_code"].str.strip().str.upper()

    # First match wins, same rule as ingest-bronze-listings.ts's loadPostcodeLookup.
    return (
        raw.dropna(subset=["place_name", "state_code", "postcode"])
        .drop_duplicates(subset=["place_name", "state_code"], keep="first")
        .set_index(["place_name", "state_code"])["postcode"]
    )


def resolve_postcodes(listings: pd.DataFrame, postcode_lookup: pd.Series) -> pd.DataFrame:
    lookup_key = pd.MultiIndex.from_arrays(
        [listings["suburb"].str.strip().str.lower(), listings["state"].str.strip().str.upper()]
    )
    listings["postcode"] = postcode_lookup.reindex(lookup_key).values
    return listings


def clean_listings(listings: pd.DataFrame) -> pd.DataFrame:
    clean = listings.dropna(
        subset=[
            "property_type_clean", "price_clean", "bedrooms", "bathrooms",
            "land_size_sqm", "suburb", "state", "postcode", "sold_year", "sold_month",
        ]
    ).copy()
    # price >= $10,000: drops nominal/non-market transactions (family transfers
    # or data-entry errors), keeps legitimate low-value regional sales.
    return clean[(clean["price_clean"] >= 10_000) & (clean["land_size_sqm"] > 0)]


def build_suburb_agg() -> pd.DataFrame:
    suburb_insights = pd.read_csv(DATA_AI_DIR / "domain_suburb_insights.csv", dtype={"postcode": str})

    # 0 in these columns means "no reliable data for this bedroom bucket", not
    # a real value — treat as missing so .mean() skips it instead of dragging
    # the aggregate toward zero. rental_yield_pct has no zero values.
    for col in ["median_sold_price", "days_on_market", "auction_clearance_rate"]:
        suburb_insights[col] = suburb_insights[col].replace(0, np.nan)

    return (
        suburb_insights.groupby(["postcode", "property_category"])
        .agg(
            suburb_median_price=("median_sold_price", "mean"),
            suburb_days_on_market=("days_on_market", "mean"),
            suburb_auction_clearance_pct=("auction_clearance_rate", "mean"),
            suburb_rental_yield_pct=("rental_yield_pct", "mean"),
        )
        .reset_index()
    )


def merge_suburb_stats(clean: pd.DataFrame, suburb_agg: pd.DataFrame) -> pd.DataFrame:
    clean["property_category_for_join"] = clean["property_type_clean"].map(CATEGORY_MAP)
    return clean.merge(
        suburb_agg,
        left_on=["postcode", "property_category_for_join"],
        right_on=["postcode", "property_category"],
        how="left",
    )


def time_based_split(merged: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    # Sorting by sold_year/sold_month and taking the earliest ~80% as train
    # avoids look-ahead bias — the real deployment scenario predicts a
    # *current* price from *past* sales, not a random mix of both directions.
    merged_sorted = merged.sort_values(["sold_year", "sold_month"], kind="stable").reset_index(drop=True)
    split_idx = int(len(merged_sorted) * 0.8)
    return merged_sorted.iloc[:split_idx].copy(), merged_sorted.iloc[split_idx:].copy()


def impute_parking(train_df: pd.DataFrame, test_df: pd.DataFrame) -> dict[str, float]:
    # Fit per-type median on train only, apply the same fitted values to test —
    # no test-set information leaks into the imputation.
    parking_medians = train_df.groupby("property_type_clean")["parking"].median()
    for df in (train_df, test_df):
        df["parking"] = df.apply(
            lambda row: parking_medians[row["property_type_clean"]] if pd.isna(row["parking"]) else row["parking"],
            axis=1,
        )
    # Plain dict, not a pandas Series — a Series's own .values is a property
    # (an ndarray), not a callable, which would break naive `.values()` calls
    # by consumers of the saved artifact.
    return parking_medians.to_dict()


def impute_suburb_stats(train_df: pd.DataFrame, test_df: pd.DataFrame) -> dict[str, float]:
    fallback_medians = {}
    for col in MARKET_COLS:
        fallback_value = train_df[col].median()
        fallback_medians[col] = fallback_value
        train_df[col] = train_df[col].fillna(fallback_value)
        test_df[col] = test_df[col].fillna(fallback_value)
    return fallback_medians


def encode_property_type(train_df: pd.DataFrame, test_df: pd.DataFrame) -> tuple[OneHotEncoder, pd.DataFrame, pd.DataFrame]:
    encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    encoder.fit(train_df[["property_type_clean"]])

    train_encoded = pd.DataFrame(
        encoder.transform(train_df[["property_type_clean"]]),
        columns=encoder.get_feature_names_out(["property_type_clean"]),
        index=train_df.index,
    )
    test_encoded = pd.DataFrame(
        encoder.transform(test_df[["property_type_clean"]]),
        columns=encoder.get_feature_names_out(["property_type_clean"]),
        index=test_df.index,
    )
    return encoder, train_encoded, test_encoded


def assemble_features(
    train_df: pd.DataFrame, test_df: pd.DataFrame, train_encoded: pd.DataFrame, test_encoded: pd.DataFrame
) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    X_train = pd.concat([train_df[NUMERIC_FEATURES].reset_index(drop=True), train_encoded.reset_index(drop=True)], axis=1)
    X_test = pd.concat([test_df[NUMERIC_FEATURES].reset_index(drop=True), test_encoded.reset_index(drop=True)], axis=1)
    # log1p(price): real-estate prices are right-skewed, so training on the
    # log scale keeps the loss from being dominated by the highest-value
    # properties. Predictions are converted back with expm1 at eval/serve time.
    y_train = np.log1p(train_df["price_clean"]).reset_index(drop=True)
    y_test = np.log1p(test_df["price_clean"]).reset_index(drop=True)
    return X_train, X_test, y_train, y_test


def evaluate(name: str, y_true_log: pd.Series, y_pred_log: np.ndarray) -> None:
    y_true = np.expm1(y_true_log)
    y_pred = np.expm1(y_pred_log)
    mae = mean_absolute_error(y_true, y_pred)
    rmse = mean_squared_error(y_true, y_pred) ** 0.5
    r2 = r2_score(y_true, y_pred)
    print(f"{name:20s}  MAE: ${mae:,.0f}   RMSE: ${rmse:,.0f}   R2: {r2:.3f}")


def main() -> None:
    listings = load_and_clean_listings()
    postcode_lookup = build_postcode_lookup()
    listings = resolve_postcodes(listings, postcode_lookup)
    clean = clean_listings(listings)

    suburb_agg = build_suburb_agg()
    merged = merge_suburb_stats(clean, suburb_agg)

    train_df, test_df = time_based_split(merged)
    parking_medians = impute_parking(train_df, test_df)
    fallback_medians = impute_suburb_stats(train_df, test_df)
    encoder, train_encoded, test_encoded = encode_property_type(train_df, test_df)
    X_train, X_test, y_train, y_test = assemble_features(train_df, test_df, train_encoded, test_encoded)

    model = RandomForestRegressor(
        n_estimators=N_ESTIMATORS, max_depth=MAX_DEPTH, random_state=RANDOM_STATE, n_jobs=-1
    )
    model.fit(X_train, y_train)
    evaluate("RandomForest (final)", y_test, model.predict(X_test))

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_DIR / "price_model.joblib")
    joblib.dump(
        {
            "postcode_lookup": postcode_lookup,
            "suburb_agg": suburb_agg,
            "parking_medians": parking_medians,
            "fallback_medians": fallback_medians,
            "encoder": encoder,
            "category_map": CATEGORY_MAP,
            "numeric_features": NUMERIC_FEATURES,
            "market_cols": MARKET_COLS,
        },
        MODEL_DIR / "preprocessing.joblib",
    )
    print(f"Saved model to {MODEL_DIR / 'price_model.joblib'}")
    print(f"Saved preprocessing state to {MODEL_DIR / 'preprocessing.joblib'}")


if __name__ == "__main__":
    main()
