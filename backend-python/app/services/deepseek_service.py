import os
import requests
import logging

logger = logging.getLogger(__name__)

DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY', '')


def call_deepseek(messages: list, system_prompt: str, max_tokens: int = 512) -> str:
    """Call DeepSeek chat API and return the assistant reply text."""
    if not DEEPSEEK_API_KEY:
        raise ValueError("DEEPSEEK_API_KEY is not configured. Add it to your environment variables.")
    payload = {
        'model': 'deepseek-chat',
        'messages': [{'role': 'system', 'content': system_prompt}] + messages,
        'max_tokens': max_tokens,
        'temperature': 0.7,
    }
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {DEEPSEEK_API_KEY}',
    }
    response = requests.post(DEEPSEEK_API_URL, json=payload, headers=headers, timeout=30)
    response.raise_for_status()
    return response.json()['choices'][0]['message']['content']
