# DIU University Automation Platform — Complete Technical Documentation

## Project Summary

This is a full-stack university automation system built for **Daffodil International University (DIU)**. It modernizes how prospective and current students interact with the university — replacing manual processes with intelligent, AI-driven workflows — and gives university staff a dedicated admin portal for CRM, analytics, and AI-pipeline control. The platform is a **three-service architecture** (React SPA, Spring Boot API, Flask AI microservice) sharing a single Supabase Postgres database, deployed on Render.com.

---

## Technology Stack

### Frontend — React 18 SPA

- **Framework:** React 18.2.0 with React Router DOM v6 (client-side routing)
- **Styling:** Tailwind CSS 3.3.0 (utility-first responsive design)
- **Authentication:** Firebase 12.13.0 (Google OAuth login)
- **PDF Generation:** html2canvas + jspdf (for CV builder and reports)
- **HTTP Client:** Axios 1.6.0
- **Voice:** Web Speech API (browser-native, no library needed)
- **Key Directory:** `frontend-react/src/`

### Backend — Spring Boot (Java 21)

- **Framework:** Spring Boot 3.2.0
- **ORM:** Spring Data JPA with Hibernate
- **Security:** Spring Security + JWT (jjwt 0.12.3) — stateless token-based auth, plus role-based access control (RBAC) for the admin portal
- **Database:** Supabase Postgres (production, Session Pooler/IPv4), H2 in-memory (local development)
- **Email:** Spring Mail via Gmail SMTP
- **Build Tool:** Maven
- **Role:** Acts as the central REST API gateway and data persistence layer; also serves the admin portal's auth, CRM, and analytics APIs
- **Key Directory:** `backend-spring-boot/src/main/java/com/university/`

### Backend — Python Flask (AI Microservice)

- **Framework:** Flask 3.0.0 served by Gunicorn (2 workers)
- **LLM Provider:** Groq API using `llama-3.3-70b-versatile` — 3 separate API keys for load balancing
- **Vision/Image AI:** Groq `meta-llama/llama-4-scout-17b` (department flyer OCR)
- **Embeddings:** Google Gemini API (`gemini-embedding-001`, 768-dimensional vectors)
- **Vector Database:** Qdrant Cloud (cosine similarity search over RAG knowledge base + a second `diu_semcache` collection for the semantic response cache)
- **Web Scraping:** BeautifulSoup4 + lxml (live university data), with an optional JS-rendered fetch path for pages that need it
- **DB Access:** psycopg connection pool (`app/db/pg.py`) — the Python service now talks directly to the same Supabase Postgres DB as Spring, via `kb_*` repositories, for the AI Knowledge Pipeline
- **Scheduling:** APScheduler (in-process, advisory-lock guarded) or Render/GitHub Actions cron, for periodic knowledge-base sync
- **PDF Processing:** pypdf + PIL
- **Role:** Handles all AI, RAG, and LLM operations independently from the Java backend; also owns the AI Knowledge Pipeline (scraping → change detection → incremental indexing) and the 6-layer token-optimized chat pipeline
- **Key Directory:** `backend-python/app/`

### Infrastructure & Deployment

- **Hosting:** Render.com (3 services: React static site, Spring Boot Docker container, Python native service)
- **Database:** Supabase Postgres (shared by both the Spring Boot and Python services)
- **Live Jobs API:** JSearch via RapidAPI
- **Visitor Analytics:** Microsoft Clarity (real metrics pulled into the admin dashboard via the Clarity Data Export API); PostHog wiring documented for future use
- **Automation:** GitHub Actions workflow (`kb-sync.yml`) periodically triggers the AI Knowledge Pipeline sync
- **Containerization:** Docker Compose for local development

---

## Deployment Architecture

