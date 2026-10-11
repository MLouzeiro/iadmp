'use client';

import { Suspense } from 'react';
import RelatoriosClient from './RelatoriosClient';
import PageHead from '@/components/ui/PageHead';

export default function RelatoriosPage() {
  return (
    <>
      <PageHead
        title="Relatórios e Exportação"
        subtitle="Visualize, filtre e exporte relatórios de liderança, eventos e auditoria"
      />
      <Suspense fallback={<div className="loading">Carregando relatórios...</div>}>
        <RelatoriosClient />
      </Suspense>
    </>
  );
}