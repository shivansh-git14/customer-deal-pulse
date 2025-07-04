# Dashboard Metrics Documentation

This document provides detailed information about all metrics displayed on the Sales RCA Dashboard, including their data sources, calculation logic, and associated files for troubleshooting.

## Metric Categories

### 🟢 Revenue Metrics
- Focus on financial performance and revenue generation

### 🔵 Performance Metrics  
- Track individual and team performance against targets

### 🔴 Risk Metrics
- Identify and monitor high-risk deals and potential revenue loss

---

## Detailed Metric Definitions

### Overall Revenue
**Description:** Total revenue generated within the selected time period

**Data Sources:**
- `revenue` table

**Calculation Logic:**
```sql
SUM(revenue.revenue) WHERE participation_dt BETWEEN start_date AND end_date
```

**Associated Files:**
- `supabase/functions/dashboard-overview/index.ts` (revenue calculation logic)
- `src/hooks/useDashboardData.ts` (data fetching and state management)
- `src/components/dashboard/OverviewMetrics.tsx` (metric display and formatting)
- `src/components/dashboard/RevenueChartModal.tsx` (detailed revenue visualization)

**Category:** Revenue

---

### Target Completion %
**Description:** Percentage of revenue target achieved

**Data Sources:**
- `revenue` table
- `targets` table

**Calculation Logic:**
```sql
(Total Revenue / Total Target) × 100
```

**Associated Files:**
- `supabase/functions/dashboard-overview/index.ts` (lines 54-65)
- `src/hooks/useDashboardData.ts` (data fetching)
- `src/components/dashboard/OverviewMetrics.tsx` (display logic)

**Category:** Performance

---

### Best Performer
**Description:** Sales representative with highest % target achievement

**Data Sources:**
- `revenue` table
- `targets` table  
- `sales_reps` table

**Calculation Logic:**
```sql
MAX((Individual Revenue / Individual Target) × 100) by sales_rep
```

**Associated Files:**
- `supabase/functions/dashboard-overview/index.ts` (lines 67-89)
- `src/hooks/useDashboardData.ts` (data fetching)
- `src/components/dashboard/OverviewMetrics.tsx` (display logic)

**Category:** Performance

---

### Average Deal Size
**Description:** Mean revenue value per closed deal

**Data Sources:**
- `revenue` table

**Calculation Logic:**
```sql
AVG(revenue.revenue) for the selected period
```

**Associated Files:**
- `supabase/functions/dashboard-overview/index.ts` (average calculation logic)
- `src/hooks/useDashboardData.ts` (data fetching and state management)
- `src/components/dashboard/OverviewMetrics.tsx` (metric display and formatting)
- `src/components/dashboard/DealSizeChartModal.tsx` (detailed deal size visualization)

**Category:** Revenue

---

### Critical Alerts
**Description:** High-risk deals sorted by potential revenue impact

**Data Sources:**
- `deals_current` table
- `sales_reps` table
- `customers` table

**Calculation Logic:**
```sql
SELECT deals WHERE is_high_risk = 'Yes' ORDER BY max_deal_potential DESC
```

**Associated Files:**
- `supabase/functions/dashboard-overview/index.ts` (lines 99-118)
- `src/hooks/useDashboardData.ts` (data fetching and interface definitions)
- `src/components/dashboard/CriticalAlerts.tsx` (display logic)

**Category:** Risk

---

### Revenue at Risk
**Description:** Maximum potential revenue from high-risk deals

**Data Sources:**
- `deals_current` table

**Calculation Logic:**
```sql
max_deal_potential value for deals marked as high risk
```

**Associated Files:**
- `supabase/functions/dashboard-overview/index.ts` (lines 99-118)
- `src/hooks/useDashboardData.ts` (data fetching)
- `src/components/dashboard/CriticalAlerts.tsx` (display logic)

**Category:** Risk

---

## Team Performance Metrics

### Team Conversion Rate (%)
**Description:** Percentage of deals closed won by team members

**Data Sources:**
- `deals_current` table
- `sales_reps` table (for team hierarchy)

**Calculation Logic:**
```javascript
(closedWonDeals / totalDeals) * 100
// Where closedWonDeals = count of deals with deal_stage = 'closed_won'
// And totalDeals = count of all deals for team members
```

**Associated Files:**
- `supabase/functions/team-metrics/index.ts` (lines 123-125)
- `src/components/dashboard/TeamOverview.tsx` (display logic)

**Category:** Performance

---

### Team Performance Score  
**Description:** Weighted composite score combining multiple team performance factors

**Data Sources:**
- `revenue` table
- `targets` table
- `deals_current` table

**Calculation Logic:**
```javascript
(targetPercentage * 0.4) + (conversionRate * 2) + ((100 - riskRatio * 100) * 0.3)
// Components:
// - Target achievement (40% weight)
// - Conversion rate (high multiplier)
// - Risk mitigation (30% weight)
// Result capped between 0-100
```

**Associated Files:**
- `supabase/functions/team-metrics/index.ts` (lines 144-149)
- `src/components/dashboard/TeamOverview.tsx` (display and color coding)

**Category:** Performance

---

### Team Momentum
**Description:** Performance trend indicator based on target achievement

**Data Sources:**
- `revenue` table
- `targets` table

