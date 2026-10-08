'use client';

import React from 'react';
import styles from './lightbox.module.css';

interface LightboxProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children?: React.ReactNode;
}

export default function Lightbox({ open, title, onClose, children }: LightboxProps) {
  if (!open) return null;
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar">✕</button>
      <div className={styles.frame} onClick={(e) => e.stopPropagation()}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
