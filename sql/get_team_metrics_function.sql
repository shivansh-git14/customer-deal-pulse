CREATE OR REPLACE FUNCTION get_team_metrics(
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL,
    p_manager_id integer DEFAULT NULL
)
RETURNS TABLE (
    team_name text,
    team_size integer,
    revenue numeric,
    target numeric,
    target_percentage numeric,
    conversion_rate numeric,
    efficiency numeric,
    momentum text,
    risk_level text,
    performance_score numeric,
    avg_deal_size numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH managers AS (
        -- Get all managers (sales reps with no manager_id) or specific manager
        SELECT 
            sr.sales_rep_id,
            sr.sales_rep_name
        FROM sales_reps sr
        WHERE sr.is_active = true 
        AND sr.sales_rep_manager_id IS NULL
        AND (p_manager_id IS NULL OR sr.sales_rep_id = p_manager_id)
    ),
    
    team_members AS (
        -- Get all team members including the manager
        SELECT 
            m.sales_rep_id as manager_id,
            m.sales_rep_name as manager_name,
            coalesce(tm.sales_rep_id, m.sales_rep_id) as team_member_id,
            coalesce(tm.sales_rep_name, m.sales_rep_name) as team_member_name
        FROM managers m
        LEFT JOIN sales_reps tm ON tm.sales_rep_manager_id = m.sales_rep_id 
            AND tm.is_active = true
    ),
    
    team_sizes AS (
        -- Calculate team sizes
        SELECT 
            manager_id,
            manager_name,
            COUNT(*) as team_size
        FROM team_members
        GROUP BY manager_id, manager_name
    ),
    
    team_revenue AS (
        -- Calculate team revenue with date filters
        SELECT 
            tm.manager_id,
            COALESCE(SUM(r.revenue::numeric), 0) as total_revenue
        FROM team_members tm
        LEFT JOIN revenue r ON r.sales_rep = tm.team_member_id
            AND (p_start_date IS NULL OR r.participation_dt >= p_start_date)
            AND (p_end_date IS NULL OR r.participation_dt <= p_end_date)
        GROUP BY tm.manager_id
    ),
    
    team_targets AS (
        -- Calculate team targets
        SELECT 
            tm.manager_id,
            COALESCE(SUM(t.target_value::numeric), 0) as total_target
        FROM team_members tm
        LEFT JOIN targets t ON t.sales_rep_id = tm.team_member_id
        GROUP BY tm.manager_id
    ),
    
    team_deals AS (
        -- Calculate team deal metrics
        SELECT 
            tm.manager_id,
            COUNT(d.deal_id) as total_deals,
            COUNT(CASE WHEN d.deal_stage = 'closed_won' THEN 1 END) as closed_won_deals,
            COALESCE(AVG(CASE 
                WHEN d.max_deal_potential::numeric > 0 
                THEN d.max_deal_potential::numeric 
                ELSE NULL 
            END), 0) as avg_deal_potential
        FROM team_members tm
        LEFT JOIN deals_current d ON d.sales_rep_id = tm.team_member_id
        GROUP BY tm.manager_id
    ),
    
    calculated_metrics AS (
        -- Combine all metrics and calculate derived values
        SELECT 
            ts.manager_name,
            ts.team_size,
            tr.total_revenue as revenue,
            tt.total_target as target,
            -- Target percentage
            CASE 
                WHEN tt.total_target > 0 THEN (tr.total_revenue / tt.total_target) * 100
                ELSE 0 
            END as target_percentage,
            -- Conversion rate
            CASE 
                WHEN td.total_deals > 0 THEN (td.closed_won_deals::numeric / td.total_deals::numeric) * 100
                ELSE 0 
            END as conversion_rate,
            -- Efficiency (revenue per deal)
            CASE 
                WHEN td.total_deals > 0 THEN tr.total_revenue / td.total_deals
                ELSE 0 
            END as efficiency,
            td.avg_deal_potential as avg_deal_size,
            td.total_deals,
            td.closed_won_deals
        FROM team_sizes ts
        JOIN team_revenue tr ON tr.manager_id = ts.manager_id
        JOIN team_targets tt ON tt.manager_id = ts.manager_id
        JOIN team_deals td ON td.manager_id = ts.manager_id
    )
    
    -- Final output with momentum and risk calculations
    SELECT 
        cm.manager_name::text as team_name,
        cm.team_size::integer,
        ROUND(cm.revenue, 2) as revenue,
        ROUND(cm.target, 2) as target,
        ROUND(cm.target_percentage, 1) as target_percentage,
        ROUND(cm.conversion_rate, 1) as conversion_rate,
        ROUND(cm.efficiency, 2) as efficiency,
        -- Momentum calculation
        CASE 
            WHEN cm.target_percentage >= 110 THEN 'Accelerating'
            WHEN cm.target_percentage >= 90 THEN 'Improving'
            WHEN cm.target_percentage < 70 THEN 'Declining'
            ELSE 'Stable'
        END::text as momentum,
        -- Risk level calculation
        CASE 
            WHEN cm.target_percentage >= 90 THEN 'Low'
            WHEN cm.target_percentage < 60 THEN 'High'
            ELSE 'Medium'
        END::text as risk_level,
        -- Performance score (weighted: 60% target performance, 40% conversion rate)
        ROUND(
            GREATEST(0, LEAST(100, 
                (cm.target_percentage * 0.6) + (cm.conversion_rate * 0.4)
            )), 1
        ) as performance_score,
        ROUND(cm.avg_deal_size, 2) as avg_deal_size
    FROM calculated_metrics cm
    ORDER BY cm.manager_name;
    
END;
$$;
