import React from 'react';
import styles from './form.module.css';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export function iniciais(nome: string): string {
  const parts = (nome || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name, size = 'md', icon }: AvatarProps) {
  const sizeClass = size === 'sm' ? styles.avatarSm : size === 'lg' ? styles.avatarLg : '';
  return (
    <div className={[styles.avatar, sizeClass].filter(Boolean).join(' ')}>
      {icon ? icon : iniciais(name)}
    </div>
  );
}
