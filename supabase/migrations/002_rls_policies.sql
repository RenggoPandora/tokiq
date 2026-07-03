-- ==========================================
-- tokiq ROW LEVEL SECURITY POLICIES
-- File: 002_rls_policies.sql
-- ==========================================

-- Helper function to get current user's tenant_id (STABLE for performance cache)
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ==========================================
-- 1. SUBSCRIPTION PLANS (Global Read, Admin Write)
-- ==========================================
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated and anonymous to read plans" ON subscription_plans
  FOR SELECT USING (true);

-- ==========================================
-- 2. TENANTS
-- ==========================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Owner or staff of the tenant can read the tenant record
CREATE POLICY "Allow read own tenant" ON tenants
  FOR SELECT TO authenticated
  USING (
    owner_user_id = auth.uid() 
    OR 
    id = get_user_tenant_id()
  );

-- Only the owner can update their tenant record
CREATE POLICY "Allow update own tenant" ON tenants
  FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- ==========================================
-- 3. INVOICES
-- ==========================================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read own invoices" ON invoices
  FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Allow insert own invoice" ON invoices
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id());

-- ==========================================
-- 4. BRANCHES
-- ==========================================
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on own branches" ON branches
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- ==========================================
-- 5. TENANT USERS
-- ==========================================
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- Allow reading all users in the same tenant
CREATE POLICY "Allow read same tenant users" ON tenant_users
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT u.tenant_id FROM tenant_users u WHERE u.user_id = auth.uid() LIMIT 1));

-- Allow inserting own user record or by managers/owners of the same tenant
CREATE POLICY "Allow manage same tenant users" ON tenant_users
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT u.tenant_id FROM tenant_users u WHERE u.user_id = auth.uid() LIMIT 1))
  WITH CHECK (tenant_id = (SELECT u.tenant_id FROM tenant_users u WHERE u.user_id = auth.uid() LIMIT 1));

-- ==========================================
-- 6. CATEGORIES
-- ==========================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on own categories" ON categories
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- ==========================================
-- 7. PRODUCTS
-- ==========================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on own products" ON products
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- ==========================================
-- 8. PRODUCT PRICES
-- ==========================================
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on own product_prices" ON product_prices
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- ==========================================
-- 9. PRODUCT VARIANTS
-- ==========================================
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on own product_variants" ON product_variants
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- ==========================================
-- 10. PRODUCT ADDONS
-- ==========================================
ALTER TABLE product_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on own product_addons" ON product_addons
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- ==========================================
-- 11. STOCKS
-- ==========================================
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on own stocks" ON stocks
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- ==========================================
-- 12. STOCK MOVEMENTS
-- ==========================================
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on own stock_movements" ON stock_movements
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- ==========================================
-- 13. SUPPLIERS
-- ==========================================
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on own suppliers" ON suppliers
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- ==========================================
-- 14. PURCHASES
-- ==========================================
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on own purchases" ON purchases
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- ==========================================
-- 15. PURCHASE ITEMS
-- ==========================================
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on own purchase_items" ON purchase_items
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- ==========================================
-- 16. CUSTOMERS
-- ==========================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on own customers" ON customers
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- ==========================================
-- 17. SHIFTS
-- ==========================================
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on own shifts" ON shifts
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- ==========================================
-- 18. CASH MOVEMENTS
-- ==========================================
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on own cash_movements" ON cash_movements
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- ==========================================
-- 19. TRANSACTIONS
-- ==========================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on own transactions" ON transactions
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- ==========================================
-- 20. TRANSACTION ITEMS
-- ==========================================
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on own transaction_items" ON transaction_items
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- ==========================================
-- 21. DISCOUNTS
-- ==========================================
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on own discounts" ON discounts
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());
