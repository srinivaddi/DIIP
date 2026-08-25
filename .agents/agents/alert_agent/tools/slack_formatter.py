from typing import Dict, Any

class SlackFormatter:
    """
    Formats institutional research alerts and narrative changes into Slack Block Kit payloads.
    """
    def format_blocks(self, alert_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Builds Slack interactive messages structure.
        """
        ticker = alert_data.get("ticker", "Global Macro")
        headline = alert_data.get("headline", "Narrative Update")
        category = alert_data.get("category", "General Update")
        severity = alert_data.get("severity_level", "Medium")
        action = alert_data.get("action_recommended", "Monitor")

        icon = "🚨" if severity == "High" else "⚠️"

        return {
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": f"{icon} DIIP System Alert: {category}"
                    }
                },
                {
                    "type": "section",
                    "fields": [
                        {"type": "mrkdwn", "text": f"*Asset:* `{ticker}`"},
                        {"type": "mrkdwn", "text": f"*Severity:* `{severity}`"}
                    ]
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Details:* {headline}"
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Recommended Action:* *{action}*"
                    }
                }
            ]
        }

if __name__ == "__main__":
    formatter = SlackFormatter()
    test_alert = {"ticker": "NVDA", "headline": "Export caps restriction on H20 chips", "category": "Regulatory Risk", "severity_level": "High"}
    import pprint
    pprint.pprint(formatter.format_blocks(test_alert))
