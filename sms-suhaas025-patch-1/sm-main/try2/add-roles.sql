-- SQL script to manually add multiple roles to a user
-- Replace the values below with your actual user ID and role IDs

-- Variables
SET @user_id = 44; -- Your user ID

-- Get role IDs from the roles table
-- Adjust these queries based on your actual role names in the database
SET @admin_role_id = (SELECT id FROM roles WHERE name = 'ROLE_ADMIN');
SET @moderator_role_id = (SELECT id FROM roles WHERE name = 'ROLE_MODERATOR');  
SET @user_role_id = (SELECT id FROM roles WHERE name = 'ROLE_USER');

-- Print the role IDs for verification
SELECT 'Role IDs to be added:' AS message;
SELECT @admin_role_id AS admin_role_id, @moderator_role_id AS moderator_role_id, @user_role_id AS user_role_id;

-- First check if roles already exist for this user
SELECT 'Current user roles:' AS message;
SELECT ur.user_id, ur.role_id, r.name AS role_name
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = @user_id;

-- Remove any existing roles for this user to avoid duplicates
DELETE FROM user_roles WHERE user_id = @user_id;

-- Insert new roles for the user
INSERT INTO user_roles (user_id, role_id) VALUES (@user_id, @admin_role_id);
INSERT INTO user_roles (user_id, role_id) VALUES (@user_id, @moderator_role_id);
INSERT INTO user_roles (user_id, role_id) VALUES (@user_id, @user_role_id);

-- Verify the new roles
SELECT 'Updated user roles:' AS message;
SELECT ur.user_id, ur.role_id, r.name AS role_name
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = @user_id; 