-- ==========================================
-- ADD CALCULATION DETAILS TO CUSTOMER HERO METRICS
-- ==========================================
-- Purpose: Return raw numbers for calculation display
-- Date: 2025-08-10
-- Features: Add at-risk count, total customers, repeat revenue amount, total revenue amount
-- ==========================================

-- Update customer hero metrics function to include raw calculation values
CREATE OR REPLACE FUNCTION get_customer_hero_metrics(
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL,
    p_manager_id integer DEFAULT NULL
)
RETURNS TABLE (
    at_risk_rate numeric,
    at_risk_customers bigint,
    total_customers bigint,
    customers_with_dm_rate numeric,
    customers_with_dm bigint,
    health_engagement_score numeric,
    repeat_revenue_rate numeric,
    repeat_revenue_amount numeric,
    total_revenue_amount numeric
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
        -- Calculate at-risk customers with raw counts
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
            COUNT(CASE WHEN life_cycle_stage IN (
                'At Risk'
            ) THEN 1 END) as at_risk_count,
            COUNT(*) as total_customers_count
        FROM latest_customer_stages
        WHERE rn = 1
    ),
    
    decision_maker_customers AS (
        -- Calculate customers with at least 1 decision maker with raw counts
        SELECT 
            COUNT(DISTINCT CASE WHEN contact_count > 0 THEN cu.customer_id END) as customers_with_dm_count,
            COUNT(DISTINCT cu.customer_id) as total_customers_for_dm
        FROM customer_universe cu
        LEFT JOIN (
            SELECT 
                c.customer_id,
                COUNT(*) as contact_count
            FROM contacts c
            WHERE c.is_dm = true
            AND c.active_status = true
            GROUP BY c.customer_id
        ) dm_counts ON cu.customer_id = dm_counts.customer_id
    ),
    
    health_engagement AS (
        -- Calculate weighted average of contact scores
        WITH customer_contact_scores AS (
            SELECT 
                cu.customer_id,
                AVG(c.contact_score::numeric) as avg_contact_score,
                COUNT(c.contact_id) as contact_count
            FROM customer_universe cu
            LEFT JOIN contacts c ON cu.customer_id = c.customer_id
            WHERE c.active_status = true
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
        -- Calculate repeat revenue with raw amounts
        WITH customer_revenue_summary AS (
            SELECT 
                cu.customer_id,
                SUM(CASE WHEN r.revenue_category = 'repeat' THEN r.revenue ELSE 0 END) as repeat_revenue,
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
            SUM(repeat_revenue) as total_repeat_revenue,
            SUM(total_revenue) as total_all_revenue,
            COALESCE(
                SUM(repeat_revenue) / 
                NULLIF(SUM(total_revenue), 0) * 100,
                0
            ) as repeat_revenue_percentage
        FROM customer_revenue_summary
    )
    
    -- Combine all metrics into final result with raw values
    SELECT 
        COALESCE(
            CASE 
                WHEN arc.total_customers_count > 0 
                THEN (arc.at_risk_count::numeric / arc.total_customers_count::numeric) * 100
                ELSE 0 
            END,
            0
        ) as at_risk_rate,
        
        arc.at_risk_count as at_risk_customers,
        arc.total_customers_count as total_customers,
        
        COALESCE(
            CASE 
                WHEN dmc.total_customers_for_dm > 0 
                THEN (dmc.customers_with_dm_count::numeric / dmc.total_customers_for_dm::numeric) * 100
                ELSE 0 
            END,
            0
        ) as customers_with_dm_rate,
        
        dmc.customers_with_dm_count as customers_with_dm,
        
        COALESCE(he.weighted_health_score, 0) as health_engagement_score,
        
        COALESCE(ra.repeat_revenue_percentage, 0) as repeat_revenue_rate,
        COALESCE(ra.total_repeat_revenue, 0) as repeat_revenue_amount,
        COALESCE(ra.total_all_revenue, 0) as total_revenue_amount
        
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
COMMENT ON FUNCTION get_customer_hero_metrics(date, date, integer) IS 'Returns customer health metrics with raw calculation values for display (counts and amounts)';
