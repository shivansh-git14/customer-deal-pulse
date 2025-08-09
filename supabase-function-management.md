# Supabase Function Management - Single Source of Truth

## 🎯 Problem: Function Version Sprawl

**Common Issues:**
- Same function defined in multiple migration files
- Minor variations causing confusion
- Unclear which version is "current"
- Deployment order dependencies
- Debugging difficulties

## ✅ Solution: Single Source of Truth Strategy

### Approach 1: Canonical Migration Files (Recommended)

**Structure:**
```
supabase/migrations/
├── 20250805172018_initial_schema.sql         # Tables, indexes, policies
├── 20250808135434_core_functions.sql         # ALL business logic functions
├── 20250809133406_schema_updates.sql         # Schema changes only
└── 20250810XXXXXX_function_updates.sql       # Future function changes
```

**Benefits:**
- ✅ Each function has ONE definitive location
- ✅ Easy to find and update functions
- ✅ Clear separation of concerns
- ✅ Reduced deployment conflicts

### Approach 2: Function-Specific Files

**Structure:**
```
supabase/migrations/
├── 20250808135434_metrics_functions.sql      # get_deal_metrics, get_team_metrics
├── 20250808135435_table_functions.sql        # get_top_deals_*, get_lost_opportunities_*
├── 20250808135436_chart_functions.sql        # get_customer_lifecycle_chart
└── 20250808135437_utility_functions.sql      # Helper functions
```

**Benefits:**
- ✅ Logical grouping by purpose
- ✅ Easier to track related changes
- ✅ Parallel development possible

## 🔧 Implementation Strategy

### Step 1: Function Audit
```sql
-- List all functions in your database
SELECT 
    schemaname,
    functionname,
    definition
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.prokind = 'f'
ORDER BY functionname;
```

### Step 2: Migration Consolidation

**Option A: Create Master Function Migration**
```bash
# Create new comprehensive migration
npx supabase migration new "consolidate_all_functions"

# Move all function definitions to this file
# Remove function definitions from other migrations
```

**Option B: Use Latest Versions Only**
```bash
# Keep only the most recent version of each function
# Comment out older versions in previous migrations
```

### Step 3: Function Documentation Template
```sql
-- Function: get_example_function
-- Purpose: Brief description of what this function does
-- Parameters: 
--   - p_start_date: Filter start date (optional)
--   - p_end_date: Filter end date (optional)
-- Returns: JSON with structured data
-- Last Updated: 2025-08-09
-- Dependencies: tables A, B, C

CREATE OR REPLACE FUNCTION get_example_function(
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL
)
RETURNS TABLE (
    id integer,
    value numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Function logic here
END;
$$;
```

## 📋 Maintenance Workflow

### When Updating Functions:

1. **Always use CREATE OR REPLACE FUNCTION**
   ```sql
   CREATE OR REPLACE FUNCTION function_name() -- ✅ Good
   CREATE FUNCTION function_name()            -- ❌ Bad
   ```

2. **Update in canonical location only**
   ```bash
   # Find the function's canonical file
   grep -r "function_name" supabase/migrations/
   
   # Edit only the canonical file
   # DO NOT create new migrations for minor changes
   ```

3. **Version control strategy**
   ```sql
   -- Add version comments
   -- Version: 2.1
   -- Changes: Added new parameter p_filter
   CREATE OR REPLACE FUNCTION my_function(...)
   ```

## 🚨 Anti-Patterns to Avoid

### ❌ DON'T: Duplicate Function Definitions
```sql
-- Migration 1
CREATE OR REPLACE FUNCTION get_data() RETURNS TABLE...

-- Migration 2  
CREATE OR REPLACE FUNCTION get_data() RETURNS TABLE... -- ❌ Duplicate!
```

### ❌ DON'T: Minor Variations
```sql
-- Don't create get_data_v1, get_data_v2, get_data_final
-- Use CREATE OR REPLACE instead
```

### ❌ DON'T: Manual Dashboard Edits
```sql
-- Don't edit functions in Supabase Dashboard
-- Always use migration files
```

## ✅ Best Practices

