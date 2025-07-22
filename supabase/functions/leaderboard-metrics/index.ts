import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Define the interface for a single leaderboard entry
interface LeaderboardMetric {
  sales_rep_id: string;
  sales_rep_name: string;
  revenue: number;
  target: number;
  target_percentage: number;
  conversion_rate: number;
  total_deals: number;
  avg_deal_size: number;
  performance: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { startDate, endDate, salesManagerId } = await req.json()

    console.log('Fetching leaderboard metrics with filters:', { startDate, endDate, salesManagerId })

    // Get all sales reps, optionally filtering by manager
    let salesRepsQuery = supabase
      .from('sales_reps')
      .select('sales_rep_id, sales_rep_name')
      .eq('is_active', true)

    if (salesManagerId) {
      salesRepsQuery = salesRepsQuery.eq('sales_rep_manager_id', salesManagerId)
    }

    const { data: salesReps, error: salesRepsError } = await salesRepsQuery

    if (salesRepsError) {
      console.error('Error fetching sales reps:', salesRepsError)
      throw salesRepsError
    }

    console.log('Found sales reps:', salesReps)

    const leaderboardMetrics: LeaderboardMetric[] = []

    // Get all sales rep IDs from the fetched sales reps
    const repIds = (salesReps || []).map(rep => rep.sales_rep_id);

    // Build the base revenue query for all these reps
    let revenueQuery = supabase
      .from('revenue')
      .select('sales_rep, revenue, participation_dt')
      .in('sales_rep', repIds);

    // Apply date filters if provided
    if (startDate) {
      revenueQuery = revenueQuery.gte('participation_dt', startDate);
    }
    if (endDate) {
      revenueQuery = revenueQuery.lte('participation_dt', endDate);
    }

    // Execute the query
    const { data: allRevenue, error: revenueError } = await revenueQuery;

    if (revenueError) {
      console.error('Error fetching revenue:', revenueError);
      throw revenueError;
    }
      
    // Batch fetch targets for all reps
    let targetsQuery = supabase
  .from('targets')
  .select('sales_rep_id, target_value, target_month')
  .in('sales_rep_id', repIds);

const startOfStartDate = new Date(startDate);
startOfStartDate.setDate(1);
if (startOfStartDate) {
  targetsQuery = targetsQuery.gte('target_month', startOfStartDate.toISOString());
}
const startOfEndDate = new Date(endDate);
startOfEndDate.setDate(1);
if (startOfEndDate) {
  targetsQuery = targetsQuery.lte('target_month', startOfEndDate.toISOString());
}

// Execute the query
const { data: allTarget, error: targetsError } = await targetsQuery;

    if (targetsError) {
      console.error('Error fetching targets:', targetsError);
      throw targetsError;
    }

      

      // Get deals for conversion and efficiency metrics
      let dealsQuery = supabase
  .from('deals_current')
  .select('sales_rep_id, deal_id, deal_stage, max_deal_potential, is_high_risk, created_at')
  .in('sales_rep_id', repIds);

if (startDate) {
  dealsQuery = dealsQuery.gte('created_at', startDate);
}
if (endDate) {
  dealsQuery = dealsQuery.lte('created_at', endDate);
}

      const { data: dealsData, error: dealsError } = await dealsQuery

      if (dealsError) {
        console.error(`Error fetching deals for rep ${repId}:`, dealsError)
        throw dealsError
      }

