# How to Run the SQL Fix in Supabase

## Step-by-Step Instructions

### 1. Open Supabase Dashboard
1. Go to https://supabase.com
2. Sign in to your account
3. Select your project: **wkbntjfiwzoauzxnowfc**

### 2. Navigate to SQL Editor
1. In the left sidebar, click on **"SQL Editor"** (it has a database icon)
2. You'll see a blank SQL editor window

### 3. Copy the SQL Fix
1. Open the file `FIX_RLS_AND_SCHEMA.sql` in your editor
2. Select all the content (Cmd+A / Ctrl+A)
3. Copy it (Cmd+C / Ctrl+C)

### 4. Paste and Run
1. In the Supabase SQL Editor, paste the SQL (Cmd+V / Ctrl+V)
2. Click the **"Run"** button (or press Cmd+Enter / Ctrl+Enter)
3. Wait for execution to complete

### 5. Verify Success
You should see:
- ✅ "Success" message at the bottom
- ✅ No error messages
- ✅ A notice saying "All required tables exist. RLS policies fixed and access_codes table created."

## What the SQL Does

1. **Fixes RLS Policy Recursion**
   - Drops problematic policies that cause infinite loops
   - Recreates them without circular references

2. **Creates Missing Tables**
   - Creates `access_codes` table if it doesn't exist
   - Sets up proper indexes

3. **Sets Up Permissions**
   - Configures RLS policies for `access_codes` table
   - Allows public access for master admin operations

## Troubleshooting

### If you get "policy does not exist" errors:
- This is normal if policies weren't created yet
- The SQL uses `DROP POLICY IF EXISTS` so it's safe

### If you get "table already exists" errors:
- The SQL uses `CREATE TABLE IF NOT EXISTS` so this shouldn't happen
- If it does, the table already exists and you can continue

### If you get permission errors:
- Make sure you're logged in as the project owner
- Check that you have the correct project selected

## After Running

Once the SQL runs successfully:
1. ✅ RLS recursion errors should be fixed
2. ✅ `access_codes` table should exist
3. ✅ You can now test creating access codes in the Master Admin Dashboard
4. ✅ User signup should work properly

## Quick Test

After running the SQL, test it:
1. Go to your Master Admin Dashboard
2. Try creating an access code
3. Check Supabase → Table Editor → `access_codes` to see if it appears

That's it! 🎉

