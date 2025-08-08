
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

    console.log('🔍 Debug: Received filters:', { startDate, endDate, salesManagerId });

    // Call secure PostgreSQL function instead of complex N+1 query logic
    const { data: teamMetrics, error: metricsError } = await supabase.rpc('get_team_metrics', {
      p_start_date: startDate || null,
      p_end_date: endDate || null,
      p_manager_id: salesManagerId || null
    });

    if (metricsError) {
      console.error('Error calling get_team_metrics function:', metricsError);
      throw metricsError;
    }

    console.log(`✅ Debug: Processed ${teamMetrics?.length || 0} teams`);

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
