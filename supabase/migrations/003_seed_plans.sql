-- ==========================================
-- tokiq SEED DATA - SUBSCRIPTION PLANS
-- File: 003_seed_plans.sql
-- ==========================================

-- Insert subscription plans if they do not exist
INSERT INTO subscription_plans (name, price_monthly, price_yearly, trial_days, is_active, features)
VALUES 
  (
    'Starter', 
    149000, 
    1490000, -- 10 months if paid yearly (discount)
    14, 
    true, 
    '{
      "branches_limit": 1,
      "cashiers_limit": 3,
      "pos_features": true,
      "basic_reports": true,
      "advanced_reports": false,
      "export_excel_pdf": false,
      "multi_branch": false
    }'::jsonb
  ),
  (
    'Pro', 
    299000, 
    2990000, -- 10 months if paid yearly (discount)
    14, 
    true, 
    '{
      "branches_limit": -1, -- unlimited
      "cashiers_limit": -1, -- unlimited
      "pos_features": true,
      "basic_reports": true,
      "advanced_reports": true,
      "export_excel_pdf": true,
      "multi_branch": true
    }'::jsonb
  )
ON CONFLICT DO NOTHING;
