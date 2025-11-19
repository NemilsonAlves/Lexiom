-- Initial data for admin system

-- Insert default legal modules
INSERT INTO legal_modules (name, description, identifier, category, is_core, config) VALUES
('Processos Jurídicos', 'Gestão completa de processos judiciais', 'processos', 'core', true, '{"features": ["case_management", "hearing_scheduling", "document_tracking"]}'),
('Documentos', 'Gerenciamento de documentos jurídicos', 'documentos', 'core', true, '{"features": ["document_creation", "version_control", "digital_signature"]}'),
('Clientes', 'Cadastro e gestão de clientes', 'clientes', 'core', true, '{"features": ["client_management", "contact_history", "case_association"]}'),
('Agenda', 'Sistema de agenda e compromissos', 'agenda', 'core', true, '{"features": ["calendar_integration", "reminder_system", "availability_check"]}'),
('Kanban', 'Quadro de tarefas visual', 'kanban', 'productivity', false, '{"features": ["task_management", "drag_drop", "collaboration"]}'),
('IA Jurídica', 'Assistente de inteligência artificial', 'ia_legal', 'ai', false, '{"features": ["legal_research", "document_analysis", "case_strategy"]}'),
('Templates', 'Modelos de documentos jurídicos', 'templates', 'documents', false, '{"features": ["template_library", "custom_templates", "approval_workflow"]}'),
('Analytics', 'Dashboard de métricas e relatórios', 'analytics', 'reporting', false, '{"features": ["performance_metrics", "usage_analytics", "custom_reports"]}'),
('Integrações', 'Integração com sistemas externos', 'integrations', 'technical', false, '{"features": ["api_management", "webhook_support", "third_party_connectors"]}'),
('Compliance', 'Gestão de conformidade e auditoria', 'compliance', 'security', false, '{"features": ["audit_logs", "compliance_reports", "risk_management"]}');

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, identifier, price_monthly, price_yearly, max_users, max_storage_gb, features) VALUES
('Básico', 'Plano ideal para advogados individuais', 'basic', 99.90, 999.90, 1, 10, '{"modules": ["processos", "documentos", "clientes", "agenda"], "support": "email", "backup_daily": true}'),
('Profissional', 'Plano para pequenos escritórios', 'professional', 299.90, 2999.90, 5, 50, '{"modules": ["processos", "documentos", "clientes", "agenda", "kanban", "templates"], "support": "email_chat", "backup_hourly": true, "api_access": true}'),
('Empresarial', 'Plano para grandes escritórios', 'enterprise', 599.90, 5999.90, 20, 200, '{"modules": ["processos", "documentos", "clientes", "agenda", "kanban", "templates", "ia_legal", "analytics"], "support": "priority", "backup_realtime": true, "api_access": true, "custom_integrations": true}'),
('Corporate', 'Plano corporativo completo', 'corporate', 999.90, 9999.90, 100, 1000, '{"modules": ["processos", "documentos", "clientes", "agenda", "kanban", "templates", "ia_legal", "analytics", "integrations", "compliance"], "support": "dedicated", "backup_realtime": true, "api_access": true, "custom_integrations": true, "white_label": true}');

-- Insert plan module permissions
INSERT INTO plan_module_permissions (plan_id, module_id, is_enabled, usage_limits)
SELECT 
    sp.id as plan_id,
    lm.id as module_id,
    CASE 
        WHEN sp.identifier = 'basic' AND lm.identifier IN ('processos', 'documentos', 'clientes', 'agenda') THEN true
        WHEN sp.identifier = 'professional' AND lm.identifier IN ('processos', 'documentos', 'clientes', 'agenda', 'kanban', 'templates') THEN true
        WHEN sp.identifier = 'enterprise' AND lm.identifier IN ('processos', 'documentos', 'clientes', 'agenda', 'kanban', 'templates', 'ia_legal', 'analytics') THEN true
        WHEN sp.identifier = 'corporate' THEN true
        ELSE false
    END as is_enabled,
    CASE 
        WHEN sp.identifier = 'basic' THEN '{"daily_requests": 100}'::jsonb
        WHEN sp.identifier = 'professional' THEN '{"daily_requests": 500}'::jsonb
        WHEN sp.identifier = 'enterprise' THEN '{"daily_requests": 2000}'::jsonb
        WHEN sp.identifier = 'corporate' THEN '{"daily_requests": 10000}'::jsonb
        ELSE '{"daily_requests": 0}'::jsonb
    END as usage_limits
FROM subscription_plans sp
CROSS JOIN legal_modules lm;

-- Insert default roles
INSERT INTO roles (name, description, identifier, permissions) VALUES
('Super Administrador', 'Acesso total ao sistema', 'super_admin', '{"all": true, "modules": ["*"], "settings": ["*"], "users": ["*"]}'),
('Administrador', 'Administrador do sistema', 'admin', '{"modules": ["read", "update"], "settings": ["read", "update"], "users": ["read", "create", "update"], "plans": ["read", "update"], "templates": ["*"]}'),
('Gerente de Conteúdo', 'Gerencia templates e conteúdo', 'content_manager', '{"templates": ["*"], "settings": ["read"], "modules": ["read"]}'),
('Analista de Sistema', 'Visualiza configurações e relatórios', 'system_analyst', '{"settings": ["read"], "modules": ["read"], "analytics": ["read"], "logs": ["read"]}'),
('Suporte Técnico', 'Suporte e manutenção', 'support', '{"settings": ["read"], "modules": ["read"], "logs": ["read"], "users": ["read"]}');

-- Insert default system settings
INSERT INTO system_settings (key, value, type, category, description) VALUES
('app_name', 'Lexiom SaaS', 'string', 'general', 'Nome da aplicação'),
('app_version', '1.0.0', 'string', 'general', 'Versão do sistema'),
('maintenance_mode', 'false', 'boolean', 'general', 'Modo de manutenção'),
('session_timeout', '3600', 'integer', 'security', 'Tempo de sessão em segundos'),
('max_login_attempts', '5', 'integer', 'security', 'Máximo de tentativas de login'),
('password_min_length', '8', 'integer', 'security', 'Comprimento mínimo da senha'),
('mfa_required', 'false', 'boolean', 'security', 'MFA obrigatório para admins'),
('backup_frequency', 'daily', 'string', 'backup', 'Frequência de backup'),
('backup_retention_days', '30', 'integer', 'backup', 'Dias de retenção de backup'),
('ai_features_enabled', 'true', 'boolean', 'features', 'IA jurídica habilitada'),
('analytics_enabled', 'true', 'boolean', 'features', 'Analytics habilitado'),
('api_rate_limit', '1000', 'integer', 'api', 'Limite de requisições por hora'),
('log_retention_days', '90', 'integer', 'logs', 'Dias de retenção de logs');