**Calculation Logic:**
```javascript
// Based on targetPercentage = (totalRevenue / totalTarget) * 100
if (targetPercentage >= 110) return 'Accelerating'
else if (targetPercentage >= 90) return 'Improving'  
else if (targetPercentage >= 70) return 'Stable'
else return 'Declining'
```

**Associated Files:**
- `supabase/functions/team-metrics/index.ts` (lines 132-136)
- `src/components/dashboard/TeamOverview.tsx` (badge styling)

**Category:** Performance

---

### Team Risk Level
**Description:** Assessment of deal portfolio risk based on high-risk deal ratio

**Data Sources:**
- `deals_current` table (is_high_risk field)

**Calculation Logic:**
```javascript
riskRatio = highRiskDeals / totalDeals
// Where highRiskDeals = count of deals with is_high_risk = 'yes'
if (riskRatio > 0.4) return 'High Risk'
else if (riskRatio > 0.2) return 'Medium Risk'  
else return 'Low Risk'
```

**Associated Files:**
- `supabase/functions/team-metrics/index.ts` (lines 138-142)
- `src/components/dashboard/TeamOverview.tsx` (risk badge display)

**Category:** Risk

---

### Team Efficiency
**Description:** Average number of deals managed per team member

**Data Sources:**
- `deals_current` table
- `sales_reps` table (for team size)

**Calculation Logic:**
```javascript
totalDeals / teamMemberIds.length
// Where teamMemberIds includes manager + direct reports
```

**Associated Files:**
- `supabase/functions/team-metrics/index.ts` (lines 152)
- `src/components/dashboard/TeamOverview.tsx` (efficiency display)

**Category:** Performance

---

### Average Deal Size (Team)
**Description:** Mean potential value of team's deal portfolio

**Data Sources:**
- `deals_current` table (max_deal_potential field)

**Calculation Logic:**
```javascript
// Filter out zero/null values, then calculate average
dealValues = deals.map(deal => Number(deal.max_deal_potential) || 0).filter(val => val > 0)
avgDealSize = dealValues.reduce((sum, val) => sum + val, 0) / dealValues.length
```

**Associated Files:**
- `supabase/functions/team-metrics/index.ts` (lines 128-130)
- `src/components/dashboard/TeamOverview.tsx` (currency formatting)

**Category:** Revenue

---

## Filter Application Rules

### Time Period Filter
- **Applied to:** All metrics
- **Logic:** Filters data based on `participation_dt` (revenue table) and date ranges
- **Files:** `supabase/functions/dashboard-overview/index.ts` (throughout query logic)

### Sales Manager Filter  
- **Applied to:** All metrics
- **Logic:** Filters data to show only team members under the selected manager using sales rep hierarchy
- **Files:** `supabase/functions/dashboard-overview/index.ts` (manager filtering logic)

### Best Performer Calculation
- **Method:** Based on % target achievement (revenue/target ratio)
- **Note:** Changed from simple revenue total to percentage-based calculation for fairness

### Critical Alerts Sorting
- **Primary Sort:** High-risk deals first (`is_high_risk = 'Yes'`)
- **Secondary Sort:** By `max_deal_potential` (revenue at risk) in descending order
- **Filters Applied:** Time period and sales manager filters

---

## Database Schema References

### Key Tables Used
- **sales_reps:** Sales representative information and hierarchy
- **revenue:** Revenue transactions and dates
- **targets:** Sales targets by rep and time period
- **deals_current:** Current deal status and risk assessment
- **customers:** Customer information for deal context

### Important Columns
- `is_high_risk`: Text field with values 'Yes'/'No' (standardized to 'Yes')
- `max_deal_potential`: Numeric value representing potential deal revenue
- `participation_propensity`: Deal likelihood (0.0-1.0)
- `sales_rep_manager_id`: Hierarchy reference for filtering

---

## Troubleshooting

### Common Issues
1. **No data showing:** Check time period filters and ensure data exists in selected range
2. **Best performer not updating:** Verify targets table has data for selected period
3. **Critical alerts not filtering:** Confirm `is_high_risk` values are 'Yes' (case-sensitive)

### File Locations for Debugging
- **Dashboard Overview Logic:** `supabase/functions/dashboard-overview/index.ts`
- **Team Metrics Logic:** `supabase/functions/team-metrics/index.ts`
- **Frontend Data Hooks:** `src/hooks/useDashboardData.ts`
- **UI Components:** `src/components/dashboard/` directory
- **Team Overview Component:** `src/components/dashboard/TeamOverview.tsx`
- **Filter Component:** `src/components/dashboard/DateRangeSlider.tsx`  
- **Chart Modals:** `src/components/dashboard/RevenueChartModal.tsx`, `src/components/dashboard/DealSizeChartModal.tsx`
- **Design System:** `src/index.css` (color palette and theme tokens)

### Edge Function Logs
Monitor the following edge functions for query performance and errors in the Supabase dashboard:
- `dashboard-overview` - Overall metrics and KPIs
- `team-metrics` - Team performance calculations and analysis

### Data Validation Rules
- **All calculations use only existing database fields** - no synthetic data
- **Team hierarchy**: Managers identified by NULL manager_id
- **Risk assessment**: Based solely on existing is_high_risk field values  
- **Performance scoring**: Weighted formula using real revenue, target, and deal data
- **Date filtering**: Applied consistently across all metrics using participation_dt