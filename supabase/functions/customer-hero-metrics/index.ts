import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CustomerHeroMetricsResponse {
  atRiskRate: number;
  atRiskCustomers: number;
  totalCustomers: number;
  customersWithDmRate: number;
  customersWithDm: number;
  healthEngagementScore: number;
  repeatRevenueRate: number;
  repeatRevenueAmount: number;
  totalRevenueAmount: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🎯 Customer Hero Metrics Edge Function called');
    
    // Parse request body for filters
    const { filters } = await req.json();
    console.log('📊 Filters received:', JSON.stringify(filters));

    // Extract filter parameters
    const startDate = filters?.startDate || null;
    const endDate = filters?.endDate || null;
    const managerId = filters?.salesManagerId || null;

    console.log('🔍 Calling consolidated function: get_customer_hero_metrics');
    console.log('📅 Parameters:', { startDate, endDate, managerId });

    // Call the secure PostgreSQL function
    const { data, error } = await supabase.rpc('get_customer_hero_metrics', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_manager_id: managerId
    });

    if (error) {
      console.error('❌ Database error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('✅ Raw function result:', JSON.stringify(data));

    // The function returns a single row with the metrics
    const metrics = data && data.length > 0 ? data[0] : {
      at_risk_rate: 0,
      at_risk_customers: 0,
      total_customers: 0,
      customers_with_dm_rate: 0,
      customers_with_dm: 0,
      health_engagement_score: 0,
      repeat_revenue_rate: 0,
      repeat_revenue_amount: 0,
      total_revenue_amount: 0
    };

    // Format response for frontend
    const response: CustomerHeroMetricsResponse = {
      atRiskRate: Number(metrics.at_risk_rate || 0),
      atRiskCustomers: Number(metrics.at_risk_customers || 0),
      totalCustomers: Number(metrics.total_customers || 0),
      customersWithDmRate: Number(metrics.customers_with_dm_rate || 0),
      customersWithDm: Number(metrics.customers_with_dm || 0),
      healthEngagementScore: Number(metrics.health_engagement_score || 0),
      repeatRevenueRate: Number(metrics.repeat_revenue_rate || 0),
      repeatRevenueAmount: Number(metrics.repeat_revenue_amount || 0),
      totalRevenueAmount: Number(metrics.total_revenue_amount || 0)
    };

    console.log('📤 Formatted response:', JSON.stringify(response));

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Edge function error:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        atRiskRate: 0,
        atRiskCustomers: 0,
        totalCustomers: 0,
        customersWithDmRate: 0,
        customersWithDm: 0,
        healthEngagementScore: 0,
        repeatRevenueRate: 0,
        repeatRevenueAmount: 0,
        totalRevenueAmount: 0
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
