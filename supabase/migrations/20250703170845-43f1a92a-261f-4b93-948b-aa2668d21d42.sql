-- Restructure sales_reps table to have 5 independent managers with their own teams
-- Current issue: John Smith is the only top manager, Sarah/Michael report to him, Emily/Robert report to Sarah

-- First, let's create 5 independent managers (IDs 1-5) and their teams (IDs 6-25)

-- Step 1: Update existing sales reps to be managers
UPDATE sales_reps SET sales_rep_manager_id = NULL WHERE sales_rep_id IN (1, 2, 3, 4, 5);

-- Step 2: Insert additional sales reps under each manager
-- Manager 1 (John Smith) - Team: IDs 6-9
INSERT INTO sales_reps (sales_rep_id, sales_rep_name, sales_rep_manager_id, hire_date, is_active, created_at, updated_at)
VALUES 
(6, 'Alice Brown', 1, '2023-01-15', true, now(), now()),
(7, 'Bob Wilson', 1, '2023-02-20', true, now(), now()),
(8, 'Carol Davis', 1, '2023-03-10', true, now(), now()),
(9, 'David Lee', 1, '2023-04-05', true, now(), now());

-- Manager 2 (Sarah Johnson) - Team: IDs 10-13  
INSERT INTO sales_reps (sales_rep_id, sales_rep_name, sales_rep_manager_id, hire_date, is_active, created_at, updated_at)
VALUES 
(10, 'Emma Garcia', 2, '2023-01-20', true, now(), now()),
(11, 'Frank Miller', 2, '2023-02-25', true, now(), now()),
(12, 'Grace Taylor', 2, '2023-03-15', true, now(), now()),
(13, 'Henry Clark', 2, '2023-04-10', true, now(), now());

-- Manager 3 (Michael Chen) - Team: IDs 14-17
INSERT INTO sales_reps (sales_rep_id, sales_rep_name, sales_rep_manager_id, hire_date, is_active, created_at, updated_at)
VALUES 
(14, 'Isabel Rodriguez', 3, '2023-01-25', true, now(), now()),
(15, 'Jack Thompson', 3, '2023-02-28', true, now(), now()),
(16, 'Karen White', 3, '2023-03-20', true, now(), now()),
(17, 'Luke Martinez', 3, '2023-04-15', true, now(), now());

-- Manager 4 (Emily Davis) - Team: IDs 18-21
INSERT INTO sales_reps (sales_rep_id, sales_rep_name, sales_rep_manager_id, hire_date, is_active, created_at, updated_at)
VALUES 
(18, 'Monica Jones', 4, '2023-01-30', true, now(), now()),
(19, 'Nathan Anderson', 4, '2023-03-05', true, now(), now()),
(20, 'Olivia Thomas', 4, '2023-03-25', true, now(), now()),
(21, 'Paul Jackson', 4, '2023-04-20', true, now(), now());

-- Manager 5 (Robert Wilson) - Team: IDs 22-25
INSERT INTO sales_reps (sales_rep_id, sales_rep_name, sales_rep_manager_id, hire_date, is_active, created_at, updated_at)
VALUES 
(22, 'Quinn Williams', 5, '2023-02-05', true, now(), now()),
(23, 'Rachel Johnson', 5, '2023-03-10', true, now(), now()),
(24, 'Sam Brown', 5, '2023-03-30', true, now(), now()),
(25, 'Tina Smith', 5, '2023-04-25', true, now(), now());

-- Step 3: Update existing data in other tables to use the new sales reps

-- Update revenue table - reassign some revenue to new sales reps
UPDATE revenue SET sales_rep = 6 WHERE revenue_id = 1; -- Alice Brown under John Smith
UPDATE revenue SET sales_rep = 10 WHERE revenue_id = 2; -- Emma Garcia under Sarah Johnson  
UPDATE revenue SET sales_rep = 14 WHERE revenue_id = 3; -- Isabel Rodriguez under Michael Chen
UPDATE revenue SET sales_rep = 18 WHERE revenue_id = 4; -- Monica Jones under Emily Davis
UPDATE revenue SET sales_rep = 22 WHERE revenue_id = 5; -- Quinn Williams under Robert Wilson

-- Update deals_current table - reassign deals to new sales reps
UPDATE deals_current SET sales_rep_id = 7 WHERE deal_id = 1; -- Bob Wilson under John Smith
UPDATE deals_current SET sales_rep_id = 11 WHERE deal_id = 2; -- Frank Miller under Sarah Johnson
UPDATE deals_current SET sales_rep_id = 15 WHERE deal_id = 3; -- Jack Thompson under Michael Chen
UPDATE deals_current SET sales_rep_id = 19 WHERE deal_id = 4; -- Nathan Anderson under Emily Davis
UPDATE deals_current SET sales_rep_id = 23 WHERE deal_id = 5; -- Rachel Johnson under Robert Wilson

-- Step 4: Add targets for new sales reps
INSERT INTO targets (target_id, sales_rep_id, target_month, target_value, created_at, updated_at)
VALUES 
(6, 6, '2023-01-01', 50000, now(), now()),
(7, 7, '2023-01-01', 45000, now(), now()),
(8, 10, '2023-01-01', 55000, now(), now()),
(9, 11, '2023-01-01', 48000, now(), now()),
(10, 14, '2023-01-01', 52000, now(), now()),
(11, 15, '2023-01-01', 47000, now(), now()),
(12, 18, '2023-01-01', 53000, now(), now()),
(13, 19, '2023-01-01', 49000, now(), now()),
(14, 22, '2023-01-01', 51000, now(), now()),
(15, 23, '2023-01-01', 46000, now(), now());

-- Step 5: Add some deals with different stages to create meaningful conversion rates
INSERT INTO deals_current (deal_id, customer_id, sales_rep_id, deal_stage, created_at, updated_at)
VALUES 
(6, 1, 6, 'won', now(), now()),
(7, 2, 6, 'lost', now(), now()),
(8, 3, 7, 'won', now(), now()),
(9, 1, 10, 'won', now(), now()),
(10, 2, 10, 'won', now(), now()),
(11, 3, 11, 'lost', now(), now()),
(12, 1, 14, 'won', now(), now()),
(13, 2, 15, 'negotiation', now(), now()),
(14, 3, 18, 'won', now(), now()),
(15, 1, 19, 'won', now(), now()),
(16, 2, 19, 'won', now(), now()),
(17, 3, 22, 'lost', now(), now()),
(18, 1, 23, 'won', now(), now());

-- Step 6: Update deal_historical table if needed
INSERT INTO deal_historical (historical_id, deal_id, customer_id, sales_rep_id, activity_date, activity_type, deal_stage, created_at)
VALUES 
(6, 6, 1, 6, '2023-02-01', 'stage_change', 'won', now()),
(7, 7, 2, 6, '2023-02-05', 'stage_change', 'lost', now()),
(8, 8, 3, 7, '2023-02-10', 'stage_change', 'won', now()),
(9, 9, 1, 10, '2023-02-15', 'stage_change', 'won', now()),
(10, 10, 2, 10, '2023-02-20', 'stage_change', 'won', now());