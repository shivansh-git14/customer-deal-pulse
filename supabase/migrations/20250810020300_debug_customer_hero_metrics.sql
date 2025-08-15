-- ==========================================
-- DEBUG CUSTOMER HERO METRICS FUNCTION
-- ==========================================
-- Purpose: Debug version to discover actual data values
-- Date: 2025-08-10
-- Issue: At-risk rate and repeat revenue showing 0 - need to see actual data values
-- ==========================================

-- Create debugging function to see what values actually exist
CREATE OR REPLACE FUNCTION debug_customer_hero_data(
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL,
    p_manager_id integer DEFAULT NULL
)
RETURNS TABLE (
    lifecycle_stages_found text[],
    revenue_categories_found text[],
    total_customers_count bigint,
    total_revenue_records bigint,
    sample_lifecycle_data jsonb,
    sample_revenue_data jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH lifecycle_stages AS (
        SELECT ARRAY_AGG(DISTINCT csh.life_cycle_stage) as stages
        FROM customer_stage_historical csh
        WHERE (p_start_date IS NULL OR csh.activity_date >= p_start_date)
        AND (p_end_date IS NULL OR csh.activity_date <= p_end_date)
    ),
    revenue_categories AS (
        SELECT ARRAY_AGG(DISTINCT r.revenue_category) as categories
        FROM revenue r
        WHERE (p_start_date IS NULL OR r.participation_dt >= p_start_date)
        AND (p_end_date IS NULL OR r.participation_dt <= p_end_date)
    ),
    customer_count AS (
        SELECT COUNT(DISTINCT csh.customer_id) as total_customers
        FROM customer_stage_historical csh
        WHERE (p_start_date IS NULL OR csh.activity_date >= p_start_date)
        AND (p_end_date IS NULL OR csh.activity_date <= p_end_date)
    ),
    revenue_count AS (
        SELECT COUNT(*) as total_revenue_records
        FROM revenue r
        WHERE (p_start_date IS NULL OR r.participation_dt >= p_start_date)
        AND (p_end_date IS NULL OR r.participation_dt <= p_end_date)
    ),
    sample_lifecycle AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'customer_id', csh.customer_id,
                'life_cycle_stage', csh.life_cycle_stage,
                'activity_date', csh.activity_date
            )
        ) as sample_data
        FROM (
            SELECT csh.customer_id, csh.life_cycle_stage, csh.activity_date
            FROM customer_stage_historical csh
            WHERE (p_start_date IS NULL OR csh.activity_date >= p_start_date)
            AND (p_end_date IS NULL OR csh.activity_date <= p_end_date)
            ORDER BY csh.activity_date DESC
            LIMIT 5
        ) csh
    ),
    sample_revenue AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'customer_id', r.customer_id,
                'revenue_category', r.revenue_category,
                'revenue', r.revenue,
                'participation_dt', r.participation_dt
            )
        ) as sample_data
        FROM (
            SELECT r.customer_id, r.revenue_category, r.revenue, r.participation_dt
            FROM revenue r
            WHERE (p_start_date IS NULL OR r.participation_dt >= p_start_date)
            AND (p_end_date IS NULL OR r.participation_dt <= p_end_date)
            ORDER BY r.participation_dt DESC
            LIMIT 5
        ) r
    )
    
    SELECT 
        ls.stages as lifecycle_stages_found,
        rc.categories as revenue_categories_found,
        cc.total_customers as total_customers_count,
        rvc.total_revenue_records as total_revenue_records,
        sl.sample_data as sample_lifecycle_data,
        sr.sample_data as sample_revenue_data
    FROM lifecycle_stages ls
    CROSS JOIN revenue_categories rc
    CROSS JOIN customer_count cc
    CROSS JOIN revenue_count rvc
    CROSS JOIN sample_lifecycle sl
    CROSS JOIN sample_revenue sr;
END;
$$;
-- Grant execute permissions
GRANT EXECUTE ON FUNCTION debug_customer_hero_data(date, date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION debug_customer_hero_data(date, date, integer) TO service_role;
-- Add comment
COMMENT ON FUNCTION debug_customer_hero_data(date, date, integer) IS 'Debug function to discover actual lifecycle stages and revenue categories in the data';
