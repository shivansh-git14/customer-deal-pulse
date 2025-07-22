-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.contacts (
  contact_id integer NOT NULL,
  contact_name text NOT NULL,
  customer_id integer NOT NULL,
  contact_score numeric,
  registration_dt date NOT NULL,
  is_dm boolean NOT NULL DEFAULT false,
  active_status boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT contacts_pkey PRIMARY KEY (contact_id),
  CONSTRAINT contacts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id)
);
CREATE TABLE public.customer_stage_historical (
  historical_id integer NOT NULL,
  customer_id integer NOT NULL,
  activity_date date NOT NULL,
  activity_type text NOT NULL,
  life_cycle_stage text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT customer_stage_historical_pkey PRIMARY KEY (historical_id),
  CONSTRAINT customer_stage_historical_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id)
);
CREATE TABLE public.customers (
  customer_id integer NOT NULL,
  customer_name text NOT NULL,
  assignment_dt date NOT NULL,
  customer_lifecycle_stage text NOT NULL,
  customer_industry text NOT NULL,
  decision_maker text NOT NULL,
  first_participation_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (customer_id)
);
CREATE TABLE public.deal_historical (
  historical_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  deal_id integer,
  activity_date timestamp with time zone,
  activity_type text,
  deal_stage text,
  deal_value numeric,
  customer_id integer,
  sales_rep_id integer,
  created_at timestamp with time zone,
  CONSTRAINT deal_historical_pkey PRIMARY KEY (historical_id),
  CONSTRAINT deal_historical_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id),
  CONSTRAINT deal_historical_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals_current(deal_id),
  CONSTRAINT deal_historical_sales_rep_id_fkey FOREIGN KEY (sales_rep_id) REFERENCES public.sales_reps(sales_rep_id)
);
CREATE TABLE public.deals_current (
  deal_id integer NOT NULL,
  deal_stage text NOT NULL,
  customer_id integer NOT NULL,
  sales_rep_id integer NOT NULL,
  max_deal_potential numeric,
  participation_propensity numeric,
  is_high_risk text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT deals_current_pkey PRIMARY KEY (deal_id),
  CONSTRAINT deals_current_sales_rep_id_fkey FOREIGN KEY (sales_rep_id) REFERENCES public.sales_reps(sales_rep_id),
  CONSTRAINT deals_current_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id)
);
CREATE TABLE public.events (
  event_id integer NOT NULL,
  event_timestamp timestamp with time zone NOT NULL,
  event_type text NOT NULL,
  event_summary text,
  customer_id integer,
  contact_id integer,
  sales_rep_id integer,
  sales_rep_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT events_pkey PRIMARY KEY (event_id),
  CONSTRAINT events_sales_rep_id_fkey FOREIGN KEY (sales_rep_id) REFERENCES public.sales_reps(sales_rep_id),
  CONSTRAINT events_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(contact_id),
  CONSTRAINT events_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id)
);
CREATE TABLE public.revenue (
  revenue_id integer NOT NULL,
  participation_dt date NOT NULL,
  customer_id integer NOT NULL,
  sales_rep integer NOT NULL,
  revenue numeric NOT NULL,
  revenue_category text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT revenue_pkey PRIMARY KEY (revenue_id),
  CONSTRAINT revenue_sales_rep_fkey FOREIGN KEY (sales_rep) REFERENCES public.sales_reps(sales_rep_id),
  CONSTRAINT revenue_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id)
);
CREATE TABLE public.sales_reps (
  sales_rep_id integer NOT NULL,
  sales_rep_name text NOT NULL,
  sales_rep_manager_id integer,
  hire_date date NOT NULL,
  termination_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sales_reps_pkey PRIMARY KEY (sales_rep_id),
  CONSTRAINT sales_reps_sales_rep_manager_id_fkey FOREIGN KEY (sales_rep_manager_id) REFERENCES public.sales_reps(sales_rep_id)
);
CREATE TABLE public.targets (
  target_id integer NOT NULL,
  sales_rep_id integer NOT NULL,
  target_month date NOT NULL,
  target_value numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT targets_pkey PRIMARY KEY (target_id),
  CONSTRAINT targets_sales_rep_id_fkey FOREIGN KEY (sales_rep_id) REFERENCES public.sales_reps(sales_rep_id)
);