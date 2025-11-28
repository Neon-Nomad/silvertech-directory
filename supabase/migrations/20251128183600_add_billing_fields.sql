-- Add billing fields to facilities table

-- Create enums for plan and billing status
CREATE TYPE facility_plan AS ENUM ('basic', 'featured', 'lead_suite');
CREATE TYPE billing_status AS ENUM ('none', 'active', 'past_due', 'canceled');

-- Add columns to facilities table
ALTER TABLE facilities 
ADD COLUMN IF NOT EXISTS plan facility_plan DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS billing_status billing_status DEFAULT 'none',
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS plan_updated_at timestamp with time zone;

-- Add index for performance on billing queries
CREATE INDEX IF NOT EXISTS idx_facilities_plan ON facilities(plan);
CREATE INDEX IF NOT EXISTS idx_facilities_stripe_sub_id ON facilities(stripe_subscription_id);
