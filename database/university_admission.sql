-- ============================================================
--  AI-Powered University Admission System — MySQL Schema
--  Database  : university_admission
--  Charset   : utf8mb4 (full Unicode + emoji support)
--  Engine    : InnoDB (ACID-compliant, FK support)
-- ============================================================

CREATE DATABASE IF NOT EXISTS university_admission
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE university_admission;

-- ============================================================
--  TABLE 1 — users
--  Central identity table. Every person (student or admin)
--  has exactly one row here.
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          INT           UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(120)  NOT NULL,
    email       VARCHAR(180)  NOT NULL,
    password    VARCHAR(255)  NOT NULL,           -- bcrypt hash ($2b$12$...)
    phone       VARCHAR(20)   DEFAULT NULL,
    role        ENUM('student','admin')
                              NOT NULL DEFAULT 'student',
    is_active   TINYINT(1)    NOT NULL DEFAULT 1, -- soft-disable without deleting
    created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Login & registration for all system users';


-- ============================================================
--  TABLE 2 — chat_history
--  Stores every AI chatbot turn.
--  One user can have many conversations (one-to-many).
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_history (
    id          BIGINT        UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id     INT           UNSIGNED NOT NULL,
    session_id  VARCHAR(64)   NOT NULL,           -- groups turns into one conversation
    message     TEXT          NOT NULL,           -- user's message
    response    TEXT          NOT NULL,           -- AI reply
    tokens_used SMALLINT      UNSIGNED DEFAULT 0, -- track LLM cost
    created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_chat_history PRIMARY KEY (id),
    CONSTRAINT fk_chat_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE       -- remove history when user is deleted
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='AI chatbot conversation log';


-- ============================================================
--  TABLE 3 — students
--  Extended academic profile.
--  Exactly one row per user (one-to-one via UNIQUE user_id).
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
    id              INT           UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id         INT           UNSIGNED NOT NULL,
    ssc_gpa         DECIMAL(3,2)  DEFAULT NULL CHECK (ssc_gpa BETWEEN 1.00 AND 5.00),
    hsc_gpa         DECIMAL(3,2)  DEFAULT NULL CHECK (hsc_gpa BETWEEN 1.00 AND 5.00),
    `group`         ENUM('Science','Commerce','Humanities')
                                  DEFAULT NULL,
    interests       VARCHAR(500)  DEFAULT NULL,   -- comma-separated, e.g. "AI, Robotics"
    budget          ENUM(
                        'under_30k',
                        '30k_to_60k',
                        '60k_to_100k',
                        'above_100k'
                    )             DEFAULT NULL,   -- annual tuition range (BDT)
    ssc_board       VARCHAR(60)   DEFAULT NULL,
    hsc_board       VARCHAR(60)   DEFAULT NULL,
    ssc_passing_year YEAR         DEFAULT NULL,
    hsc_passing_year YEAR         DEFAULT NULL,
    date_of_birth   DATE          DEFAULT NULL,
    address         VARCHAR(300)  DEFAULT NULL,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_students PRIMARY KEY (id),
    CONSTRAINT uq_students_user UNIQUE (user_id),   -- enforces one-to-one
    CONSTRAINT fk_students_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Student academic and personal profile';


-- ============================================================
--  TABLE 4 — admissions
--  One admission application per student (one-to-one).
--  Tracks department choice, approval workflow, and payment.
-- ============================================================
CREATE TABLE IF NOT EXISTS admissions (
    id               INT           UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id       INT           UNSIGNED NOT NULL,
    department       VARCHAR(120)  NOT NULL,
    status           ENUM(
                         'pending',
                         'under_review',
                         'approved',
                         'rejected'
                     )             NOT NULL DEFAULT 'pending',
    payment_status   ENUM(
                         'unpaid',
                         'partial',
                         'paid'
                     )             NOT NULL DEFAULT 'unpaid',
    payment_amount   DECIMAL(10,2) DEFAULT NULL,    -- actual amount paid (BDT)
    documents        TEXT          DEFAULT NULL,    -- JSON array of file paths/URLs
    ai_recommendation VARCHAR(300) DEFAULT NULL,    -- AI-suggested dept at time of apply
    reviewed_by      INT           UNSIGNED DEFAULT NULL, -- admin user id
    reviewed_at      TIMESTAMP     NULL DEFAULT NULL,
    remarks          TEXT          DEFAULT NULL,    -- admin notes on decision
    created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_admissions PRIMARY KEY (id),
    CONSTRAINT uq_admissions_student UNIQUE (student_id),  -- one application per student
    CONSTRAINT fk_admissions_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE RESTRICT      -- block delete if admission exists
        ON UPDATE CASCADE,
    CONSTRAINT fk_admissions_reviewer
        FOREIGN KEY (reviewed_by)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Admission applications with status workflow';


-- ============================================================
--  INDEXES  (beyond PKs and UQs already declared above)
-- ============================================================

-- Fast lookup by email at login
CREATE INDEX idx_users_email      ON users(email);

-- AI chat queries: all messages by a user, or by session
CREATE INDEX idx_chat_user_id     ON chat_history(user_id);
CREATE INDEX idx_chat_session     ON chat_history(session_id);
CREATE INDEX idx_chat_created     ON chat_history(created_at);

-- Filter admissions by status (admin dashboard)
CREATE INDEX idx_admissions_status  ON admissions(status);
CREATE INDEX idx_admissions_payment ON admissions(payment_status);
CREATE INDEX idx_admissions_dept    ON admissions(department);

-- Student lookups
CREATE INDEX idx_students_group   ON students(`group`);


-- ============================================================
--  VIEWS  (common read queries pre-built)
-- ============================================================

-- Full student card: joins users + students + admissions
CREATE OR REPLACE VIEW v_student_overview AS
SELECT
    u.id            AS user_id,
    u.name,
    u.email,
    u.phone,
    u.created_at    AS registered_at,
    s.id            AS student_id,
    s.ssc_gpa,
    s.hsc_gpa,
    s.`group`,
    s.interests,
    s.budget,
    a.id            AS admission_id,
    a.department,
    a.status        AS admission_status,
    a.payment_status,
    a.created_at    AS applied_at
FROM users u
JOIN students s  ON s.user_id   = u.id
LEFT JOIN admissions a ON a.student_id = s.id
WHERE u.role = 'student';

-- Pending admissions for admin review queue
CREATE OR REPLACE VIEW v_pending_admissions AS
SELECT
    a.id, a.department, a.status, a.payment_status, a.created_at,
    u.name AS student_name, u.email,
    s.ssc_gpa, s.hsc_gpa, s.`group`
FROM admissions a
JOIN students s ON s.id     = a.student_id
JOIN users    u ON u.id     = s.user_id
WHERE a.status IN ('pending','under_review')
ORDER BY a.created_at ASC;


-- ============================================================
--  SAMPLE DATA
--  Passwords below are bcrypt hashes of the shown plaintext.
--  NEVER store plain-text passwords in production.
--
--  admin123  → $2b$12$kIqirnGBGDiKDCGDkCiQpOk9QrBG39BOY9N/HJFQgPMfrqBM0sS0S
--  pass1234  → $2b$12$nLMDECxAL4rOlqV3aLLcjO5w2c1QFHt59UW3MoR3kTQbMg5.cHMIS
--  mypassword→ $2b$12$Xv9iAOSXi3g8gKpBNAoJle0S8UrZf4M7TnVJiQ1tF2QN3fVBjXHLe
-- ============================================================

-- ── Users ─────────────────────────────────────────────────────────────────────
INSERT INTO users (name, email, password, phone, role) VALUES
('Admin User',    'admin@diu.edu.bd',        '$2b$12$kIqirnGBGDiKDCGDkCiQpOk9QrBG39BOY9N/HJFQgPMfrqBM0sS0S', '01700000001', 'admin'),
('Tanvir Ahmed',  '251-16-004@diu.edu.bd',   '$2b$12$nLMDECxAL4rOlqV3aLLcjO5w2c1QFHt59UW3MoR3kTQbMg5.cHMIS', '01811234567', 'student'),
('Rina Begum',    'rina.begum@gmail.com',     '$2b$12$Xv9iAOSXi3g8gKpBNAoJle0S8UrZf4M7TnVJiQ1tF2QN3fVBjXHLe', '01911234568', 'student'),
('Karim Hassan',  'karim.hassan@yahoo.com',   '$2b$12$nLMDECxAL4rOlqV3aLLcjO5w2c1QFHt59UW3MoR3kTQbMg5.cHMIS', '01711234569', 'student'),
('Nasrin Akter',  'nasrin.akter@outlook.com', '$2b$12$Xv9iAOSXi3g8gKpBNAoJle0S8UrZf4M7TnVJiQ1tF2QN3fVBjXHLe', '01611234570', 'student');


-- ── Students (academic profiles) ─────────────────────────────────────────────
INSERT INTO students
    (user_id, ssc_gpa, hsc_gpa, `group`, interests, budget,
     ssc_board, hsc_board, ssc_passing_year, hsc_passing_year, date_of_birth)
VALUES
-- Tanvir Ahmed (user_id = 2)
(2, 4.83, 4.75, 'Science',
 'Artificial Intelligence, Web Development, Robotics',
 '60k_to_100k', 'Dhaka', 'Dhaka', 2021, 2023, '2004-06-15'),

-- Rina Begum (user_id = 3)
(3, 4.50, 4.25, 'Commerce',
 'Business Administration, Finance, Marketing',
 '30k_to_60k', 'Chittagong', 'Chittagong', 2021, 2023, '2004-03-22'),

-- Karim Hassan (user_id = 4)
(4, 4.67, 4.50, 'Science',
 'Electrical Engineering, IoT, Embedded Systems',
 '60k_to_100k', 'Rajshahi', 'Rajshahi', 2020, 2022, '2003-11-10'),

-- Nasrin Akter (user_id = 5)
(5, 4.20, 3.90, 'Humanities',
 'English Literature, Journalism, Communication',
 'under_30k', 'Sylhet', 'Sylhet', 2021, 2023, '2004-08-05');


-- ── Admissions ────────────────────────────────────────────────────────────────
INSERT INTO admissions
    (student_id, department, status, payment_status, payment_amount,
     documents, ai_recommendation, reviewed_by, reviewed_at, remarks)
VALUES
-- Tanvir → CIS (AI recommended, approved)
(1, 'Computing and Information System (CIS)',
 'approved', 'paid', 25000.00,
 '["ssc_certificate.pdf","hsc_certificate.pdf","nid.jpg","photo.jpg"]',
 'Computing and Information System (CIS) — 94% match based on GPA and AI interest',
 1, '2026-01-15 10:30:00',
 'Excellent academic record. Admitted to CIS department.'),

-- Rina → BBA (under review, partial payment)
(2, 'Business Administration (BBA)',
 'under_review', 'partial', 12500.00,
 '["ssc_certificate.pdf","hsc_certificate.pdf","photo.jpg"]',
 'Business Administration (BBA) — 88% match based on Commerce background',
 NULL, NULL,
 NULL),

-- Karim → EEE (pending, unpaid)
(3, 'Electrical & Electronic Engineering (EEE)',
 'pending', 'unpaid', NULL,
 '["ssc_certificate.pdf","hsc_certificate.pdf"]',
 'Electrical & Electronic Engineering (EEE) — 91% match',
 NULL, NULL,
 NULL),

-- Nasrin → English (approved, paid)
(4, 'English',
 'approved', 'paid', 18000.00,
 '["ssc_certificate.pdf","hsc_certificate.pdf","photo.jpg","birth_certificate.pdf"]',
 'English — 85% match based on Humanities background',
 1, '2026-01-18 14:00:00',
 'Good profile. Admitted to English department.');


-- ── Chat history ──────────────────────────────────────────────────────────────
INSERT INTO chat_history (user_id, session_id, message, response, tokens_used) VALUES

-- Tanvir's session
(2, 'sess_tanvir_001',
 'Which department should I choose with SSC 4.83 and HSC 4.75 in Science?',
 'Based on your excellent GPA (SSC: 4.83, HSC: 4.75) and Science background, I highly recommend **Computing and Information System (CIS)** or **CSE**. CIS focuses on AI, Data Science, and Cloud — the fastest-growing fields in 2025. Your GPA qualifies you for a merit scholarship. Would you like details on fees and curriculum?',
 320),

(2, 'sess_tanvir_001',
 'What is the tuition fee for CIS?',
 'The CIS department tuition at DIU is approximately **৳8,500 per credit**. With 138 total credits, the full program cost is around ৳11.7 lakh spread over 4 years. With your GPA you may qualify for a **25–50% waiver**, reducing it significantly. Should I calculate your estimated fee with waiver?',
 290),

(2, 'sess_tanvir_002',
 'Tell me about the admission process',
 'The DIU admission process has 5 steps: 1) **Online Pre-Registration** with your SSC/HSC details, 2) **Document Upload** (certificates, photo, NID), 3) **Admission Test / Viva** on the scheduled date, 4) **Fee Payment** after selection, 5) **ID Card Issuance**. Your exam date based on Science faculty is April 15. Shall I help you start your pre-registration now?',
 410),

-- Rina's session
(3, 'sess_rina_001',
 'I studied Commerce. Is BBA a good choice?',
 'Absolutely! With your Commerce background, **BBA (Business Administration)** is a natural and excellent choice. DIU''s BBA program is AACSB-recognised and covers Marketing, Finance, HRM, and Entrepreneurship. Graduates have a 92% placement rate. Your HSC 4.25 in Commerce qualifies you without any extra requirements. Want to know about specialisations?',
 350),

(3, 'sess_rina_001',
 'What scholarships are available for BBA?',
 'For BBA students at DIU, available scholarships include: **Merit Scholarship** (25% waiver for CGPA 3.5+), **Need-Based Grant** (up to 50% for proven financial hardship), **Freedom Fighter Quota** (full waiver if applicable), and **Sports Quota** (15% for national/district level athletes). Apply through the student portal before January 15. Shall I guide you through the application?',
 380),

-- Karim's session
(4, 'sess_karim_001',
 'I am interested in IoT and Embedded Systems. Which department fits best?',
 'For IoT and Embedded Systems, **Electrical & Electronic Engineering (EEE)** is your best match at DIU. The curriculum covers microcontrollers, FPGA, circuit design, and a dedicated IoT lab. Alternatively, **CSE with Embedded Track** is also strong. With your SSC 4.67 and HSC 4.50 in Science, you comfortably meet EEE''s eligibility. Admission exam is April 17.',
 370);


-- ============================================================
--  QUICK VERIFICATION QUERIES
-- ============================================================

-- Check all students with their admission status
-- SELECT * FROM v_student_overview;

-- Check pending queue
-- SELECT * FROM v_pending_admissions;

-- Count per department
-- SELECT department, COUNT(*) AS applications, status
-- FROM admissions GROUP BY department, status;

-- Chat history for a specific user
-- SELECT message, response, created_at
-- FROM chat_history WHERE user_id = 2 ORDER BY created_at;
