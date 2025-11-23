# Quick Setup Guide

## 1. Install Dependencies

```bash
cd inventory-platform
npm install
```

## 2. Set Up Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://wkbntjfiwzoauzxnowfc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYm50amZpd3pvYXV6eG5vd2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTc4NzIsImV4cCI6MjA3NzQ5Mzg3Mn0.CgilBvYCUkbScycnZ8OWy_eAjUF0i698lcDbWHcM5ic
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Get your service role key from Supabase Dashboard → Settings → API

## 3. Create Database Tables

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `database/schema.sql`
3. Paste and run

## 4. Import Products

**Option A: Using the script (recommended)**
```bash
npm run import-products
```

**Option B: Using the web interface**
1. Start dev server: `npm run dev`
2. Create a manager account (see step 5)
3. Log in and go to `/admin`
4. Click "Import Products"

## 5. Create User Accounts

### Create a Manager Account

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter email and password
4. Go to Table Editor → `profiles`
5. Click "Insert row" and add:
   - `id`: Copy the UUID from the user you just created
   - `email`: Same email
   - `role`: `manager`
   - `full_name`: Your name
   - `clinic`: Clinic name (optional)

### Create a Staff Account

Same process, but set `role` to `staff`

## 6. Run the Application

```bash
npm run dev
```

Visit http://localhost:3000

## Troubleshooting

### "Products not found" error
- Make sure `january-2025-products.txt` is in the `data/` folder (parent directory)
- Or update the path in `scripts/import-products.js`

### "Unauthorized" errors
- Check that RLS policies are set up correctly
- Verify user has a profile record with correct role

### Import fails
- Check that `products` table exists
- Verify `wddc_item_number` column has UNIQUE constraint
- Check Supabase logs for detailed errors

