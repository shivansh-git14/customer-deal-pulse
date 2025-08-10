-- ==========================================
-- Migration: Update get_deal_metrics column references
-- Timestamp: 2025-08-10 12:47:30+05:30
-- Purpose: Align to consistent schema using deal_stage and activity_date
-- Notes:
--   - Uses CREATE OR REPLACE (return type unchanged)
--   - Adds consistent GRANTs
-- ==========================================

set check_function_bodies = off;

-- ==========================================
-- Function: get_deal_metrics
-- ==========================================
-- Purpose: Calculate comprehensive deal metrics (lead response time, conversion rate, cycle length, touchpoints)
-- Parameters: 
--   - p_start_date: Filter start date (optional)
--   - p_end_date: Filter end date (optional) 
--   - p_manager_id: Filter by specific manager (optional)
-- Returns: TABLE with leadresponsetime, conversionrate, dealcyclelength, touchpointsperdeal
-- Dependencies: sales_reps, deal_historical, events
-- ==========================================

CREATE OR REPLACE FUNCTION get_deal_metrics(
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL,
    p_manager_id integer DEFAULT NULL
)
RETURNS TABLE (
    leadresponsetime numeric,
    conversionrate numeric,
    dealcyclelength numeric,
    touchpointsperdeal numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH filtered_reps AS (
        -- Get sales reps based on manager filter
        SELECT sr.sales_rep_id
        FROM sales_reps sr
        WHERE sr.is_active = true
        AND (
            p_manager_id IS NULL 
            OR sr.sales_rep_manager_id = p_manager_id
            OR sr.sales_rep_id = p_manager_id
        )
    ),
    
    lead_response_time AS (
        -- Calculate average lead response time (prospecting -> qualified)
        WITH prospecting_deals AS (
            SELECT 
                dh.deal_id,
                dh.activity_date,
                dh.sales_rep_id
            FROM deal_historical dh
            INNER JOIN filtered_reps fr ON dh.sales_rep_id = fr.sales_rep_id
            WHERE dh.deal_stage = 'prospecting'
            AND (p_start_date IS NULL OR dh.activity_date::date >= p_start_date)
            AND (p_end_date IS NULL OR dh.activity_date::date <= p_end_date)
        ),
        qualified_deals AS (
            SELECT 
                dh.deal_id,
                dh.activity_date,
                dh.sales_rep_id
            FROM deal_historical dh
            INNER JOIN filtered_reps fr ON dh.sales_rep_id = fr.sales_rep_id
            WHERE dh.deal_stage = 'qualified'
        )
        SELECT COALESCE(AVG(
            EXTRACT(EPOCH FROM (qd.activity_date - pd.activity_date)) / 86400
        ), 0) as avg_response_time
        FROM prospecting_deals pd
        INNER JOIN qualified_deals qd ON pd.deal_id = qd.deal_id
        WHERE qd.activity_date >= pd.activity_date
    ),
    
    conversion_metrics AS (
        -- Calculate conversion rate (prospecting -> closed_won)
        WITH stage_counts AS (
            SELECT 
                COUNT(CASE WHEN dh.deal_stage = 'prospecting' THEN 1 END) as prospecting_count,
                COUNT(CASE WHEN dh.deal_stage = 'closed_won' THEN 1 END) as closed_won_count
            FROM deal_historical dh
            INNER JOIN filtered_reps fr ON dh.sales_rep_id = fr.sales_rep_id
        )
        SELECT 
            CASE 
                WHEN prospecting_count > 0 
                THEN (closed_won_count::numeric / prospecting_count::numeric) * 100
                ELSE 0
            END as conversion_rate
        FROM stage_counts
    ),
    
    cycle_length AS (
        -- Calculate average deal cycle length (prospecting -> closed_won)
        WITH deal_stages AS (
            SELECT 
                dh.deal_id,
                MIN(CASE WHEN dh.deal_stage = 'prospecting' THEN dh.activity_date END) as prospecting_date,
                MAX(CASE WHEN dh.deal_stage = 'closed_won' THEN dh.activity_date END) as closed_won_date
            FROM deal_historical dh
            INNER JOIN filtered_reps fr ON dh.sales_rep_id = fr.sales_rep_id
            GROUP BY dh.deal_id
            HAVING MIN(CASE WHEN dh.deal_stage = 'prospecting' THEN dh.activity_date END) IS NOT NULL
            AND MAX(CASE WHEN dh.deal_stage = 'closed_won' THEN dh.activity_date END) IS NOT NULL
        )
        SELECT COALESCE(AVG(
            EXTRACT(EPOCH FROM (closed_won_date - prospecting_date)) / 86400
        ), 0) as avg_cycle_length
        FROM deal_stages
    ),
    
    touchpoints AS (
        -- Calculate average touchpoints per deal
        WITH deal_touchpoints AS (
            SELECT 
                e.deal_id,
                COUNT(*) as touchpoint_count
            FROM events e
            INNER JOIN filtered_reps fr ON e.sales_rep_id = fr.sales_rep_id
            WHERE e.deal_id IS NOT NULL
            GROUP BY e.deal_id
        )
        SELECT COALESCE(AVG(touchpoint_count), 0) as avg_touchpoints
        FROM deal_touchpoints
    )
    
    -- Combine all metrics
    SELECT 
        ROUND(lrt.avg_response_time, 1) as leadresponsetime,
        ROUND(cm.conversion_rate, 1) as conversionrate,
        ROUND(cl.avg_cycle_length, 0) as dealcyclelength,
        ROUND(tp.avg_touchpoints, 0) as touchpointsperdeal
    FROM lead_response_time lrt,
         conversion_metrics cm,
         cycle_length cl,
         touchpoints tp;
    
END;
$$;

-- Consistent grants
GRANT EXECUTE ON FUNCTION public.get_deal_metrics(date, date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_deal_metrics(date, date, integer) TO service_role;
