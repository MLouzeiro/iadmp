'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import SectionHead from '@/components/ui/SectionHead';
import { Mic, ArrowLeft } from 'lucide-react';
import styles from '../../pregacoes.module.css';
import formStyles from '@/components/ui/form.module.css';

interface Liturgia {
  id: string;
  tema?: string;
  data: string;
  horarioInicio: string;
  tipoCulto: string;
}

interface PregacaoData {
  id: string;
  titulo: string;
  descricao?: string;
  tema?: string;
  tipo: string;
  pregadorNome?: string;
  data: string;
  liturgiaId?: string;
  referenciaLivro?: string;
  referenciaCapitulo?: number;
  referenciaVersIni?: number;
  referenciaVersFim?: number;
  videoUrl?: string;
  capaUrl?: string;
  observacoes?: string;
  status: string;
}

const TIPOS_PREGACAO = ['Pregacao', 'Estudo biblico', 'Devocional', 'Palavra', 'Sermao', 'Palestra', 'Conferencia', 'Outro'];

export default function EditarPregacaoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liturgias, setLiturgias] = useState<Liturgia[]>([]);
  const [form, setForm] = useState({
    titulo: '', descricao: '', tema: '', tipo: 'Pregacao', pregadorNome: '',
    data: '', liturgiaId: '',
    referenciaLivro: '', referenciaCapitulo: '', referenciaVersIni: '', referenciaVersFim: '',
    videoUrl: '', capaUrl: '', observacoes: '', status: 'RASCUNHO',
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/comunicacao/pregacoes/${id}`).then(r => r.json()),
      fetch('/api/liturgia?limit=100').then(r => r.json()),
    ]).then(([pregData, litData]) => {
      const p: PregacaoData = pregData.pregacao;
      setForm({
        titulo: p.titulo, descricao: p.descricao || '', tema: p.tema || '', tipo: p.tipo,
        pregadorNome: p.pregadorNome || '', data: p.data.split('T')[0], liturgiaId: p.liturgiaId || '',
        referenciaLivro: p.referenciaLivro || '',
        referenciaCapitulo: p.referenciaCapitulo?.toString() || '',
        referenciaVersIni: p.referenciaVersIni?.toString() || '',
        referenciaVersFim: p.referenciaVersFim?.toString() || '',
        videoUrl: p.videoUrl || '', capaUrl: p.capaUrl || '',
        observacoes: p.observacoes || '', status: p.status,
      });
      setLiturgias(litData.liturgias || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...form,
        referenciaCapitulo: form.referenciaCapitulo ? parseInt(form.referenciaCapitulo) : null,
        referenciaVersIni: form.referenciaVersIni ? parseInt(form.referenciaVersIni) : null,
        referenciaVersFim: form.referenciaVersFim ? parseInt(form.referenciaVersFim) : null,
        liturgiaId: form.liturgiaId || null,
      };
      const res = await fetch(`/api/comunicacao/pregacoes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        router.push(`/admin/comunicacao/pregacoes/${id}`);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao salvar');
      }
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando...</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <Link href={`/admin/comunicacao/pregacoes/${id}`} className={styles.detailBack}>
        <ArrowLeft size={16} /> Voltar para detalhes
      </Link>
      <SectionHead icon={<Mic size={24} />} title="Editar Pregacao" />

      <div className={formStyles.formCard}>
        <form onSubmit={handleSubmit} className={formStyles.formGrid}>
          <div className={`${formStyles.field} ${formStyles.formGridFull}`}>
            <label className={formStyles.fieldLabel}>Titulo <span className={formStyles.fieldRequired}>*</span></label>
            <input className={formStyles.input} type="text" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required />
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.fieldLabel}>Data <span className={formStyles.fieldRequired}>*</span></label>
            <input className={formStyles.input} type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} required />
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.fieldLabel}>Tipo</label>
            <select className={formStyles.select} value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
              {TIPOS_PREGACAO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.fieldLabel}>Pregador</label>
            <input className={formStyles.input} type="text" value={form.pregadorNome} onChange={e => setForm({ ...form, pregadorNome: e.target.value })} />
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.fieldLabel}>Tema</label>
            <input className={formStyles.input} type="text" value={form.tema} onChange={e => setForm({ ...form, tema: e.target.value })} />
          </div>

          <div className={`${formStyles.field} ${formStyles.formGridFull}`}>
            <label className={formStyles.fieldLabel}>Culto Relacionado</label>
            <select className={formStyles.select} value={form.liturgiaId} onChange={e => setForm({ ...form, liturgiaId: e.target.value })}>
              <option value="">Nenhum culto selecionado</option>
              {liturgias.map(l => (
                <option key={l.id} value={l.id}>{l.tema || l.tipoCulto} — {new Date(l.data + 'T12:00:00').toLocaleDateString('pt-BR')} {l.horarioInicio}</option>
              ))}
            </select>
          </div>

          <div className={formStyles.sectionDivider}>
            <div className={formStyles.sectionDividerTitle}>Referencia Biblica</div>
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.fieldLabel}>Livro</label>
            <input className={formStyles.input} type="text" value={form.referenciaLivro} onChange={e => setForm({ ...form, referenciaLivro: e.target.value })} />
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.fieldLabel}>Capitulo</label>
            <input className={formStyles.input} type="number" value={form.referenciaCapitulo} onChange={e => setForm({ ...form, referenciaCapitulo: e.target.value })} />
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.fieldLabel}>Versiculo Inicial</label>
            <input className={formStyles.input} type="number" value={form.referenciaVersIni} onChange={e => setForm({ ...form, referenciaVersIni: e.target.value })} />
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.fieldLabel}>Versiculo Final</label>
            <input className={formStyles.input} type="number" value={form.referenciaVersFim} onChange={e => setForm({ ...form, referenciaVersFim: e.target.value })} />
          </div>

          <div className={formStyles.sectionDivider}>
            <div className={formStyles.sectionDividerTitle}>Midia</div>
          </div>

          <div className={`${formStyles.field} ${formStyles.formGridFull}`}>
            <label className={formStyles.fieldLabel}>URL do Video</label>
            <input className={formStyles.input} type="url" value={form.videoUrl} onChange={e => setForm({ ...form, videoUrl: e.target.value })} />
          </div>

          <div className={`${formStyles.field} ${formStyles.formGridFull}`}>
            <label className={formStyles.fieldLabel}>URL da Capa</label>
            <input className={formStyles.input} type="url" value={form.capaUrl} onChange={e => setForm({ ...form, capaUrl: e.target.value })} />
          </div>

          <div className={`${formStyles.field} ${formStyles.formGridFull}`}>
            <label className={formStyles.fieldLabel}>Descricao</label>
            <textarea className={formStyles.textarea} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={4} />
          </div>

          <div className={`${formStyles.field} ${formStyles.formGridFull}`}>
            <label className={formStyles.fieldLabel}>Observacoes</label>
            <textarea className={formStyles.textarea} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={2} />
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.fieldLabel}>Status</label>
            <select className={formStyles.select} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="RASCUNHO">Rascunho</option>
              <option value="PUBLICADA">Publicada</option>
              <option value="ARQUIVADA">Arquivada</option>
            </select>
          </div>

          <div className={`${formStyles.field} ${formStyles.formActionsFull}`}>
            <div className={formStyles.formActions}>
              <Link href={`/admin/comunicacao/pregacoes/${id}`} className={`${formStyles.btn} ${formStyles.btnSecondary}`}>Cancelar</Link>
              <button type="submit" className={`${formStyles.btn} ${formStyles.btnPrimary}`} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Alteracoes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
