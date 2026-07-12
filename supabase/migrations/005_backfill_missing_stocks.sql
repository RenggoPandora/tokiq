-- Migration: Backfill missing stock records for existing products
-- File: 005_backfill_missing_stocks.sql
-- Date: 2026-07-12

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

-- Log hasil
DO $$
DECLARE
  inserted_count INTEGER;
BEGIN
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % stock records', inserted_count;
END;
$$;
