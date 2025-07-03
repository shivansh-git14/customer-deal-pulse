# Sales RCA Dashboard - Frontend Documentation

This document provides a comprehensive overview of the frontend code architecture for the Sales RCA Dashboard.

## 📁 Project Structure

```
src/
├── components/
│   ├── dashboard/
│   │   ├── DashboardFilters.tsx    # Filter controls for the dashboard
│   │   ├── MetricCard.tsx          # Reusable metric display component
│   │   └── OverviewMetrics.tsx     # Overview page metrics container
│   └── ui/                         # Shadcn UI components
├── hooks/
│   └── useDashboardData.ts         # Custom hook for dashboard data management
├── pages/
│   └── Index.tsx                   # Main dashboard page
└── integrations/
    └── supabase/                   # Supabase client configuration
```

## 🔧 Core Components

### 1. **Index.tsx** - Main Dashboard Page
**Location:** `src/pages/Index.tsx`

The main entry point for the dashboard that orchestrates all components.

**Key Features:**
- State management for dashboard filters
- Error handling with user-friendly alerts
- Loading states with skeleton components
- Responsive layout with gradient background

**Dependencies:**
- `useDashboardData` hook for data fetching
- `DashboardFilters` component for filter controls
- `OverviewMetrics` component for metric display

### 2. **useDashboardData Hook** - Data Management
**Location:** `src/hooks/useDashboardData.ts`

A custom React hook that manages all dashboard data fetching and state.

**Key Features:**
- Automatic data refetching when filters change
- Loading and error state management
- Integration with Supabase edge functions
- TypeScript interfaces for type safety

**Data Flow:**
1. Accepts filters as input parameter
2. Calls the `dashboard-overview` edge function
3. Returns data, loading, and error states
4. Automatically refetches when filters change

**Interface Definitions:**
```typescript
interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  salesManagerId?: number;
}

interface DashboardData {
  overallRevenue: {
    total: number;
    target: number;
    completionPercentage: number;
  };
  bestPerformer: {
    sales_rep_id: number;
    sales_rep_name: string;
    totalDeals: number;
    wonDeals: number;
    conversionRate: number;
  } | null;
  avgDealSize: number;
  availableManagers: Array<{
    sales_rep_id: number;
    sales_rep_name: string;
  }>;
}
```

### 3. **DashboardFilters Component** - Filter Controls
**Location:** `src/components/dashboard/DashboardFilters.tsx`

Provides interactive filter controls for the dashboard.

**Features:**
- Date range picker (start and end dates)
- Sales manager dropdown selection
- Clear filters functionality
- Responsive grid layout
- Lucide React icons for visual enhancement

**Props:**
```typescript
interface DashboardFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
  availableManagers: Array<{
    sales_rep_id: number;
    sales_rep_name: string;
  }>;
}
```

### 4. **MetricCard Component** - Reusable Metric Display
**Location:** `src/components/dashboard/MetricCard.tsx`

A reusable component for displaying key metrics with consistent styling.

**Features:**
- Flexible value formatting (currency, percentages)
- Trend indicators with icons
- Subtitle support for additional context
- Consistent card-based design
- Smart number formatting (K/M suffixes)

**Props:**
```typescript
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  className?: string;
}
```

### 5. **OverviewMetrics Component** - Metrics Container
**Location:** `src/components/dashboard/OverviewMetrics.tsx`

Orchestrates the display of all overview metrics using MetricCard components.

**Features:**
- Three main metrics: Overall Revenue, Best Performer, Average Deal Size
- Smart formatting for currency and percentages
- Dynamic trend calculation based on performance
- Responsive grid layout

**Metrics Displayed:**
1. **Overall Revenue**: Total revenue with target completion percentage
2. **Best Performer**: Top sales rep by conversion rate
3. **Average Deal Size**: Mean value of all closed deals

## 🔄 Data Processing Architecture

### Backend Separation
The frontend is designed to be lightweight with heavy data processing handled by the backend:

**Edge Function:** `supabase/functions/dashboard-overview/index.ts`
- Handles all SQL queries and calculations
- Processes filtering logic
- Calculates complex metrics (conversion rates, averages)
- Returns clean, formatted data to frontend

**Frontend Responsibility:**
- UI rendering and user interactions
- State management for filters
- Data formatting for display
- Loading and error states

## 🎨 Design System

### Component Library
- **Shadcn UI**: For consistent, accessible components
- **Lucide React**: For high-quality icons
- **Tailwind CSS**: For utility-first styling

### Layout Principles
- **Responsive Design**: Mobile-first approach with responsive grids
- **Card-based Layout**: Consistent card components for visual hierarchy
- **Gradient Backgrounds**: Subtle gradients for visual appeal
- **Semantic Colors**: Using design system tokens for theming

### Typography
- **Headings**: Bold, hierarchical typography
- **Body Text**: Muted foreground colors for readability
- **Metrics**: Large, bold numbers for emphasis

## 🔧 State Management

### Filter State
Managed at the top level (Index.tsx) and passed down to child components:
```typescript
const [filters, setFilters] = useState<FiltersType>({});
```

### Data State
Managed by the `useDashboardData` hook with automatic dependency tracking:
```typescript
const { data, loading, error } = useDashboardData(filters);
```

## 🚀 Performance Considerations

### Efficient Data Fetching
- Data processing happens on the backend
- Minimal data transfer between frontend/backend
- Automatic refetching only when filters change

### Loading States
- Skeleton components for smooth loading experience
- Progressive loading of different dashboard sections
- Error boundaries for graceful error handling

### Responsive Design
- CSS Grid for efficient layouts
- Mobile-first responsive breakpoints
- Optimized for various screen sizes

## 🔮 Future Extensibility

### Component Reusability
- `MetricCard` can be reused for additional metrics
- `DashboardFilters` can be extended with more filter types
- Modular architecture allows easy addition of new dashboard pages

### Data Hook Pattern
- `useDashboardData` pattern can be replicated for other dashboard sections
- Easy to add new data sources or endpoints
- Consistent error handling and loading states

### Theming Support
- Built on Tailwind and Shadcn design system
- Easy to customize colors and styling
- Dark/light mode support ready

## 🧪 Development Guidelines

### Adding New Metrics
1. Update the `DashboardData` interface in `useDashboardData.ts`
2. Modify the backend edge function to calculate new metrics
3. Add new metric display in `OverviewMetrics.tsx`
4. Use `MetricCard` component for consistency

### Adding New Filters
1. Update the `DashboardFilters` interface
2. Add new filter control in `DashboardFilters.tsx`
3. Update backend logic to handle new filter
4. Test filter combinations

### Error Handling
- All API calls are wrapped in try-catch blocks
- User-friendly error messages displayed
- Loading states prevent user confusion
- Graceful degradation when data is unavailable

This architecture provides a solid foundation for building a scalable, maintainable sales dashboard with clear separation of concerns and excellent user experience.