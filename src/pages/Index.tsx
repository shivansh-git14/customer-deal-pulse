import { DataImporter } from "@/components/DataImporter";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Sales Data Analytics Platform
            </h1>
            <p className="text-lg text-muted-foreground">
              Convert your CSV sales data into a queryable SQL database
            </p>
          </div>
          <DataImporter />
        </div>
      </div>
    </div>
  );
};

export default Index;
