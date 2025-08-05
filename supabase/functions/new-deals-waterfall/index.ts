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

    console.log('Fetching waterfall data with filters:', { startDate, endDate, salesManagerId });

    // Build query with filters
    let stageQuery = supabase
    .from('deal_historical')
    .select('deal_id, activity_date, sales_rep_id, customer_id')
    .eq('deal_stage', 'prospecting')
    .not('deal_stage', 'is', null);

    // Apply date filters if provided
    if (startDate) {
      stageQuery = stageQuery.gte('activity_date', startDate);
    }
    if (endDate) {
      stageQuery = stageQuery.lte('activity_date', endDate);
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
        stageQuery = stageQuery.in('sales_rep_id', repIds);
        console.log('Manager filter applied to waterfall, rep IDs:', repIds.slice(0, 5));
      } else {
        console.log('No reps found for manager:', salesManagerId);
      }
    }

    const { data: prospectingDeals, error: stageError } = await stageQuery;

    if (stageError) {
      console.error('Error fetching prospecting deals:', stageError);
      throw stageError;
    }

    console.log('Prospecting deals found:', prospectingDeals?.length || 0);

    // Step 2: For each prospecting deal, find their latest stage
    const dealIds = prospectingDeals?.map(deal => deal.deal_id) || [];
    
    if (dealIds.length === 0) {
      console.log('No prospecting deals found for the date range');
      const stageCounts = {};
      const stageValues = {};
      
      // Return empty waterfall data
      const waterfallStages = [
        'prospecting',
        'qualified', 
        'proposal',
        'negotiation',
        'closed_won',
        'closed_lost'
      ];

      const waterfallData = waterfallStages.map(stage => ({
        stage,
        count: 0,
        value: 0
      }));

      return new Response(JSON.stringify({ 
        success: true, 
        data: {
          waterfall: waterfallData,
          stageCounts,
          stageValues,
          totalDeals: 0
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get latest stage for each deal
    const { data: latestStages, error: latestError } = await supabase
      .from('deal_historical')
      .select('deal_id, deal_stage, deal_value, activity_date')
      .in('deal_id', dealIds)
      .order('activity_date', { ascending: false });

    if (latestError) {
      console.error('Error fetching latest stages:', latestError);
      throw latestError;
    }

    console.log('Latest stage records found:', latestStages?.length || 0);

    // Build funnel: count deals that reached each stage
    const stageCounts = {
      prospecting: dealIds.length, // Start with all prospecting deals
      qualified: 0,
      proposal: 0,
      negotiation: 0,
      closed_won: 0,
      closed_lost: 0
    };
    
    const stageValues = {
      prospecting: 0,
      qualified: 0,
      proposal: 0,
      negotiation: 0,
      closed_won: 0,
      closed_lost: 0
    };

    // Track which deals reached each stage
    const dealsReachedStage = {
      prospecting: new Set(dealIds),
      qualified: new Set(),
      proposal: new Set(),
      negotiation: new Set(),
      closed_won: new Set(),
      closed_lost: new Set()
    };

    // Process all stage records to track progression
    latestStages?.forEach((record: any) => {
      const stage = record.deal_stage === 'won' ? 'closed_won' : 
                    record.deal_stage === 'lost' ? 'closed_lost' : record.deal_stage;
      
      if (dealsReachedStage[stage]) {
        dealsReachedStage[stage].add(record.deal_id);
      }
    });

    // Count deals that reached each stage
    Object.keys(stageCounts).forEach(stage => {
      if (stage !== 'prospecting') {
        stageCounts[stage] = dealsReachedStage[stage].size;
      }
    });

    // Calculate values - get latest value for each deal
    const dealLatestValues = {};
    latestStages?.forEach((record: any) => {
      if (!dealLatestValues[record.deal_id]) {
        dealLatestValues[record.deal_id] = record.deal_value || 0;
      }
    });

    // Sum values for each stage based on deals that reached that stage
    Object.keys(stageValues).forEach(stage => {
      dealsReachedStage[stage].forEach(dealId => {
        stageValues[stage] += dealLatestValues[dealId] || 0;
      });
    });

    console.log('Funnel stage counts:', stageCounts);
    console.log('Deals that reached each stage:', {
      prospecting: dealsReachedStage.prospecting.size,
      qualified: dealsReachedStage.qualified.size,
      proposal: dealsReachedStage.proposal.size,
      negotiation: dealsReachedStage.negotiation.size,
      closed_won: dealsReachedStage.closed_won.size,
      closed_lost: dealsReachedStage.closed_lost.size
    });

    // Standard waterfall stages (customize based on your needs)
    const waterfallStages = [
      'prospecting',
      'qualified',
      'proposal',
      'negotiation',
      'closed_won',
      'closed_lost'
    ];

    const waterfallData = waterfallStages.map(stage => ({
      stage,
      count: stageCounts[stage] || 0,
      value: stageValues[stage] || 0
    }));

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
    console.error('Error in new-deals-waterfall function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
