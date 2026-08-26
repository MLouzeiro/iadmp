'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, X, Eye, EyeOff } from 'lucide-react';
import SectionHead from '@/components/ui/SectionHead';

interface Lider {
  id: string;
  nome: string;
  cargo: string;
  publico: boolean;
  ativo: boolean;
  ordemExibicao: number;
  ministerio: { nome: string } | null;
}

export default function LiderancaPage() {
  const [lideres, setLideres] = useState<Lider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: '', cargo: '', biografia: '', publico: true, ativo: true, ordemExibicao: 0 });

  const fetchLideres = () => {
    fetch('/api/lideranca')
      .then((res) => res.json())
      .then((d) => { setLideres(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchLideres(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/lideranca', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ nome: '', cargo: '', biografia: '', publico: true, ativo: true, ordemExibicao: 0 });
      fetchLideres();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lider?')) return;
    await fetch(`/api/lideranca/${id}`, { method: 'DELETE' });
    fetchLideres();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <SectionHead icon={<span>👤</span>} title="Gestao de Lideranca" />
        <button className="btn sm" onClick={() => setShowForm(true)}><Plus size={16} /> Novo Lider</button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--color-secondary)' }}>Novo Lider</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><X size={24} /></button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form__group">
              <label>Nome</label>
              <input type="text" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="form__group">
              <label>Cargo</label>
              <input type="text" required value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
            </div>
            <div className="form__group">
              <label>Ordem de Exibicao</label>
              <input type="number" value={form.ordemExibicao} onChange={(e) => setForm({ ...form, ordemExibicao: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="form__group" style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.publico} onChange={(e) => setForm({ ...form, publico: e.target.checked })} />
                Publico no site
              </label>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn">Salvar Lider</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
        ) : lideres.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhum lider encontrado.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {lideres.map((lider) => (
              <div key={lider.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4>{lider.nome}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {lider.cargo} | Ordem: {lider.ordemExibicao}
                    {lider.ministerio && ` | ${lider.ministerio.nome}`}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', background: lider.publico ? '#4caf50' : '#9e9e9e', color: '#fff', fontSize: '0.75rem', fontWeight: 600 }}>
                    {lider.publico ? 'Publico' : 'Privado'}
                  </span>
                  <button onClick={() => handleDelete(lider.id)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
