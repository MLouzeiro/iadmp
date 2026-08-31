import React from 'react';
import styles from './form.module.css';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  required?: boolean;
}

export default function Textarea({ label, required, className, ...props }: TextareaProps) {
  const textareaClass = [styles.textarea, className].filter(Boolean).join(' ');

  if (!label) {
    return <textarea className={textareaClass} {...props} />;
  }

  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>
        {label}
        {required && <span className={styles.fieldRequired}>*</span>}
      </label>
      <textarea className={textareaClass} required={required} {...props} />
    </div>
  );
}
