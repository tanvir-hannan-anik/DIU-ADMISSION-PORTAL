import unittest

from app.services.groq_service import GroqService


class TestGroqModelFallback(unittest.TestCase):
    def test_legacy_model_replaced_with_supported_fallback(self):
        candidates = GroqService.get_model_candidates("llama-3.3-70b-versatile")
        self.assertIn("openai/gpt-oss-20b", candidates)
        self.assertNotIn("llama-3.3-70b-versatile", candidates)


if __name__ == "__main__":
    unittest.main()
