interface SectionHeadProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

const SectionHead = ({ icon, title, subtitle }: SectionHeadProps) => {
  return (
    <div className="section__head">
      <span>{icon}</span>
      <div>
        <h2>{title}</h2>
        {subtitle && <p className="section__subtitle">{subtitle}</p>}
      </div>
    </div>
  );
};

export default SectionHead;
