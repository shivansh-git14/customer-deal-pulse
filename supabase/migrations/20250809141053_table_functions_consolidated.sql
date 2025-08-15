-- ==========================================
-- TABLE FUNCTIONS CONSOLIDATED
-- ==========================================
-- Purpose: All table data retrieval functions grouped by purpose
-- Last Updated: 2025-08-09
-- Strategy: Option B - Topic-specific function grouping
-- Dependencies: sales_reps, deal_historical, events, customers
-- ==========================================

set check_function_bodies = off;
-- ==========================================
-- Function: get_top_deals_with_details
-- ==========================================
-- Purpose: Retrieve top 10 active deals with customer names and latest event information
-- Parameters:
--   - p_start_date: Filter start date (optional)
--   - p_end_date: Filter end date (optional) 
--   - p_manager_id: Filter by specific manager (optional)
-- Returns: TABLE with deal_id, deal_value, deal_stage, customer_name, event_summary, event_timestamp
-- Last Updated: 2025-08-09
-- Dependencies: sales_reps, deal_historical, events, customers
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
-- Function: get_lost_opportunities_with_details
-- ==========================================
-- Purpose: Retrieve top 5 lost opportunities with customer names and latest event information
-- Parameters:
--   - p_start_date: Filter start date (optional)
--   - p_end_date: Filter end date (optional)
--   - p_manager_id: Filter by specific manager (optional)
-- Returns: TABLE with deal_id, deal_value, deal_stage, customer_name, event_summary, event_timestamp
-- Last Updated: 2025-08-09
-- Dependencies: sales_reps, deal_historical, events, customers
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
    WHERE le.rn = 1
    ORDER BY ld.deal_value DESC NULLS LAST
    LIMIT 5;
    
END;
$$;
-- ==========================================
-- Function: get_lost_opportunities_total_value
-- ==========================================
-- Purpose: Calculate total value of all lost opportunities (not just top 5)
-- Parameters:
--   - p_start_date: Filter start date (optional)
--   - p_end_date: Filter end date (optional)
--   - p_manager_id: Filter by specific manager (optional)
-- Returns: TABLE with total_value numeric
-- Last Updated: 2025-08-09
-- Dependencies: sales_reps, deal_historical
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
