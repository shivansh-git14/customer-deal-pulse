
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log('Fetching team metrics with filters:', { startDate, endDate, salesManagerId });

    // Get managers (reps with no manager_id)
    let managersQuery = supabase
      .from('sales_reps')
      .select('sales_rep_id, sales_rep_name, sales_rep_manager_id, is_active')
      .eq('is_active', true)
      .is('sales_rep_manager_id', null);

    // If filtering by specific manager, get only that manager
    if (salesManagerId) {
      managersQuery = managersQuery.eq('sales_rep_id', salesManagerId);
    }

    const { data: managers, error: managersError } = await managersQuery;

    if (managersError) {
      console.error('Error fetching managers:', managersError);
      throw managersError;
    }

    console.log('Found managers:', managers?.length || 0);

    if (!managers || managers.length === 0) {
      console.log('No managers found');
      return new Response(JSON.stringify({ 
        success: true, 
        data: [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const teamMetrics = [];

    for (const manager of managers) {
      console.log(`Processing manager: ${manager.sales_rep_name} (ID: ${manager.sales_rep_id})`);

      // Get team members for this manager
      const { data: teamMembers, error: teamError } = await supabase
        .from('sales_reps')
        .select('sales_rep_id, sales_rep_name')
        .eq('sales_rep_manager_id', manager.sales_rep_id)
        .eq('is_active', true);

      if (teamError) {
        console.error('Error fetching team members:', teamError);
        continue;
      }

      // Include manager in the team
      const allTeamMembers = [
        { sales_rep_id: manager.sales_rep_id, sales_rep_name: manager.sales_rep_name },
        ...(teamMembers || [])
      ];

      console.log(`Team members for ${manager.sales_rep_name}:`, allTeamMembers.length);

      // Get team revenue
      const teamRepIds = allTeamMembers.map(rep => rep.sales_rep_id);
      
      let revenueQuery = supabase
        .from('revenue')
        .select('revenue, sales_rep')
        .in('sales_rep', teamRepIds);

      if (startDate) {
        revenueQuery = revenueQuery.gte('participation_dt', startDate);
      }
      if (endDate) {
        revenueQuery = revenueQuery.lte('participation_dt', endDate);
      }

      const { data: revenueData, error: revenueError } = await revenueQuery;

      if (revenueError) {
        console.error('Error fetching revenue data:', revenueError);
        continue;
      }

      const totalRevenue = revenueData?.reduce((sum, record) => sum + Number(record.revenue), 0) || 0;

      // Get team target (sum of all team member targets)
      const { data: targetData, error: targetError } = await supabase
        .from('targets')
        .select('target_value')
        .in('sales_rep_id', teamRepIds);

      if (targetError) {
        console.error('Error fetching target data:', targetError);
        continue;
      }

      const totalTarget = targetData?.reduce((sum, record) => sum + Number(record.target_value), 0) || 1;
      const targetPercentage = totalTarget > 0 ? (totalRevenue / totalTarget) * 100 : 0;

      // Get team deals
      const { data: dealsData, error: dealsError } = await supabase
        .from('deals_current')
        .select('deal_id, deal_stage, max_deal_potential')
        .in('sales_rep_id', teamRepIds);

      if (dealsError) {
        console.error('Error fetching deals data:', dealsError);
        continue;
      }

      const totalDeals = dealsData?.length || 0;
      const closedWonDeals = dealsData?.filter(deal => deal.deal_stage === 'closed_won').length || 0;
      const conversionRate = totalDeals > 0 ? (closedWonDeals / totalDeals) * 100 : 0;
      const avgDealSize = dealsData?.map(deal => Number(deal.max_deal_potential) || 0).filter(val => val > 0).reduce((sum, val) => sum + val, 0) / dealsData.length || 0;

      // Determine momentum based on target performance
      let momentum = 'Stable';
      if (targetPercentage >= 110) momentum = 'Accelerating';
      else if (targetPercentage >= 90) momentum = 'Improving';
      else if (targetPercentage < 70) momentum = 'Declining';

      // Determine risk level
      let riskLevel = 'Medium';
      if (targetPercentage >= 90) riskLevel = 'Low';
      else if (targetPercentage < 60) riskLevel = 'High';

      // Calculate performance score (0-100)
      const performanceScore = Math.min(100, Math.max(0, 
        (targetPercentage * 0.6) + (conversionRate * 0.4)
      ));

      teamMetrics.push({
        team_name: manager.sales_rep_name,
        team_size: allTeamMembers.length,
        revenue: totalRevenue,
        target: totalTarget,
        target_percentage: targetPercentage,
        conversion_rate: conversionRate,
        efficiency: totalDeals > 0 ? totalRevenue / totalDeals : 0,
        momentum,
        risk_level: riskLevel,
        performance_score: performanceScore,
        avg_deal_size: avgDealSize
      });
    }

    console.log(`Processed ${teamMetrics.length} teams`);

    return new Response(JSON.stringify({ 
      success: true, 
      data: teamMetrics 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in team-metrics function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
