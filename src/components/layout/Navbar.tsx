'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { navigation } from '@/data/site-data';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem('iadmp-theme') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('iadmp-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <>
      <nav className="navbar">
        <div className="container">
          <Link href="/" className="navbar-logo">
            <img src="/images/logo.png" alt="IADMP" />
            IADMP
          </Link>

          <div className="navbar-links">
            {navigation.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={pathname === item.path ? 'active' : ''}
              >
                {item.name}
              </Link>
            ))}
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Alternar tema">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          <button
            className="navbar-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        {navigation.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            onClick={() => setMobileOpen(false)}
            className={pathname === item.path ? 'active' : ''}
          >
            {item.name}
          </Link>
        ))}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          style={{ alignSelf: 'flex-start', marginTop: '1rem' }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </>
  );
}
