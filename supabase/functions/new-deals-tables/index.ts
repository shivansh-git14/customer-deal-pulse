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

    console.log('🚀 RUNTIME VERIFICATION: Executing new-deals-tables function with filters:', { startDate, endDate, salesManagerId });
    console.log('🔧 CONSOLIDATED FUNCTIONS: About to call get_top_deals_with_details, get_lost_opportunities_with_details, get_lost_opportunities_total_value');
    console.log('🔍 Debug: Received filters:', { startDate, endDate, salesManagerId });

    // Call secure PostgreSQL functions instead of complex JavaScript logic
    const [topDealsResult, lostOpportunitiesResult, lostTotalValueResult] = await Promise.all([
      supabase.rpc('get_top_deals_with_details', {
        p_start_date: startDate || null,
        p_end_date: endDate || null,
        p_manager_id: salesManagerId || null
      }),
      supabase.rpc('get_lost_opportunities_with_details', {
        p_start_date: startDate || null,
        p_end_date: endDate || null,
        p_manager_id: salesManagerId || null
      }),
      supabase.rpc('get_lost_opportunities_total_value', {
        p_start_date: startDate || null,
        p_end_date: endDate || null,
        p_manager_id: salesManagerId || null
      })
    ]);

    if (topDealsResult.error) {
      console.error('Error calling get_top_deals_with_details function:', topDealsResult.error);
      throw topDealsResult.error;
    }

    if (lostOpportunitiesResult.error) {
      console.error('Error calling get_lost_opportunities_with_details function:', lostOpportunitiesResult.error);
      throw lostOpportunitiesResult.error;
    }

    if (lostTotalValueResult.error) {
      console.error('Error calling get_lost_opportunities_total_value function:', lostTotalValueResult.error);
      throw lostTotalValueResult.error;
    }

    console.log(`✅ Debug: Top deals: ${topDealsResult.data?.length || 0}, Lost: ${lostOpportunitiesResult.data?.length || 0}`);

    const topDeals = topDealsResult.data || [];
    const lostOpportunities = lostOpportunitiesResult.data || [];
    const lostTotalValue = lostTotalValueResult.data?.[0]?.total_value || 0;

    console.log('Top deals found:', topDeals?.length || 0);
    console.log('Lost opportunities found:', lostOpportunities?.length || 0);
    console.log('Lost total value EXTRACTED:', lostTotalValue);
    console.log('Lost total value TYPE:', typeof lostTotalValue);

    return new Response(JSON.stringify({ 
      success: true, 
      data: { topDeals, lostOpportunities, lostTotalValue } 
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
