'use client';

import Link from 'next/link';
import { MapPin, Phone } from 'lucide-react';

interface TopBarSiteProps {
  endereco?: string | null;
  telefone?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  youtube?: string | null;
  nomeOrg: string;
}

export default function TopBarSite({ endereco, telefone, instagram, facebook, youtube, nomeOrg }: TopBarSiteProps) {
  return (
    <div className="topbar">
      <div className="topbarInner">
        <div className="topbarLeft">
          {endereco && (
            <span className="topbarItem">
              <MapPin size={14} /> {endereco}
            </span>
          )}
          {telefone && (
            <a href={`tel:${telefone.replace(/[^+\d]/g, '')}`} className="topbarItem">
              <Phone size={14} /> {telefone}
            </a>
          )}
        </div>
        <div className="topbarLeft topbarSocial">
          {instagram && (
            <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
          )}
          {facebook && (
            <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
            </a>
          )}
          {youtube && (
            <a href={youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
            </a>
          )}
        </div>
        <div className="topbarRight">
          <strong>{nomeOrg}</strong>
          <Link href="/">
            Voltar para o site geral
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
