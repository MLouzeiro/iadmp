import React from 'react';
import styles from './form.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export default function Button({ variant = 'primary', size = 'md', icon, children, className, ...props }: ButtonProps) {
  const classes = [
    styles.btn,
    variant === 'primary' ? styles.btnPrimary : '',
    variant === 'secondary' ? styles.btnSecondary : '',
    variant === 'danger' ? styles.btnDanger : '',
    variant === 'ghost' ? styles.btnGhost : '',
    size === 'sm' ? styles.btnSm : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} {...props}>
      {icon}
      {children}
    </button>
  );
}
