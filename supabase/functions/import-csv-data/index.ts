import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImportRequest {
  action: 'import_all' | 'import_table';
  table?: string;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, table }: ImportRequest = await req.json();

    const csvData = {
      sales_reps: await loadCSVData('sales_rep.csv'),
      customers: await loadCSVData('customer.csv'),
      contacts: await loadCSVData('contact.csv'),
      deals_current: await loadCSVData('deal_current_snapshot.csv'),
      targets: await loadCSVData('target.csv'),
      revenue: await loadCSVData('revenue.csv'),
      customer_stage_historical: await loadCSVData('customer_stage_historical.csv'),
      deal_historical: await loadCSVData('deal_historical.csv'),
      events: await loadCSVData('events.csv')
    };

    if (action === 'import_all') {
      // Import in order of dependencies
      const results = {
        sales_reps: await insertData(supabase, 'sales_reps', csvData.sales_reps),
        customers: await insertData(supabase, 'customers', csvData.customers),
        contacts: await insertData(supabase, 'contacts', csvData.contacts),
        deals_current: await insertData(supabase, 'deals_current', csvData.deals_current),
        targets: await insertData(supabase, 'targets', csvData.targets),
        revenue: await insertData(supabase, 'revenue', csvData.revenue),
        customer_stage_historical: await insertData(supabase, 'customer_stage_historical', csvData.customer_stage_historical),
        deal_historical: await insertData(supabase, 'deal_historical', csvData.deal_historical),
        events: await insertData(supabase, 'events', csvData.events)
      };

      return new Response(JSON.stringify({
        success: true,
        message: "All data imported successfully",
        results
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      message: "Invalid action"
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Import error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function loadCSVData(filename: string): Promise<any[]> {
  try {
    const response = await fetch(`https://raw.githubusercontent.com/yourusername/yourrepo/main/data/${filename}`);
    if (!response.ok) {
      // Fallback to local data - you'll need to replace this with actual CSV data
      return getLocalCSVData(filename);
    }
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return getLocalCSVData(filename);
  }
}

function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj: any = {};
    headers.forEach((header, index) => {
      let value = values[index]?.trim();
      
      // Handle different data types
      if (value === '' || value === 'NULL') {
        obj[header] = null;
      } else if (header.includes('date') || header.includes('_dt') || header.includes('_at')) {
        obj[header] = value;
      } else if (header.includes('id') || header.includes('score') || header.includes('value') || header.includes('revenue') || header.includes('potential') || header.includes('propensity')) {
        obj[header] = isNaN(Number(value)) ? value : Number(value);
      } else if (value === '1' || value === '0') {
        obj[header] = value === '1';
      } else {
        obj[header] = value;
      }
    });
    return obj;
  });
}

async function insertData(supabase: any, tableName: string, data: any[]): Promise<any> {
  if (!data || data.length === 0) {
    return { success: true, count: 0 };
  }

  const { data: result, error } = await supabase
    .from(tableName)
    .upsert(data, { onConflict: getTableIdColumn(tableName) });

  if (error) {
    console.error(`Error inserting into ${tableName}:`, error);
    throw error;
  }

  return { success: true, count: data.length };
}

function getTableIdColumn(tableName: string): string {
  const idColumns: { [key: string]: string } = {
    'sales_reps': 'sales_rep_id',
    'customers': 'customer_id',
    'contacts': 'contact_id',
    'deals_current': 'deal_id',
    'targets': 'target_id',
    'revenue': 'revenue_id',
    'customer_stage_historical': 'historical_id',
    'deal_historical': 'historical_id',
    'events': 'event_id'
  };
  return idColumns[tableName] || 'id';
}

function getLocalCSVData(filename: string): any[] {
  // This is a placeholder - in a real implementation, you would embed the CSV data
  // or use a different approach to load the data
  console.log(`Loading local data for ${filename}`);
  return [];
}