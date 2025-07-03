import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  salesManagerId?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { filters } = await req.json() as { filters: DashboardFilters };
    
    console.log('Dashboard overview request with filters:', filters);

    // 1. Calculate Overall Revenue and Target Completion
    let revenueQuery = supabase
      .from('revenue')
      .select('revenue, sales_rep, participation_dt');
    
    if (filters.startDate) {
      revenueQuery = revenueQuery.gte('participation_dt', filters.startDate);
    }
    if (filters.endDate) {
      revenueQuery = revenueQuery.lte('participation_dt', filters.endDate);
    }

    const { data: revenueData, error: revenueError } = await revenueQuery;
    if (revenueError) throw revenueError;

    console.log('Raw revenue data:', revenueData?.length || 0, 'records');

    // Filter by sales manager if specified
    let filteredRevenueData = revenueData;
    if (filters.salesManagerId) {
      const { data: teamReps } = await supabase
        .from('sales_reps')
        .select('sales_rep_id')
        .eq('sales_rep_manager_id', filters.salesManagerId);
      
      const teamRepIds = teamReps?.map(rep => rep.sales_rep_id) || [];
      console.log('Team rep IDs for manager', filters.salesManagerId, ':', teamRepIds);
      filteredRevenueData = revenueData?.filter(rev => teamRepIds.includes(rev.sales_rep)) || [];
    }

    const totalRevenue = filteredRevenueData?.reduce((sum, rev) => sum + (Number(rev.revenue) || 0), 0) || 0;
    console.log('Total revenue calculated:', totalRevenue);

    // Get targets for the same period
    let targetsQuery = supabase
      .from('targets')
      .select('target_value, sales_rep_id, target_month');
    
    if (filters.startDate) {
      targetsQuery = targetsQuery.gte('target_month', filters.startDate);
    }
    if (filters.endDate) {
      targetsQuery = targetsQuery.lte('target_month', filters.endDate);
    }

    const { data: targetsData, error: targetsError } = await targetsQuery;
    if (targetsError) throw targetsError;

    console.log('Raw targets data:', targetsData?.length || 0, 'records');

    // Filter targets by sales manager if specified
    let filteredTargetsData = targetsData;
    if (filters.salesManagerId) {
      const { data: teamReps } = await supabase
        .from('sales_reps')
        .select('sales_rep_id')
        .eq('sales_rep_manager_id', filters.salesManagerId);
      
      const teamRepIds = teamReps?.map(rep => rep.sales_rep_id) || [];
      filteredTargetsData = targetsData?.filter(target => teamRepIds.includes(target.sales_rep_id)) || [];
    }

    const totalTarget = filteredTargetsData?.reduce((sum, target) => sum + (Number(target.target_value) || 0), 0) || 0;
    const targetCompletion = totalTarget > 0 ? (totalRevenue / totalTarget) * 100 : 0;

    console.log('Total target:', totalTarget, 'Completion:', targetCompletion);

    // 2. Find Best Performer by Conversion Rate
    const { data: salesRepsData } = await supabase
      .from('sales_reps')
      .select('sales_rep_id, sales_rep_name, sales_rep_manager_id');

    // Get deals data for conversion calculation
    const { data: dealsData } = await supabase
      .from('deals_current')
      .select('sales_rep_id, deal_stage, customer_id');

    console.log('Deals data:', dealsData?.length || 0, 'records');

    // Calculate conversion rates for each sales rep
    const repPerformance = salesRepsData?.map(rep => {
      // Filter by manager if specified
      if (filters.salesManagerId && rep.sales_rep_manager_id !== filters.salesManagerId) {
        return null;
      }

      const repDeals = dealsData?.filter(deal => deal.sales_rep_id === rep.sales_rep_id) || [];
      const totalDeals = repDeals.length;
      const wonDeals = repDeals.filter(deal => 
        deal.deal_stage === 'won' || 
        deal.deal_stage === 'closed won' || 
        deal.deal_stage === 'closed-won'
      ).length;
      const conversionRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;

      return {
        sales_rep_id: rep.sales_rep_id,
        sales_rep_name: rep.sales_rep_name,
        totalDeals,
        wonDeals,
        conversionRate
      };
    }).filter(Boolean) || [];

    const bestPerformer = repPerformance.reduce((best, current) => {
      return (current?.conversionRate || 0) > (best?.conversionRate || 0) ? current : best;
    }, repPerformance[0]);

    console.log('Best performer:', bestPerformer);

    // 3. Calculate Average Deal Size - Use revenue data directly
    const dealValues = filteredRevenueData?.map(rev => Number(rev.revenue) || 0) || [];
    const avgDealSize = dealValues.length > 0 
      ? dealValues.reduce((sum, val) => sum + val, 0) / dealValues.length 
      : 0;

    console.log('Average deal size:', avgDealSize, 'from', dealValues.length, 'deals');

    // Get sales managers for filter dropdown - these are people who manage others
    const { data: managersData } = await supabase
      .from('sales_reps')
      .select('sales_rep_id, sales_rep_name')
      .is('sales_rep_manager_id', null)
      .eq('is_active', true);

    const response = {
      success: true,
      data: {
        overallRevenue: {
          total: totalRevenue,
          target: totalTarget,
          completionPercentage: targetCompletion
        },
        bestPerformer: bestPerformer || null,
        avgDealSize: avgDealSize,
        availableManagers: managersData || []
      }
    };

    console.log('Dashboard overview response:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});