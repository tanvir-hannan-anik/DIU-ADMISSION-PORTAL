# DIU University Automation Website — Project Memory

> Auto-updated on every commit. Last updated: **2026-06-27**

---

## Latest Change (2026-05-24) — Voice Chat System

Added full voice chat to all 3 AI chatbots via new `useVoice` hook (`src/hooks/useVoice.js`).

**New file:** `frontend-react/src/hooks/useVoice.js`
- Web Speech API: `SpeechRecognition` (voice input) + `SpeechSynthesis` (TTS output)
- No external libraries — pure browser APIs
- Works in Chrome, Edge, Safari (desktop & mobile)

**Voice features per chatbot:**

| Feature | ChatbotWidget | SmartAdvisor | SmartProctor |
|---|---|---|---|
| Mic button (speech-to-text) | ✅ In input bar | ✅ In input bar | ✅ In input bar |
| Voice output toggle (TTS) | ✅ In header | ✅ "Voice Mode" footer | ✅ In header |
| Auto-speak bot responses | ✅ | ✅ | ✅ |
| Form fill via voice | ✅ Auto-sends in formMode | N/A | N/A |
| Auto-send on speech | formMode only | ✅ Always | ✅ Always |
| Interim transcript in input | ✅ | ✅ | ✅ |

**Key behavior:**
- `volume_off` / `volume_down` / `volume_up` icon in header shows TTS state
- Mic button turns red + pulses while listening, shows `mic_off` icon
- Bot text stripped of markdown symbols before TTS (sounds clean)
- Max 500 chars read aloud per response
- In ChatbotWidget form-fill mode: speaking an answer auto-submits it (no need to press Send)

---

## What This Project Is

A full-stack **university automation web app** for Daffodil International University (DIU).
It covers the entire student lifecycle: admission → registration → course payment → graduation tools.

**Live deployment:** Render.com (3 services — see Architecture)

---

## Architecture

```
frontend-react/          ← React 18 SPA (Tailwind CSS, deployed as Render static site)
backend-spring-boot/     ← Java 21 Spring Boot REST API (Docker on Render)
backend-python/          ← Flask AI microservice (Groq LLM + Qdrant RAG, Render native)
database/                ← PostgreSQL (Render free DB: university_automation)
```

### Service URLs (Render)
| Service | Name | Runtime |
|---|---|---|
| Frontend | `diu-frontend` | Static (React build) |
| Spring API | `diu-spring-api` | Docker (Java 21) |
| AI Service | `diu-ai-service` | Python (gunicorn) |
| Database | `diu-db` | PostgreSQL (free plan) |

### Local Dev
- Spring Boot uses **H2 in-memory DB** when `SPRING_PROFILES_ACTIVE` ≠ `prod`
- Python service runs directly with Flask dev server
- Frontend proxies API calls via `REACT_APP_API_URL` and `REACT_APP_AI_URL`

---

## Frontend Pages & Routes

| Route | Component | Auth Required |
|---|---|---|
| `/` or `/dashboard` | Dashboard | No |
| `/login` | LoginPage | Guest only |
| `/register` | RegisterPage | Guest only |
| `/set-password` | SetPasswordPage | No |
| `/pre-register` | PreRegisterPage | No |
| `/admit-card` | OnlineAdmitPage | No |
| `/admission/payment` | PaymentPage | No |
| `/admission/confirmation` | RegistrationConfirmPage | No |
| `/admission/id-card` | StudentIDCardPage | No |
| `/course-registration` | CourseRegistrationPage | Yes |
| `/late-registration` | LateRegistrationPage | Yes |
| `/course-payment` | CoursePaymentPage | Yes |
| `/profile` | ProfilePage | Yes |
| `/facilities` | FacilitiesPage | No |
| `/faculty` | FacultyPage | No |
| `/scholarship` | ScholarshipPage | No |
| `/jobs` | JobsPage | Yes |
| `/smart-proctor` | SmartProctorPage | Yes |

### Frontend Component Groups
`auth` · `dashboard` · `admission` · `admit` · `preregister` · `student` · `facilities` · `faculty` · `scholarship` · `jobs` · `proctor` · `accounts` · `admin` · `common`

### Frontend Services
`admissionService.js` · `aiService.js` · `api.js` · `authService.js` · `jobService.js`  
`noticeService.js` · `notificationService.js` · `paymentService.js` · `scholarshipService.js` · `studentDataService.js`

