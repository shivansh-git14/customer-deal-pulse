
-- Update all 'yes' values to 'Yes' in the is_high_risk column for consistency
UPDATE deals_current 
SET is_high_risk = 'Yes' 
WHERE is_high_risk = 'yes';
