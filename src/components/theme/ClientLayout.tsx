'use client';

import { usePathname } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  return (
    <SessionProvider>
      <ThemeProvider>
        {!isLoginPage && <Navbar />}
        <main>{children}</main>
        {!isLoginPage && <Footer />}
      </ThemeProvider>
    </SessionProvider>
  );
}