```
  [ React SPA — diu-frontend.onrender.com ]
     ├── Public site (admission, jobs, proctor, chatbots)
     └── Admin Portal (/admin — analytics, CRM, pipeline)
           ↓ REST API calls
  [ Spring Boot API — diu-spring-api.onrender.com ]
     ├── Public/student controllers (JWT auth)
     └── Admin controllers (RBAC, audit log, leads, Clarity proxy)
           ↓ AI requests             ↓ DB queries
  [ Flask AI Service ]          [ Supabase Postgres ]
  [ Groq + RAG + Jobs ]         [ AdmissionApplication, Lead,
  [ + AI Knowledge Pipeline ]     CourseRegistrationRecord,
           ↓ vectors                User, Notice, Payment,
  [ Qdrant Cloud ]                 AdminAuditLog, kb_* tables... ]
  [ diu_kb + diu_semcache ]            ↑ JPA entities / psycopg
           ↓ embeddings                       ↑
  [ Google Gemini API ]         [ GitHub Actions kb-sync cron ]
```

---

---

# THE FIVE CORE FEATURES

---

## Feature 1 — Admission Chatbot with Automatic Form Filling (RAG-Powered)

**Key Files:**
- `frontend-react/src/components/common/ChatbotWidget.js`
- `backend-python/app/routes/ai_routes.py`
- `backend-python/app/services/groq_service.py`
- `frontend-react/src/hooks/useVoice.js`

### What It Does

The Admission Chatbot is a conversational AI assistant that guides prospective students through the entire DIU admission process — from answering questions about university life to **automatically filling out official admission forms** based on a natural conversation.

### Two Operating Modes

**Mode 1 — Q&A Mode (RAG-Powered)**

The chatbot answers any question about DIU — departments, fees, waivers, faculty, facilities, eligibility — by retrieving accurate information from the vector knowledge base in real time. The answer is always grounded in verified university data, not fabricated by the AI.

**Mode 2 — Form-Guided Mode (Automatic Form Filling)**

The AI conducts a structured conversation to collect all required form fields. As the user speaks or types their answers, the AI extracts and validates structured data:

- **Pre-Registration Form fields:** `fullName`, `email`, `dateOfBirth`, `sscResult`, `hscResult`, `sscGroup`, `sscBoard`, `programHint`
- **Online Admit Card fields:** All of the above plus `fatherName`, `motherName`, `gender`, `division`, `presentAddress`

Once all fields are collected through the conversation, the form is **automatically populated** — no manual data entry needed.

### Voice Integration

- **Speech-to-text:** Browser Web Speech API — mic button in the chatbot
- **Text-to-speech:** The AI reads its responses aloud (toggleable)
- In Form Mode, spoken answers are auto-submitted after a 1.5-second silence
- Compatible with Chrome, Edge, and Safari (desktop and mobile)

### Backend Endpoint

`POST /api/v1/ai/process` — routes through Spring Boot proxy to the Python AI service, which runs the RAG retrieval pipeline before calling Groq.

---

## Feature 2 — Smart Advisor with Automatic Course Registration (RAG-Powered)

**Key Files:**
- `frontend-react/src/components/student/SmartAdvisorFullscreen.js`
- `backend-python/app/routes/ai_routes.py` (line 68, `/smart-advisor` endpoint)

### What It Does

The Smart Advisor is a full-page AI counselor available to admitted students. It acts like a personal academic advisor — understanding a student's interests, academic results, and career goals, then recommending the most suitable department and automatically handling course registration.

### Key Capabilities

- **Department Recommendation Engine:** The AI gathers GPA, budget, career goals, and interests conversationally, then recommends the best-fit department with side-by-side comparison tables
- **Eligibility Verification:** Checks student records against department requirements in real time
- **Fee Calculation with Waiver Policy:** Calculates exact tuition cost accounting for GPA-based scholarships (`waiver-policy2025.pdf` is indexed in RAG)
- **Automatic Course Registration:** After advising is complete, the AI can trigger course registration workflows directly through the backend
- **Career Guidance:** AI/ML queries are automatically routed to prioritize CIS → CSE → SWE departments
- **File Upload & Image Analysis:** Students can upload documents; the Groq vision model analyzes them
- **Voice Support:** Full speech-in / speech-out like the admission chatbot

### Backend Endpoint

`POST /api/v1/ai/smart-advisor` — uses a dedicated second Groq API key (key 2) to avoid rate limiting, with RAG retrieval active for all department and policy queries.

---

## Feature 3 — Job Section with Live Job Listings

**Key Files:**
- `frontend-react/src/components/jobs/JobsPage.js`
- `backend-python/app/routes/jobs_routes.py`
- `frontend-react/src/services/jobService.js`

