# Test file for earnings_transcript_workflow
import unittest
from orchestrator import run

class TestWorkflow(unittest.TestCase):
    def test_execution(self):
        result = run({})
        self.assertEqual(result["status"], "success")

if __name__ == "__main__":
    unittest.main()
