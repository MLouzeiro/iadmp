'use client';

import { useState, useEffect } from 'react';
import SectionHead from '@/components/ui/SectionHead';
import { LayoutTemplate, Plus, Trash2, Edit, X, ChevronDown, ChevronRight } from 'lucide-react';
import styles from '../liturgia.module.css';

const MOMENTO_TYPES = [
  { value: 'ABERTURA', label: 'Abertura' }, { value: 'LOUVOR', label: 'Louvor' },
  { value: 'ORACAO', label: 'Oracao' }, { value: 'DIZIMOS', label: 'Dizimos' },
  { value: 'ALAS', label: 'Alas' }, { value: 'DINAMICA', label: 'Dinamica' },
  { value: 'MENSAGEM', label: 'Mensagem' }, { value: 'RESPOSTA', label: 'Resposta' },
  { value: 'COMUNICADOS', label: 'Comunicados' }, { value: 'BENCAO', label: 'Bencao' },
  { value: 'MUSICA_ESPECIAL', label: 'Musica Especial' }, { value: 'TESTEMUNHO', label: 'Testemunho' },
  { value: 'CEIA', label: 'Ceia' }, { value: 'BAPTISMO', label: 'Batismo' },
  { value: 'OUTRO', label: 'Outro' },
];

interface ModeloMomento {
  tipo: string; titulo: string; duracaoPrevista: number | null; descricao: string;
}

interface Modelo {
  id: string; nome: string; descricao?: string; tipoCulto?: string;
  momentos: { id: string; ordem: number; tipo: string; titulo: string; duracaoPrevista?: number; descricao?: string }[];
}

export default function ModelosPage() {
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [organizacaoId, setOrganizacaoId] = useState('');

  const [formNome, setFormNome] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formTipoCulto, setFormTipoCulto] = useState('');
  const [formMomentos, setFormMomentos] = useState<ModeloMomento[]>([]);

  useEffect(() => {
    fetch('/api/organizacoes').then(r => r.json()).then(d => {
      if (d.organizacoes?.length === 1) setOrganizacaoId(d.organizacoes[0].id);
    });
  }, []);

  const fetchModelos = () => {
    if (!organizacaoId) return;
    setLoading(true);
    fetch(`/api/liturgia/modelos?organizacaoId=${organizacaoId}`).then(r => r.json()).then(d => { setModelos(d.modelos || []); setLoading(false); });
  };

  useEffect(() => { fetchModelos(); }, [organizacaoId]);

  const resetForm = () => {
    setFormNome(''); setFormDescricao(''); setFormTipoCulto(''); setFormMomentos([]);
    setEditingId(null); setShowForm(false);
  };

  const startEdit = (m: Modelo) => {
    setEditingId(m.id); setFormNome(m.nome); setFormDescricao(m.descricao || '');
    setFormTipoCulto(m.tipoCulto || '');
    setFormMomentos(m.momentos.map(mi => ({
      tipo: mi.tipo, titulo: mi.titulo, duracaoPrevista: mi.duracaoPrevista || null, descricao: mi.descricao || '',
    })));
    setShowForm(true);
  };

  const addMomento = () => setFormMomentos(prev => [...prev, { tipo: 'LOUVOR', titulo: '', duracaoPrevista: null, descricao: '' }]);
  const updateMomento = (idx: number, field: keyof ModeloMomento, value: any) => setFormMomentos(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  const removeMomento = (idx: number) => setFormMomentos(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!formNome) { alert('Nome e obrigatorio'); return; }
    const payload = { organizacaoId, nome: formNome, descricao: formDescricao, tipoCulto: formTipoCulto, momentos: formMomentos };
    const url = editingId ? `/api/liturgia/modelos/${editingId}` : '/api/liturgia/modelos';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { resetForm(); fetchModelos(); } else { const err = await res.json(); alert(err.error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este modelo?')) return;
    await fetch(`/api/liturgia/modelos/${id}`, { method: 'DELETE' });
    fetchModelos();
  };

  return (
    <div>
      <SectionHead icon={<LayoutTemplate size={24} />} title="Modelos de Liturgia">
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', background: 'var(--gradient-gold)', color: '#000', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.85rem', border: 'none', cursor: 'pointer' }}>
          <Plus size={16} /> Novo Modelo
        </button>
      </SectionHead>

      {showForm && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', color: 'var(--text-primary)' }}>{editingId ? 'Editar Modelo' : 'Novo Modelo'}</h3>
            <button onClick={resetForm} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Nome *</label>
              <input type="text" value={formNome} onChange={e => setFormNome(e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Tipo Culto</label>
              <input type="text" value={formTipoCulto} onChange={e => setFormTipoCulto(e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Descricao</label>
              <input type="text" value={formDescricao} onChange={e => setFormDescricao(e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Momentos do Modelo</span>
              <button onClick={addMomento} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', background: 'var(--gradient-gold-soft)', border: '1px solid var(--color-secondary)', borderRadius: 'var(--radius-sm)', color: 'var(--color-secondary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                <Plus size={12} /> Adicionar
              </button>
            </div>
            {formMomentos.map((m, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-secondary)', minWidth: '20px' }}>{idx + 1}</span>
                <select value={m.tipo} onChange={e => updateMomento(idx, 'tipo', e.target.value)} style={{ padding: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                  {MOMENTO_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <input type="text" value={m.titulo} onChange={e => updateMomento(idx, 'titulo', e.target.value)} placeholder="Titulo" style={{ flex: 1, padding: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                <input type="number" value={m.duracaoPrevista || ''} onChange={e => updateMomento(idx, 'duracaoPrevista', e.target.value ? parseInt(e.target.value) : null)} placeholder="Min" style={{ width: '60px', padding: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                <button onClick={() => removeMomento(idx)} style={{ background: 'none', border: 'none', color: '#f44336', cursor: 'pointer', padding: '0.25rem' }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button onClick={resetForm} style={{ padding: '0.5rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>Cancelar</button>
            <button onClick={handleSave} style={{ padding: '0.5rem 1.25rem', background: 'var(--gradient-gold)', color: '#000', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>{editingId ? 'Salvar' : 'Criar'}</button>
          </div>
        </div>
      )}

      {loading ? <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Carregando...</div> : modelos.length === 0 ? (
        <div className={styles.emptyState}>
          <LayoutTemplate size={40} className={styles.emptyStateIcon} />
          <h3 className={styles.emptyStateTitle}>Nenhum modelo encontrado</h3>
          <p className={styles.emptyStateDesc}>Crie modelos para agilizar a criacao de liturgias</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {modelos.map(m => (
            <div key={m.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.25rem', cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}>
                {expandedId === m.id ? <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
                <LayoutTemplate size={18} style={{ color: 'var(--color-secondary)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{m.nome}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {m.tipoCulto && `${m.tipoCulto} | `}{m.momentos.length} momentos
                    {m.descricao && ` | ${m.descricao}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => startEdit(m)} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.35rem', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit size={14} /></button>
                  <button onClick={() => handleDelete(m.id)} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.35rem', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={14} /></button>
                </div>
              </div>
              {expandedId === m.id && (
                <div style={{ padding: '0 1.25rem 1rem', borderTop: '1px solid var(--border-color)' }}>
                  {m.momentos.map(mi => (
                    <div key={mi.id} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-secondary)', minWidth: '20px' }}>{mi.ordem}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{mi.titulo}</span>
                      <span style={{ color: 'var(--text-muted)' }}>({mi.tipo})</span>
                      {mi.duracaoPrevista && <span style={{ color: 'var(--text-muted)' }}>{mi.duracaoPrevista}min</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}