'use client';

import React, { useEffect } from 'react';
import styles from './modal.module.css';

export interface ModalField {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox' | 'time' | 'url' | 'tel';
  value?: string | number | boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  full?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  fields?: ModalField[];
  values?: Record<string, string | number | boolean>;
  onChange?: (name: string, value: string | number | boolean) => void;
  onClose: () => void;
  onSave?: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  danger?: boolean;
  children?: React.ReactNode;
}

export default function Modal({
  open,
  title,
  description,
  fields,
  values = {},
  onChange,
  onClose,
  onSave,
  saveLabel = 'Salvar',
  saveDisabled,
  danger,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>
        {description && <p className={styles.desc}>{description}</p>}
        <div className={styles.body}>
          {fields && fields.length > 0 && (
            <div className={styles.grid}>
              {fields.map((f) => {
                const val = values[f.name] ?? f.value ?? '';
                const set = (v: string | number | boolean) => onChange?.(f.name, v);
                const fieldClass = f.full ? `${styles.field} ${styles.fieldFull}` : styles.field;
                return (
                  <div key={f.name} className={fieldClass}>
                    <label className={styles.label}>
                      {f.label}
                      {f.required && <span className={styles.req}>*</span>}
                    </label>
                    {f.type === 'textarea' ? (
                      <textarea
                        className={styles.textarea}
                        value={String(val)}
                        placeholder={f.placeholder}
                        onChange={(e) => set(e.target.value)}
                      />
                    ) : f.type === 'select' ? (
                      <select className={styles.select} value={String(val)} onChange={(e) => set(e.target.value)}>
                        {(f.options || []).map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : f.type === 'checkbox' ? (
                      <label className={styles.check}>
                        <input
                          type="checkbox"
                          checked={Boolean(val)}
                          onChange={(e) => set(e.target.checked)}
                        />
                        <span>{f.placeholder || 'Ativo'}</span>
                      </label>
                    ) : (
                      <input
                        className={styles.input}
                        type={f.type || 'text'}
                        value={String(val)}
                        placeholder={f.placeholder}
                        min={f.min}
                        max={f.max}
                        step={f.step}
                        onChange={(e) => set(f.type === 'number' ? Number(e.target.value) : e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {children}
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.btnCancel} onClick={onClose}>Cancelar</button>
          {onSave && (
            <button
              type="button"
              className={danger ? styles.btnDanger : styles.btnSave}
              onClick={onSave}
              disabled={saveDisabled}
            >
              {saveLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
