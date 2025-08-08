

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."execute_sql"("query" "text") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result_json json;
BEGIN
    -- Execute the user-provided query and aggregate the results into a JSON array
    EXECUTE 'SELECT json_agg(t) FROM (' || query || ') t'
    INTO result_json;
    
    RETURN result_json;
END;
$$;


ALTER FUNCTION "public"."execute_sql"("query" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "contact_id" integer NOT NULL,
    "contact_name" "text" NOT NULL,
    "customer_id" integer NOT NULL,
    "contact_score" numeric(5,2),
    "registration_dt" "date" NOT NULL,
    "is_dm" boolean DEFAULT false NOT NULL,
    "active_status" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


COMMENT ON TABLE "public"."contacts" IS 'contains the details of all the contacts of the customers';



COMMENT ON COLUMN "public"."contacts"."contact_id" IS 'unique id associated with each contact';



COMMENT ON COLUMN "public"."contacts"."contact_name" IS 'full name of the contact (not necessarily unique)';



COMMENT ON COLUMN "public"."contacts"."customer_id" IS 'id of the customer the contact is associated with';



COMMENT ON COLUMN "public"."contacts"."contact_score" IS 'score representing the quality of the conversations with the contact';



COMMENT ON COLUMN "public"."contacts"."registration_dt" IS 'date on which the contact was registered in the system';



COMMENT ON COLUMN "public"."contacts"."is_dm" IS 'if the contact is a decision maker or not';



COMMENT ON COLUMN "public"."contacts"."active_status" IS 'is the contact active or not';



COMMENT ON COLUMN "public"."contacts"."created_at" IS 'date on which contact was created (can be different from registeration)';



COMMENT ON COLUMN "public"."contacts"."updated_at" IS 'date on which changes to the contact were made';



CREATE TABLE IF NOT EXISTS "public"."customer_stage_historical" (
    "historical_id" integer NOT NULL,
    "customer_id" integer NOT NULL,
    "activity_date" "date" NOT NULL,
    "activity_type" "text" NOT NULL,
    "life_cycle_stage" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."customer_stage_historical" OWNER TO "postgres";


COMMENT ON TABLE "public"."customer_stage_historical" IS 'contains the details of each stage of the customer (including current)';



COMMENT ON COLUMN "public"."customer_stage_historical"."historical_id" IS 'unique id representing any change in the customer life cycle and the nature of the change';



COMMENT ON COLUMN "public"."customer_stage_historical"."customer_id" IS 'id to identify the customer';



COMMENT ON COLUMN "public"."customer_stage_historical"."activity_date" IS 'date for the activity which corresponds to lifecycle stage change';



COMMENT ON COLUMN "public"."customer_stage_historical"."activity_type" IS 'activity identifying the reason for stage change';



COMMENT ON COLUMN "public"."customer_stage_historical"."life_cycle_stage" IS 'life cycle stage of the customer on that day';



COMMENT ON COLUMN "public"."customer_stage_historical"."created_at" IS 'date on which the entry was created in the database not linked to activity_date';



CREATE TABLE IF NOT EXISTS "public"."customers" (
    "customer_id" integer NOT NULL,
    "customer_name" "text" NOT NULL,
    "assignment_dt" "date" NOT NULL,
    "customer_lifecycle_stage" "text" NOT NULL,
    "customer_industry" "text" NOT NULL,
    "decision_maker" "text" NOT NULL,
    "first_participation_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


COMMENT ON TABLE "public"."customers" IS 'details of all the customers';



COMMENT ON COLUMN "public"."customers"."customer_id" IS 'unique id identifying the customer';



COMMENT ON COLUMN "public"."customers"."customer_name" IS 'full name of the customer';



COMMENT ON COLUMN "public"."customers"."assignment_dt" IS 'date on which the customer was first assigned to a sales rep';



COMMENT ON COLUMN "public"."customers"."customer_lifecycle_stage" IS 'current lifecycle stage of the customer';



COMMENT ON COLUMN "public"."customers"."customer_industry" IS 'latest industry of the customer';



COMMENT ON COLUMN "public"."customers"."decision_maker" IS 'name or position of the decision maker for the customer (on the customer''s side)';



COMMENT ON COLUMN "public"."customers"."first_participation_date" IS 'date on which the first revenue from the customer was generated';



CREATE TABLE IF NOT EXISTS "public"."deal_historical" (
    "historical_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deal_id" integer,
    "activity_date" timestamp with time zone,
    "activity_type" "text",
    "deal_stage" "text",
    "deal_value" numeric,
    "customer_id" integer,
    "sales_rep_id" integer,
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."deal_historical" OWNER TO "postgres";


COMMENT ON TABLE "public"."deal_historical" IS 'historical details of the deals through different changes and stages';



COMMENT ON COLUMN "public"."deal_historical"."historical_id" IS 'unique id representing the historical change of each deal';



COMMENT ON COLUMN "public"."deal_historical"."deal_id" IS 'unique id of a deal';



COMMENT ON COLUMN "public"."deal_historical"."activity_date" IS 'date on which the deal related activity happened';



COMMENT ON COLUMN "public"."deal_historical"."activity_type" IS 'activity associated with deal related record';



COMMENT ON COLUMN "public"."deal_historical"."deal_stage" IS 'stage of the deal at the time of entry';



COMMENT ON COLUMN "public"."deal_historical"."deal_value" IS 'expected value from the deal if successful';



COMMENT ON COLUMN "public"."deal_historical"."customer_id" IS 'unique id of the customer associated with the deal';



COMMENT ON COLUMN "public"."deal_historical"."sales_rep_id" IS 'unique id of the sales rep assigned to that deal';



COMMENT ON COLUMN "public"."deal_historical"."created_at" IS 'date on which the entry was created in the database';



CREATE TABLE IF NOT EXISTS "public"."deals_current" (
    "deal_id" integer NOT NULL,
    "deal_stage" "text" NOT NULL,
    "customer_id" integer NOT NULL,
    "sales_rep_id" integer NOT NULL,
    "max_deal_potential" numeric(12,2),
    "participation_propensity" numeric(4,4),
    "is_high_risk" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."deals_current" OWNER TO "postgres";


COMMENT ON TABLE "public"."deals_current" IS 'latest active deals and their details';



COMMENT ON COLUMN "public"."deals_current"."deal_id" IS 'unique id identifying a deal';



COMMENT ON COLUMN "public"."deals_current"."deal_stage" IS 'stage of the deal';



COMMENT ON COLUMN "public"."deals_current"."customer_id" IS 'unique id identifying a customer associated with the deal';



COMMENT ON COLUMN "public"."deals_current"."sales_rep_id" IS 'unique id identifying the sales rep assigned to that deal';



COMMENT ON COLUMN "public"."deals_current"."max_deal_potential" IS 'potential monetary value of the deal in dollars';



COMMENT ON COLUMN "public"."deals_current"."participation_propensity" IS 'probability that this deal will be successful';



COMMENT ON COLUMN "public"."deals_current"."is_high_risk" IS 'Is the deal likely to fall through';



COMMENT ON COLUMN "public"."deals_current"."created_at" IS 'date on which the database entry was created';



COMMENT ON COLUMN "public"."deals_current"."updated_at" IS 'date on which the record was updated in the database';



CREATE TABLE IF NOT EXISTS "public"."events" (
    "event_id" integer NOT NULL,
    "event_timestamp" timestamp with time zone NOT NULL,
    "event_type" "text" NOT NULL,
    "event_summary" "text",
    "customer_id" integer,
    "contact_id" integer,
    "sales_rep_id" integer,
    "sales_rep_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."events" OWNER TO "postgres";


COMMENT ON TABLE "public"."events" IS 'details of the sales related events';



COMMENT ON COLUMN "public"."events"."event_id" IS 'unique id identifying a single event';



COMMENT ON COLUMN "public"."events"."event_timestamp" IS 'timestamp at which the individual event occurred';



COMMENT ON COLUMN "public"."events"."event_type" IS 'broad category identifying type of event';



COMMENT ON COLUMN "public"."events"."event_summary" IS 'summary of the event ina few words';



COMMENT ON COLUMN "public"."events"."customer_id" IS 'unique id identifying the customer associated with the event';



COMMENT ON COLUMN "public"."events"."contact_id" IS 'unique id identifying the contact associated with the event';



COMMENT ON COLUMN "public"."events"."sales_rep_id" IS 'unique id identifying the sales rep associated with the event';



COMMENT ON COLUMN "public"."events"."sales_rep_notes" IS 'notes made by the sales rep about the event';



CREATE TABLE IF NOT EXISTS "public"."revenue" (
    "revenue_id" integer NOT NULL,
    "participation_dt" "date" NOT NULL,
    "customer_id" integer NOT NULL,
    "sales_rep" integer NOT NULL,
    "revenue" numeric(12,2) NOT NULL,
    "revenue_category" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."revenue" OWNER TO "postgres";


COMMENT ON TABLE "public"."revenue" IS 'details of each revenue generating transaction';



COMMENT ON COLUMN "public"."revenue"."revenue_id" IS 'unique id identifying the revenue generated by a customer and sales rep';



COMMENT ON COLUMN "public"."revenue"."participation_dt" IS 'date on which revenue was generated';



COMMENT ON COLUMN "public"."revenue"."customer_id" IS 'unique id identifying the customer associated with the revenue';



COMMENT ON COLUMN "public"."revenue"."sales_rep" IS 'unique id identifying the sales rep associated with the revenue';



COMMENT ON COLUMN "public"."revenue"."revenue" IS 'value of revenue generated in USD';



CREATE TABLE IF NOT EXISTS "public"."sales_reps" (
    "sales_rep_id" integer NOT NULL,
    "sales_rep_name" "text" NOT NULL,
    "sales_rep_manager_id" integer,
    "hire_date" "date" NOT NULL,
    "termination_date" "date",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sales_reps" OWNER TO "postgres";


COMMENT ON TABLE "public"."sales_reps" IS 'information about sales team members including their hierarchical relationships (manager assignments), employment history, and current status.';



COMMENT ON COLUMN "public"."sales_reps"."sales_rep_id" IS 'Unique identifier for each sales representative';



COMMENT ON COLUMN "public"."sales_reps"."sales_rep_name" IS 'Full name of the sales representative';



COMMENT ON COLUMN "public"."sales_reps"."sales_rep_manager_id" IS 'References the sales manager (self-referencing to sales_reps table)';



COMMENT ON COLUMN "public"."sales_reps"."hire_date" IS 'Date when the sales representative was hired';



COMMENT ON COLUMN "public"."sales_reps"."termination_date" IS 'Date when the sales representative left the company (null if still employed)';



COMMENT ON COLUMN "public"."sales_reps"."is_active" IS 'Flag indicating whether the sales representative is currently active (defaults to true)';



COMMENT ON COLUMN "public"."sales_reps"."created_at" IS 'System timestamp when the sales rep record was created';



COMMENT ON COLUMN "public"."sales_reps"."updated_at" IS 'System timestamp when the sales rep record was created';



CREATE TABLE IF NOT EXISTS "public"."targets" (
    "target_id" integer NOT NULL,
    "sales_rep_id" integer NOT NULL,
    "target_month" "date" NOT NULL,
    "target_value" numeric(12,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."targets" OWNER TO "postgres";


COMMENT ON TABLE "public"."targets" IS 'Defines monthly sales targets assigned to each sales representative';



COMMENT ON COLUMN "public"."targets"."target_id" IS 'unique identifier of the target';



COMMENT ON COLUMN "public"."targets"."sales_rep_id" IS 'unique identifier of a Sales Rep';



COMMENT ON COLUMN "public"."targets"."target_month" IS 'Month for which this sales target is set';



COMMENT ON COLUMN "public"."targets"."target_value" IS 'Monetary value of the sales target to be achieved';



COMMENT ON COLUMN "public"."targets"."created_at" IS 'System timestamp when the target record was created';



COMMENT ON COLUMN "public"."targets"."updated_at" IS 'System timestamp when the target record was last modified';



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_contact_id_key" UNIQUE ("contact_id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("contact_id");



ALTER TABLE ONLY "public"."customer_stage_historical"
    ADD CONSTRAINT "customer_stage_historical_historical_id_key" UNIQUE ("historical_id");



ALTER TABLE ONLY "public"."customer_stage_historical"
    ADD CONSTRAINT "customer_stage_historical_pkey" PRIMARY KEY ("historical_id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_customer_id_key" UNIQUE ("customer_id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("customer_id");



ALTER TABLE ONLY "public"."deal_historical"
    ADD CONSTRAINT "deal_historical_historical_id_key" UNIQUE ("historical_id");



ALTER TABLE ONLY "public"."deal_historical"
    ADD CONSTRAINT "deal_historical_pkey" PRIMARY KEY ("historical_id");



ALTER TABLE ONLY "public"."deals_current"
    ADD CONSTRAINT "deals_current_deal_id_key" UNIQUE ("deal_id");



ALTER TABLE ONLY "public"."deals_current"
    ADD CONSTRAINT "deals_current_pkey" PRIMARY KEY ("deal_id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_event_id_key" UNIQUE ("event_id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("event_id");



ALTER TABLE ONLY "public"."revenue"
    ADD CONSTRAINT "revenue_pkey" PRIMARY KEY ("revenue_id");



ALTER TABLE ONLY "public"."revenue"
    ADD CONSTRAINT "revenue_revenue_id_key" UNIQUE ("revenue_id");



ALTER TABLE ONLY "public"."sales_reps"
    ADD CONSTRAINT "sales_reps_pkey" PRIMARY KEY ("sales_rep_id");



ALTER TABLE ONLY "public"."targets"
    ADD CONSTRAINT "targets_pkey" PRIMARY KEY ("target_id");



ALTER TABLE ONLY "public"."targets"
    ADD CONSTRAINT "targets_target_id_key" UNIQUE ("target_id");



CREATE INDEX "idx_contacts_customer_id" ON "public"."contacts" USING "btree" ("customer_id");



CREATE INDEX "idx_customer_stage_historical_customer_id" ON "public"."customer_stage_historical" USING "btree" ("customer_id");



CREATE INDEX "idx_deals_current_customer_id" ON "public"."deals_current" USING "btree" ("customer_id");



CREATE INDEX "idx_deals_current_sales_rep_id" ON "public"."deals_current" USING "btree" ("sales_rep_id");



CREATE INDEX "idx_events_contact_id" ON "public"."events" USING "btree" ("contact_id");



CREATE INDEX "idx_events_customer_id" ON "public"."events" USING "btree" ("customer_id");



CREATE INDEX "idx_events_sales_rep_id" ON "public"."events" USING "btree" ("sales_rep_id");



CREATE INDEX "idx_revenue_customer_id" ON "public"."revenue" USING "btree" ("customer_id");



CREATE INDEX "idx_revenue_sales_rep" ON "public"."revenue" USING "btree" ("sales_rep");



CREATE INDEX "idx_targets_sales_rep_id" ON "public"."targets" USING "btree" ("sales_rep_id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id");



ALTER TABLE ONLY "public"."customer_stage_historical"
    ADD CONSTRAINT "customer_stage_historical_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id");



ALTER TABLE ONLY "public"."deal_historical"
    ADD CONSTRAINT "deal_historical_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id");



ALTER TABLE ONLY "public"."deal_historical"
    ADD CONSTRAINT "deal_historical_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals_current"("deal_id");



ALTER TABLE ONLY "public"."deal_historical"
    ADD CONSTRAINT "deal_historical_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."sales_reps"("sales_rep_id");



ALTER TABLE ONLY "public"."deals_current"
    ADD CONSTRAINT "deals_current_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id");



ALTER TABLE ONLY "public"."deals_current"
    ADD CONSTRAINT "deals_current_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."sales_reps"("sales_rep_id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("contact_id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."sales_reps"("sales_rep_id");



ALTER TABLE ONLY "public"."revenue"
    ADD CONSTRAINT "revenue_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id");



ALTER TABLE ONLY "public"."revenue"
    ADD CONSTRAINT "revenue_sales_rep_fkey" FOREIGN KEY ("sales_rep") REFERENCES "public"."sales_reps"("sales_rep_id");



ALTER TABLE ONLY "public"."sales_reps"
    ADD CONSTRAINT "sales_reps_sales_rep_manager_id_fkey" FOREIGN KEY ("sales_rep_manager_id") REFERENCES "public"."sales_reps"("sales_rep_id");



ALTER TABLE ONLY "public"."targets"
    ADD CONSTRAINT "targets_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."sales_reps"("sales_rep_id");



CREATE POLICY "Allow insert access" ON "public"."contacts" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow insert access" ON "public"."customer_stage_historical" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow insert access" ON "public"."customers" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow insert access" ON "public"."deals_current" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow insert access" ON "public"."events" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow insert access" ON "public"."revenue" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow insert access" ON "public"."sales_reps" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow insert access" ON "public"."targets" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow read access" ON "public"."contacts" FOR SELECT USING (true);



CREATE POLICY "Allow read access" ON "public"."customer_stage_historical" FOR SELECT USING (true);



CREATE POLICY "Allow read access" ON "public"."customers" FOR SELECT USING (true);



CREATE POLICY "Allow read access" ON "public"."deals_current" FOR SELECT USING (true);



CREATE POLICY "Allow read access" ON "public"."events" FOR SELECT USING (true);



CREATE POLICY "Allow read access" ON "public"."revenue" FOR SELECT USING (true);



CREATE POLICY "Allow read access" ON "public"."sales_reps" FOR SELECT USING (true);



CREATE POLICY "Allow read access" ON "public"."targets" FOR SELECT USING (true);



ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_stage_historical" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_historical" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deals_current" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."revenue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_reps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."targets" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."execute_sql"("query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."execute_sql"("query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_sql"("query" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."customer_stage_historical" TO "anon";
GRANT ALL ON TABLE "public"."customer_stage_historical" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_stage_historical" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."deal_historical" TO "anon";
GRANT ALL ON TABLE "public"."deal_historical" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_historical" TO "service_role";



GRANT ALL ON TABLE "public"."deals_current" TO "anon";
GRANT ALL ON TABLE "public"."deals_current" TO "authenticated";
GRANT ALL ON TABLE "public"."deals_current" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."revenue" TO "anon";
GRANT ALL ON TABLE "public"."revenue" TO "authenticated";
GRANT ALL ON TABLE "public"."revenue" TO "service_role";



GRANT ALL ON TABLE "public"."sales_reps" TO "anon";
GRANT ALL ON TABLE "public"."sales_reps" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_reps" TO "service_role";



GRANT ALL ON TABLE "public"."targets" TO "anon";
GRANT ALL ON TABLE "public"."targets" TO "authenticated";
GRANT ALL ON TABLE "public"."targets" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
