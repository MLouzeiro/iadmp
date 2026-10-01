'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, UserCheck, Calendar, DollarSign, BookOpen, Bell, Images, Lightbulb, Settings, LogOut, Palette, ChevronDown, Shield, Music, LayoutTemplate, Radio, Mic } from 'lucide-react';
import { useState } from 'react';

const sidebarLinks = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Membros', path: '/admin/membros', icon: Users },
  { name: 'Lideranca', path: '/admin/lideranca', icon: UserCheck },
  { name: 'Eventos', path: '/admin/eventos', icon: Calendar },
  { name: 'Financeiro', path: '/admin/financeiro', icon: DollarSign },
  { name: 'Avisos', path: '/admin/avisos', icon: Bell },
  { name: 'Galeria', path: '/admin/galeria', icon: Images },
  { name: 'Oportunidades', path: '/admin/oportunidades', icon: Lightbulb },
  { name: 'Usuarios', path: '/admin/usuarios', icon: Shield },
];

const liturgiaSubLinks = [
  { name: 'Programacoes', path: '/admin/liturgia', icon: BookOpen },
  { name: 'Musicas', path: '/admin/liturgia/musicas', icon: Music },
  { name: 'Modelos', path: '/admin/liturgia/modelos', icon: LayoutTemplate },
];

const configSubLinks = [
  { name: 'Geral', path: '/admin/configuracoes', icon: Settings },
  { name: 'Aparencia', path: '/admin/configuracoes/aparencia', icon: Palette },
];

const comunicacaoSubLinks = [
  { name: 'Dashboard', path: '/admin/comunicacao', icon: LayoutDashboard },
  { name: 'Canais', path: '/admin/comunicacao/canais', icon: Radio },
  { name: 'Pregacoes', path: '/admin/comunicacao/pregacoes', icon: Mic },
  { name: 'Versiculos', path: '/admin/comunicacao/versiculos', icon: BookOpen },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [configOpen, setConfigOpen] = useState(pathname.startsWith('/admin/configuracoes'));
  const [liturgiaOpen, setLiturgiaOpen] = useState(pathname.startsWith('/admin/liturgia'));
  const [comunicacaoOpen, setComunicacaoOpen] = useState(pathname.startsWith('/admin/comunicacao'));

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const isConfigActive = pathname.startsWith('/admin/configuracoes');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', paddingTop: 'var(--header-height)' }}>
      <aside style={{
        width: '250px',
        background: 'var(--bg-nav)',
        borderRight: '1px solid var(--border-color)',
        padding: '2rem 0',
        position: 'fixed',
        top: 'var(--header-height)',
        left: 0,
        bottom: 0,
        overflowY: 'auto',
      }}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0 1rem' }}>
          {sidebarLinks.map(({ name, path, icon: Icon }) => {
            const isActive = pathname === path;
            return (
              <Link
                key={path}
                href={path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  color: isActive ? 'var(--color-secondary)' : 'var(--text-primary)',
                  background: isActive ? 'var(--bg-card)' : 'transparent',
                  textDecoration: 'none',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'var(--transition)',
                }}
              >
                <Icon size={20} />
                {name}
              </Link>
            );
          })}

          {/* Liturgia com sub-menu */}
          <button
            onClick={() => setLiturgiaOpen(!liturgiaOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              color: pathname.startsWith('/admin/liturgia') ? 'var(--color-secondary)' : 'var(--text-primary)',
              background: pathname.startsWith('/admin/liturgia') ? 'var(--bg-card)' : 'transparent',
              fontWeight: pathname.startsWith('/admin/liturgia') ? 600 : 400,
              transition: 'var(--transition)',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              fontSize: 'inherit',
              fontFamily: 'inherit',
            }}
          >
            <BookOpen size={20} />
            Liturgia
            <ChevronDown size={16} style={{ marginLeft: 'auto', transform: liturgiaOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'var(--transition)' }} />
          </button>

          {liturgiaOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '1rem' }}>
              {liturgiaSubLinks.map(({ name, path, icon: Icon }) => {
                const isActive = pathname === path || (path === '/admin/liturgia' && pathname === '/admin/liturgia');
                return (
                  <Link
                    key={path}
                    href={path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.6rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                      background: isActive ? 'var(--gradient-gold-soft)' : 'transparent',
                      textDecoration: 'none',
                      fontWeight: isActive ? 600 : 400,
                      transition: 'var(--transition)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <Icon size={16} />
                    {name}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Configuracoes com sub-menu */}
          <button
            onClick={() => setConfigOpen(!configOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              color: isConfigActive ? 'var(--color-secondary)' : 'var(--text-primary)',
              background: isConfigActive ? 'var(--bg-card)' : 'transparent',
              fontWeight: isConfigActive ? 600 : 400,
              transition: 'var(--transition)',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              fontSize: 'inherit',
              fontFamily: 'inherit',
            }}
          >
            <Settings size={20} />
            Configuracoes
            <ChevronDown size={16} style={{ marginLeft: 'auto', transform: configOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'var(--transition)' }} />
          </button>

          {configOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '1rem' }}>
              {configSubLinks.map(({ name, path, icon: Icon }) => {
                const isActive = pathname === path;
                return (
                  <Link
                    key={path}
                    href={path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.6rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                      background: isActive ? 'var(--gradient-gold-soft)' : 'transparent',
                      textDecoration: 'none',
                      fontWeight: isActive ? 600 : 400,
                      transition: 'var(--transition)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <Icon size={16} />
                    {name}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Comunicacao com sub-menu */}
          <button
            onClick={() => setComunicacaoOpen(!comunicacaoOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              color: pathname.startsWith('/admin/comunicacao') ? 'var(--color-secondary)' : 'var(--text-primary)',
              background: pathname.startsWith('/admin/comunicacao') ? 'var(--bg-card)' : 'transparent',
              fontWeight: pathname.startsWith('/admin/comunicacao') ? 600 : 400,
              transition: 'var(--transition)',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              fontSize: 'inherit',
              fontFamily: 'inherit',
            }}
          >
            <Radio size={20} />
            Comunicacao
            <ChevronDown size={16} style={{ marginLeft: 'auto', transform: comunicacaoOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'var(--transition)' }} />
          </button>

          {comunicacaoOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '1rem' }}>
              {comunicacaoSubLinks.map(({ name, path, icon: Icon }) => {
                const isActive = pathname === path || (path !== '/admin/comunicacao' && pathname.startsWith(path));
                return (
                  <Link
                    key={path}
                    href={path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.6rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                      background: isActive ? 'var(--gradient-gold-soft)' : 'transparent',
                      textDecoration: 'none',
                      fontWeight: isActive ? 600 : 400,
                      transition: 'var(--transition)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <Icon size={16} />
                    {name}
                  </Link>
                );
              })}
            </div>
          )}

          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              marginTop: '2rem',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '2rem',
            }}
          >
            <LogOut size={20} />
            Voltar ao site
          </Link>
        </nav>
      </aside>
      <main style={{ flex: 1, marginLeft: '250px', padding: '2rem' }}>
        {children}
      </main>
    </div>
  );
}
