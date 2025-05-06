-- Check if academic_year column exists in courses table, if not add it
ALTER TABLE courses ADD COLUMN IF NOT EXISTS academic_year VARCHAR(255);

-- Update any existing records with null academic_year to current year
UPDATE courses SET academic_year = '2023-2024' WHERE academic_year IS NULL;

-- Add code and description columns to departments if not exist
ALTER TABLE departments ADD COLUMN IF NOT EXISTS code VARCHAR(255);
ALTER TABLE departments ADD COLUMN IF NOT EXISTS description VARCHAR(1024);

-- Populate all existing rows with a unique value for code
UPDATE departments SET code = CONCAT('DEPT_', id) WHERE code IS NULL;

-- Alter the code column to be NOT NULL
ALTER TABLE departments ALTER COLUMN code SET NOT NULL;

-- Add the unique constraint for code if not already present
ALTER TABLE departments ADD CONSTRAINT IF NOT EXISTS UK_l7tivi5261wxdnvo6cct9gg6t UNIQUE (code);

-- Add account expiration columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_expiration_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'ACTIVE';

-- Set initial expiration date for all existing users (30 days from now)
UPDATE users SET account_expiration_date = DATEADD('DAY', 30, CURRENT_TIMESTAMP())
WHERE account_expiration_date IS NULL; 