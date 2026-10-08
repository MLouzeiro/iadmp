import type { Metadata } from 'next';
import { Mail, MessageCircle, Phone, MapPin, Send } from 'lucide-react';
import { churchData } from '@/data/site-data';
import ContatoForm from '@/components/public/ContatoForm';

export const metadata: Metadata = {
  title: 'Contato - IADMP',
  description: 'Entre em contato com a Igreja Assembleia de Deus Ministério da Promessa.',
};

export default function ContatoPage() {
  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>Contato</h1>
          <p>Estamos aqui para atender você.</p>
        </div>
      </div>

      <section>
        <div className="container">
          <div className="grid-2" style={{ gap: '3rem', alignItems: 'start' }}>
            <div>
              <div className="section-heading" style={{ textAlign: 'left', marginBottom: '2rem' }}>
                <span className="label">Envie uma mensagem</span>
                <h2>Escreva para nós</h2>
                <p style={{ margin: '0' }}>Preencha o formulário e entraremos em contato o mais breve possível.</p>
              </div>
              <ContatoForm />
            </div>

            <div>
              <div className="section-heading" style={{ textAlign: 'left', marginBottom: '2rem' }}>
                <span className="label">Informações</span>
                <h2>Canais de Atendimento</h2>
                <p style={{ margin: '0' }}>Escolha o canal mais conveniente para entrar em contato.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                    <h3>Endereço</h3>
                    <p>{churchData.address}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
