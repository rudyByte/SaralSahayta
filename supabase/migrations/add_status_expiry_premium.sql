-- ================================================================
-- Migration: Add status and expiry_date to user_documents table
-- Run this in your Supabase SQL Editor
-- ================================================================

-- 1. Add the status column (ACTIVE, EXPIRED, EXPIRING_SOON)
ALTER TABLE user_documents
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';

-- 2. Add the expiry_date column
ALTER TABLE user_documents
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ DEFAULT NULL;

-- 3. Add is_premium and premium_expires_at to user_profiles (for Premium feature)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ DEFAULT NULL;

-- 4. Create premium_transactions table (for Razorpay payment tracking)
CREATE TABLE IF NOT EXISTS premium_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    razorpay_order_id TEXT NOT NULL,
    razorpay_payment_id TEXT,
    plan_type TEXT NOT NULL,          -- 'monthly' or 'per_scheme'
    amount INTEGER NOT NULL,          -- in paise
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'PENDING',    -- 'PENDING', 'COMPLETED', 'FAILED'
    scheme_id UUID REFERENCES schemes(id) ON DELETE SET NULL,
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create application_premium table (for per-scheme fast-tracking)
CREATE TABLE IF NOT EXISTS application_premium (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES premium_transactions(id),
    service_type TEXT DEFAULT 'FAST_TRACK',
    status TEXT DEFAULT 'ACTIVE',     -- 'ACTIVE', 'EXPIRED'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