### What It Does

A career portal integrated directly into the university platform. Students can browse live job listings, check how well their skills match each job, analyze skill gaps, and generate a professional CV — all without leaving the platform.

### Job Sources

- **Live Jobs (JSearch RapidAPI):** Real-time job listings fetched via `https://jsearch.p.rapidapi.com/search` — keyword search by role and location (default: Bangladesh)
- **Fallback Pool:** 15 curated Bangladeshi tech company listings (used when the API is unavailable)

### Key Capabilities

**Skill Matching Algorithm**
Each job listing shows a percentage match score based on comparing the student's declared skills against keywords extracted from the job description.

**Skill Gap Analysis**
For any job, the system identifies which required skills the student currently lacks — giving them a concrete roadmap for what to learn next.

**CV Builder with PDF Export**
Students fill in their profile (education, experience, skills, summary) and the system generates a professionally formatted PDF resume using html2canvas + jspdf. An AI-powered feature can auto-generate the professional summary from the career profile data.

**Job Filters & Search**
Keyword search, location filtering, and date posted filters for refining results.

### Backend Endpoints

- `GET /api/v1/jobs/search` — internal search from database
- `GET /api/v1/jobs/external` — live JSearch API call with fallback

---

## Feature 4 — Smart Proctor

**Key Files:**
- `frontend-react/src/components/proctor/SmartProctorPage.js`
- `backend-python/app/routes/ai_routes.py` (line 116, `/smart-proctor` endpoint)

### What It Does

An AI-powered student affairs assistant that handles university discipline, complaint filing, and appointment booking — replacing in-person visits to the proctor's office for routine matters.

### Key Capabilities

**University Rules Q&A**
Students ask questions about university regulations and receive accurate, policy-grounded answers.

**Structured Complaint Filing**
The AI guides the student through filing a formal complaint by gathering all required fields conversationally: what happened, when, where, and who was involved. A unique **Complaint ID** (format: `COMP-YYYY-XXXX`) is generated and issued.

**Appointment Booking System**
Students can book appointments with the proctor. Available slots: Monday–Thursday at 10am, 12pm, 2pm, 4pm. A unique **Appointment ID** (format: `APT-YYYY-XXXX`) is generated upon confirmation.

**Emergency Assistance**
Immediate access to campus security contact information for urgent situations.

**Voice Support**
Full voice input and output — a student can file a complaint entirely by speaking.

### Backend Endpoint

`POST /api/v1/ai/smart-proctor` — uses a dedicated third Groq API key (key 3) for full isolation from the other AI features.

---

## Feature 5 — Admin Portal (Analytics, CRM & Pipeline Control)

**Key Files:**
- `frontend-react/src/admin/` (`AdminApp.js`, `AdminLayout.js`, `AdminLoginPage.js`, `pages/`)
- `backend-spring-boot/.../controller/AdminController.java`, `AdminUserController.java`, `AdminLeadController.java`, `AdminChatController.java`, `AdminClarityController.java`, `AnalyticsController.java`, `LeadCaptureController.java`
- `backend-spring-boot/.../model/entity/{Lead,LeadActivity,Counselor,AdminAuditLog,ChatLog}.java`
- `backend-python/app/routes/admin_routes.py`, `pipeline_routes.py`

### What It Does

A dark-themed internal dashboard at `/admin`, separate from the public site, that gives staff real operational visibility and control: security/audit, lead & applicant tracking (CRM), live analytics, and control over the AI Knowledge Pipeline.

### Key Capabilities

