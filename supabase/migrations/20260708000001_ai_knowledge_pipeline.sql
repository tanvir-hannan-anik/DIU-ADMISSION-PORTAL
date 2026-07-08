-- ============================================================================
--  DIU AI Knowledge Pipeline & RAG System — Schema
--  Supabase / PostgreSQL 15
--  Run once in: Supabase Dashboard → SQL Editor → New query
--
--  Design of record. The Python service (backend-python) reads/writes these
--  tables via a thin psycopg client (see AI_KNOWLEDGE_PIPELINE.md). This is the
--  "schema" deliverable — we are Python-native, so this SQL replaces Prisma.
--  A SQLAlchemy model mirror ships in Phase 1 (app/models/kb_models.py).
--
--  Prefix convention: every pipeline table is `kb_*` so it never collides with
--  the existing application tables (users, payments, notices, …).
-- ============================================================================

-- Needed for gen_random_uuid(). (pgcrypto ships with Supabase.)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 1. SOURCES ───────────────────────────────────────────────────────────────
--  The 5 website sources + their per-source sync cadence and parser binding.
CREATE TABLE IF NOT EXISTS kb_sources (
    id                   SERIAL PRIMARY KEY,
    name                 TEXT NOT NULL,
    url                  TEXT NOT NULL UNIQUE,
    source_type          TEXT NOT NULL DEFAULT 'html'   CHECK (source_type IN ('html', 'api')),
    category             TEXT NOT NULL,                  -- admission | fees | faculty | faculties | homepage | scholarship | notice | department
    parser               TEXT NOT NULL,                  -- parser function key in web_scraper_service
    sync_interval_seconds INTEGER NOT NULL DEFAULT 3600, -- per-source cadence
    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    -- HTTP conditional-GET hints (cheap change detection before full parse)
    etag                 TEXT,
    last_modified        TEXT,
    last_synced_at       TIMESTAMPTZ,
    last_status          TEXT,                           -- success | partial | failed
    consecutive_failures INTEGER NOT NULL DEFAULT 0,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. DOCUMENTS ─────────────────────────────────────────────────────────────
--  One row per meaningful content unit (a page section, a fee block, a policy
--  chunk parent). `content_hash` (SHA-256) drives change detection.
--  `structured_data` holds category-specific fields (fees, eligibility, …) so
--  we do NOT fragment into one table per category.
CREATE TABLE IF NOT EXISTS kb_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id       INTEGER REFERENCES kb_sources(id) ON DELETE CASCADE,
    source_url      TEXT NOT NULL,
    natural_key     TEXT NOT NULL,          -- stable identity within a source (url#section-slug)
    title           TEXT,
    category        TEXT NOT NULL,          -- admission | fees | scholarship | eligibility | faculty | department | notice | faq | general
    content         TEXT NOT NULL,
    structured_data JSONB,                  -- category-specific structured fields
    content_hash    CHAR(64) NOT NULL,      -- sha256(normalized content)
    version         INTEGER NOT NULL DEFAULT 1,
    token_estimate  INTEGER,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (source_id, natural_key)
);
CREATE INDEX IF NOT EXISTS idx_kb_documents_hash     ON kb_documents(content_hash);
CREATE INDEX IF NOT EXISTS idx_kb_documents_category ON kb_documents(category, is_active);
CREATE INDEX IF NOT EXISTS idx_kb_documents_source   ON kb_documents(source_id, is_active);

-- ── 3. DOCUMENT VERSIONS ─────────────────────────────────────────────────────
--  Full audit trail. A new row is written every time content_hash changes.
CREATE TABLE IF NOT EXISTS kb_document_versions (
    id            BIGSERIAL PRIMARY KEY,
    document_id   UUID NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
    version       INTEGER NOT NULL,
    content_hash  CHAR(64) NOT NULL,
    content       TEXT,
    change_type   TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'deactivated', 'reactivated')),
    diff_summary  TEXT,
    changed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kb_doc_versions_doc ON kb_document_versions(document_id, version DESC);

