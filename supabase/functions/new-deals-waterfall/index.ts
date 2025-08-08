import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WaterfallStage {
  stage: string;
  dealCount: number;
  totalValue: number;
  conversionRate?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );


    // Parse request body for filters
    const { startDate, endDate, salesManagerId } = req.method === 'POST' ? await req.json() : {};

    console.log('🔍 Debug: Received filters:', { startDate, endDate, salesManagerId });

    // Step 1: Get prospecting deals with filters applied
    let prospectingQuery = supabase
      .from('deal_historical')
      .select('deal_id, activity_date, deal_value, sales_rep_id')
      .eq('deal_stage', 'prospecting')
        .not('deal_stage', 'is', null);

    // Apply date filters to prospecting stage
    if (startDate) {
      prospectingQuery = prospectingQuery.gte('activity_date::date', startDate);
      console.log('📅 Debug: Start date filter:', startDate);
    }
    if (endDate) {
      prospectingQuery = prospectingQuery.lte('activity_date::date', endDate);
      console.log('📅 Debug: End date filter:', endDate);
    }

    // Apply manager filter if needed
    if (salesManagerId) {
      // Get sales reps under this manager first
      const { data: managedReps } = await supabase
        .from('sales_reps')
        .select('sales_rep_id')
        .eq('sales_rep_manager_id', salesManagerId);
      
      const repIds = (managedReps || []).map(rep => rep.sales_rep_id);
      if (repIds.length > 0) {
        prospectingQuery = prospectingQuery.in('sales_rep_id', repIds);
        console.log('👥 Debug: Manager filter applied, rep IDs:', repIds.slice(0, 5));
      } else {
        console.log('⚠️  Debug: No reps found for manager:', salesManagerId);
      }
    }

    const { data: prospectingDeals, error: prospectingError } = await prospectingQuery;

    if (prospectingError) {
      console.error('Error fetching prospecting deals:', prospectingError);
      throw prospectingError;
    }

    console.log('📈 Debug: Prospecting deals found:', prospectingDeals?.length || 0);

    // Handle duplicates in prospecting - keep latest activity_date for each deal_id
    const prospectingDealsMap: { [key: number]: any } = {};
    (prospectingDeals || []).forEach(deal => {
      const key = deal.deal_id;
      if (!prospectingDealsMap[key] || deal.activity_date > prospectingDealsMap[key].activity_date) {
        prospectingDealsMap[key] = deal;
      }
    });
    const filteredProspectingDeals = Object.values(prospectingDealsMap);

    // Step 2: Get deal_ids from filtered prospecting deals
    const filteredDealIds = filteredProspectingDeals.map(deal => deal.deal_id);

    if (filteredDealIds.length === 0) {
      console.log('📊 Debug: No deals found matching filters');
      const emptyWaterfall: WaterfallStage[] = [
        { stage: 'Prospecting', dealCount: 0, totalValue: 0 },
        { stage: 'Qualified', dealCount: 0, totalValue: 0, conversionRate: 0 },
        { stage: 'Negotiation', dealCount: 0, totalValue: 0, conversionRate: 0 },
        { stage: 'Closed won', dealCount: 0, totalValue: 0, conversionRate: 0 }
      ];
      return new Response(JSON.stringify({ success: true, data: emptyWaterfall }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Get current stage for each filtered deal from deals_current table
    const { data: currentDeals, error: currentDealsError } = await supabase
      .from('deals_current')
      .select('deal_id, deal_stage, max_deal_potential')
      .in('deal_id', filteredDealIds);

    if (currentDealsError) {
      console.error('Error fetching current deals:', currentDealsError);
      throw currentDealsError;
    }

    console.log('🎯 Debug: Current deals found:', currentDeals?.length || 0);

    // Step 4: Map each deal to its current stage index
    const stages = ['prospecting', 'qualified', 'negotiation', 'won'];
    const stageOrder: { [key: string]: number } = {
      'prospecting': 0,
      'qualified': 1, 
      'negotiation': 2,
      'won': 3
    };

    const dealCurrentStages: { [dealId: number]: { currentStageIndex: number, dealValue: number } } = {};

    // Map each deal to its current stage and value from deals_current
    (currentDeals || []).forEach(deal => {
      const dealId = deal.deal_id;
      const stageIndex = stageOrder[deal.deal_stage];
      
      if (stageIndex !== undefined) {
        dealCurrentStages[dealId] = {
          currentStageIndex: stageIndex,
          dealValue: deal.max_deal_potential || 0
        };
      }
    });

    console.log('📊 Debug: Deal current stages mapped for', Object.keys(dealCurrentStages).length, 'deals');

    // Step 5: Count deals for each stage (count deal in all stages up to its current stage)
    const waterfallData: WaterfallStage[] = [];
    
    for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
      const stage = stages[stageIndex];
      
      // Count deals that reached at least this stage (currentStageIndex >= stageIndex)
      const dealsInStage = Object.entries(dealCurrentStages)
        .filter(([_, dealInfo]) => dealInfo.currentStageIndex >= stageIndex)
        .map(([dealId, dealInfo]) => ({ dealId: parseInt(dealId), currentStageIndex: dealInfo.currentStageIndex, dealValue: dealInfo.dealValue }));
      
      const dealCount = dealsInStage.length;
      const totalValue = dealsInStage.reduce((sum, deal) => sum + deal.dealValue, 0);
      
      let conversionRate: number | undefined = undefined;
      if (stageIndex > 0) {
        // Previous stage count
        const prevStageCount = Object.values(dealCurrentStages)
          .filter(dealInfo => dealInfo.currentStageIndex >= (stageIndex - 1)).length;
        conversionRate = prevStageCount > 0 ? Math.round((dealCount / prevStageCount) * 100) : 0;
      }

      // Map stage names for display
      const getDisplayName = (stage: string) => {
        switch(stage) {
          case 'won': return 'Closed won';
          default: return stage.charAt(0).toUpperCase() + stage.slice(1).replace('_', ' ');
        }
      };

      waterfallData.push({
        stage: getDisplayName(stage),
        dealCount,
        totalValue,
        conversionRate
      });

      console.log(`📋 Debug: ${stage} - Count: ${dealCount}, Value: ${totalValue}, Conversion: ${conversionRate}%`);
    }

    console.log('✅ Debug: Waterfall calculation completed');


    console.log('Waterfall data processed:', waterfallData);

    return new Response(JSON.stringify({ 
      success: true, 
      data: {
        waterfall: waterfallData,
        stageCounts,
        stageValues,
        totalDeals: dealIds.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {

    console.error('❌ Error in waterfall function:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {

      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
