-- Migration 005: Backfill missing stocks (FIXED VERSION)
-- Jalankan query ini di Supabase SQL Editor

DO $$
DECLARE
  inserted_count INTEGER;
BEGIN
  -- Backfill: Create missing stock records for existing products
  INSERT INTO stocks (tenant_id, product_id, branch_id, quantity, min_stock)
  SELECT 
    p.tenant_id,
    p.id AS product_id,
    b.id AS branch_id,
    0 AS quantity,
    5 AS min_stock
  FROM products p
  CROSS JOIN branches b
  WHERE p.tenant_id = b.tenant_id
    AND NOT EXISTS (
      SELECT 1 FROM stocks s
      WHERE s.product_id = p.id
        AND s.branch_id = b.id
        AND s.variant_id IS NULL
    )
  ON CONFLICT (product_id, variant_id, branch_id) DO NOTHING;

  -- Get affected rows
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  
  -- Log hasil
  RAISE NOTICE 'Backfilled % stock records', inserted_count;
END;
$$;

-- Verify hasil
SELECT 
  (SELECT COUNT(*) FROM products) as total_products,
  (SELECT COUNT(*) FROM stocks WHERE variant_id IS NULL) as total_stock_records,
  (SELECT COUNT(DISTINCT product_id) FROM stocks WHERE variant_id IS NULL) as products_with_stock;
