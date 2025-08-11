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
    )

    console.log('🐛 Debug Customer Data Function called');
    
    // Parse request body for filters
    const { filters } = await req.json();
    console.log('📊 Filters received:', JSON.stringify(filters));

    // Extract filter parameters
    const startDate = filters?.startDate || null;
    const endDate = filters?.endDate || null;
    const managerId = filters?.salesManagerId || null;

    console.log('🔍 Calling debug function: debug_customer_hero_data');
    console.log('📅 Parameters:', { startDate, endDate, managerId });

    // Call the debug PostgreSQL function
    const { data, error } = await supabase.rpc('debug_customer_hero_data', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_manager_id: managerId
    });

    if (error) {
      console.error('❌ Database error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('✅ Debug data result:', JSON.stringify(data, null, 2));

    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Debug function error:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
