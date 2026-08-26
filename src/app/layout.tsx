import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: 'IADMP - Igreja Assembleia de Deus Ministerio da Promessa',
  description: 'Site oficial da Igreja Assembleia de Deus Ministerio da Promessa - IADMP',
  keywords: ['igreja', 'assembleia de deus', 'ministerio da promessa', 'IADMP', 'culto', 'worship'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" data-theme="dark" className={montserrat.variable}>
      <body className={montserrat.className}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
