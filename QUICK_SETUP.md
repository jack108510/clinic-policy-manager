# Quick Setup Guide - New Supabase Project

Your project is configured with:
- **Project URL**: `https://hneyncvndwejbvkxndpz.supabase.co`
- **Anon Key**: Updated in config files ✅

## Step 1: Set Up Database Schema

1. Go to: https://supabase.com/dashboard/project/hneyncvndwejbvkxndpz
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wddc_item_number VARCHAR(50) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  size VARCHAR(255),
  category VARCHAR(255),
  supplier VARCHAR(255) DEFAULT 'WDDC',
  price DECIMAL(10, 2),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for search
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_wddc_item ON products(wddc_item_number);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'staff',
  clinic VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Carts table
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  clinic VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  requested_quantity INTEGER NOT NULL DEFAULT 1,
  approved_quantity INTEGER,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  estimated_cost DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Approvals/Logs table
CREATE TABLE IF NOT EXISTS approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  cart_item_id UUID REFERENCES cart_items(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  performed_by UUID NOT NULL REFERENCES profiles(id),
  previous_quantity INTEGER,
  new_quantity INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_status ON carts(status);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_approvals_cart_id ON approvals(cart_id);

-- Row Level Security (RLS) Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

-- Products: Everyone can read
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

-- Profiles: Users can read their own profile, managers can read all
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Managers can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Carts: Users can manage their own carts, managers can view all
CREATE POLICY "Users can manage own carts" ON carts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all carts" ON carts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "Managers can update all carts" ON carts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Cart items: Follow cart permissions
CREATE POLICY "Users can manage items in own carts" ON cart_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE id = cart_items.cart_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view all cart items" ON cart_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "Managers can update all cart items" ON cart_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Approvals: Managers can create, everyone can read their own
CREATE POLICY "Users can view approvals for own carts" ON approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE id = approvals.cart_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage all approvals" ON approvals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Wait for "Success. No rows returned"

## Step 2: Disable Email Confirmation

1. Go to: **Authentication** → **Providers**
2. Click on **Email**
3. Find **"Confirm email"** toggle
4. Turn it **OFF**
5. Click **Save**

## Step 3: Create User Account

Run this in the SQL Editor:

```sql
-- First, create the auth user (you'll need to sign up via the app or use Supabase Auth)
-- Then create the profile:

INSERT INTO profiles (id, email, full_name, role, clinic)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'wildejack1010@gmail.com'),
  'wildejack1010@gmail.com',
  'Jack Wilde',
  'manager',
  'Main Clinic'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'manager',
  full_name = 'Jack Wilde',
  clinic = 'Main Clinic';
```

**OR** sign up through the app first, then run the profile insert.

## Step 4: Test Login

1. Go to: http://127.0.0.1:8000/inventory-ordering.html
2. Log in with:
   - Email: `wildejack1010@gmail.com`
   - Password: `Harlem1085`

You should see the Manager Dashboard!

## Step 5: Import Products (Optional)

Once logged in, you can import products from `january-2025-products.txt` using the admin panel or a script.