---

## Backend — Spring Boot Controllers

| Controller | Responsibility |
|---|---|
| `AuthController` | JWT login, register, set-password, Firebase Google auth |
| `AdmissionController` | Pre-registration, admit card, admission flow |
| `StudentDataController` | Student profile, course history |
| `PaymentController` | Flexible payment system (admission + course fees) |
| `ScholarshipController` | Scholarship eligibility & applications |
| `NoticeController` | University notices/announcements |
| `NotificationController` | In-app notifications |
| `JobListingController` | Job listings (proxies JSearch RapidAPI) |
| `AIController` | Bridges frontend → Python AI service |

---

## Backend — Python AI Microservice

**Routes:** `ai_routes.py` · `jobs_routes.py` · `ingestion_routes.py` · `health_routes.py`

**Services:**
| Service | Purpose |
|---|---|
| `groq_service.py` | Groq LLM calls (llama-3.3-70b-versatile) |
| `rag_service.py` | Retrieval-Augmented Generation pipeline |
| `vector_store_service.py` | Qdrant vector DB integration |
| `embedding_service.py` | Text embedding for RAG |
| `knowledge_base_service.py` | DIU department knowledge base |
| `ingestion_service.py` | Document ingestion pipeline (PDF, text) |
| `rag_knowledge_seed.py` | Seeds initial DIU knowledge into Qdrant |

**LLM stack:** Groq API (3 API keys for load balancing) · `llama-3.3-70b-versatile` model  
**Vector DB:** Qdrant (for RAG)  
**Chatbot modes:** (1) General AI chat · (2) DIU knowledge-base RAG chat

---

## Key Features

### Admission Flow
1. Pre-register → receive admit card
2. Online admit card download
3. Admission payment (flexible amounts/installments)
4. Registration confirmation
5. Student ID card generation

### Student Portal
- Course registration with **prerequisite enforcement**
- Late registration support
- Course payment
- Profile management with photo sync

### AI Features
- **Chatbot** (two modes): general AI + DIU-specific RAG Q&A
- **Smart Advisor**: course/career advisor (post-payment flow)
- **Smart Proctor**: exam proctoring page
- File upload for chatbot context
- Form auto-fill via AI

### Admin & Accounts
- Admin panel
- Accounts panel
- Notice management

### Info Pages
- Facilities & Transport (redesigned)
- Faculty directory (PESS faculty updated)
- Library catalogue
- Scholarship page
- Jobs page with **CV builder** (JSearch RapidAPI for live jobs)

### Auth
- JWT-based auth
- Firebase Google OAuth
- Set-password flow for new admits

---

## External APIs & Services

| Service | Used For |
|---|---|
| Groq API | LLM inference (3 keys) |
| Qdrant | Vector store for RAG |
| Firebase | Google OAuth |
| JSearch (RapidAPI) | Live job listings |
| Render.com | Hosting (all 3 services + DB) |

---

## Environment Variables

### Spring Boot (prod)
`DB_HOST` · `DB_PORT` · `DB_NAME` · `DB_USERNAME` · `DB_PASSWORD`  
`JWT_SECRET` · `PYTHON_SERVICE_URL` · `CORS_ALLOWED_ORIGINS`  
`MAIL_USERNAME` · `MAIL_PASSWORD` · `SPRING_PROFILES_ACTIVE=prod`

### Python AI Service
`GROQ_API_KEY` · `GROQ_API_KEY_2` · `GROQ_API_KEY_3`  
`GROQ_MODEL=llama-3.3-70b-versatile` · `RAPIDAPI_KEY`  
`FLASK_ENV=production` · `LOG_LEVEL=INFO` · `MAX_TOKENS=2048`

### React Frontend
`REACT_APP_API_URL` · `REACT_APP_AI_URL`

---

## Commit History (Newest First)

