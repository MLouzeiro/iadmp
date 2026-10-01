interface SectionHeadProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
  children?: React.ReactNode;
}

const SectionHead = ({ icon, title, subtitle, action, children }: SectionHeadProps) => {
  return (
    <div className="section__head">
      <span>{icon}</span>
      <div>
        <h2>{title}</h2>
        {subtitle && <p className="section__subtitle">{subtitle}</p>}
      </div>
      {(action || children) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.25rem',
                background: 'var(--gradient-gold)',
                color: '#000',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
            >
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
