'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SectionHead from '@/components/ui/SectionHead';
import { BookOpen, Plus, Trash2, GripVertical, ArrowLeft, Save } from 'lucide-react';
import styles from '../../liturgia.module.css';

const MOMENTO_TYPES = [
  { value: 'ABERTURA', label: 'Abertura' }, { value: 'LOUVOR', label: 'Louvor' },
  { value: 'ORACAO', label: 'Oracao' }, { value: 'DIZIMOS', label: 'Dizimos e Ofertas' },
  { value: 'ALAS', label: 'Momento das Alas' }, { value: 'DINAMICA', label: 'Dinamica' },
  { value: 'MENSAGEM', label: 'Mensagem/Pregacao' }, { value: 'RESPOSTA', label: 'Momento de Resposta' },
  { value: 'COMUNICADOS', label: 'Comunicados' }, { value: 'BENCAO', label: 'Bencao Final' },
  { value: 'MUSICA_ESPECIAL', label: 'Musica Especial' }, { value: 'TESTEMUNHO', label: 'Testemunho' },
  { value: 'CEIA', label: 'Ceia do Senhor' }, { value: 'BAPTISMO', label: 'Batismo' },
  { value: 'OUTRO', label: 'Outro' },
];

const TIPOS_CULTO = ['Celebracao', 'Encontro', 'Reuniao de Oracao', 'Vigilia', 'Batismo', 'Ceia', 'Especial'];

interface MomentoForm {
  tipo: string; titulo: string; horarioPrevisto: string; duracaoPrevista: string;
  responsavel: string; descricao: string; observacoes: string; musicaId: string;
  referenciaBiblica: string; temaPregacao: string; prioridade: string;
}

