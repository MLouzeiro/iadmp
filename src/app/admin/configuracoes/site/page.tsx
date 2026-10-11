import { Suspense } from 'react';
import SitePublicoClient from './SitePublicoClient';
import PageHead from '@/components/ui/PageHead';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Eye } from 'lucide-react';

interface SitePublicoPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ organizacaoId?: string }>;
}

export default async function SitePublicoPage({ params, searchParams }: SitePublicoPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const slug = resolvedParams.slug;
  const organizacaoId = resolvedSearchParams.organizacaoId || '';
  const urlPublica = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/igreja/${slug}`;

  return (
    <>
      <PageHead
        title="Editor do Site Público"
        subtitle={`Organização: ${slug}`}
        actions={
          <Link href={urlPublica} target="_blank"><Button variant="secondary" icon={<Eye size={16} />}>Visualizar</Button></Link>
        }
      />
      <Suspense fallback={<div className="loading">Carregando editor...</div>}>
        <SitePublicoClient slug={slug} organizacaoId={organizacaoId} urlPublica={urlPublica} />
      </Suspense>
    </>
  );
}