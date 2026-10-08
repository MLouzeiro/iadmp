'use client';

import { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function ContatoForm() {
  const { toast } = useToast();
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', assunto: '', mensagem: '' });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.email.trim() || !form.mensagem.trim()) {
      toast('Preencha nome, e-mail e mensagem.', 'warn');
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch('/api/public/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setEnviado(true);
        toast('Mensagem enviada! Em breve entraremos em contato.', 'ok');
        setForm({ nome: '', email: '', telefone: '', assunto: '', mensagem: '' });
      } else {
        const d = await res.json().catch(() => ({}));
        toast(d.error || 'Não foi possível enviar a mensagem.', 'err');
      }
    } catch {
      toast('Erro de conexão. Tente novamente.', 'err');
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div className="contact-form-wrap">
        <div className="contact-success">
          <CheckCircle size={42} />
          <h3>Mensagem enviada!</h3>
          <p>Obrigado por entrar em contato. Retornaremos em breve.</p>
          <button type="button" className="btn btn-outline" onClick={() => setEnviado(false)}>
            Enviar outra mensagem
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="contact-form-wrap" onSubmit={onSubmit}>
      <div className="contact-form-grid">
        <div className="contact-field">
          <label htmlFor="c-nome">Nome completo *</label>
          <input id="c-nome" value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Seu nome" required />
        </div>
        <div className="contact-field">
          <label htmlFor="c-email">E-mail *</label>
          <input id="c-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="você@email.com" required />
        </div>
        <div className="contact-field">
          <label htmlFor="c-tel">Telefone</label>
          <input id="c-tel" value={form.telefone} onChange={(e) => set('telefone', e.target.value)} placeholder="(98) 99999-9999" />
        </div>
        <div className="contact-field">
          <label htmlFor="c-assunto">Assunto</label>
          <input id="c-assunto" value={form.assunto} onChange={(e) => set('assunto', e.target.value)} placeholder="Assunto da mensagem" />
        </div>
        <div className="contact-field contact-full">
          <label htmlFor="c-msg">Mensagem *</label>
          <textarea id="c-msg" value={form.mensagem} onChange={(e) => set('mensagem', e.target.value)} placeholder="Escreva sua mensagem..." rows={5} required />
        </div>
      </div>
      <button type="submit" className="btn btn-primary" disabled={enviando}>
        <Send size={16} />
        {enviando ? 'Enviando...' : 'Enviar mensagem'}
      </button>
    </form>
  );
}
