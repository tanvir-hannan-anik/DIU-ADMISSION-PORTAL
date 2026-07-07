# QA Test Report — DIU University Automation Platform

**Role:** Senior QA / Test Engineer (automated review)
**Date:** 2026-07-07
**Branch:** `main` (working tree with uncommitted changes)
**Build under test:** frontend-react (React 18 SPA) · backend-python (Flask AI service)

> This is a living document. Each testing pass appends a new **Run** section at the
> bottom with an updated summary. Findings are tracked with stable IDs (`BUG-xx`)
> so fixes can be verified against them.

---

## 1. Scope & Methodology

### What was tested this run
The freshest, highest-risk changes (uncommitted diff) plus the two features that
are testable without a live cloud deployment:

| Area | Method |
|------|--------|
| New keyword-retrieval layer (`keyword_search_service.py`) | **Executed** against the real `departments_dataset.json` with 15+ representative queries |
| Fused retrieval (`rag_service.build_context`) | **Executed** with RAG unavailable to prove graceful degradation |
| Groq prompt assembly (`groq_service._build_system_prompt`) | Code review + traced the short-query → recommendation-mode decision |
| Python import graph (routes → services) | **Executed** smoke import of all modified modules |
| React app | **`npm run build`** (production compile) + **ESLint** on `src/` |
| Job Section + CV Builder (`JobsPage.js`) | Code review of match scoring + PDF export path |
| API/config wiring (`apiConfig.js`, `aiService.js`) | Code review |

### How to reproduce the executed tests
```bash
# Python service checks (from repo root)
./backend-python/venv/Scripts/python.exe -c "import sys;sys.path.insert(0,'backend-python');\
from app.services import keyword_search_service as kw; print(kw.build_context('cse fee'))"

# Frontend compile + lint (from frontend-react/)
CI=false npm run build
npx eslint src --ext .js
```

### What could NOT be tested (and why)
Honest coverage boundary — these need secrets / running infra I don't have:

- **Live AI answers** (Groq LLM quality, RAG retrieval accuracy) — needs `GROQ_API_KEY`, `GEMINI_API_KEY`, Qdrant Cloud. Locally `rag_service.is_available()` is `False`.
- **Spring Boot gateway, auth/JWT, Supabase DB flows** — service not running locally; no DB credentials.
- **Admin/CRM portal + PostHog/Clarity analytics** — needs backend + analytics API tokens.
- **Voice (Web Speech API), Firebase Google OAuth, live JSearch jobs** — browser/session + third-party keys required.
- **End-to-end form filling / course registration / payment** — needs full stack + DB.

These should be validated in a staging environment with secrets configured. The
findings below are all reproducible **without** those secrets.

---

## 2. Test Environment

- OS: Windows 11 · Node v22.12.0 · Python 3.14.2 (venv) · npm build via react-scripts
- Dataset: `backend-python/data/departments_dataset.json` — 29 department records loaded OK
- Keyword inverted index: 1136 tokens built OK

---

## 3. Findings Summary

| ID | Severity | Area | Status | One-line |
|----|----------|------|--------|----------|
| BUG-01 | 🔴 High | AI retrieval | ✅ **Fixed (Run 2)** | Short **factual** questions ("cse fee") are forced into "recommend departments + ask a follow-up" mode instead of being answered |
| BUG-02 | 🟠 Medium | AI retrieval | ✅ **Fixed (Run 2)** | Keyword matcher surfaces irrelevant departments; plural miss + 2-letter code substring match makes noise outrank curated matches |
| BUG-03 | 🟠 Medium | CV Builder | ✅ **Fixed (Run 2)** | "Download PDF" throws & silently fails when the browser blocks the popup window |
| BUG-04 | 🟠 Medium | Job matching | ✅ **Fixed (Run 2)** | Job "% match" is non-deterministic — `Math.random()` in render makes scores jitter on every re-render |
| OBS-01 | 🟡 Low | Frontend perf | Open (Note) | Main JS bundle is ~501 kB gzipped (large first load) |
| OBS-02 | 🟡 Low | CV Builder | Open (Note) | User fields injected unescaped into printed HTML (self-XSS / layout break) |
| OBS-03 | 🟡 Low | Architecture | Open (Note) | Frontend calls the Flask AI service directly, not via the Spring proxy the README describes |

