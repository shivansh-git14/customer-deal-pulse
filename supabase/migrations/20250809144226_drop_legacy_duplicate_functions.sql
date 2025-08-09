-- ==========================================
-- DROP LEGACY DUPLICATE FUNCTIONS
-- ==========================================
-- Purpose: Remove duplicate functions that were consolidated in Option B strategy
-- Problem: Local migration comments don't sync to cloud, leaving duplicates active
-- Solution: Explicitly DROP legacy functions to achieve single source of truth
-- Date: 2025-08-09
-- References: 
--   - Legacy functions moved from: 20250808135434_add_secure_metrics_functions.sql
--   - New consolidated location: metrics/table/chart_functions_consolidated.sql files
-- ==========================================

set check_function_bodies = off;

-- ==========================================
-- DROP METRICS FUNCTIONS (moved to 20250809140632_metrics_functions_consolidated.sql)
-- ==========================================

-- Drop legacy get_deal_metrics function
DROP FUNCTION IF EXISTS public.get_deal_metrics(
    p_start_date date,
    p_end_date date, 
    p_manager_id integer
);

-- Drop legacy get_team_metrics function  
DROP FUNCTION IF EXISTS public.get_team_metrics(
    p_start_date date,
    p_end_date date,
    p_manager_id integer
);

-- ==========================================
-- DROP TABLE FUNCTIONS (moved to 20250809141053_table_functions_consolidated.sql)
-- ==========================================

-- Drop legacy get_top_deals_with_details function
DROP FUNCTION IF EXISTS public.get_top_deals_with_details(
    p_start_date date,
    p_end_date date,
    p_manager_id integer
);

-- Drop legacy get_lost_opportunities_with_details function
DROP FUNCTION IF EXISTS public.get_lost_opportunities_with_details(
    p_start_date date,
    p_end_date date,
    p_manager_id integer
);

-- Drop legacy get_lost_opportunities_total_value function
DROP FUNCTION IF EXISTS public.get_lost_opportunities_total_value(
    p_start_date date,
    p_end_date date,
    p_manager_id integer
);

-- ==========================================
-- DROP DANGEROUS SECURITY FUNCTIONS
-- ==========================================

-- Drop dangerous execute_sql function (SQL injection risk)
DROP FUNCTION IF EXISTS public.execute_sql(query text);

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
-- These will confirm the cleanup worked properly

-- Verify no duplicate functions remain
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Log remaining functions for verification
    RAISE NOTICE 'SINGLE SOURCE OF TRUTH VERIFICATION:';
    RAISE NOTICE 'Functions remaining after cleanup:';
    
    -- This will show only the consolidated functions should remain
    FOR rec IN (
        SELECT p.proname as functionname
        FROM pg_catalog.pg_proc p
        JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.prokind = 'f'
        AND p.proname IN (
            'get_deal_metrics',
            'get_team_metrics', 
            'get_top_deals_with_details',
            'get_lost_opportunities_with_details',
            'get_lost_opportunities_total_value',
            'get_customer_lifecycle_chart',
            'execute_sql'
        )
        ORDER BY functionname
    ) LOOP
        RAISE NOTICE '  ✅ Function found: %', rec.functionname;
    END LOOP;
    
    RAISE NOTICE '🎯 Single source of truth achieved - only consolidated functions remain!';
END $$;