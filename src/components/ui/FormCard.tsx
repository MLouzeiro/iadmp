import React from 'react';
import styles from './form.module.css';

interface FormCardProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  children: React.ReactNode;
}

export default function FormCard({ title, subtitle, onClose, children }: FormCardProps) {
  return (
    <div className={styles.formCard}>
      <div className={styles.formHeader}>
        <div>
          <h3 className={styles.formHeaderTitle}>{title}</h3>
          {subtitle && <p className={styles.formHeaderSubtitle}>{subtitle}</p>}
        </div>
        {onClose && (
          <button type="button" className={styles.formClose} onClick={onClose}>
            ✕
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
