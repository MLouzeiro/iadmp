'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

const links = [
  { name: 'Inicio', path: '/' },
  { name: 'Sobre', path: '/sobre' },
  { name: 'Eventos', path: '/eventos' },
  { name: 'Lideranca', path: '/lideranca' },
  { name: 'Galeria', path: '/galeria' },
  { name: 'Contato', path: '/contato' },
];

const Navbar = () => {
  const [isNavShowing, setIsNavShowing] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setIsNavShowing(false); }, [pathname]);

  return (
    <nav className={scrolled ? 'scrolled' : ''}>
      <div className="container nav__container">
        <Link href="/" className="logo">
          <img src="/images/logo.png" alt="IADMP Logo" width={48} height={48} />
        </Link>
        <ul className={`nav__links ${isNavShowing ? 'show__nav' : 'hide__nav'}`}>
          {links.map(({ name, path }) => (
            <li key={path}>
              <Link href={path} className={pathname === path ? 'active-nav' : ''}>
                {name}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/admin" className={pathname.startsWith('/admin') ? 'active-nav' : ''}>
              Gestao
            </Link>
          </li>
        </ul>
        <div className="nav__actions">
          <button
            className="nav__toggle-btn"
            onClick={() => setIsNavShowing((prev) => !prev)}
          >
            {isNavShowing ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
