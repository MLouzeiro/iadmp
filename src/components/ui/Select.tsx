import React from 'react';
import styles from './form.module.css';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  required?: boolean;
  options: { value: string; label: string }[];
}

export default function Select({ label, required, options, className, ...props }: SelectProps) {
  const selectClass = [styles.select, className].filter(Boolean).join(' ');

  if (!label) {
    return (
      <select className={selectClass} {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  }

  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>
        {label}
        {required && <span className={styles.fieldRequired}>*</span>}
      </label>
      <select className={selectClass} required={required} {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
