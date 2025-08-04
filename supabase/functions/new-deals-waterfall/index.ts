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

    // Parse request body for filters (if needed)
    const { filters } = req.method === 'POST' ? await req.json() : {};

    const { data: stageData } = await supabase
      .from('deals_current')
      .select('stage')
      .not('stage', 'is', null);

    const stageCounts = stageData?.reduce((acc: any, deal: any) => {
      acc[deal.stage] = (acc[deal.stage] || 0) + 1;
      return acc;
    }, {});

    const stageOrder = ['prospecting', 'qualified', 'proposal', 'negotiation', 'closed_won'];
    
    const waterfallData = stageOrder.map(stage => ({
      stage: stage.charAt(0).toUpperCase() + stage.slice(1),
      count: stageCounts?.[stage] || 0
    }));

    return new Response(JSON.stringify({ success: true, data: waterfallData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
