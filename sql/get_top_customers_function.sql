-- Secure PostgreSQL function to get top customers by revenue
-- Returns a JSON array of rows with: rank, customer_id, customer_name, revenue, metrics (extensible JSON)

CREATE OR REPLACE FUNCTION get_top_customers(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_manager_id INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
) RETURNS JSON AS $$
DECLARE
  result JSON;
  managed_rep_ids INTEGER[];
BEGIN
  -- Resolve managed reps if manager filter is provided (include self)
  IF p_manager_id IS NOT NULL THEN
    SELECT ARRAY_AGG(sales_rep_id) INTO managed_rep_ids
    FROM sales_reps
    WHERE sales_rep_manager_id = p_manager_id
       OR sales_rep_id = p_manager_id;

    -- If no reps found, return empty result
    IF managed_rep_ids IS NULL OR array_length(managed_rep_ids, 1) IS NULL THEN
      RETURN json_build_object('success', true, 'data', '[]'::json);
    END IF;
  END IF;

  WITH filtered_revenue AS (
    SELECT 
      r.customer_id,
      SUM(r.revenue) AS total_revenue
    FROM revenue r
    WHERE (p_start_date IS NULL OR r.participation_dt >= p_start_date)
      AND (p_end_date IS NULL OR r.participation_dt <= p_end_date)
      AND (p_manager_id IS NULL OR r.sales_rep = ANY(managed_rep_ids))
    GROUP BY r.customer_id
  ), ranked AS (
    SELECT 
      c.customer_id,
      c.customer_name,
      fr.total_revenue,
      DENSE_RANK() OVER (ORDER BY fr.total_revenue DESC) AS rnk
    FROM filtered_revenue fr
    JOIN customers c ON c.customer_id = fr.customer_id
  ), limited AS (
    SELECT *
    FROM ranked
    ORDER BY total_revenue DESC, customer_name ASC
    LIMIT COALESCE(p_limit, 10)
    OFFSET COALESCE(p_offset, 0)
  )
  SELECT json_agg(
    json_build_object(
      'rank', rnk,
      'customer_id', customer_id,
      'customer_name', customer_name,
      'revenue', ROUND(COALESCE(total_revenue, 0), 2),
      'metrics', '{}'::jsonb
    )
    ORDER BY rnk, customer_name
  ) INTO result
  FROM limited;

  RETURN json_build_object(
    'success', true,
    'data', COALESCE(result, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants
GRANT EXECUTE ON FUNCTION get_top_customers(DATE, DATE, INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_customers(DATE, DATE, INTEGER, INTEGER, INTEGER) TO service_role;
