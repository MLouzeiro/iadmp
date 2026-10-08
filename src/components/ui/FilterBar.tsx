'use client';

import React from 'react';
import styles from './form.module.css';

interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export default function FilterBar({ children, className }: FilterBarProps) {
  return <div className={[styles.filterBar, className].filter(Boolean).join(' ')}>{children}</div>;
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  minWidth?: number;
}

export function FilterSelect({ label, value, onChange, options, minWidth }: FilterSelectProps) {
  return (
    <div className={styles.filterField} style={minWidth ? { minWidth: `${minWidth}px` } : undefined}>
      <label className={styles.fieldLabel}>{label}</label>
      <select className={styles.select} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function FilterMeta({ children }: { children: React.ReactNode }) {
  return <div className={styles.filterMeta}>{children}</div>;
}
