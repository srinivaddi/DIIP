from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class AssetAllocation(BaseModel):
    ticker: str = Field(..., description="Stock ticker symbol")
    allocation_rationale: str = Field(..., description="Why this stock is selected for the thesis")
    weight: Optional[float] = Field(default=None, description="Suggested portfolio weighting percentage")

class Thesis(BaseModel):
    """
    Represents a synthesized analyst-grade investment thesis memo.
    """
    id: Optional[str] = Field(default=None, description="Unique identifier for the thesis")
    title: str = Field(..., description="Title of the investment thesis memo")
    theme_id: str = Field(..., description="Reference ID of the underlying investment theme")
    executive_summary: str = Field(..., description="High-level summary of the thesis")
    detailed_markdown: str = Field(..., description="Full analyst-grade thesis in markdown format")
    selected_assets: List[AssetAllocation] = Field(default_factory=list, description="Target asset allocations and rationales")
    conviction_score: float = Field(..., ge=0.0, le=100.0, description="Overall conviction score (0 to 100)")
    key_risks: List[str] = Field(default_factory=list, description="Key risks identified for this investment thesis")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "title": "AI Power Grid Transition Thesis",
                "theme_id": "theme_123",
                "executive_summary": "Grid infrastructure providers face a major catalyst due to datacenter power demands.",
                "detailed_markdown": "# Thesis Details...",
                "selected_assets": [
                    {"ticker": "VRT", "allocation_rationale": "Leading datacenter cooling provider", "weight": 8.5}
                ],
                "conviction_score": 88.5,
                "key_risks": ["Valuation expansion", "AI spend slowdown"]
            }
        }
