-- ==========================================
-- ALL FUNCTIONS CONSOLIDATED (Canonical)
-- ==========================================
-- Purpose: Single source of truth for all business logic functions
-- Date: 2025-08-10 12:48:00+05:30
-- Strategy: Use CREATE OR REPLACE (DROP/CREATE only when return type changes)
-- ==========================================

set check_function_bodies = off;
-- ==========================================
-- Function: get_deal_metrics
-- ==========================================
-- Purpose: Calculate comprehensive deal metrics (lead response time, conversion rate, cycle length, touchpoints)
-- Parameters: (p_start_date date, p_end_date date, p_manager_id integer)
-- Notes: Uses deal_stage and activity_date consistently
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

GRANT EXECUTE ON FUNCTION public.get_deal_metrics(date, date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_deal_metrics(date, date, integer) TO service_role;

-- ==========================================
-- Function: get_team_metrics
-- ==========================================

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
        SELECT 
            sr.sales_rep_id,
            sr.sales_rep_name
        FROM sales_reps sr
        WHERE sr.is_active = true 
        AND sr.sales_rep_manager_id IS NULL
        AND (p_manager_id IS NULL OR sr.sales_rep_id = p_manager_id)
    ),
    
    team_members AS (
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
        SELECT 
            manager_id,
            manager_name,
            COUNT(*) as team_size
        FROM team_members
        GROUP BY manager_id, manager_name
    ),
    
    team_revenue AS (
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
        SELECT 
            tm.manager_id,
            COALESCE(SUM(t.target_value::numeric), 0) as total_target
        FROM team_members tm
        LEFT JOIN targets t ON t.sales_rep_id = tm.team_member_id
        GROUP BY tm.manager_id
    ),
    
    team_deals AS (
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
        SELECT 
            ts.manager_name,
            ts.team_size,
            tr.total_revenue as revenue,
            tt.total_target as target,
            CASE 
                WHEN tt.total_target > 0 THEN (tr.total_revenue / tt.total_target) * 100
                ELSE 0 
            END as target_percentage,
            CASE 
                WHEN td.total_deals > 0 THEN (td.closed_won_deals::numeric / td.total_deals::numeric) * 100
                ELSE 0 
            END as conversion_rate,
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
    
    SELECT 
        cm.manager_name::text as team_name,
        cm.team_size::integer,
        ROUND(cm.revenue, 2) as revenue,
        ROUND(cm.target, 2) as target,
        ROUND(cm.target_percentage, 1) as target_percentage,
        ROUND(cm.conversion_rate, 1) as conversion_rate,
        ROUND(cm.efficiency, 2) as efficiency,
        CASE 
            WHEN cm.target_percentage >= 110 THEN 'Accelerating'
            WHEN cm.target_percentage >= 90 THEN 'Improving'
            WHEN cm.target_percentage < 70 THEN 'Declining'
            ELSE 'Stable'
        END::text as momentum,
        CASE 
            WHEN cm.target_percentage >= 90 THEN 'Low'
            WHEN cm.target_percentage < 60 THEN 'High'
            ELSE 'Medium'
        END::text as risk_level,
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
GRANT EXECUTE ON FUNCTION public.get_team_metrics(date, date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_metrics(date, date, integer) TO service_role;
-- ==========================================
-- Function: get_top_deals_with_details
-- ==========================================

CREATE OR REPLACE FUNCTION get_top_deals_with_details(
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
<<<<<<< HEAD
GRANT EXECUTE ON FUNCTION public.get_top_deals_with_details(date, date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_deals_with_details(date, date, integer) TO service_role;
=======

GRANT EXECUTE ON FUNCTION public.get_top_deals_with_details(date, date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_deals_with_details(date, date, integer) TO service_role;

>>>>>>> origin/main
-- ==========================================
-- Function: get_lost_opportunities_with_details
-- ==========================================

CREATE OR REPLACE FUNCTION get_lost_opportunities_with_details(
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
    WHERE le.rn = 1
    ORDER BY ld.deal_value DESC NULLS LAST
    LIMIT 5;
    
END;
$$;
<<<<<<< HEAD
GRANT EXECUTE ON FUNCTION public.get_lost_opportunities_with_details(date, date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_lost_opportunities_with_details(date, date, integer) TO service_role;
=======

GRANT EXECUTE ON FUNCTION public.get_lost_opportunities_with_details(date, date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_lost_opportunities_with_details(date, date, integer) TO service_role;

>>>>>>> origin/main
-- ==========================================
-- Function: get_lost_opportunities_total_value
-- ==========================================

CREATE OR REPLACE FUNCTION get_lost_opportunities_total_value(
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
    
    SELECT 
        COALESCE(SUM(ld.deal_value), 0)::numeric as total_value
    FROM lost_deals_base ld;
    
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_lost_opportunities_total_value(date, date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_lost_opportunities_total_value(date, date, integer) TO service_role;
-- ==========================================
-- Function: get_customer_lifecycle_chart
-- ==========================================

CREATE OR REPLACE FUNCTION get_customer_lifecycle_chart(
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL,
    p_manager_id integer DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  chart_data JSON;
  managed_rep_ids INTEGER[];
BEGIN
  IF p_manager_id IS NOT NULL THEN
    SELECT ARRAY_AGG(sales_rep_id) INTO managed_rep_ids
    FROM sales_reps 
    WHERE sales_rep_manager_id = p_manager_id;

    IF managed_rep_ids IS NULL OR array_length(managed_rep_ids, 1) = 0 THEN
      SELECT JSON_BUILD_OBJECT(
        'success', true,
        'data', '[]'::JSON,
        'message', 'No managed sales reps found for the specified manager'
      ) INTO chart_data;
      RETURN chart_data;
    END IF;
  END IF;

  WITH date_filtered_customers AS (
    SELECT 
      DATE_TRUNC('month', csh.activity_date)::date as month,
      csh.life_cycle_stage,
      csh.customer_id,
      ROW_NUMBER() OVER (
        PARTITION BY csh.customer_id, DATE_TRUNC('month', csh.activity_date)
        ORDER BY csh.activity_date DESC
      ) as rn
    FROM customer_stage_historical csh
    WHERE (p_start_date IS NULL OR csh.activity_date >= p_start_date)
      AND (p_end_date IS NULL OR csh.activity_date <= p_end_date)
  ),
  customer_stages_monthly AS (
    SELECT month, life_cycle_stage, customer_id
    FROM date_filtered_customers
    WHERE rn = 1
  ),
  revenue_monthly AS (
    SELECT 
      DATE_TRUNC('month', r.participation_dt)::date as month,
      r.customer_id,
      SUM(r.revenue) as total_revenue
    FROM revenue r
    WHERE (p_start_date IS NULL OR r.participation_dt >= p_start_date)
      AND (p_end_date IS NULL OR r.participation_dt <= p_end_date)
      AND (p_manager_id IS NULL OR r.sales_rep = ANY(managed_rep_ids))
    GROUP BY DATE_TRUNC('month', r.participation_dt), r.customer_id
  ),
  lifecycle_with_revenue AS (
    SELECT 
      csm.month,
      csm.life_cycle_stage,
      csm.customer_id,
      COALESCE(rm.total_revenue, 0) as customer_revenue
    FROM customer_stages_monthly csm
    LEFT JOIN revenue_monthly rm ON csm.month = rm.month AND csm.customer_id = rm.customer_id
  ),
  stage_totals AS (
    SELECT 
      month,
      life_cycle_stage,
      COUNT(DISTINCT customer_id) as customer_count,
      SUM(customer_revenue) as total_stage_revenue
    FROM lifecycle_with_revenue
    GROUP BY month, life_cycle_stage
  ),
  monthly_totals AS (
    SELECT 
      month,
      SUM(customer_count) as total_customers_in_month
    FROM stage_totals
    GROUP BY month
  ),
  final_data AS (
    SELECT 
      st.month,
      st.life_cycle_stage,
      st.customer_count,
      st.total_stage_revenue,
      CASE 
        WHEN mt.total_customers_in_month > 0 
        THEN ROUND((st.customer_count::NUMERIC / mt.total_customers_in_month::NUMERIC) * 100, 2)
        ELSE 0 
      END as percentage
    FROM stage_totals st
    JOIN monthly_totals mt ON st.month = mt.month
  )
  SELECT JSON_BUILD_OBJECT(
    'success', true,
    'data', COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'month', TO_CHAR(month, 'YYYY-MM'),
          'stages', stages_array
        )
        ORDER BY month
      ), '[]'::JSON
    )
  ) INTO chart_data
  FROM (
    SELECT 
      month,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'stage', life_cycle_stage,
          'customerCount', customer_count,
          'totalRevenue', total_stage_revenue,
          'percentage', percentage
        )
        ORDER BY percentage DESC
      ) as stages_array
    FROM final_data
    GROUP BY month
  ) grouped_data;
  
  IF chart_data IS NULL THEN
    chart_data := JSON_BUILD_OBJECT(
      'success', true,
      'data', '[]'::JSON
    );
  END IF;
  
  RETURN chart_data;

EXCEPTION WHEN OTHERS THEN
  SELECT JSON_BUILD_OBJECT(
    'success', false,
    'error', SQLERRM,
    'error_detail', SQLSTATE,
    'message', 'Error occurred while fetching customer lifecycle chart data'
  ) INTO chart_data;
  RETURN chart_data;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_customer_lifecycle_chart(date, date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_lifecycle_chart(date, date, integer) TO service_role;
-- ==========================================
-- Function: get_customer_hero_metrics
-- ==========================================

-- Explicit DROP to handle return type changes safely on existing DBs
DROP FUNCTION IF EXISTS public.get_customer_hero_metrics(date, date, integer);
<<<<<<< HEAD
=======

>>>>>>> origin/main
CREATE FUNCTION get_customer_hero_metrics(
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
                INNER JOIN filtered_reps fr ON dh.sales_rep_id = fr.sales_rep_id
                WHERE dh.customer_id = c.customer_id
            )
        )
    ),
    
    at_risk_customers AS (
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
                'at_risk', 'at-risk', 'atrisk', 'churned', 'churn', 'lost', 'inactive'
            ) THEN 1 END) as at_risk_count,
            COUNT(*) as total_customers
        FROM latest_customer_stages
        WHERE rn = 1
    ),
    
    decision_maker_customers AS (
        SELECT 
            COUNT(DISTINCT CASE WHEN contact_count > 0 THEN cu.customer_id END) as customers_with_dm,
            COUNT(DISTINCT cu.customer_id) as total_customers
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
        WITH customer_revenue_summary AS (
            SELECT 
                cu.customer_id,
                SUM(CASE WHEN r.revenue_category IN (
                    'recurring', 'repeat', 'renewal', 'subscription', 'recurring_revenue'
                ) THEN r.revenue ELSE 0 END) as repeat_revenue,
                SUM(r.revenue) as total_revenue
            FROM customer_universe cu
            LEFT JOIN revenue r ON cu.customer_id = r.customer_id
            WHERE (p_start_date IS NULL OR r.participation_dt >= p_start_date)
            AND (p_end_date IS NULL OR r.participation_dt <= p_end_date)
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
    
    SELECT 
        COALESCE(
            CASE 
                WHEN arc.total_customers > 0 
                THEN (arc.at_risk_count::numeric / arc.total_customers::numeric) * 100
                ELSE 0 
            END,
            0
        ) as at_risk_rate,
        
        arc.at_risk_count as at_risk_customers,
        arc.total_customers as total_customers,
        
        COALESCE(
            CASE 
                WHEN dmc.total_customers > 0 
                THEN (dmc.customers_with_dm::numeric / dmc.total_customers::numeric) * 100
                ELSE 0 
            END,
            0
        ) as customers_with_dm_rate,
        
        dmc.customers_with_dm as customers_with_dm,
        
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
GRANT EXECUTE ON FUNCTION public.get_customer_hero_metrics(date, date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_hero_metrics(date, date, integer) TO service_role;
-- ==========================================
-- Function: debug_customer_hero_data
-- ==========================================
-- Purpose: Debug version to discover actual data values
-- Note: Kept in canonical file to ensure it is recreated if ever dropped

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
<<<<<<< HEAD
GRANT EXECUTE ON FUNCTION public.debug_customer_hero_data(date, date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_customer_hero_data(date, date, integer) TO service_role;
=======

GRANT EXECUTE ON FUNCTION public.debug_customer_hero_data(date, date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_customer_hero_data(date, date, integer) TO service_role;

>>>>>>> origin/main
COMMENT ON FUNCTION public.debug_customer_hero_data(date, date, integer) IS 'Debug function to discover actual lifecycle stages and revenue categories in the data';
