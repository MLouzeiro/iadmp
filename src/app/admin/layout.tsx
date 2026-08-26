'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, UserCheck, Calendar, DollarSign, BookOpen, Bell, Images, Lightbulb, Settings, LogOut } from 'lucide-react';

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
  { name: 'Configuracoes', path: '/admin/configuracoes', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

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
