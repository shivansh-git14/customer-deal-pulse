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
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    // Parse request body for filters (if needed)
    const { filters } = req.method === 'POST' ? await req.json() : {};

    // 1. Lead Response Time calculation
    const { data: leadResponseData } = await supabase
      .from('events')
      .select('deal_id, event_date, event_type')
      .in('event_type', ['prospecting', 'qualified'])
      .order('event_date');

    const responseTimeByDeal = leadResponseData?.reduce((acc: any, event: any) => {
      if (!acc[event.deal_id]) acc[event.deal_id] = {};
      acc[event.deal_id][event.event_type] = new Date(event.event_date);
      return acc;
    }, {});

    const responseTimes = Object.values(responseTimeByDeal || {})
      .filter((deal: any) => deal.prospecting && deal.qualified)
      .map((deal: any) => (deal.qualified - deal.prospecting) / (1000 * 60 * 60 * 24));
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    // 2. Conversion Rate calculation
    const { data: conversionData } = await supabase
      .from('deal_historical')
      .select('deal_id, stage');

    const prospectingDeals = conversionData?.filter(d => d.stage === 'prospecting').length || 0;
    const closedWonDeals = conversionData?.filter(d => d.stage === 'closed_won').length || 0;
    const conversionRate = prospectingDeals > 0 ? (closedWonDeals / prospectingDeals) * 100 : 0;

    // 3. Deal Cycle Length calculation
    const { data: cycleData } = await supabase
      .from('deal_historical')
      .select('deal_id, stage, stage_change_date')
      .in('stage', ['prospecting', 'closed_won'])
      .order('stage_change_date');

    const cycleLengthByDeal = cycleData?.reduce((acc: any, record: any) => {
      if (!acc[record.deal_id]) acc[record.deal_id] = {};
      acc[record.deal_id][record.stage] = new Date(record.stage_change_date);
      return acc;
    }, {});

    const cycleLengths = Object.values(cycleLengthByDeal || {})
      .filter((deal: any) => deal.prospecting && deal.closed_won)
      .map((deal: any) => (deal.closed_won - deal.prospecting) / (1000 * 60 * 60 * 24));
    
    const avgCycleLength = cycleLengths.length > 0
      ? cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length
      : 0;

    // 4. Touchpoints per Deal calculation
    const { data: touchpointsData } = await supabase
      .from('events')
      .select('deal_id')
      .not('deal_id', 'is', null);

    const touchpointsByDeal = touchpointsData?.reduce((acc: any, event: any) => {
      acc[event.deal_id] = (acc[event.deal_id] || 0) + 1;
      return acc;
    }, {});

    const avgTouchpoints = Object.keys(touchpointsByDeal || {}).length > 0
      ? (Object.values(touchpointsByDeal || {}) as number[]).reduce((a, b) => a + b, 0) / Object.keys(touchpointsByDeal || {}).length
      : 0;

    const metrics: MetricsResponse = {
      leadResponseTime: Math.round(avgResponseTime * 10) / 10,
      conversionRate: Math.round(conversionRate * 10) / 10,
      dealCycleLength: Math.round(avgCycleLength),
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