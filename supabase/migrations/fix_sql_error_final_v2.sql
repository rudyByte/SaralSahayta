-- ================================================================
-- CONSOLIDATED FIX V2: Handling UUID Foreign Keys
-- Run this in your Supabase SQL Editor
-- ================================================================

-- 1. Sync Document Expiry Columns (user_documents)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_documents' AND column_name='status') THEN
        ALTER TABLE user_documents ADD COLUMN status TEXT DEFAULT 'ACTIVE';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_documents' AND column_name='expiry_date') THEN
        ALTER TABLE user_documents ADD COLUMN expiry_date TIMESTAMPTZ DEFAULT NULL;
    END IF;
END $$;

-- 2. Sync Premium Columns (user_profiles)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='is_premium') THEN
        ALTER TABLE user_profiles ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='premium_expires_at') THEN
        ALTER TABLE user_profiles ADD COLUMN premium_expires_at TIMESTAMPTZ DEFAULT NULL;
    END IF;
END $$;

-- 3. Create PremiumTransaction Table
-- userId references auth.users(id) which is always UUID
CREATE TABLE IF NOT EXISTS "PremiumTransaction" (
    "id" TEXT PRIMARY KEY, -- Using TEXT for CUIDs
    "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "amount" NUMERIC NOT NULL,
    "currency" TEXT DEFAULT 'INR',
    "status" TEXT DEFAULT 'PENDING',
    "provider" TEXT DEFAULT 'RAZORPAY',
    "orderId" TEXT UNIQUE,
    "paymentId" TEXT UNIQUE,
    "signature" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create ApplicationPremium Table
-- applicationId references applications(id). Error confirmed applications.id is UUID.
CREATE TABLE IF NOT EXISTS "ApplicationPremium" (
    "id" TEXT PRIMARY KEY, -- Using TEXT for CUIDs
    "applicationId" UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE UNIQUE,
    "serviceType" TEXT NOT NULL,
    "status" TEXT DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Reload schema cache
NOTIFY pgrst, 'reload schema';
