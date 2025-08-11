// Ambient Deno declaration for editor TypeScript linting (Supabase Edge runtime provides Deno)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface TopCustomersFilters {
  startDate?: string;
  endDate?: string;
  salesManagerId?: number;
  limit?: number;
  offset?: number;
  // For future extension: allow requesting extra fields
  selectFields?: string[];
}

interface TopCustomerRow {
  rank: number;
  customer_id: number;
  customer_name: string;
  revenue: number;
  metrics: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('VITE_SUPABASE_ANON_KEY') || '';
    const supabaseKey = serviceKey || anonKey;

    console.log('top-customers env check:', {
      supabaseUrl: supabaseUrl ? 'SET' : 'MISSING',
      serviceKey: serviceKey ? 'SET' : 'MISSING',
      anonKey: anonKey ? 'SET' : 'MISSING',
      using: serviceKey ? 'service' : (anonKey ? 'anon' : 'none')
    });

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing Supabase function secrets (SUPABASE_URL and a key). Please set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: TopCustomersFilters = {};
    try {
      body = await req.json();
    } catch (_) {
      // ignore, will use defaults
    }

    const { startDate, endDate, salesManagerId, limit = 10, offset = 0 } = body;

    console.log('Top customers request:', { startDate, endDate, salesManagerId, limit, offset });

    const rpcParams = {
      p_start_date: startDate || null,
      p_end_date: endDate || null,
      p_manager_id: salesManagerId || null,
      p_limit: limit,
      p_offset: offset,
    };

    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('get_top_customers', rpcParams);

    if (rpcError) {
      console.error('Error calling get_top_customers:', {
        message: rpcError.message,
        details: (rpcError as any).details,
        hint: (rpcError as any).hint,
        code: (rpcError as any).code,
      });
      throw new Error(`SQL Function Error: ${rpcError.message || String(rpcError)}`);
    }

    // Normalize return: our SQL returns { success: true, data: [...] }
    let rows: TopCustomerRow[] = [];
    if (rpcResult && typeof rpcResult === 'object' && 'data' in (rpcResult as any)) {
      rows = ((rpcResult as any).data || []) as TopCustomerRow[];
    } else if (Array.isArray(rpcResult)) {
      rows = rpcResult as unknown as TopCustomerRow[];
    } else {
      rows = [];
    }

    const response = {
      success: true,
      data: {
        rows,
        metadata: {
          limit,
          offset,
          dateRange: { startDate: startDate || null, endDate: endDate || null },
          filterApplied: { salesManagerId: salesManagerId || null },
        },
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('top-customers error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    );
  }
});
