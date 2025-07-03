-- Create sales_reps table
CREATE TABLE public.sales_reps (
  sales_rep_id INTEGER PRIMARY KEY,
  sales_rep_name TEXT NOT NULL,
  sales_rep_manager_id INTEGER REFERENCES public.sales_reps(sales_rep_id),
  hire_date DATE NOT NULL,
  termination_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customers table  
CREATE TABLE public.customers (
  customer_id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL,
  assignment_dt DATE NOT NULL,
  customer_lifecycle_stage TEXT NOT NULL,
  customer_industry TEXT NOT NULL,
  decision_maker TEXT NOT NULL,
  first_participation_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contacts table
CREATE TABLE public.contacts (
  contact_id INTEGER PRIMARY KEY,
  contact_name TEXT NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES public.customers(customer_id),
  contact_score DECIMAL(5,2),
  registration_dt DATE NOT NULL,
  is_dm BOOLEAN NOT NULL DEFAULT false,
  active_status BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deals_current table
CREATE TABLE public.deals_current (
  deal_id INTEGER PRIMARY KEY,
  deal_stage TEXT NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES public.customers(customer_id),
  sales_rep_id INTEGER NOT NULL REFERENCES public.sales_reps(sales_rep_id),
  max_deal_potential DECIMAL(12,2),
  participation_propensity DECIMAL(4,4),
  is_high_risk TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create targets table
CREATE TABLE public.targets (
  target_id INTEGER PRIMARY KEY,
  sales_rep_id INTEGER NOT NULL REFERENCES public.sales_reps(sales_rep_id),
  target_month DATE NOT NULL,
  target_value DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create revenue table
CREATE TABLE public.revenue (
  revenue_id INTEGER PRIMARY KEY,
  participation_dt DATE NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES public.customers(customer_id),
  sales_rep INTEGER NOT NULL REFERENCES public.sales_reps(sales_rep_id),
  revenue DECIMAL(12,2) NOT NULL,
  revenue_category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer_stage_historical table
CREATE TABLE public.customer_stage_historical (
  historical_id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES public.customers(customer_id),
  activity_date DATE NOT NULL,
  activity_type TEXT NOT NULL,
  life_cycle_stage TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deal_historical table
CREATE TABLE public.deal_historical (
  historical_id INTEGER PRIMARY KEY,
  deal_id INTEGER NOT NULL REFERENCES public.deals_current(deal_id),
  activity_date DATE NOT NULL,
  activity_type TEXT NOT NULL,
  deal_stage TEXT NOT NULL,
  deal_value DECIMAL(12,2),
  customer_id INTEGER NOT NULL REFERENCES public.customers(customer_id),
  sales_rep_id INTEGER NOT NULL REFERENCES public.sales_reps(sales_rep_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
  event_id INTEGER PRIMARY KEY,
  event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  event_type TEXT NOT NULL,
  event_summary TEXT,
  customer_id INTEGER REFERENCES public.customers(customer_id),
  contact_id INTEGER REFERENCES public.contacts(contact_id),
  sales_rep_id INTEGER REFERENCES public.sales_reps(sales_rep_id),
  sales_rep_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_contacts_customer_id ON public.contacts(customer_id);
CREATE INDEX idx_deals_current_customer_id ON public.deals_current(customer_id);
CREATE INDEX idx_deals_current_sales_rep_id ON public.deals_current(sales_rep_id);
CREATE INDEX idx_targets_sales_rep_id ON public.targets(sales_rep_id);
CREATE INDEX idx_revenue_customer_id ON public.revenue(customer_id);
CREATE INDEX idx_revenue_sales_rep ON public.revenue(sales_rep);
CREATE INDEX idx_customer_stage_historical_customer_id ON public.customer_stage_historical(customer_id);
CREATE INDEX idx_deal_historical_deal_id ON public.deal_historical(deal_id);
CREATE INDEX idx_events_customer_id ON public.events(customer_id);
CREATE INDEX idx_events_contact_id ON public.events(contact_id);
CREATE INDEX idx_events_sales_rep_id ON public.events(sales_rep_id);

-- Enable Row Level Security (optional - can be configured later based on needs)
ALTER TABLE public.sales_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals_current ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_stage_historical ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_historical ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create basic policies to allow read access (modify as needed)
CREATE POLICY "Allow read access" ON public.sales_reps FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON public.contacts FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON public.deals_current FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON public.targets FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON public.revenue FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON public.customer_stage_historical FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON public.deal_historical FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON public.events FOR SELECT USING (true);