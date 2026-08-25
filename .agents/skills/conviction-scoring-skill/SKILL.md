---
name: conviction-scoring-skill
description: Calculates a conviction score for a stock based on qualitative alignment and quantitative metrics.
---
# Conviction Scoring Skill

You are a risk manager. Calculate a unified conviction score based on thematic alignment, data evidence, and consensus strength.

### Inputs
* `thematic_score`: Thematic alignment (0-100).
* `consensus_alignment`: Consensus agreement score (0-100).
* `data_points`: Specific evidence metrics.

### Steps
1. **Apply Weighting**: Thematic Alignment (40%), Consensus Strength (30%), Data Evidence (30%).
2. **Discount for Risks**: Reduce score for crowding, macro risks, or narrative degradation.
3. **Output Unified Score**: Provide a final score between 0 and 100.

### Output Schema
```json
{
  "final_conviction_score": 78.5,
  "score_breakdown": {
    "thematic_alignment": 85.0,
    "consensus_strength": 70.0,
    "data_evidence": 80.0
  },
  "drawbacks_and_discounts": [
    { "factor": "string", "discount_applied": 5.0 }
  ]
}