      const revenueByRep = {};
for (const rev of allRevenue) {
  if (!revenueByRep[rev.sales_rep]) revenueByRep[rev.sales_rep] = [];
  revenueByRep[rev.sales_rep].push(rev);
}

const targetsByRep = {};
for (const target of allTarget) {
  if (!targetsByRep[target.sales_rep_id]) targetsByRep[target.sales_rep_id] = [];
  targetsByRep[target.sales_rep_id].push(target);
}

const dealsByRep = {};
for (const deal of dealsData) {
  if (!dealsByRep[deal.sales_rep_id]) dealsByRep[deal.sales_rep_id] = [];
  dealsByRep[deal.sales_rep_id].push(deal);
}

for (const rep of salesReps) {
  const repId = rep.sales_rep_id;

  // Get grouped data arrays for this rep
  const repRevenue = revenueByRep[repId] || [];
  const repTargets = targetsByRep[repId] || [];
  const repDeals = dealsByRep[repId] || [];

  // Calculate total revenue
  const totalRevenue = repRevenue.reduce((sum, record) => sum + Number(record.revenue), 0);

  // Calculate total target (avoid division by zero)
  const totalTarget = repTargets.reduce((sum, record) => sum + Number(record.target_value), 0) || 1;

  // Calculate deals-based metrics
  const totalDeals = repDeals.length;
  const closedWonDeals = repDeals.filter(deal => deal.deal_stage === 'closed_won').length;
  const highRiskDeals = repDeals.filter(deal => deal.is_high_risk === 'yes').length;
  const conversionRate = totalDeals > 0 ? (closedWonDeals / totalDeals) * 100 : 0;
  const targetPercentage = totalTarget > 0 ? (totalRevenue / totalTarget) * 100 : 0;

  // Average deal size
  const dealValues = repDeals.map(deal => Number(deal.max_deal_potential) || 0).filter(val => val > 0);
  const avgDealSize = dealValues.length > 0 ? dealValues.reduce((sum, val) => sum + val, 0) / dealValues.length : 0;

  // Risk ratio and performance score
  const riskRatio = totalDeals > 0 ? highRiskDeals / totalDeals : 0;
  const performanceScore = Math.round(
    (targetPercentage * 0.5) +
    (conversionRate * 1.5) +
    ((100 - riskRatio * 100) * 0.2)
  );

  // Push to results array
  leaderboardMetrics.push({
    sales_rep_id: repId,
    sales_rep_name: rep.sales_rep_name,
    revenue: totalRevenue,
    target: totalTarget,
    target_percentage: Math.round(targetPercentage * 100) / 100,
    conversion_rate: Math.round(conversionRate * 100) / 100,
    total_deals: totalDeals,
    avg_deal_size: Math.round(avgDealSize),
    performance: Math.min(100, Math.max(0, performanceScore)),
  });
}

    //   const totalRevenue = revenueData?.reduce((sum, record) => sum + Number(record.revenue), 0) || 0

    //   const totalTarget = targetData?.reduce((sum, record) => sum + Number(record.target_value), 0) || 1

    //   // Calculate metrics
    //   const totalDeals = dealsData?.length || 0
    //   const closedWonDeals = dealsData?.filter(deal => deal.deal_stage === 'closed_won').length || 0
    //   const highRiskDeals = dealsData?.filter(deal => deal.is_high_risk === 'yes').length || 0
    //   const conversionRate = totalDeals > 0 ? (closedWonDeals / totalDeals) * 100 : 0
    //   const targetPercentage = totalTarget > 0 ? (totalRevenue / totalTarget) * 100 : 0
      
    //   const dealValues = dealsData?.map(deal => Number(deal.max_deal_potential) || 0).filter(val => val > 0) || []
    //   const avgDealSize = dealValues.length > 0 ? dealValues.reduce((sum, val) => sum + val, 0) / dealValues.length : 0

    //   const riskRatio = totalDeals > 0 ? highRiskDeals / totalDeals : 0
    //   const performanceScore = Math.round(
    //     (targetPercentage * 0.5) + 
    //     (conversionRate * 1.5) + 
    //     ((100 - riskRatio * 100) * 0.2)
    //   )

    //   leaderboardMetrics.push({
    //     sales_rep_id: rep.sales_rep_id,
    //     sales_rep_name: rep.sales_rep_name,
    //     revenue: totalRevenue,
    //     target: totalTarget,
    //     target_percentage: Math.round(targetPercentage * 100) / 100,
    //     conversion_rate: Math.round(conversionRate * 100) / 100,
    //     total_deals: totalDeals,
    //     avg_deal_size: Math.round(avgDealSize),
    //     performance: Math.min(100, Math.max(0, performanceScore)),
    //   })
    // }

    const top10 = leaderboardMetrics
      .sort((a, b) => b.performance - a.performance)
      .slice(0, 10);

    console.log('Leaderboard metrics calculated:', top10)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: top10 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in leaderboard-metrics function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