### 1. Function Naming Convention
```sql
-- Use consistent prefixes
get_*     -- Data retrieval functions
calc_*    -- Calculation functions
proc_*    -- Processing functions
util_*    -- Utility functions
```

### 2. Parameter Consistency
```sql
-- Use consistent parameter patterns
p_start_date date DEFAULT NULL
p_end_date date DEFAULT NULL  
p_manager_id integer DEFAULT NULL
```

### 3. Return Type Standards
```sql
-- Consistent return patterns
RETURNS TABLE (...)              -- For data sets
RETURNS JSON                     -- For complex structures
RETURNS numeric                  -- For single values
```

### 4. Security Standards
```sql
-- Always include security context
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with creator privileges
```

## 🔍 Function Audit Checklist

- [ ] All functions have clear, single definitions
- [ ] No duplicate function names across migrations
- [ ] All functions follow naming conventions
- [ ] Parameter patterns are consistent
- [ ] Return types are standardized
- [ ] Security settings are appropriate
- [ ] Dependencies are documented
- [ ] Version history is tracked

## 🚀 Next Steps for Your Codebase

1. **Audit existing functions** (see commands above)
2. **Identify duplicates** across migration files
3. **Choose consolidation strategy** (canonical file vs grouped files)
4. **Create consolidated migration** with latest versions
5. **Remove/comment old versions** in previous migrations
6. **Document all functions** with standard template
7. **Establish update workflow** for future changes

---

## 🔍 Function Verification & Monitoring

### Method 1: Database Query (Most Accurate)
**Check what functions actually exist in your cloud database:**

```sql
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
AND routine_name IN (
    'get_deal_metrics',
    'get_team_metrics', 
    'get_top_deals_with_details',
    'get_lost_opportunities_with_details',
    'get_lost_opportunities_total_value',
    'get_customer_lifecycle_chart'
)
ORDER BY routine_name;
```

**Run this in:** Supabase Dashboard → SQL Editor

### Method 2: Check Consolidated Files (Source of Truth)
Since functions are consolidated, the **current logic** is exactly what's in:
- **Metrics:** `20250809140632_metrics_functions_consolidated.sql`
- **Tables:** `20250809141053_table_functions_consolidated.sql`  
- **Charts:** `20250809141318_chart_functions_consolidated.sql`

### Method 3: Runtime Verification
Edge functions have logging that shows which functions are called:
- Check browser DevTools → Network tab
- Review edge function logs in Supabase Dashboard
- Monitor console.log outputs during dashboard usage

## 🔧 Function Change Management

### ✅ CORRECT: Create New Migration
**To modify ANY existing function:**

```bash
# 1. Create new migration
npx supabase migration new update_function_name

# 2. In the new migration file, use CREATE OR REPLACE
CREATE OR REPLACE FUNCTION get_deal_metrics(
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL,
    p_manager_id integer DEFAULT NULL
    -- Add new parameters here if needed
)
RETURNS TABLE (
    -- Updated return structure
    leadresponsetime numeric,
    conversionrate numeric,
    dealcyclelength numeric,
    touchpointsperdeal numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Updated function logic here
    RETURN QUERY
    -- New implementation
END;
$$;

# 3. Deploy the change
npx supabase db push
```

### ❌ INCORRECT: Edit Old Migration Files
**Never do this:**
- ❌ Don't edit previously applied migration files
- ❌ Don't expect local file changes to sync to cloud
- ❌ Don't manually edit functions in Supabase Dashboard

### 🎯 Why This Approach Works
- ✅ **Version Control:** Every change is tracked
- ✅ **Rollback Capability:** Can revert if needed  
- ✅ **Team Sync:** Everyone gets the same changes
- ✅ **Production Safety:** No manual edits in cloud
- ✅ **Migration History:** Clear timeline of changes

### 🚨 Key Understanding: Migration Files ≠ Database Storage
**Critical Concept:**
- Migration files are **"execute once" instructions**
- They are NOT synchronized storage files
- Local file edits don't affect cloud database
- Only NEW migrations change the database state
- File content differences after initial application are **normal**

---

*Remember: Database functions are code - treat them with the same discipline as your application code!*
