-- Create INSERT policies to allow data import
CREATE POLICY "Allow insert access" ON public.sales_reps FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert access" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert access" ON public.contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert access" ON public.deals_current FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert access" ON public.targets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert access" ON public.revenue FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert access" ON public.customer_stage_historical FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert access" ON public.deal_historical FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert access" ON public.events FOR INSERT WITH CHECK (true);