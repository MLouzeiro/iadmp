import React from 'react';
import styles from './form.module.css';

interface SectionHeadProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
  children?: React.ReactNode;
}

const SectionHead = ({ icon, title, subtitle, action, children }: SectionHeadProps) => {
  return (
    <div className={styles.sectionHead}>
      {icon && <div className={styles.sectionHeadIcon}>{icon}</div>}
      <div>
        <h2 className={styles.sectionHeadTitle}>{title}</h2>
        {subtitle && <p className={styles.sectionHeadSubtitle}>{subtitle}</p>}
      </div>
      {(action || children) && (
        <div className={styles.sectionHeadActions}>
          {action && (
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={action.onClick}>
              {action.label}
            </button>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

export default SectionHead;
