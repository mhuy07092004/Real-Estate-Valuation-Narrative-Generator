from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class ComparableItem(BaseModel):
    address: str
    sale_price: int
    sale_date: str
    distance_km: float
    match_score_pct: int
    bedrooms: int
    bathrooms: int
    parking: int
    land_size_sqm: int


class ComparablesResponse(BaseModel):
    subject_address: str
    comparables: list[ComparableItem]
    estimated_value_low: Optional[int] = None
    estimated_value_high: Optional[int] = None


class MarketIntelligenceResponse(BaseModel):
    suburb: str
    median_house_price: Optional[int]
    growth_12_month_pct: Optional[float]
    rental_yield_pct: Optional[float]
    days_on_market: Optional[int]
    stock_on_market: Optional[int]
    ai_market_narrative: Optional[str]
    data_completeness: Literal["full", "partial"]


class AnalyzeRequest(BaseModel):
    address: str
    property_type: str
    bedrooms: int
    bathrooms: int
    parking: int
    land_size_sqm: int
    zoning: str


class AnalyzeResponse(BaseModel):
    location_quality_score: int
    property_condition_score: int
    market_demand_score: int
    growth_potential_score: int
    ai_summary_text: str
    model_version: str


class NarrativeRequest(BaseModel):
    property_id: str
    address: str
    template_type: Literal[
        "vendor_appraisal",
        "bank_valuation",
        "buyer_advisory",
        "investment_report",
    ]
    buyer_purpose: Literal["family", "personal", "investment"]


class NarrativeResponse(BaseModel):
    narrative_text: str
    estimated_value_low: int
    estimated_value_high: int
    confidence_score_pct: int
    flagged: bool
    model_version: str
    rag_index_version: str
    unsupported_claims: Optional[list[str]] = None