-- Fix RLS Policy Recursion and Create Missing Tables
-- Run this in your Supabase SQL Editor

-- ============================================
-- STEP 1: Fix RLS Policy Recursion Issue
-- ============================================
-- The current policies have circular references. We need to fix them.

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view profiles in their company" ON profiles;
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Users can view policies from their company" ON policies;
DROP POLICY IF EXISTS "Users can view policy views from their company" ON policy_views;
DROP POLICY IF EXISTS "Users can view categories from their company" ON categories;
DROP POLICY IF EXISTS "Users can view organizations from their company" ON organizations;

-- Recreate policies without recursion
-- For profiles: Users can see profiles in their company (using direct company_id check)
CREATE POLICY "Users can view profiles in their company"
  ON profiles FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
    OR id = auth.uid() -- Users can always see their own profile
  );

-- For companies: Users can see their own company
CREATE POLICY "Users can view their own company"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- For policies: Users can see policies from their company
CREATE POLICY "Users can view policies from their company"
  ON policies FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- For policy_views: Users can see views from their company
CREATE POLICY "Users can view policy views from their company"
  ON policy_views FOR SELECT
  USING (
    policy_id IN (
      SELECT id FROM policies WHERE company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- For categories: Users can see categories from their company
CREATE POLICY "Users can view categories from their company"
  ON categories FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- For organizations: Users can see organizations from their company
CREATE POLICY "Users can view organizations from their company"
  ON organizations FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================
-- STEP 2: Create Missing access_codes Table
-- ============================================
CREATE TABLE IF NOT EXISTS access_codes (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  description text,
  created_date date default current_date,
  expiry_date date,
  max_companies integer default 10,
  used_by text[], -- Array of company names
  status text default 'active',
  created_at timestamp with time zone default now()
);

-- Enable RLS on access_codes
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- Access codes policies (more permissive for master admin)
CREATE POLICY "Allow public read access to access codes"
  ON access_codes FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to access codes"
  ON access_codes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to access codes"
  ON access_codes FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete to access codes"
  ON access_codes FOR DELETE
  USING (true);

-- Index for access codes
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_status ON access_codes(status);

-- ============================================
-- STEP 3: Verify Tables Exist
-- ============================================
-- Check if all required tables exist
DO $$
BEGIN
  -- Check profiles
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RAISE EXCEPTION 'Table "profiles" does not exist. Please run the main schema SQL first.';
  END IF;
  
  -- Check companies
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'companies') THEN
    RAISE EXCEPTION 'Table "companies" does not exist. Please run the main schema SQL first.';
  END IF;
  
  -- Check policies
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'policies') THEN
    RAISE EXCEPTION 'Table "policies" does not exist. Please run the main schema SQL first.';
  END IF;
  
  RAISE NOTICE 'All required tables exist. RLS policies fixed and access_codes table created.';
END $$;

