-- ==========================================
-- SIMPLE VERSION: ADD CALCULATION DETAILS
-- ==========================================
-- Purpose: Return raw numbers for calculation display (simpler version)
-- Date: 2025-08-10
-- ==========================================

CREATE OR REPLACE FUNCTION get_customer_hero_metrics(
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL,
    p_manager_id integer DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_json json;
    at_risk_count bigint;
    total_customer_count bigint;
    dm_customer_count bigint;
    health_score numeric;
    repeat_revenue_total numeric;
    total_revenue_total numeric;
    managed_rep_ids integer[];
BEGIN
    -- Get managed rep IDs if manager filter is provided
    IF p_manager_id IS NOT NULL THEN
        SELECT ARRAY_AGG(sales_rep_id) INTO managed_rep_ids
        FROM sales_reps 
        WHERE sales_rep_manager_id = p_manager_id OR sales_rep_id = p_manager_id;
    END IF;

    -- Get universe of customers with latest lifecycle stage
    WITH customer_universe AS (
        SELECT DISTINCT c.customer_id
        FROM customers c
        WHERE EXISTS (
            SELECT 1 FROM customer_stage_historical csh 
            WHERE csh.customer_id = c.customer_id
            AND (p_start_date IS NULL OR csh.activity_date >= p_start_date)
            AND (p_end_date IS NULL OR csh.activity_date <= p_end_date)
        )
        AND (
            p_manager_id IS NULL 
            OR EXISTS (
                SELECT 1 FROM deal_historical dh 
                WHERE dh.customer_id = c.customer_id
                AND (managed_rep_ids IS NULL OR dh.sales_rep_id = ANY(managed_rep_ids))
            )
        )
    ),
    latest_customer_stages AS (
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
    
    -- Count at-risk and total customers
    SELECT 
        COUNT(CASE WHEN life_cycle_stage = 'At Risk' THEN 1 ELSE 0 END),
        COUNT(*)
    INTO at_risk_count, total_customer_count
    FROM latest_customer_stages
    WHERE rn = 1;

    -- Count customers with decision makers
    SELECT COUNT(DISTINCT cu.customer_id)
    INTO dm_customer_count
    FROM customer_universe cu
    WHERE EXISTS (
        SELECT 1 FROM contacts c 
        WHERE c.customer_id = cu.customer_id 
        AND c.is_dm = true 
        AND c.active_status = true
    );

    -- Calculate health/engagement score
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
    SELECT COALESCE(
        SUM(avg_contact_score * contact_count) / NULLIF(SUM(contact_count), 0),
        0
    ) INTO health_score
    FROM customer_contact_scores;

    -- Calculate repeat revenue and total revenue
    SELECT 
        SUM(CASE WHEN r.revenue_category = 'repeat' THEN r.revenue ELSE 0 END),
        SUM(r.revenue)
    INTO repeat_revenue_total, total_revenue_total
    FROM customer_universe cu
    LEFT JOIN revenue r ON cu.customer_id = r.customer_id
    WHERE (p_start_date IS NULL OR r.participation_dt >= p_start_date)
    AND (p_end_date IS NULL OR r.participation_dt <= p_end_date)
    AND (
        p_manager_id IS NULL 
        OR managed_rep_ids IS NULL 
        OR r.sales_rep = ANY(managed_rep_ids)
    );

    -- Build JSON result with all values
    SELECT json_build_object(
        'atRiskRate', CASE 
            WHEN total_customer_count > 0 
            THEN ROUND((at_risk_count::numeric / total_customer_count::numeric) * 100, 1)
            ELSE 0 
        END,
        'atRiskCustomers', COALESCE(at_risk_count, 0),
        'totalCustomers', COALESCE(total_customer_count, 0),
        'customersWithDmRate', CASE 
            WHEN total_customer_count > 0 
            THEN ROUND((dm_customer_count::numeric / total_customer_count::numeric) * 100, 1)
            ELSE 0 
        END,
        'customersWithDm', COALESCE(dm_customer_count, 0),
        'healthEngagementScore', ROUND(COALESCE(health_score, 0), 1),
        'repeatRevenueRate', CASE 
            WHEN total_revenue_total > 0 
            THEN ROUND((repeat_revenue_total::numeric / total_revenue_total::numeric) * 100, 1)
            ELSE 0 
        END,
        'repeatRevenueAmount', ROUND(COALESCE(repeat_revenue_total, 0), 2),
        'totalRevenueAmount', ROUND(COALESCE(total_revenue_total, 0), 2)
    ) INTO result_json;

    RETURN result_json;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_customer_hero_metrics(date, date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_hero_metrics(date, date, integer) TO service_role;
