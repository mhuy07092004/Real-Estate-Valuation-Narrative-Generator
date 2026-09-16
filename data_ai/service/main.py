"""FastAPI price-prediction service.

Matches the contract backend/src/services/price-prediction.service.ts already
calls: POST / with PricePredictionInput -> {"predictedPrice": number}. Loads
the RandomForest model and preprocessing state produced by
data_ai/model/train_price_model.py and reproduces that script's exact
feature-building steps (postcode -> suburb stats lookup, parking imputation,
property-type one-hot encoding) for a single live request.

Usage: uvicorn main:app --host 0.0.0.0 --port 8000
Env vars:
  MODEL_DIR       Directory containing price_model.joblib and
                   preprocessing.joblib (default: ../model relative to this file)
  ML_API_KEY      If set, requests must send "Authorization: Bearer <key>"
                   matching this value (mirrors backend's
                   ML_PRICE_PREDICTION_API_KEY). If unset, no auth is required
                   — fine for a private network, not for a public endpoint.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

MODEL_DIR = Path(os.environ.get("MODEL_DIR", Path(__file__).resolve().parent.parent / "model"))
API_KEY = os.environ.get("ML_API_KEY", "")

# Same normalization vocabulary as train_price_model.py — if a caller sends a
# propertyType outside this set, we fall back to "House" (the overwhelming
# majority class in training data, ~96% of clean rows) rather than reject
# the request, since a rough estimate beats a hard failure for this endpoint.
KNOWN_PROPERTY_TYPES = {"House", "Townhouse", "Villa", "Apartment", "Unit"}
DEFAULT_PROPERTY_TYPE = "House"

app = FastAPI(title="Relaive Price Prediction Service")

model = None
preprocessing = None


@app.on_event("startup")
def load_artifacts() -> None:
    global model, preprocessing
    model = joblib.load(MODEL_DIR / "price_model.joblib")
    preprocessing = joblib.load(MODEL_DIR / "preprocessing.joblib")


class PricePredictionInput(BaseModel):
    suburb: str
    state: str
    postcode: str
    propertyType: Optional[str] = None
    bedrooms: float = Field(..., description="Required — no training-time fallback for this feature")
    bathrooms: float = Field(..., description="Required — no training-time fallback for this feature")
    landSizeSqm: float = Field(..., description="Required — no training-time fallback for this feature")
    parking: Optional[float] = None


class PricePredictionOutput(BaseModel):
    predictedPrice: float


def require_api_key(authorization: Optional[str]) -> None:
    if not API_KEY:
        return
    expected = f"Bearer {API_KEY}"
    if authorization != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


def resolve_suburb_stats(suburb: str, state: str, postcode: str, property_type: str) -> dict[str, float]:
    category = preprocessing["category_map"].get(property_type, "House")
    suburb_agg = preprocessing["suburb_agg"]
    match = suburb_agg[(suburb_agg["postcode"] == postcode) & (suburb_agg["property_category"] == category)]

    if match.empty:
        return dict(preprocessing["fallback_medians"])

    row = match.iloc[0]
    stats = {col: row[col] for col in preprocessing["market_cols"]}
    # A postcode can be in suburb_agg but still have NaN for a specific stat
    # (see build_suburb_agg's zero-as-missing handling) — fall back per-column.
    for col, value in stats.items():
        if pd.isna(value):
            stats[col] = preprocessing["fallback_medians"][col]
    return stats


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/", response_model=PricePredictionOutput)
@app.post("/predict", response_model=PricePredictionOutput)
def predict(input: PricePredictionInput, authorization: Optional[str] = Header(None)) -> PricePredictionOutput:
    require_api_key(authorization)

    property_type = input.propertyType if input.propertyType in KNOWN_PROPERTY_TYPES else DEFAULT_PROPERTY_TYPE

    parking = input.parking
    if parking is None:
        parking = preprocessing["parking_medians"].get(
            property_type, np.mean(list(preprocessing["parking_medians"].values()))
        )

    now = datetime.now(timezone.utc)
    suburb_stats = resolve_suburb_stats(input.suburb, input.state, input.postcode, property_type)

    row = {
        "bedrooms": input.bedrooms,
        "bathrooms": input.bathrooms,
        "parking": parking,
        "land_size_sqm": input.landSizeSqm,
        "sold_year": now.year,
        "sold_month": now.month,
        **suburb_stats,
    }
    numeric_df = pd.DataFrame([row])[preprocessing["numeric_features"]]

    encoder = preprocessing["encoder"]
    type_df = pd.DataFrame({"property_type_clean": [property_type]})
    encoded = pd.DataFrame(
        encoder.transform(type_df),
        columns=encoder.get_feature_names_out(["property_type_clean"]),
    )

    features = pd.concat([numeric_df.reset_index(drop=True), encoded.reset_index(drop=True)], axis=1)
    predicted_log_price = model.predict(features)[0]
    predicted_price = float(np.expm1(predicted_log_price))

    return PricePredictionOutput(predictedPrice=predicted_price)
