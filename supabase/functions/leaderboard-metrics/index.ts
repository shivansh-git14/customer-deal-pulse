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

    let body;
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }
    const { startDate, endDate, salesManagerId } = body;

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

    for (const rep of salesReps || []) {
      const repId = rep.sales_rep_id

      // Get revenue
      let revenueQuery = supabase
        .from('revenue')
        .select('revenue')
        .eq('sales_rep', repId)

      if (startDate) {
        revenueQuery = revenueQuery.gte('participation_dt', startDate)
      }
      if (endDate) {
        revenueQuery = revenueQuery.lte('participation_dt', endDate)
      }

      const { data: revenueData, error: revenueError } = await revenueQuery

      if (revenueError) {
        console.error(`Error fetching revenue for rep ${repId}:`, revenueError)
        continue
      }

      const totalRevenue = revenueData?.reduce((sum, record) => sum + Number(record.revenue), 0) || 0

      // Get targets
      const { data: targetData, error: targetError } = await supabase
        .from('targets')
        .select('target_value')
        .eq('sales_rep_id', repId)

      if (targetError) {
        console.error(`Error fetching targets for rep ${repId}:`, targetError)
        continue
      }

      const totalTarget = targetData?.reduce((sum, record) => sum + Number(record.target_value), 0) || 1

      // Get deals for conversion and efficiency metrics
      let dealsQuery = supabase
        .from('deals_current')
        .select('deal_id, deal_stage, max_deal_potential, is_high_risk')
        .eq('sales_rep_id', repId)

      const { data: dealsData, error: dealsError } = await dealsQuery

      if (dealsError) {
        console.error(`Error fetching deals for rep ${repId}:`, dealsError)
        continue
      }

      // Calculate metrics
      const totalDeals = dealsData?.length || 0
      const closedWonDeals = dealsData?.filter(deal => deal.deal_stage === 'closed_won').length || 0
      const highRiskDeals = dealsData?.filter(deal => deal.is_high_risk === 'yes').length || 0
      const conversionRate = totalDeals > 0 ? (closedWonDeals / totalDeals) * 100 : 0
      const targetPercentage = totalTarget > 0 ? (totalRevenue / totalTarget) * 100 : 0
      
      const dealValues = dealsData?.map(deal => Number(deal.max_deal_potential) || 0).filter(val => val > 0) || []
      const avgDealSize = dealValues.length > 0 ? dealValues.reduce((sum, val) => sum + val, 0) / dealValues.length : 0

      const riskRatio = totalDeals > 0 ? highRiskDeals / totalDeals : 0
      const performanceScore = Math.round(
        (targetPercentage * 0.5) + 
        (conversionRate * 1.5) + 
        ((100 - riskRatio * 100) * 0.2)
      )

      leaderboardMetrics.push({
        sales_rep_id: rep.sales_rep_id,
        sales_rep_name: rep.sales_rep_name,
        revenue: totalRevenue,
        target: totalTarget,
        target_percentage: Math.round(targetPercentage * 100) / 100,
        conversion_rate: Math.round(conversionRate * 100) / 100,
        total_deals: totalDeals,
        avg_deal_size: Math.round(avgDealSize),
        performance: Math.min(100, Math.max(0, performanceScore)),
      })
    }

    console.log('Leaderboard metrics calculated:', leaderboardMetrics)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: leaderboardMetrics 
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
