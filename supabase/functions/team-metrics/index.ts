import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    console.log('Fetching team metrics with filters:', { startDate, endDate, salesManagerId })

    // Get all managers and their teams
    const { data: managers, error: managersError } = await supabase
      .from('sales_reps')
      .select('sales_rep_id, sales_rep_name')
      .eq('sales_rep_manager_id', null)
      .eq('is_active', true)

    if (managersError) {
      console.error('Error fetching managers:', managersError)
      throw managersError
    }

    const teamMetrics = []

    for (const manager of managers || []) {
      // Skip if filtering by specific manager and this isn't the one
      if (salesManagerId && manager.sales_rep_id !== salesManagerId) {
        continue
      }

      // Get team members
      const { data: teamMembers, error: teamError } = await supabase
        .from('sales_reps')
        .select('sales_rep_id, sales_rep_name')
        .eq('sales_rep_manager_id', manager.sales_rep_id)
        .eq('is_active', true)

      if (teamError) {
        console.error('Error fetching team members:', teamError)
        continue
      }

      const teamMemberIds = teamMembers?.map(member => member.sales_rep_id) || []
      if (teamMemberIds.length === 0) continue

      // Get team revenue
      let revenueQuery = supabase
        .from('revenue')
        .select('revenue, sales_rep')
        .in('sales_rep', teamMemberIds)

      if (startDate) {
        revenueQuery = revenueQuery.gte('participation_dt', startDate)
      }
      if (endDate) {
        revenueQuery = revenueQuery.lte('participation_dt', endDate)
      }

      const { data: revenueData, error: revenueError } = await revenueQuery

      if (revenueError) {
        console.error('Error fetching revenue data:', revenueError)
        continue
      }

      const totalRevenue = revenueData?.reduce((sum, record) => sum + Number(record.revenue), 0) || 0

      // Get team targets
      const { data: targetData, error: targetError } = await supabase
        .from('targets')
        .select('target_value')
        .in('sales_rep_id', teamMemberIds)

      if (targetError) {
        console.error('Error fetching target data:', targetError)
        continue
      }

      const totalTarget = targetData?.reduce((sum, record) => sum + Number(record.target_value), 0) || 1

      // Get team deals for conversion and efficiency metrics
      const { data: dealsData, error: dealsError } = await supabase
        .from('deals_current')
        .select(`
          deal_id, 
          deal_stage, 
          max_deal_potential, 
          is_high_risk,
          sales_rep_id
        `)
        .in('sales_rep_id', teamMemberIds)

      if (dealsError) {
        console.error('Error fetching deals data:', dealsError)
        continue
      }

      // Calculate metrics
      const totalDeals = dealsData?.length || 0
      const closedWonDeals = dealsData?.filter(deal => deal.deal_stage === 'closed_won').length || 0
      const highRiskDeals = dealsData?.filter(deal => deal.is_high_risk === 'yes').length || 0
      const conversionRate = totalDeals > 0 ? (closedWonDeals / totalDeals) * 100 : 0
      const targetPercentage = totalTarget > 0 ? (totalRevenue / totalTarget) * 100 : 0
      
      // Calculate average deal potential
      const dealValues = dealsData?.map(deal => Number(deal.max_deal_potential) || 0).filter(val => val > 0) || []
      const avgDealSize = dealValues.length > 0 ? dealValues.reduce((sum, val) => sum + val, 0) / dealValues.length : 0

      // Determine momentum based on target percentage
      let momentum = 'Stable'
      if (targetPercentage >= 110) momentum = 'Accelerating'
      else if (targetPercentage >= 90) momentum = 'Improving'
      else if (targetPercentage < 70) momentum = 'Declining'

      // Determine risk level
      let riskLevel = 'Low Risk'
      const riskRatio = totalDeals > 0 ? highRiskDeals / totalDeals : 0
      if (riskRatio > 0.4) riskLevel = 'High Risk'
      else if (riskRatio > 0.2) riskLevel = 'Medium Risk'

      // Calculate performance score (weighted combination of metrics)
      const performanceScore = Math.round(
        (targetPercentage * 0.4) + 
        (conversionRate * 2) + 
        ((100 - riskRatio * 100) * 0.3)
      )

      // Efficiency metric (deals per team member)
      const efficiency = teamMemberIds.length > 0 ? totalDeals / teamMemberIds.length : 0

      teamMetrics.push({
        team_name: `${manager.sales_rep_name} Team`,
        team_size: teamMemberIds.length,
        revenue: totalRevenue,
        target: totalTarget,
        target_percentage: Math.round(targetPercentage * 100) / 100,
        conversion_rate: Math.round(conversionRate * 100) / 100,
        efficiency: Math.round(efficiency * 100) / 100,
        momentum,
        risk_level: riskLevel,
        performance_score: Math.min(100, Math.max(0, performanceScore)),
        avg_deal_size: Math.round(avgDealSize)
      })
    }

    console.log('Team metrics calculated:', teamMetrics)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: teamMetrics 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in team-metrics function:', error)
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