'use client';

import React from 'react';
import styles from './tabs.module.css';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function Tabs({ items, active, onChange, className }: TabsProps) {
  return (
    <div className={[styles.tabs, className].filter(Boolean).join(' ')}>
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`${styles.tab} ${t.id === active ? styles.on : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.icon}
          <span>{t.label}</span>
          {typeof t.count === 'number' && <span className={styles.count}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
