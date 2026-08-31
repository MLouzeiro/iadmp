'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import SectionHead from '@/components/ui/SectionHead';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import FormCard from '@/components/ui/FormCard';
import FormGrid from '@/components/ui/FormGrid';
import styles from '@/components/ui/form.module.css';

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

const statusOptions = [
  { value: 'PLANEJADO', label: 'Planejado' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { value: 'CONCLUIDO', label: 'Concluido' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

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
      <div className={styles.pageHeader}>
        <SectionHead icon={<span>📅</span>} title="Gestao de Eventos" />
        <Button icon={<Plus size={16} />} onClick={() => setShowForm(true)} size="sm">
          Novo Evento
        </Button>
      </div>

      {showForm && (
        <FormCard title="Novo Evento" onClose={() => setShowForm(false)}>
          <FormGrid onSubmit={handleSubmit}>
            <Input label="Nome do Evento" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <Input label="Tema" value={form.tema} onChange={(e) => setForm({ ...form, tema: e.target.value })} />
            <Input label="Data de Inicio" type="date" required value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />
            <Input label="Data do Evento" type="date" required value={form.dataEvento} onChange={(e) => setForm({ ...form, dataEvento: e.target.value })} />
            <Input label="Local" value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} />
            <Select label="Status" options={statusOptions} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
            <div className={styles.formActionsFull}>
              <Button type="submit">Salvar Evento</Button>
            </div>
          </FormGrid>
        </FormCard>
      )}

      <div style={{ marginTop: '1rem' }}>
        {loading ? (
          <p className={styles.loadingState}>Carregando...</p>
        ) : eventos.length === 0 ? (
          <p className={styles.emptyState}>Nenhum evento cadastrado.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {eventos.map((evento) => (
              <div key={evento.id} className={styles.listItem}>
                <div className={styles.listItemInfo}>
                  <h4>{evento.nome}</h4>
                  <p>
                    {new Date(evento.dataEvento).toLocaleDateString('pt-BR')}
                    {evento.local && ` | ${evento.local}`}
                    {evento.tema && ` | Tema: ${evento.tema}`}
                  </p>
                </div>
                <div className={styles.listItemActions}>
                  <span className={styles.badge} style={{ background: statusColors[evento.status], color: '#fff' }}>
                    {evento.status.replace('_', ' ')}
                  </span>
                  <Button variant="ghost" icon={<Trash2 size={16} />} onClick={() => handleDelete(evento.id)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
