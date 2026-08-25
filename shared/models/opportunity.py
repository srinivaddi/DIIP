from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Opportunity(BaseModel):
    """
    Represents an investable stock option mapped to a specific theme.
    """
    id: Optional[str] = Field(default=None, description="Unique identifier for the opportunity")
    ticker: str = Field(..., description="Stock ticker symbol, e.g., 'NVDA'")
    company_name: str = Field(..., description="Name of the company")
    theme_id: str = Field(..., description="Reference ID of the mapped theme")
    exposure_type: str = Field(..., description="Pure-Play / Value-Chain / Derivative")
    exposure_logic: str = Field(..., description="Detailed explanation of why the company maps to the theme")
    exposure_score: float = Field(..., ge=0.0, le=100.0, description="Thematic exposure score (0 to 100)")
    conviction_score: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="Calculated conviction score")
    rank: Optional[int] = Field(default=None, description="Rank priority leaderboard index")
    action_recommendation: str = Field(default="Hold", description="Strong Buy / Buy / Hold / Sell")
    asset_class: str = Field(default="Equity", description="Equity / ETF / Mutual Fund")
    source: str = Field(default="Simulated", description="Data source (Live vs. Simulated)")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "ticker": "VRT",
                "company_name": "Vertiv Holdings Co",
                "theme_id": "theme_123",
                "exposure_type": "Value-Chain",
                "exposure_logic": "Provides cooling products essential for AI datacenters.",
                "exposure_score": 85.0,
                "conviction_score": 88.4,
                "rank": 2,
                "action_recommendation": "Buy"
            }
        }
