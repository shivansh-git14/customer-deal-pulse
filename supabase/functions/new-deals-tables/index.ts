import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body for filters - standardized pattern
    const { startDate, endDate, salesManagerId } = req.method === 'POST' ? await req.json() : {};

    console.log('Fetching new deals tables with filters:', { startDate, endDate, salesManagerId });

    // Apply filters to queries if needed
    let topDealsQuery = supabase
      .from('deal_historical')
      .select('deal_id, deal_value, deal_stage')
      .not('deal_stage', 'in.("closed_lost","lost")')
      .order('deal_value', { ascending: false })
      .limit(10);

    let lostOpportunitiesQuery = supabase
      .from('deal_historical')
      .select('deal_id, deal_value, deal_stage')
      .in('deal_stage', ['closed_lost', 'lost'])
      .order('deal_value', { ascending: false });

    // Apply date filters if provided
    if (startDate) {
      topDealsQuery = topDealsQuery.gte('activity_date', startDate);
      lostOpportunitiesQuery = lostOpportunitiesQuery.gte('activity_date', startDate);
    }
    if (endDate) {
      topDealsQuery = topDealsQuery.lte('activity_date', endDate);
      lostOpportunitiesQuery = lostOpportunitiesQuery.lte('activity_date', endDate);
    }

    // Apply manager filter if provided
    if (salesManagerId) {
      // Get sales reps under this manager
      const { data: managedReps } = await supabase
        .from('sales_reps')
        .select('sales_rep_id')
        .eq('sales_rep_manager_id', salesManagerId);
      
      const repIds = (managedReps || []).map(rep => rep.sales_rep_id);
      if (repIds.length > 0) {
        topDealsQuery = topDealsQuery.in('sales_rep_id', repIds);
        lostOpportunitiesQuery = lostOpportunitiesQuery.in('sales_rep_id', repIds);
        console.log('Manager filter applied to tables, rep IDs:', repIds.slice(0, 5));
      }
    }

    // Execute queries
    const { data: topDeals, error: topDealsError } = await topDealsQuery;
    const { data: lostOpportunities, error: lostOpportunitiesError } = await lostOpportunitiesQuery;

    if (topDealsError) {
      console.error('Error fetching top deals:', topDealsError);
      throw topDealsError;
    }
    if (lostOpportunitiesError) {
      console.error('Error fetching lost opportunities:', lostOpportunitiesError);
      throw lostOpportunitiesError;
    }

    console.log('Top deals found:', topDeals?.length || 0);
    console.log('Lost opportunities found:', lostOpportunities?.length || 0);

    return new Response(JSON.stringify({ 
      success: true, 
      data: { topDeals, lostOpportunities } 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in new-deals-tables function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
