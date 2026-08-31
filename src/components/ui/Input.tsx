import React from 'react';
import styles from './form.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  error?: string;
}

export default function Input({ label, required, error, className, ...props }: InputProps) {
  const inputClass = [styles.input, error ? styles.inputError : '', className].filter(Boolean).join(' ');

  if (!label) {
    return <input className={inputClass} {...props} />;
  }

  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>
        {label}
        {required && <span className={styles.fieldRequired}>*</span>}
      </label>
      <input className={inputClass} required={required} {...props} />
      {error && <span style={{ color: '#e74c3c', fontSize: '0.75rem' }}>{error}</span>}
    </div>
  );
}