**Green checks:** ✅ Frontend production build compiles cleanly · ✅ ESLint passes with no errors · ✅ All modified Python modules import cleanly · ✅ RAG graceful-degradation to keyword-only layer works when Qdrant/Gemini are down · ✅ Keyword map correctly resolves "Ai"→CIS/CSE/SWE, "law"→LL.B., "game"→MCT.

---

## 4. Findings in Detail

### 🔴 BUG-01 — Short factual questions hijacked into "recommendation mode"
**Files:** `backend-python/app/services/keyword_search_service.py` (`is_short_query`) · `backend-python/app/services/groq_service.py` (`_build_system_prompt`)

`is_short_query()` returns `True` when a query has **≤4 words OR is ≤25 characters**:
```python
return 0 < len(words) <= 4 or len(query.strip()) <= 25
```
When that is `True` **and** the keyword layer matched a department, `_build_system_prompt`
appends `SHORT_QUERY_RECO_NOTE`, which instructs the model to *"treat it as their field of
INTEREST, not a complete question… Do NOT dump full department details yet"* and to **end with a
follow-up question**.

**Reproduced** — every one of these short but *specific* questions triggers recommendation mode:

| Query | is_short | matched | → RECO_MODE |
|-------|----------|---------|-------------|
| `cse fee` | True | True | **True** |
| `fee of CSE?` | True | True | **True** |
| `CSE tuition` | True | True | **True** |
| `law eligibility` | True | True | **True** |
| `MCT` | True | True | **True** |

**Impact:** A prospective student asking *"cse fee"* gets a vague *"CSE is a great fit for your
interest! Want fees, eligibility, or curriculum?"* instead of the fee — a direct regression of the
core Q&A feature for the most common (short) query style.

**Suggested fix:** Only enter recommendation mode when the query is *interest-like* — i.e. short
**and** contains no intent keyword (`fee`, `tuition`, `eligibility`, `waiver`, `credit`, `duration`,
`admission`…) **and** isn't a bare department code. Reuse the `_GENERAL_KEYWORDS` set already in
`knowledge_base_service.py`.

---

### 🟠 BUG-02 — Irrelevant department matches / curated signal loses to index noise
**File:** `backend-python/app/services/keyword_search_service.py` (`match`)

The curated topic map matches single tokens as **whole words** (`key in meaningful`), so plurals
miss. Meanwhile the auto inverted index adds `0.5 * weight` per token match, and those small
contributions accumulate across noisy tokens and can outrank the intended department.

**Reproduced:**
- `"I love robots and automation systems for the future"` → ranked **`['TE', 'RME', 'ICE', 'BBA']`**.
  Textile (**TE**) ranks **above Robotics (RME)** for a robotics query, because `"robots"` (plural)
  never matches the curated `"robot"` key, so RME only gets the weaker `"automation"` signal while
  TE accumulates index noise from `systems`/`future`/etc.
- `"network security"` → `['CIS', 'CSE', 'ICE', 'BBA']` — **BBA** surfaces for a network-security query.

**Impact:** Wrong department recommendations undermine the "never hallucinate / always grounded"
selling point of the RAG system.

**Suggested fix:** (a) light stemming or plural-stripping before whole-word topic matching;
(b) require the inverted-index contribution to clear a minimum score, or cap its share so curated
priorities dominate; (c) drop matches whose score is a small fraction of the top score.

---

### 🟠 BUG-03 — CV "Download PDF" crashes when popup is blocked
**File:** `frontend-react/src/components/jobs/JobsPage.js:136`

```js
const handlePrint = () => {
  const win = window.open('', '_blank');   // returns null if popup blocked
  const skillsHtml = ...
  win.document.write(...)                   // ← TypeError: win is null
```
There is no null check on `win`. If the browser's popup blocker denies the window (common, and the
default in several configurations), `win` is `null` and the next line throws — the "Download PDF"
button does nothing and only logs an error to the console.

**Impact:** CV export (a headline Feature-3 capability) fails silently for affected users.

**Suggested fix:** Guard `if (!win) { toast.error('Please allow pop-ups to download your CV'); return; }`.

---

### 🟠 BUG-04 — Job "% match" is non-deterministic
**File:** `frontend-react/src/components/jobs/JobsPage.js` (`computeMatch`, used inline in render)

