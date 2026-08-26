'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, X } from 'lucide-react';
import SectionHead from '@/components/ui/SectionHead';

interface Membro {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  status: string;
  congregacao: string | null;
  ministerio: { nome: string } | null;
}

const statusColors: Record<string, string> = {
  ATIVO: '#4caf50',
  INATIVO: '#9e9e9e',
  TRANSFERIDO: '#2196f3',
  FALECIDO: '#e74c3c',
};

export default function MembrosPage() {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', congregacao: '', status: 'ATIVO' });

  const fetchMembros = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    fetch(`/api/membros?${params}`)
      .then((res) => res.json())
      .then((d) => { setMembros(d.membros || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchMembros(); }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/membros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ nome: '', email: '', telefone: '', congregacao: '', status: 'ATIVO' });
      fetchMembros();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este membro?')) return;
    await fetch(`/api/membros/${id}`, { method: 'DELETE' });
    fetchMembros();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <SectionHead icon={<span>👥</span>} title="Gestao de Membros" />
        <button className="btn sm" onClick={() => setShowForm(true)}><Plus size={16} /> Novo Membro</button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', marginBottom: '1rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar membro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--color-secondary)' }}>Novo Membro</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><X size={24} /></button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form__group">
              <label>Nome Completo</label>
              <input type="text" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="form__group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form__group">
              <label>Telefone</label>
              <input type="tel" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <div className="form__group">
              <label>Congregacao</label>
              <input type="text" value={form.congregacao} onChange={(e) => setForm({ ...form, congregacao: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn">Salvar Membro</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
        ) : membros.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhum membro encontrado.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {membros.map((membro) => (
              <div key={membro.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4>{membro.nome}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {membro.email || 'Sem email'} | {membro.congregacao || 'Sem congregacao'}
                    {membro.ministerio && ` | ${membro.ministerio.nome}`}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', background: statusColors[membro.status], color: '#fff', fontSize: '0.75rem', fontWeight: 600 }}>{membro.status}</span>
                  <button onClick={() => handleDelete(membro.id)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
