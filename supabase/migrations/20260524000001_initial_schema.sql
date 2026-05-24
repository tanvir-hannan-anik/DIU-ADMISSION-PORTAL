-- ============================================================
--  DIU University Automation — Initial Schema
--  Supabase / PostgreSQL 15
--  Run this once in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── 1. USERS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                 BIGSERIAL PRIMARY KEY,
    email              VARCHAR(255) NOT NULL UNIQUE,
    name               VARCHAR(255),
    password           VARCHAR(255),
    role               VARCHAR(50)  NOT NULL DEFAULT 'student',
    admitted_student_id BIGINT,
    verified           BOOLEAN      NOT NULL DEFAULT FALSE,
    verification_token VARCHAR(255),
    created_at         TIMESTAMP
);

-- ── 2. STUDENT PROFILES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_profiles (
    email              VARCHAR(255) PRIMARY KEY,
    name               VARCHAR(255),
    student_id         VARCHAR(100),
    department         VARCHAR(255),
    semester           VARCHAR(100),
    phone              VARCHAR(50),
    address            TEXT,
    cgpa               DOUBLE PRECISION,
    credits_completed  INTEGER,
    updated_at         TIMESTAMP
);

-- ── 3. ADMITTED STUDENTS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS admitted_students (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    student_id  VARCHAR(100) NOT NULL UNIQUE,
    department  VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    semester    VARCHAR(100)
);

-- ── 4. ADMISSION APPLICATIONS ────────────────────────────────
CREATE TABLE IF NOT EXISTS admission_applications (
    id              BIGSERIAL    PRIMARY KEY,
    app_id          VARCHAR(100) UNIQUE,
    full_name       VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    date_of_birth   VARCHAR(50),
    contact_number  VARCHAR(50),
    program         VARCHAR(100),
    major           VARCHAR(100),
    -- SSC
    ssc_result      VARCHAR(50),
    ssc_group       VARCHAR(100),
    ssc_board       VARCHAR(100),
    ssc_year        VARCHAR(10),
    ssc_marksheet   VARCHAR(500),
    -- HSC
    hsc_result      VARCHAR(50),
    hsc_group       VARCHAR(100),
    hsc_board       VARCHAR(100),
    hsc_year        VARCHAR(10),
    hsc_marksheet   VARCHAR(500),
    -- Schedule
    admission_date  VARCHAR(50),
    viva_date       VARCHAR(50),
    essay_one       TEXT,
    essay_two       TEXT,
    status          VARCHAR(50)  NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMP
);

-- ── 5. PAYMENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id              BIGSERIAL    PRIMARY KEY,
    email           VARCHAR(255) NOT NULL,
    student_id      VARCHAR(100),
    payment_type    VARCHAR(100) NOT NULL,
    amount          BIGINT       NOT NULL,
    status          VARCHAR(50)  NOT NULL DEFAULT 'PENDING',
    transaction_id  VARCHAR(255) UNIQUE,
    payment_method  VARCHAR(50)  NOT NULL DEFAULT 'ONLINE',
    semester        VARCHAR(100),
    description     TEXT,
    paid_at         TIMESTAMP,
    created_at      TIMESTAMP
);

-- ── 6. COURSE REGISTRATIONS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS course_registrations (
    id             BIGSERIAL    PRIMARY KEY,
    email          VARCHAR(255) NOT NULL,
    semester       VARCHAR(100) NOT NULL,
    courses_json   TEXT,
    total_credits  DOUBLE PRECISION,
    total_fee      BIGINT,
    status         VARCHAR(50),
    registered_at  TIMESTAMP
);

-- ── 7. LATE REGISTRATIONS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS late_registrations (
    id             BIGSERIAL    PRIMARY KEY,
    email          VARCHAR(255) NOT NULL,
    semester       VARCHAR(100) NOT NULL,
    courses_json   TEXT,
    reason         TEXT,
    evidence_count INTEGER,
    status         VARCHAR(50),
    submitted_at   TIMESTAMP
);

