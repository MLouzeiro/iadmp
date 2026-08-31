import React from 'react';
import styles from './form.module.css';

interface FormGridProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
}

export default function FormGrid({ children, onSubmit }: FormGridProps) {
  if (onSubmit) {
    return (
      <form className={styles.formGrid} onSubmit={onSubmit}>
        {children}
      </form>
    );
  }
  return <div className={styles.formGrid}>{children}</div>;
}
