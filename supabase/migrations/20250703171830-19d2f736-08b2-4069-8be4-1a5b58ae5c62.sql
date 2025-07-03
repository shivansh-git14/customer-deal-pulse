-- Add more customers (currently 5, need to reach 100+)
INSERT INTO customers (customer_id, customer_name, customer_industry, customer_lifecycle_stage, decision_maker, assignment_dt, first_participation_date, created_at, updated_at) VALUES
-- Technology Companies
(6, 'TechCorp Solutions', 'Technology', 'prospect', 'CTO', '2023-01-15', '2023-02-01', now(), now()),
(7, 'DataFlow Systems', 'Technology', 'customer', 'CEO', '2023-01-20', '2023-02-10', now(), now()),
(8, 'CloudFirst Inc', 'Technology', 'lead', 'VP Engineering', '2023-01-25', NULL, now(), now()),
(9, 'AI Innovations', 'Technology', 'customer', 'Head of AI', '2023-02-01', '2023-02-15', now(), now()),
(10, 'CyberSecure Pro', 'Technology', 'prospect', 'CISO', '2023-02-05', '2023-03-01', now(), now()),

-- Financial Services
(11, 'FinanceFirst Bank', 'Financial Services', 'customer', 'CFO', '2023-02-10', '2023-02-20', now(), now()),
(12, 'Investment Partners', 'Financial Services', 'lead', 'Portfolio Manager', '2023-02-15', NULL, now(), now()),
(13, 'Credit Solutions Co', 'Financial Services', 'prospect', 'Risk Manager', '2023-02-20', '2023-03-10', now(), now()),
(14, 'Wealth Management LLC', 'Financial Services', 'customer', 'VP Wealth', '2023-02-25', '2023-03-05', now(), now()),
(15, 'Trading Systems Inc', 'Financial Services', 'lead', 'Head of Trading', '2023-03-01', NULL, now(), now()),

-- Healthcare
(16, 'HealthTech Medical', 'Healthcare', 'customer', 'CMO', '2023-03-05', '2023-03-15', now(), now()),
(17, 'Pharma Research Lab', 'Healthcare', 'prospect', 'Research Director', '2023-03-10', '2023-04-01', now(), now()),
(18, 'Hospital Network', 'Healthcare', 'lead', 'CIO', '2023-03-15', NULL, now(), now()),
(19, 'MedDevice Corp', 'Healthcare', 'customer', 'VP Product', '2023-03-20', '2023-03-25', now(), now()),
(20, 'Clinic Management', 'Healthcare', 'prospect', 'Operations Manager', '2023-03-25', '2023-04-10', now(), now()),

-- Manufacturing
(21, 'Auto Parts Inc', 'Manufacturing', 'customer', 'COO', '2023-04-01', '2023-04-15', now(), now()),
(22, 'Steel Works LLC', 'Manufacturing', 'lead', 'Plant Manager', '2023-04-05', NULL, now(), now()),
(23, 'Chemical Solutions', 'Manufacturing', 'prospect', 'VP Operations', '2023-04-10', '2023-05-01', now(), now()),
(24, 'Electronics Mfg', 'Manufacturing', 'customer', 'Head of Production', '2023-04-15', '2023-04-20', now(), now()),
(25, 'Textile Company', 'Manufacturing', 'lead', 'Operations Director', '2023-04-20', NULL, now(), now()),

-- Retail
(26, 'Fashion Forward', 'Retail', 'customer', 'CMO', '2023-04-25', '2023-05-05', now(), now()),
(27, 'Electronics Store', 'Retail', 'prospect', 'VP Retail', '2023-05-01', '2023-05-15', now(), now()),
(28, 'Home Goods Co', 'Retail', 'lead', 'Buyer', '2023-05-05', NULL, now(), now()),
(29, 'Sports Equipment', 'Retail', 'customer', 'Head of Sales', '2023-05-10', '2023-05-20', now(), now()),
(30, 'Grocery Chain', 'Retail', 'prospect', 'Regional Manager', '2023-05-15', '2023-06-01', now(), now()),

-- More customers to reach 100+
(31, 'EduTech Solutions', 'Education', 'customer', 'VP Technology', '2023-05-20', '2023-05-25', now(), now()),
(32, 'University System', 'Education', 'lead', 'CIO', '2023-05-25', NULL, now(), now()),
(33, 'Training Corp', 'Education', 'prospect', 'Director of Learning', '2023-06-01', '2023-06-15', now(), now()),
(34, 'Online Academy', 'Education', 'customer', 'CEO', '2023-06-05', '2023-06-10', now(), now()),
(35, 'Research Institute', 'Education', 'lead', 'Head of Research', '2023-06-10', NULL, now(), now()),

