'use client';

import React, { useState } from 'react';
import styles from './faq.module.css';

export interface FaqItem {
  q: string;
  a: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className={styles.list}>
      {items.map((f, i) => (
        <div key={i} className={`${styles.item} ${open === i ? styles.open : ''}`}>
          <button type="button" className={styles.q} onClick={() => setOpen(open === i ? null : i)}>
            <span>{f.q}</span>
            <span className={styles.chev}>▼</span>
          </button>
          <div className={styles.aWrap}>
            <p className={styles.a}>{f.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
