interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card = ({ children, className = '' }: CardProps) => {
  return (
    <article className={`card ${className}`}>
      {children}
    </article>
  );
};

export default Card;
