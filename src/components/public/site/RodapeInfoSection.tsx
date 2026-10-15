'use client';

import { MapPin, Clock, Phone, MessageSquare, Mail } from 'lucide-react';

function IconInstagram() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;
}
function IconFacebook() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>;
}
function IconYoutube() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>;
}

interface RodapeInfoSectionProps {
  nomeOrg: string;
  endereco?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  youtube?: string | null;
  horariosCulto?: { dia: string; horario: string }[];
}

const HORARIOS_PADRAO = [
  { dia: 'Quarta-feira', horario: '19h30 — Culto de Doutrina' },
  { dia: 'Sexta-feira', horario: '19h30 — Culto de Jejum e Oração' },
  { dia: 'Domingo', horario: '09h00 e 18h00 — Culto de Celebração' },
];

export default function RodapeInfoSection({
  nomeOrg,
  endereco,
  telefone,
  whatsapp,
  email,
  instagram,
  facebook,
  youtube,
  horariosCulto,
}: RodapeInfoSectionProps) {
  const horarios = horariosCulto && horariosCulto.length > 0 ? horariosCulto : HORARIOS_PADRAO;
  const wppHref = whatsapp
    ? `https://wa.me/${whatsapp.replace(/[^\d]/g, '')}`
    : telefone
      ? `https://wa.me/${telefone.replace(/[^\d]/g, '')}`
      : '#';

  return (
    <section className="rodapeInfo" id="contato" aria-label="Contato e localização">
      <div className="rodapeGrid">
        <div className="rodapeCol">
          <h3><MapPin size={20} /> Localização</h3>
          {endereco && (
            <div className="rodapeEndereco">
              <MapPin size={16} />
              <span>{endereco}</span>
            </div>
          )}
          <div className="mapaEmbed">
            <iframe
              title={`Mapa — ${nomeOrg}`}
              loading="lazy"
              src={`https://www.google.com/maps?q=${encodeURIComponent(endereco || nomeOrg)}&output=embed`}
            />
          </div>
          {endereco && (
            <a
              className="mapaBtn"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPin size={14} /> Ver no Google Maps
            </a>
          )}
        </div>

        <div className="rodapeCol">
          <h3><Clock size={20} /> Horários dos Cultos</h3>
          {horarios.map((h) => (
            <div key={h.dia + h.horario} className="horarioItem">
              <Clock size={16} />
              <div>
                <strong>{h.dia}</strong>
                <span>{h.horario}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="rodapeCol">
          <h3><Phone size={20} /> Contato</h3>
          {telefone && (
            <a href={`tel:${telefone.replace(/[^+\d]/g, '')}`} className="footerContatoItem">
              <Phone size={16} /> {telefone}
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="footerContatoItem">
              <Mail size={16} /> {email}
            </a>
          )}
          <div className="footerSocial">
            {instagram && (
              <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <IconInstagram />
              </a>
            )}
            {facebook && (
              <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <IconFacebook />
              </a>
            )}
            {youtube && (
              <a href={youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <IconYoutube />
              </a>
            )}
          </div>
          <a href={wppHref} target="_blank" rel="noopener noreferrer" className="wppBtn">
            <MessageSquare size={18} /> Fale conosco pelo WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
