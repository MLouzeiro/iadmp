import { Suspense } from 'react';
import SitePublicoClient from './SitePublicoClient';

export default async function SitePublicoPage({
  searchParams,
}: {
  searchParams: Promise<{ organizacaoId?: string }>;
}) {
  const { organizacaoId = '' } = await searchParams;

  return (
    <Suspense fallback={<div>Carregando editor...</div>}>
      <SitePublicoClient slug="" organizacaoId={organizacaoId} urlPublica="" />
    </Suspense>
  );
}
