# Supabase Schema Fix Summary

## Issues Found

1. **RLS Policy Recursion Error**: The RLS policies have circular references causing "infinite recursion detected in policy for relation 'profiles'" errors
2. **Missing `access_codes` Table**: The table doesn't exist but is needed for master admin functionality
3. **Code Mismatch**: Code references `users` table but schema uses `profiles` table

## What I've Done

1. ✅ Updated `supabase-config.js` with your credentials
2. ✅ Diagnosed the database schema
3. ✅ Created SQL fix file (`FIX_RLS_AND_SCHEMA.sql`)

## Next Steps

### 1. Fix RLS Policies (Required)
Run the SQL in `FIX_RLS_AND_SCHEMA.sql` in your Supabase SQL Editor. This will:
- Fix the circular RLS policy references
- Create the missing `access_codes` table
- Set up proper permissions

### 2. Update Code to Match Schema
I need to update the code to:
- Use `profiles` instead of `users` table
- Map `company` (text) → `company_id` (UUID)
- Handle Supabase Auth integration
- Update field names (snake_case vs camelCase)

### 3. Test Integration
After fixes, we'll test:
- Creating access codes
- User signup flow
- User login flow
- Data retrieval

## Current Database State

- ✅ `drafts` table exists and is accessible
- ⚠️ `profiles`, `companies`, `policies`, etc. exist but have RLS recursion issues
- ❌ `access_codes` table doesn't exist
- ❌ `users` table doesn't exist (expected - using `profiles`)

## Questions for You

1. **Authentication**: Do you want to use Supabase Auth (`auth.users` + `profiles`) or keep custom password storage?
2. **Company Creation**: When a user signs up with an access code, should we:
   - Create a new company automatically?
   - Require company to exist first?
   - Use access code description as company name?
3. **Migration**: Do you have existing users/data that needs to be migrated?

Let me know and I'll proceed with updating the code!

