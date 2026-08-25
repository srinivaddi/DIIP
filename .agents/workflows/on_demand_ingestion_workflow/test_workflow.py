# Test file for on_demand_ingestion_workflow
import unittest
import os
import sys

# Adjust search path to allow root-level and .agents imports
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
sys.path.append(ROOT_DIR)
sys.path.append(os.path.join(ROOT_DIR, ".agents"))

from workflows.on_demand_ingestion_workflow.orchestrator import run

class TestWorkflow(unittest.TestCase):
    def test_execution(self):
        inputs = {
            "raw_document": "BlackRock CIO updates overweight stance on AI datacenter grids. We expect massive hardware demand.",
            "metadata": {"institution": "BlackRock"}
        }
        result = run(inputs)
        self.assertEqual(result["status"], "success")
        self.assertTrue(len(result["themes"]) > 0)
        self.assertEqual(result["themes"][0]["name"], "AI Infrastructure")

if __name__ == "__main__":
    unittest.main()
