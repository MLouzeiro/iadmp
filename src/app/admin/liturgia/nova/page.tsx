'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SectionHead from '@/components/ui/SectionHead';
import { BookOpen, Plus, Trash2, GripVertical, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import styles from '../liturgia.module.css';

const MOMENTO_TYPES = [
  { value: 'ABERTURA', label: 'Abertura' },
  { value: 'LOUVOR', label: 'Louvor' },
  { value: 'ORACAO', label: 'Oração' },
  { value: 'DIZIMOS', label: 'Dízimos e Ofertas' },
  { value: 'ALAS', label: 'Momento das Alas' },
  { value: 'DINAMICA', label: 'Dinamica' },
  { value: 'MENSAGEM', label: 'Mensagem/Pregação' },
  { value: 'RESPOSTA', label: 'Momento de Resposta' },
  { value: 'COMUNICADOS', label: 'Comunicados' },
  { value: 'BENCAO', label: 'Bênção Final' },
  { value: 'MUSICA_ESPECIAL', label: 'Música Especial' },
  { value: 'TESTEMUNHO', label: 'Testemunho' },
  { value: 'CEIA', label: 'Ceia do Senhor' },
  { value: 'BAPTISMO', label: 'Batismo' },
  { value: 'OUTRO', label: 'Outro' },
];

const TIPOS_CULTO = ['Celebração', 'Encontro', 'Reunião de Oração', 'Vigília', 'Batismo', 'Ceia', 'Especial'];

interface Organizacao {
  id: string;
  nome: string;
}

interface Musica {
  id: string;
  titulo: string;
  compositor?: string;
  artista?: string;
  tom?: string;
  categoria: string;
  letra?: string;
}

interface Modelo {
  id: string;
  nome: string;
  descricao?: string;
  tipoCulto?: string;
  momentos: any[];
}

interface MomentoForm {
  tipo: string;
  titulo: string;
  horarioPrevisto: string;
  duracaoPrevista: string;
  responsavel: string;
  descricao: string;
  observacoes: string;
  musicaId: string;
  referenciaBiblica: string;
  temaPregacao: string;
  prioridade: string;
}

export default function NovaLiturgiaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [organizacoes, setOrganizacoes] = useState<Organizacao[]>([]);
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);

  const [organizacaoId, setOrganizacaoId] = useState('');
  const [data, setData] = useState('');
  const [horarioInicio, setHorarioInicio] = useState('19:00');
  const [horarioFimPrevisto, setHorarioFimPrevisto] = useState('21:00');
  const [tipoCulto, setTipoCulto] = useState('Celebração');
  const [tema, setTema] = useState('');
  const [dirigente, setDirigente] = useState('');
  const [pregador, setPregador] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [congregacao, setCongregacao] = useState('');
  const [itens, setItens] = useState<MomentoForm[]>([]);

  useEffect(() => {
    fetch('/api/organizacoes').then(r => r.json()).then(d => {
      const list = Array.isArray(d) ? d : d?.organizacoes || [];
      setOrganizacoes(list);
      if (list.length === 1) setOrganizacaoId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!organizacaoId) return;
    fetch(`/api/liturgia/musicas?organizacaoId=${organizacaoId}`).then(r => r.json()).then(d => setMusicas(d.musicas || []));
    fetch(`/api/liturgia/modelos?organizacaoId=${organizacaoId}`).then(r => r.json()).then(d => setModelos(d.modelos || []));
  }, [organizacaoId]);

  const addMomento = (afterIndex?: number) => {
    const novo: MomentoForm = {
      tipo: 'LOUVOR', titulo: '', horarioPrevisto: '', duracaoPrevista: '',
      responsavel: '', descricao: '', observacoes: '', musicaId: '',
      referenciaBiblica: '', temaPregacao: '', prioridade: 'NORMAL',
    };
    setItens(prev => {
      const next = [...prev];
      const idx = afterIndex !== undefined ? afterIndex + 1 : next.length;
      next.splice(idx, 0, novo);
      return next;
    });
  };

  const updateMomento = (index: number, field: keyof MomentoForm, value: string) => {
    setItens(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeMomento = (index: number) => {
    setItens(prev => prev.filter((_, i) => i !== index));
  };

  const moveMomento = (index: number, direction: -1 | 1) => {
    setItens(prev => {
      const next = [...prev];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= next.length) return prev;
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  };

  const applyModelo = (modelo: Modelo) => {
    setTipoCulto(modelo.tipoCulto || 'Celebração');
    const newItens: MomentoForm[] = modelo.momentos.map(m => ({
      tipo: m.tipo,
      titulo: m.titulo,
      horarioPrevisto: '',
      duracaoPrevista: String(m.duracaoPrevista || ''),
      responsavel: '',
      descricao: m.descricao || '',
      observacoes: '',
      musicaId: '',
      referenciaBiblica: m.referenciaBiblica || '',
      temaPregacao: '',
      prioridade: 'NORMAL',
    }));
    setItens(newItens);
  };

  const handleSave = async () => {
    if (!organizacaoId || !data || !horarioInicio) {
      toast('Preencha organização, data e horário de início', 'warn');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        organizacaoId, data, horarioInicio, horarioFimPrevisto, tipoCulto,
        tema, dirigente, pregador, responsavel, observacoes, congregacao,
        itens: itens.map((item, idx) => ({
          ...item,
          ordem: idx + 1,
          duracaoPrevista: item.duracaoPrevista ? parseInt(item.duracaoPrevista) : null,
          musicaId: item.musicaId || null,
        })),
      };

      const res = await fetch('/api/liturgia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        toast('Liturgia criada.', 'ok');
        router.push(`/admin/liturgia/${data.liturgia.id}`);
      } else {
        const err = await res.json().catch(() => ({}));
        toast(err.error || 'Erro ao salvar', 'err');
      }
    } catch (err) {
      toast('Erro ao salvar liturgia', 'err');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SectionHead icon={<BookOpen size={24} />} title="Nova Liturgia">
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Voltar
        </button>
      </SectionHead>

      {/* Dados Gerais */}
      <div className={styles.formCard} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Dados da Liturgia</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Igreja *</label>
            <select value={organizacaoId} onChange={e => setOrganizacaoId(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
              <option value="">Selecione...</option>
              {organizacoes.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Congregação</label>
            <input type="text" value={congregacao} onChange={e => setCongregacao(e.target.value)} placeholder="Ex: Matriz, Vila Sarney..." style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
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
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Horário Início *</label>
            <input type="time" value={horarioInicio} onChange={e => setHorarioInicio(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Horário Fim Previsto</label>
            <input type="time" value={horarioFimPrevisto} onChange={e => setHorarioFimPrevisto(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Tema</label>
            <input type="text" value={tema} onChange={e => setTema(e.target.value)} placeholder="Tema do culto" style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Dirigente</label>
            <input type="text" value={dirigente} onChange={e => setDirigente(e.target.value)} placeholder="Nome do dirigente" style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Pregador</label>
            <input type="text" value={pregador} onChange={e => setPregador(e.target.value)} placeholder="Nome do pregador" style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Responsável</label>
            <input type="text" value={responsavel} onChange={e => setResponsavel(e.target.value)} placeholder="Responsável geral" style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Observações</label>
          <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={2} style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem', resize: 'vertical' }} />
        </div>
      </div>

      {/* Modelos */}
      {modelos.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Aplicar Modelo</label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {modelos.map(m => (
              <button key={m.id} onClick={() => applyModelo(m)} style={{ padding: '0.6rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem', transition: 'var(--transition)' }}>
                {m.nome}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Momentos */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: 'var(--text-primary)' }}>Momentos da Liturgia</h3>
          <button onClick={() => addMomento()} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'var(--gradient-gold-soft)', border: '1px solid var(--color-secondary)', borderRadius: 'var(--radius-sm)', color: 'var(--color-secondary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
            <Plus size={14} /> Adicionar Momento
          </button>
        </div>

        {itens.length === 0 ? (
          <div className={styles.emptyState} style={{ padding: '2rem' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Nenhum momento adicionado</p>
            <button onClick={() => addMomento()} style={{ padding: '0.6rem 1.25rem', background: 'var(--gradient-gold)', color: '#000', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={14} /> Adicionar Primeiro Momento
            </button>
          </div>
        ) : (
          <div className={styles.timeline}>
            {itens.map((item, idx) => (
              <div key={idx} className={styles.momentoForm}>
                <div className={styles.momentoFormHeader}>
                  <div className={styles.momentoFormDrag}>
                    <GripVertical size={16} />
                  </div>
                  <div className={styles.momentoFormOrder}>{idx + 1}</div>
                  <div className={styles.momentoFormTitle}>Momento {idx + 1}</div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => moveMomento(idx, -1)} disabled={idx === 0} style={{ background: 'none', border: 'none', color: idx === 0 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: idx === 0 ? 'not-allowed' : 'pointer', padding: '0.25rem', opacity: idx === 0 ? 0.3 : 1 }}>&#9650;</button>
                    <button onClick={() => moveMomento(idx, 1)} disabled={idx === itens.length - 1} style={{ background: 'none', border: 'none', color: idx === itens.length - 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: idx === itens.length - 1 ? 'not-allowed' : 'pointer', padding: '0.25rem', opacity: idx === itens.length - 1 ? 0.3 : 1 }}>&#9660;</button>
                  </div>
                  <button onClick={() => addMomento(idx)} title="Adicionar após" style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', cursor: 'pointer', padding: '0.25rem' }}><Plus size={16} /></button>
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
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Título *</label>
                    <input type="text" value={item.titulo} onChange={e => updateMomento(idx, 'titulo', e.target.value)} placeholder="Ex: Louvor, Pregação..." style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Horário Previsto</label>
                    <input type="time" value={item.horarioPrevisto} onChange={e => updateMomento(idx, 'horarioPrevisto', e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Duração (min)</label>
                    <input type="number" value={item.duracaoPrevista} onChange={e => updateMomento(idx, 'duracaoPrevista', e.target.value)} placeholder="Minutos" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Responsável</label>
                    <input type="text" value={item.responsavel} onChange={e => updateMomento(idx, 'responsavel', e.target.value)} placeholder="Nome" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Prioridade</label>
                    <select value={item.prioridade} onChange={e => updateMomento(idx, 'prioridade', e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                      <option value="NORMAL">Normal</option>
                      <option value="BAIXA">Baixa</option>
                      <option value="ALTA">Alta</option>
                      <option value="URGENTE">Urgente</option>
                    </select>
                  </div>
                  {(item.tipo === 'MENSAGEM' || item.tipo === 'RESPOSTA') && (
                    <div className={styles.fullWidth}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Tema da Pregação</label>
                      <input type="text" value={item.temaPregacao} onChange={e => updateMomento(idx, 'temaPregacao', e.target.value)} placeholder="Tema da mensagem" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                    </div>
                  )}
                  {item.tipo === 'LOUVOR' && (
                    <div className={styles.fullWidth}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Música (opcional)</label>
                      <select value={item.musicaId} onChange={e => updateMomento(idx, 'musicaId', e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                        <option value="">Selecionar música...</option>
                        {musicas.map(m => <option key={m.id} value={m.id}>{m.titulo} - {m.compositor || m.artista || ''}</option>)}
                      </select>
                    </div>
                  )}
                  <div className={styles.fullWidth}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Descrição</label>
                    <textarea value={item.descricao} onChange={e => updateMomento(idx, 'descricao', e.target.value)} rows={2} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem', resize: 'vertical' }} />
                  </div>
                  <div className={styles.fullWidth}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Observações</label>
                    <input type="text" value={item.observacoes} onChange={e => updateMomento(idx, 'observacoes', e.target.value)} placeholder="Anotacoes internas" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '2rem' }}>
        <button onClick={() => router.back()} style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}>Cancelar</button>
        <button onClick={handleSave} disabled={saving} style={{ padding: '0.75rem 2rem', background: saving ? 'var(--text-muted)' : 'var(--gradient-gold)', color: '#000', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}>
          {saving ? 'Salvando...' : 'Salvar Liturgia'}
        </button>
      </div>
    </div>
  );
}