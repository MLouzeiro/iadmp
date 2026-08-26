'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, UserCheck, Calendar, DollarSign, BookOpen, Bell, Images, Lightbulb, Settings, LogOut, Palette, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const sidebarLinks = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Membros', path: '/admin/membros', icon: Users },
  { name: 'Lideranca', path: '/admin/lideranca', icon: UserCheck },
  { name: 'Eventos', path: '/admin/eventos', icon: Calendar },
  { name: 'Financeiro', path: '/admin/financeiro', icon: DollarSign },
  { name: 'Liturgia', path: '/admin/liturgia', icon: BookOpen },
  { name: 'Avisos', path: '/admin/avisos', icon: Bell },
  { name: 'Galeria', path: '/admin/galeria', icon: Images },
  { name: 'Oportunidades', path: '/admin/oportunidades', icon: Lightbulb },
];

const configSubLinks = [
  { name: 'Geral', path: '/admin/configuracoes', icon: Settings },
  { name: 'Aparencia', path: '/admin/configuracoes/aparencia', icon: Palette },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [configOpen, setConfigOpen] = useState(pathname.startsWith('/admin/configuracoes'));

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