```js
function computeMatch(description = '', techSkills = []) {
  if (!description || !techSkills.length) return Math.floor(Math.random() * 30) + 20;
  ...
  return Math.min(98, Math.max(15, base + Math.floor(Math.random() * 12)));
}
```
`computeMatch` is called **inside the render map** for every job card, and it adds a random
component. Any state change (typing in the search box, switching tabs, loading) re-renders the list
and **recomputes different match percentages** for the same jobs. For a user with no skills the
score is *entirely* random.

**Impact:** The advertised "AI skill-match score" visibly changes between renders for the same job —
looks broken / untrustworthy.

**Suggested fix:** Compute match scores once when jobs load (e.g. `useMemo` keyed on the job list +
skills) and store them; remove the `Math.random()` jitter or derive it deterministically from the
job id.

---

### 🟡 OBS-01 — Large main bundle (~501 kB gzipped)
`build/static/js/main.*.js` is ~501 kB gzipped. Consider route-level code-splitting (the admin
portal, jobs, and PDF libs are good split points) to improve first paint.

### 🟡 OBS-02 — Unescaped user data in printed CV HTML
`handlePrint` interpolates `name`, `experience.description`, `projects`, etc. straight into a
`document.write` HTML string. It's the user's own data (self-XSS only), but a field containing `<`
or a stray `${` can break the CV layout. Escape before injecting.

### 🟡 OBS-03 — Frontend bypasses the Spring proxy for AI
`aiService.js` posts to `AI_BASE_URL` (`/api/v1/ai/process`) directly on the Flask service, while
the README/architecture diagram states AI requests route "through the Spring Boot proxy". Not a bug,
but it means Flask CORS must permit the frontend origin, and the documented architecture is
inaccurate. Worth aligning docs and reality.

---

## 5. Run Log

### Run 1 — 2026-07-07
- **Focus:** Uncommitted diff (new keyword/fused-retrieval layer) + Jobs/CV + build/lint smoke.
- **Executed:** keyword service against 20+ queries; Python import smoke; `npm run build`; ESLint.
- **Result:** Build ✅ · Lint ✅ · Imports ✅. Found **4 bugs** (1 High, 3 Medium) + 3 low observations.
- **Top priority:** BUG-01 (short factual questions no longer answered directly).
- **Not covered:** live AI/RAG quality, Spring Boot + Supabase flows, admin portal, voice, OAuth,
  live JSearch — require staging secrets (see §1).

### Run 2 — 2026-07-07 (fixes)
- **Focus:** Fix the 4 confirmed bugs from Run 1 and re-verify.
- **Changes:**
  - **BUG-01** — Added `keyword_search_service.is_interest_query()` (short **and** no intent
    keyword **and** not a bare dept code) and gated recommendation mode on it in
    `rag_service.build_context`. Also tightened `is_short_query` (≤4 words **and** ≤25 chars).
  - **BUG-02** — Plural→singular normalisation before curated topic matching; whole-word (not
    substring) department-code matching so "TE" no longer matches inside "sys**te**ms"; dropped
    weak tail matches (< 0.3 × top score) that surfaced index noise like BBA for "network security".
  - **BUG-03** — `handlePrint` now null-checks `window.open()` and shows a toast asking to allow
    pop-ups instead of throwing.
  - **BUG-04** — Replaced `Math.random()` in `computeMatch` with a deterministic FNV-hash seed
    (`seededInt`) so a given job's match % is stable across re-renders.
- **Re-verification (executed):**
  - `is_interest_query`: `cse fee`/`law eligibility`/`CSE tuition`/`MCT`/`compare cse and swe` → **False**;
    `Ai`/`ML`/`web`/`game`/`robotics`/`I like design` → **True**. ✅
  - `match`: `robots and automation…` → **`['RME']`** (was TE #1); `network security` →
    `['CIS','CSE','ICE']` (BBA gone); `Ai`→`['CIS','CSE','SWE']`; `cse`→`['CSE']`. ✅
  - Python modules import cleanly; `build_context('cse fee').short_query=False`,
    `build_context('Ai').short_query=True`. ✅
  - Frontend `npm run build` → **Compiled successfully** (no new errors/warnings). ✅
- **Files changed:** `backend-python/app/services/keyword_search_service.py`,
  `backend-python/app/services/rag_service.py`, `frontend-react/src/components/jobs/JobsPage.js`.
- **Still open:** OBS-01/02/03 (low). Cloud-dependent features still need a staging run with secrets.
