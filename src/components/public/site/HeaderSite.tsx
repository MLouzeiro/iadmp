'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, MessageSquare, LogIn } from 'lucide-react';

interface HeaderSiteProps {
  slug: string;
  logoUrl?: string | null;
  nomeIgreja: string;
  basePath?: string;
}

const MENU = [
  { label: 'Início', hash: '' },
  { label: 'Sobre nós', hash: '#sobre' },
  { label: 'Eventos', hash: '#eventos' },
  { label: 'Avisos', hash: '#avisos' },
  { label: 'Ministérios', hash: '#ministerios' },
  { label: 'Programação', hash: '#programacao' },
  { label: 'Contato', hash: '#contato' },
];

export default function HeaderSite({ slug, logoUrl, nomeIgreja, basePath }: HeaderSiteProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const base = basePath ?? `/igreja/${slug}`;
  const isPortal = base === '';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  const homeHref = isPortal ? '/' : base;
  const contatoHref = isPortal ? '/contato' : `/igreja/${slug}/contato`;
  const isActive = pathname === homeHref;

  return (
    <>
      {mobileOpen && <div className="drawerBackdrop" onClick={() => setMobileOpen(false)} aria-hidden />}
      <header className={`header ${scrolled ? 'headerScrolled' : ''}`}>
        <div className="headerInner">
          <Link href={homeHref} className="logo" aria-label="Início">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl || '/images/logo-igreja.png'}
              alt={nomeIgreja}
              className="logoImg"
            />
            <div className="logoText">
              <h1>IADMP</h1>
            </div>
          </Link>

          <nav className={`nav ${mobileOpen ? 'navOpen' : ''}`} aria-label="Menu principal">
            {MENU.map((item) => {
              const href = item.hash ? `${base}${item.hash}` : homeHref;
              const active = item.hash === '' && isActive;
              return (
                <Link
                  key={item.label}
                  href={href}
                  className={`navItem ${active ? 'navItemActive' : ''}`}
                  onClick={closeMobile}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link href={contatoHref} className="ctaBtn" onClick={closeMobile}>
              <MessageSquare size={16} /> Fale conosco
            </Link>
            <Link href="/admin/login" className="navLogin" onClick={closeMobile}>
              <LogIn size={15} /> Entrar
            </Link>
          </nav>

          <button
            type="button"
            className="hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>
    </>
  );
}