-- ── 8. SCHOLARSHIP APPLICATIONS ──────────────────────────────
CREATE TABLE IF NOT EXISTS scholarship_applications (
    id               BIGSERIAL    PRIMARY KEY,
    email            VARCHAR(255) NOT NULL,
    student_name     VARCHAR(255),
    student_id       VARCHAR(100),
    department       VARCHAR(255) NOT NULL,
    scholarship_type VARCHAR(100) NOT NULL,
    gpa              DOUBLE PRECISION,
    semester         VARCHAR(100),
    reason           TEXT,
    supporting_docs  VARCHAR(1000),
    status           VARCHAR(50)  NOT NULL DEFAULT 'SUBMITTED',
    reviewer_note    TEXT,
    awarded_amount   BIGINT,
    applied_at       TIMESTAMP,
    reviewed_at      TIMESTAMP
);

-- ── 9. NOTICES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notices (
    id          BIGSERIAL    PRIMARY KEY,
    title       VARCHAR(500) NOT NULL,
    content     TEXT         NOT NULL,
    type        VARCHAR(50)  NOT NULL DEFAULT 'INFO',
    target_role VARCHAR(50)           DEFAULT 'all',
    created_by  VARCHAR(255),
    expires_at  TIMESTAMP,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP
);

-- ── 10. STUDENT NOTIFICATIONS ────────────────────────────────
CREATE TABLE IF NOT EXISTS student_notifications (
    id          BIGSERIAL    PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    title       VARCHAR(500) NOT NULL,
    message     TEXT         NOT NULL,
    type        VARCHAR(50)  NOT NULL DEFAULT 'INFO',
    is_read     BOOLEAN      NOT NULL DEFAULT FALSE,
    action_url  VARCHAR(500),
    created_at  TIMESTAMP
);

-- ── 11. JOB LISTINGS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_listings (
    id          BIGSERIAL    PRIMARY KEY,
    title       VARCHAR(500) NOT NULL,
    company     VARCHAR(255) NOT NULL,
    location    VARCHAR(255) NOT NULL,
    type        VARCHAR(100),
    salary      VARCHAR(255),
    url         VARCHAR(1000),
    description TEXT,
    logo        VARCHAR(1000),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN      NOT NULL DEFAULT FALSE,
    category    VARCHAR(100),
    posted_at   TIMESTAMP
);

-- ── INDEXES ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email                   ON users(email);
CREATE INDEX IF NOT EXISTS idx_payments_email                ON payments(email);
CREATE INDEX IF NOT EXISTS idx_payments_student_id           ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_reg_email              ON course_registrations(email);
CREATE INDEX IF NOT EXISTS idx_late_reg_email                ON late_registrations(email);
CREATE INDEX IF NOT EXISTS idx_scholarship_email             ON scholarship_applications(email);
CREATE INDEX IF NOT EXISTS idx_notifications_email           ON student_notifications(email);
CREATE INDEX IF NOT EXISTS idx_notifications_unread          ON student_notifications(email, is_read);
CREATE INDEX IF NOT EXISTS idx_admission_apps_email          ON admission_applications(email);
CREATE INDEX IF NOT EXISTS idx_admitted_students_email       ON admitted_students(email);
CREATE INDEX IF NOT EXISTS idx_admitted_students_student_id  ON admitted_students(student_id);
CREATE INDEX IF NOT EXISTS idx_notices_active                ON notices(is_active, target_role);
CREATE INDEX IF NOT EXISTS idx_job_listings_active           ON job_listings(is_active, category);

-- ── SEED: default admin user ──────────────────────────────────
-- Password hash for "Admin@DIU2024" (BCrypt)
INSERT INTO users (email, name, password, role, verified, created_at)
VALUES (
    'admin@daffodilvarsity.edu.bd',
    'DIU Admin',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'admin',
    TRUE,
    NOW()
)
ON CONFLICT (email) DO NOTHING;
