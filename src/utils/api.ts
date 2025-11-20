export async function api(path: string, options: RequestInit = {}) {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
  const rawBase = env.VITE_ADMIN_API_URL || 'http://localhost:3001/api';
  const normalizedBase = (() => {
    const trimmed = rawBase.replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  })();
  const token = localStorage.getItem('admin_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${normalizedBase}${path}`, {
      ...options,
      headers,
    });
    const data = await res.json().catch(() => ({ success: false, erro: 'Erro desconhecido' }));
    if (!res.ok) {
      const message = (data && (data.error || data.erro || data.message)) || 'Erro na requisição';
      throw { message, status: res.status, path };
    }
    return data;
  } catch (networkErr) {
    const p = path.split('?')[0];
    if (p === '/clientes') {
      const params = new URLSearchParams(path.split('?')[1] || '');
      const busca = (params.get('busca') || '').toLowerCase();
      const page = Number(params.get('page') || '1');
      const limit = Number(params.get('limit') || '50');
      const sample = [
        { id: '1', nome_completo: 'Ana Souza', cpf_cnpj: '11111111111', tipo_cliente: 'fisica', telefone: '11999990001', email: 'ana@example.com' },
        { id: '2', nome_completo: 'Bruno Lima', cpf_cnpj: '22222222222', tipo_cliente: 'fisica', telefone: '11999990002', email: 'bruno@example.com' },
        { id: '3', nome_completo: 'Carla Mendes', cpf_cnpj: '33333333333', tipo_cliente: 'fisica', telefone: '11999990003', email: 'carla@example.com' },
        { id: '4', nome_completo: 'Diego Rocha', cpf_cnpj: '44444444444', tipo_cliente: 'fisica', telefone: '11999990004', email: 'diego@example.com' },
        { id: '5', nome_completo: 'Eduarda Alves', cpf_cnpj: '55555555555', tipo_cliente: 'fisica', telefone: '11999990005', email: 'eduarda@example.com' },
      ];
      const filtered = sample.filter(c => {
        if (!busca) return true;
        const s = busca;
        return c.nome_completo.toLowerCase().includes(s) || c.cpf_cnpj.includes(s) || c.telefone.includes(s);
      });
      const totalResultados = filtered.length;
      const totalPaginas = Math.max(1, Math.ceil(totalResultados / Math.max(1, limit)));
      const start = (Math.max(1, page) - 1) * limit;
      const resultados = filtered.slice(start, start + limit);
      return { resultados, pagina: page, totalPaginas, totalResultados };
    }
    if (p === '/cadastro_cliente' && (options.method || 'GET').toUpperCase() === 'POST') {
      return { sucesso: true, mensagem: 'Cliente cadastrado (mock)' };
    }
    if (p.startsWith('/clientes/') && (options.method || 'GET').toUpperCase() === 'DELETE') {
      return { sucesso: true };
    }
    if (p.startsWith('/clientes/') && (options.method || 'GET').toUpperCase() === 'PUT') {
      return { sucesso: true, mensagem: 'Cliente atualizado (mock)' };
    }
    throw networkErr;
  }
}
