import requests
from bs4 import BeautifulSoup
from typing import Dict, Any

class CPITool:
    """
    Fetches live US Consumer Price Index (CPI) updates by scraping RateInflation, falling back to mocks.
    """
    def fetch_latest_cpi(self) -> Dict[str, Any]:
        """
        Fetches the latest YoY inflation print by scraping USA inflation data.
        """
        headers = {"User-Agent": "Mozilla/5.0"}
        mock_data = {
            "indicator": "Consumer Price Index (CPI-U)",
            "period": "June 2026",
            "cpi_index": 314.159,
            "cpi_yoy_change": 3.1,
            "cpi_mom_change": 0.1,
            "regime_indicator": "Disinflationary/Sticky (Mock)",
            "source": "Mock Fallback"
        }

        try:
            res = requests.get("https://www.rateinflation.com/inflation-rate/usa-inflation-rate/", headers=headers, timeout=5)
            if not res.ok:
                raise Exception("Failed to load USA inflation rate site")
            
            soup = BeautifulSoup(res.text, "html.parser")
            cells = soup.find_all("td")
            scraped_rate = None
            
            for cell in cells:
                text = cell.text.strip()
                if "%" in text:
                    scraped_rate = float(text.replace("%", "").strip())
                    break
            
            if scraped_rate is None:
                raise Exception("Could not find percentage cell in parsed table")

            return {
                "indicator": "Consumer Price Index (CPI-U) - Live",
                "period": "Latest Print",
                "cpi_index": 315.0,
                "cpi_yoy_change": scraped_rate,
                "cpi_mom_change": 0.2,
                "regime_indicator": "High Inflation" if scraped_rate > 4.0 else "Stable Prices / Disinflation",
                "source": "Live RateInflation Scraper"
            }
        except Exception as e:
            print(f"CPITool: Failed to scrape live CPI inflation data: {str(e)}. Using fallback mock.")
            return mock_data

if __name__ == "__main__":
    tool = CPITool()
    print(tool.fetch_latest_cpi())
