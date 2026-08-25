# on_demand_ingestion_workflow Orchestrator
import os
import sys
from typing import Dict, Any

# Adjust search path to allow root-level and .agents imports
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
sys.path.append(ROOT_DIR)
sys.path.append(os.path.join(ROOT_DIR, ".agents"))

from shared.utils.skills_engine import SkillsEngine
from shared.models.theme import Theme
from agents.research_agent.tools.blackrock_scraper import BlackRockScraper

def run(inputs: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes the On-Demand Ingestion Workflow:
    1. Fetches/receives a raw document.
    2. Cleans and structures the text (Research Ingestion Skill).
    3. Extracts investment themes (Theme Extraction Skill).
    4. Saves/returns the structured Pydantic Theme outputs.
    """
    print("Starting On-Demand Ingestion Workflow...")
    
    # 1. Fetch raw research content (use inputs if provided, else scrape latest BlackRock report)
    if "raw_document" in inputs:
        raw_doc = inputs["raw_document"]
        metadata = inputs.get("metadata", {"source": "User Upload"})
    else:
        inst = inputs.get("metadata", {}).get("institution", "BlackRock")
        print(f"No raw document supplied. Scraped latest commentary for {inst}...")
        scraper = BlackRockScraper()
        scraped_data = scraper.fetch_latest_commentary(inst)
        raw_doc = scraped_data["content"]
        metadata = {
            "institution": scraped_data["source"],
            "title": scraped_data["title"],
            "date": scraped_data["publish_date"],
            "url": scraped_data["url"]
        }

    # Initialize Skills Engine
    engine = SkillsEngine()

    # 2. Run Research Ingestion Skill to structure text
    print("Executing research-ingestion-skill...")
    ingestion_result = engine.execute_skill(
        skill_name="research-ingestion-skill",
        inputs={
            "raw_document": raw_doc,
            "source_metadata": metadata
        }
    )
    cleaned_md = ingestion_result.get("cleaned_markdown", raw_doc)
    extracted_meta = ingestion_result.get("metadata", metadata)

    # 3. Run Theme Extraction Skill on cleaned markdown
    print("Executing theme-extraction-skill...")
    extraction_result = engine.execute_skill(
        skill_name="theme-extraction-skill",
        inputs={"document_text": cleaned_md}
    )

    # 4. Map outputs to standardized Theme models
    themes_list = []
    extracted_themes = extraction_result.get("themes", [])
    
    print(f"Extracted {len(extracted_themes)} themes. Instantiating models...")
    for theme_data in extracted_themes:
        theme = Theme(
            name=theme_data.get("name", "Unknown Theme"),
            description=theme_data.get("thesis", "No thesis provided."),
            sentiment=theme_data.get("sentiment", "Neutral"),
            horizon=theme_data.get("horizon", "Medium-term"),
            confidence_score=0.90, # default/parsed confidence
            supporting_quotes=theme_data.get("supporting_quotes", []),
            sources=[extracted_meta.get("institution", "Unknown")]
        )
        themes_list.append(theme)
        print(f"Successfully processed Theme model: {theme.name} ({theme.sentiment})")

    is_fallback = ingestion_result.get("is_fallback", False) or extraction_result.get("is_fallback", False)

    return {
        "status": "success",
        "ingested_metadata": extracted_meta,
        "themes": [t.dict() for t in themes_list],
        "is_fallback": is_fallback
    }

if __name__ == "__main__":
    result = run({})
    print("\nWorkflow Execution Output:")
    import pprint
    pprint.pprint(result)
