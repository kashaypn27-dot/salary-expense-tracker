-- =====================================================================
-- Sample data for Salary & Expense Tracker
--
-- IMPORTANT: Passwords must be bcrypt-hashed (the app hashes them on
-- registration). Rather than inserting a fake hash here, first register
-- a demo user through the running app / API:
--
--   POST /api/auth/register
--   { "name": "Demo User", "email": "demo@example.com", "password": "password123" }
--
-- That call creates user id = 1 (on a fresh database). Once that user
-- exists, run the INSERT statements below to populate sample
-- income & expense transactions for it.
-- =====================================================================

USE salary_expense_tracker;

-- ---------------------------------------------------------------------
-- Sample Income (user_id = 1)
-- ---------------------------------------------------------------------
INSERT INTO income (user_id, source, category, amount, description, income_date) VALUES
(1, 'Acme Corp Payroll', 'Salary',     75000.00, 'Monthly salary - July',        '2026-07-01'),
(1, 'Acme Corp Payroll', 'Salary',     75000.00, 'Monthly salary - June',        '2026-06-01'),
(1, 'Acme Corp Payroll', 'Salary',     75000.00, 'Monthly salary - May',         '2026-05-01'),
(1, 'Q2 Performance Bonus', 'Bonus',   15000.00, 'Quarterly performance bonus',  '2026-06-15'),
(1, 'Webflow Project', 'Freelance',    22000.00, 'Freelance website project',    '2026-06-20'),
(1, 'Mutual Fund Payout', 'Investment', 4500.00, 'Dividend payout',              '2026-05-28'),
(1, 'Logo Design Gig', 'Freelance',    8000.00,  'Freelance design work',        '2026-04-10'),
(1, 'Acme Corp Payroll', 'Salary',     73000.00, 'Monthly salary - April',       '2026-04-01');

-- ---------------------------------------------------------------------
-- Sample Expenses (user_id = 1)
-- ---------------------------------------------------------------------
INSERT INTO expenses (user_id, category, amount, description, expense_date) VALUES
(1, 'Rent',     25000.00, 'Monthly apartment rent - July',     '2026-07-02'),
(1, 'Rent',     25000.00, 'Monthly apartment rent - June',     '2026-06-02'),
(1, 'Food',      6500.00, 'Groceries for the month',           '2026-07-03'),
(1, 'Food',      3200.00, 'Dining out with friends',           '2026-07-05'),
(1, 'Travel',    4800.00, 'Cab and metro commute',             '2026-07-06'),
(1, 'Bills',     2100.00, 'Electricity bill',                  '2026-07-04'),
(1, 'Bills',     999.00,  'Internet & mobile recharge',        '2026-07-04'),
(1, 'Shopping',  7600.00, 'New clothes and shoes',              '2026-06-18'),
(1, 'Health',    1500.00, 'Pharmacy and doctor visit',          '2026-06-22'),
(1, 'Entertainment', 1200.00, 'Movie night and streaming subs', '2026-06-25'),
(1, 'Food',      5400.00, 'Groceries for the month - June',    '2026-06-03'),
(1, 'Travel',    12000.00,'Weekend trip',                      '2026-05-15'),
(1, 'Bills',     2050.00, 'Electricity bill - May',            '2026-05-04'),
(1, 'Rent',     25000.00, 'Monthly apartment rent - May',      '2026-05-02'),
(1, 'Other',     3000.00, 'Miscellaneous expense',              '2026-04-20');
