import Link from 'next/link';
import { MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import { navigation, churchData } from '@/data/site-data';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              IADMP
            </Link>
            <p>{churchData.description}</p>
          </div>

          <div>
            <h4>Links</h4>
            <div className="footer-links">
              {navigation.map((item) => (
                <Link key={item.path} href={item.path}>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4>Congregacoes</h4>
            <div className="footer-links">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cohabiano</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Vila Sarney</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Novo Renascer</span>
            </div>
          </div>

          <div>
            <h4>Contato</h4>
            <div className="footer-contact-item">
              <MapPin size={16} />
              <span>{churchData.address}</span>
            </div>
            <div className="footer-contact-item">
              <Phone size={16} />
              <span>{churchData.phone}</span>
            </div>
            <div className="footer-contact-item">
              <Mail size={16} />
              <span>{churchData.email}</span>
            </div>
            <div className="footer-contact-item">
              <MessageCircle size={16} />
              <a href={churchData.whatsapp} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)' }}>
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
