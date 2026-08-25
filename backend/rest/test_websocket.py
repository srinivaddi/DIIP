import sys
import os
import unittest
from fastapi.testclient import TestClient

# Adjust path to import packages from root and backend
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.append(ROOT_DIR)

from backend.rest.main import app
from shared.utils.broadcaster import broadcaster

class TestWebSocketPubSub(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        broadcaster.active_connections.clear()

    def test_websocket_connect_and_broadcast(self):
        # 1. Open a WebSocket connection using TestClient
        with self.client.websocket_connect("/ws/alerts") as websocket:
            # Check that the connection was registered in the broadcaster
            self.assertEqual(len(broadcaster.active_connections), 1)

            # 2. Trigger an ingestion request (or call add_theme_to_narratives directly)
            # We trigger a mock post to /api/ingest
            payload = {
                "raw_document": "We see rising conviction in AI Infrastructure from BlackRock today.",
                "institution": "BlackRock"
            }
            response = self.client.post("/api/ingest", json=payload)
            self.assertEqual(response.status_code, 200)

            # 3. Receive the real-time broadcast message from the WebSocket
            message = websocket.receive_json()
            
            # Verify the structure of the message
            self.assertEqual(message["type"], "NARRATIVE_CHANGE")
            self.assertEqual(message["data"]["source"], "BlackRock")
            self.assertEqual(message["data"]["theme"], "AI Infrastructure")
            self.assertEqual(message["data"]["new_stance"], "Bullish")

        # After exiting the block, the connection is closed and should be removed
        self.assertEqual(len(broadcaster.active_connections), 0)

if __name__ == "__main__":
    unittest.main()
