'use client';

import { useState, useEffect, useCallback } from 'react';
import SectionHead from '@/components/ui/SectionHead';
import { BookOpen, Plus, Trash2, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import styles from '@/components/ui/form.module.css';
import { useOrganizacoes } from '@/hooks/useOrganizacoes';

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
  const { toast, confirm } = useToast();
  const [versiculos, setVersiculos] = useState<VersiculoDiario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { orgs, loading: orgsLoading, multiOrg } = useOrganizacoes();
  const [form, setForm] = useState({ organizacaoId: '', referencia: '', versiculo: '', reflexao: '', ativo: true });

  const fetchVersiculos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/versiculos');
      if (res.ok) {
        const data = await res.json();
        setVersiculos(data.versiculos);
      }
    } catch (err) {
      console.error('Erro ao buscar versículos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVersiculos(); }, [fetchVersiculos]);

  const resetForm = () => {
    setForm({ organizacaoId: orgs.length === 1 ? orgs[0].id : '', referencia: '', versiculo: '', reflexao: '', ativo: true });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (v: VersiculoDiario) => {
    setForm({ organizacaoId: (v as unknown as { organizacao?: { id?: string } }).organizacao?.id || (orgs.length === 1 ? orgs[0].id : ''), referencia: v.referencia, versiculo: v.versiculo, reflexao: v.reflexao, ativo: v.ativo });
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
        toast(editingId ? 'Versículo atualizado.' : 'Versículo criado.', 'ok');
      } else {
        const data = await res.json().catch(() => ({}));
        toast(data.error || 'Erro ao salvar versículo', 'err');
      }
    } catch (err) {
      console.error('Erro ao salvar versículo:', err);
      toast('Erro de conexão ao salvar versículo.', 'err');
    }
  };

  const handleDelete = async (id: string) => {
    confirm('Tem certeza que deseja excluir este versículo?', async () => {
      try {
        const res = await fetch(`/api/admin/versiculos/${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast('Versículo excluído.', 'ok');
          fetchVersiculos();
        } else {
          toast('Erro ao excluir versículo.', 'err');
        }
      } catch (err) {
        console.error('Erro ao excluir:', err);
        toast('Erro de conexão ao excluir.', 'err');
      }
    }, { title: 'Excluir versículo', danger: true });
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
        title="Versículos Diarios"
        subtitle="Gerencie os versículos e reflexões exibidos no site público. Rotaciona a cada 12 horas."
        action={{ label: 'Novo Versículo', onClick: () => setShowForm(true) }}
      />

      {showForm && (
        <div className={styles.formCard}>
          <h3>{editingId ? 'Editar Versículo' : 'Novo Versículo'}</h3>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              {multiOrg && (
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Organização *</label>
                  <select className={styles.select} value={form.organizacaoId} onChange={e => setForm({ ...form, organizacaoId: e.target.value })} required>
                    <option value="">Selecione...</option>
                    {orgs.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                  </select>
                </div>
              )}
              <div className={styles.formGroup}>
                <label>Referência Biblica *</label>
                <input
                  type="text"
                  value={form.referencia}
                  onChange={e => setForm({ ...form, referencia: e.target.value })}
                  placeholder="Ex: João 3:16"
                  required
                />
              </div>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Versículo *</label>
                <textarea
                  value={form.versiculo}
                  onChange={e => setForm({ ...form, versiculo: e.target.value })}
                  placeholder="Texto do versículo bíblico"
                  rows={3}
                  required
                />
              </div>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Reflexão *</label>
                <textarea
                  value={form.reflexao}
                  onChange={e => setForm({ ...form, reflexao: e.target.value })}
                  placeholder="Reflexão espiritual associada ao versículo"
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
                {editingId ? 'Salvar Alterações' : 'Criar Versículo'}
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
