-- ============================================================================
--  AI Knowledge Pipeline — add render_js flag to kb_sources
--  Marks JS-rendered sources that need a headless browser (Playwright) before
--  extraction. The heavy render step runs in the OFF-Render sync worker, not in
--  the always-on web service, so the Render web dyno stays light.
-- ============================================================================

ALTER TABLE kb_sources ADD COLUMN IF NOT EXISTS render_js BOOLEAN NOT NULL DEFAULT FALSE;

-- These 3 DIU pages load their content via JavaScript (static HTML is near-empty):
--   tuition-fees, faculty directory, faculties
UPDATE kb_sources SET render_js = TRUE
WHERE url IN (
    'https://daffodilvarsity.edu.bd/tuition-fees',
    'https://faculty.daffodilvarsity.edu.bd/',
    'https://daffodilvarsity.edu.bd/faculties'
);
