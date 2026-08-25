import os
import sys

# Adjust path to import packages from root and .agents
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
sys.path.append(ROOT_DIR)
sys.path.append(os.path.join(ROOT_DIR, ".agents"))

import pytest
from agents.research_agent.tools.blackrock_scraper import BlackRockScraper

# Test Scraper Agent's ability to fetch and structure reports from different desks
def test_morgan_stanley_thematic_extraction():
    scraper = BlackRockScraper()
    result = scraper.fetch_latest_commentary(institution="Morgan Stanley")
    
    assert "source" in result
    assert "title" in result
    assert "content" in result
    assert len(result["content"]) > 0

def test_vanguard_thematic_extraction():
    scraper = BlackRockScraper()
    result = scraper.fetch_latest_commentary(institution="Vanguard")
    
    assert "source" in result
    assert "title" in result
    assert "content" in result
    assert len(result["content"]) > 0

def test_fidelity_thematic_extraction():
    scraper = BlackRockScraper()
    result = scraper.fetch_latest_commentary(institution="Fidelity")
    
    assert "source" in result
    assert "title" in result
    assert "content" in result
    assert len(result["content"]) > 0
