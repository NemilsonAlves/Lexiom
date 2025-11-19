-- Update super admin password with correct bcrypt hash
-- Password: admin123

UPDATE admin_users 
SET password_hash = '$2a$10$WSGstuwgimzRah0aBPBOPec6KLyLmP96hg5fznSp6J/zZz2thcJVm',
    updated_at = NOW()
WHERE email = 'admin@lexiom.com';

-- Insert audit log for password update
INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    new_values,
    created_at
) VALUES (
    (SELECT id FROM admin_users WHERE email = 'admin@lexiom.com'),
    'password_updated',
    'admin_user',
    (SELECT id FROM admin_users WHERE email = 'admin@lexiom.com'),
    '{"action": "password_reset_by_system"}',
    NOW()
);