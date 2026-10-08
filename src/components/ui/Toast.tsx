'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import styles from './toast.module.css';

export type ToastType = 'ok' | 'err' | 'warn' | 'info';

interface ToastItem {
  id: number;
  msg: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (msg: string, type?: ToastType) => void;
  confirm: (msg: string, onConfirm: () => void, opts?: { title?: string; danger?: boolean }) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {}, confirm: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let seq = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [dialog, setDialog] = useState<{ msg: string; title?: string; danger?: boolean; onConfirm: () => void } | null>(null);

  const toast = useCallback((msg: string, type: ToastType = 'ok') => {
    const id = ++seq;
    setItems((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3600);
  }, []);

  const confirm = useCallback((msg: string, onConfirm: () => void, opts?: { title?: string; danger?: boolean }) => {
    setDialog({ msg, onConfirm, title: opts?.title, danger: opts?.danger });
  }, []);

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}
      <div className={styles.wrap}>
        {items.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
            <span className={styles.dot} />
            <span>{t.msg}</span>
            <button type="button" className={styles.close} onClick={() => setItems((p) => p.filter((x) => x.id !== t.id))}>✕</button>
          </div>
        ))}
      </div>
      {dialog && (
        <div className={styles.backdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) setDialog(null); }}>
          <div className={styles.dialog}>
            <h3 className={styles.dialogTitle}>{dialog.title || 'Confirmar ação'}</h3>
            <p className={styles.dialogMsg}>{dialog.msg}</p>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogCancel} onClick={() => setDialog(null)}>Cancelar</button>
              <button
                type="button"
                className={dialog.danger ? styles.dialogDanger : styles.dialogOk}
                onClick={() => { setDialog(null); dialog.onConfirm(); }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
