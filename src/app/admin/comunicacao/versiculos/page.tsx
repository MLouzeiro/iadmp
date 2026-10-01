'use client';

import { useState, useEffect, useCallback } from 'react';
import SectionHead from '@/components/ui/SectionHead';
import { BookOpen, Plus, Trash2, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import styles from '@/components/ui/form.module.css';

interface VersiculoDiario {
  id: string;
  referencia: string;
  versiculo: string;
  reflexao: string;
  ativo: boolean;
  organizacao: { id: string; nome: string };
  _count?: { historico: number };
}

export default function VersiculosPage() {
  const [versiculos, setVersiculos] = useState<VersiculoDiario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ referencia: '', versiculo: '', reflexao: '', ativo: true });

  const fetchVersiculos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/versiculos');
      if (res.ok) {
        const data = await res.json();
        setVersiculos(data.versiculos);
      }
    } catch (err) {
      console.error('Erro ao buscar versiculos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVersiculos(); }, [fetchVersiculos]);

  const resetForm = () => {
    setForm({ referencia: '', versiculo: '', reflexao: '', ativo: true });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (v: VersiculoDiario) => {
    setForm({ referencia: v.referencia, versiculo: v.versiculo, reflexao: v.reflexao, ativo: v.ativo });
    setEditingId(v.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/admin/versiculos/${editingId}` : '/api/admin/versiculos';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        resetForm();
        fetchVersiculos();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao salvar versiculo');
      }
    } catch (err) {
      console.error('Erro ao salvar versiculo:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este versiculo?')) return;
    try {
      const res = await fetch(`/api/admin/versiculos/${id}`, { method: 'DELETE' });
      if (res.ok) fetchVersiculos();
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  const toggleAtivo = async (v: VersiculoDiario) => {
    try {
      const res = await fetch(`/api/admin/versiculos/${v.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !v.ativo }),
      });
      if (res.ok) fetchVersiculos();
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  };

  return (
    <div>
      <SectionHead
        title="Versiculos Diarios"
        subtitle="Gerencie os versiculos e reflexoes exibidos no site publico. Rotaciona a cada 12 horas."
        action={{ label: 'Novo Versiculo', onClick: () => setShowForm(true) }}
      />

      {showForm && (
        <div className={styles.formCard}>
          <h3>{editingId ? 'Editar Versiculo' : 'Novo Versiculo'}</h3>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Referencia Biblica *</label>
                <input
                  type="text"
                  value={form.referencia}
                  onChange={e => setForm({ ...form, referencia: e.target.value })}
                  placeholder="Ex: Joao 3:16"
                  required
                />
              </div>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Versiculo *</label>
                <textarea
                  value={form.versiculo}
                  onChange={e => setForm({ ...form, versiculo: e.target.value })}
                  placeholder="Texto do versiculo biblico"
                  rows={3}
                  required
                />
              </div>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Reflexao *</label>
                <textarea
                  value={form.reflexao}
                  onChange={e => setForm({ ...form, reflexao: e.target.value })}
                  placeholder="Reflexao espiritual associada ao versiculo"
                  rows={4}
                  required
                />
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.btnSecondary} onClick={resetForm}>
                Cancelar
              </button>
              <button type="submit" className={styles.btnPrimary}>
                {editingId ? 'Salvar Alteracoes' : 'Criar Versiculo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Carregando...</p>
      ) : versiculos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p>Nenhum versiculo cadastrado. Clique em &quot;Novo Versiculo&quot; para comecar.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {versiculos.map(v => (
            <div key={v.id} className={styles.formCard} style={{ opacity: v.ativo ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <BookOpen size={16} style={{ color: 'var(--color-primary)' }} />
                    <strong style={{ color: 'var(--color-primary)' }}>{v.referencia}</strong>
                    {v._count && v._count.historico > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '0.1rem 0.5rem', borderRadius: '999px' }}>
                        {v._count.historico}x exibido
                      </span>
                    )}
                  </div>
                  <p style={{ fontStyle: 'italic', marginBottom: '0.5rem' }}>&ldquo;{v.versiculo}&rdquo;</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{v.reflexao}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button onClick={() => toggleAtivo(v)} title={v.ativo ? 'Desativar' : 'Ativar'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: v.ativo ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                    {v.ativo ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                  <button onClick={() => handleEdit(v)} title="Editar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(v.id)} title="Excluir" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
