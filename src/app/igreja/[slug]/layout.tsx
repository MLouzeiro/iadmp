'use client';

import { useEffect, useState } from 'react';
import { ReactNode } from 'react';
import Link from 'next/link';
import { Menu, X, Church, Home, Calendar, Users, BookOpen, Images, Mail, Radio } from 'lucide-react';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import styles from './igreja-layout.module.css';

interface IgrejaLayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

export default function IgrejaLayout({ children, params }: IgrejaLayoutProps) {
  const [slug, setSlug] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  return (
    <ThemeProvider>
      <div className={styles.wrapper}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <Link href={`/igreja/${slug}`} className={styles.logo} aria-label="Início">
              <Church size={24} style={{ color: 'var(--color-primary)' }} />
            </Link>

            <nav className={`${styles.nav} ${mobileMenuOpen ? styles.navOpen : ''}`}>
              <Link href={`/igreja/${slug}`} className={styles.navItem} onClick={() => setMobileMenuOpen(false)}>
                <Home size={18} /> Início
              </Link>
              <Link href={`/igreja/${slug}/eventos`} className={styles.navItem} onClick={() => setMobileMenuOpen(false)}>
                <Calendar size={18} /> Eventos
              </Link>
              <Link href={`/igreja/${slug}/lideranca`} className={styles.navItem} onClick={() => setMobileMenuOpen(false)}>
                <Users size={18} /> Liderança
              </Link>
              <Link href={`/igreja/${slug}/pregacoes`} className={styles.navItem} onClick={() => setMobileMenuOpen(false)}>
                <BookOpen size={18} /> Pregações
              </Link>
              <Link href={`/igreja/${slug}/galeria`} className={styles.navItem} onClick={() => setMobileMenuOpen(false)}>
                <Images size={18} /> Galeria
              </Link>
              <Link href={`/igreja/${slug}/contato`} className={styles.navItem} onClick={() => setMobileMenuOpen(false)}>
                <Mail size={18} /> Contato
              </Link>
            </nav>

            <button
              type="button"
              className={styles.mobileToggle}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>

        <main className={styles.main}>{children}</main>

        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} Igreja. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}