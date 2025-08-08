import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetricsResponse {
  leadResponseTime: number;
  conversionRate: number;
  dealCycleLength: number;
  touchpointsPerDeal: number;
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

    console.log('SUPABASE_URL:', Deno.env.get('SUPABASE_URL'));
    console.log('SUPABASE_SERVICE_ROLE_KEY:', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

    // Parse request body for filters
    const { startDate, endDate, salesManagerId } = req.method === 'POST' ? await req.json() : {};

    console.log('🔍 Debug: Received filters:', { startDate, endDate, salesManagerId });

    // 1. Lead Response Time calculation
    // Step 1: Get prospecting deals with filters applied
    let prospectingQuery = supabase
      .from('deal_historical')
      .select('deal_id, activity_date, sales_rep_id, customer_id')
      .eq('deal_stage', 'prospecting');

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
    console.log('📋 Debug: Sample prospecting deals:', prospectingDeals?.slice(0, 3));

    let avgResponseTime = 0;
    let conversionRate = 0;
    let avgProspectingToWonCycle = 0;
    let avgTouchpoints = 0;

    if ((prospectingDeals || []).length > 0) {
      // Step 2: Get qualified deals for matching deal_ids
      
      const prospectingMap = (prospectingDeals || []).reduce((acc: any, deal: any) => {
        const key = deal.deal_id; // Join only on deal_id as per your updated SQL
        acc[key] = {
          activity_date: deal.activity_date,
          sales_rep_id: deal.sales_rep_id
        };
        return acc;
      }, {});

      
      const prospectingDealIds = (prospectingDeals || []).map(deal => deal.deal_id);
      

      const { data: qualifiedDeals, error: qualifiedError } = await supabase
        .from('deal_historical')
        .select('deal_id, activity_date, sales_rep_id')
        .eq('deal_stage', 'qualified')
        .in('deal_id', prospectingDealIds);

      if (qualifiedError) {
        console.error('Error fetching qualified deals:', qualifiedError);
        throw qualifiedError;
      }

      console.log('✅ Debug: Qualified deals found:', qualifiedDeals?.length || 0);
      console.log('📊 Debug: Sample qualified deals:', qualifiedDeals?.slice(0, 3));

      // Step 3: Join and calculate response times (matching your SQL logic)
      
      const qualifiedMap = (qualifiedDeals || []).reduce((acc: any, deal: any) => {
        const key = deal.deal_id;
        if (!acc[key]) acc[key] = [];
        acc[key].push({
          activity_date: deal.activity_date,
          sales_rep_id: deal.sales_rep_id
        });
        return acc;
      }, {});

      // Calculate response times for deals that have both stages
      const responseTimes: number[] = [];
      
      Object.keys(prospectingMap).forEach(dealId => {
        const prospectingDeal = prospectingMap[dealId];
        const qualifiedDeals = qualifiedMap[dealId] || [];
        
        // Find qualified deals for this deal_id
        qualifiedDeals.forEach((qualifiedDeal: any) => {
          const prospectingDate = new Date(prospectingDeal.activity_date);
          const qualifiedDate = new Date(qualifiedDeal.activity_date);
          
          // Calculate days difference
          const timeDiff = (qualifiedDate.getTime() - prospectingDate.getTime()) / (1000 * 60 * 60 * 24);
          
          if (timeDiff >= 0) {
            responseTimes.push(timeDiff);
            console.log(`⏱️  Debug: Deal ${dealId} - ${timeDiff.toFixed(1)} days`);
          }
        });
      });

      console.log('📏 Debug: Valid response times count:', responseTimes.length);
      console.log('🎯 Debug: Sample response times:', responseTimes.slice(0, 5));

      avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0;

      // 2. Conversion Rate calculation
      const { data: wonDeals, error: wonError } = await supabase
          .from('deal_historical')
          .select('deal_id, activity_date')
          .in('deal_stage', ['closed_won', 'won'])
          .in('deal_id', prospectingDealIds);

      if (wonError) {
        console.error('Error fetching won deals:', wonError);
        throw wonError;
      }

      console.log('✅ Debug: won deals found:', wonDeals?.length || 0);
      console.log('📊 Debug: Sample won deals:', wonDeals?.slice(0, 3));
      
      // Create won deals map for efficient lookup
      const wonMap = (wonDeals || []).reduce((acc: any, deal: any) => {
        const key = deal.deal_id;
        if (!acc[key]) acc[key] = [];
        acc[key].push({
          activity_date: deal.activity_date
        });
        return acc;
      }, {});

      // Calculate prospecting to won cycle times
      const prospectingToWonTimes: number[] = [];
      
      Object.keys(prospectingMap).forEach(dealId => {
        const prospectingDeal = prospectingMap[dealId];
        const wonDeals = wonMap[dealId] || [];
        
        // Find won deals for this deal_id
        wonDeals.forEach((wonDeal: any) => {
          const prospectingDate = new Date(prospectingDeal.activity_date);
          const wonDate = new Date(wonDeal.activity_date);
          
          // Calculate days difference
          const cycleDays = (wonDate.getTime() - prospectingDate.getTime()) / (1000 * 60 * 60 * 24);
          
          if (cycleDays >= 0) {
            prospectingToWonTimes.push(cycleDays);
            console.log(`🏆 Debug: Deal ${dealId} cycle - ${cycleDays.toFixed(1)} days`);
          }
        });
      });

      console.log('🏆 Debug: Valid prospecting-to-won cycles:', prospectingToWonTimes.length);
      console.log('📈 Debug: Sample cycle times:', prospectingToWonTimes.slice(0, 5));
        
      const prospectingCount = prospectingDeals?.length || 0;
      const wonCount = wonDeals?.length || 0;
        
      conversionRate = (wonCount / prospectingCount) * 100;
        
        // Calculate average prospecting-to-won cycle time
      avgProspectingToWonCycle = prospectingToWonTimes.length > 0 
          ? prospectingToWonTimes.reduce((a, b) => a + b, 0) / prospectingToWonTimes.length 
          : 0;
        
      // Calculate average touchpoints
      const customerIds = [...new Set(prospectingDeals.map((d: any) => d.customer_id))];

      // 3. Fetch events for those customers
      const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('customer_id, event_id')
      .in('customer_id', customerIds);

      if (eventsError) {
      console.error('Error fetching events:', eventsError);
      throw eventsError;
      }

      // 4. Map deal_id -> unique touchpoint count

      const dealTouchpointsMap: number[] = [];
      
      prospectingDeals.forEach((deal: any) => {
      const customerEvents = events.filter((e: any) => e.customer_id === deal.customer_id);
      const uniqueEventIds = new Set(customerEvents.map((e: any) => e.event_id));
      dealTouchpointsMap.push(uniqueEventIds.size);
      });

      // 5. Calculate average touchpoints
      const totalTouchpoints = dealTouchpointsMap.reduce((sum: number, count: number) => sum + count, 0);
      avgTouchpoints = totalTouchpoints / dealTouchpointsMap.length;

      console.log('Average touchpoints per deal:', avgTouchpoints);
    }
    
    console.log('🎯 Debug: Final avgResponseTime:', avgResponseTime);
    console.log('🎯 Debug: Final conversionRate:', conversionRate);
    console.log('🎯 Debug: Final avgProspectingToWonCycle:', avgProspectingToWonCycle);
    console.log('🎯 Debug: Final avgTouchpoints:', avgTouchpoints);
    
    
    // 4. Touchpoints per Deal calculation
    // const { data: touchpointsData } = await supabase
    //   .from('events')
    //   .select('deal_id')
    //   .not('deal_id', 'is', null);

    // const touchpointsByDeal = touchpointsData?.reduce((acc: any, event: any) => {
    //   acc[event.deal_id] = (acc[event.deal_id] || 0) + 1;
    //   return acc;
    // }, {});

    // const avgTouchpoints = Object.keys(touchpointsByDeal || {}).length > 0
    //   ? (Object.values(touchpointsByDeal || {}) as number[]).reduce((a, b) => a + b, 0) / Object.keys(touchpointsByDeal || {}).length
    //   : 0;

    // 1. Fetch deals in the date range for a given sales_rep_id
    

      


    const metrics: MetricsResponse = {
      leadResponseTime: Math.round(avgResponseTime * 10) / 10,
      conversionRate: Math.round(conversionRate * 10) / 10,
      dealCycleLength: Math.round(avgProspectingToWonCycle),
      touchpointsPerDeal: Math.round(avgTouchpoints)
    };

    return new Response(JSON.stringify({ success: true, data: metrics }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});