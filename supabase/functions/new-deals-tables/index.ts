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
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    // Parse request body for filters (if needed)
    const { filters } = req.method === 'POST' ? await req.json() : {};

    // Top Deals
    const { data: topDeals } = await supabase
      .from('deal_current_snapshot')
      .select('deal_id, deal_name, deal_value, stage, probability')
      .not('stage', 'eq', 'closed_lost')
      .order('deal_value', { ascending: false })
      .limit(10);

    // Lost Opportunities
    const { data: lostOpportunities } = await supabase
      .from('deal_current_snapshot')
      .select('deal_id, deal_name, deal_value, stage, lost_reason')
      .eq('stage', 'closed_lost')
      .order('deal_value', { ascending: false })
      .limit(10);

    return new Response(JSON.stringify({ 
      success: true, 
      data: { topDeals, lostOpportunities } 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
