'use client';

import { useEffect, useState } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import SectionHead from '@/components/ui/SectionHead';

interface Evento {
  id: string;
  nome: string;
  dataEvento: string;
  status: string;
  tema: string | null;
  local: string | null;
}

const statusColors: Record<string, string> = {
  PLANEJADO: 'var(--color-secondary)',
  EM_ANDAMENTO: '#4caf50',
  CONCLUIDO: 'var(--text-muted)',
  CANCELADO: '#e74c3c',
};

export default function EventosAdminPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: '', dataInicio: '', dataEvento: '', tema: '', local: '', status: 'PLANEJADO' });

  const fetchEventos = () => {
    fetch('/api/eventos')
      .then((res) => res.json())
      .then((d) => { setEventos(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchEventos(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/eventos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, preletores: [] }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ nome: '', dataInicio: '', dataEvento: '', tema: '', local: '', status: 'PLANEJADO' });
      fetchEventos();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;
    await fetch(`/api/eventos/${id}`, { method: 'DELETE' });
    fetchEventos();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <SectionHead icon={<span>📅</span>} title="Gestao de Eventos" />
        <button className="btn sm" onClick={() => setShowForm(true)}><Plus size={16} /> Novo Evento</button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--color-secondary)' }}>Novo Evento</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><X size={24} /></button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form__group">
              <label>Nome do Evento</label>
              <input type="text" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="form__group">
              <label>Tema</label>
              <input type="text" value={form.tema} onChange={(e) => setForm({ ...form, tema: e.target.value })} />
            </div>
            <div className="form__group">
              <label>Data de Inicio</label>
              <input type="date" required value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />
            </div>
            <div className="form__group">
              <label>Data do Evento</label>
              <input type="date" required value={form.dataEvento} onChange={(e) => setForm({ ...form, dataEvento: e.target.value })} />
            </div>
            <div className="form__group">
              <label>Local</label>
              <input type="text" value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} />
            </div>
            <div className="form__group">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="PLANEJADO">Planejado</option>
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="CONCLUIDO">Concluido</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn">Salvar Evento</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
        ) : eventos.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhum evento cadastrado.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {eventos.map((evento) => (
              <div key={evento.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4>{evento.nome}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {new Date(evento.dataEvento).toLocaleDateString('pt-BR')}
                    {evento.local && ` | ${evento.local}`}
                    {evento.tema && ` | Tema: ${evento.tema}`}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', background: statusColors[evento.status], color: '#fff', fontSize: '0.75rem', fontWeight: 600 }}>{evento.status.replace('_', ' ')}</span>
                  <button onClick={() => handleDelete(evento.id)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