- **Role-based Auth & Audit Logging:** Dedicated admin login (`AdminLoginPage`), seeded admin account (`ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars, re-synced on boot), JWT-secured admin API, and an `AdminAuditLog` trail of admin actions (login, IP, timestamp).
- **Leads / CRM (`LeadsPage`, `FollowUpsPage`):** Public admission/contact forms automatically create a `Lead` (via `LeadCaptureController` → `/v1/leads`); leads can be assigned to `Counselor`s, tracked through pipeline stages, and followed up on via `LeadActivity` entries.
- **Applications (`ApplicationsPage`):** Surfaces existing `AdmissionApplication` records for staff review alongside the CRM view.
- **Live Analytics Dashboard (`AdminDashboard.js`, `analytics.js`, `widgets.js`):** Dashboard KPIs read live from the database (no demo/mock data); real visitor metrics (sessions, traffic sources, locations) pulled natively from **Microsoft Clarity's Data Export API** via `AdminClarityController`.
- **Chat Analytics (`ChatAnalyticsPage`):** Conversation logging (`ChatLog` entity / `ChatLogController`) surfaces chatbot usage, response outcomes, and volume.
- **AI Pipeline Control (`PipelinePage`):** Consumes the Python service's `/api/v1/admin/dashboard`, `/admin/sources`, `/admin/logs`, and `/admin/popular-questions` endpoints to show knowledge-base sync status, vector counts, cache hit ratio, tokens saved, and scheduler health; can trigger `/pipeline/sync` and `/pipeline/rebuild`.
- **Users & Roles (`UsersRolesPage`):** Admin user/role management surface.
- **Integrations (`IntegrationsPage`):** Central place for wiring analytics/marketing SaaS keys (PostHog, Clarity, GA4) — see `ADMIN_PORTAL_SETUP.md`.
- **Command Palette:** Quick keyboard-driven navigation across admin pages (`CommandPalette.js`).

### Setup

Full step-by-step production setup (secrets, Render env vars, Clarity/PostHog wiring, CORS lockdown, security checklist) is documented in `ADMIN_PORTAL_SETUP.md`.

---

---

# THE RAG SYSTEM — The Project's Core Innovation

The **Retrieval-Augmented Generation (RAG)** system is the single most important technological achievement of this project. It is what transforms the chatbots from generic AI assistants into accurate, university-specific knowledge systems that never hallucinate critical information about DIU.

**Key Files:**
- `backend-python/app/services/rag_service.py`
- `backend-python/app/services/vector_store_service.py`
- `backend-python/app/services/embedding_service.py`
- `backend-python/app/services/web_scraper_service.py`
- `backend-python/app/services/rag_knowledge_seed.py`
- `backend-python/app/services/ingestion_service.py`

---

## Why RAG Changes Everything

Without RAG, the LLM would answer questions about DIU from its training data — which is either outdated, incomplete, or simply wrong about a specific Bangladeshi university. With RAG, every answer is **retrieved first** from a verified, up-to-date knowledge base, then passed to the LLM to generate a fluent, context-aware response. The LLM becomes a language formatter, not a fact source.

This is what enables the system to accurately answer questions like:
- "What is the waiver for a 4.80 GPA student in CSE?"
- "Who is the head of the CIS department?"
- "What are the eligibility requirements for the BBA program?"

---

## The Four Knowledge Sources

### 1. Curated Seed Documents (`rag_knowledge_seed.py`)

A hand-crafted, verified dataset covering: university leadership (VC, Pro-VC, Founder), all 51 academic programs across 6 faculties, faculty directories per department, GPA-based waiver and scholarship policies, eligibility requirements for every program, department ratings (2025), and a complete CIS curriculum breakdown (12 semesters, 136+ credits).

### 2. Department Flyer OCR (`ingestion_service.py`)

Physical department promotional flyers (stored as images in `department details/`) are processed using the **Groq vision model** (`llama-4-scout-17b`). The AI reads each image and extracts structured JSON containing: department name, faculty, degree, duration, fees, labs, curriculum highlights, career outcomes, and eligibility. This data is saved to `backend-python/app/data/departments_dataset.json` and indexed into Qdrant.

### 3. PDF Document Indexing

Two official university PDFs are parsed and indexed:
- `waiver-policy2025.pdf` — official scholarship and waiver rules
- `application_instruction.pdf` — official admission instructions

Documents are chunked into segments of **1,200 characters with 180-character overlap** to preserve context across chunk boundaries during retrieval.

### 4. Live Web Scraping (`web_scraper_service.py`)

The most dynamic knowledge source — live data scraped directly from the DIU website with a **1-hour cache TTL**:
- **Scholarship page:** `daffodilvarsity.edu.bd/scholarship/diu-scholarship`
- **Tuition fees page:** `daffodilvarsity.edu.bd/tuition-fees`
- **Faculty directory:** `faculty.daffodilvarsity.edu.bd`

This means the chatbot always has access to the **current, published fees and scholarship information** — critical for answering admission queries accurately.

---

## The Embedding & Vector Store Pipeline

### Embeddings (`embedding_service.py`)

Every document chunk and every user query is converted to a **768-dimensional vector** using Google Gemini's `gemini-embedding-001` model. Two distinct task types are used:
- `RETRIEVAL_DOCUMENT` — when indexing content into Qdrant
- `RETRIEVAL_QUERY` — when embedding a user's question for search

This task-type distinction improves retrieval accuracy because the embedding model is explicitly told whether it is encoding a document or a query.

The service uses **3-retry exponential backoff** to handle transient Gemini API failures without breaking the chat experience.

### Vector Store (`vector_store_service.py`)

All document vectors are stored in **Qdrant Cloud** under the collection `diu_kb`. Qdrant uses **cosine similarity** to find the most semantically similar documents to any user query.
- **Batch indexing:** 64 vectors per request (efficient bulk ingestion)
- **REST API only** (no gRPC — required for Render.com compatibility)

---

## The Full RAG Retrieval Pipeline (Per User Message)

```
User types/speaks a question
         ↓
  Gemini embeds query (RETRIEVAL_QUERY, 768-dim)
         ↓
  Qdrant cosine search over diu_kb collection
  (top-6 results, min score threshold: 0.30)
         ↓
  Keyword retrieval layer fuses in curated + inverted-index
  department matches (see below) — catches short/keyword
  queries that embed too weakly to clear the score threshold
         ↓
  Retrieved chunks formatted as [Title]\n{text}
         ↓
  Context injected into Groq system prompt
         ↓
  Groq LLM generates answer grounded in retrieved facts
         ↓
  Language-aware response (Bangla or English)
         ↓
  Response displayed + optionally spoken aloud (TTS)
```

### Keyword Retrieval Layer (`keyword_search_service.py`)

Pure vector search misses very short or keyword-style messages (e.g. `"Ai"`, `"web"`, `"game"`, `"law"`) because a 1–2 word query embeds too weakly to clear `RAG_MIN_SCORE`. This layer fuses in a second matching path so those queries still resolve to real departments:

1. **Curated topic map** — hand-tuned concept → department mappings with a human-readable reason and priority (e.g. `"ai"` → CIS → CSE → SWE, `"game"` → MCT, `"law"` → LL.B.).
2. **Inverted index** — auto-built from the live `departments_dataset.json` fields (careers, curriculum, labs, overview), so any token the curated map misses can still match grounded department data.

`build_context()` returns a grounded text block fused into the RAG context — the LLM always recommends real departments using real facts, never hallucinated ones. If nothing matches, retrieval falls back to normal RAG/legacy behavior. This layer also includes QA-verified guards so short factual questions (e.g. "What is CSE?") are not incorrectly hijacked into recommendation mode, plus whole-word department-code matching and plural normalization.

---

## RAG-Specific System Prompt Design

The Groq system prompt enforces strict rules when RAG context is available:
- **No hallucination:** The LLM must only cite facts present in the retrieved context
- **Structured templates:** 5 predefined response formats for department info, fees, faculty, scholarships, and eligibility — ensuring consistent, readable answers
- **Language awareness:** Responds in Bangla if the student queries in Bangla
- **Counseling flow:** For vague questions, gathers student profile step-by-step before answering
- **Live data preference:** When scraped data is available, it takes priority over static seed data

---

## Graceful Degradation (Production Resilience)

A critical design principle: **the chat never breaks**, even when the RAG pipeline has issues.

| Failure Scenario | Fallback Behavior |
|---|---|
| Qdrant unavailable | Falls back to legacy static system prompt |
| RAG returns no matches (score < 0.30) | Falls back to legacy static prompt |
| Gemini embedding fails | Non-blocking retry; chat continues with fallback |
| Groq API key 1 rate-limited | Smart Advisor uses key 2, Smart Proctor uses key 3 |
| JSearch API unavailable | 15-job mock fallback list served |

---

## How RAG Powers the Automation Features Specifically

**Admission Chatbot Form Filling:**
RAG retrieves the exact eligibility and program requirements before the AI starts collecting form data — so the AI knows which programs the student qualifies for *before* it asks about their GPA. The AI then pre-validates inputs against retrieved rules.

**Smart Advisor Course Registration:**
RAG retrieves current curriculum data, credit requirements, and prerequisite chains. The AI uses this retrieved context to recommend a valid course schedule — not an invented one — and can then trigger the actual registration call to the Spring Boot backend.

---

## RAG as a Competitive Advantage

The combination of **four distinct knowledge sources** (curated seed + OCR-extracted flyer data + official PDF documents + live-scraped web data), **semantic vector search** (Qdrant + Gemini embeddings), and **strict anti-hallucination prompting** creates an information retrieval system that is:

1. **More accurate** than a pure LLM (grounded in real documents)
2. **More current** than static training data (live scraping with 1-hour freshness)
3. **More trusted** than a simple keyword search (semantic similarity, not string matching)
4. **Fully automated** — the form-filling and course registration flows are only possible because the AI retrieves accurate, structured data to drive each decision

This is what makes the RAG system the project's defining technological achievement — it is not a cosmetic add-on but the foundation that makes the automation of form filling and course registration **reliable enough to use in a real university context**.

---

---

# THE AI KNOWLEDGE PIPELINE — Self-Updating Knowledge Base & Token Optimization

Built on top of the core RAG system, the AI Knowledge Pipeline keeps the knowledge base **automatically fresh** (no manual re-seeding) and dramatically **cuts LLM token usage** by answering as many questions as possible without ever calling the LLM. Full design of record: `backend-python/AI_KNOWLEDGE_PIPELINE.md`.

**Key Files:**
- `backend-python/app/db/pg.py` — psycopg connection pool to Supabase Postgres
- `backend-python/app/repositories/` — `sources_repo`, `documents_repo`, `chunks_repo`, `faq_repo`, `semcache_repo`, `metrics_repo`, `sync_repo`, `tuition_fee_repo`, `faculty_repo`
- `backend-python/app/services/` — `content_extractor_service`, `change_detection_service`, `incremental_index_service`, `sync_service`, `scheduler_service`, `intent_service`, `faq_service`, `semantic_cache_service`, `question_normalizer`, `context_compression_service`, `cache_service`, `faculty_scraper_service`, `tuition_fee_service`, `rendered_fetch_service`
- `backend-python/app/routes/pipeline_routes.py`, `admin_routes.py`, `faculty_routes.py`, `tuition_routes.py`, `live_data_routes.py`
- `supabase/migrations/20260708000001_ai_knowledge_pipeline.sql`, `20260708000002_add_render_js.sql`, `20260708000003_tuition_fees.sql`
- `.github/workflows/kb-sync.yml`

## 1. Self-Updating Knowledge Sync

Instead of a one-time seed, five live DIU pages (`/admission`, `/tuition-fees`, faculty directory, `/faculties`, homepage) are re-crawled on a schedule and diffed against what's already indexed:

```
Scheduler fires (per-source interval)
         ↓
  HTTP GET with ETag / If-Modified-Since (conditional GET)
         ↓  304 Not Modified → skip, just bump last_synced_at
  200 OK → content_extractor_service cleans HTML into
  structured documents (stable natural_key per section)
         ↓
  change_detection_service: SHA-256 hash per document
    • unchanged → skip (no embed, no write)
    • new       → insert (version 1) → chunk → embed → upsert vectors
    • changed   → update (version++) → delete old vectors →
                  re-embed only changed chunks → upsert
    • missing   → mark inactive, delete its vectors
         ↓
  Affected semantic-cache entries invalidated
         ↓
  kb_sync_runs row written + kb_metrics updated
```

**Why it matters:** unchanged pages never touch the Gemini embeddings API or Qdrant — only genuinely new/changed content is re-processed, keeping both cost and sync latency low.

**Scheduling:** in-process **APScheduler** with a Postgres advisory lock (or Redis lock if `REDIS_URL` is set) guards against duplicate runs across gunicorn workers; alternatively `SCHEDULER_ENABLED=false` lets external triggers (Render Cron Jobs, or the GitHub Actions `kb-sync.yml` workflow) call `POST /api/v1/pipeline/sync` on a schedule — more robust on Render's free tier, which spins down on inactivity.

**New data sources:** `faculty_scraper_service.py` and `tuition_fee_service.py` extend scraping to the faculty directory and tuition-fees pages specifically, with `rendered_fetch_service.py` providing a JS-rendered fetch path (`render_js` flag on `kb_sources`) for any page that turns out to require it.

## 2. Six-Layer Query Optimization (Token Savings)

Every chat message now passes through up to six layers before an LLM is ever called — most questions are answered in layers 1–3 for **zero LLM tokens**:

| Layer | Module | Calls LLM? | Backing store |
|---|---|---|---|
| 1. Intent | `intent_service.py` | No | Regex/keyword table (greeting/thanks/goodbye/smalltalk → canned reply) |
| 2. FAQ match | `faq_service.py` | No | `kb_faqs` (normalized + keyword search) |
| 3. Semantic cache | `semantic_cache_service.py` | No | Qdrant `diu_semcache` collection, ≥95% similarity match reuses a prior answer |
| 4. RAG retrieval | `rag_service.py` (+ keyword fusion) | No | Qdrant `diu_kb` |
| 5. Context compression | `context_compression_service.py` | No | Dedupes/merges overlapping retrieved chunks before they reach the prompt |
| 6. LLM generation | `groq_service.py` | **Yes** | Generates the answer, then writes it back into the semantic cache (Layer 3) for future reuse |

- **`question_normalizer.py`** lowercases, strips punctuation/whitespace, and expands a small synonym map (e.g. `"fee"` → `"tuition fee"`, `"cse"` → `"computer science"`) so near-identical phrasings collapse to the same cache key.
- **Popularity promotion:** FAQ/semantic-cache entries above a hit-count threshold (`POPULAR_HIT_THRESHOLD`) are marked permanent so they're never evicted.
- **Cache invalidation:** when a source document changes, any semantic-cache entries derived from it are automatically invalidated so stale answers are never served.
- **`kb_query_log`** records which layer answered each query and the tokens saved, feeding the admin "AI Pipeline" dashboard's cache-hit-ratio and tokens-saved metrics.

## 3. New API Surface

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/pipeline/sync` | Sync one source (`?source=`) or all sources |
| POST | `/api/v1/pipeline/rebuild` | Full re-crawl + full Qdrant rebuild (admin) |
| GET | `/api/v1/pipeline/status` | Sources, last sync time, vector counts, embedding status |
| GET | `/api/v1/pipeline/scheduler` | Scheduler jobs + next-run times |
| GET | `/api/v1/admin/dashboard` | Sync/cache/token metrics for the admin "AI Pipeline" tab |
| GET | `/api/v1/admin/sources` | Per-source sync health + failed pages |
| GET | `/api/v1/admin/logs` | Recent `kb_event_log` entries |
| GET | `/api/v1/admin/popular-questions` | Top questions by hit count |
| GET/POST | `/api/v1/faculty/...` | Faculty directory data (from `faculty_scraper_service`) |
| GET/POST | `/api/v1/tuition/...` | Tuition fee data (from `tuition_fee_service`) |

## 4. Reliability

Failed fetches retry with exponential backoff and mark `consecutive_failures` on the source without blocking other sources; a 304/timeout/5xx is treated as "keep last-known data"; a mid-sync embedding/Qdrant failure marks the sync run `partial` and is retried on the next tick — the chat pipeline's existing graceful-degradation guarantees (see below) are unaffected either way.

---

## Summary of All Key Technologies

| Layer | Technology | Purpose |
|---|---|---|
| Frontend UI | React 18, Tailwind CSS | SPA interface |
| Authentication | Firebase Google OAuth | Secure login |
| REST Gateway | Spring Boot 3.2, Java 21 | API proxy, data persistence |
| AI Orchestration | Flask, Gunicorn | AI service routing |
| LLM | Groq `llama-3.3-70b-versatile` | Language generation |
| Vision AI | Groq `llama-4-scout-17b` | OCR / image analysis |
| Embeddings | Google Gemini `gemini-embedding-001` | Semantic vector creation |
| Vector Search | Qdrant Cloud | RAG knowledge retrieval |
| Web Scraping | BeautifulSoup4 + lxml | Live university data |
| Relational DB | Supabase Postgres | Student records, forms, leads, audit logs, kb_* pipeline tables |
| DB Access (Python) | psycopg connection pool | AI Knowledge Pipeline reads/writes |
| Live Jobs | JSearch RapidAPI | Real job listings |
| PDF Export | jspdf + html2canvas | CV generation |
| Voice | Web Speech API | Hands-free interaction |
| Admin Analytics UI | React (recharts) | Admin dashboard charts/KPIs |
| Visitor Analytics | Microsoft Clarity Data Export API | Real session/traffic metrics in admin |
| Scheduling | APScheduler / GitHub Actions (`kb-sync.yml`) | Periodic knowledge-base sync |
| Deployment | Render.com | Cloud hosting |

---

## Environment Variables Reference

### Python AI Service

```
GROQ_API_KEY, GROQ_API_KEY_2, GROQ_API_KEY_3
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
GEMINI_API_KEY
GEMINI_EMBED_MODEL=gemini-embedding-001
QDRANT_URL, QDRANT_API_KEY
QDRANT_COLLECTION=diu_kb
QDRANT_SEMCACHE_COLLECTION=diu_semcache
RAG_ENABLED=true
RAG_TOP_K=6
RAG_MIN_SCORE=0.30
RAPIDAPI_KEY
FLASK_ENV=production
MAX_TOKENS=1024

# AI Knowledge Pipeline
DATABASE_URL=postgresql://...          # Supabase session-pooler URL (same DB as Spring)
REDIS_URL=                             # optional; blank -> in-proc cache + advisory lock
SEMANTIC_CACHE_THRESHOLD=0.95
SCHEDULER_ENABLED=true
POPULAR_HIT_THRESHOLD=10
SYNC_ADMISSION_INTERVAL=900
SYNC_NOTICE_INTERVAL=300
SYNC_FEES_INTERVAL=3600
SYNC_DEPARTMENT_INTERVAL=86400
```

### Spring Boot (Production)

```
SPRING_PROFILES_ACTIVE=prod
DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD   # Supabase Postgres
PYTHON_SERVICE_URL=http://python-service:5000
CORS_ALLOWED_ORIGINS
JWT_SECRET
MAIL_USERNAME, MAIL_PASSWORD
ADMIN_EMAIL, ADMIN_PASSWORD                            # admin portal login, re-synced on boot
```

### React Frontend

```
REACT_APP_API_URL
REACT_APP_AI_URL
REACT_APP_TIMEOUT=30000
REACT_APP_DEBUG=false
```

---

## Database Schema (Spring Boot Entities)

**Location:** `backend-spring-boot/src/main/java/com/university/model/entity/`

| Entity | Purpose |
|---|---|
| `User.java` | JWT authentication, student/admin accounts |
| `AdmissionApplication.java` | Pre-registration and admit card form data |
| `AdmittedStudent.java` | Confirmed enrolled students |
| `CourseRegistrationRecord.java` | Semester course selections |
| `LateRegistrationRecord.java` | Late registration tracking |
| `Payment.java` | Fee payment records |
| `ScholarshipApplication.java` | Waiver and scholarship applications |
| `JobListing.java` | Stored job listings |
| `Notice.java` | University announcements |
| `StudentProfile.java` | Extended student profile data |
| `StudentNotification.java` | In-app notifications |
| `Lead.java` | CRM lead captured from public forms (admission, contact) |
| `LeadActivity.java` | Follow-up notes / status changes on a `Lead` |
| `Counselor.java` | Staff member a `Lead` can be assigned to |
| `AdminAuditLog.java` | Admin action audit trail (login, IP, timestamp) |
| `ChatLog.java` | Logged chatbot conversations for Chat Analytics |

**AI Knowledge Pipeline tables** (Supabase, defined in `supabase/migrations/20260708000001_ai_knowledge_pipeline.sql` and later migrations, accessed from Python via `app/repositories/`): `kb_sources`, `kb_documents`, `kb_document_versions`, `kb_chunks`, `kb_faqs`, `kb_semantic_cache`, `kb_sync_runs`, `kb_event_log`, `kb_metrics`, `kb_query_log`, plus tuition-fee tables added in `20260708000003_tuition_fees.sql`.
