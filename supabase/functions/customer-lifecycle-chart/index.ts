import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CustomerLifecycleFilters {
  startDate?: string;
  endDate?: string;
  salesManagerId?: number;
}

interface LifecycleStage {
  stage: string;
  customerCount: number;
  totalRevenue: number;
  percentage: number;
}

interface MonthlyLifecycleData {
  month: string;
  stages: LifecycleStage[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting customer lifecycle chart function...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    console.log('Environment check:', { 
      supabaseUrl: supabaseUrl ? 'SET' : 'MISSING',
      supabaseKey: supabaseKey ? 'SET' : 'MISSING'
    });
    
    const supabase = createClient(
      supabaseUrl ?? '',
      supabaseKey ?? ''
    );

    // Parse request body for filters - standardized pattern
    let body;
    try {
      body = await req.json();
      console.log('Request body parsed successfully:', body);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      throw new Error('Invalid JSON in request body');
    }
    
    const { startDate, endDate, salesManagerId } = body;
    console.log('Customer lifecycle chart request with filters:', { startDate, endDate, salesManagerId });

    // Call the SQL function with proper parameters
    console.log('📊 Calling get_customer_lifecycle_chart function...');
    
    const rpcParams = {
      p_start_date: startDate || null,
      p_end_date: endDate || null,
      p_manager_id: salesManagerId || null
    };
    console.log('RPC parameters:', rpcParams);
    
    const { data: chartResult, error: chartError } = await supabase
      .rpc('get_customer_lifecycle_chart', rpcParams);

    if (chartError) {
      console.error('❌ Error calling get_customer_lifecycle_chart function:');
      console.error('Error details:', {
        message: chartError.message,
        details: chartError.details,
        hint: chartError.hint,
        code: chartError.code
      });
      throw new Error(`SQL Function Error: ${chartError.message || chartError}`);
    }
    
    console.log('✅ SQL function call successful');
    console.log('Raw chart result:', chartResult);

    // Normalize response to handle both object and array shapes
    let lifecycleData: MonthlyLifecycleData[] = [];
    if (Array.isArray(chartResult)) {
      lifecycleData = (chartResult as unknown as MonthlyLifecycleData[]) || [];
    } else if (chartResult && typeof chartResult === 'object') {
      // If function returns { success, data }
      if ('success' in chartResult && chartResult.success === false) {
        throw new Error(chartResult.error || 'SQL function returned error');
      }
      // Prefer chartResult.data if present
      lifecycleData = (chartResult as any).data || [];
    } else {
      lifecycleData = [];
    }

    console.log('Customer lifecycle chart data retrieved:', lifecycleData?.length || 0, 'months');

    // Additional validation and logging
    if (lifecycleData.length > 0) {
      console.log('Sample month data:', {
        month: lifecycleData[0].month,
        stageCount: lifecycleData[0].stages?.length || 0,
        firstStage: lifecycleData[0].stages?.[0]?.stage || 'N/A'
      });

      // Validate percentages for the first month (should add up to ~100%)
      if (lifecycleData[0].stages) {
        const totalPercentage = lifecycleData[0].stages.reduce((sum, stage) => sum + (stage.percentage || 0), 0);
        console.log('First month percentage total:', totalPercentage);
      }
    }

    // Get available managers for frontend filter options
    const { data: managersData, error: managersError } = await supabase
      .from('sales_reps')
      .select('sales_rep_id, sales_rep_name')
      .is('sales_rep_manager_id', null)
      .eq('is_active', true);

    if (managersError) {
      console.warn('Could not fetch managers data:', managersError);
    }

    // Get unique lifecycle stages for reference
    const { data: uniqueStagesData, error: stagesError } = await supabase
      .from('customer_stage_historical')
      .select('life_cycle_stage')
      .limit(1000);

    let availableStages: string[] = [];
    if (!stagesError && uniqueStagesData) {
      availableStages = [...new Set(uniqueStagesData.map(s => s.life_cycle_stage))];
      console.log('Available lifecycle stages:', availableStages);
    }

    const response = {
      success: true,
      data: {
        chartData: lifecycleData,
        availableManagers: managersData || [],
        availableStages: availableStages,
        metadata: {
          totalMonths: lifecycleData.length,
          dateRange: {
            startDate: startDate,
            endDate: endDate
          },
          filterApplied: {
            salesManagerId: salesManagerId
          }
        }
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Customer lifecycle chart error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        data: {
          chartData: [],
          availableManagers: [],
          availableStages: [],
          metadata: {
            totalMonths: 0,
            dateRange: { startDate: null, endDate: null },
            filterApplied: { salesManagerId: null }
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
