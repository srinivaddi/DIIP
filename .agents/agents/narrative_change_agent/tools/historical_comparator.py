from typing import Dict, Any, List
from shared.utils.skills_engine import SkillsEngine

class HistoricalComparator:
    """
    Detects inflection points and velocity of narrative changes over time.
    """
    def __init__(self):
        self.skills_engine = SkillsEngine()

    def detect_changes(self, current_consensus: Dict[str, Any], historical_consensus: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Executes narrative-change-detection-skill to look for upgrades/downgrades.
        """
        inputs = {
            "current_consensus": current_consensus,
            "historical_consensus_history": historical_consensus
        }

        # Query narrative change skill
        result = self.skills_engine.execute_skill(
            skill_name="narrative-change-detection-skill",
            inputs=inputs
        )

        # Build output structure
        return {
            "change_detected": result.get("narrative_shift_detected", False),
            "old_narrative": result.get("old_narrative", "Traditional compute hardware bottlenecks"),
            "new_narrative": result.get("new_narrative", "Power utility and physical cooling grid bottlenecks"),
            "inflection_point": result.get("inflection_point", "2026-07-27 Report"),
            "shift_velocity": result.get("shift_velocity", "Moderate")
        }

if __name__ == "__main__":
    comparator = HistoricalComparator()
    print(comparator.detect_changes({}, []))
