'use client';

import React from 'react';
import styles from './kpi.module.css';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  variation?: { direction: 'up' | 'down' | 'none'; text?: string };
  detail?: React.ReactNode;
  onClick?: () => void;
}

export function KpiCard({ label, value, icon, variation, detail, onClick }: KpiCardProps) {
  return (
    <div className={`${styles.kpi} ${onClick ? styles.clickable : ''}`} onClick={onClick}>
      {icon && <div className={styles.ico}>{icon}</div>}
      <div className={styles.content}>
        <div className={styles.label}>{label}</div>
        <div className={styles.value}>{value}</div>
        {variation && (
          <div className={`${styles.variation} ${styles[variation.direction]}`}>
            {variation.direction === 'up' ? '▲' : variation.direction === 'down' ? '▼' : '—'}
            <span>{variation.text}</span>
          </div>
        )}
        {detail}
      </div>
    </div>
  );
}

export function KpiGrid({ children }: { children: React.ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}

export function GroupTitle({ children }: { children: React.ReactNode }) {
  return <div className={styles.groupTitle}>{children}</div>;
}

export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>{children}</table>
    </div>
  );
}

export default KpiCard;
