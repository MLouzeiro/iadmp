import type { Metadata } from 'next';
import { Mail, MessageCircle, Phone, MapPin } from 'lucide-react';
import { churchData } from '@/data/site-data';

export const metadata: Metadata = {
  title: 'Contato - IADMP',
  description: 'Entre em contato com a Igreja Assembleia de Deus Ministerio da Promessa.',
};

export default function ContatoPage() {
  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>Contato</h1>
          <p>Estamos aqui para atender voce.</p>
        </div>
      </div>

      <section>
        <div className="container">
          <div className="section-heading">
            <span className="label">Fale Conosco</span>
            <h2>Canais de Atendimento</h2>
            <p>Escolha o canal mais conveniente para entrar em contato.</p>
            <div className="divider" />
          </div>

          <div className="grid-2" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <a href={`mailto:${churchData.email}`} style={{ textDecoration: 'none' }}>
              <div className="contact-card">
                <div className="contact-icon">
                  <Mail size={24} />
                </div>
                <div className="contact-info">
                  <h3>Email</h3>
                  <p>{churchData.email}</p>
                </div>
              </div>
            </a>

            <a href={churchData.whatsapp} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div className="contact-card">
                <div className="contact-icon">
                  <Phone size={24} />
                </div>
                <div className="contact-info">
                  <h3>WhatsApp</h3>
                  <p>{churchData.phone}</p>
                </div>
              </div>
            </a>

            <a href={churchData.facebook} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div className="contact-card">
                <div className="contact-icon">
                  <MessageCircle size={24} />
                </div>
                <div className="contact-info">
                  <h3>Facebook Messenger</h3>
                  <p>Envie uma mensagem</p>
                </div>
              </div>
            </a>

            <div className="contact-card">
              <div className="contact-icon">
                <MapPin size={24} />
              </div>
              <div className="contact-info">
                <h3>Endereco</h3>
                <p>{churchData.address}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