(36, 'Energy Solutions', 'Energy', 'customer', 'VP Operations', '2023-06-15', '2023-06-20', now(), now()),
(37, 'Solar Power Co', 'Energy', 'prospect', 'Project Manager', '2023-06-20', '2023-07-05', now(), now()),
(38, 'Wind Energy LLC', 'Energy', 'lead', 'Engineering Director', '2023-06-25', NULL, now(), now()),
(39, 'Oil & Gas Corp', 'Energy', 'customer', 'Head of Technology', '2023-07-01', '2023-07-10', now(), now()),
(40, 'Utility Company', 'Energy', 'prospect', 'Operations Manager', '2023-07-05', '2023-07-20', now(), now()),

(41, 'Transport Logistics', 'Transportation', 'customer', 'VP Logistics', '2023-07-10', '2023-07-15', now(), now()),
(42, 'Shipping Solutions', 'Transportation', 'lead', 'Fleet Manager', '2023-07-15', NULL, now(), now()),
(43, 'Airlines Inc', 'Transportation', 'prospect', 'Head of Operations', '2023-07-20', '2023-08-05', now(), now()),
(44, 'Railway Systems', 'Transportation', 'customer', 'CTO', '2023-07-25', '2023-08-01', now(), now()),
(45, 'Freight Company', 'Transportation', 'lead', 'Operations Director', '2023-08-01', NULL, now(), now()),

(46, 'Media Group', 'Media', 'customer', 'VP Digital', '2023-08-05', '2023-08-10', now(), now()),
(47, 'Publishing House', 'Media', 'prospect', 'Editorial Director', '2023-08-10', '2023-08-25', now(), now()),
(48, 'Broadcasting Corp', 'Media', 'lead', 'Head of Technology', '2023-08-15', NULL, now(), now()),
(49, 'Streaming Service', 'Media', 'customer', 'CTO', '2023-08-20', '2023-08-25', now(), now()),
(50, 'News Network', 'Media', 'prospect', 'Digital Manager', '2023-08-25', '2023-09-10', now(), now()),

-- Continue with more customers to reach 100+
(51, 'Real Estate Group', 'Real Estate', 'customer', 'VP Development', '2023-09-01', '2023-09-05', now(), now()),
(52, 'Property Management', 'Real Estate', 'lead', 'Operations Manager', '2023-09-05', NULL, now(), now()),
(53, 'Construction Co', 'Real Estate', 'prospect', 'Project Director', '2023-09-10', '2023-09-25', now(), now()),
(54, 'Architecture Firm', 'Real Estate', 'customer', 'Principal Architect', '2023-09-15', '2023-09-20', now(), now()),
(55, 'Development Corp', 'Real Estate', 'lead', 'Head of Development', '2023-09-20', NULL, now(), now()),

(56, 'Legal Services LLC', 'Legal', 'customer', 'Managing Partner', '2023-09-25', '2023-10-01', now(), now()),
(57, 'Law Firm Associates', 'Legal', 'prospect', 'Senior Partner', '2023-10-01', '2023-10-15', now(), now()),
(58, 'Corporate Legal', 'Legal', 'lead', 'General Counsel', '2023-10-05', NULL, now(), now()),
(59, 'Patent Law Group', 'Legal', 'customer', 'IP Director', '2023-10-10', '2023-10-15', now(), now()),
(60, 'Litigation Support', 'Legal', 'prospect', 'Case Manager', '2023-10-15', '2023-11-01', now(), now()),

(61, 'Consulting Group', 'Consulting', 'customer', 'Principal', '2023-10-20', '2023-10-25', now(), now()),
(62, 'Strategy Partners', 'Consulting', 'lead', 'VP Strategy', '2023-10-25', NULL, now(), now()),
(63, 'Business Solutions', 'Consulting', 'prospect', 'Practice Leader', '2023-11-01', '2023-11-15', now(), now()),
(64, 'Tech Consulting', 'Consulting', 'customer', 'CTO', '2023-11-05', '2023-11-10', now(), now()),
(65, 'Change Management', 'Consulting', 'lead', 'Director', '2023-11-10', NULL, now(), now()),

(66, 'Insurance Corp', 'Insurance', 'customer', 'VP Claims', '2023-11-15', '2023-11-20', now(), now()),
(67, 'Life Insurance Co', 'Insurance', 'prospect', 'Underwriting Manager', '2023-11-20', '2023-12-05', now(), now()),
(68, 'Health Insurance', 'Insurance', 'lead', 'VP Product', '2023-11-25', NULL, now(), now()),
(69, 'Auto Insurance', 'Insurance', 'customer', 'Claims Director', '2023-12-01', '2023-12-10', now(), now()),
(70, 'Property Insurance', 'Insurance', 'prospect', 'Risk Manager', '2023-12-05', '2023-12-20', now(), now()),

