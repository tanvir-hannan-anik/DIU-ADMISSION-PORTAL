"""
Intent Service — Token-optimization Layer 1
-------------------------------------------
Detects greetings, thanks, goodbyes and trivial small talk and returns a
predefined reply. These never need the LLM, so we short-circuit here and save
the entire prompt+completion token cost.

`detect()` returns a canned reply string on a hit, or None to fall through to
the next layer.
"""

import re

# Each intent: a set of trigger phrases (matched as whole, normalized message)
# and a canned reply. Kept intentionally conservative so real questions that
# merely CONTAIN "hi" (e.g. "which dept is high paying") never match.
_GREETING = {"hi", "hello", "hey", "helloo", "hii", "hey there", "good morning",
             "good afternoon", "good evening", "assalamu alaikum", "salam",
             "hi there", "yo", "hola"}
_THANKS = {"thanks", "thank you", "thank u", "thx", "tnx", "thanks a lot",
           "thank you so much", "many thanks", "appreciate it", "thankyou"}
_BYE = {"bye", "goodbye", "good bye", "see you", "see ya", "bye bye", "gtg",
        "take care", "khuda hafez", "allah hafez"}
_HOWAREYOU = {"how are you", "how r u", "how are u", "whats up", "what's up",
              "how do you do", "how is it going"}
_WHOAREYOU = {"who are you", "what are you", "what can you do", "your name",
              "what is your name", "who r u"}

_GREETING_REPLY = (
    "Hello! 👋 I'm **DIU Advisor**, your admission assistant for Daffodil "
    "International University. I can help with **departments, tuition fees, "
    "scholarships, eligibility, and the admission process**. What would you "
    "like to know?"
)
_THANKS_REPLY = (
    "You're most welcome! 😊 If you have any more questions about **admission, "
    "fees, or departments** at DIU, just ask."
)
_BYE_REPLY = (
    "Goodbye and best of luck with your admission at **DIU**! 🎓 Come back "
    "anytime you need help."
)
_HOWAREYOU_REPLY = (
    "I'm doing great, thank you! 😊 I'm here to help you with **DIU admission** "
    "— departments, fees, scholarships and eligibility. How can I help?"
)
_WHOAREYOU_REPLY = (
    "I'm **DIU Advisor**, the official AI admission assistant for **Daffodil "
    "International University**. I can guide you on choosing a department, "
    "tuition fees, scholarships/waivers, eligibility checks, and the admission "
    "process. What would you like to explore?"
)

_INTENTS = [
    (_GREETING, _GREETING_REPLY, "greeting"),
    (_THANKS, _THANKS_REPLY, "thanks"),
    (_BYE, _BYE_REPLY, "goodbye"),
    (_HOWAREYOU, _HOWAREYOU_REPLY, "smalltalk"),
    (_WHOAREYOU, _WHOAREYOU_REPLY, "identity"),
]

# Strip trailing punctuation/emoji for matching.
_CLEAN = re.compile(r"[^\w\s]")


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", _CLEAN.sub("", text.lower())).strip()


def detect(message: str) -> dict | None:
    """
    Return {"reply": str, "intent": str} if the message is pure greeting/thanks/
    goodbye/small talk, else None. Only matches SHORT messages so a genuine
    question that embeds a greeting word isn't hijacked.
    """
    cleaned = _clean(message)
    if not cleaned or len(cleaned.split()) > 5:
        return None
    for triggers, reply, name in _INTENTS:
        if cleaned in triggers:
            return {"reply": reply, "intent": name}
    # Also catch "<greeting> ..." openers that are still short (e.g. "hi bot")
    first = cleaned.split()[0]
    if first in {"hi", "hello", "hey"} and len(cleaned.split()) <= 2:
        return {"reply": _GREETING_REPLY, "intent": "greeting"}
    return None
