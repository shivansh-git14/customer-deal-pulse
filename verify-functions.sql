-- ==========================================
-- RUNTIME FUNCTION VERIFICATION QUERIES
-- ==========================================
-- Use these queries in Supabase SQL Editor to verify functions are working
-- Last Updated: 2025-08-09
-- ==========================================

-- Test 1: Verify consolidated metrics functions exist and work
SELECT 'Testing get_deal_metrics...' as test_name;
SELECT * FROM get_deal_metrics() LIMIT 1;

SELECT 'Testing get_team_metrics...' as test_name;  
SELECT * FROM get_team_metrics() LIMIT 1;

-- Test 2: Verify consolidated table functions exist and work
SELECT 'Testing get_top_deals_with_details...' as test_name;
SELECT * FROM get_top_deals_with_details() LIMIT 3;

SELECT 'Testing get_lost_opportunities_with_details...' as test_name;
SELECT * FROM get_lost_opportunities_with_details() LIMIT 3;

SELECT 'Testing get_lost_opportunities_total_value...' as test_name;
SELECT * FROM get_lost_opportunities_total_value();

-- Test 3: Verify consolidated chart functions exist and work
SELECT 'Testing get_customer_lifecycle_chart...' as test_name;
SELECT get_customer_lifecycle_chart() as chart_data;

-- Test 4: Verify dangerous function is disabled
SELECT 'Testing execute_sql function (should fail)...' as test_name;
-- This should return an error if properly disabled:
-- SELECT execute_sql('SELECT 1');

-- Test 5: Check function definitions in database
SELECT 
    schemaname,
    functionname,
    'ACTIVE' as status
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.prokind = 'f'
AND functionname IN (
    'get_deal_metrics',
    'get_team_metrics', 
    'get_top_deals_with_details',
    'get_lost_opportunities_with_details',
    'get_lost_opportunities_total_value',
    'get_customer_lifecycle_chart'
)
ORDER BY functionname;
