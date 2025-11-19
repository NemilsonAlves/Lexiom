-- Clients table for Lexiom SaaS

CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo VARCHAR(255) NOT NULL,
    cpf_cnpj VARCHAR(20) UNIQUE NOT NULL,
    tipo_cliente VARCHAR(10) NOT NULL CHECK (tipo_cliente IN ('fisica','juridica')),
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    endereco TEXT,
    observacoes TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj ON clientes(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome_completo);

-- RLS enable
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Policies (admins via admin_users)
CREATE POLICY "Admins can read clientes" ON clientes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "Super admins can manage clientes" ON clientes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND is_super_admin = TRUE AND is_active = TRUE
        )
    );

GRANT SELECT ON clientes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON clientes TO authenticated;
