import os
import sys

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
sys.path.append(ROOT_DIR)
sys.path.append(os.path.join(ROOT_DIR, ".agents"))

import pytest
from fastapi.testclient import TestClient
from backend.rest.main import app

def test_copilot_chat_endpoint():
    client = TestClient(app)
    
    # 1. Post mock chat history without laymanMode
    payload = {
        "messages": [
            {"role": "user", "content": "Hello Copilot, show me the status for NVDA."}
        ],
        "laymanMode": False
    }
    
    response = client.post("/api/copilot/chat", json=payload)
    assert response.status_code == 200
    assert "response" in response.json()
    
    # 2. Post mock chat history with laymanMode
    payload_layman = {
        "messages": [
            {"role": "user", "content": "Hello Copilot, show me the status for NVDA."}
        ],
        "laymanMode": True
    }
    
    response_layman = client.post("/api/copilot/chat", json=payload_layman)
    assert response_layman.status_code == 200
    assert "response" in response_layman.json()
