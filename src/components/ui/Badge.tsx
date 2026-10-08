import React from 'react';
import styles from './form.module.css';

export type BadgeVariant = 'ok' | 'warn' | 'err' | 'info' | 'mut' | 'gold';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClass: Record<BadgeVariant, string> = {
  ok: styles.badgeOk,
  warn: styles.badgeWarn,
  err: styles.badgeErr,
  info: styles.badgeInfo,
  mut: styles.badgeMut,
  gold: styles.badgeGold,
};

export default function Badge({ variant = 'mut', children, className }: BadgeProps) {
  return (
    <span className={[styles.badge, variantClass[variant], className].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}

export function statusBadgeVariant(status: string): BadgeVariant {
  const s = (status || '').toUpperCase();
  if (['ATIVO', 'ATIVA', 'PUBLICADA', 'CONCLUIDO', 'CONCLUÍDO', 'REALIZADA', 'PRONTA', 'APROVADO', 'PAGO', 'OK', 'SIM'].includes(s)) return 'ok';
  if (['INATIVO', 'INATIVA', 'CANCELADO', 'CANCELADA', 'REJEITADO', 'EXPIRADO', 'NÃO', 'NAO', 'ENCERRADA'].includes(s)) return 'err';
  if (['PLANEJADO', 'EM_ANDAMENTO', 'EM PREPARACAO', 'EM_PREPARACAO', 'PENDENTE', 'ALTA', 'URGENTE', 'RASCUNHO'].includes(s)) return 'warn';
  if (['TRANSFERIDO', 'FALECIDO', 'AGUARDANDO', 'ARQUIVADA'].includes(s)) return 'mut';
  return 'info';
}
