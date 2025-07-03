
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting CSV data import...');

    // Sample sales reps data
    const salesRepsData = [
      { sales_rep_id: 1, sales_rep_name: "John Smith", sales_rep_manager_id: null, hire_date: "2020-01-15", termination_date: null, is_active: true },
      { sales_rep_id: 2, sales_rep_name: "Sarah Johnson", sales_rep_manager_id: 1, hire_date: "2021-03-22", termination_date: null, is_active: true },
      { sales_rep_id: 3, sales_rep_name: "Michael Chen", sales_rep_manager_id: 1, hire_date: "2021-07-10", termination_date: null, is_active: true },
      { sales_rep_id: 4, sales_rep_name: "Emily Davis", sales_rep_manager_id: 2, hire_date: "2022-02-14", termination_date: null, is_active: true },
      { sales_rep_id: 5, sales_rep_name: "Robert Wilson", sales_rep_manager_id: 2, hire_date: "2022-05-30", termination_date: null, is_active: true }
    ];

    // Sample customers data
    const customersData = [
      { customer_id: 1, customer_name: "Acme Corporation", assignment_dt: "2023-01-15", customer_lifecycle_stage: "Newly Acquired", customer_industry: "Technology", decision_maker: "John Doe", first_participation_date: "2023-02-01" },
      { customer_id: 2, customer_name: "Global Solutions Inc", assignment_dt: "2023-01-20", customer_lifecycle_stage: "Loyal", customer_industry: "Manufacturing", decision_maker: "Jane Smith", first_participation_date: "2023-01-25" },
      { customer_id: 3, customer_name: "TechStart LLC", assignment_dt: "2023-02-05", customer_lifecycle_stage: "Acquisition", customer_industry: "Technology", decision_maker: "Mike Johnson", first_participation_date: "2023-02-10" },
      { customer_id: 4, customer_name: "Blue Ocean Industries", assignment_dt: "2023-02-12", customer_lifecycle_stage: "At Risk", customer_industry: "Healthcare", decision_maker: "Sarah Wilson", first_participation_date: "2023-02-18" },
      { customer_id: 5, customer_name: "Innovation Labs", assignment_dt: "2023-02-28", customer_lifecycle_stage: "Newly Acquired", customer_industry: "Technology", decision_maker: "David Brown", first_participation_date: "2023-03-05" }
    ];

    // Sample contacts data
    const contactsData = [
      { contact_id: 1, contact_name: "John Doe", customer_id: 1, contact_score: 85.50, registration_dt: "2023-01-20", is_dm: true, active_status: true },
      { contact_id: 2, contact_name: "Mary Johnson", customer_id: 1, contact_score: 72.30, registration_dt: "2023-01-25", is_dm: false, active_status: true },
      { contact_id: 3, contact_name: "Jane Smith", customer_id: 2, contact_score: 92.75, registration_dt: "2023-01-22", is_dm: true, active_status: true },
      { contact_id: 4, contact_name: "Mike Johnson", customer_id: 3, contact_score: 78.90, registration_dt: "2023-02-08", is_dm: true, active_status: true },
      { contact_id: 5, contact_name: "Sarah Wilson", customer_id: 4, contact_score: 88.60, registration_dt: "2023-02-15", is_dm: true, active_status: true }
    ];

    // Sample deals data
    const dealsData = [
      { deal_id: 1, deal_stage: "Active Negotiation", customer_id: 1, sales_rep_id: 2, max_deal_potential: 125000.00, participation_propensity: 0.7500, is_high_risk: "No" },
      { deal_id: 2, deal_stage: "Closed", customer_id: 2, sales_rep_id: 3, max_deal_potential: 87500.00, participation_propensity: 0.9200, is_high_risk: "No" },
      { deal_id: 3, deal_stage: "Qualified Prospect", customer_id: 3, sales_rep_id: 4, max_deal_potential: 156000.00, participation_propensity: 0.6800, is_high_risk: "Yes" },
      { deal_id: 4, deal_stage: "Final Stage", customer_id: 4, sales_rep_id: 5, max_deal_potential: 210000.00, participation_propensity: 0.8900, is_high_risk: "No" },
      { deal_id: 5, deal_stage: "Active Negotiation", customer_id: 5, sales_rep_id: 2, max_deal_potential: 98000.00, participation_propensity: 0.7200, is_high_risk: "No" }
    ];

    // Sample targets data
    const targetsData = [
      { target_id: 1, sales_rep_id: 1, target_month: "2023-01-01", target_value: 500000.00 },
      { target_id: 2, sales_rep_id: 1, target_month: "2023-02-01", target_value: 520000.00 },
      { target_id: 3, sales_rep_id: 2, target_month: "2023-01-01", target_value: 320000.00 },
      { target_id: 4, sales_rep_id: 2, target_month: "2023-02-01", target_value: 330000.00 },
      { target_id: 5, sales_rep_id: 3, target_month: "2023-01-01", target_value: 280000.00 }
    ];

    // Sample revenue data
    const revenueData = [
      { revenue_id: 1, participation_dt: "2023-02-01", customer_id: 1, sales_rep: 2, revenue: 87500.00, revenue_category: "new" },
      { revenue_id: 2, participation_dt: "2023-05-15", customer_id: 1, sales_rep: 2, revenue: 52000.00, revenue_category: "repeat" },
      { revenue_id: 3, participation_dt: "2023-01-25", customer_id: 2, sales_rep: 3, revenue: 92000.00, revenue_category: "new" },
      { revenue_id: 4, participation_dt: "2023-04-18", customer_id: 2, sales_rep: 3, revenue: 78000.00, revenue_category: "repeat" },
      { revenue_id: 5, participation_dt: "2023-02-10", customer_id: 3, sales_rep: 4, revenue: 156000.00, revenue_category: "new" }
    ];

    // Import data in order of dependencies
    console.log('Importing sales reps...');
    const { error: salesRepsError } = await supabase.from('sales_reps').upsert(salesRepsData);
    if (salesRepsError) throw salesRepsError;

    console.log('Importing customers...');
    const { error: customersError } = await supabase.from('customers').upsert(customersData);
    if (customersError) throw customersError;

    console.log('Importing contacts...');
    const { error: contactsError } = await supabase.from('contacts').upsert(contactsData);
    if (contactsError) throw contactsError;

    console.log('Importing deals...');
    const { error: dealsError } = await supabase.from('deals_current').upsert(dealsData);
    if (dealsError) throw dealsError;

    console.log('Importing targets...');
    const { error: targetsError } = await supabase.from('targets').upsert(targetsData);
    if (targetsError) throw targetsError;

    console.log('Importing revenue...');
    const { error: revenueError } = await supabase.from('revenue').upsert(revenueData);
    if (revenueError) throw revenueError;

    console.log('Data import completed successfully!');

    return new Response(JSON.stringify({
      success: true,
      message: "All sample data imported successfully",
      imported: {
        sales_reps: salesRepsData.length,
        customers: customersData.length,
        contacts: contactsData.length,
        deals_current: dealsData.length,
        targets: targetsData.length,
        revenue: revenueData.length
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Import error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
