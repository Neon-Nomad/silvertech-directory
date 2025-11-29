-- Migration: Move billing from facilities to user profiles
-- This enables user-centric billing  where users subscribe and can assign plans to multiple facilities

BEGIN TRANSACTION;

-- Step 1: Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan TEXT DEFAULT 'free',
    billing_status TEXT DEFAULT 'inactive',
    facility_assignments_remaining INTEGER DEFAULT 0 NOT NULL
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_subscription ON user_profiles(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan ON user_profiles(plan);

-- Step 3: Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 5: Remove billing fields from facilities table (if they exist)
ALTER TABLE facilities
DROP COLUMN IF EXISTS stripe_customer_id,
DROP COLUMN IF EXISTS stripe_subscription_id,
DROP COLUMN IF EXISTS plan,
DROP COLUMN IF EXISTS billing_status;

-- Step 6: Add plan assignment tracking to facilities
ALTER TABLE facilities
ADD COLUMN IF NOT EXISTS assigned_plan_owner_id UUID REFERENCES user_profiles(id);

CREATE INDEX IF NOT EXISTS idx_facilities_plan_owner ON facilities(assigned_plan_owner_id);

COMMIT;
