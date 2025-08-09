-- ==========================================
-- LEGACY MIGRATION FILE - FUNCTIONS MOVED
-- ==========================================
-- All functions in this file have been moved to topic-specific consolidated files:
-- - Metrics functions → 20250809140632_metrics_functions_consolidated.sql
-- - Table functions → 20250809141053_table_functions_consolidated.sql
-- - Chart functions → 20250809141318_chart_functions_consolidated.sql
-- 
-- Reason: Option B function consolidation strategy implementation
-- Date: 2025-08-09
-- Status: SUPERSEDED - Use the new consolidated files instead
-- ==========================================
--
-- ORIGINAL COMMENT:
-- Add secure PostgreSQL functions to replace dangerous edge function logic
-- This migration contains all secure functions for: metrics endpoints and table data endpoints

-- ==========================================
-- MOVED TO: metrics_functions_consolidated.sql
-- ==========================================
-- Function 1: get_deal_metrics (replaces new-deals-metrics edge function logic)
-- CREATE OR REPLACE FUNCTION get_deal_metrics(
--     p_start_date date DEFAULT NULL,
--     p_end_date date DEFAULT NULL,
--     p_manager_id integer DEFAULT NULL
-- )
-- RETURNS TABLE (
--     leadresponsetime numeric,
--     conversionrate numeric,
--     dealcyclelength numeric,
--     touchpointsperdeal numeric
-- )
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$
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
                COUNT(CASE WHEN dh.stage = 'prospecting' THEN 1 END) as prospecting_count,
                COUNT(CASE WHEN dh.stage = 'closed_won' THEN 1 END) as closed_won_count
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
                MIN(CASE WHEN dh.stage = 'prospecting' THEN dh.stage_change_date END) as prospecting_date,
                MAX(CASE WHEN dh.stage = 'closed_won' THEN dh.stage_change_date END) as closed_won_date
            FROM deal_historical dh
            INNER JOIN filtered_reps fr ON dh.sales_rep_id = fr.sales_rep_id
            GROUP BY dh.deal_id
            HAVING MIN(CASE WHEN dh.stage = 'prospecting' THEN dh.stage_change_date END) IS NOT NULL
            AND MAX(CASE WHEN dh.stage = 'closed_won' THEN dh.stage_change_date END) IS NOT NULL
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