| Date | Commit | What Changed |
|---|---|---|
| 2026-06-27 | `b44ebbb` | **Admin Phase 1 — Lead/CRM:** Lead/Counselor entities, public `/v1/leads` capture (admission submit auto-creates a lead), admin `/leads` `/stats` `/applications`; Leads + Applications pages; dashboard KPIs live from DB; clearer login errors |
| 2026-06-27 | `30ff60e` | **Admin portal:** role-based auth + audit logging (Spring), dark analytics dashboard at `/admin` (React/recharts), seeded admin account; switch Supabase to Session Pooler (IPv4) in render.yaml; add setup guide + Supabase MCP |
| 2026-06-?? | `7bee765` | Migrate to Supabase DB, add live RAG scraper, voice chat, structured chatbot templates |
| 2026-05-15 | `6aac318` | Add Qdrant RAG integration, Firebase Google auth, compact auth UI, cleaner AI response formatting |
| 2026-05-03 | `ef334b4` | Add JSearch live jobs API, fix chatbot two-mode system, update PESS faculty data |
| 2026-04-20 | `61b5f8e` | **DB migration:** MySQL → PostgreSQL (Render free DB); H2 for local dev |
| 2026-04-20 | `4a7712e` | Add DB env vars to render.yaml for diu-spring-api |
| 2026-04-20 | `8e52988` | Fix NPE bugs in PaymentController, ScholarshipController, NoticeController |
| 2026-04-18 | `238f77f` | Add Smart Proctor page, file upload for chatbots, form auto-fill, UI redesigns |
| 2026-04-18 | `fb7992b` | Redesign Facilities & Transport UI, add Jobs page with CV builder, fix deploy config |
| 2026-04-16 | `ab71c97` | Flexible payment system, prerequisite enforcement, post-payment Smart Advisor flow |
| 2026-04-14 | `aabea91` | Bug fixes, SEO optimisation, DIU logo, functional search & notifications |
| 2026-04-12 | `6fd4177` | Add Scholarship page, fix Navigation active links, profile photo sync |
| 2026-04-12 | `b5465a3` | Add Facilities & Faculty pages, Library catalogue, Smart Advisor improvements, dashboard cards |
| 2026-04-11 | `d4f5f77` | Fix Docker build context for Render and docker-compose |
| 2026-04-11 | `5f40bfc` | Fix Render Spring Boot Docker build context |
| 2026-04-11 | `316db6e` | Major update: auth system, mobile UI, Student ID card generator, cleanup |
| 2026-04-10 | `226c698` | Remove deepseek_service.py (had exposed API key — security fix) |
| 2026-04-10 | `cd6474e` | Auth system, UI redesigns, Smart Advisor fullscreen, Late Registration, Admin/Accounts panels |
| 2026-04-09 | `60a8924` | Fix render.yaml: switch to llama-3.1-8b-instant, add REACT_APP_AI_URL for frontend |
| 2026-04-09 | `8a66caa` | Add auth system, AI chatbot with dept knowledge base, ingestion pipeline, UI overhaul |
| 2026-04-04 | `1fb1e54` | Fix port binding: use Render's $PORT env var, suppress JPA warnings |
| 2026-04-04 | `5f448ee` | Fix Dockerfile COPY paths for Render build context |
| 2026-04-04 | `b88e7b7` | Fix Dockerfile: replace eclipse-temurin:21-jre-slim → 21-jre-jammy |
| 2026-04-04 | `68a1692` | Replace decommissioned mixtral model with llama-3.3-70b-versatile |
| 2026-04-04 | `0d04874` | Fix AI chatbot: call Python service directly via REACT_APP_AI_URL |
| 2026-04-04 | `6b3c056` | Add root route to Python service |
| 2026-04-04 | `a2c3c3f` | Fix Python service: use native runtime with rootDir |
| 2026-04-04 | `38d2891` | Add Procfile for Python service gunicorn entry point |
| 2026-04-04 | `d277d65` | Add files via upload |
| 2026-04-04 | `518875b` | Switch render.yaml to Docker runtime, fix Dockerfiles for production |
| 2026-04-04 | `47fd65c` | Prepare for Render.com deployment |
| 2026-04-04 | `f8535ac` | **Initial commit:** Add DIU Admission Website project files |

---

## Known Issues / Notes

- Database is Render free plan — spins down after inactivity (cold start delay)
- 3 Groq API keys used for load balancing (rate limit workaround)
- DeepSeek service was removed (commit `226c698`) due to exposed API key in code — never put API keys in source files
- Spring Boot uses Docker on Render (eclipse-temurin:21-jre-jammy base image)
- Python service uses gunicorn with 2 workers, 60s timeout

---

*To update this file after a commit, run:*
```
git log --oneline -1
```
*and add the new row at the top of the Commit History table.*
