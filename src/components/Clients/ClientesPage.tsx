import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';

type Cliente = {
  id: string;
  nome_completo: string;
  cpf_cnpj: string;
  tipo_cliente: 'fisica' | 'juridica';
  telefone: string;
  email?: string;
  endereco?: string;
  observacoes?: string;
};

function TableClientes({ rows, onEdit, onDelete, onPerfil, onCreateProcesso, onGerarPeticao }: { rows: Cliente[]; onEdit: (c: Cliente) => void; onDelete: (c: Cliente) => void; onPerfil: (c: Cliente) => void; onCreateProcesso: (c: Cliente) => void; onGerarPeticao: (c: Cliente) => void }) {
  return (
    <table className="min-w-full bg-white rounded-card overflow-hidden">
      <thead>
        <tr className="text-left bg-bg">
          <th className="p-3">Nome</th>
          <th className="p-3">CPF/CNPJ</th>
          <th className="p-3">Telefone</th>
          <th className="p-3">Ações</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.id} className="border-t">
            <td className="p-3">{r.nome_completo}</td>
            <td className="p-3">{r.cpf_cnpj}</td>
            <td className="p-3">{r.telefone}</td>
            <td className="p-3 space-x-2">
              <button onClick={() => onPerfil(r)} className="px-3 py-1 rounded-card border focus:outline-none focus:ring-2 focus:ring-primary" aria-label="Abrir perfil do cliente">Perfil</button>
              <button onClick={() => onCreateProcesso(r)} className="px-3 py-1 rounded-card border focus:outline-none focus:ring-2 focus:ring-primary" aria-label="Criar processo">Criar Processo</button>
              <button onClick={() => onGerarPeticao(r)} className="px-3 py-1 rounded-card border focus:outline-none focus:ring-2 focus:ring-primary" aria-label="Gerar petição">Gerar Petição</button>
              <button onClick={() => onEdit(r)} className="px-3 py-1 rounded-card bg-primary text-white focus:outline-none focus:ring-2 focus:ring-primary" aria-label="Editar cliente">Editar</button>
              <button onClick={() => onDelete(r)} className="px-3 py-1 rounded-card border focus:outline-none focus:ring-2 focus:ring-primary" aria-label="Excluir cliente">Excluir</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ClientesPage() {
  const [rows, setRows] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState<Partial<Cliente>>({ nome_completo: '', cpf_cnpj: '', tipo_cliente: 'fisica', telefone: '', email: '', endereco: '', observacoes: '' });
  const [editing, setEditing] = useState<Cliente | null>(null);

  async function load(q = '', p = 1) {
    setLoading(true);
    try {
      const r = await api(`/clientes?busca=${encodeURIComponent(q)}&page=${p}&limit=${limit}`);
      setRows((r.resultados || []) as Cliente[]);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const r = await api(`/clientes?busca=${encodeURIComponent(busca)}&page=${page}&limit=${limit}`);
        setRows((r.resultados || []) as Cliente[]);
      } finally {
        setLoading(false);
      }
    })();
  }, [busca, page, limit]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault?.();
    try {
      const payload = { ...form };
      let res;
      if (editing) {
        res = await api(`/clientes/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        res = await api('/cadastro_cliente', { method: 'POST', body: JSON.stringify(payload) });
      }
      await load();
      setForm({ nome_completo: '', cpf_cnpj: '', tipo_cliente: 'fisica', telefone: '', email: '', endereco: '', observacoes: '' });
      setEditing(null);
      alert(res.mensagem || 'OK');
    } catch (err: unknown) {
      const e = err as { erro?: string };
      alert(e.erro || 'Erro');
    }
  }

  async function handleDelete(row: Cliente) {
    if (!confirm('Confirmar exclusão?')) return;
    await api(`/clientes/${row.id}`, { method: 'DELETE' });
    await load();
  }

  function startEdit(row: Cliente) {
    setEditing(row);
    setForm(row);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openPerfil(row: Cliente) {
    alert(`Abrir perfil do cliente ${row.nome_completo} (#${row.id})`);
  }

  function criarProcesso(row: Cliente) {
    alert(`Criar processo para ${row.nome_completo}`);
  }

  async function gerarPeticao(row: Cliente) {
    try {
      const res = await api('/peticoes/generate', {
        method: 'POST',
        body: JSON.stringify({ cliente_id: row.id, setor: 'geral', tipo_acao: 'modelo', dados: {} })
      });
      alert(res?.mensagem || 'Petição gerada');
    } catch {
      alert('Erro ao gerar petição');
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4 font-headline">Clientes</h1>
      <div className="mb-4">
        <label htmlFor="busca" className="block text-sm mb-1">Buscar por nome, CPF/CNPJ ou telefone</label>
        <input id="busca" placeholder="Digite para buscar" value={busca} onChange={e => { setPage(1); setBusca(e.target.value); }} className="border rounded-card p-3 w-full focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>

      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm">Nome completo</span>
          <input id="nome" placeholder="Nome completo" value={form.nome_completo || ''} onChange={e => setForm({ ...form, nome_completo: e.target.value })} className="border rounded-card p-4 focus:outline-none focus:ring-2 focus:ring-primary" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">CPF/CNPJ</span>
          <input id="cpf" placeholder="CPF/CNPJ" value={form.cpf_cnpj || ''} onChange={e => setForm({ ...form, cpf_cnpj: e.target.value })} className="border rounded-card p-4 focus:outline-none focus:ring-2 focus:ring-primary" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Telefone</span>
          <input id="tel" placeholder="Telefone" value={form.telefone || ''} onChange={e => setForm({ ...form, telefone: e.target.value })} className="border rounded-card p-4 focus:outline-none focus:ring-2 focus:ring-primary" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Email</span>
          <input id="email" placeholder="Email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className="border rounded-card p-4 focus:outline-none focus:ring-2 focus:ring-primary" />
        </label>
        <label className="flex flex-col gap-1 col-span-2">
          <span className="text-sm">Endereço</span>
          <input id="end" placeholder="Endereço" value={form.endereco || ''} onChange={e => setForm({ ...form, endereco: e.target.value })} className="border rounded-card p-4 focus:outline-none focus:ring-2 focus:ring-primary" />
        </label>
        <label className="flex flex-col gap-1 col-span-2">
          <span className="text-sm">Observações</span>
          <textarea id="obs" placeholder="Observações" value={form.observacoes || ''} onChange={e => setForm({ ...form, observacoes: e.target.value })} className="border rounded-card p-4 focus:outline-none focus:ring-2 focus:ring-primary" />
        </label>
        <div className="col-span-2">
          <button className="px-4 py-2 bg-primary text-white rounded-card focus:outline-none focus:ring-2 focus:ring-primary">{editing ? 'Salvar' : 'Cadastrar'}</button>
        </div>
      </form>

      <div>
        {loading ? <p>Carregando...</p> : <TableClientes rows={rows} onEdit={startEdit} onDelete={handleDelete} onPerfil={openPerfil} onCreateProcesso={criarProcesso} onGerarPeticao={gerarPeticao} />}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded-card border focus:outline-none focus:ring-2 focus:ring-primary" disabled={page === 1}>Anterior</button>
        <span className="text-sm">Página {page}</span>
        <button onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-card border focus:outline-none focus:ring-2 focus:ring-primary">Próxima</button>
      </div>
    </div>
  );
}
