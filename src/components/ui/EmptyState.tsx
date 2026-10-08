import React from 'react';
import styles from './form.module.css';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title = 'Nada por aqui', message, action }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      {icon && <div className={styles.emptyIcon}>{icon}</div>}
      <h4 className={styles.emptyTitle}>{title}</h4>
      {message && <p className={styles.emptyMessage}>{message}</p>}
      {action && <div className={styles.emptyAction}>{action}</div>}
    </div>
  );
}
