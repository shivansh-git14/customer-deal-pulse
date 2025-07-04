import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TeamFilters {
  startDate?: string;
  endDate?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { filters } = await req.json() as { filters: TeamFilters };
    
    console.log('Team overview request with filters:', filters);

    // Get all managers and their teams
    const { data: managersData } = await supabase
      .from('sales_reps')
      .select('sales_rep_id, sales_rep_name')
      .is('sales_rep_manager_id', null)
      .eq('is_active', true);

    const teams = [];
    let totalMembers = 0;
    let totalRevenue = 0;

    for (const manager of managersData || []) {
      // Get team members
      const { data: teamMembers } = await supabase
        .from('sales_reps')
        .select('sales_rep_id, sales_rep_name')
        .eq('sales_rep_manager_id', manager.sales_rep_id)
        .eq('is_active', true);

      const teamMemberIds = teamMembers?.map(m => m.sales_rep_id) || [];
      const teamCount = teamMemberIds.length;
      totalMembers += teamCount;

      // Get revenue for team
      let revenueQuery = supabase
        .from('revenue')
        .select('revenue, sales_rep, participation_dt')
        .in('sales_rep', teamMemberIds);

      if (filters.startDate) {
        revenueQuery = revenueQuery.gte('participation_dt', filters.startDate);
      }
      if (filters.endDate) {
        revenueQuery = revenueQuery.lte('participation_dt', filters.endDate);
      }

      const { data: revenueData } = await revenueQuery;
      const teamRevenue = revenueData?.reduce((sum, rev) => sum + (Number(rev.revenue) || 0), 0) || 0;
      totalRevenue += teamRevenue;

      // Get targets for team
      let targetsQuery = supabase
        .from('targets')
        .select('target_value, sales_rep_id, target_month')
        .in('sales_rep_id', teamMemberIds);

      if (filters.startDate) {
        targetsQuery = targetsQuery.gte('target_month', filters.startDate);
      }
      if (filters.endDate) {
        targetsQuery = targetsQuery.lte('target_month', filters.endDate);
      }

      const { data: targetsData } = await targetsQuery;
      const teamTarget = targetsData?.reduce((sum, target) => sum + (Number(target.target_value) || 0), 0) || 0;
      const targetPercentage = teamTarget > 0 ? (teamRevenue / teamTarget) * 100 : 0;

      // Get conversion rate (deals won vs total deals)
      const { data: dealsData } = await supabase
        .from('deals_current')
        .select('deal_stage, sales_rep_id')
        .in('sales_rep_id', teamMemberIds);

      const totalDeals = dealsData?.length || 0;
      const wonDeals = dealsData?.filter(deal => deal.deal_stage === 'won').length || 0;
      const conversionRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;

      // Get efficiency (events per opportunity)
      const { data: eventsData } = await supabase
        .from('events')
        .select('event_id, sales_rep_id')
        .in('sales_rep_id', teamMemberIds);

      const totalEvents = eventsData?.length || 0;
      const efficiency = totalDeals > 0 ? totalEvents / totalDeals : 0;

      // Calculate momentum based on recent performance trend
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const { data: recentRevenue } = await supabase
        .from('revenue')
        .select('revenue')
        .in('sales_rep', teamMemberIds)
        .gte('participation_dt', oneMonthAgo.toISOString().split('T')[0]);

      const { data: previousRevenue } = await supabase
        .from('revenue')
        .select('revenue')
        .in('sales_rep', teamMemberIds)
        .gte('participation_dt', twoMonthsAgo.toISOString().split('T')[0])
        .lt('participation_dt', oneMonthAgo.toISOString().split('T')[0]);

      const recentTotal = recentRevenue?.reduce((sum, rev) => sum + (Number(rev.revenue) || 0), 0) || 0;
      const previousTotal = previousRevenue?.reduce((sum, rev) => sum + (Number(rev.revenue) || 0), 0) || 0;

      let momentum: 'accelerating' | 'improving' | 'stable' | 'declining' = 'stable';
      if (previousTotal > 0) {
        const growth = ((recentTotal - previousTotal) / previousTotal) * 100;
        if (growth > 20) momentum = 'accelerating';
        else if (growth > 5) momentum = 'improving';
        else if (growth < -10) momentum = 'declining';
      }

      // Calculate risk level based on high-risk deals
      const { data: highRiskDeals } = await supabase
        .from('deals_current')
        .select('deal_id')
        .in('sales_rep_id', teamMemberIds)
        .eq('is_high_risk', 'Yes');

      const highRiskCount = highRiskDeals?.length || 0;
      const riskPercentage = totalDeals > 0 ? (highRiskCount / totalDeals) * 100 : 0;
      
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (riskPercentage > 30) riskLevel = 'high';
      else if (riskPercentage > 15) riskLevel = 'medium';

      // Calculate performance score (0-100)
      const targetScore = Math.min(targetPercentage, 150) / 150 * 30; // Max 30 points
      const conversionScore = Math.min(conversionRate, 50) / 50 * 25; // Max 25 points
      const efficiencyScore = Math.min(efficiency, 20) / 20 * 20; // Max 20 points
      const momentumScore = momentum === 'accelerating' ? 25 : momentum === 'improving' ? 15 : momentum === 'stable' ? 10 : 0; // Max 25 points
      
      const performanceScore = Math.round(targetScore + conversionScore + efficiencyScore + momentumScore);

      teams.push({
        manager_id: manager.sales_rep_id,
        manager_name: manager.sales_rep_name,
        team_count: teamCount,
        revenue: teamRevenue,
        target: teamTarget,
        target_percentage: targetPercentage,
        conversion_rate: conversionRate,
        efficiency: efficiency,
        momentum: momentum,
        risk_level: riskLevel,
        performance_score: performanceScore
      });
    }

    const avgPerformance = teams.length > 0 
      ? teams.reduce((sum, team) => sum + team.performance_score, 0) / teams.length 
      : 0;

    const response = {
      success: true,
      data: {
        teams: teams.sort((a, b) => b.performance_score - a.performance_score),
        totalMembers,
        totalRevenue,
        avgPerformance: Math.round(avgPerformance)
      }
    };

    console.log('Team overview response:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Team overview error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});