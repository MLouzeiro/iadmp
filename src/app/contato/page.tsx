import type { Metadata } from 'next';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import SectionHead from '@/components/ui/SectionHead';

export const metadata: Metadata = {
  title: 'Contato - IADMP',
  description: 'Entre em contato com a Igreja Assembleia de Deus Ministerio da Promessa',
};

const contactOptions = [
  { icon: <Mail size={32} />, title: 'Email', info: 'contato@iadmp.com.br', link: 'mailto:contato@iadmp.com.br' },
  { icon: <MessageCircle size={32} />, title: 'Facebook Messenger', info: 'Envie uma mensagem', link: 'https://m.me/ernest_achiever' },
  { icon: <Phone size={32} />, title: 'WhatsApp', info: '+55 98 98803-5646', link: 'https://wa.me/+5598988035646' },
];

export default function ContatoPage() {
  return (
    <>
      <section className="header">
        <div className="header__container">
          <div className="header__content">
            <h2>Contato</h2>
            <p>Estamos aqui para atender voce</p>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <SectionHead icon={<Mail size={24} />} title="Fale Conosco" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginTop: '4rem' }}>
            {contactOptions.map((option, index) => (
              <a
                key={index}
                href={option.link}
                target={option.link.startsWith('http') ? '_blank' : undefined}
                rel={option.link.startsWith('http') ? 'noreferrer noopener' : undefined}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '2.5rem 2rem', textAlign: 'center', transition: 'var(--transition)' }}>
                  <div style={{ fontSize: '2rem', color: 'var(--color-secondary)', marginBottom: '1rem' }}>{option.icon}</div>
                  <h3>{option.title}</h3>
                  <p style={{ color: 'var(--text-muted)' }}>{option.info}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
