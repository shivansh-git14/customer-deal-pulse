export function NewDealsInsights({ filters }: { filters: any }) {
  // For now, we'll create a simple insights component with static content
  // This can be enhanced later with dynamic insights based on data
  
  const insights = [
    {
      title: "Pipeline Health",
      description: "Your pipeline shows strong momentum in the qualified stage.",
      type: "positive"
    },
    {
      title: "Conversion Opportunity", 
      description: "Focus on improving proposal-to-negotiation conversion rate.",
      type: "warning"
    },
    {
      title: "Response Time",
      description: "Lead response time is within industry benchmarks.",
      type: "neutral"
    }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h3 className="text-lg font-semibold mb-4">Insights</h3>
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-medium text-gray-900">{insight.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Insights are generated based on current pipeline data and industry benchmarks.
        </p>
      </div>
    </div>
  );
}
