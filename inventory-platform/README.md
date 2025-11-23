# Inventory Ordering Platform

A centralized, Amazon-style platform for clinic inventory ordering with manager approval workflow.

## Features

- **Product Catalog**: Searchable product database with category filtering
- **Staff Ordering**: Add products to cart and submit for approval
- **Manager Dashboard**: Review, approve, deny, or adjust orders
- **Order Export**: Generate Excel files grouped by supplier
- **Role-Based Access**: Staff and Manager roles with appropriate permissions

## Tech Stack

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Supabase** (Database & Authentication)
- **Tailwind CSS**
- **XLSX** (Excel export)

## Setup Instructions

### 1. Install Dependencies

```bash
cd inventory-platform
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the `inventory-platform` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://wkbntjfiwzoauzxnowfc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYm50amZpd3pvYXV6eG5vd2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTc4NzIsImV4cCI6MjA3NzQ5Mzg3Mn0.CgilBvYCUkbScycnZ8OWy_eAjUF0i698lcDbWHcM5ic
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Set Up Database

Run the SQL schema in your Supabase project:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database/schema.sql`
4. Execute the SQL

This will create:
- `products` table
- `profiles` table (extends auth.users)
- `carts` table
- `cart_items` table
- `approvals` table
- Row Level Security (RLS) policies
- Indexes for performance

### 4. Import Products

1. Start the development server:
```bash
npm run dev
```

2. Navigate to `/admin` (you'll need to be logged in as a manager)
3. Click "Import Products" to load products from `january-2025-products.txt`

### 5. Create User Accounts

You can create user accounts in two ways:

#### Option A: Via Supabase Dashboard
1. Go to Authentication > Users
2. Create a new user
3. Go to Table Editor > profiles
4. Create a profile record with:
   - `id`: The user's UUID from auth.users
   - `email`: User's email
   - `role`: Either `'staff'` or `'manager'`
   - `clinic`: Clinic name (optional)
   - `full_name`: User's full name (optional)

#### Option B: Via Sign Up (if enabled)
Users can sign up, but you'll need to manually update their role in the profiles table.

### 6. Run the Application

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
inventory-platform/
├── app/
│   ├── api/
│   │   ├── import-products/    # Product import endpoint
│   │   └── export-order/         # Order export endpoint
│   ├── admin/                   # Admin panel for product import
│   ├── login/                   # Login page
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page (routes to ordering or dashboard)
│   └── globals.css              # Global styles
├── components/
│   ├── Cart.tsx                 # Shopping cart component
│   ├── ManagerDashboard.tsx     # Manager approval interface
│   ├── OrderingPage.tsx         # Staff ordering interface
│   └── ProductSearch.tsx        # Product search and browse
├── database/
│   └── schema.sql               # Database schema
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser Supabase client
│   │   └── server.ts             # Server Supabase client
│   └── utils/
│       └── product-parser.ts    # Product file parser
├── middleware.ts                # Auth middleware
└── package.json
```

## Usage

### For Staff Users

1. Log in with your credentials
2. Search for products using the search bar or category filter
3. Adjust quantities and add items to cart
4. Review cart and submit for manager approval
5. Wait for manager to approve or request revisions

### For Managers

1. Log in with manager credentials
2. View all submitted carts in the dashboard
3. Click on a cart to review items
4. For each item:
   - Adjust quantity if needed
   - Approve or deny the item
5. Once all items are reviewed:
   - Approve the entire cart for ordering
   - Or return it to staff for revisions
6. Export approved orders as Excel files

## Database Schema

### Products
- Stores product information (name, size, WDDC item number, category, supplier)

### Profiles
- Extends Supabase auth.users
- Stores role (staff/manager) and clinic information

### Carts
- Represents an order request
- Status: draft, submitted, approved, denied, returned

### Cart Items
- Individual products in a cart
- Tracks requested and approved quantities
- Status: pending, approved, denied

### Approvals
- Audit log of all actions
- Tracks who did what and when

## Security

- Row Level Security (RLS) enabled on all tables
- Staff can only manage their own carts
- Managers can view and manage all carts
- All API routes require authentication
- Role-based access control enforced

## Future Enhancements (Post-MVP)

- AI quantity recommendations
- Usage forecasting
- Automated ordering
- Multi-supplier price comparison
- Inventory scanner integration
- Stock alerts
- Cash flow optimization

## Troubleshooting

### Products not loading
- Ensure products have been imported via `/admin`
- Check that the `products` table exists and has data
- Verify RLS policies allow SELECT on products

### Can't submit cart
- Ensure you're logged in
- Check that cart status is 'draft'
- Verify cart has at least one item

### Manager can't see carts
- Verify user role is set to 'manager' in profiles table
- Check RLS policies for carts table
- Ensure carts have status 'submitted' or 'returned'

### Export not working
- Ensure cart status is 'approved'
- Check that cart items have status 'approved'
- Verify XLSX package is installed

## License

Private - Internal Use Only

