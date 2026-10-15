import unittest

from app.services.groq_service import GroqService


class GroqPayloadSanitizationTests(unittest.TestCase):
    def test_payload_is_trimmed_before_model_call(self):
        long_text = "A" * 5000
        history = [
            {"type": "user", "text": long_text},
            {"type": "assistant", "text": "This is a long assistant reply." * 200},
            {"type": "user", "text": "Need a short follow-up."},
        ]

        payload = GroqService._normalize_request_payload(
            prompt=long_text,
            context="B" * 20000,
            history=history,
            max_history=2,
            max_prompt_chars=1200,
            max_context_chars=1500,
            max_message_chars=600,
        )

        self.assertLessEqual(len(payload["prompt"]), 1200)
        self.assertLessEqual(len(payload["context"]), 1500)
        self.assertLessEqual(len(payload["history"]), 2)
        for item in payload["history"]:
            self.assertLessEqual(len(item["text"]), 600)

    def test_system_prompt_is_compacted_before_model_call(self):
        oversized_system_prompt = "GIANT SYSTEM PROMPT\n" + ("X" * 25000)

        compacted = GroqService._compact_system_prompt(
            oversized_system_prompt,
            max_chars=12000,
        )

        self.assertLessEqual(len(compacted), 12000)
        self.assertIn("[prompt truncated", compacted)


if __name__ == "__main__":
    unittest.main()
