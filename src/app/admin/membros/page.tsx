'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import SectionHead from '@/components/ui/SectionHead';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import FormCard from '@/components/ui/FormCard';
import FormGrid from '@/components/ui/FormGrid';
import SearchBar from '@/components/ui/SearchBar';
import styles from '@/components/ui/form.module.css';

interface Membro {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  status: string;
  congregacao: { id: string; nome: string } | null;
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
      <div className={styles.pageHeader}>
        <SectionHead icon={<span>👥</span>} title="Gestao de Membros" />
        <Button icon={<Plus size={16} />} onClick={() => setShowForm(true)} size="sm">
          Novo Membro
        </Button>
      </div>

      <div className={styles.toolbar}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar membro..." />
      </div>

      {showForm && (
        <FormCard title="Novo Membro" onClose={() => setShowForm(false)}>
          <FormGrid onSubmit={handleSubmit}>
            <Input label="Nome Completo" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Telefone" type="tel" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            <Input label="Congregacao" value={form.congregacao} onChange={(e) => setForm({ ...form, congregacao: e.target.value })} />
            <div className={styles.formActionsFull}>
              <Button type="submit">Salvar Membro</Button>
            </div>
          </FormGrid>
        </FormCard>
      )}

      <div style={{ marginTop: '1rem' }}>
        {loading ? (
          <p className={styles.loadingState}>Carregando...</p>
        ) : membros.length === 0 ? (
          <p className={styles.emptyState}>Nenhum membro encontrado.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {membros.map((membro) => (
              <div key={membro.id} className={styles.listItem}>
                <div className={styles.listItemInfo}>
                  <h4>{membro.nome}</h4>
                  <p>
                    {membro.email || 'Sem email'} | {membro.congregacao?.nome || 'Sem congregacao'}
                    {membro.ministerio && ` | ${membro.ministerio.nome}`}
                  </p>
                </div>
                <div className={styles.listItemActions}>
                  <span className={styles.badge} style={{ background: statusColors[membro.status], color: '#fff' }}>
                    {membro.status}
                  </span>
                  <Button variant="ghost" icon={<Trash2 size={16} />} onClick={() => handleDelete(membro.id)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