export default function EditarLiturgiaPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [musicas, setMusicas] = useState<any[]>([]);

  const [organizacaoId, setOrganizacaoId] = useState('');
  const [data, setData] = useState('');
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFimPrevisto, setHorarioFimPrevisto] = useState('');
  const [tipoCulto, setTipoCulto] = useState('Celebracao');
  const [tema, setTema] = useState('');
  const [dirigente, setDirigente] = useState('');
  const [pregador, setPregador] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [congregacao, setCongregacao] = useState('');
  const [itens, setItens] = useState<MomentoForm[]>([]);

  useEffect(() => {
    fetch(`/api/liturgia/${id}`).then(r => r.json()).then(d => {
      if (d.liturgia) {
        const l = d.liturgia;
        setOrganizacaoId(l.organizacaoId);
        setData(l.data.split('T')[0]);
        setHorarioInicio(l.horarioInicio);
        setHorarioFimPrevisto(l.horarioFimPrevisto || '');
        setTipoCulto(l.tipoCulto);
        setTema(l.tema || '');
        setDirigente(l.dirigente || '');
        setPregador(l.pregador || '');
        setResponsavel(l.responsavel || '');
        setObservacoes(l.observacoes || '');
        setCongregacao(l.congregacao || '');
        setItens(l.itens.map((i: any) => ({
          tipo: i.tipo, titulo: i.titulo, horarioPrevisto: i.horarioPrevisto || '',
          duracaoPrevista: i.duracaoPrevista ? String(i.duracaoPrevista) : '',
          responsavel: i.responsavel || '', descricao: i.descricao || '',
          observacoes: i.observacoes || '', musicaId: i.musicaId || '',
          referenciaBiblica: i.referenciaBiblica || '', temaPregacao: i.temaPregacao || '',
          prioridade: i.prioridade || 'NORMAL',
        })));
        fetch(`/api/liturgia/musicas?organizacaoId=${l.organizacaoId}`).then(r => r.json()).then(d => setMusicas(d.musicas || []));
      }
      setLoading(false);
    });
  }, [id]);

  const addMomento = (afterIndex?: number) => {
    const novo: MomentoForm = { tipo: 'LOUVOR', titulo: '', horarioPrevisto: '', duracaoPrevista: '', responsavel: '', descricao: '', observacoes: '', musicaId: '', referenciaBiblica: '', temaPregacao: '', prioridade: 'NORMAL' };
    setItens(prev => { const next = [...prev]; const idx = afterIndex !== undefined ? afterIndex + 1 : next.length; next.splice(idx, 0, novo); return next; });
  };

  const updateMomento = (index: number, field: keyof MomentoForm, value: string) => {
    setItens(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeMomento = (index: number) => setItens(prev => prev.filter((_, i) => i !== index));

  const moveMomento = (index: number, direction: -1 | 1) => {
    setItens(prev => { const next = [...prev]; const newIndex = index + direction; if (newIndex < 0 || newIndex >= next.length) return prev; [next[index], next[newIndex]] = [next[newIndex], next[index]]; return next; });
  };

  const handleSave = async () => {
    if (!organizacaoId || !data || !horarioInicio) { alert('Preencha os campos obrigatorios'); return; }
    setSaving(true);
    try {
      const payload = {
        organizacaoId, data, horarioInicio, horarioFimPrevisto, tipoCulto,
        tema, dirigente, pregador, responsavel, observacoes, congregacao,
        itens: itens.map((item, idx) => ({
          ...item, ordem: idx + 1,
          duracaoPrevista: item.duracaoPrevista ? parseInt(item.duracaoPrevista) : null,
          musicaId: item.musicaId || null,
        })),
      };
      const res = await fetch(`/api/liturgia/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (res.ok) { const data = await res.json(); router.push(`/admin/liturgia/${data.liturgia.id}`); }
      else { const err = await res.json(); alert(err.error || 'Erro ao salvar'); }
    } catch { alert('Erro ao salvar liturgia'); } finally { setSaving(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando...</div>;

  return (
    <div>
      <SectionHead icon={<BookOpen size={24} />} title="Editar Liturgia">
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Voltar
        </button>
      </SectionHead>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Dados da Liturgia</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Igreja *</label>
            <input type="text" value={organizacaoId} disabled style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.85rem', opacity: 0.7 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Congregacao</label>
            <input type="text" value={congregacao} onChange={e => setCongregacao(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Tipo de Culto</label>
            <select value={tipoCulto} onChange={e => setTipoCulto(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
              {TIPOS_CULTO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Data *</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Horario Inicio *</label>
            <input type="time" value={horarioInicio} onChange={e => setHorarioInicio(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Horario Fim</label>
            <input type="time" value={horarioFimPrevisto} onChange={e => setHorarioFimPrevisto(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Tema</label>
            <input type="text" value={tema} onChange={e => setTema(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Dirigente</label>
            <input type="text" value={dirigente} onChange={e => setDirigente(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Pregador</label>
            <input type="text" value={pregador} onChange={e => setPregador(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Responsavel</label>
            <input type="text" value={responsavel} onChange={e => setResponsavel(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Observacoes</label>
          <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={2} style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem', resize: 'vertical' }} />
        </div>
      </div>

      {/* Momentos */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: 'var(--text-primary)' }}>Momentos ({itens.length})</h3>
          <button onClick={() => addMomento()} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'var(--gradient-gold-soft)', border: '1px solid var(--color-secondary)', borderRadius: 'var(--radius-sm)', color: 'var(--color-secondary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
            <Plus size={14} /> Adicionar Momento
          </button>
        </div>

        <div className={styles.timeline}>
          {itens.map((item, idx) => (
            <div key={idx} className={styles.momentoForm}>
              <div className={styles.momentoFormHeader}>
                <div className={styles.momentoFormDrag}><GripVertical size={16} /></div>
                <div className={styles.momentoFormOrder}>{idx + 1}</div>
                <div className={styles.momentoFormTitle}>Momento {idx + 1}</div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button onClick={() => moveMomento(idx, -1)} disabled={idx === 0} style={{ background: 'none', border: 'none', color: idx === 0 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: idx === 0 ? 'not-allowed' : 'pointer', padding: '0.25rem', opacity: idx === 0 ? 0.3 : 1 }}>&#9650;</button>
                  <button onClick={() => moveMomento(idx, 1)} disabled={idx === itens.length - 1} style={{ background: 'none', border: 'none', color: idx === itens.length - 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: idx === itens.length - 1 ? 'not-allowed' : 'pointer', padding: '0.25rem', opacity: idx === itens.length - 1 ? 0.3 : 1 }}>&#9660;</button>
                </div>
                <button onClick={() => addMomento(idx)} style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', cursor: 'pointer', padding: '0.25rem' }}><Plus size={16} /></button>
                <button onClick={() => removeMomento(idx)} className={styles.momentoFormRemove}><Trash2 size={16} /></button>
              </div>
              <div className={styles.momentoFormFields}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Tipo *</label>
                  <select value={item.tipo} onChange={e => updateMomento(idx, 'tipo', e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                    {MOMENTO_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Titulo *</label>
                  <input type="text" value={item.titulo} onChange={e => updateMomento(idx, 'titulo', e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Horario</label>
                  <input type="time" value={item.horarioPrevisto} onChange={e => updateMomento(idx, 'horarioPrevisto', e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Duracao (min)</label>
                  <input type="number" value={item.duracaoPrevista} onChange={e => updateMomento(idx, 'duracaoPrevista', e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Responsavel</label>
                  <input type="text" value={item.responsavel} onChange={e => updateMomento(idx, 'responsavel', e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Prioridade</label>
                  <select value={item.prioridade} onChange={e => updateMomento(idx, 'prioridade', e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                    <option value="NORMAL">Normal</option><option value="BAIXA">Baixa</option><option value="ALTA">Alta</option><option value="URGENTE">Urgente</option>
                  </select>
                </div>
                {(item.tipo === 'MENSAGEM' || item.tipo === 'RESPOSTA') && (
                  <div className={styles.fullWidth}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Tema da Pregacao</label>
                    <input type="text" value={item.temaPregacao} onChange={e => updateMomento(idx, 'temaPregacao', e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                  </div>
                )}
                {item.tipo === 'LOUVOR' && (
                  <div className={styles.fullWidth}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Musica</label>
                    <select value={item.musicaId} onChange={e => updateMomento(idx, 'musicaId', e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                      <option value="">Selecionar...</option>
                      {musicas.map(m => <option key={m.id} value={m.id}>{m.titulo}</option>)}
                    </select>
                  </div>
                )}
                <div className={styles.fullWidth}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Descricao</label>
                  <textarea value={item.descricao} onChange={e => updateMomento(idx, 'descricao', e.target.value)} rows={2} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem', resize: 'vertical' }} />
                </div>
                <div className={styles.fullWidth}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Observacoes</label>
                  <input type="text" value={item.observacoes} onChange={e => updateMomento(idx, 'observacoes', e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '2rem' }}>
        <button onClick={() => router.back()} style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}>Cancelar</button>
        <button onClick={handleSave} disabled={saving} style={{ padding: '0.75rem 2rem', background: saving ? 'var(--text-muted)' : 'var(--gradient-gold)', color: '#000', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Alteracoes'}
        </button>
      </div>
    </div>
  );
}