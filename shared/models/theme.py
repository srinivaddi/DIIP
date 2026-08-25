from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Theme(BaseModel):
    """
    Represents an investment theme extracted from institutional research.
    """
    id: Optional[str] = Field(default=None, description="Unique identifier for the theme")
    name: str = Field(..., description="Name of the theme, e.g., 'AI Infrastructure'")
    description: str = Field(..., description="Core thesis and description of the theme")
    sentiment: str = Field(default="Neutral", description="Bullish / Neutral / Bearish sentiment")
    horizon: str = Field(default="Medium-term", description="Short-term / Medium-term / Long-term")
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0, description="Confidence of the theme extraction (0.0 to 1.0)")
    supporting_quotes: List[str] = Field(default_factory=list, description="Verbatim quotes from reports supporting this theme")
    sources: List[str] = Field(default_factory=list, description="Institutions recommending this theme (e.g., BlackRock, J.P. Morgan)")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "name": "AI Infrastructure",
                "description": "Accelerating demand for datacenters, high-performance compute, and power grid utilities.",
                "sentiment": "Bullish",
                "horizon": "Long-term",
                "confidence_score": 0.92,
                "supporting_quotes": ["We are increasing our overweight in AI infrastructure..."],
                "sources": ["BlackRock", "Goldman Sachs"]
            }
        }
