"""
Seed the kb_faqs table with common DIU admission FAQs (token-optimization
Layer 2). Idempotent-ish: skips rows whose normalized_question already exists.

Run:  python scripts/seed_faqs.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import pg                              # noqa: E402
from app.services import question_normalizer       # noqa: E402
from app.repositories import faq_repo              # noqa: E402

FAQS = [
    ("How do I apply for admission at DIU?",
     "You can apply online at https://admission.daffodilvarsity.edu.bd. The steps are: "
     "**1.** Pre-registration → **2.** Fill the online admission form → **3.** Submit documents "
     "and pay the admission fee → **4.** Eligibility verification → **5.** Enroll and get your "
     "Student ID card.", "admission", ["admission", "apply", "process", "how"]),

    ("What is the admission fee at DIU?",
     "The one-time admission fee is **BDT 15,000**. Semester tuition is charged separately per "
     "credit and varies by department. Waivers reduce the tuition portion based on your combined "
     "SSC+HSC GPA.", "fee", ["admission", "fee", "cost"]),

    ("What documents are required for admission?",
     "You need: **SSC & HSC certificates and marksheets** (original + photocopy), a recent "
     "**passport-size photo** (2–4 copies), and your **NID or Birth Certificate** photocopy. "
     "O/A-Level applicants also need attested transcripts.", "admission",
     ["document", "documents", "required", "requirement"]),

    ("What scholarships or waivers does DIU offer?",
     "DIU offers **merit waivers** on combined SSC+HSC GPA: GPA 10 → 100%, ≥9 → 100% (merit), "
     "≥8.5 → 75%, ≥8 → 50%, ≥7 → 25%. There are also need-based, Freedom Fighter quota, and "
     "Chairman Endowment scholarships.", "scholarship",
     ["scholarship", "waiver", "merit"]),

    ("What is the eligibility for CSE at DIU?",
     "**CSE** requires the **Science group**, minimum **2.5 GPA** in both SSC and HSC, and at "
     "least a 'C' in Physics & Mathematics. O/A-Level: 4 'B' + 3 'C' from 7 subjects with Physics "
     "& Mathematics at both levels.", "eligibility",
     ["cse", "eligibility", "eligible", "requirement"]),

    ("How do I contact the DIU admission office?",
     "You can email **admission@daffodilvarsity.edu.bd** or apply online at "
     "https://admission.daffodilvarsity.edu.bd for the latest admission information.",
     "admission", ["contact", "admission", "office", "email"]),
]


def main() -> int:
    if not pg.is_configured():
        print("ERROR: DATABASE_URL not configured.")
        return 1
    inserted = skipped = 0
    for question, answer, category, keywords in FAQS:
        norm = question_normalizer.normalize(question)
        if faq_repo.get_by_normalized(norm):
            skipped += 1
            continue
        faq_repo.upsert(question, norm, answer, category, keywords)
        inserted += 1
        print(f"  + {question}")
    print(f"\nSeeded {inserted} FAQ(s), skipped {skipped} existing.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
