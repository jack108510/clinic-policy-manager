# Supabase Setup Instructions for Policy Pro

## 1. Create Supabase Project

1. Go to https://supabase.com and sign up/login
2. Create a new project
3. Note your project URL and anon/public key

## 2. Update Configuration

Edit `supabase-config.js` and replace:
- `YOUR_SUPABASE_URL` with your project URL (e.g., `https://xxxxx.supabase.co`)
- `YOUR_SUPABASE_ANON_KEY` with your anon/public key

## 3. Create Database Tables

Run the following SQL commands in your Supabase SQL Editor:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Companies table
create table companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  industry text,
  phone text,
  plan text default 'free-trial',
  admin_password text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Users table (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  email text not null,
  company_id uuid references companies(id) on delete cascade,
  role text default 'user' check (role in ('admin', 'user')),
  organizations text[], -- Array of organization names
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Access codes table (for master admin)
create table access_codes (
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

-- Policies table
create table policies (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade not null,
  title text not null,
  type text not null check (type in ('admin', 'sog', 'protocol', 'memo', 'training', 'reference', 'governance')),
  policy_code text,
  
  -- Content fields
  purpose text,
  scope text,
  policy_statement text,
  procedures text,
  responsibilities text,
  consequences text,
  definitions text,
  related_documents text,
  review_approval text,
  additional_content text,
  
  -- Metadata
  effective_date date,
  version text default '1.0',
  author text,
  approved_by text,
  applies_to text,
  clinic_names text,
  
  -- Tracking
  created_by uuid references profiles(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  -- Search
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(purpose, '') || ' ' || coalesce(policy_statement, ''))
  ) stored
);

-- Policy views tracking
create table policy_views (
  id uuid primary key default uuid_generate_v4(),
  policy_id uuid references policies(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  username text not null,
  viewed_at timestamp with time zone default now(),
  unique(policy_id, user_id)
);

-- Categories table
create table categories (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade not null,
  name text not null,
  number integer not null,
  created_at timestamp with time zone default now(),
  unique(company_id, number)
);

-- Organizations table
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default now(),
  unique(company_id, name)
);

-- Drafts table
create table drafts (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  title text,
  type text,
  content jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes for performance
create index policies_company_id_idx on policies(company_id);
create index policies_type_idx on policies(type);
create index policies_search_idx on policies using gin(search_vector);
create index policy_views_policy_id_idx on policy_views(policy_id);
create index policy_views_user_id_idx on policy_views(user_id);
create index profiles_company_id_idx on profiles(company_id);
create index idx_access_codes_code on access_codes(code);
create index idx_access_codes_status on access_codes(status);

-- Row Level Security (RLS)
alter table companies enable row level security;
alter table profiles enable row level security;
alter table policies enable row level security;
alter table policy_views enable row level security;
alter table categories enable row level security;
alter table organizations enable row level security;
alter table drafts enable row level security;
alter table access_codes enable row level security;

-- RLS Policies: Users can only see data from their own company

-- Companies
create policy "Users can view their own company"
  on companies for select
  using (id in (
    select company_id from profiles where id = auth.uid()
  ));

create policy "Users can update their own company"
  on companies for update
  using (id in (
    select company_id from profiles where id = auth.uid()
  ));

-- Profiles
create policy "Users can view profiles in their company"
  on profiles for select
  using (company_id in (
    select company_id from profiles where id = auth.uid()
  ));

create policy "Users can update their own profile"
  on profiles for update
  using (id = auth.uid());

-- Policies
create policy "Users can view policies from their company"
  on policies for select
  using (company_id in (
    select company_id from profiles where id = auth.uid()
  ));

create policy "Users can insert policies for their company"
  on policies for insert
  with check (company_id in (
    select company_id from profiles where id = auth.uid()
  ));

create policy "Users can update policies from their company"
  on policies for update
  using (company_id in (
    select company_id from profiles where id = auth.uid()
  ));

create policy "Users can delete policies from their company"
  on policies for delete
  using (company_id in (
    select company_id from profiles where id = auth.uid()
  ));

-- Policy Views
create policy "Users can view policy views from their company"
  on policy_views for select
  using (policy_id in (
    select id from policies where company_id in (
      select company_id from profiles where id = auth.uid()
    )
  ));

create policy "Users can insert their own policy views"
  on policy_views for insert
  with check (user_id = auth.uid());

-- Categories
create policy "Users can view categories from their company"
  on categories for select
  using (company_id in (
    select company_id from profiles where id = auth.uid()
  ));

create policy "Users can manage categories for their company"
  on categories for all
  using (company_id in (
    select company_id from profiles where id = auth.uid()
  ));

-- Organizations
create policy "Users can view organizations from their company"
  on organizations for select
  using (company_id in (
    select company_id from profiles where id = auth.uid()
  ));

create policy "Users can manage organizations for their company"
  on organizations for all
  using (company_id in (
    select company_id from profiles where id = auth.uid()
  ));

-- Drafts
create policy "Users can view their own drafts"
  on drafts for select
  using (user_id = auth.uid());

create policy "Users can manage their own drafts"
  on drafts for all
  using (user_id = auth.uid());

-- Access Codes (Master Admin only - more permissive for now)
create policy "Allow public read access to access codes"
  on access_codes for select
  using (true);

create policy "Allow public insert to access codes"
  on access_codes for insert
  with check (true);

create policy "Allow public update to access codes"
  on access_codes for update
  using (true);

create policy "Allow public delete to access codes"
  on access_codes for delete
  using (true);

-- Functions for updated_at timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers
create trigger update_companies_updated_at before update on companies
  for each row execute function update_updated_at_column();

create trigger update_profiles_updated_at before update on profiles
  for each row execute function update_updated_at_column();

create trigger update_policies_updated_at before update on policies
  for each row execute function update_updated_at_column();

create trigger update_drafts_updated_at before update on drafts
  for each row execute function update_updated_at_column();

-- Function to create profile after user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## 4. Important Notes

### Table Name Changes
- **Users**: The schema uses `profiles` table (not `users`) which extends Supabase's `auth.users`
- **Companies**: Uses `company_id` (UUID) instead of `company` (text) in profiles
- **Access Codes**: Added `access_codes` table for master admin functionality

### Authentication Flow
1. Users sign up through Supabase Auth (`auth.users`)
2. A trigger automatically creates a `profiles` record
3. The `profiles` table links users to companies via `company_id`

### Row Level Security (RLS)
- Most tables restrict access to users within the same company
- Access codes have permissive policies for master admin operations
- Users can only see/modify data from their own company

## 5. Update Code to Match Schema

**Note**: The current code references `users` table, but the schema uses `profiles`. You'll need to update `supabase-config.js` to use `profiles` instead of `users` when integrating with this schema.

## 6. Test the Setup

1. Run the SQL schema in Supabase SQL Editor
2. Update `supabase-config.js` with your credentials
3. Open the Master Admin Dashboard
4. Create an access code
5. Try signing up with that access code on the main site
6. Verify the user appears in Supabase dashboard under `profiles` table

## Troubleshooting

- **"Table does not exist"**: Run all SQL commands in Supabase SQL Editor
- **"Permission denied"**: Check your RLS policies in Supabase dashboard
- **"Column does not exist"**: Verify column names match the SQL schema (snake_case)
- **"Foreign key violation"**: Ensure companies are created before profiles reference them
