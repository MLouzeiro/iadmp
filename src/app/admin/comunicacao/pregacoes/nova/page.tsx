'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SectionHead from '@/components/ui/SectionHead';
import { Mic, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import styles from '../pregacoes.module.css';
import formStyles from '@/components/ui/form.module.css';

interface Liturgia {
  id: string;
  tema?: string;
  data: string;
  horarioInicio: string;
  tipoCulto: string;
  status: string;
}

const TIPOS_PREGACAO = ['Pregação', 'Estudo bíblico', 'Devocional', 'Palavra', 'Sermão', 'Palestra', 'Conferência', 'Outro'];

export default function NovaPregacaoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [liturgias, setLiturgias] = useState<Liturgia[]>([]);
  const [form, setForm] = useState({
    titulo: '', descricao: '', tema: '', tipo: 'Pregação', pregadorNome: '',
    data: new Date().toISOString().split('T')[0], liturgiaId: '',
    referenciaLivro: '', referenciaCapitulo: '', referenciaVersIni: '', referenciaVersFim: '',
    videoUrl: '', capaUrl: '', observacoes: '', status: 'RASCUNHO',
  });

  useEffect(() => {
    fetch('/api/liturgia?limit=100').then(r => r.json()).then(d => setLiturgias(d.liturgias || [])).catch(() => {});
  }, []);

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
      const res = await fetch('/api/comunicacao/pregacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        toast('Pregação criada.', 'ok');
        router.push(`/admin/comunicacao/pregacoes/${data.pregacao.id}`);
      } else {
        const data = await res.json().catch(() => ({}));
        toast(data.error || 'Erro ao criar prega��o', 'err');
      }
    } catch (err) {
      console.error('Erro:', err);
      toast('Erro ao criar prega��o', 'err');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <Link href="/admin/comunicacao/pregacoes" className={styles.detailBack}>
        <ArrowLeft size={16} /> Voltar para pregações
      </Link>
      <SectionHead icon={<Mic size={24} />} title="Nova Pregação" />

      <div className={formStyles.formCard}>
        <form onSubmit={handleSubmit} className={formStyles.formGrid}>
          <div className={`${formStyles.field} ${formStyles.formGridFull}`}>
            <label className={formStyles.fieldLabel}>Título <span className={formStyles.fieldRequired}>*</span></label>
            <input className={formStyles.input} type="text" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Título da pregação" required />
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
            <input className={formStyles.input} type="text" value={form.pregadorNome} onChange={e => setForm({ ...form, pregadorNome: e.target.value })} placeholder="Nome do pregador" />
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.fieldLabel}>Tema</label>
            <input className={formStyles.input} type="text" value={form.tema} onChange={e => setForm({ ...form, tema: e.target.value })} placeholder="Tema da pregação" />
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
            <div className={formStyles.sectionDividerTitle}>Referência Biblica</div>
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.fieldLabel}>Livro</label>
            <input className={formStyles.input} type="text" value={form.referenciaLivro} onChange={e => setForm({ ...form, referenciaLivro: e.target.value })} placeholder="Ex: João" />
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.fieldLabel}>Capitulo</label>
            <input className={formStyles.input} type="number" value={form.referenciaCapitulo} onChange={e => setForm({ ...form, referenciaCapitulo: e.target.value })} placeholder="3" />
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.fieldLabel}>Versículo Inicial</label>
            <input className={formStyles.input} type="number" value={form.referenciaVersIni} onChange={e => setForm({ ...form, referenciaVersIni: e.target.value })} placeholder="16" />
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.fieldLabel}>Versículo Final</label>
            <input className={formStyles.input} type="number" value={form.referenciaVersFim} onChange={e => setForm({ ...form, referenciaVersFim: e.target.value })} placeholder="18" />
          </div>

          <div className={formStyles.sectionDivider}>
            <div className={formStyles.sectionDividerTitle}>Midia</div>
          </div>

          <div className={`${formStyles.field} ${formStyles.formGridFull}`}>
            <label className={formStyles.fieldLabel}>URL do Video</label>
            <input className={formStyles.input} type="url" value={form.videoUrl} onChange={e => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
          </div>

          <div className={`${formStyles.field} ${formStyles.formGridFull}`}>
            <label className={formStyles.fieldLabel}>URL da Capa</label>
            <input className={formStyles.input} type="url" value={form.capaUrl} onChange={e => setForm({ ...form, capaUrl: e.target.value })} placeholder="https://..." />
          </div>

          <div className={`${formStyles.field} ${formStyles.formGridFull}`}>
            <label className={formStyles.fieldLabel}>Descrição</label>
            <textarea className={formStyles.textarea} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição da pregação" rows={4} />
          </div>

          <div className={`${formStyles.field} ${formStyles.formGridFull}`}>
            <label className={formStyles.fieldLabel}>Observações</label>
            <textarea className={formStyles.textarea} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} placeholder="Observações internas" rows={2} />
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.fieldLabel}>Status</label>
            <select className={formStyles.select} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="RASCUNHO">Rascunho</option>
              <option value="PUBLICADA">Publicada</option>
            </select>
          </div>

          <div className={`${formStyles.field} ${formStyles.formActionsFull}`}>
            <div className={formStyles.formActions}>
              <Link href="/admin/comunicacao/pregacoes" className={`${formStyles.btn} ${formStyles.btnSecondary}`}>Cancelar</Link>
              <button type="submit" className={`${formStyles.btn} ${formStyles.btnPrimary}`} disabled={saving}>
                {saving ? 'Salvando...' : 'Criar Pregação'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
