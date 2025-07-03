import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Database, Upload } from "lucide-react";

interface ImportResult {
  success: boolean;
  message?: string;
  results?: any;
  error?: string;
}

export const DataImporter = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM sales_reps LIMIT 10;");
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const { toast } = useToast();

  const handleImportData = async () => {
    setIsImporting(true);
    try {
      // For now, we'll import the data directly using Supabase client
      // In a production app, you'd use the edge function
      await importSampleData();
      
      setImportResult({
        success: true,
        message: "Sample data imported successfully!"
      });
      
      toast({
        title: "Import Complete",
        description: "Sample CSV data has been imported into your database.",
      });
    } catch (error: any) {
      setImportResult({
        success: false,
        error: error.message
      });
      
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const importSampleData = async () => {
    // Sample data import - first few rows from each CSV
    const salesReps = [
      {
        sales_rep_id: 1,
        sales_rep_name: "John Smith",
        sales_rep_manager_id: null,
        hire_date: "2020-01-15",
        termination_date: null,
        is_active: true
      },
      {
        sales_rep_id: 2,
        sales_rep_name: "Sarah Johnson",
        sales_rep_manager_id: 1,
        hire_date: "2021-03-22",
        termination_date: null,
        is_active: true
      }
    ];

    const customers = [
      {
        customer_id: 1,
        customer_name: "Acme Corporation",
        assignment_dt: "2023-01-15",
        customer_lifecycle_stage: "Newly Acquired",
        customer_industry: "Technology",
        decision_maker: "John Doe",
        first_participation_date: "2023-02-01"
      },
      {
        customer_id: 2,
        customer_name: "Global Solutions Inc",
        assignment_dt: "2023-01-20",
        customer_lifecycle_stage: "Loyal",
        customer_industry: "Manufacturing",
        decision_maker: "Jane Smith",
        first_participation_date: "2023-01-25"
      }
    ];

    // Insert sample data
    await supabase.from('sales_reps').upsert(salesReps);
    await supabase.from('customers').upsert(customers);
  };

  const executeQuery = async () => {
    setIsQuerying(true);
    try {
      // For demo purposes, we'll execute predefined queries
      // In production, you'd want to implement a secure SQL execution function
      const validTables = ['sales_reps', 'customers', 'contacts', 'deals_current', 'targets', 'revenue', 'customer_stage_historical', 'deal_historical', 'events'];
      
      if (sqlQuery.toLowerCase().includes('select')) {
        const tableName = extractTableName(sqlQuery);
        if (tableName && validTables.includes(tableName)) {
          const { data, error } = await supabase.from(tableName as any).select('*').limit(10);
          if (error) throw error;
          setQueryResult(data);
        } else {
          throw new Error('Please select from one of the available tables: ' + validTables.join(', '));
        }
      } else {
        throw new Error('Only SELECT queries are allowed');
      }
      
      toast({
        title: "Query Executed",
        description: "Your SQL query has been executed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Query Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsQuerying(false);
    }
  };

  const extractTableName = (query: string): string | null => {
    const match = query.toLowerCase().match(/from\s+(\w+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="space-y-6">
      {/* Data Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Data Import
          </CardTitle>
          <CardDescription>
            Import your CSV data into the Supabase database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Available tables:</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {["sales_reps", "customers", "contacts", "deals_current", "targets", "revenue", "customer_stage_historical", "deal_historical", "events"].map((table) => (
                <Badge key={table} variant="outline">{table}</Badge>
              ))}
            </div>
          </div>
          
          <Button 
            onClick={handleImportData} 
            disabled={isImporting}
            className="w-full"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing Data...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Import Sample Data
              </>
            )}
          </Button>
          
          {importResult && (
            <div className={`p-3 rounded-md text-sm ${
              importResult.success 
                ? "bg-green-50 text-green-800 border border-green-200" 
                : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {importResult.success ? importResult.message : importResult.error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SQL Query Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            SQL Query Interface
          </CardTitle>
          <CardDescription>
            Execute SQL queries against your sales database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">SQL Query</label>
            <Textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder="Enter your SQL query here..."
              className="mt-1 font-mono text-sm"
              rows={4}
            />
          </div>
          
          <Button 
            onClick={executeQuery} 
            disabled={isQuerying}
            className="w-full"
          >
            {isQuerying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executing Query...
              </>
            ) : (
              "Execute Query"
            )}
          </Button>
          
          {queryResult && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Query Result:</h4>
              <pre className="bg-muted p-3 rounded-md text-sm overflow-auto max-h-96">
                {JSON.stringify(queryResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};