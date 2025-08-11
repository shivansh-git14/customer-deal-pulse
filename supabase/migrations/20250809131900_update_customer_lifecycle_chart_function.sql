-- Migration: Update get_customer_lifecycle_chart to correct column names and logic
-- Safe: CREATE OR REPLACE only; no data changes

-- Note: Using fully-qualified table names; no search_path change required.

CREATE OR REPLACE FUNCTION public.get_customer_lifecycle_chart(
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
    FROM public.sales_reps 
    WHERE sales_rep_manager_id = p_manager_id;

    -- If no managed reps found, return empty data
    IF managed_rep_ids IS NULL OR array_length(managed_rep_ids, 1) = 0 THEN
      SELECT JSON_BUILD_OBJECT(
        'success', true,
        'data', '[]'::JSON,
        'message', 'No managed sales reps found for the specified manager'
      ) INTO chart_data;
      RETURN chart_data;
    END IF;
  END IF;

  -- Use the proven structure from sql/get_customer_lifecycle_chart_function.sql
  WITH managed_customers AS (
    -- Customers associated with reps managed by the specified manager (from deals and revenue within range)
    SELECT DISTINCT dh.customer_id
    FROM public.deal_historical dh
    WHERE (p_manager_id IS NOT NULL)
      AND (p_start_date IS NULL OR dh.activity_date::date >= p_start_date)
      AND (p_end_date IS NULL OR dh.activity_date::date <= p_end_date)
      AND dh.sales_rep_id = ANY(managed_rep_ids)
    UNION
    SELECT DISTINCT r.customer_id
    FROM public.revenue r
    WHERE (p_manager_id IS NOT NULL)
      AND (p_start_date IS NULL OR r.participation_dt >= p_start_date)
      AND (p_end_date IS NULL OR r.participation_dt <= p_end_date)
      AND r.sales_rep = ANY(managed_rep_ids)
  ),
  date_filtered_customers AS (
    SELECT 
      DATE_TRUNC('month', csh.activity_date)::date as month,
      csh.life_cycle_stage,
      csh.customer_id,
      ROW_NUMBER() OVER (
        PARTITION BY csh.customer_id, DATE_TRUNC('month', csh.activity_date)
        ORDER BY csh.activity_date DESC
      ) as rn
    FROM public.customer_stage_historical csh
    WHERE (p_start_date IS NULL OR csh.activity_date >= p_start_date)
      AND (p_end_date IS NULL OR csh.activity_date <= p_end_date)
      AND (p_manager_id IS NULL OR csh.customer_id IN (SELECT customer_id FROM managed_customers))
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
    FROM public.revenue r
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
  
  -- Ensure non-null response even when no rows are returned
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.get_customer_lifecycle_chart(DATE, DATE, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_lifecycle_chart(DATE, DATE, INTEGER) TO service_role;
COMMENT ON FUNCTION public.get_customer_lifecycle_chart(DATE, DATE, INTEGER)
IS 'Aggregates customer lifecycle stages by month with revenue data for stacked bar chart visualization';