(71, 'Biotech Research', 'Biotechnology', 'customer', 'Chief Scientist', '2023-12-10', '2023-12-15', now(), now()),
(72, 'Gene Therapy Co', 'Biotechnology', 'lead', 'VP Research', '2023-12-15', NULL, now(), now()),
(73, 'Diagnostic Labs', 'Biotechnology', 'prospect', 'Lab Director', '2023-12-20', '2024-01-05', now(), now()),
(74, 'Clinical Research', 'Biotechnology', 'customer', 'Study Director', '2023-12-25', '2024-01-01', now(), now()),
(75, 'Medical Devices', 'Biotechnology', 'lead', 'Product Manager', '2024-01-01', NULL, now(), now()),

(76, 'Food Processing', 'Food & Beverage', 'customer', 'VP Operations', '2024-01-05', '2024-01-10', now(), now()),
(77, 'Beverage Company', 'Food & Beverage', 'prospect', 'Brand Manager', '2024-01-10', '2024-01-25', now(), now()),
(78, 'Restaurant Chain', 'Food & Beverage', 'lead', 'Operations Director', '2024-01-15', NULL, now(), now()),
(79, 'Catering Services', 'Food & Beverage', 'customer', 'VP Sales', '2024-01-20', '2024-01-25', now(), now()),
(80, 'Organic Foods', 'Food & Beverage', 'prospect', 'Head of Marketing', '2024-01-25', '2024-02-10', now(), now()),

(81, 'Aerospace Corp', 'Aerospace', 'customer', 'VP Engineering', '2024-02-01', '2024-02-05', now(), now()),
(82, 'Defense Systems', 'Aerospace', 'lead', 'Project Manager', '2024-02-05', NULL, now(), now()),
(83, 'Satellite Tech', 'Aerospace', 'prospect', 'CTO', '2024-02-10', '2024-02-25', now(), now()),
(84, 'Aviation Services', 'Aerospace', 'customer', 'Head of Operations', '2024-02-15', '2024-02-20', now(), now()),
(85, 'Space Technology', 'Aerospace', 'lead', 'Chief Engineer', '2024-02-20', NULL, now(), now()),

(86, 'Telecom Solutions', 'Telecommunications', 'customer', 'VP Network', '2024-02-25', '2024-03-01', now(), now()),
(87, 'Mobile Networks', 'Telecommunications', 'prospect', 'Network Director', '2024-03-01', '2024-03-15', now(), now()),
(88, 'Internet Provider', 'Telecommunications', 'lead', 'CTO', '2024-03-05', NULL, now(), now()),
(89, 'Cable Company', 'Telecommunications', 'customer', 'VP Technology', '2024-03-10', '2024-03-15', now(), now()),
(90, 'Wireless Corp', 'Telecommunications', 'prospect', 'Head of Infrastructure', '2024-03-15', '2024-04-01', now(), now()),

(91, 'Gaming Studio', 'Entertainment', 'customer', 'Creative Director', '2024-03-20', '2024-03-25', now(), now()),
(92, 'Entertainment Group', 'Entertainment', 'lead', 'VP Digital', '2024-03-25', NULL, now(), now()),
(93, 'Sports League', 'Entertainment', 'prospect', 'Operations Manager', '2024-04-01', '2024-04-15', now(), now()),
(94, 'Theme Park Corp', 'Entertainment', 'customer', 'VP Operations', '2024-04-05', '2024-04-10', now(), now()),
(95, 'Concert Venues', 'Entertainment', 'lead', 'Venue Manager', '2024-04-10', NULL, now(), now()),

(96, 'Government Agency', 'Government', 'customer', 'Director', '2024-04-15', '2024-04-20', now(), now()),
(97, 'Municipal Services', 'Government', 'prospect', 'City Manager', '2024-04-20', '2024-05-05', now(), now()),
(98, 'Federal Contractor', 'Government', 'lead', 'Program Manager', '2024-04-25', NULL, now(), now()),
(99, 'State Department', 'Government', 'customer', 'Deputy Director', '2024-05-01', '2024-05-05', now(), now()),
(100, 'Public Works', 'Government', 'prospect', 'Operations Chief', '2024-05-05', '2024-05-20', now(), now()),

(101, 'Non-Profit Foundation', 'Non-Profit', 'customer', 'Executive Director', '2024-05-10', '2024-05-15', now(), now()),
(102, 'Charity Organization', 'Non-Profit', 'lead', 'Program Director', '2024-05-15', NULL, now(), now()),
(103, 'Research Foundation', 'Non-Profit', 'prospect', 'VP Research', '2024-05-20', '2024-06-05', now(), now()),
(104, 'Environmental Group', 'Non-Profit', 'customer', 'Conservation Director', '2024-05-25', '2024-06-01', now(), now()),
(105, 'Social Services', 'Non-Profit', 'lead', 'Operations Manager', '2024-06-01', NULL, now(), now());