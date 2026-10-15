'use client';

import { usePathname } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppFab from '@/components/public/WhatsAppFab';
import '@/components/public/site/novosite.css';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  const isAdmin = pathname.startsWith('/admin');
  const isIgreja = pathname.startsWith('/igreja');
  // Portal (/) também usa o novo layout — Navbar/Footer antigos escondidos lá.
  const isPortal = pathname === '/';

  return (
    <SessionProvider>
      <ThemeProvider>
        <ToastProvider>
          {!isAdmin && !isIgreja && !isPortal && <Navbar />}
          <main suppressHydrationWarning>{children}</main>
          {!isAdmin && !isIgreja && !isPortal && <Footer />}
          <WhatsAppFab />
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
