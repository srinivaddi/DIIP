# Test file for weekly_opportunity_workflow
import unittest
import os
import sys

# Adjust search path to allow root-level and .agents imports
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
sys.path.append(ROOT_DIR)
sys.path.append(os.path.join(ROOT_DIR, ".agents"))

from workflows.weekly_opportunity_workflow.orchestrator import run

class TestWeeklyWorkflow(unittest.TestCase):
    def test_execution(self):
        inputs = {
            "current_holdings": {"NVDA": 0.05, "VRT": 0.12}
        }
        result = run(inputs)
        self.assertEqual(result["status"], "success")
        self.assertTrue("macro_regime" in result)
        self.assertTrue(len(result["rebalance_plan"]["recommended_trades"]) > 0)

if __name__ == "__main__":
    unittest.main()
