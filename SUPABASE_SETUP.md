# Supabase Setup Instructions

## 1. Create Supabase Project

1. Go to https://supabase.com and sign up/login
2. Create a new project
3. Note your project URL and anon/public key

## 2. Update Configuration

Edit `supabase-config.js` and replace:
- `YOUR_SUPABASE_URL` with your project URL (e.g., `https://xxxxx.supabase.co`)
- `YOUR_SUPABASE_ANON_KEY` with your anon/public key

## 3. Create Database Tables

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    access_code VARCHAR(255),
    created DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies table
CREATE TABLE companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    industry VARCHAR(255),
    phone VARCHAR(50),
    plan VARCHAR(50) DEFAULT 'free',
    admin_password VARCHAR(255),
    signup_date DATE DEFAULT CURRENT_DATE,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active',
    users_count INTEGER DEFAULT 0,
    policies_count INTEGER DEFAULT 0,
    organizations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Access codes table
CREATE TABLE access_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    max_companies INTEGER DEFAULT 10,
    used_by JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company ON users(company);
CREATE INDEX idx_access_codes_code ON access_codes(code);
CREATE INDEX idx_access_codes_status ON access_codes(status);
```

## 4. Set Row Level Security (RLS)

Enable RLS and create policies:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- Allow public read access (adjust based on your security needs)
CREATE POLICY "Allow public read access" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON companies FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON access_codes FOR SELECT USING (true);

-- Allow public insert (for signup)
CREATE POLICY "Allow public insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON access_codes FOR INSERT WITH CHECK (true);

-- Allow public update
CREATE POLICY "Allow public update" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow public update" ON companies FOR UPDATE USING (true);
CREATE POLICY "Allow public update" ON access_codes FOR UPDATE USING (true);

-- Allow public delete (adjust based on your security needs)
CREATE POLICY "Allow public delete" ON users FOR DELETE USING (true);
CREATE POLICY "Allow public delete" ON companies FOR DELETE USING (true);
CREATE POLICY "Allow public delete" ON access_codes FOR DELETE USING (true);
```

**Note:** These policies allow full public access. For production, you should implement proper authentication and restrict access based on user roles.

## 5. Column Name Mapping

The Supabase tables use snake_case (e.g., `expiry_date`, `used_by`, `access_code`), while the JavaScript code may use camelCase. The `SupabaseDB` functions handle this mapping automatically.

## 6. Test the Setup

1. Open the Master Admin Dashboard
2. Create an access code
3. Try signing up with that access code on the main site
4. Verify the user appears in Supabase dashboard

## Troubleshooting

- **"Supabase client not initialized"**: Make sure `supabase-config.js` is loaded before `script.js`
- **"Table does not exist"**: Run the SQL commands in Supabase SQL Editor
- **"Permission denied"**: Check your RLS policies in Supabase dashboard
- **"Column does not exist"**: Verify column names match the SQL schema (snake_case)