-- ── 4. CHUNKS  (document → Qdrant vector mapping) ────────────────────────────
--  Enables incremental vector maintenance: we know exactly which vector ids
--  belong to a document, so we delete-changed / insert-new instead of a full
--  collection rebuild.
CREATE TABLE IF NOT EXISTS kb_chunks (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id    UUID NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
    chunk_index    INTEGER NOT NULL,
    vector_id      UUID NOT NULL,          -- Qdrant point id (uuid5 of document_id:chunk_index)
    content_hash   CHAR(64) NOT NULL,      -- hash of the chunk text (skip re-embed if unchanged)
    token_estimate INTEGER,
    embedded_at    TIMESTAMPTZ,
    UNIQUE (document_id, chunk_index)
);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_doc ON kb_chunks(document_id);

-- ── 5. DEPARTMENTS (structured — Website 4 /faculties + dataset) ─────────────
CREATE TABLE IF NOT EXISTS kb_departments (
    id             SERIAL PRIMARY KEY,
    short_name     TEXT,
    name           TEXT NOT NULL UNIQUE,
    school         TEXT,                   -- faculty/school it belongs to
    degree         TEXT,
    duration       TEXT,
    total_credit   TEXT,
    semester_fee   TEXT,
    total_fee      TEXT,
    admission_fee  TEXT,
    overview       TEXT,
    eligibility    TEXT,
    career_opportunities TEXT,
    raw            JSONB,
    content_hash   CHAR(64),
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. FACULTY (structured — Website 3 faculty.daffodilvarsity.edu.bd) ───────
CREATE TABLE IF NOT EXISTS kb_faculty (
    id             SERIAL PRIMARY KEY,
    name           TEXT NOT NULL,
    department     TEXT,
    designation    TEXT,
    email          TEXT,
    phone          TEXT,
    profile_url    TEXT UNIQUE,
    qualifications TEXT,
    research_interest TEXT,
    publications   TEXT,
    raw            JSONB,
    content_hash   CHAR(64),
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kb_faculty_dept ON kb_faculty(department, is_active);

-- ── 7. FAQs  (Token-optimization Layer 2) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS kb_faqs (
    id                  SERIAL PRIMARY KEY,
    question            TEXT NOT NULL,
    normalized_question TEXT NOT NULL,      -- lowercased, punctuation-stripped
    answer              TEXT NOT NULL,
    category            TEXT,
    keywords            TEXT[],
    source_document_id  UUID REFERENCES kb_documents(id) ON DELETE SET NULL,
    hit_count           INTEGER NOT NULL DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kb_faqs_norm ON kb_faqs(normalized_question);
CREATE INDEX IF NOT EXISTS idx_kb_faqs_kw   ON kb_faqs USING GIN (keywords);

-- ── 8. SEMANTIC CACHE  (Layer 3 — PG mirror; vectors live in Qdrant semcache) ─
--  Vectors are stored in a dedicated Qdrant collection for >=95% match lookups.
--  This mirror exists for popularity tracking + targeted cache invalidation.
CREATE TABLE IF NOT EXISTS kb_semantic_cache (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vector_id           UUID NOT NULL,      -- Qdrant point id in semcache collection
    question            TEXT NOT NULL,
    normalized_question TEXT NOT NULL,
    answer              TEXT NOT NULL,
    category            TEXT,
    source_doc_ids      UUID[],             -- documents this answer was grounded on → drives invalidation
    hit_count           INTEGER NOT NULL DEFAULT 1,
    is_permanent        BOOLEAN NOT NULL DEFAULT FALSE, -- promoted popular Q → never evicted
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kb_semcache_srcdocs ON kb_semantic_cache USING GIN (source_doc_ids);
CREATE INDEX IF NOT EXISTS idx_kb_semcache_hits    ON kb_semantic_cache(hit_count DESC);

-- ── 9. QUERY LOG  (analytics, popular questions, token savings) ──────────────
CREATE TABLE IF NOT EXISTS kb_query_log (
    id                  BIGSERIAL PRIMARY KEY,
    question            TEXT,
    normalized_question TEXT,
    answer_source       TEXT,               -- intent | faq | semantic_cache | rag_llm | fallback
    matched_layer       INTEGER,            -- 1..6
    similarity          REAL,
    tokens_prompt       INTEGER DEFAULT 0,
    tokens_completion   INTEGER DEFAULT 0,
    tokens_saved        INTEGER DEFAULT 0,  -- estimated tokens avoided by a cache/faq hit
    latency_ms          INTEGER,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kb_query_log_src  ON kb_query_log(answer_source, created_at);
CREATE INDEX IF NOT EXISTS idx_kb_query_log_norm ON kb_query_log(normalized_question);

-- ── 10. SYNC RUNS  (per-source pipeline execution record) ────────────────────
CREATE TABLE IF NOT EXISTS kb_sync_runs (
    id                    BIGSERIAL PRIMARY KEY,
    source_id             INTEGER REFERENCES kb_sources(id) ON DELETE SET NULL,
    started_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at           TIMESTAMPTZ,
    status                TEXT,             -- running | success | partial | failed
    pages_fetched         INTEGER DEFAULT 0,
    pages_changed         INTEGER DEFAULT 0,
    pages_unchanged       INTEGER DEFAULT 0,
    pages_failed          INTEGER DEFAULT 0,
    docs_upserted         INTEGER DEFAULT 0,
    embeddings_generated  INTEGER DEFAULT 0,
    vectors_upserted      INTEGER DEFAULT 0,
    vectors_deleted       INTEGER DEFAULT 0,
    cache_entries_invalidated INTEGER DEFAULT 0,
    error                 TEXT
);
CREATE INDEX IF NOT EXISTS idx_kb_sync_runs_source ON kb_sync_runs(source_id, started_at DESC);

-- ── 11. METRICS  (durable counter snapshot; Redis is runtime source of truth) ─
CREATE TABLE IF NOT EXISTS kb_metrics (
    metric_key   TEXT PRIMARY KEY,          -- total_api_calls | total_llm_calls | cache_hits | cache_misses | tokens_saved | embeddings_generated
    metric_value BIGINT NOT NULL DEFAULT 0,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 12. EVENT LOG  (structured logging sink for errors & key events) ─────────
CREATE TABLE IF NOT EXISTS kb_event_log (
    id         BIGSERIAL PRIMARY KEY,
    level      TEXT NOT NULL DEFAULT 'INFO',  -- DEBUG | INFO | WARNING | ERROR
    category   TEXT,                          -- scraping | sync | embedding | cache | llm | db | scheduler | error
    message    TEXT NOT NULL,
    meta       JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kb_event_log_cat ON kb_event_log(category, created_at DESC);

-- ── SEED: the 5 website sources ──────────────────────────────────────────────
INSERT INTO kb_sources (name, url, source_type, category, parser, sync_interval_seconds) VALUES
    ('DIU Admission',      'https://daffodilvarsity.edu.bd/admission',        'html', 'admission',   'parse_admission',   900),   -- 15 min
    ('DIU Tuition Fees',   'https://daffodilvarsity.edu.bd/tuition-fees',     'html', 'fees',        'parse_tuition',     3600),  -- 1 hour
    ('DIU Faculty Dir',    'https://faculty.daffodilvarsity.edu.bd/',         'html', 'faculty',     'parse_faculty',     86400), -- daily
    ('DIU Faculties',      'https://daffodilvarsity.edu.bd/faculties',        'html', 'faculties',   'parse_faculties',   86400), -- daily
    ('DIU Homepage',       'https://daffodilvarsity.edu.bd/',                 'html', 'homepage',    'parse_homepage',    300)    -- 5 min (notices)
ON CONFLICT (url) DO NOTHING;

-- ── SEED: metric counters ────────────────────────────────────────────────────
INSERT INTO kb_metrics (metric_key, metric_value) VALUES
    ('total_api_calls', 0), ('total_llm_calls', 0),
    ('cache_hits', 0), ('cache_misses', 0),
    ('tokens_saved', 0), ('embeddings_generated', 0)
ON CONFLICT (metric_key) DO NOTHING;
