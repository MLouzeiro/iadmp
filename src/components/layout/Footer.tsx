'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import { navigation, churchData, socialLinks } from '@/data/site-data';

interface FooterInfo {
  rodapeDescricao?: string | null;
  rodapeEndereco?: string | null;
  rodapeTelefone?: string | null;
  rodapeEmail?: string | null;
  rodapeWhatsapp?: string | null;
  rodapeYoutube?: string | null;
  rodapeInstagram?: string | null;
  rodapeFacebook?: string | null;
}

function preencher(valor: string | null | undefined, padrao: string): string {
  const v = (valor || '').trim();
  return v || padrao;
}

export default function Footer() {
  const [info, setInfo] = useState<FooterInfo | null>(null);

  useEffect(() => {
    fetch('/api/public/footer-info')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setInfo(d && typeof d === 'object' ? d : null))
      .catch(() => setInfo(null));
  }, []);

  const descricao = preencher(info?.rodapeDescricao, churchData.description);
  const endereco = preencher(info?.rodapeEndereco, churchData.address);
  const telefone = preencher(info?.rodapeTelefone, churchData.phone);
  const email = preencher(info?.rodapeEmail, churchData.email);
  const whatsapp = preencher(info?.rodapeWhatsapp, churchData.whatsapp);

  const links: { name: string; url: string; icon: string }[] = [
    {
      name: 'YouTube',
      icon: 'youtube',
      url: preencher(info?.rodapeYoutube, socialLinks.find((l) => l.icon === 'youtube')?.url || ''),
    },
    {
      name: 'Instagram',
      icon: 'instagram',
      url: preencher(info?.rodapeInstagram, socialLinks.find((l) => l.icon === 'instagram')?.url || ''),
    },
    ...(info?.rodapeFacebook?.trim()
      ? [{ name: 'Facebook', icon: 'facebook', url: info.rodapeFacebook.trim() }]
      : []),
  ].filter((l) => l.url);

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {churchData.name}
            </Link>
            <p>{descricao}</p>
            <div className="footer-social">
              {links.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.name}
                >
                  {link.icon === 'youtube' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  )}
                  {link.icon === 'instagram' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                    </svg>
                  )}
                  {link.icon === 'facebook' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  )}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4>Links Rapidos</h4>
            <div className="footer-links">
              {navigation.map((item) => (
                <Link key={item.path} href={item.path}>
                  {item.name}
                </Link>
              ))}
              <Link href="/galeria">Galeria</Link>
              <Link href="/lideranca">Liderança</Link>
            </div>
          </div>

          <div>
            <h4>Congregações</h4>
            <div className="footer-links">
              {['Cohabiano', 'Vila Sarney', 'Novo Renascer'].map((name) => (
                <span key={name} style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {name}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4>Contato</h4>
            <div className="footer-contact-item">
              <MapPin size={16} />
              <span>{endereco}</span>
            </div>
            <div className="footer-contact-item">
              <Phone size={16} />
              <span>{telefone}</span>
            </div>
            <div className="footer-contact-item">
              <Mail size={16} />
              <span>{email}</span>
            </div>
            <div className="footer-contact-item">
              <MessageCircle size={16} />
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)' }}>
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} {churchData.fullName}. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
