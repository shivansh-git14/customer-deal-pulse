-- ==========================================
-- FIX CUSTOMER HERO METRICS FUNCTION
-- ==========================================
-- Purpose: Update customer hero metrics function with correct column names
-- Date: 2025-08-10
-- Issue: Original function had column name mismatches (is_dm, active_status)
-- Strategy: CREATE OR REPLACE FUNCTION with corrected schema references
-- Dependencies: customers, customer_stage_historical, contacts, revenue, sales_reps
-- ==========================================

-- Update customer hero metrics function with correct column names from schema
CREATE OR REPLACE FUNCTION get_customer_hero_metrics(
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL,
    p_manager_id integer DEFAULT NULL
)
RETURNS TABLE (
    at_risk_rate numeric,
    customers_with_dm_rate numeric,
    health_engagement_score numeric,
    repeat_revenue_rate numeric
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
    
    customer_universe AS (
        -- Get the universe of customers based on filters
        SELECT DISTINCT c.customer_id
        FROM customers c
        WHERE EXISTS (
            SELECT 1 FROM customer_stage_historical csh 
            WHERE csh.customer_id = c.customer_id
            AND (p_start_date IS NULL OR csh.activity_date >= p_start_date)
            AND (p_end_date IS NULL OR csh.activity_date <= p_end_date)
        )
        -- Apply manager filter through deal relationships
        AND (
            p_manager_id IS NULL 
            OR EXISTS (
                SELECT 1 FROM deal_historical dh 
                INNER JOIN filtered_reps fr ON dh.sales_rep_id = fr.sales_rep_id
                WHERE dh.customer_id = c.customer_id
            )
        )
    ),
    
    at_risk_customers AS (
        -- Calculate at-risk customers (those in 'at_risk' lifecycle stage)
        WITH latest_customer_stages AS (
            SELECT 
                csh.customer_id,
                csh.life_cycle_stage,
                ROW_NUMBER() OVER (
                    PARTITION BY csh.customer_id 
                    ORDER BY csh.activity_date DESC
                ) as rn
            FROM customer_stage_historical csh
            INNER JOIN customer_universe cu ON csh.customer_id = cu.customer_id
            WHERE (p_start_date IS NULL OR csh.activity_date >= p_start_date)
            AND (p_end_date IS NULL OR csh.activity_date <= p_end_date)
        )
        SELECT 
            COUNT(CASE WHEN life_cycle_stage = 'at_risk' THEN 1 END) as at_risk_count,
            COUNT(*) as total_customers
        FROM latest_customer_stages
        WHERE rn = 1
    ),
    
    decision_maker_customers AS (
        -- Calculate customers with at least 1 decision maker
        -- FIXED: Use correct column names is_dm and active_status
        SELECT 
            COUNT(DISTINCT CASE WHEN contact_count > 0 THEN cu.customer_id END) as customers_with_dm,
            COUNT(DISTINCT cu.customer_id) as total_customers
        FROM customer_universe cu
        LEFT JOIN (
            SELECT 
                c.customer_id,
                COUNT(*) as contact_count
            FROM contacts c
            WHERE c.is_dm = true              -- FIXED: was is_decision_maker
            AND c.active_status = true        -- FIXED: was is_active
            GROUP BY c.customer_id
        ) dm_counts ON cu.customer_id = dm_counts.customer_id
    ),
    
    health_engagement AS (
        -- Calculate weighted average of contact scores (health/engagement)
        -- FIXED: Use correct column name active_status
        WITH customer_contact_scores AS (
            SELECT 
                cu.customer_id,
                AVG(c.contact_score::numeric) as avg_contact_score,
                COUNT(c.contact_id) as contact_count
            FROM customer_universe cu
            LEFT JOIN contacts c ON cu.customer_id = c.customer_id
            WHERE c.active_status = true      -- FIXED: was is_active
            AND c.contact_score IS NOT NULL
            GROUP BY cu.customer_id
        )
        SELECT 
            COALESCE(
                SUM(avg_contact_score * contact_count) / NULLIF(SUM(contact_count), 0),
                0
            ) as weighted_health_score
        FROM customer_contact_scores
    ),
    
    revenue_analysis AS (
        -- Calculate repeat revenue rate using revenue_category = 'recurring'
        WITH customer_revenue_summary AS (
            SELECT 
                cu.customer_id,
                SUM(CASE WHEN r.revenue_category = 'recurring' THEN r.revenue ELSE 0 END) as repeat_revenue,
                SUM(r.revenue) as total_revenue
            FROM customer_universe cu
            LEFT JOIN revenue r ON cu.customer_id = r.customer_id
            WHERE (p_start_date IS NULL OR r.participation_dt >= p_start_date)
            AND (p_end_date IS NULL OR r.participation_dt <= p_end_date)
            -- Apply manager filter to revenue
            AND (
                p_manager_id IS NULL 
                OR EXISTS (
                    SELECT 1 FROM filtered_reps fr 
                    WHERE r.sales_rep = fr.sales_rep_id
                )
            )
            GROUP BY cu.customer_id
        )
        SELECT 
            COALESCE(
                SUM(repeat_revenue) / 
                NULLIF(SUM(total_revenue), 0) * 100,
                0
            ) as repeat_revenue_percentage
        FROM customer_revenue_summary
    )
    
    -- Combine all metrics into final result
    SELECT 
        COALESCE(
            CASE 
                WHEN arc.total_customers > 0 
                THEN (arc.at_risk_count::numeric / arc.total_customers::numeric) * 100
                ELSE 0 
            END,
            0
        ) as at_risk_rate,
        
        COALESCE(
            CASE 
                WHEN dmc.total_customers > 0 
                THEN (dmc.customers_with_dm::numeric / dmc.total_customers::numeric) * 100
                ELSE 0 
            END,
            0
        ) as customers_with_dm_rate,
        
        COALESCE(he.weighted_health_score, 0) as health_engagement_score,
        
        COALESCE(ra.repeat_revenue_percentage, 0) as repeat_revenue_rate
        
    FROM at_risk_customers arc
    CROSS JOIN decision_maker_customers dmc
    CROSS JOIN health_engagement he
    CROSS JOIN revenue_analysis ra;
    
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_customer_hero_metrics(date, date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_hero_metrics(date, date, integer) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION get_customer_hero_metrics(date, date, integer) IS 'Returns customer health metrics with CORRECTED column names: at-risk rate, decision maker coverage, health/engagement score, and repeat revenue rate';
