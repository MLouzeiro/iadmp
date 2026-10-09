import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import ClientLayout from '@/components/theme/ClientLayout';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: 'IADMP - Igreja Assembleia de Deus Missão da Promessa',
  description: 'Site oficial da Igreja Assembleia de Deus Missão da Promessa - IADMP. Uma comunidade de fé, amor e esperança.',
  keywords: ['igreja', 'assembleia de deus', 'ministério da promessa', 'IADMP', 'culto', 'worship', 'fé', 'comunhão'],
  openGraph: {
    title: 'IADMP - Igreja Assembleia de Deus Missão da Promessa',
    description: 'Site oficial da Igreja Assembleia de Deus Missão da Promessa',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" data-theme="dark" className={montserrat.variable}>
      <body className={montserrat.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
