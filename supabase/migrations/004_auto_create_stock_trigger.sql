-- Migration: Auto-create stock record when product is created
-- File: 004_auto_create_stock_trigger.sql
-- Date: 2026-07-12

-- Function: Auto-create stock for new products
CREATE OR REPLACE FUNCTION auto_create_stock_for_product()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert stock record untuk semua branches di tenant yang sama
  INSERT INTO stocks (tenant_id, product_id, branch_id, quantity, min_stock)
  SELECT 
    NEW.tenant_id,
    NEW.id,
    b.id,
    0,  -- initial quantity = 0
    5   -- default min_stock = 5
  FROM branches b
  WHERE b.tenant_id = NEW.tenant_id
  ON CONFLICT (product_id, variant_id, branch_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Execute after product insert
DROP TRIGGER IF EXISTS trigger_auto_create_stock ON products;
CREATE TRIGGER trigger_auto_create_stock
  AFTER INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_stock_for_product();

-- Comment
COMMENT ON FUNCTION auto_create_stock_for_product() IS 
  'Automatically create stock records for all branches when a new product is created';
