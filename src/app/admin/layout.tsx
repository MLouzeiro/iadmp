'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, UserCheck, Calendar, DollarSign, BookOpen, Bell, Images,
  Lightbulb, Settings, LogOut, Palette, ChevronDown, Shield, Music, LayoutTemplate,
  Radio, Mic, BarChart3, Menu, X, ClipboardList,
} from 'lucide-react';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useToast } from '@/components/ui/Toast';
import styles from './admin.module.css';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  sub?: { name: string; path: string; icon: React.ElementType }[];
}

const grupos: { label: string; itens: NavItem[] }[] = [
  {
    label: 'Visão',
    itens: [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { name: 'Centro de Gestão', path: '/admin/gestao', icon: BarChart3 },
      { name: 'Auditoria', path: '/admin/gestao?aba=auditoria', icon: ClipboardList },
    ],
  },
  {
    label: 'Pessoas',
    itens: [
      { name: 'Membros', path: '/admin/membros', icon: Users },
      { name: 'Liderança', path: '/admin/lideranca', icon: UserCheck },
      { name: 'Usuários', path: '/admin/usuarios', icon: Shield },
    ],
  },
  {
    label: 'Operação',
    itens: [
      {
        name: 'Liturgia',
        path: '/admin/liturgia',
        icon: BookOpen,
        sub: [
          { name: 'Programações', path: '/admin/liturgia', icon: BookOpen },
          { name: 'Músicas', path: '/admin/liturgia/musicas', icon: Music },
          { name: 'Modelos', path: '/admin/liturgia/modelos', icon: LayoutTemplate },
        ],
      },
      { name: 'Eventos', path: '/admin/eventos', icon: Calendar },
      { name: 'Financeiro', path: '/admin/financeiro', icon: DollarSign },
      { name: 'Avisos', path: '/admin/avisos', icon: Bell },
      { name: 'Galeria', path: '/admin/galeria', icon: Images },
      { name: 'Oportunidades', path: '/admin/oportunidades', icon: Lightbulb },
    ],
  },
  {
    label: 'Comunicação',
    itens: [
      {
        name: 'Comunicação',
        path: '/admin/comunicacao',
        icon: Radio,
        sub: [
          { name: 'Dashboard', path: '/admin/comunicacao', icon: LayoutDashboard },
          { name: 'Canais', path: '/admin/comunicacao/canais', icon: Radio },
          { name: 'Pregações', path: '/admin/comunicacao/pregacoes', icon: Mic },
          { name: 'Versículos', path: '/admin/comunicacao/versiculos', icon: BookOpen },
        ],
      },
      {
        name: 'Configurações',
        path: '/admin/configuracoes',
        icon: Settings,
        sub: [
          { name: 'Geral', path: '/admin/configuracoes', icon: Settings },
          { name: 'Aparência', path: '/admin/configuracoes/aparencia', icon: Palette },
        ],
      },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { confirm } = useToast();
  const [openSub, setOpenSub] = useState<Record<string, boolean>>({
    '/admin/liturgia': pathname.startsWith('/admin/liturgia'),
    '/admin/comunicacao': pathname.startsWith('/admin/comunicacao'),
    '/admin/configuracoes': pathname.startsWith('/admin/configuracoes'),
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const isActive = (path: string) => {
    if (path === '/admin') return pathname === '/admin';
    return pathname === path || pathname.startsWith(path + '/');
  };

  const handleLogout = () => {
    confirm('Deseja encerrar a sessão e sair do painel?', () => {
      signOut({ callbackUrl: '/admin/login' });
    }, { title: 'Sair do painel' });
  };

  return (
    <div className={styles.adminWrap}>
      <div
        className={`${styles.overlay} ${mobileOpen ? styles.overlayShow : ''}`}
        onClick={() => setMobileOpen(false)}
      />
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
        <nav className={styles.nav}>
          {grupos.map((g) => (
            <div key={g.label}>
              <div className={styles.sideLabel}>{g.label}</div>
              {g.itens.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                if (item.sub) {
                  const open = !!openSub[item.path];
                  return (
                    <div key={item.path}>
                      <button
                        type="button"
                        className={`${styles.sideItem} ${active ? styles.sideItemActive : ''}`}
                        onClick={() => setOpenSub((p) => ({ ...p, [item.path]: !p[item.path] }))}
                      >
                        <Icon size={19} />
                        {item.name}
                        <ChevronDown size={15} className={`${styles.chev} ${open ? styles.chevOpen : ''}`} />
                      </button>
                      {open && (
                        <div className={styles.subList}>
                          {item.sub.map((s) => {
                            const SubIcon = s.icon;
                            const subActive = isActive(s.path);
                            return (
                              <Link
                                key={s.path}
                                href={s.path}
                                className={`${styles.subItem} ${subActive ? styles.subItemActive : ''}`}
                                onClick={() => setMobileOpen(false)}
                              >
                                <SubIcon size={15} />
                                {s.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`${styles.sideItem} ${active ? styles.sideItemActive : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon size={19} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          ))}

          <div className={styles.divider} />
          <Link href="/" className={styles.sideItem} onClick={() => setMobileOpen(false)}>
            <LogOut size={19} />
            Voltar ao site
          </Link>
          <button type="button" className={styles.logout} onClick={handleLogout}>
            <LogOut size={19} />
            Sair
          </button>
        </nav>
      </aside>
      <main className={styles.main}>{children}</main>
      <button
        type="button"
        className={styles.mobileToggle}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Menu do painel"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
    </div>
  );
}
