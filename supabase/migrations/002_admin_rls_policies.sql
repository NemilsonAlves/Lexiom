-- Row Level Security Policies for Admin System

-- Admin Users Policies
CREATE POLICY "Super admins can view all admin users" ON admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() 
            AND is_super_admin = TRUE 
            AND is_active = TRUE
        )
    );

CREATE POLICY "Admins can view their own profile" ON admin_users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Super admins can update admin users" ON admin_users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() 
            AND is_super_admin = TRUE 
            AND is_active = TRUE
        )
    );

-- Legal Modules Policies
CREATE POLICY "Admins can view legal modules" ON legal_modules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() 
            AND is_active = TRUE
        )
    );

CREATE POLICY "Super admins can manage legal modules" ON legal_modules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() 
            AND is_super_admin = TRUE 
            AND is_active = TRUE
        )
    );

-- Subscription Plans Policies
CREATE POLICY "Super admins can manage subscription plans" ON subscription_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() 
            AND is_super_admin = TRUE 
            AND is_active = TRUE
        )
    );

-- Plan Module Permissions Policies
CREATE POLICY "Super admins can manage plan module permissions" ON plan_module_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() 
            AND is_super_admin = TRUE 
            AND is_active = TRUE
        )
    );

-- Roles Policies
CREATE POLICY "Super admins can manage roles" ON roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() 
            AND is_super_admin = TRUE 
            AND is_active = TRUE
        )
    );

-- User Roles Policies
CREATE POLICY "Super admins can manage user roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() 
            AND is_super_admin = TRUE 
            AND is_active = TRUE
        )
    );

-- Legal Templates Policies
CREATE POLICY "Admins can view legal templates" ON legal_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() 
            AND is_active = TRUE
        )
    );

CREATE POLICY "Super admins can manage legal templates" ON legal_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() 
            AND is_super_admin = TRUE 
            AND is_active = TRUE
        )
    );

-- Template Versions Policies
CREATE POLICY "Super admins can manage template versions" ON template_versions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() 
            AND is_super_admin = TRUE 
            AND is_active = TRUE
        )
    );

-- System Settings Policies
CREATE POLICY "Super admins can manage system settings" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() 
            AND is_super_admin = TRUE 
            AND is_active = TRUE
        )
    );

-- Audit Logs Policies
CREATE POLICY "Super admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() 
            AND is_super_admin = TRUE 
            AND is_active = TRUE
        )
    );

CREATE POLICY "Admins can view their own audit logs" ON audit_logs
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Module Analytics Policies
CREATE POLICY "Super admins can manage module analytics" ON module_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() 
            AND is_super_admin = TRUE 
            AND is_active = TRUE
        )
    );

-- Backup History Policies
CREATE POLICY "Super admins can manage backup history" ON backup_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() 
            AND is_super_admin = TRUE 
            AND is_active = TRUE
        )
    );

-- API Keys Policies
CREATE POLICY "Super admins can manage API keys" ON api_keys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() 
            AND is_super_admin = TRUE 
            AND is_active = TRUE
        )
    );

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON admin_users TO anon;
GRANT SELECT, INSERT, UPDATE ON admin_users TO authenticated;
GRANT SELECT ON legal_modules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON legal_modules TO authenticated;
GRANT SELECT ON subscription_plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON subscription_plans TO authenticated;
GRANT SELECT ON plan_module_permissions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON plan_module_permissions TO authenticated;
GRANT SELECT ON roles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON roles TO authenticated;
GRANT SELECT ON user_roles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_roles TO authenticated;
GRANT SELECT ON legal_templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON legal_templates TO authenticated;
GRANT SELECT ON template_versions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON template_versions TO authenticated;
GRANT SELECT ON system_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON system_settings TO authenticated;
GRANT SELECT ON audit_logs TO anon;
GRANT SELECT, INSERT ON audit_logs TO authenticated;
GRANT SELECT ON module_analytics TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON module_analytics TO authenticated;
GRANT SELECT ON backup_history TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON backup_history TO authenticated;
GRANT SELECT ON api_keys TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON api_keys TO authenticated;