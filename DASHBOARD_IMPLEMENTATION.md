# Sales RCA Dashboard - Implementation Details

*Last Updated: July 2025*

## Current Implementation Overview

### Layout Structure
```
+------------------+----------------------------------+
|                  |             Header               |
|                  +----------------------------------+
|                  |  [Filters]                       |
|                  |  -------------------------------  |
|                  |  [Metric 1]  [Metric 2]  [Metric 3] |
|     Sidebar      |  -------------------------------  |
|                  |  [Critical Alerts]               |
|                  |  - Alert 1                       |
|                  |  - Alert 2                       |
|                  |  - ...                           |
+------------------+----------------------------------+
```

### Component Hierarchy
- App
  - Sidebar
  - MainContent
    - Filters
      - DateRangePicker
      - ManagerDropdown
    - MetricsGrid
      - MetricCard (x3)
    - CriticalAlerts
      - AlertItem (multiple)

### Data Flow
1. User interaction triggers filter changes
2. `useDashboard` hook fetches new data via Supabase Edge Function
3. Data is processed and passed to child components
4. UI updates with new data

### Key Files
- `/src/App.tsx` - Main application component
- `/src/components/Overview/OverviewView.tsx` - Main overview page
- `/src/components/Overview/OverviewMetrics.tsx` - Metrics grid
- `/src/components/Overview/CriticalAlerts.tsx` - Alerts section
- `/src/hooks/useDashboard.ts` - Data fetching logic

## Technical Stack
- **Frontend Framework**: React 18 with TypeScript
- **UI Library**: Shadcn UI (built on Radix UI)
- **Styling**: Tailwind CSS
- **State Management**: React Context + Hooks
- **Data Fetching**: Supabase JS Client
- **Charts**: Recharts

## Data Structure
```typescript
interface DashboardData {
  overallRevenue: {
    current: number;
    previous: number;
    trend: 'up' | 'down';
    change: number;
  };
  bestPerformer: {
    name: string;
    value: number;
    metric: string;
  };
  avgDealSize: number;
  criticalAlerts: Array<{
    id: string;
    title: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    date: string;
  }>;
  availableManagers: Array<{
    id: number;
    name: string;
  }>;
}
```

## Known Issues
1. **Accessibility**
   - Missing ARIA labels on interactive elements
   - Incomplete keyboard navigation support
   - Color contrast issues in some components

2. **Performance**
   - Inefficient chart rendering
   - No pagination for alerts list
   - Unoptimized re-renders

3. **Error Handling**
   - Limited error states
   - No loading indicators
   - No retry mechanism for failed requests

## Dependencies
- `@supabase/supabase-js`: ^2.39.0
- `@radix-ui/react-dialog`: ^1.0.5
- `recharts`: ^2.8.0
- `date-fns`: ^2.30.0
- `tailwindcss`: ^3.3.0

## Environment Variables
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development Scripts
- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run lint` - Run linter
- `npm run preview` - Preview production build

## Next Steps
1. Implement accessibility improvements
2. Add loading and error states
3. Optimize performance
4. Add unit tests
5. Implement end-to-end tests
