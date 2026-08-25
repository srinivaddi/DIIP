from typing import Dict, Any

class EmailFormatter:
    """
    Formats institutional research alerts and narrative changes into HTML emails.
    """
    def format_html(self, alert_data: Dict[str, Any]) -> str:
        """
        Constructs responsive HTML template body for email alerts.
        """
        ticker = alert_data.get("ticker", "Global Macro")
        headline = alert_data.get("headline", "Narrative Update")
        category = alert_data.get("category", "General Update")
        severity = alert_data.get("severity_level", "Medium")
        action = alert_data.get("action_recommended", "Monitor")

        color = "#e74c3c" if severity == "High" else "#f39c12"

        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 5px;">
                <h2 style="color: {color}; border-bottom: 2px solid {color}; padding-bottom: 10px;">
                    DIIP Alert: {category} ({severity} Severity)
                </h2>
                <p><strong>Asset Ticker:</strong> {ticker}</p>
                <p><strong>Update:</strong> {headline}</p>
                <p><strong>Recommendation:</strong> <span style="background-color: #f1c40f; padding: 3px 6px; border-radius: 3px;">{action}</span></p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 11px; color: #777;">This is an automated analysis from the Digital Institutional Intelligence Platform.</p>
            </div>
        </body>
        </html>
        """
        return html.strip()

if __name__ == "__main__":
    formatter = EmailFormatter()
    test_alert = {"ticker": "NVDA", "headline": "Export caps restriction on H20 chips", "category": "Regulatory Risk", "severity_level": "High"}
    print(formatter.format_html(test_alert))
