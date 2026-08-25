from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

class ScoreBreakdown(BaseModel):
    thematic_alignment: float = Field(..., ge=0.0, le=100.0, description="Alignment score with theme")
    consensus_strength: float = Field(..., ge=0.0, le=100.0, description="Wall Street consensus agreement strength")
    data_evidence: float = Field(..., ge=0.0, le=100.0, description="Fundamental and quantitative backing")

class DiscountFactor(BaseModel):
    factor: str = Field(..., description="Risk or detractor factor (e.g., Crowding)")
    discount_applied: float = Field(..., description="Points subtracted from conviction score")

class Conviction(BaseModel):
    """
    Represents the quantitative conviction metrics calculated for an asset.
    """
    id: Optional[str] = Field(default=None, description="Unique identifier for conviction record")
    ticker: str = Field(..., description="Stock ticker symbol")
    final_conviction_score: float = Field(..., ge=0.0, le=100.0, description="Overall conviction score (0 to 100)")
    score_breakdown: ScoreBreakdown = Field(..., description="Breakdown of components contributing to conviction")
    drawbacks_and_discounts: List[DiscountFactor] = Field(default_factory=list, description="List of risk discounts applied")
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "ticker": "AVGO",
                "final_conviction_score": 78.5,
                "score_breakdown": {
                    "thematic_alignment": 85.0,
                    "consensus_strength": 70.0,
                    "data_evidence": 80.0
                },
                "drawbacks_and_discounts": [
                    {"factor": "Options Crowding", "discount_applied": 5.0}
                ]
            }
        }
