import type { Metadata } from 'next';
import PregacaoDetail from '@/components/public/PregacaoDetail';

export const metadata: Metadata = {
  title: 'Pregação - IADMP',
  description: 'Mensagem pregada na Igreja Assembleia de Deus Missão da Promessa.',
};

type Params = { params: Promise<{ slug: string }> };

export default async function PregacaoPage({ params }: Params) {
  const { slug } = await params;
  return <PregacaoDetail slug={slug} />;
}
