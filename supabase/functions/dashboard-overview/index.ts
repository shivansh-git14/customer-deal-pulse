
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  salesManagerId?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body for filters - standardized pattern
    const { startDate, endDate, salesManagerId } = await req.json();
    console.log('Dashboard overview request with filters:', { startDate, endDate, salesManagerId });

    // Get team members based on sales manager filter
    let teamRepIds: number[] = [];
    if (salesManagerId) {
      const { data: teamReps } = await supabase
        .from('sales_reps')
        .select('sales_rep_id')
        .eq('sales_rep_manager_id', salesManagerId);
      
      teamRepIds = teamReps?.map(rep => rep.sales_rep_id) || [];
      console.log('Team rep IDs for manager', salesManagerId, ':', teamRepIds);
    }

    // 1. Calculate Overall Revenue and Target Completion
    let revenueQuery = supabase
      .from('revenue')
      .select('revenue, sales_rep, participation_dt');
    
    if (startDate) {
      revenueQuery = revenueQuery.gte('participation_dt', startDate);
    }
    if (endDate) {
      revenueQuery = revenueQuery.lte('participation_dt', endDate);
    }

    const { data: revenueData, error: revenueError } = await revenueQuery;
    if (revenueError) throw revenueError;
    console.log('Raw revenue data:', revenueData?.length || 0, 'records');

    // Filter by sales manager if specified
    let filteredRevenueData = revenueData;
    if (salesManagerId && teamRepIds.length > 0) {
      filteredRevenueData = revenueData?.filter(rev => teamRepIds.includes(rev.sales_rep)) || [];
    }

    const totalRevenue = filteredRevenueData?.reduce((sum, rev) => sum + (Number(rev.revenue) || 0), 0) || 0;
    console.log('Total revenue calculated:', totalRevenue);

    // Get targets for the same period
    let targetsQuery = supabase
      .from('targets')
      .select('target_value, sales_rep_id, target_month');
    
    if (startDate) {
      targetsQuery = targetsQuery.gte('target_month', startDate);
    }
    if (endDate) {
      targetsQuery = targetsQuery.lte('target_month', endDate);
    }

    const { data: targetsData, error: targetsError } = await targetsQuery;
    if (targetsError) throw targetsError;
    console.log('Raw targets data:', targetsData?.length || 0, 'records');

    // Filter targets by sales manager if specified
    let filteredTargetsData = targetsData;
    if (salesManagerId && teamRepIds.length > 0) {
      filteredTargetsData = targetsData?.filter(target => teamRepIds.includes(target.sales_rep_id)) || [];
    }

    const totalTarget = filteredTargetsData?.reduce((sum, target) => sum + (Number(target.target_value) || 0), 0) || 0;
    const targetCompletion = totalTarget > 0 ? (totalRevenue / totalTarget) * 100 : 0;
    console.log('Total target:', totalTarget, 'Completion:', targetCompletion);

    // 2. Find Best Performer by % Target (revenue/target ratio)
    const { data: salesRepsData } = await supabase
      .from('sales_reps')
      .select('sales_rep_id, sales_rep_name, sales_rep_manager_id');

    const repPerformance = salesRepsData?.map(rep => {
      if (!rep.sales_rep_manager_id) return null;
      if (salesManagerId && rep.sales_rep_manager_id !== salesManagerId) return null;

      const repRevenue = filteredRevenueData?.filter(rev => rev.sales_rep === rep.sales_rep_id)
        .reduce((sum, rev) => sum + (Number(rev.revenue) || 0), 0) || 0;
      const repTarget = filteredTargetsData?.filter(target => target.sales_rep_id === rep.sales_rep_id)
        .reduce((sum, target) => sum + (Number(target.target_value) || 0), 0) || 0;
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

    // 3. Calculate Average Deal Size
    const dealValues = filteredRevenueData?.map(rev => Number(rev.revenue) || 0) || [];
    const avgDealSize = dealValues.length > 0 
      ? dealValues.reduce((sum, val) => sum + val, 0) / dealValues.length 
      : 0;
    console.log('Average deal size:', avgDealSize, 'from', dealValues.length, 'deals');

    // 4. Calculate Average Activities per Rep
    let eventsQuery = supabase
      .from('events')
      .select('sales_rep_id, event_timestamp');

    const { data: eventsData, error: eventsError } = await eventsQuery;
    if (eventsError) throw eventsError;

    console.log('--- Avg Activity Calculation Debug ---');
    console.log('Raw eventsData:', Array.isArray(eventsData) ? eventsData.length : 0);
    
    let filteredEvents = Array.isArray(eventsData) ? eventsData.filter(event => {
      const eventDate = event.event_timestamp?.split('T')[0];
      const isAfterStart = !startDate || eventDate >= startDate;
      const isBeforeEnd = !endDate || eventDate <= endDate;
      return isAfterStart && isBeforeEnd;
    }) : [];
    
    if (salesManagerId && teamRepIds.length > 0) {
      filteredEvents = filteredEvents.filter(event => teamRepIds.includes(event.sales_rep_id));
    }
    
    const totalActivities = filteredEvents.length;
    
    let totalRepsInFilter = 0;
    if (salesManagerId) {
      totalRepsInFilter = teamRepIds.length;
    } else {
      totalRepsInFilter = salesRepsData?.filter(rep => rep.sales_rep_manager_id).length || 0;
    }
    
    const avgActivitiesPerRep = totalRepsInFilter > 0 ? totalActivities / totalRepsInFilter : 0;
    console.log('Total activities:', totalActivities, 'Total reps:', totalRepsInFilter, 'Avg:', avgActivitiesPerRep);
    console.log('--- End Avg Activity Calculation Debug ---');

    // --- Critical Alerts (High Risk Deals) ---
    console.log('[Debug] Processing critical alerts...');

    // Step 1: Fetch raw high-risk deals
    const { data: highRiskDeals, error: highRiskDealsError } = await supabase
      .from('deals_current')
      .select('deal_id, max_deal_potential, deal_stage, customer_id, sales_rep_id, customers (customer_name), sales_reps (sales_rep_name)')
      .eq('is_high_risk', 'Yes');

    if (highRiskDealsError) {
      console.error('[Error] Supabase query for high-risk deals failed:', highRiskDealsError.message);
      return new Response(JSON.stringify({ error: 'Failed to fetch high-risk deals' }), { headers: corsHeaders, status: 500 });
    }
    console.log(`[Debug] Step 1: Found ${highRiskDeals?.length ?? 0} raw high-risk deals.`);

    // Step 2: Apply manager filter if necessary
    let managerFilteredDeals = highRiskDeals;
    if (salesManagerId) {
      console.log(`[Debug] Step 2a: Manager filter applied for salesManagerId: ${salesManagerId}`);
      const { data: repsData, error: repsError } = await supabase
        .from('sales_reps')
        .select('sales_rep_id')
        .eq('sales_rep_manager_id', salesManagerId);

      if (repsError) {
        console.error('[Error] Failed to fetch sales reps for manager:', repsError.message);
      } else {
        teamRepIds = repsData?.map((rep: any) => rep.sales_rep_id) || [];
        console.log(`[Debug] Step 2b: Found ${teamRepIds.length} reps for this manager.`);
        managerFilteredDeals = highRiskDeals.filter((deal: any) => teamRepIds.includes(deal.sales_rep_id));
      }
    }
    console.log(`[Debug] Step 2c: ${managerFilteredDeals?.length ?? 0} deals remain after manager filter.`);

    // Step 3: Map deals to the final alert format
    const criticalAlerts = managerFilteredDeals.map((deal: any) => ({
      dealId: deal.deal_id,
      customerName: deal.customers?.customer_name ?? 'N/A',
      salesRepName: deal.sales_reps?.sales_rep_name ?? 'N/A',
      dealStage: deal.deal_stage,
      revenueAtRisk: deal.max_deal_potential,
    }));
    console.log(`[Debug] Step 3: Mapped to ${criticalAlerts.length} critical alerts.`);

    // Get available managers
    const { data: managersData, error: managersError } = await supabase
      .from('sales_reps')
      .select('sales_rep_id, sales_rep_name')
      .is('sales_rep_manager_id', null)
      .eq('is_active', true);

    const response = {
      success: true,
      data: {
        overallRevenue: { total: totalRevenue, target: totalTarget, completionPercentage: targetCompletion },
        bestPerformer: bestPerformer ? {
          sales_rep_id: bestPerformer.sales_rep_id,
          sales_rep_name: bestPerformer.sales_rep_name,
          revenue: bestPerformer.revenue,
        } : null,
        avgDealSize: avgDealSize,
        avgActivitiesPerRep: avgActivitiesPerRep,
        criticalAlerts: managerFilteredDeals.map(deal => ({
          deal_id: deal.deal_id,
          customer_name: deal.customers?.customer_name || 'Unknown',
          sales_rep_name: deal.sales_reps?.sales_rep_name || 'Unknown',
          deal_stage: deal.deal_stage,

          revenueAtRisk: Number(deal.max_deal_potential) || 0
        })),
        availableManagers: managersData || []
      }
    };


// Removed duplicate totalRevenue declaration

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
