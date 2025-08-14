
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
    LEFT JOIN latest_events le ON td.customer_id = le.customer_id AND le.rn = 1
    ORDER BY td.deal_value DESC NULLS LAST
    LIMIT 5;
    
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_top_deals_with_details(date, date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_deals_with_details(date, date, integer) TO service_role;

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
    LEFT JOIN latest_events le ON ld.customer_id = le.customer_id AND le.rn = 1
    ORDER BY ld.deal_value DESC NULLS LAST
    LIMIT 5;
    
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_lost_opportunities_with_details(date, date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_lost_opportunities_with_details(date, date, integer) TO service_role;

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
