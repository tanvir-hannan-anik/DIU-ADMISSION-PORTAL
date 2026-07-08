-- ============================================================================
--  AI Knowledge Pipeline — structured tuition fees (kb_tuition_fees)
--  Source: https://webbackend.daffodilvarsity.edu.bd/api/v1/public/tuition-fees
--  Holds the 4 headline figures per program the site shows:
--    payable_admission  (Payable During Admission)
--    avg_semester_fee   (Average Semester Fees)
--    total_tuition_fee  (Total Tuition Fees)
--    total_program_fee  (Total Program Fees)
-- ============================================================================

CREATE TABLE IF NOT EXISTS kb_tuition_fees (
    id                 SERIAL PRIMARY KEY,
    external_id        INTEGER UNIQUE,            -- stable id from the source API
    program_name       TEXT NOT NULL,
    department_name    TEXT,
    faculty_name       TEXT,
    faculty_short      TEXT,
    program_type       TEXT,                      -- Undergraduate | Postgraduate
    credit             TEXT,
    majors             TEXT,
    duration           TEXT,
    payable_admission  TEXT,                      -- admission_fees
    avg_semester_fee   TEXT,                      -- semester_cost
    total_tuition_fee  TEXT,                      -- tuition_fees
    total_program_fee  TEXT,                      -- total_fees
    content_hash       CHAR(64),
    is_active          BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kb_tuition_faculty ON kb_tuition_fees(faculty_name, is_active);
CREATE INDEX IF NOT EXISTS idx_kb_tuition_dept    ON kb_tuition_fees(department_name, is_active);
