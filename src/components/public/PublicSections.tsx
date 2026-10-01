'use client';

import { useChurchInfo } from './ChurchInfo';
import VerseOfTheDay from './VerseOfTheDay';
import PregacoesSection from './PregacoesSection';
import CanaisSection from './CanaisSection';
import EventosSection from './EventosSection';

export default function PublicSections() {
  const { organizacaoId } = useChurchInfo();

  if (!organizacaoId) return null;

  return (
    <>
      <VerseOfTheDay organizacaoId={organizacaoId} />
      <EventosSection organizacaoId={organizacaoId} />
      <PregacoesSection organizacaoId={organizacaoId} />
      <CanaisSection organizacaoId={organizacaoId} />
    </>
  );
}
