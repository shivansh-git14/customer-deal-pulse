# Backend Infrastructure Documentation

## Overview
This sales dashboard backend is built on Supabase, providing serverless database operations and edge functions for complex data processing.

## Architecture

### Database Schema
The system consists of 8 main tables:

1. **sales_reps** - Sales representatives and team hierarchy
2. **customers** - Customer information and lifecycle stages
3. **deals_current** - Current deal status and potential
4. **revenue** - Revenue transactions
5. **targets** - Sales targets by rep and month
6. **contacts** - Customer contacts and decision makers
7. **events** - Sales activities and interactions
8. **deal_historical** - Historical deal changes

### Edge Functions

#### team-metrics
**Location**: `supabase/functions/team-metrics/`
**Purpose**: Calculate comprehensive team performance metrics

**Input Parameters**:
- `startDate` (optional): Filter revenue from this date
- `endDate` (optional): Filter revenue to this date  
- `salesManagerId` (optional): Filter to specific manager's team

**Processing Logic**:
1. Identifies managers (sales_reps with NULL manager_id)
2. For each manager, finds all team members (including manager)
3. Aggregates revenue, targets, and deal data
4. Calculates derived metrics using existing data only

**Output**: Array of team metrics objects with calculated KPIs

#### dashboard-overview
**Location**: `supabase/functions/dashboard-overview/`
**Purpose**: Aggregate dashboard overview metrics

#### import-csv-data & import-sales-data
**Purpose**: Data import utilities for bulk loading CSV data

## Data Flow

```
CSV Data → Import Functions → Database Tables → Edge Functions → Frontend Dashboard
```

## Security
- Row Level Security (RLS) enabled on all tables
- Public read access for dashboard data
- Edge functions use service role for aggregation queries

## Deployment
- Edge functions auto-deploy with code changes
- Database migrations handled via Supabase CLI
- Environment variables managed in Supabase dashboard

## Monitoring
- Function logs available in Supabase dashboard
- Database analytics via built-in monitoring
- Console logging in edge functions for debugging