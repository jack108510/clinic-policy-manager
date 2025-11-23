# MVP TERMS – Inventory Ordering Platform (January 2025)

**Product data source:** january-2025-products.txt

## 1. Purpose of MVP

The MVP provides a centralized, Amazon-style platform that allows clinic staff to quickly search for products, add them to a cart, and submit them for approval.

The system streamlines ordering, reduces inventory mistakes, and gives management a single place to review, approve, or deny orders.

## 2. MVP Scope (What WILL be included)

### 2.1 Product Catalog

- Import all product data from january-2025-products.txt into the platform.
- Store item name, size, WDDC item number, category, and any available metadata.
- Searchable via global search bar (Amazon-style) with:
  - Keyword search
  - Item # search
  - Category filter

### 2.2 Staff Ordering Experience (Front-End)

Staff can:
- Search for products
- Click a product card
- Add quantities using +/– steps
- Add items to a persistent cart
- Submit cart for manager review

Cart shows:
- Product name
- Item #
- Requested quantity
- Estimated cost (if available in product file)

### 2.3 Manager Approval Dashboard

Managers can:
- View all submitted carts by clinic
- Approve or deny individual line items
- Adjust quantities
- Return cart to staff for revisions
- Mark a cart as "Approved for Ordering"

### 2.4 Order Output (Manual)

Once approved, the system generates:
- CSV/Excel export grouped by supplier
- Printable order summary

Staff or management manually submit the order to the supplier (WDDC or others).

### 2.5 User Accounts

Two access levels:
- **Staff** → Can search and submit carts
- **Manager/Admin** → Can approve, adjust, or deny

### 2.6 Basic Logging

Track:
- Who requested
- Who approved
- Timestamps
- Revisions
- Final quantities ordered

## 3. MVP Exclusions (What is NOT included yet)

These will be added in later phases.

### 3.1 No AI logic yet
- No AI auto-approvals
- No AI recommended quantities
- No usage forecasting
- No over/understock optimization

### 3.2 No competitor integration yet
- No competitor pricing
- No supplier switching logic

### 3.3 No automated ordering
- MVP does not submit orders to WDDC or competitors
- Only generates downloadable order files

### 3.4 No inventory tracking
- No scanner integration
- No on-hand quantity calculation
- No min/max logic

### 3.5 No financial/cash-flow optimization
- No interest savings
- No budget caps
- No order timing delay logic

## 4. MVP Technical Requirements

### 4.1 Architecture
- Web app (React/Next.js preferred)
- Backend API (Node, Supabase, or Firebase)
- Database tables:
  - Products
  - Users
  - Carts
  - Cart Items
  - Approvals

### 4.2 Product Data Source
- All product records loaded from january-2025-products.txt
- Parsing logic required to extract structured fields:
  - Product Name
  - Size
  - Item #
  - Category
  - Optional: pricing if included

### 4.3 Security
- Auth required for all actions
- Role-based access control (staff vs manager)

## 5. MVP Success Criteria

The MVP is considered successful if:
- Staff can reliably search and add products to a cart.
- Managers can view and approve/deny submitted carts.
- Approved carts generate a clean, accurate CSV/Excel order file.
- Product search is fast and accurate using January 2025 data.
- Clinics can complete their weekly ordering process using this platform alone.

## 6. Future Upgrade Path (Not in MVP)

These are explicitly post-MVP:
- AI quantity recommendations
- AI usage forecasting
- Auto-ordering logic
- Multi-supplier price comparison
- Inventory scanner integration
- Alerts for stockouts/overstock
- Cash flow optimization
- Vendor API integrations (WDDC, competitors)

