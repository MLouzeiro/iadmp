'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import SectionHead from '@/components/ui/SectionHead';
import Input from '@/components/ui/Input';
import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';
import FormCard from '@/components/ui/FormCard';
import FormGrid from '@/components/ui/FormGrid';
import styles from '@/components/ui/form.module.css';

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
      <div className={styles.pageHeader}>
        <SectionHead icon={<span>👤</span>} title="Gestao de Lideranca" />
        <Button icon={<Plus size={16} />} onClick={() => setShowForm(true)} size="sm">
          Novo Lider
        </Button>
      </div>

      {showForm && (
        <FormCard title="Novo Lider" onClose={() => setShowForm(false)}>
          <FormGrid onSubmit={handleSubmit}>
            <Input label="Nome" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <Input label="Cargo" required value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
            <Input label="Ordem de Exibicao" type="number" value={form.ordemExibicao} onChange={(e) => setForm({ ...form, ordemExibicao: parseInt(e.target.value) || 0 })} />
            <Checkbox label="Publico no site" checked={form.publico} onChange={(checked) => setForm({ ...form, publico: checked })} />
            <div className={styles.formActionsFull}>
              <Button type="submit">Salvar Lider</Button>
            </div>
          </FormGrid>
        </FormCard>
      )}

      <div style={{ marginTop: '1rem' }}>
        {loading ? (
          <p className={styles.loadingState}>Carregando...</p>
        ) : lideres.length === 0 ? (
          <p className={styles.emptyState}>Nenhum lider encontrado.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {lideres.map((lider) => (
              <div key={lider.id} className={styles.listItem}>
                <div className={styles.listItemInfo}>
                  <h4>{lider.nome}</h4>
                  <p>
                    {lider.cargo} | Ordem: {lider.ordemExibicao}
                    {lider.ministerio && ` | ${lider.ministerio.nome}`}
                  </p>
                </div>
                <div className={styles.listItemActions}>
                  <span className={styles.badge} style={{ background: lider.publico ? '#4caf50' : '#9e9e9e', color: '#fff' }}>
                    {lider.publico ? 'Publico' : 'Privado'}
                  </span>
                  <Button variant="ghost" icon={<Trash2 size={16} />} onClick={() => handleDelete(lider.id)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
