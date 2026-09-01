-- ==============================================================================
-- Migration 28: Fix membership_status check constraint on members table
-- ==============================================================================

-- 1. Drop the old restrictive check constraint
ALTER TABLE IF EXISTS members DROP CONSTRAINT IF EXISTS members_membership_status_check;

-- 2. Add an updated check constraint supporting all church categories
ALTER TABLE members ADD CONSTRAINT members_membership_status_check 
  CHECK (
    membership_status IS NULL OR 
    membership_status IN (
      'active',
      'member',
      'youth',
      'worker',
      'first_timer',
      'visitor',
      'inactive'
    )
  );

-- 3. Ensure full permissions for authenticated and anon/service roles
GRANT ALL ON members TO authenticated;
GRANT ALL ON members TO anon;
GRANT ALL ON members TO service_role;
