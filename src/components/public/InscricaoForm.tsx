'use client';

import { useState } from 'react';
import { CheckCircle, Copy, QrCode, Loader2, AlertCircle } from 'lucide-react';

interface PixData {
  brCode: string;
  qrCodeSvg: string;
  valor: number;
}

interface InscricaoFormProps {
  eventoId: string;
  taxa: number;
  aceitaInscricoes: boolean;
  vagasRestantes: number | null;
}

export default function InscricaoForm({ eventoId, taxa, aceitaInscricoes, vagasRestantes }: InscricaoFormProps) {
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', observacoes: '' });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [pix, setPix] = useState<PixData | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const inscrever = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!form.nome.trim()) {
      setErro('Informe seu nome completo.');
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch(`/api/public/eventos/${eventoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || 'Não foi possível concluir a inscrição.');
        return;
      }
      if (data.pix) {
        setPix(data.pix);
      } else {
        setSucesso(true);
      }
    } catch {
      setErro('Erro de conexao. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const copiarPix = () => {
    if (!pix) return;
    navigator.clipboard.writeText(pix.brCode);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  if (sucesso) {
    return (
      <div className="contact-success">
        <CheckCircle size={42} />
        <h3>Inscrição realizada!</h3>
        <p>Sua inscrição foi registrada com sucesso. Nos vemos no evento!</p>
      </div>
    );
  }

  if (pix) {
    return (
      <div className="contact-form-wrap">
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 0.35rem', color: 'var(--text-primary)' }}>
            <QrCode size={20} style={{ verticalAlign: 'middle', marginRight: '0.45rem' }} />
            Pagamento via PIX
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Escaneie o QR Code ou use o código "copia e cola" para pagar a taxa de inscrição.
          </p>

          <div
            style={{
              background: '#fff',
              borderRadius: 'var(--radius-md)',
              padding: '1.15rem',
              display: 'inline-block',
              border: '1px solid var(--border-color)',
            }}
            dangerouslySetInnerHTML={{ __html: pix.qrCodeSvg }}
          />

          <div
            style={{
              marginTop: '1.15rem',
              padding: '0.85rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'monospace',
              fontSize: '0.755rem',
              wordBreak: 'break-all',
              color: 'var(--text-secondary)',
              maxHeight: '110px',
              overflow: 'auto',
            }}
          >
            {pix.brCode}
          </div>

          <button type="button" className="btn btn-primary" onClick={copiarPix} style={{ marginTop: '1.05rem' }}>
            <Copy size={16} />
            {copiado ? 'Codigo copiado!' : 'Copiar codigo PIX'}
          </button>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '1.15rem' }}>
            Valor: <strong style={{ color: 'var(--color-primary)' }}>
              R$ {pix.valor.toFixed(2).replace('.', ',')}
            </strong>
            {' '}· Apos o pagamento, sua inscricao sera confirmada pela equipe.
          </p>
        </div>
      </div>
    );
  }

  if (!aceitaInscricoes) {
    return (
      <div className="contact-form-wrap">
        <div className="contact-success">
          <AlertCircle size={38} />
          <h3>Inscrições encerradas</h3>
          <p>Este evento não está aceitando inscrições no momento.</p>
        </div>
      </div>
    );
  }

  if (vagasRestantes === 0) {
    return (
      <div className="contact-form-wrap">
        <div className="contact-success">
          <AlertCircle size={38} />
          <h3>Inscrições esgotadas</h3>
          <p>Todas as vagas para este evento já foram preenchidas.</p>
        </div>
      </div>
    );
  }

  return (
    <form className="contact-form-wrap" onSubmit={inscrever}>
      <h3 style={{ margin: '0 0 0.35rem', color: 'var(--text-primary)' }}>Inscreva-se neste evento</h3>
      {taxa > 0 && (
        <p style={{ color: 'var(--color-primary)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
          Taxa de inscrição: <strong>R$ {taxa.toFixed(2).replace('.', ',')}</strong> — pagamento via PIX.
        </p>
      )}
      {vagasRestantes != null && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          Restam <strong style={{ color: 'var(--text-primary)' }}>{vagasRestantes}</strong> vagas.
        </p>
      )}

      <div className="contact-form-grid">
        <div className="contact-field contact-full">
          <label htmlFor="i-nome">Nome completo *</label>
          <input id="i-nome" value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Seu nome" required />
        </div>
        <div className="contact-field">
          <label htmlFor="i-email">E-mail</label>
          <input id="i-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="você@email.com" />
        </div>
        <div className="contact-field">
          <label htmlFor="i-tel">Telefone / WhatsApp</label>
          <input id="i-tel" value={form.telefone} onChange={(e) => set('telefone', e.target.value)} placeholder="(98) 99999-9999" />
        </div>
        <div className="contact-field contact-full">
          <label htmlFor="i-obs">Observações</label>
          <textarea id="i-obs" value={form.observacoes} onChange={(e) => set('observacoes', e.target.value)} placeholder="Alguma informação adicional..." rows={3} />
        </div>
      </div>

      {erro && (
        <p style={{ color: '#ff8a80', fontSize: '0.855rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <AlertCircle size={15} /> {erro}
        </p>
      )}

      <button type="submit" className="btn btn-primary" disabled={enviando}>
        {enviando ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
        {enviando ? 'Enviando...' : 'Confirmar inscrição'}
      </button>
    </form>
  );
}
