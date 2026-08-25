from typing import List, Dict, Any

class NewsFetcher:
    """
    Fetches latest financial news articles and SEC RSS feeds for targeted stocks.
    """
    def fetch_latest_news(self, tickers: List[str]) -> List[Dict[str, Any]]:
        """
        Simulates fetching headlines and content body for target ticker lists.
        """
        # Mock articles database
        mock_articles = [
            {
                "ticker": "NVDA",
                "source": "Bloomberg",
                "headline": "Nvidia faces new export caps on advanced H20 chips to Asia markets",
                "content": "Government officials are contemplating adding new guidelines restricting specialized semiconductor exports.",
                "date": "2026-07-28"
            },
            {
                "ticker": "VRT",
                "source": "Reuters",
                "headline": "Vertiv expands coolant manufacturing facility in Europe to support AI demand",
                "content": "Vertiv announced expansion plans for its cooling technology centers to support datacenters.",
                "date": "2026-07-29"
            }
        ]
        
        return [a for a in mock_articles if a["ticker"] in tickers]

if __name__ == "__main__":
    fetcher = NewsFetcher()
    print(fetcher.fetch_latest_news(["NVDA", "VRT"]))
