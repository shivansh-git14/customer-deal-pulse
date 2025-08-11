-- Grant EXECUTE to anon for get_top_customers, with guard if function is missing
DO $$
BEGIN
  BEGIN
    GRANT EXECUTE ON FUNCTION get_top_customers(DATE, DATE, INTEGER, INTEGER, INTEGER) TO anon;
    RAISE NOTICE 'Granted EXECUTE on get_top_customers to anon';
  EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function get_top_customers not found; skipping grant';
  END;
END $$;
