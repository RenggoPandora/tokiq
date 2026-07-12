-- Migration: Create decrement_stock RPC function
-- File: 006_create_decrement_stock_function.sql
-- Date: 2026-07-12

CREATE OR REPLACE FUNCTION decrement_stock(
  p_tenant_id UUID,
  p_branch_id UUID,
  p_product_id UUID,
  p_variant_id UUID,
  p_quantity INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update stock quantity
  UPDATE stocks
  SET 
    quantity = quantity - p_quantity,
    updated_at = NOW()
  WHERE 
    tenant_id = p_tenant_id
    AND branch_id = p_branch_id
    AND product_id = p_product_id
    AND (
      (p_variant_id IS NULL AND variant_id IS NULL) OR
      (variant_id = p_variant_id)
    );

  -- Log stock movement
  INSERT INTO stock_movements (
    tenant_id,
    branch_id,
    product_id,
    variant_id,
    type,
    quantity,
    notes
  ) VALUES (
    p_tenant_id,
    p_branch_id,
    p_product_id,
    p_variant_id,
    'sale',
    -p_quantity,
    'Auto deducted from POS transaction'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION decrement_stock TO authenticated;

COMMENT ON FUNCTION decrement_stock IS 
  'Decrement product stock and log movement when POS transaction is created';
