-- Insert default super admin user
-- Password: admin123 (hashed with bcrypt)

INSERT INTO admin_users (
    email, 
    password_hash, 
    full_name, 
    role, 
    is_super_admin, 
    is_active,
    created_at,
    updated_at
) VALUES (
    'admin@lexiom.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash of 'admin123'
    'Super Administrador',
    'super_admin',
    true,
    true,
    NOW(),
    NOW()
);

-- Insert audit log for super admin creation
INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    new_values,
    created_at
) VALUES (
    (SELECT id FROM admin_users WHERE email = 'admin@lexiom.com'),
    'admin_created',
    'admin_user',
    (SELECT id FROM admin_users WHERE email = 'admin@lexiom.com'),
    '{"email": "admin@lexiom.com", "role": "super_admin", "full_name": "Super Administrador"}',
    NOW()
);