-- ==========================================
-- MOVED TO: metrics_functions_consolidated.sql
-- ==========================================
-- Function 2: get_team_metrics (replaces team-metrics edge function logic)
-- CREATE OR REPLACE FUNCTION get_team_metrics(
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


-- =============================================================================
-- Customer Lifecycle Chart Function
-- =============================================================================

-- Secure PostgreSQL function to get customer lifecycle chart data
-- Returns monthly composition of customer lifecycle stages with revenue per segment

CREATE OR REPLACE FUNCTION get_customer_lifecycle_chart(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_manager_id INTEGER DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  chart_data JSON;
  managed_rep_ids INTEGER[];
BEGIN
  -- Get managed rep IDs if manager filter is provided
  IF p_manager_id IS NOT NULL THEN
    SELECT ARRAY_AGG(sales_rep_id) INTO managed_rep_ids
    FROM sales_reps 
    WHERE sales_rep_manager_id = p_manager_id;
    
    -- If no reps found, return empty chart data
    IF managed_rep_ids IS NULL OR array_length(managed_rep_ids, 1) IS NULL THEN
      RETURN json_build_object(
        'success', true,
        'data', '[]'::json
      );
    END IF;
  END IF;

  -- Build chart data: monthly customer lifecycle composition with revenue
  WITH date_filtered_customers AS (
    -- Get customers in each lifecycle stage per month within date range
    SELECT 
      DATE_TRUNC('month', csh.activity_date)::date as month,
      csh.life_cycle_stage,
      csh.customer_id,
      -- Get the latest stage record for each customer in each month
      ROW_NUMBER() OVER (
        PARTITION BY csh.customer_id, DATE_TRUNC('month', csh.activity_date) 
        ORDER BY csh.activity_date DESC
      ) as rn
    FROM customer_stage_historical csh
    WHERE (p_start_date IS NULL OR csh.activity_date >= p_start_date)
      AND (p_end_date IS NULL OR csh.activity_date <= p_end_date)
  ),
  customer_stages_monthly AS (
    -- Keep only the latest stage for each customer per month
    SELECT month, life_cycle_stage, customer_id
    FROM date_filtered_customers
    WHERE rn = 1
  ),
  revenue_monthly AS (
    -- Aggregate revenue by customer and month
    SELECT 
      DATE_TRUNC('month', r.participation_dt)::date as month,
      r.customer_id,
      SUM(r.revenue) as total_revenue
    FROM revenue r
    WHERE (p_start_date IS NULL OR r.participation_dt >= p_start_date)
      AND (p_end_date IS NULL OR r.participation_dt <= p_end_date)
      -- Apply manager filter to revenue if provided
      AND (p_manager_id IS NULL OR r.sales_rep = ANY(managed_rep_ids))
    GROUP BY DATE_TRUNC('month', r.participation_dt), r.customer_id
  ),
  lifecycle_with_revenue AS (
    -- Join customer stages with their revenue for each month
    SELECT 
      csm.month,
      csm.life_cycle_stage,
      csm.customer_id,
      COALESCE(rm.total_revenue, 0) as customer_revenue
    FROM customer_stages_monthly csm
    LEFT JOIN revenue_monthly rm ON csm.month = rm.month AND csm.customer_id = rm.customer_id
  ),
  stage_totals AS (
    -- Aggregate by month and lifecycle stage
    SELECT 
      month,
      life_cycle_stage,
      COUNT(DISTINCT customer_id) as customer_count,
      SUM(customer_revenue) as total_revenue
    FROM lifecycle_with_revenue
    GROUP BY month, life_cycle_stage
  ),
  monthly_totals AS (
    -- Get total customers per month for percentage calculation
    SELECT 
      month,
      SUM(customer_count) as total_customers_in_month
    FROM stage_totals
    GROUP BY month
  ),
  final_data AS (
    -- Calculate percentages and format data
    SELECT 
      st.month,
      json_agg(
        json_build_object(
          'stage', st.life_cycle_stage,
          'customerCount', st.customer_count,
          'totalRevenue', ROUND(st.total_revenue, 2),
          'percentage', CASE 
            WHEN mt.total_customers_in_month > 0 
            THEN ROUND((st.customer_count::NUMERIC / mt.total_customers_in_month::NUMERIC) * 100, 1)
            ELSE 0 
          END
        ) ORDER BY st.life_cycle_stage
      ) as stages
    FROM stage_totals st
    JOIN monthly_totals mt ON st.month = mt.month
    GROUP BY st.month, mt.total_customers_in_month
  )
  -- Build final JSON response
  SELECT json_agg(
    json_build_object(
      'month', TO_CHAR(month, 'YYYY-MM'),
      'stages', stages
    ) ORDER BY month
  ) INTO chart_data
  FROM final_data;

  -- Return the chart data
  RETURN json_build_object(
    'success', true,
    'data', COALESCE(chart_data, '[]'::json)
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_customer_lifecycle_chart(DATE, DATE, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_lifecycle_chart(DATE, DATE, INTEGER) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION get_customer_lifecycle_chart(DATE, DATE, INTEGER) IS 'Returns monthly customer lifecycle composition with revenue data for stacked bar chart visualization';


-- =============================================================================
-- Customer Lifecycle Chart Function
-- =============================================================================

-- Secure PostgreSQL function to get customer lifecycle chart data
-- Returns monthly composition of customer lifecycle stages with revenue per segment

CREATE OR REPLACE FUNCTION get_customer_lifecycle_chart(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_manager_id INTEGER DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  chart_data JSON;
  managed_rep_ids INTEGER[];
BEGIN
  -- Get managed rep IDs if manager filter is provided
  IF p_manager_id IS NOT NULL THEN
    SELECT ARRAY_AGG(sales_rep_id) INTO managed_rep_ids
    FROM sales_reps 
    WHERE sales_rep_manager_id = p_manager_id;
    
    -- If no reps found, return empty chart data
    IF managed_rep_ids IS NULL OR array_length(managed_rep_ids, 1) IS NULL THEN
      RETURN json_build_object(
        'success', true,
        'data', '[]'::json
      );
    END IF;
  END IF;

  -- Build chart data: monthly customer lifecycle composition with revenue
  WITH date_filtered_customers AS (
    -- Get customers in each lifecycle stage per month within date range
    SELECT 
      DATE_TRUNC('month', csh.activity_date)::date as month,
      csh.life_cycle_stage,
      csh.customer_id,
      -- Get the latest stage record for each customer in each month
      ROW_NUMBER() OVER (
        PARTITION BY csh.customer_id, DATE_TRUNC('month', csh.activity_date) 
        ORDER BY csh.activity_date DESC
      ) as rn
    FROM customer_stage_historical csh
    WHERE (p_start_date IS NULL OR csh.activity_date >= p_start_date)
      AND (p_end_date IS NULL OR csh.activity_date <= p_end_date)
  ),
  customer_stages_monthly AS (
    -- Keep only the latest stage for each customer per month
    SELECT month, life_cycle_stage, customer_id
    FROM date_filtered_customers
    WHERE rn = 1
  ),
  revenue_monthly AS (
    -- Aggregate revenue by customer and month
    SELECT 
      DATE_TRUNC('month', r.participation_dt)::date as month,
      r.customer_id,
      SUM(r.revenue) as total_revenue
    FROM revenue r
    WHERE (p_start_date IS NULL OR r.participation_dt >= p_start_date)
      AND (p_end_date IS NULL OR r.participation_dt <= p_end_date)
      -- Apply manager filter to revenue if provided
      AND (p_manager_id IS NULL OR r.sales_rep = ANY(managed_rep_ids))
    GROUP BY DATE_TRUNC('month', r.participation_dt), r.customer_id
  ),
  lifecycle_with_revenue AS (
    -- Join customer stages with their revenue for each month
    SELECT 
      csm.month,
      csm.life_cycle_stage,
      csm.customer_id,
      COALESCE(rm.total_revenue, 0) as customer_revenue
    FROM customer_stages_monthly csm
    LEFT JOIN revenue_monthly rm ON csm.month = rm.month AND csm.customer_id = rm.customer_id
  ),
  stage_totals AS (
    -- Aggregate by month and lifecycle stage
    SELECT 
      month,
      life_cycle_stage,
      COUNT(DISTINCT customer_id) as customer_count,
      SUM(customer_revenue) as total_revenue
    FROM lifecycle_with_revenue
    GROUP BY month, life_cycle_stage
  ),
  monthly_totals AS (
    -- Get total customers per month for percentage calculation
    SELECT 
      month,
      SUM(customer_count) as total_customers_in_month
    FROM stage_totals
    GROUP BY month
  ),
  final_data AS (
    -- Calculate percentages and format data
    SELECT 
      st.month,
      json_agg(
        json_build_object(
          'stage', st.life_cycle_stage,
          'customerCount', st.customer_count,
          'totalRevenue', ROUND(st.total_revenue, 2),
          'percentage', CASE 
            WHEN mt.total_customers_in_month > 0 
            THEN ROUND((st.customer_count::NUMERIC / mt.total_customers_in_month::NUMERIC) * 100, 1)
            ELSE 0 
          END
        ) ORDER BY st.life_cycle_stage
      ) as stages
    FROM stage_totals st
    JOIN monthly_totals mt ON st.month = mt.month
    GROUP BY st.month, mt.total_customers_in_month
  )
  -- Build final JSON response
  SELECT json_agg(
    json_build_object(
      'month', TO_CHAR(month, 'YYYY-MM'),
      'stages', stages
    ) ORDER BY month
  ) INTO chart_data
  FROM final_data;

  -- Return the chart data
  RETURN json_build_object(
    'success', true,
    'data', COALESCE(chart_data, '[]'::json)
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_customer_lifecycle_chart(DATE, DATE, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_lifecycle_chart(DATE, DATE, INTEGER) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION get_customer_lifecycle_chart(DATE, DATE, INTEGER) IS 'Returns monthly customer lifecycle composition with revenue data for stacked bar chart visualization';

-- ==========================================
-- MOVED TO: table_functions_consolidated.sql
-- ==========================================
-- Function 3: get_top_deals_with_details (replaces new-deals-tables edge function logic)
-- CREATE OR REPLACE FUNCTION get_top_deals_with_details(
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL,
    p_manager_id integer DEFAULT NULL
)
RETURNS TABLE (
    deal_id integer,
    deal_value numeric,
    deal_stage text,
    customer_name text,
    event_summary text,
    event_timestamp timestamp with time zone
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
    
    latest_events AS (
        -- Get the latest event per customer within the date range
        SELECT DISTINCT ON (e.customer_id) 
            e.customer_id,
            e.event_summary,
            e.event_timestamp
        FROM events e
        INNER JOIN filtered_reps fr ON e.sales_rep_id = fr.sales_rep_id
        WHERE (
            p_start_date IS NULL OR e.event_timestamp::date >= p_start_date
        ) AND (
            p_end_date IS NULL OR e.event_timestamp::date <= p_end_date
        )
        ORDER BY e.customer_id, e.event_timestamp DESC
    ),
    
    top_deals_base AS (
        -- Get top deals (non-closed/lost) with customer and sales rep filtering
        SELECT DISTINCT ON (dh.deal_id)
            dh.deal_id,
            dh.deal_value,
            dh.deal_stage,
            dh.customer_id,
            dh.activity_date
        FROM deal_historical dh
        INNER JOIN filtered_reps fr ON dh.sales_rep_id = fr.sales_rep_id
        WHERE dh.deal_stage NOT IN ('closed_lost', 'lost')
        AND (
            p_start_date IS NULL OR dh.activity_date::date >= p_start_date
        ) AND (
            p_end_date IS NULL OR dh.activity_date::date <= p_end_date
        )
        ORDER BY dh.deal_id, dh.activity_date DESC
    )
    
    -- Final result with customer names and latest events
    SELECT 
        td.deal_id::integer,
        td.deal_value::numeric,
        td.deal_stage::text,
        c.customer_name::text,
        le.event_summary::text,
        le.event_timestamp
    FROM top_deals_base td
    INNER JOIN customers c ON td.customer_id = c.customer_id
    LEFT JOIN latest_events le ON td.customer_id = le.customer_id
    ORDER BY td.deal_value DESC NULLS LAST
    LIMIT 10;
    
END;
$$;

-- ==========================================
-- MOVED TO: table_functions_consolidated.sql
-- ==========================================
-- Function 4: get_lost_opportunities_with_details (replaces lost opportunities logic)
-- CREATE OR REPLACE FUNCTION get_lost_opportunities_with_details(
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL,
    p_manager_id integer DEFAULT NULL
)
RETURNS TABLE (
    deal_id integer,
    deal_value numeric,
    deal_stage text,
    customer_name text,
    event_summary text,
    event_timestamp timestamp with time zone
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
    
    latest_events AS (
        -- Get the latest event per customer within the date range
        SELECT DISTINCT ON (e.customer_id) 
            e.customer_id,
            e.event_summary,
            e.event_timestamp,
            row_number() over (partition by e.customer_id order by e.event_timestamp desc) as rn
        FROM events e
        INNER JOIN filtered_reps fr ON e.sales_rep_id = fr.sales_rep_id
        WHERE (
            p_start_date IS NULL OR e.event_timestamp::date >= p_start_date
        ) AND (
            p_end_date IS NULL OR e.event_timestamp::date <= p_end_date
        )
        ORDER BY e.customer_id, e.event_timestamp DESC
    ),
    
    lost_deals_base AS (
        -- Get lost opportunities with customer and sales rep filtering
        SELECT DISTINCT ON (dh.deal_id)
            dh.deal_id,
            dh.deal_value,
            dh.deal_stage,
            dh.customer_id,
            dh.activity_date
        FROM deal_historical dh
        INNER JOIN filtered_reps fr ON dh.sales_rep_id = fr.sales_rep_id
        WHERE dh.deal_stage IN ('closed_lost', 'lost')
        AND (
            p_start_date IS NULL OR dh.activity_date::date >= p_start_date
        ) AND (
            p_end_date IS NULL OR dh.activity_date::date <= p_end_date
        )
        ORDER BY dh.deal_id, dh.activity_date DESC
    )
    
    -- Final result with customer names and latest events
    SELECT 
        ld.deal_id::integer,
        ld.deal_value::numeric,
        ld.deal_stage::text,
        c.customer_name::text,
        le.event_summary::text,
        le.event_timestamp
    FROM lost_deals_base ld
    INNER JOIN customers c ON ld.customer_id = c.customer_id
    LEFT JOIN latest_events le ON ld.customer_id = le.customer_id
    where le.rn = 1
    ORDER BY ld.deal_value DESC NULLS LAST
    LIMIT 5;
    
END;
$$;

-- ==========================================
-- MOVED TO: table_functions_consolidated.sql
-- ==========================================
-- Function 5: get_lost_opportunities_total_value (get total value of all lost opportunities)
-- CREATE OR REPLACE FUNCTION get_lost_opportunities_total_value(
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL,
    p_manager_id integer DEFAULT NULL
)
RETURNS TABLE (
    total_value numeric
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
    
    lost_deals_base AS (
        -- Get all lost opportunities with customer and sales rep filtering
        SELECT DISTINCT ON (dh.deal_id)
            dh.deal_id,
            dh.deal_value
        FROM deal_historical dh
        INNER JOIN filtered_reps fr ON dh.sales_rep_id = fr.sales_rep_id
        WHERE dh.deal_stage IN ('closed_lost', 'lost')
        AND (
            p_start_date IS NULL OR dh.activity_date::date >= p_start_date
        ) AND (
            p_end_date IS NULL OR dh.activity_date::date <= p_end_date
        )
        ORDER BY dh.deal_id, dh.activity_date DESC
    )
    
    -- Return total value of all lost opportunities
    SELECT 
        COALESCE(SUM(ld.deal_value), 0)::numeric as total_value
    FROM lost_deals_base ld;
    
END;
$$;
