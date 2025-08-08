-- Secure PostgreSQL function to calculate deal metrics
-- Replaces complex JavaScript logic with optimized SQL

CREATE OR REPLACE FUNCTION get_deal_metrics(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_manager_id INTEGER DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  lead_response_time NUMERIC := 0;
  conversion_rate NUMERIC := 0;
  deal_cycle_length NUMERIC := 0;
  touchpoints_per_deal NUMERIC := 0;
  managed_rep_ids INTEGER[];
BEGIN
  -- Get managed rep IDs if manager filter is provided
  IF p_manager_id IS NOT NULL THEN
    SELECT ARRAY_AGG(sales_rep_id) INTO managed_rep_ids
    FROM sales_reps 
    WHERE sales_rep_manager_id = p_manager_id;
    
    -- If no reps found, return zeros
    IF managed_rep_ids IS NULL OR array_length(managed_rep_ids, 1) IS NULL THEN
      RETURN json_build_object(
        'leadResponseTime', 0,
        'conversionRate', 0,
        'dealCycleLength', 0,
        'touchpointsPerDeal', 0
      );
    END IF;
  END IF;

  -- 1. Lead Response Time: Average days from prospecting to qualified
  WITH prospecting_deals AS (
    SELECT deal_id, activity_date as prospecting_date, sales_rep_id
    FROM deal_historical
    WHERE deal_stage = 'prospecting'
      AND (p_start_date IS NULL OR activity_date::date >= p_start_date)
      AND (p_end_date IS NULL OR activity_date::date <= p_end_date)
      AND (p_manager_id IS NULL OR sales_rep_id = ANY(managed_rep_ids))
  ),
  qualified_deals AS (
    SELECT deal_id, activity_date as qualified_date
    FROM deal_historical
    WHERE deal_stage = 'qualified'
      AND deal_id IN (SELECT deal_id FROM prospecting_deals)
  ),
  response_times AS (
    SELECT EXTRACT(EPOCH FROM (q.qualified_date - p.prospecting_date)) / 86400 as days_diff
    FROM prospecting_deals p
    INNER JOIN qualified_deals q ON p.deal_id = q.deal_id
    WHERE q.qualified_date >= p.prospecting_date
  )
  SELECT COALESCE(AVG(days_diff), 0) INTO lead_response_time
  FROM response_times;

  -- 2. Conversion Rate: % of prospecting deals that become closed_won
  WITH filtered_deals AS (
    SELECT DISTINCT deal_id, deal_stage
    FROM deal_historical dh
    WHERE (p_start_date IS NULL OR activity_date::date >= p_start_date)
      AND (p_end_date IS NULL OR activity_date::date <= p_end_date)
      AND (p_manager_id IS NULL OR sales_rep_id = ANY(managed_rep_ids))
  ),
  prospecting_count AS (
    SELECT COUNT(DISTINCT deal_id) as count
    FROM filtered_deals
    WHERE deal_stage = 'prospecting'
  ),
  won_count AS (
    SELECT COUNT(DISTINCT deal_id) as count
    FROM filtered_deals
    WHERE deal_stage = 'closed_won'
  )
  SELECT CASE 
    WHEN p.count > 0 THEN (w.count::NUMERIC / p.count::NUMERIC) * 100
    ELSE 0
  END INTO conversion_rate
  FROM prospecting_count p, won_count w;

  -- 3. Deal Cycle Length: Average days from prospecting to closed_won
  WITH deal_stages AS (
    SELECT 
      deal_id,
      MIN(CASE WHEN deal_stage = 'prospecting' THEN stage_change_date END) as prospecting_date,
      MIN(CASE WHEN deal_stage = 'closed_won' THEN stage_change_date END) as won_date
    FROM deal_historical
    WHERE deal_stage IN ('prospecting', 'closed_won')
      AND (p_start_date IS NULL OR stage_change_date::date >= p_start_date)
      AND (p_end_date IS NULL OR stage_change_date::date <= p_end_date)
      AND (p_manager_id IS NULL OR sales_rep_id = ANY(managed_rep_ids))
    GROUP BY deal_id
    HAVING MIN(CASE WHEN deal_stage = 'prospecting' THEN stage_change_date END) IS NOT NULL
       AND MIN(CASE WHEN deal_stage = 'closed_won' THEN stage_change_date END) IS NOT NULL
  ),
  cycle_lengths AS (
    SELECT EXTRACT(EPOCH FROM (won_date - prospecting_date)) / 86400 as days_diff
    FROM deal_stages
    WHERE won_date >= prospecting_date
  )
  SELECT COALESCE(AVG(days_diff), 0) INTO deal_cycle_length
  FROM cycle_lengths;

  -- 4. Touchpoints per Deal: Average events per deal
  WITH deal_touchpoints AS (
    SELECT deal_id, COUNT(*) as touchpoint_count
    FROM events
    WHERE deal_id IS NOT NULL
    GROUP BY deal_id
  )
  SELECT COALESCE(AVG(touchpoint_count), 0) INTO touchpoints_per_deal
  FROM deal_touchpoints;

  -- Return JSON result with rounded values
  RETURN json_build_object(
    'leadResponseTime', ROUND(lead_response_time, 1),
    'conversionRate', ROUND(conversion_rate, 1),
    'dealCycleLength', ROUND(deal_cycle_length),
    'touchpointsPerDeal', ROUND(touchpoints_per_deal)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_deal_metrics(DATE, DATE, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_deal_metrics(DATE, DATE, INTEGER) TO service_role;
