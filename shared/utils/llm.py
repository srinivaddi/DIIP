import os
import json
import logging
from typing import Dict, Any, Optional

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("LLMClient")

import requests

# Load .env configurations with manual parsing fallback
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
env_path = os.path.join(ROOT_DIR, ".env")
try:
    from dotenv import load_dotenv
    load_dotenv(env_path)
except ImportError:
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()

try:
    from google import genai  # type: ignore # pyrefly: ignore [missing-import]
    from google.genai import types  # type: ignore # pyrefly: ignore [missing-import]
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False
    logger.warning("google-genai package not installed. Running LLM client in mock/fallback mode.")

class LLMClient:
    """
    Wrapper around LLM providers (Gemini or Local models like Ollama/LM Studio).
    Toggled via LLM_PROVIDER env variable ('gemini' or 'local').
    """
    def __init__(self, model_name: str = "gemini-2.5-flash"):
        self.provider = os.environ.get("LLM_PROVIDER", "gemini").lower()
        self.model_name = model_name
        self.local_url = os.environ.get("LOCAL_LLM_URL", "http://localhost:11434/v1/chat/completions")
        self.local_model = os.environ.get("LOCAL_LLM_MODEL", "llama3")

    def generate_json(self, system_instruction: str, prompt: str) -> Dict[str, Any]:
        """
        Sends system instructions and user prompt to selected provider, enforcing JSON output.
        """
        if self.provider == "local":
            return self._generate_local_json(system_instruction, prompt)
        else:
            return self._generate_gemini_json(system_instruction, prompt)

    def generate_text(self, system_instruction: str, prompt: str) -> str:
        """
        Sends system instructions and user prompt to selected provider, returning plain text.
        """
        if self.provider == "local":
            return self._generate_local_text(system_instruction, prompt)
        else:
            return self._generate_gemini_text(system_instruction, prompt)

    def _generate_local_text(self, system_instruction: str, prompt: str) -> str:
        logger.info(f"Sending text prompt to Local LLM ({self.local_model})...")
        payload = {
            "model": self.local_model,
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ]
        }
        try:
            response = requests.post(self.local_url, json=payload, timeout=20)
            response.raise_for_status()
            res_data = response.json()
            return res_data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"Error calling Local LLM text generator: {str(e)}")
            return "Error: Local LLM offline."

    def _generate_gemini_text(self, system_instruction: str, prompt: str) -> str:
        logger.info(f"Sending text prompt to Gemini model ({self.model_name})...")
        if not HAS_GENAI or not os.environ.get("GEMINI_API_KEY"):
            return "I am the DIIP Advisor Copilot. Please configure your GEMINI_API_KEY in the environment to enable live AI responses."
        try:
            client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction
                ),
            )
            return response.text
        except Exception as e:
            logger.error(f"Error calling Gemini API: {str(e)}")
            return f"Error calling Gemini AI service: {str(e)}"

    def _clean_markdown(self, s: str) -> str:
        s = s.strip()
        if s.startswith("```"):
            lines = s.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            s = "\n".join(lines).strip()
        return s

    def _repair_json(self, s: str) -> str:
        s = s.strip()
        if not s:
            return s
            
        # Count open/close symbols
        open_braces = s.count('{')
        close_braces = s.count('}')
        open_brackets = s.count('[')
        close_brackets = s.count(']')
        
        # Balance quotes if odd number exists
        quotes = s.count('"')
        if quotes % 2 != 0:
            s += '"'
            
        # Close open brackets
        if open_brackets > close_brackets:
            s += ']' * (open_brackets - close_brackets)
            
        # Close open braces
        if open_braces > close_braces:
            s += '}' * (open_braces - close_braces)
            
        return s

    def _generate_local_json(self, system_instruction: str, prompt: str) -> Dict[str, Any]:
        """
        Sends query to a local OpenAI-compatible endpoint (Ollama, LM Studio, etc.)
        with a self-healing retry mechanism.
        """
        logger.info(f"Sending prompt to Local LLM ({self.local_model}) at {self.local_url}...")
        payload = {
            "model": self.local_model,
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"}
        }
        content = None
        
        # Attempt 1
        try:
            response = requests.post(self.local_url, json=payload, timeout=None)
            response.raise_for_status()
            res_data = response.json()
            content = res_data["choices"][0]["message"]["content"].strip()
            content = self._clean_markdown(content)
            return json.loads(content)
        except Exception as e:
            logger.warning(f"Local LLM Call Ingestion Attempt 1 failed: {str(e)}. Retrying once more...")
            
            # Attempt 2 (Retry)
            try:
                response = requests.post(self.local_url, json=payload, timeout=None)
                response.raise_for_status()
                res_data = response.json()
                content = res_data["choices"][0]["message"]["content"].strip()
                content = self._clean_markdown(content)
                
                try:
                    return json.loads(content)
                except json.JSONDecodeError:
                    # Self-Healing JSON Repair
                    repaired = self._repair_json(content)
                    logger.info(f"Attempting self-healing JSON repair on: {content[:50]}...")
                    return json.loads(repaired)
            except Exception as e2:
                logger.error(f"Error calling Local LLM on Retry: {str(e2)}. Raw response was: {content if 'content' in locals() else 'None'}. Falling back to mock data.")
                mock_res = self._get_mock_response(prompt)
                mock_res["is_fallback"] = True
                return mock_res

    def _generate_gemini_json(self, system_instruction: str, prompt: str) -> Dict[str, Any]:
        """
        Queries modern Google Gemini API using google-genai SDK.
        """
        logger.info(f"Sending prompt to Gemini model ({self.model_name})...")
        
        if not HAS_GENAI or not os.environ.get("GEMINI_API_KEY"):
            # Return high-fidelity fallback mocks for local testing without API keys
            logger.info("Mock API output generated (no API key or library found).")
            mock_res = self._get_mock_response(prompt)
            mock_res["is_fallback"] = True
            return mock_res

        try:
            client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                ),
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Error calling Gemini API: {str(e)}")
            mock_res = self._get_mock_response(prompt)
            mock_res["is_fallback"] = True
            return mock_res

    def _get_mock_response(self, prompt: str) -> Dict[str, Any]:
        """
        Stub response mapping based on key search queries in the prompt.
        """
        prompt_lower = prompt.lower()
        if "raw_document" in prompt_lower:
            return {
                "cleaned_markdown": "Structured content containing AI Infrastructure themes.",
                "metadata": {
                    "institution": "BlackRock",
                    "authors": ["System"],
                    "date": "2026-07-27",
                    "covered_assets": ["NVDA", "VRT"]
                }
            }
        elif "consensus" in prompt_lower:
            return {
                "consensus_points": [
                    {
                        "topic": "AI Infrastructure",
                        "consensus_view": "Overwhelmingly bullish on datacenter and power utility hardware",
                        "agreeing_institutions": ["BlackRock", "Goldman Sachs", "J.P. Morgan"]
                    }
                ],
                "divergent_points": []
            }
        elif "scoring" in prompt_lower or "rank" in prompt_lower:
            return {
                "ranked_opportunities": [
                    {"rank": 1, "ticker": "NVDA", "score": 92.5, "action": "Strong Buy"},
                    {"rank": 2, "ticker": "VRT", "score": 88.0, "action": "Buy"}
                ]
            }
        else:
            # Default fallback: return structured themes mock so narratives are successfully created
            return {
                "themes": [
                    {
                        "name": "AI Infrastructure",
                        "thesis": "Exponential growth in AI datacenters creates structural demand for power grids.",
                        "horizon": "Long-term",
                        "sentiment": "Bullish",
                        "supporting_quotes": ["We are increasing our overweight in AI infrastructure..."]
                    }
                ]
            }

if __name__ == "__main__":
    client = LLMClient()
    res = client.generate_json("You are an investment analyst.", "Extract themes from this report text.")
    print(res)
