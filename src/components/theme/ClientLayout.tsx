'use client';

import { usePathname } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  return (
    <SessionProvider>
      <ThemeProvider>
        <ToastProvider>
          {!isLoginPage && <Navbar />}
          <main>{children}</main>
          {!isLoginPage && <Footer />}
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
