
import { createClient } from 'jsr:@supabase/supabase-js@2'

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

    // Get team members based on sales manager filter
    let teamRepIds: number[] = [];
    if (filters.salesManagerId) {
      const { data: teamReps } = await supabase
        .from('sales_reps')
        .select('sales_rep_id')
        .eq('sales_rep_manager_id', filters.salesManagerId);
      
      teamRepIds = teamReps?.map(rep => rep.sales_rep_id) || [];
      console.log('Team rep IDs for manager', filters.salesManagerId, ':', teamRepIds);
    }

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
    if (filters.salesManagerId && teamRepIds.length > 0) {
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
    if (filters.salesManagerId && teamRepIds.length > 0) {
      filteredTargetsData = targetsData?.filter(target => teamRepIds.includes(target.sales_rep_id)) || [];
    }

    const totalTarget = filteredTargetsData?.reduce((sum, target) => sum + (Number(target.target_value) || 0), 0) || 0;
    const targetCompletion = totalTarget > 0 ? (totalRevenue / totalTarget) * 100 : 0;

    console.log('Total target:', totalTarget, 'Completion:', targetCompletion);

    // 2. Find Best Performer by % Target (revenue/target ratio)
    const { data: salesRepsData } = await supabase
      .from('sales_reps')
      .select('sales_rep_id, sales_rep_name, sales_rep_manager_id');

    // Calculate % target for each sales rep
    const repPerformance = salesRepsData?.map(rep => {
      // Only include sales reps who have a manager (not the managers themselves)
      if (!rep.sales_rep_manager_id) {
        return null;
      }

      // Filter by manager if specified
      if (filters.salesManagerId && rep.sales_rep_manager_id !== filters.salesManagerId) {
        return null;
      }

      // Calculate rep's revenue for the period
      const repRevenue = filteredRevenueData?.filter(rev => rev.sales_rep === rep.sales_rep_id)
        .reduce((sum, rev) => sum + (Number(rev.revenue) || 0), 0) || 0;

      // Calculate rep's target for the period
      const repTarget = filteredTargetsData?.filter(target => target.sales_rep_id === rep.sales_rep_id)
        .reduce((sum, target) => sum + (Number(target.target_value) || 0), 0) || 0;

      // Calculate % target
      const percentTarget = repTarget > 0 ? (repRevenue / repTarget) * 100 : 0;

      return {
        sales_rep_id: rep.sales_rep_id,
        sales_rep_name: rep.sales_rep_name,
        revenue: repRevenue,
        target: repTarget,
        percentTarget
      };
    }).filter(Boolean) || [];

    const bestPerformer = repPerformance.reduce((best, current) => {
      return (current?.percentTarget || 0) > (best?.percentTarget || 0) ? current : best;
    }, repPerformance[0]);

    console.log('Best performer by % target:', bestPerformer);

    // 3. Calculate Average Deal Size - Use revenue data directly
    const dealValues = filteredRevenueData?.map(rev => Number(rev.revenue) || 0) || [];
    const avgDealSize = dealValues.length > 0 
      ? dealValues.reduce((sum, val) => sum + val, 0) / dealValues.length 
      : 0;

    console.log('Average deal size:', avgDealSize, 'from', dealValues.length, 'deals');

    // 4. Get Critical Alerts - High Risk Deals
    let dealsQuery = supabase
      .from('deals_current')
      .select(`
        deal_id,
        deal_stage,
        max_deal_potential,
        is_high_risk,
        sales_rep_id,
        customer_id,
        sales_reps(sales_rep_name, sales_rep_manager_id),
customers(customer_name)
      `)
      .eq('is_high_risk', 'Yes');

    const { data: highRiskDeals } = await dealsQuery;

    // Filter high risk deals by manager if specified
    let filteredHighRiskDeals = highRiskDeals;
    if (filters.salesManagerId && teamRepIds.length > 0) {
      filteredHighRiskDeals = highRiskDeals?.filter(deal => 
        teamRepIds.includes(deal.sales_rep_id)
      ) || [];
    }

    // Sort by max_deal_potential (revenue at risk) descending and return all high risk deals
    const criticalAlerts = filteredHighRiskDeals?.sort((a, b) => 
      (Number(b.max_deal_potential) || 0) - (Number(a.max_deal_potential) || 0)
    ) || []; // Return all high-risk deals

    console.log('Critical alerts (high risk deals):', criticalAlerts.length);

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
        bestPerformer: bestPerformer ? {
          sales_rep_id: bestPerformer.sales_rep_id,
          sales_rep_name: bestPerformer.sales_rep_name,
          revenue: bestPerformer.revenue,
          target: bestPerformer.target,
          percentTarget: bestPerformer.percentTarget
        } : null,
        avgDealSize: avgDealSize,
        criticalAlerts: criticalAlerts.map(deal => ({
          deal_id: deal.deal_id,
          customer_name: deal.customers?.customer_name || 'Unknown',
          sales_rep_name: deal.sales_reps?.sales_rep_name || 'Unknown',
          deal_stage: deal.deal_stage,
          revenueAtRisk: Number(deal.max_deal_potential) || 0
        })),
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
