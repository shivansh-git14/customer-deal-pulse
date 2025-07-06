# Sales RCA Dashboard - Database Schema

This document outlines the database schema for the Sales RCA Dashboard, including table structures, relationships, and key fields.

## Table of Contents
1. [Sales Representatives](#sales-representatives)
2. [Customers](#customers)
3. [Contacts](#contacts)
4. [Deals](#deals)
5. [Revenue](#revenue)
6. [Targets](#targets)
7. [Events](#events)
8. [Relationships](#relationships)

## Sales Representatives

**Table Name:** `sales_reps`

Stores information about sales representatives and their hierarchy.

| Column | Type | Description |
|--------|------|-------------|
| sales_rep_id | SERIAL | Primary key |
| sales_rep_name | VARCHAR(255) | Full name of the sales rep |
| sales_rep_manager_id | INTEGER | References sales_rep_id of the manager (self-referential) |
| hire_date | DATE | Date when the rep was hired |
| termination_date | DATE | Null if still active |
| is_active | BOOLEAN | Whether the rep is currently active |

## Customers

**Table Name:** `customers`

Stores customer information and their current status.

| Column | Type | Description |
|--------|------|-------------|
| customer_id | SERIAL | Primary key |
| customer_name | VARCHAR(255) | Name of the customer |
| industry | VARCHAR(100) | Industry sector |
| region | VARCHAR(100) | Geographic region |
| customer_since | DATE | When the customer was acquired |
| customer_status | VARCHAR(50) | Current status (e.g., Active, Churned) |
| account_owner_id | INTEGER | References sales_reps(sales_rep_id) |

## Contacts

**Table Name:** `contacts`

Stores contact persons at customer organizations.

| Column | Type | Description |
|--------|------|-------------|
| contact_id | SERIAL | Primary key |
| customer_id | INTEGER | References customers(customer_id) |
| contact_name | VARCHAR(255) | Full name |
| email | VARCHAR(255) | Email address |
| phone | VARCHAR(50) | Contact number |
| job_title | VARCHAR(100) | Job position |
| is_primary | BOOLEAN | Whether this is the primary contact |

## Deals

**Table Name:** `deals_current`

Tracks current sales opportunities and their status.

| Column | Type | Description |
|--------|------|-------------|
| deal_id | SERIAL | Primary key |
| customer_id | INTEGER | References customers(customer_id) |
| deal_name | VARCHAR(255) | Name/description of the deal |
| deal_value | DECIMAL(12,2) | Potential deal value |
| deal_stage | VARCHAR(50) | Current stage in sales process |
| expected_close_date | DATE | Projected close date |
| probability_percent | INTEGER | 0-100% likelihood of closing |
| sales_rep_id | INTEGER | References sales_reps(sales_rep_id) |
| is_high_risk | VARCHAR(3) | 'Yes' if deal is at risk |
| risk_reason | TEXT | Description of risk factors |
| last_updated | TIMESTAMP | When the deal was last updated |

## Revenue

**Table Name:** `revenue`

Records all revenue transactions.

| Column | Type | Description |
|--------|------|-------------|
| revenue_id | SERIAL | Primary key |
| participation_dt | DATE | When revenue was recognized |
| customer_id | INTEGER | References customers(customer_id) |
| sales_rep | INTEGER | References sales_reps(sales_rep_id) |
| revenue | DECIMAL(12,2) | Revenue amount |
| revenue_category | VARCHAR(50) | Type of revenue (new/renewal/upsell) |

## Targets

**Table Name:** `targets`

Stores sales targets for representatives.

| Column | Type | Description |
|--------|------|-------------|
| target_id | SERIAL | Primary key |
| sales_rep_id | INTEGER | References sales_reps(sales_rep_id) |
| period_start | DATE | Start of target period |
| period_end | DATE | End of target period |
| target_amount | DECIMAL(12,2) | Revenue target amount |
| target_type | VARCHAR(50) | Type of target (quarterly/annual/etc) |

## Events

**Table Name:** `events`

Tracks sales activities and interactions.

| Column | Type | Description |
|--------|------|-------------|
| event_id | SERIAL | Primary key |
| event_type | VARCHAR(50) | Type of event (call/meeting/email) |
| event_date | TIMESTAMP | When the event occurred |
| sales_rep_id | INTEGER | References sales_reps(sales_rep_id) |
| customer_id | INTEGER | References customers(customer_id) |
| deal_id | INTEGER | References deals_current(deal_id) |
| notes | TEXT | Details about the event |
| outcome | VARCHAR(100) | Result of the interaction |

## Relationships

### Primary Relationships
1. **Sales Reps to Deals**: One-to-Many
   - A sales rep can have multiple deals
   - `sales_reps(sales_rep_id)` → `deals_current(sales_rep_id)`

2. **Customers to Deals**: One-to-Many
   - A customer can have multiple deals
   - `customers(customer_id)` → `deals_current(customer_id)`

3. **Sales Reps to Revenue**: One-to-Many
   - A sales rep can have multiple revenue entries
   - `sales_reps(sales_rep_id)` → `revenue(sales_rep)`

4. **Customers to Revenue**: One-to-Many
   - A customer can have multiple revenue entries
   - `customers(customer_id)` → `revenue(customer_id)`

5. **Sales Reps to Targets**: One-to-Many
   - A sales rep can have multiple targets over time
   - `sales_reps(sales_rep_id)` → `targets(sales_rep_id)`

6. **Customers to Contacts**: One-to-Many
   - A customer can have multiple contacts
   - `customers(customer_id)` → `contacts(customer_id)`

7. **Sales Reps to Events**: One-to-Many
   - A sales rep can have multiple events
   - `sales_reps(sales_rep_id)` → `events(sales_rep_id)`

### Hierarchical Relationships
1. **Sales Rep Self-Reference**
   - A sales rep can be managed by another sales rep (manager)
   - `sales_reps(sales_rep_id)` → `sales_reps(sales_rep_manager_id)`

### Additional Notes
- All tables include `created_at` and `updated_at` timestamps for auditing
- Most tables include soft delete functionality via an `is_deleted` flag
- Foreign key constraints are enforced at the database level
- Indexes are created on frequently queried columns for performance

## Sample Queries

### Get all high-risk deals with customer and rep info
```sql
SELECT 
    d.deal_name,
    d.deal_value,
    d.deal_stage,
    c.customer_name,
    sr.sales_rep_name,
    d.risk_reason
FROM 
    deals_current d
    JOIN customers c ON d.customer_id = c.customer_id
    JOIN sales_reps sr ON d.sales_rep_id = sr.sales_rep_id
WHERE 
    d.is_high_risk = 'Yes';
```

### Get revenue by sales rep for current quarter
```sql
SELECT 
    sr.sales_rep_name,
    SUM(r.revenue) as total_revenue,
    t.target_amount as quarterly_target,
    (SUM(r.revenue) / t.target_amount * 100) as percent_of_target
FROM 
    revenue r
    JOIN sales_reps sr ON r.sales_rep = sr.sales_rep_id
    JOIN targets t ON sr.sales_rep_id = t.sales_rep_id
WHERE 
    r.participation_dt BETWEEN '2023-10-01' AND '2023-12-31'
    AND t.period_start = '2023-10-01' 
    AND t.period_end = '2023-12-31'
GROUP BY 
    sr.sales_rep_name, t.target_amount;
```

### Get customer engagement metrics
```sql
SELECT 
    c.customer_name,
    COUNT(DISTINCT d.deal_id) as active_deals,
    COUNT(DISTINCT e.event_id) as total_engagements,
    MAX(e.event_date) as last_engagement
FROM 
    customers c
    LEFT JOIN deals_current d ON c.customer_id = d.customer_id AND d.deal_stage != 'Closed Won'
    LEFT JOIN events e ON c.customer_id = e.customer_id
GROUP BY 
    c.customer_name
ORDER BY 
    total_engagements DESC;
```

## Schema Evolution

This schema is versioned using Supabase migrations. When making changes:

1. Create a new migration file with a timestamp prefix
2. Include both up and down migrations
3. Test migrations in a development environment before applying to production
4. Document any breaking changes in the migration file

## Performance Considerations

1. **Indexes**: Ensure proper indexes exist for frequently queried columns
2. **Partitioning**: Consider partitioning large tables like `revenue` by date
3. **Materialized Views**: For complex aggregations, consider using materialized views
4. **Row Level Security**: Implement RLS for multi-tenant data access control
