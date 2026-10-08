import React from 'react';
import styles from './form.module.css';
import Avatar from './Avatar';
import Badge, { BadgeVariant } from './Badge';

interface ListItemProps {
  name: string;
  meta?: React.ReactNode;
  badge?: { label: string; variant?: BadgeVariant };
  extraBadges?: { label: string; variant?: BadgeVariant }[];
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export default function ListItem({ name, meta, badge, extraBadges, actions, icon, onClick }: ListItemProps) {
  return (
    <div className={`${styles.listItem} ${onClick ? styles.listItemClickable : ''}`} onClick={onClick}>
      <div className={styles.listItemAvatar}>
        <Avatar name={name} icon={icon} />
        <div className={styles.listItemInfo}>
          <h4>{name}</h4>
          {meta && <p>{meta}</p>}
        </div>
      </div>
      <div className={styles.listItemActions}>
        {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
        {(extraBadges || []).map((b, i) => (
          <Badge key={i} variant={b.variant}>{b.label}</Badge>
        ))}
        {actions}
      </div>
    </div>
  );
}
