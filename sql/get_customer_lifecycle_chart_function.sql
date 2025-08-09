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
