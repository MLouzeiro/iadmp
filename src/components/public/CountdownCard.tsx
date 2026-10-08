'use client';

import { useMemo } from 'react';
import { CalendarDays, DoorOpen, DoorClosed, CheckCircle2, Hourglass } from 'lucide-react';
import { diasAte, formatarContagem } from '@/lib/datas';
import styles from './CountdownCard.module.css';

export interface CountdownCardProps {
  dataEvento: string;
  inscricoesAbremEm?: string | null;
  inscricoesFechamEm?: string | null;
  aceitaInscricoes?: boolean;
}

function Chip({
  icon,
  label,
  tone = 'neutral',
}: {
  icon: React.ReactNode;
  label: string;
  tone?: 'neutral' | 'accent' | 'success' | 'danger' | 'warning';
}) {
  return (
    <span className={`${styles.chip} ${styles[tone]}`}>
      <span className={styles.icon}>{icon}</span>
      {label}
    </span>
  );
}

/**
 * Contagens regressivas de um evento:
 * - Dias at\u00e9 o evento (dataEvento)
 * - Dias at\u00e9 a abertura das inscri\u00e7\u00f5es (inscricoesAbremEm)
 * - Dias at\u00e9 o fechamento das inscri\u00e7\u00f5es (inscricoesFechamEm)
 */
export default function CountdownCard({
  dataEvento,
  inscricoesAbremEm,
  inscricoesFechamEm,
  aceitaInscricoes = false,
}: CountdownCardProps) {
  const chips = useMemo(() => {
    const out: { key: string; icon: React.ReactNode; label: string; tone: 'neutral' | 'accent' | 'success' | 'danger' | 'warning' }[] = [];

    const diasEvento = diasAte(dataEvento);
    if (diasEvento !== null) {
      out.push({
        key: 'evento',
        icon: <CalendarDays size={16} />,
        label: diasEvento > 0 ? `Faltam ${formatarContagem(diasEvento).replace('em ', '')} para o evento` : diasEvento === 0 ? 'Evento \u00e9 hoje' : 'Evento j\u00e1 aconteceu',
        tone: diasEvento > 0 ? 'accent' : diasEvento === 0 ? 'success' : 'neutral',
      });
    }

    if (aceitaInscricoes) {
      const diasAbre = diasAte(inscricoesAbremEm ?? null);
      const diasFecha = diasAte(inscricoesFechamEm ?? null);

      if (diasAbre !== null && diasAbre > 0) {
        out.push({
          key: 'abre',
          icon: <DoorOpen size={16} />,
          label: `Inscri\u00e7\u00f5es abrem ${formatarContagem(diasAbre)}`,
          tone: 'warning',
        });
      } else if (diasAbre !== null && diasAbre <= 0 && diasFecha !== null && diasFecha >= 0) {
        out.push({
          key: 'abertas',
          icon: <Hourglass size={16} />,
          label: diasFecha === 0 ? 'Inscri\u00e7\u00f5es encerram hoje' : `Inscri\u00e7\u00f5es encerram ${formatarContagem(diasFecha)}`,
          tone: 'success',
        });
      } else if (diasFecha !== null && diasFecha < 0) {
        out.push({
          key: 'fechadas',
          icon: <DoorClosed size={16} />,
          label: 'Inscri\u00e7\u00f5es encerradas',
          tone: 'danger',
        });
      }
    }

    return out;
  }, [dataEvento, inscricoesAbremEm, inscricoesFechamEm, aceitaInscricoes]);

  if (chips.length === 0) return null;

  return (
    <div className={styles.card} aria-label="Contagens regressivas do evento">
      {chips.map((c) => (
        <Chip key={c.key} icon={c.icon} label={c.label} tone={c.tone} />
      ))}
    </div>
  );
}

/**
 * Badge compacto para listas — mostra apenas o dado mais relevante.
 */
export function CountdownBadge({
  dataEvento,
  inscricoesAbremEm,
  inscricoesFechamEm,
  aceitaInscricoes = false,
}: CountdownCardProps) {
  const { label, tone } = useMemo(() => {
    const diasEvento = diasAte(dataEvento);
    const diasAbre = aceitaInscricoes ? diasAte(inscricoesAbremEm ?? null) : null;
    const diasFecha = aceitaInscricoes ? diasAte(inscricoesFechamEm ?? null) : null;

    if (aceitaInscricoes && diasAbre !== null && diasAbre > 0) {
      return { label: `Inscri\u00e7\u00f5es ${formatarContagem(diasAbre)}`, tone: 'warning' as const };
    }
    if (aceitaInscricoes && diasFecha !== null && diasFecha >= 0) {
      return { label: diasFecha === 0 ? 'Inscri\u00e7\u00f5es encerram hoje' : `Inscri\u00e7\u00f5es at\u00e9 ${formatarContagem(diasFecha)}`, tone: 'success' as const };
    }
    if (aceitaInscricoes && diasFecha !== null && diasFecha < 0) {
      return { label: 'Inscri\u00e7\u00f5es encerradas', tone: 'danger' as const };
    }
    if (diasEvento !== null) {
      return {
        label: diasEvento > 0 ? `Faltam ${formatarContagem(diasEvento).replace('em ', '')}` : diasEvento === 0 ? 'Hoje' : 'Encerrado',
        tone: diasEvento > 0 ? ('accent' as const) : diasEvento === 0 ? ('success' as const) : ('neutral' as const),
      };
    }
    return { label: '', tone: 'neutral' as const };
  }, [dataEvento, inscricoesAbremEm, inscricoesFechamEm, aceitaInscricoes]);

  if (!label) return null;

  return (
    <span className={`${styles.chip} ${styles[tone]} ${styles.badge}`}>
      <CheckCircle2 size={12} />
      {label}
    </span>
  );
}
