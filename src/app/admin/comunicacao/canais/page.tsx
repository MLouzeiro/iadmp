'use client';

import { useState, useEffect, useCallback } from 'react';
import SectionHead from '@/components/ui/SectionHead';
import { Radio, Plus, ExternalLink, Trash2, Pencil, GripVertical, ToggleLeft, ToggleRight } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import styles from '@/components/ui/form.module.css';
import { useOrganizacoes } from '@/hooks/useOrganizacoes';

interface CanalOficial {
  id: string;
  tipo: string;
  nome: string;
  url: string;
  descricao?: string;
  ativo: boolean;
  ordem: number;
  organizacao: { id: string; nome: string };
}

const TIPOS_CANAL = [
  { value: 'youtube', label: 'YouTube', emoji: '▶️' },
  { value: 'instagram', label: 'Instagram', emoji: '◎' },
  { value: 'facebook', label: 'Facebook', emoji: '📘' },
  { value: 'tiktok', label: 'TikTok', emoji: '🎵' },
  { value: 'whatsapp', label: 'WhatsApp', emoji: '💬' },
  { value: 'site', label: 'Site', emoji: '🌐' },
  { value: 'telegram', label: 'Telegram', emoji: '✈️' },
];

const getEmoji = (tipo: string) => TIPOS_CANAL.find(t => t.value === tipo)?.emoji || '🔗';

export default function CanaisPage() {
  const { toast, confirm } = useToast();
  const [canais, setCanais] = useState<CanalOficial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { orgs, loading: orgsLoading, multiOrg } = useOrganizacoes();
  const [form, setForm] = useState({ organizacaoId: '', tipo: 'youtube', nome: '', url: '', descricao: '', ativo: true, ordem: 0 });

  const fetchCanais = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/comunicacao/canais');
      if (res.ok) {
        const data = await res.json();
        setCanais(data.canais);
      }
    } catch (err) {
      console.error('Erro ao buscar canais:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCanais(); }, [fetchCanais]);

  const resetForm = () => {
    setForm({ organizacaoId: orgs.length === 1 ? orgs[0].id : '', tipo: 'youtube', nome: '', url: '', descricao: '', ativo: true, ordem: 0 });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (canal: CanalOficial) => {
    setForm({ organizacaoId: canal.organizacao?.id || (orgs.length === 1 ? orgs[0].id : ''), tipo: canal.tipo, nome: canal.nome, url: canal.url, descricao: canal.descricao || '', ativo: canal.ativo, ordem: canal.ordem });
    setEditingId(canal.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/comunicacao/canais/${editingId}` : '/api/comunicacao/canais';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        resetForm();
        fetchCanais();
        toast(editingId ? 'Canal atualizado.' : 'Canal criado.', 'ok');
      } else {
        const data = await res.json().catch(() => ({}));
        toast(data.error || 'Erro ao salvar canal', 'err');
      }
    } catch (err) {
      console.error('Erro ao salvar canal:', err);
      toast('Erro de conexao ao salvar canal.', 'err');
    }
  };

  const handleDelete = async (id: string) => {
    confirm('Tem certeza que deseja excluir este canal?', async () => {
      try {
        const res = await fetch(`/api/comunicacao/canais/${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast('Canal excluído.', 'ok');
          fetchCanais();
        } else {
          toast('Erro ao excluir canal.', 'err');
        }
      } catch (err) {
        console.error('Erro ao excluir:', err);
        toast('Erro de conexao ao excluir.', 'err');
      }
    }, { title: 'Excluir canal', danger: true });
  };

  const toggleAtivo = async (canal: CanalOficial) => {
    try {
      const res = await fetch(`/api/comunicacao/canais/${canal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !canal.ativo }),
      });
      if (res.ok) fetchCanais();
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <SectionHead icon={<Radio size={24} />} title="Canais Oficiais" />
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={16} /> Novo Canal
        </button>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <div>
              <h3 className={styles.formHeaderTitle}>{editingId ? 'Editar Canal' : 'Novo Canal'}</h3>
              <p className={styles.formHeaderSubtitle}>Cadastre um canal oficial da igreja</p>
            </div>
            <button className={styles.formClose} onClick={resetForm}>✕</button>
          </div>
          <form onSubmit={handleSubmit} className={styles.formGrid}>
            {multiOrg && (
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Organização <span className={styles.fieldRequired}>*</span></label>
                <select className={styles.select} value={form.organizacaoId} onChange={e => setForm({ ...form, organizacaoId: e.target.value })} required>
                  <option value="">Selecione...</option>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                </select>
              </div>
            )}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Tipo <span className={styles.fieldRequired}>*</span></label>
              <select className={styles.select} value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} required>
                {TIPOS_CANAL.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Nome <span className={styles.fieldRequired}>*</span></label>
              <input className={styles.input} type="text" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Canal Oficial IADMP" required />
            </div>
            <div className={`${styles.field} ${styles.formGridFull}`}>
              <label className={styles.fieldLabel}>URL <span className={styles.fieldRequired}>*</span></label>
              <input className={styles.input} type="url" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." required />
            </div>
            <div className={`${styles.field} ${styles.formGridFull}`}>
              <label className={styles.fieldLabel}>Descrição</label>
              <textarea className={styles.textarea} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Breve descrição do canal" rows={2} />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Ordem</label>
              <input className={styles.input} type="number" value={form.ordem} onChange={e => setForm({ ...form, ordem: parseInt(e.target.value) || 0 })} />
            </div>
            <div className={styles.field}>
              <label className={styles.checkboxWrapper}>
                <input type="checkbox" className={styles.checkbox} checked={form.ativo} onChange={e => setForm({ ...form, ativo: e.target.checked })} />
                <span className={styles.checkboxLabel}>Ativo</span>
              </label>
            </div>
            <div className={`${styles.field} ${styles.formActionsFull}`}>
              <div className={styles.formActions}>
                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={resetForm}>Cancelar</button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>{editingId ? 'Salvar' : 'Criar Canal'}</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingState}>Carregando...</div>
      ) : canais.length === 0 ? (
        <div className={styles.emptyState}>
          <Radio size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Nenhum canal cadastrado</h3>
          <p style={{ marginBottom: '1.5rem' }}>Cadastre os canais oficiais da igreja</p>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowForm(true)}>
            <Plus size={16} /> Novo Canal
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {canais.map(canal => (
            <div key={canal.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', transition: 'var(--transition)', opacity: canal.ativo ? 1 : 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{getEmoji(canal.tipo)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{canal.nome}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{canal.tipo.charAt(0).toUpperCase() + canal.tipo.slice(1)}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button onClick={() => toggleAtivo(canal)} title={canal.ativo ? 'Desativar' : 'Ativar'} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.35rem', color: canal.ativo ? '#4caf50' : 'var(--text-muted)', cursor: 'pointer' }}>
                    {canal.ativo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </button>
                  <button onClick={() => handleEdit(canal)} title="Editar" style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.35rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(canal.id)} title="Excluir" style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.35rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {canal.descricao && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem' }}>{canal.descricao}</p>}
              <a href={canal.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--color-primary)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500, transition: 'var(--transition)' }}>
                Acessar <ExternalLink size={13} />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
