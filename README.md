# DIU University Automation Platform

> A full-stack, AI-driven automation platform for **Daffodil International University (DIU)** — replacing manual admission, advising, and student-affairs workflows with intelligent, RAG-powered assistants.

[![Frontend](https://img.shields.io/badge/Frontend-React%2018-61DAFB?logo=react&logoColor=white)](#)
[![Backend](https://img.shields.io/badge/Backend-Spring%20Boot%203.2-6DB33F?logo=springboot&logoColor=white)](#)
[![AI Service](https://img.shields.io/badge/AI-Flask%20%2B%20Groq-000000?logo=flask&logoColor=white)](#)
[![Database](https://img.shields.io/badge/DB-PostgreSQL-4169E1?logo=postgresql&logoColor=white)](#)
[![Deploy](https://img.shields.io/badge/Deploy-Render.com-46E3B7?logo=render&logoColor=white)](#)

---

## Overview

The DIU University Automation Platform modernizes how prospective and current students interact with the university. It is built as a **three-tier architecture** combining a React single-page app, a Spring Boot REST gateway, and a Python AI microservice powered by a **Retrieval-Augmented Generation (RAG)** knowledge system.

The RAG system is the project's core innovation: every AI answer is grounded in verified, up-to-date university data — from curated documents, OCR-extracted department flyers, official PDFs, and live-scraped web pages — so the assistants never hallucinate critical facts about DIU.

---

## Core Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Admission Chatbot** | Conversational AI that answers admission questions and **automatically fills official admission forms** through natural conversation (with voice support). |
| 2 | **Smart Advisor** | A full-page AI academic counselor that recommends the best-fit department, calculates fees with waiver policy, and **automatically handles course registration**. |
| 3 | **Job Section** | Live job listings (JSearch API), skill-match scoring, skill-gap analysis, and a **CV builder with PDF export**. |
| 4 | **Smart Proctor** | AI student-affairs assistant for university rules Q&A, structured complaint filing, and appointment booking. |

All AI features support **hands-free voice interaction** via the browser Web Speech API (speech-to-text and text-to-speech).

---

## Architecture

```
  [ React SPA — diu-frontend.onrender.com ]
           |  REST API calls
           v
  [ Spring Boot API — diu-spring-api.onrender.com ]
       |  AI requests              |  DB queries
       v                           v
  [ Flask AI Service ]        [ PostgreSQL DB ]
  [ Groq + RAG + Jobs ]       [ university_automation ]
       |  vectors
       v
  [ Qdrant Cloud ]  <--  [ Google Gemini Embeddings ]
  [ diu_kb collection ]
```

---

## Technology Stack

### Frontend — React 18 SPA
- **React 18.2** with React Router DOM v6
- **Tailwind CSS 3.3** for responsive styling
- **Firebase 12** — Google OAuth authentication
- **html2canvas + jsPDF** — CV/report PDF generation
- **Axios** HTTP client · **Web Speech API** for voice

### Backend — Spring Boot (Java 21)
- **Spring Boot 3.2** with Spring Data JPA / Hibernate
- **Spring Security + JWT** (jjwt) — stateless auth
- **PostgreSQL** (production) / **H2** (local dev)
- **Spring Mail** via Gmail SMTP · **Maven** build
- Acts as the central REST API gateway and persistence layer

### Backend — Python Flask (AI Microservice)
- **Flask 3.0** served by **Gunicorn**
- **LLM:** Groq `llama-3.3-70b-versatile` (3 keys for load balancing)
- **Vision:** Groq `llama-4-scout-17b` (department flyer OCR)
- **Embeddings:** Google Gemini `gemini-embedding-001` (768-dim)
- **Vector DB:** Qdrant Cloud (cosine similarity over `diu_kb`)
- **Scraping:** BeautifulSoup4 + lxml · **PDF:** pypdf + PIL

### Infrastructure
- **Render.com** (3 services) · **Docker Compose** for local dev
- **JSearch (RapidAPI)** for live job listings

---

## The RAG System

Every user message flows through a retrieval pipeline before any answer is generated:

```
User question
   -> Gemini embeds query (RETRIEVAL_QUERY, 768-dim)
   -> Qdrant cosine search over diu_kb (top-6, min score 0.30)
   -> Retrieved chunks injected into Groq system prompt
   -> Groq LLM generates a grounded, language-aware answer
   -> Response displayed (and optionally spoken aloud)
```

**Four knowledge sources** feed the vector store:
1. **Curated seed documents** — leadership, 51 programs, faculty, waiver policy, eligibility, curricula
2. **Department flyer OCR** — images processed by the Groq vision model into structured JSON
3. **Official PDFs** — `waiver-policy2025.pdf`, `application_instruction.pdf` (chunked 1,200 chars / 180 overlap)
4. **Live web scraping** — DIU scholarship, tuition, and faculty pages (1-hour cache TTL)

**Graceful degradation** keeps the chat working even when parts of the pipeline fail (Qdrant down, no matches, embedding errors, or rate-limited Groq keys all fall back cleanly).

---

## Project Structure

```
DIU/
├── frontend-react/          # React 18 SPA
│   └── src/
│       ├── components/      # Chatbot, Smart Advisor, Jobs, Proctor, admin
│       ├── hooks/           # useVoice and others
│       └── services/        # API clients
├── backend-spring-boot/     # Spring Boot REST gateway (Java 21)
│   └── src/main/java/com/university/
├── backend-python/          # Flask AI microservice
│   └── app/
│       ├── routes/          # ai_routes, jobs_routes
│       ├── services/        # rag_service, vector_store, embedding, scraper
│       └── data/            # departments_dataset.json
├── database/                # SQL schema and seeds
├── supabase/                # Supabase migrations
├── docker-compose.yml       # Local multi-service orchestration
├── render.yaml              # Render.com deployment config
└── start-dev.bat            # Windows local dev launcher
```

---

## Getting Started

### Prerequisites
- **Node.js 18+** and npm
- **Java 21** and Maven
- **Python 3.10+**
- **Docker** (optional, for containerized local dev)
- API keys: Groq, Google Gemini, Qdrant Cloud, RapidAPI (JSearch)

### 1. Clone the repository
```bash
git clone <repository-url>
cd DIU
```

### 2. Configure environment variables
Create the appropriate `.env` files for each service (see [Environment Variables](#environment-variables)).

### 3. Run with Docker Compose
```bash
docker-compose up --build
```

### 4. Or run each service manually

**Python AI Service** (port 5000)
```bash
cd backend-python
python -m venv venv
venv/Scripts/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

**Spring Boot API** (port 8080)
```bash
cd backend-spring-boot
mvn spring-boot:run
```

**React Frontend** (port 3000)
```bash
cd frontend-react
npm install
npm start
```

### Windows quick start
On Windows, you can launch the AI backend and frontend together:
```bash
start-dev.bat
```
- App: http://localhost:3000
- AI backend: http://localhost:5000

---

## Environment Variables

### Python AI Service
```
GROQ_API_KEY, GROQ_API_KEY_2, GROQ_API_KEY_3
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
GEMINI_API_KEY
GEMINI_EMBED_MODEL=gemini-embedding-001
QDRANT_URL, QDRANT_API_KEY
QDRANT_COLLECTION=diu_kb
RAG_ENABLED=true
RAG_TOP_K=6
RAG_MIN_SCORE=0.30
RAPIDAPI_KEY
FLASK_ENV=production
MAX_TOKENS=1024
```

### Spring Boot (Production)
```
SPRING_PROFILES_ACTIVE=prod
DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD
PYTHON_SERVICE_URL=http://python-service:5000
CORS_ALLOWED_ORIGINS
JWT_SECRET
MAIL_USERNAME, MAIL_PASSWORD
```

### React Frontend
```
REACT_APP_API_URL
REACT_APP_AI_URL
REACT_APP_TIMEOUT=30000
REACT_APP_DEBUG=false
```

---

## Key API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/v1/ai/process` | Admission chatbot (RAG + form filling) |
| `POST` | `/api/v1/ai/smart-advisor` | Smart Advisor (uses Groq key 2) |
| `POST` | `/api/v1/ai/smart-proctor` | Smart Proctor (uses Groq key 3) |
| `GET`  | `/api/v1/jobs/search` | Internal job search |
| `GET`  | `/api/v1/jobs/external` | Live JSearch listings (with fallback) |

---

## Database Entities

Located in `backend-spring-boot/src/main/java/com/university/model/entity/`:

`User` · `AdmissionApplication` · `AdmittedStudent` · `CourseRegistrationRecord` · `LateRegistrationRecord` · `Payment` · `ScholarshipApplication` · `JobListing` · `Notice`

---

## Documentation

- **[Documentation.md](Documentation.md)** — complete technical documentation
- **[ADMIN_PORTAL_SETUP.md](ADMIN_PORTAL_SETUP.md)** — admin portal & RBAC setup
- **[PROJECT_MEMORY.md](PROJECT_MEMORY.md)** — project history and decisions

---

## License

This project was developed for academic purposes at Daffodil International University.

---

<p align="center"><i>Built for Daffodil International University</i></p>
```