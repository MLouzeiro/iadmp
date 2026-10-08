'use client';

import { useState, useEffect } from 'react';
import SectionHead from '@/components/ui/SectionHead';
import { Music, Plus, Trash2, Edit, Search, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import styles from '../liturgia.module.css';

const CATEGORIAS = ['Adoração', 'Louvor', 'Comunhão', 'Celestial', 'Natalino', 'Outro'];

interface Musica {
  id: string;
  titulo: string;
  compositor?: string;
  artista?: string;
  tom?: string;
  categoria: string;
  letra?: string;
  link?: string;
  observacoes?: string;
}

export default function MusicasPage() {
  const { toast, confirm } = useToast();
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [organizacaoId, setOrganizacaoId] = useState('');

  const [formTitulo, setFormTitulo] = useState('');
  const [formCompositor, setFormCompositor] = useState('');
  const [formArtista, setFormArtista] = useState('');
  const [formTom, setFormTom] = useState('');
  const [formCategoria, setFormCategoria] = useState('Adoração');
  const [formLetra, setFormLetra] = useState('');
  const [formLink, setFormLink] = useState('');
  const [formObservacoes, setFormObservacoes] = useState('');

  useEffect(() => {
    fetch('/api/organizacoes').then(r => r.json()).then(d => {
      if (d.organizacoes?.length === 1) setOrganizacaoId(d.organizacoes[0].id);
    });
  }, []);

  const fetchMusicas = () => {
    if (!organizacaoId) return;
    setLoading(true);
    const params = new URLSearchParams({ organizacaoId });
    if (busca) params.set('busca', busca);
    if (catFilter) params.set('categoria', catFilter);
    fetch(`/api/liturgia/musicas?${params}`).then(r => r.json()).then(d => { setMusicas(d.musicas || []); setLoading(false); });
  };

  useEffect(() => { fetchMusicas(); }, [organizacaoId, busca, catFilter]);

  const resetForm = () => {
    setFormTitulo(''); setFormCompositor(''); setFormArtista(''); setFormTom('');
    setFormCategoria('Adoração'); setFormLetra(''); setFormLink(''); setFormObservacoes('');
    setEditingId(null); setShowForm(false);
  };

  const startEdit = (m: Musica) => {
    setEditingId(m.id); setFormTitulo(m.titulo); setFormCompositor(m.compositor || '');
    setFormArtista(m.artista || ''); setFormTom(m.tom || ''); setFormCategoria(m.categoria);
    setFormLetra(m.letra || ''); setFormLink(m.link || ''); setFormObservacoes(m.observacoes || '');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formTitulo) { toast('Título é obrigatório', 'warn'); return; }
    const payload = {
      organizacaoId, titulo: formTitulo, compositor: formCompositor, artista: formArtista,
      tom: formTom, categoria: formCategoria, letra: formLetra, link: formLink, observacoes: formObservacoes,
    };
    const url = editingId ? `/api/liturgia/musicas/${editingId}` : '/api/liturgia/musicas';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      resetForm();
      fetchMusicas();
      toast(editingId ? 'Música atualizada.' : 'Música criada.', 'ok');
    } else {
      const err = await res.json().catch(() => ({}));
      toast(err.error || 'Erro ao salvar música', 'err');
    }
  };

  const handleDelete = async (id: string) => {
    confirm('Excluir esta música?', async () => {
      await fetch(`/api/liturgia/musicas/${id}`, { method: 'DELETE' });
      toast('Música excluída.', 'ok');
      fetchMusicas();
    }, { title: 'Excluir música', danger: true });
  };

  return (
    <div>
      <SectionHead icon={<Music size={24} />} title="Músicas">
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', background: 'var(--gradient-gold)', color: '#000', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.85rem', border: 'none', cursor: 'pointer' }}>
          <Plus size={16} /> Nova Música
        </button>
      </SectionHead>

      {showForm && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', color: 'var(--text-primary)' }}>{editingId ? 'Editar Música' : 'Nova Música'}</h3>
            <button onClick={resetForm} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Título *</label>
              <input type="text" value={formTitulo} onChange={e => setFormTitulo(e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Compositor</label>
              <input type="text" value={formCompositor} onChange={e => setFormCompositor(e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Artista</label>
              <input type="text" value={formArtista} onChange={e => setFormArtista(e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Tom</label>
              <input type="text" value={formTom} onChange={e => setFormTom(e.target.value)} placeholder="Ex: C, G, Am..." style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Categoria</label>
              <select value={formCategoria} onChange={e => setFormCategoria(e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Link (YouTube)</label>
              <input type="url" value={formLink} onChange={e => setFormLink(e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
            </div>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Letra</label>
            <textarea value={formLetra} onChange={e => setFormLetra(e.target.value)} rows={5} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'monospace' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button onClick={resetForm} style={{ padding: '0.5rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>Cancelar</button>
            <button onClick={handleSave} style={{ padding: '0.5rem 1.25rem', background: 'var(--gradient-gold)', color: '#000', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>{editingId ? 'Salvar' : 'Criar'}</button>
          </div>
        </div>
      )}

      <div className={styles.filtersBar}>
        <input type="text" placeholder="Buscar música..." value={busca} onChange={e => setBusca(e.target.value)} style={{ flex: 1, minWidth: 200, padding: '0.6rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
          <option value="">Todas categorias</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Carregando...</div> : musicas.length === 0 ? (
        <div className={styles.emptyState}>
          <Music size={40} className={styles.emptyStateIcon} />
          <h3 className={styles.emptyStateTitle}>Nenhuma música encontrada</h3>
          <p className={styles.emptyStateDesc}>Adicione músicas ao catálogo da igreja</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {musicas.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
              <Music size={18} style={{ color: 'var(--color-secondary)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{m.titulo}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {m.compositor && `${m.compositor}`}
                  {m.artista && ` - ${m.artista}`}
                  {m.tom && ` | Tom: ${m.tom}`}
                  <span style={{ marginLeft: '0.5rem', padding: '0.15rem 0.5rem', background: 'var(--gradient-gold-soft)', borderRadius: '9999px', fontSize: '0.7rem' }}>{m.categoria}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button onClick={() => startEdit(m)} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.35rem', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit size={14} /></button>
                <button onClick={() => handleDelete(m.id)} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.35rem', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}