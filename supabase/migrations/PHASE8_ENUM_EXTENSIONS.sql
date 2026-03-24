-- ============================================
-- PHASE 8: SETUP - EXTEND DOCUMENT ENUMS
-- STEP 1: RUN THIS FIRST
-- ============================================

-- Note: 'CASTE', 'IDENTITY', 'ELIGIBILITY' already exist.
-- We add others needed for the 19 schemes.
-- Each of these must be COMMITTED before they can be used in an INSERT.

ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'RESIDENCE';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'EDUCATION';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'FINANCIAL';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'HEALTH';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'EMPLOYMENT';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'AGRICULTURE';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'DISABILITY';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'SKILL_DEVELOPMENT';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'OTHERS';
