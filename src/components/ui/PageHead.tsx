import React from 'react';
import styles from './form.module.css';

interface PageHeadProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function PageHead({ title, subtitle, actions }: PageHeadProps) {
  return (
    <div className={styles.pageHead}>
      <div>
        <h2 className={styles.pageHeadTitle}>{title}</h2>
        {subtitle && <p className={styles.pageHeadSub}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.pageHeadActions}>{actions}</div>}
    </div>
  );
}
