# Supabase Migration Sync Troubleshooting Guide

## 🔍 Migration Drift Detection & Resolution

Migration drift occurs when your local schema differs from your remote Supabase database schema. This can happen when:
- Manual changes are made in Supabase Dashboard
- Direct SQL is run on the database
- Migration files get out of sync between environments

## 📋 Systematic Troubleshooting Process

### Step 1: Check Migration Status
```bash
npx supabase migration list
```
**What it shows:** Comparison between local and remote migration versions
- ✅ All migrations match = No drift
- ❌ Missing migrations = Drift detected

### Step 2: Identify Specific Schema Differences
```bash
npx supabase db diff --schema public
```
**What it shows:** Exact SQL differences between local and remote schemas
- Functions that exist remotely but not locally
- Table structure differences
- Missing indexes or constraints

### Step 3: Resolution Options

#### Option A: Pull Remote Changes to Local (Recommended)
```bash
npx supabase db pull
```
**Use when:** Remote has changes you want to keep locally
**Result:** Creates new migration files with remote changes

#### Option B: Push Local Changes to Remote
```bash
npx supabase db push
```
**Use when:** Local has the correct/latest changes
**Result:** Applies local migrations to remote database

#### Option C: Reset and Sync (Nuclear Option - Use Carefully)
```bash
npx supabase db reset --local
npx supabase db push
```
**Use when:** Complete desync, other methods failed
**Warning:** This destroys local database data

## 🚨 Common Migration Drift Scenarios

### Scenario 1: Function Updated in Dashboard
**Symptoms:** Function works in production but differs locally
**Solution:** `npx supabase db pull` to sync remote changes

### Scenario 2: Migration Files Deleted/Modified
**Symptoms:** Migration list shows mismatches
**Solution:** Restore missing files or use `npx supabase migration repair`

### Scenario 3: Manual SQL Changes
**Symptoms:** Schema diff shows unexpected changes
**Solution:** Create new migration to formalize changes

## ⚡ Best Practices to Prevent Drift

### 1. Always Use Migrations
- ✅ Create migration files for all schema changes
- ❌ Avoid manual changes in Supabase Dashboard
- ✅ Use `npx supabase migration new <name>` for changes

### 2. Regular Sync Checks
```bash
# Weekly sync check
npx supabase migration list
npx supabase db diff --schema public
```

### 3. Version Control All Migrations
- ✅ Commit all migration files to git
- ✅ Review migration changes in PRs
- ❌ Never ignore migration files in .gitignore

### 4. Development Workflow
```bash
# Before starting work
npx supabase db pull

# After making changes
npx supabase migration new "describe_your_changes"
# Edit the migration file
npx supabase db push

# Commit changes
git add supabase/migrations/
git commit -m "Add migration: describe_your_changes"
```

## 🔧 Emergency Recovery Commands

### If Migrations Are Completely Broken
```bash
# 1. Backup current local state
npx supabase db dump --file backup.sql

# 2. Reset to clean state
npx supabase db reset

# 3. Pull fresh from remote
npx supabase db pull

# 4. Apply any new local changes manually
```

### If Remote Database Is Wrong
```bash
# 1. Ensure local is correct
npx supabase db reset --local
npx supabase migration up

# 2. Force push to remote
npx supabase db push --confirm
```

## 📊 Monitoring Migration Health

### Daily Checks
```bash
npx supabase migration list | grep -E "(Local|Remote)"
```

### Weekly Deep Check
```bash
npx supabase db diff --schema public > schema-diff.sql
# Review schema-diff.sql for unexpected changes
```

## 🎯 Key Takeaways

1. **Always pull before pushing** to avoid conflicts
2. **Use migration files** for all schema changes
3. **Regular monitoring** prevents major drift issues  
4. **Backup before major operations** to allow rollback
5. **Document all manual changes** in migration comments

---

*Last Updated: 2025-08-09*
*For more help: https://supabase.com/docs/guides/cli/local-development*
